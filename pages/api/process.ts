// pages/api/process.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs/promises';
import path from 'path';
import { processWineImage } from '@/lib/vision';
import { geminiService } from '@/lib/gemini';
import { saveWineToNotion, saveReceiptToNotion } from '@/lib/notion';
import { normalizeWineData } from '@/lib/data-normalizer';
import { createFormidableConfig, parseFormidableError, getTempDir } from '@/lib/formidable-config';

// 이미지 저장 경로 설정 (개발/프로덕션 환경에 따라 다름)
const WINE_PHOTOS_DIR = process.env.NODE_ENV === 'production' 
  ? '/volume2/web/wine/wine-photos'  // NAS 경로
  : path.join(process.cwd(), 'public', 'wine-photos'); // 로컬 개발 경로

export const config = {
  api: {
    bodyParser: false, // Disable bodyParser to handle both JSON and multipart manually
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  // Development logging for API entry
  if (process.env.NODE_ENV === 'development') {
    console.log('📨 [API] Process endpoint called');
    console.log('🔗 [API] Content-Type:', req.headers['content-type']);
  }

  try {
    let imageFile: any = null;
    let imageUrl: string | null = null;
    let type: string | undefined;
    let useGemini: string | undefined;
    let skipNotion: string | undefined;

    // Detect request type based on Content-Type
    const contentType = req.headers['content-type'] || '';
    
    if (process.env.NODE_ENV === 'development') {
      console.log('📋 [API] Analyzing content type for routing...');
      console.log('   Content-Type header:', contentType);
      console.log('   Is JSON?', contentType.includes('application/json'));
      console.log('   Is multipart?', contentType.includes('multipart/form-data'));
    }
    
    if (contentType.includes('application/json')) {
      // JSON request with imageUrl (Vercel Blob) - parse manually since bodyParser is disabled
      let body;
      try {
        // Manually parse JSON since bodyParser is disabled
        const rawBody = await new Promise<string>((resolve, reject) => {
          let data = '';
          req.on('data', chunk => {
            data += chunk;
          });
          req.on('end', () => {
            resolve(data);
          });
          req.on('error', reject);
        });
        
        // Check if rawBody is empty before parsing
        if (!rawBody || rawBody.trim() === '') {
          console.error('❌ [API] Empty request body received');
          return res.status(400).json({ 
            success: false, 
            error: 'Empty request body' 
          });
        }
        
        if (process.env.NODE_ENV === 'development') {
          console.log('📋 [API] Raw body before parsing:', rawBody);
          console.log('   Raw body length:', rawBody.length);
        }
        
        body = JSON.parse(rawBody);
        
        if (process.env.NODE_ENV === 'development') {
          console.log('📋 [API] Parsed JSON body:', body);
          console.log('   Body type:', typeof body);
          console.log('   Has imageUrl?', body && 'imageUrl' in body);
        }
      } catch (parseError) {
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid JSON in request body: ' + (parseError instanceof Error ? parseError.message : 'Unknown error')
        });
      }
      
      if (!body) {
        return res.status(400).json({ 
          success: false, 
          error: 'Request body is missing or empty' 
        });
      }
      
      imageUrl = body.imageUrl;
      type = body.type;
      useGemini = body.useGemini;
      skipNotion = body.skipNotion;
      
      if (!imageUrl) {
        return res.status(400).json({ 
          success: false, 
          error: 'No imageUrl provided' 
        });
      }
      
      // Handle relative URLs in development
      if (process.env.NODE_ENV === 'development' && imageUrl.startsWith('/')) {
        // Convert relative URL to full URL for local development
        const protocol = req.headers['x-forwarded-proto'] || 'http';
        const host = req.headers.host;
        imageUrl = `${protocol}://${host}${imageUrl}`;
        
        if (process.env.NODE_ENV === 'development') {
          console.log('🔄 [API] Converted relative URL to full URL:', imageUrl);
        }
      } else if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid imageUrl format. Must be a valid HTTP(S) URL or relative path' 
        });
      }
      
    } else {
      // Form data request (existing behavior)
      if (process.env.NODE_ENV === 'development') {
        console.log('📁 [API] Processing form data request');
      }
      
      // Determine upload directory based on environment
      const uploadDir = process.env.VERCEL ? '/tmp' : path.join(process.cwd(), 'tmp');
      
      // Ensure upload directory exists
      try {
        await fs.mkdir(uploadDir, { recursive: true });
      } catch (err) {
        if (process.env.NODE_ENV === 'development') {
          console.log('📁 [API] Upload directory already exists or creation failed:', err);
        }
      }
      
      const form = formidable(createFormidableConfig({
        uploadDir: uploadDir
      }));
      
      if (process.env.NODE_ENV === 'development') {
        console.log('⚙️ [API] Starting form parsing...');
        console.log('📂 [API] Upload directory:', uploadDir);
      }
      
      try {
        // Add timeout for form parsing
        const parsePromise = form.parse(req);
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Form parsing timeout')), 30000)
        );
        
        const [fields, files] = await Promise.race([
          parsePromise,
          timeoutPromise
        ]) as [formidable.Fields, formidable.Files];
        
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ [API] Form parsing completed');
          console.log('   Fields:', Object.keys(fields));
          console.log('   Files:', Object.keys(files));
        }
        
        imageFile = Array.isArray(files.image) ? files.image[0] : files.image;
        type = Array.isArray(fields.type) ? fields.type[0] : fields.type;
        useGemini = Array.isArray(fields.useGemini) ? fields.useGemini[0] : fields.useGemini;
        skipNotion = Array.isArray(fields.skipNotion) ? fields.skipNotion[0] : fields.skipNotion;
        
      } catch (parseError) {
        if (process.env.NODE_ENV === 'development') {
          console.error('❌ [API] Form parsing failed:', parseError);
        }
        throw parseError;
      }

      if (!imageFile) {
        return res.status(400).json({ 
          success: false, 
          error: 'No image file provided' 
        });
      }
    }

    console.log('Processing image:', {
      filename: imageFile?.originalFilename || 'URL-based',
      size: imageFile?.size || 'unknown',
      type: type,
      useGemini: useGemini,
      tempPath: imageFile?.filepath || imageUrl,
      inputType: imageUrl ? 'url' : 'file'
    });

    let extractedData;
    let imageType = type as 'wine_label' | 'receipt' | 'auto';

    // Development logging for processing decision
    if (process.env.NODE_ENV === 'development') {
      console.log('🎯 [API] Processing parameters:');
      console.log('   Type:', type);
      console.log('   Use Gemini:', useGemini);
      console.log('   Skip Notion:', skipNotion);
      console.log('   Has image file:', !!imageFile);
      console.log('   Has image URL:', !!imageUrl);
    }

    if (useGemini === 'true') {
      if (process.env.NODE_ENV === 'development') {
        console.log('🤖 [API] Using Gemini for analysis');
      }
      try {
        let imageBuffer: Buffer;
        let mimeType: string;
        
        if (imageUrl) {
          // Fetch image from URL
          const response = await fetch(imageUrl);
          if (!response.ok) {
            throw new Error(`Failed to fetch image from URL: ${response.statusText}`);
          }
          const arrayBuffer = await response.arrayBuffer();
          imageBuffer = Buffer.from(arrayBuffer);
          mimeType = response.headers.get('content-type') || 'image/jpeg';
        } else {
          // Read image file for Gemini
          imageBuffer = await fs.readFile(imageFile.filepath);
          mimeType = imageFile.mimetype || 'image/jpeg';
        }
        
        console.log('Starting Gemini processing:', { 
          imageType, 
          bufferSize: imageBuffer.length, 
          mimeType 
        });
        
        // Use Gemini API for processing
        if (imageType === 'auto') {
          // Auto-detect image type
          const classifiedType = await geminiService.classifyImage(imageBuffer, mimeType);
          console.log('Image classified:', { classifiedType });
          
          if (classifiedType === 'unknown') {
            return res.status(400).json({
              success: false,
              error: 'Could not determine image type'
            });
          }
          
          imageType = classifiedType as 'wine_label' | 'receipt';
        }

        // Extract information based on type
        if (imageType === 'wine_label') {
          extractedData = await geminiService.extractWineInfo(imageBuffer, mimeType);
          console.log('🍷 [API] Gemini wine data extracted:', JSON.stringify(extractedData, null, 2));
        } else if (imageType === 'receipt') {
          extractedData = await geminiService.extractReceiptInfo(imageBuffer, mimeType);
          console.log('🧾 [API] Gemini receipt data extracted:', JSON.stringify(extractedData, null, 2));
        }
        
        console.log('Gemini processing completed:', { imageType, hasData: !!extractedData });
      } catch (geminiError) {
        console.error('Gemini API error:', { 
          error: geminiError instanceof Error ? geminiError.message : 'Unknown Gemini error',
          stack: geminiError instanceof Error ? geminiError.stack : undefined
        });
        
        // Fallback to vision API
        console.log('Falling back to Vision API');
        const imagePath = imageUrl || imageFile.filepath;
        const visionResult = await processWineImage(imagePath);
        extractedData = visionResult.data;
        imageType = visionResult.imageType as 'wine_label' | 'receipt';
      }
    } else {
      // Use existing OCR-based processing
      if (process.env.NODE_ENV === 'development') {
        console.log('👁️ [API] Using Vision API (OCR-based processing)');
      }
      const imagePath = imageUrl || imageFile.filepath;
      const visionResult = await processWineImage(imagePath);
      extractedData = visionResult.data;
      imageType = visionResult.imageType as 'wine_label' | 'receipt';
    }

    // 이미지를 영구 저장소로 이동 (file uploads only)
    let savedImagePath: string | null = null;
    if (imageFile) {
      try {
        // In Vercel environment, we don't need to save files (they're already in Blob storage)
        if (process.env.VERCEL) {
          savedImagePath = 'stored-in-vercel-blob';
          // Clean up temp file
          await fs.unlink(imageFile.filepath).catch(() => {});
        } else {
          savedImagePath = await saveImagePermanently(imageFile);
        }
      } catch (error) {
        console.warn('Failed to save image permanently:', { 
          filepath: imageFile.filepath,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        // 저장 실패 시 임시 파일 정리
        await fs.unlink(imageFile.filepath).catch(() => {});
      }
    } else if (imageUrl) {
      // For URL-based processing, the image is already stored
      savedImagePath = imageUrl;
    }

    // Skip Notion saving if requested
    if (skipNotion === 'true') {
      return res.status(200).json({
        success: true,
        data: {
          type: imageType,
          extractedData: extractedData,
          savedImagePath: savedImagePath
        },
        // Include debug info in development or when requested
        debug: process.env.NODE_ENV === 'development' || req.query.debug ? {
          geminiRawData: extractedData,
          imageType: imageType,
          processingPath: 'skipNotion=true'
        } : undefined
      });
    }

    // Save to Notion based on type
    let notionResult;
    let notionResults;

    if (imageType === 'wine_label') {
      // Normalize data to ensure correct types
      const normalizedData = normalizeWineData(extractedData);
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 [API] Data after normalization:', JSON.stringify(normalizedData, null, 2));
        console.log('🚀 [API] About to save to Notion...');
      }
      notionResult = await saveWineToNotion(normalizedData, 'wine_label');
      
      return res.status(200).json({
        success: true,
        data: {
          type: imageType,
          extractedData: extractedData,
          notionResult: notionResult,
          savedImagePath: savedImagePath
        },
        // Include debug info in development or when requested
        debug: process.env.NODE_ENV === 'development' || req.query.debug ? {
          geminiRawData: extractedData,
          normalizedData: normalizedData,
          finalNotionData: notionResult
        } : undefined
      });
    } else if (imageType === 'receipt') {
      notionResults = await saveReceiptToNotion(extractedData);
      
      return res.status(200).json({
        success: true,
        data: {
          type: imageType,
          extractedData: extractedData,
          notionResults: notionResults,
          savedImagePath: savedImagePath
        },
        // Include debug info in development or when requested
        debug: process.env.NODE_ENV === 'development' || req.query.debug ? {
          geminiRawData: extractedData,
          finalNotionResults: notionResults
        } : undefined
      });
    }

  } catch (error) {
    console.error('Process API error:', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
}

// 이미지를 영구 저장소에 저장하는 함수
async function saveImagePermanently(imageFile: formidable.File): Promise<string> {
  // 저장 디렉토리 생성 (없으면)
  await fs.mkdir(WINE_PHOTOS_DIR, { recursive: true });
  
  // 파일명 생성 (타임스탬프 + 원본 확장자)
  const timestamp = Date.now();
  const ext = path.extname(imageFile.originalFilename || '.jpg');
  const fileName = `wine_${timestamp}${ext}`;
  const targetPath = path.join(WINE_PHOTOS_DIR, fileName);
  
  // 파일 이동
  await fs.copyFile(imageFile.filepath, targetPath);
  
  // 임시 파일 삭제
  await fs.unlink(imageFile.filepath);
  
  console.log('Image saved permanently:', {
    originalName: imageFile.originalFilename,
    savedPath: targetPath,
    fileName
  });
  
  return targetPath;
}