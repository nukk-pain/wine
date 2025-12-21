// pages/api/process.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import { geminiService } from '@/lib/gemini';
import { normalizeWineInfo } from '@/lib/utils/wine-data-helpers';
import { createFormidableConfig } from '@/lib/formidable-config';
import { sendSuccess, sendError } from '@/lib/api-utils';
// @ts-ignore
import { put } from '@vercel/blob';
import { getConfig } from '@/lib/config';

// Get upload configuration
const appConfig = getConfig();
const MAX_FILE_SIZE = appConfig.upload.maxFileSize;
const ALLOWED_TYPES = appConfig.upload.allowedTypes;

export const config = {
  api: {
    bodyParser: false, // Multipart/JSON handled manually
  },
};

const WINE_PHOTOS_DIR = path.join(process.cwd(), 'public', 'wine-photos');
const MAX_CONCURRENT = 3;

interface ImageRequest {
  id: string;
  url?: string;
  buffer?: Buffer;
  mimeType?: string;
  type?: 'wine_label' | 'receipt' | 'auto';
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return sendError(res, 'Method not allowed', 405);

  try {
    const contentType = req.headers['content-type'] || '';
    let imageRequests: ImageRequest[] = [];

    if (contentType.includes('application/json')) {
      // Case 1: JSON Body (Single URL or Batch URLs)
      const body = JSON.parse(await readRequestBody(req));
      const images = body.images || (body.imageUrl ? [{ id: 'single', url: body.imageUrl, type: body.type }] : []);

      for (const img of images) {
        const { buffer, mimeType } = await resolveImageSource(img.url);
        imageRequests.push({ ...img, buffer, mimeType });
      }
    } else {
      // Case 2: Multipart Form Data (Single or Multiple file upload)
      const { getTempDir } = await import('@/lib/formidable-config');
      const uploadDir = getTempDir();
      await fs.mkdir(uploadDir, { recursive: true }).catch(() => { });

      const form = formidable(createFormidableConfig({
        uploadDir,
        multiples: true // Enable multiple file uploads
      }));

      const [fields, files]: [any, any] = await new Promise((resolve, reject) => {
        form.parse(req, (err, fields, files) => {
          if (err) reject(err); else resolve([fields, files]);
        });
      });

      // Handle multiple ways files might be passed (image, file, files, etc.)
      let fileArray: formidable.File[] = [];
      if (files.image) {
        fileArray = Array.isArray(files.image) ? files.image : [files.image];
      } else if (files.file) {
        fileArray = Array.isArray(files.file) ? files.file : [files.file];
      }

      for (const file of fileArray) {
        // Validate file before processing
        const validation = validateFile(file);
        if (!validation.valid) {
          return sendError(res, validation.error || 'Invalid file', 400);
        }

        const savedPath = await saveImagePermanently(file);
        const buffer = await fs.readFile(file.filepath);
        imageRequests.push({
          id: file.newFilename || `upload_${Date.now()}`,
          buffer,
          mimeType: file.mimetype || 'image/jpeg',
          url: savedPath,
          type: fields.type?.[0] || 'wine_label' // Assumes all files have same type if batch uploaded
        });
        await fs.unlink(file.filepath).catch(() => { });
      }
    }

    if (imageRequests.length === 0) return sendError(res, 'No image data provided', 400);

    // Process all requests in batches
    const results = [];
    for (let i = 0; i < imageRequests.length; i += MAX_CONCURRENT) {
      const batch = imageRequests.slice(i, i + MAX_CONCURRENT);
      const batchResults = await Promise.all(batch.map(async (img) => {
        try {
          const result = await geminiService.extractWineInfo(img.buffer!, img.mimeType!);
          return {
            id: img.id,
            success: true,
            data: normalizeWineInfo(result.data, img.url || null)
          };
        } catch (err: any) {
          return { id: img.id, success: false, error: err.message };
        }
      }));
      results.push(...batchResults);
    }

    // Return standardized response
    // If it was a single request, Return simplified object for backward compatibility
    if (imageRequests.length === 1 && results[0].success) {
      return sendSuccess(res, {
        ...results[0].data,
        type: 'wine_label',
        extractedData: results[0].data
      });
    }

    return sendSuccess(res, { results, success: true });

  } catch (error: any) {
    console.error('Unified Process API Error:', error);
    return sendError(res, error.message || 'Processing failed', 500);
  }
}

