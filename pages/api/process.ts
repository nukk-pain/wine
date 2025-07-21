// pages/api/process.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs/promises';
import path from 'path';
import { processWineImage } from '@/lib/vision';
import { geminiService } from '@/lib/gemini';
import { saveWineToNotion, saveReceiptToNotion } from '@/lib/notion';
import logger from '@/lib/config/logger';

// 이미지 저장 경로 설정 (개발/프로덕션 환경에 따라 다름)
const WINE_PHOTOS_DIR = process.env.NODE_ENV === 'production' 
  ? '/volume2/web/wine/wine-photos'  // NAS 경로
  : path.join(process.cwd(), 'public', 'wine-photos'); // 로컬 개발 경로

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    let imageFile: any = null;
    let imageUrl: string | null = null;
    let type: string | undefined;
    let useGemini: string | undefined;
    let skipNotion: string | undefined;

    // Detect request type based on Content-Type
    const contentType = req.headers['content-type'] || '';
    
    if (contentType.includes('application/json')) {
      // JSON request with imageUrl (Vercel Blob)
      const body = req.body;
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
      
      // Validate URL format
      if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid imageUrl format. Must be a valid HTTP(S) URL' 
        });
      }
      
    } else {
      // Form data request (existing behavior)
      const form = formidable({
        keepExtensions: true,
        maxFileSize: 10 * 1024 * 1024, // 10MB
      });
      
      const [fields, files] = await form.parse(req);
      
      imageFile = Array.isArray(files.image) ? files.image[0] : files.image;
      type = Array.isArray(fields.type) ? fields.type[0] : fields.type;
      useGemini = Array.isArray(fields.useGemini) ? fields.useGemini[0] : fields.useGemini;
      skipNotion = Array.isArray(fields.skipNotion) ? fields.skipNotion[0] : fields.skipNotion;

      if (!imageFile) {
        return res.status(400).json({ 
          success: false, 
          error: 'No image file provided' 
        });
      }
    }

    logger.info('Processing image', {
      filename: imageFile?.originalFilename || 'URL-based',
      size: imageFile?.size || 'unknown',
      type: type,
      useGemini: useGemini,
      tempPath: imageFile?.filepath || imageUrl,
      inputType: imageUrl ? 'url' : 'file'
    });

    let extractedData;
    let imageType = type as 'wine_label' | 'receipt' | 'auto';

    if (useGemini === 'true') {
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
        
        logger.info('Starting Gemini processing', { 
          imageType, 
          bufferSize: imageBuffer.length, 
          mimeType 
        });
        
        // Use Gemini API for processing
        if (imageType === 'auto') {
          // Auto-detect image type
          const classifiedType = await geminiService.classifyImage(imageBuffer, mimeType);
          logger.info('Image classified', { classifiedType });
          
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
        } else if (imageType === 'receipt') {
          extractedData = await geminiService.extractReceiptInfo(imageBuffer, mimeType);
        }
        
        logger.info('Gemini processing completed', { imageType, hasData: !!extractedData });
      } catch (geminiError) {
        logger.error('Gemini API error', { 
          error: geminiError instanceof Error ? geminiError.message : 'Unknown Gemini error',
          stack: geminiError instanceof Error ? geminiError.stack : undefined
        });
        
        // Fallback to vision API
        logger.info('Falling back to Vision API');
        const imagePath = imageUrl || imageFile.filepath;
        const visionResult = await processWineImage(imagePath);
        extractedData = visionResult.data;
        imageType = visionResult.imageType as 'wine_label' | 'receipt';
      }
    } else {
      // Use existing OCR-based processing
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
        logger.warn('Failed to save image permanently', { 
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
        }
      });
    }

    // Save to Notion based on type
    let notionResult;
    let notionResults;

    if (imageType === 'wine_label') {
      notionResult = await saveWineToNotion(extractedData, 'wine_label');
      
      return res.status(200).json({
        success: true,
        data: {
          type: imageType,
          extractedData: extractedData,
          notionResult: notionResult,
          savedImagePath: savedImagePath
        }
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
        }
      });
    }

  } catch (error) {
    logger.error('Process API error', { 
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
  
  logger.info('Image saved permanently', {
    originalName: imageFile.originalFilename,
    savedPath: targetPath,
    fileName
  });
  
  return targetPath;
}