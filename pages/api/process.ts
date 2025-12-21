// pages/api/process.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs/promises';
import path from 'path';
import { geminiService } from '@/lib/gemini';
import { normalizeWineInfo } from '@/lib/utils/wine-data-helpers';
import { createFormidableConfig } from '@/lib/formidable-config';
import { sendSuccess, sendError } from '@/lib/api-utils';

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
      // Case 2: Multipart Form Data (Single file upload)
      const uploadDir = path.join(process.cwd(), 'tmp');
      await fs.mkdir(uploadDir, { recursive: true }).catch(() => { });
      const form = formidable(createFormidableConfig({ uploadDir }));

      const [fields, files]: [any, any] = await new Promise((resolve, reject) => {
        form.parse(req, (err, fields, files) => {
          if (err) reject(err); else resolve([fields, files]);
        });
      });

      const file = Array.isArray(files.image) ? files.image[0] : files.image;
      if (file) {
        const savedPath = await saveImagePermanently(file);
        const buffer = await fs.readFile(file.filepath);
        imageRequests.push({
          id: 'upload',
          buffer,
          mimeType: file.mimetype || 'image/jpeg',
          url: savedPath,
          type: fields.type?.[0] || 'wine_label'
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
  await fs.mkdir(WINE_PHOTOS_DIR, { recursive: true });
  const ext = path.extname(file.originalFilename || '.jpg');
  const fileName = `wine_${Date.now()}_${Math.random().toString(36).substr(2, 9)}${ext}`;
  const targetPath = path.join(WINE_PHOTOS_DIR, fileName);
  await fs.copyFile(file.filepath, targetPath);
  return `/wine-photos/${fileName}`;
}

function readRequestBody(req: NextApiRequest): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = ''; req.on('data', chunk => data += chunk);
    req.on('end', () => resolve(data)); req.on('error', reject);
  });
}
