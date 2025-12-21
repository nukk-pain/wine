// pages/api/process-multiple.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { geminiService, loadImageBuffer, getMimeType } from '@/lib/gemini';
// import { processWineImage } from '@/lib/vision';  // DEPRECATED - Vision-Only 전환

interface ImageProcessRequest {
  id: string;
  url: string;
  type: 'wine_label' | 'receipt' | 'auto';
}

interface ImageProcessResult {
  id: string;
  success: boolean;
  type?: 'wine_label' | 'receipt';
  extractedData?: any;
  error?: string;
  processedAt?: string;
}

interface MultipleProcessResponse {
  success: boolean;
  totalImages: number;
  successCount: number;
  errorCount: number;
  results: ImageProcessResult[];
  error?: string;
  processedAt: string;
}

interface RequestBody {
  images: ImageProcessRequest[];
  useGemini?: string;
  skipNotion?: string;
  maxConcurrent?: number;
}

const MAX_CONCURRENT_PROCESSES = 3; // Limit concurrent API calls
const MAX_IMAGES_PER_REQUEST = 20; // Safety limit

// Validate image request object
function validateImageRequest(img: any): { valid: boolean; error?: string } {
  if (!img.id || typeof img.id !== 'string') {
    return { valid: false, error: 'Missing required field: id' };
  }

  if (!img.url || typeof img.url !== 'string') {
    return { valid: false, error: 'Missing required field: url' };
  }

  if (!img.type || !['wine_label', 'receipt', 'auto'].includes(img.type)) {
    return { valid: false, error: 'Missing required field: type' };
  }

  return { valid: true };
}

// Process single image
async function processSingleImage(
  imageRequest: ImageProcessRequest,
  useGemini: boolean
): Promise<ImageProcessResult> {
  const startTime = new Date().toISOString();

  try {
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔄 [MULTI-API] Processing image ${imageRequest.id}: ${imageRequest.url}`);
    }

    let imageBuffer: Buffer;
    let mimeType: string;

    // Handle different URL types based on environment
    if (imageRequest.url.startsWith('https://') || imageRequest.url.startsWith('http://')) {
      // Absolute URL (Vercel Blob or external) - fetch via HTTP
      const response = await fetch(imageRequest.url);
      if (!response.ok) {
        throw new Error(`Failed to fetch image from URL: ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      imageBuffer = Buffer.from(arrayBuffer);
      mimeType = response.headers.get('content-type') || 'image/jpeg';

    } else if (imageRequest.url.startsWith('/uploads/')) {
      // Local development - relative path, read directly from filesystem
      const fs = require('fs').promises;
      const path = require('path');

      const filePath = path.join(process.cwd(), 'public', imageRequest.url);

      try {
        imageBuffer = await fs.readFile(filePath);

        // Determine MIME type from file extension
        const ext = path.extname(imageRequest.url).toLowerCase();
        mimeType = ext === '.png' ? 'image/png' :
          ext === '.webp' ? 'image/webp' : 'image/jpeg';

      } catch (fsError) {
        throw new Error(`Failed to read local file: ${imageRequest.url}`);
      }

    } else {
      throw new Error(`Unsupported URL format: ${imageRequest.url}`);
    }

    let extractedData: any;
    let imageType = imageRequest.type as 'wine_label' | 'receipt' | 'auto';

    if (useGemini) {
      // Vision-Only: Gemini API 직접 호출
      console.log('🎯 [Vision-Only] Processing image...');

      // [CONFIRMED] 영수증은 더 이상 지원하지 않음
      if (imageRequest.type === 'receipt') {
        throw new Error('Receipt parsing is deprecated and not supported.');
      }

      // auto 타입은 wine_label로 처리
      if (imageType === 'auto') {
        imageType = 'wine_label';
      }

      const result = await geminiService.extractWineInfo(imageBuffer, mimeType);

      if (!result.ok) {
        console.warn(`⚠️ [Vision-Only] Validation warning for ${imageRequest.id}:`, result.reason);
      }

      // WineInfo → 필요한 형식으로 변환
      extractedData = {
        Name: result.data.Name,
        name: result.data.Name,
        Vintage: result.data.Vintage,
        vintage: result.data.Vintage,
        'Region/Producer': result.data['Region/Producer'],
        'Varietal(품종)': result.data['Varietal(품종)'] || [],
        Price: null,                                            // 사용자 입력
        price: null,
        Quantity: 1,                                             // [CONFIRMED] 기본값 1 고정
        quantity: 1,
        Store: '',                                               // 사용자 입력
        'Purchase date': new Date().toISOString().split('T')[0], // [CONFIRMED] 오늘 날짜 고정
        Status: 'In Stock',                                      // [CONFIRMED] 기본값 In Stock
        'Country(국가)': result.data.country,
        country: result.data.country,
        'Appellation(원산지명칭)': result.data.appellation,
        appellation: result.data.appellation,
        'Notes(메모)': result.data.notes,
        notes: result.data.notes,
        wine_type: result.data.wine_type,
        alcohol_content: result.data.alcohol_content,
        volume: result.data.volume,
        varietal_reasoning: result.data.varietal_reasoning,
      };

      console.log('✅ [Vision-Only] Extracted:', extractedData.Name);
    } else {
      // DEPRECATED: OCR 기반 처리 (롤백용으로 유지)
      console.warn('⚠️ [DEPRECATED] Using OCR-based processing. Consider switching to Vision-Only.');
      const { processWineImage } = await import('@/lib/vision');
      const visionResult = await processWineImage(imageRequest.url);
      extractedData = visionResult.data;
      imageType = visionResult.imageType as 'wine_label' | 'receipt';
    }

    console.log('Image processing completed:', {
      id: imageRequest.id,
      type: imageType,
      hasData: !!extractedData
    });

    return {
      id: imageRequest.id,
      success: true,
      type: imageType,
      extractedData,
      processedAt: startTime
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    console.error('Image processing error:', {
      id: imageRequest.id,
      url: imageRequest.url,
      error: errorMessage
    });

    return {
      id: imageRequest.id,
      success: false,
      error: errorMessage,
      processedAt: startTime
    };
  }
}

