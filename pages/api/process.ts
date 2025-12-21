// pages/api/process.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs/promises';
import path from 'path';
import { processWineImage } from '@/lib/vision';
import { geminiService } from '@/lib/gemini';
import { createFormidableConfig, parseFormidableError, getTempDir } from '@/lib/formidable-config';
import { createApiHandler, sendSuccess, sendError } from '@/lib/api-utils';
import { getConfig } from '@/lib/config';

// Get configuration
const appConfig = getConfig();

// Image storage path - use unified config
const WINE_PHOTOS_DIR = path.join(process.cwd(), 'public', 'wine-photos');

export const config = {
  api: {
    bodyParser: false, // Handle multipart/form-data manually
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return sendError(res, 'Method not allowed', 405);
  }

  try {
    let imageFile: any = null;
    let imageUrl: string | null = null;
    let type: string | undefined;
    let useGemini: string | undefined;

    const contentType = req.headers['content-type'] || '';

    // Parse Request
    if (contentType.includes('application/json')) {
      // Manual JSON parsing
      const rawBody = await readRequestBody(req);
      if (!rawBody || rawBody.trim() === '') {
        return sendError(res, 'Empty request body', 400);
      }

      let body;
      try {
        body = JSON.parse(rawBody);
      } catch (e) {
        return sendError(res, 'Invalid JSON', 400);
      }

      imageUrl = body.imageUrl;
      type = body.type;
      useGemini = body.useGemini;

      if (!imageUrl) {
        return sendError(res, 'No imageUrl provided', 400);
      }

    } else {
      // Multipart Form Data
      const uploadDir = process.env.VERCEL ? '/tmp' : path.join(process.cwd(), 'tmp');
      await fs.mkdir(uploadDir, { recursive: true }).catch(() => { });

      const form = formidable(createFormidableConfig({ uploadDir }));

      const [fields, files] = await new Promise<[formidable.Fields, formidable.Files]>((resolve, reject) => {
        form.parse(req, (err, fields, files) => {
          if (err) reject(err);
          else resolve([fields, files]);
        });
      });

      imageFile = Array.isArray(files.image) ? files.image[0] : files.image;
      type = Array.isArray(fields.type) ? fields.type[0] : fields.type;
      useGemini = Array.isArray(fields.useGemini) ? fields.useGemini[0] : fields.useGemini;

      if (!imageFile) {
        return sendError(res, 'No image file provided', 400);
      }
    }

    // Determine Image Type
    let extractedData;
    let imageType = (type || 'auto') as 'wine_label' | 'receipt' | 'auto';

    //  CRITICAL FIX: Use PERMANENT file for processing to avoid race condition
    // Background cleanup scripts may delete tmp files during processing
    let processingImagePath: string;
    let savedImagePath: string | null = null;

    if (imageFile) {
      // Save permanently (without deleting original yet)
      if (!process.env.VERCEL) {
        savedImagePath = await saveImagePermanently(imageFile, false);
        // CRITICAL: Use the SAFE permanent file for Vision API
        // savedImagePath is like "/wine-photos/xxx.jpg", we need absolute local path
        processingImagePath = path.join(process.cwd(), 'public', savedImagePath.replace(/^\//, ''));
      } else {
        processingImagePath = imageFile.filepath;
      }
    } else {
      processingImagePath = imageUrl!; // Non-null assertion: imageUrl is guaranteed to exist here
      savedImagePath = imageUrl;
    }

    // Always use two-stage process: OCR → Gemini refinement
    // Vision API will read from file path, but we've buffered it just in case
    const visionResult = await processWineImage(processingImagePath);
    extractedData = visionResult.data;
    imageType = visionResult.imageType as any;

    // Clean up temp file after Vision API processing is complete
    if (imageFile) {
      // Set Vercel path if needed (otherwise already set above)
      if (process.env.VERCEL) {
        savedImagePath = 'stored-in-vercel-blob';
      }
      // Delete the temp file now that Vision API is done with it
      await fs.unlink(imageFile.filepath).catch(() => { });
    }

    // Return Success
    sendSuccess(res, {
      type: imageType,
      extractedData: extractedData,
      savedImagePath: savedImagePath,
      // Map to standard fields
      uploadedUrl: savedImagePath
    });

  } catch (error) {
    console.error('Process API Error:', error);
    sendError(res, error instanceof Error ? error.message : 'Processing failed', 500);
  }
}

// Helper: Read Body
function readRequestBody(req: NextApiRequest): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => data += chunk);
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

// Helper: Save Image (without deleting original)
async function saveImagePermanently(imageFile: formidable.File, deleteOriginal = true): Promise<string> {
  await fs.mkdir(WINE_PHOTOS_DIR, { recursive: true });
  const ext = path.extname(imageFile.originalFilename || '.jpg');
  const fileName = `wine_${Date.now()}_${Math.random().toString(36).substr(2, 9)}${ext}`;
  const targetPath = path.join(WINE_PHOTOS_DIR, fileName);
  await fs.copyFile(imageFile.filepath, targetPath);

  // Only delete original if requested (after Vision API processing)
  if (deleteOriginal) {
    await fs.unlink(imageFile.filepath).catch(() => { });
  }

  // Return public URL path
  // Assumes public/wine-photos is served at /wine-photos
  return `/wine-photos/${fileName}`;
}