async function resolveImageSource(url: string): Promise<{ buffer: Buffer; mimeType: string }> {
  if (url.startsWith('http')) {
    const response = await fetch(url);
    return { buffer: Buffer.from(await response.arrayBuffer()), mimeType: response.headers.get('content-type') || 'image/jpeg' };
  } else {
    const filePath = path.join(process.cwd(), 'public', url);
    const buffer = await fs.readFile(filePath);
    const ext = path.extname(url).toLowerCase();
    const mimeType = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
    return { buffer, mimeType };
  }
}

async function saveImagePermanently(file: formidable.File): Promise<string> {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isVercel = !isDevelopment && (process.env.VERCEL_ENV || process.env.BLOB_READ_WRITE_TOKEN);

  const ext = path.extname(file.originalFilename || '.jpg');
  const fileName = `wine_${Date.now()}_${Math.random().toString(36).substr(2, 9)}${ext}`;

  // Optimize image with Sharp before saving
  let optimizedBuffer: Buffer;
  try {
    optimizedBuffer = await sharp(file.filepath)
      .resize(1200, 1200, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ quality: 85 })
      .toBuffer();
  } catch (sharpError) {
    console.warn('Image optimization failed, using original:', sharpError);
    optimizedBuffer = await fs.readFile(file.filepath);
  }

  if (isVercel) {
    try {
      if (!process.env.BLOB_READ_WRITE_TOKEN) {
        throw new Error('BLOB_READ_WRITE_TOKEN is not configured');
      }

      console.log(`Uploading to Vercel Blob: ${fileName}`);
      const blob = await put(fileName, optimizedBuffer, {
        access: 'public',
        contentType: 'image/jpeg',
      });

      return blob.url;
    } catch (error) {
      console.error('Vercel Blob upload failed, falling back to local:', error);
      // Fallback to local storage logic below
    }
  }

  // Local storage fallback
  await fs.mkdir(WINE_PHOTOS_DIR, { recursive: true });
  const targetPath = path.join(WINE_PHOTOS_DIR, fileName);

  // Path traversal prevention
  const uploadDirResolved = path.resolve(WINE_PHOTOS_DIR);
  if (!path.resolve(targetPath).startsWith(uploadDirResolved)) {
    throw new Error('Invalid file path. Path traversal detected.');
  }

  await fs.writeFile(targetPath, optimizedBuffer);
  return `/wine-photos/${fileName}`;
}

/**
 * Validate uploaded file for security and constraints
 */
function validateFile(file: formidable.File): { valid: boolean; error?: string } {
  // 1. MIME type validation
  if (!ALLOWED_TYPES.includes(file.mimetype || '')) {
    return { valid: false, error: `Invalid file type: ${file.mimetype}. Only images allowed.` };
  }

  // 2. File size validation
  if (file.size > MAX_FILE_SIZE) {
    const maxMB = Math.round(MAX_FILE_SIZE / (1024 * 1024));
    return { valid: false, error: `File too large. Maximum ${maxMB}MB allowed.` };
  }

  // 3. Filename security validation (path traversal prevention)
  if (file.originalFilename) {
    const originalName = file.originalFilename;
    if (originalName.includes('..') || originalName.includes('/') || originalName.includes('\\')) {
      return { valid: false, error: 'Invalid filename. Path traversal detected.' };
    }

    // Filename length limit
    if (originalName.length > 255) {
      return { valid: false, error: 'Filename too long. Maximum 255 characters allowed.' };
    }

    // Special character restriction
    if (!/^[a-zA-Z0-9._\-\s()가-힣]+$/.test(originalName)) {
      return { valid: false, error: 'Invalid filename. Contains invalid characters.' };
    }
  }

  // 4. Empty file validation
  if (file.size === 0) {
    return { valid: false, error: 'Empty file not allowed.' };
  }

  return { valid: true };
}

function readRequestBody(req: NextApiRequest): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = ''; req.on('data', chunk => data += chunk);
    req.on('end', () => resolve(data)); req.on('error', reject);
  });
}