// Process images in batches with concurrency control
async function processImagesBatch(
  images: ImageProcessRequest[],
  useGemini: boolean,
  maxConcurrent: number = MAX_CONCURRENT_PROCESSES
): Promise<ImageProcessResult[]> {
  const results: ImageProcessResult[] = [];

  // Process in batches to avoid overwhelming the API
  for (let i = 0; i < images.length; i += maxConcurrent) {
    const batch = images.slice(i, i + maxConcurrent);

    if (process.env.NODE_ENV === 'development') {
      console.log(`🚀 [MULTI-API] Processing batch ${Math.floor(i / maxConcurrent) + 1}: ${batch.length} images`);
    }

    // Process batch concurrently
    const batchPromises = batch.map(img => processSingleImage(img, useGemini));
    const batchResults = await Promise.allSettled(batchPromises);

    // Extract results (Promise.allSettled ensures all complete)
    for (const result of batchResults) {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        // Handle rejected promises (shouldn't happen as we handle errors in processSingleImage)
        if (process.env.NODE_ENV === 'development') {
          console.error('🚨 [MULTI-API] Unexpected promise rejection in batch:', result.reason);
        }
        results.push({
          id: 'unknown',
          success: false,
          error: result.status === 'rejected' ? 'Promise rejected unexpectedly' : 'Unknown batch error',
          processedAt: new Date().toISOString()
        });
      }
    }
  }

  return results;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<MultipleProcessResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
      totalImages: 0,
      successCount: 0,
      errorCount: 0,
      results: [],
      processedAt: new Date().toISOString()
    });
  }

  // Development logging
  if (process.env.NODE_ENV === 'development') {
    console.log('📨 [MULTI-API] Multiple process endpoint called');
  }

  try {
    const requestBody: RequestBody = req.body;

    // Validate request
    if (!requestBody.images || !Array.isArray(requestBody.images)) {
      return res.status(400).json({
        success: false,
        error: 'No images provided',
        totalImages: 0,
        successCount: 0,
        errorCount: 0,
        results: [],
        processedAt: new Date().toISOString()
      });
    }

    if (requestBody.images.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No images provided',
        totalImages: 0,
        successCount: 0,
        errorCount: 0,
        results: [],
        processedAt: new Date().toISOString()
      });
    }

    if (requestBody.images.length > MAX_IMAGES_PER_REQUEST) {
      return res.status(400).json({
        success: false,
        error: `Too many images. Maximum ${MAX_IMAGES_PER_REQUEST} images per request.`,
        totalImages: requestBody.images.length,
        successCount: 0,
        errorCount: 0,
        results: [],
        processedAt: new Date().toISOString()
      });
    }

    const useGemini = requestBody.useGemini === 'true';
    const skipNotion = requestBody.skipNotion === 'true';
    const maxConcurrent = Math.min(
      requestBody.maxConcurrent || MAX_CONCURRENT_PROCESSES,
      MAX_CONCURRENT_PROCESSES
    );

    if (process.env.NODE_ENV === 'development') {
      console.log('🎯 [MULTI-API] Processing parameters:');
      console.log('   Images:', requestBody.images.length);
      console.log('   Use Gemini:', useGemini);
      console.log('   Skip Notion:', skipNotion);
      console.log('   Max Concurrent:', maxConcurrent);
    }

    // Validate all image requests and create validated list
    const validatedImages: ImageProcessRequest[] = [];
    const validationResults: ImageProcessResult[] = [];

    for (const img of requestBody.images) {
      const validation = validateImageRequest(img);
      if (validation.valid) {
        validatedImages.push(img as ImageProcessRequest);
      } else {
        validationResults.push({
          id: img.id || 'unknown',
          success: false,
          error: validation.error,
          processedAt: new Date().toISOString()
        });
      }
    }

    // Process valid images
    let processingResults: ImageProcessResult[] = [];
    if (validatedImages.length > 0) {
      processingResults = await processImagesBatch(validatedImages, useGemini, maxConcurrent);
    }

    // Combine validation failures with processing results
    const allResults = [...validationResults, ...processingResults];

    // Calculate summary statistics
    const successCount = allResults.filter(r => r.success).length;
    const errorCount = allResults.filter(r => !r.success).length;

    console.log('Multiple image processing completed:', {
      totalImages: requestBody.images.length,
      successCount,
      errorCount,
      useGemini,
      skipNotion
    });

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ [MULTI-API] Multiple processing completed');
      console.log(`   Success: ${successCount}, Errors: ${errorCount}`);
    }

    return res.status(200).json({
      success: true,
      totalImages: requestBody.images.length,
      successCount,
      errorCount,
      results: allResults,
      processedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Multiple process API error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      totalImages: 0,
      successCount: 0,
      errorCount: 0,
      results: [],
      processedAt: new Date().toISOString()
    });
  }
}