// pages/api/upload-multiple.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs/promises';
import path from 'path';
import { put } from '@vercel/blob';
import sharp from 'sharp';
import logger from '@/lib/config/logger';

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

interface UploadResult {
  success: boolean;
  fileName?: string;
  filePath?: string;
  fileUrl?: string;
  url?: string;
  fileSize?: number;
  optimized?: boolean;
  error?: string;
}

interface MultipleUploadResponse {
  success: boolean;
  totalFiles: number;
  successCount: number;
  errorCount: number;
  results: UploadResult[];
  error?: string;
}

export const config = {
  api: {
    bodyParser: false, // Disable bodyParser for formidable to handle multipart
    sizeLimit: '50mb', // Allow larger uploads for multiple files
  },
};

// Validate individual file
function validateFile(file: formidable.File): { valid: boolean; error?: string } {
  // Check file type
  if (!ALLOWED_TYPES.includes(file.mimetype || '')) {
    return { 
      valid: false, 
      error: `Invalid file type: ${file.mimetype}. Only JPEG, PNG, and WebP are allowed.` 
    };
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return { 
      valid: false, 
      error: `File size exceeds maximum limit of ${MAX_FILE_SIZE / 1024 / 1024}MB` 
    };
  }

  // Check if file is empty
  if (file.size === 0) {
    return { 
      valid: false, 
      error: 'Empty file not allowed' 
    };
  }

  return { valid: true };
}

// Process single file upload
async function processSingleFile(file: formidable.File): Promise<UploadResult> {
  try {
    // Validate file
    const validation = validateFile(file);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error
      };
    }

    // Generate safe filename
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const ext = path.extname(file.originalFilename || '.jpg');
    const safeFileName = `wine_${timestamp}_${randomSuffix}${ext}`;

    // Determine if we're in Vercel environment
    if (process.env.VERCEL) {
      // Vercel Blob upload
      const imageBuffer = await fs.readFile(file.filepath);
      
      // Optimize image with Sharp
      const optimizedBuffer = await sharp(imageBuffer)
        .resize(1920, 1920, { 
          fit: 'inside', 
          withoutEnlargement: true 
        })
        .jpeg({ 
          quality: 85,
          progressive: true 
        })
        .toBuffer();

      const blob = await put(safeFileName, optimizedBuffer, {
        access: 'public',
        contentType: 'image/jpeg'
      });

      // Clean up temp file
      await fs.unlink(file.filepath).catch(() => {});

      return {
        success: true,
        fileName: safeFileName,
        filePath: blob.url,
        fileUrl: blob.url,
        url: blob.url,
        fileSize: optimizedBuffer.length,
        optimized: true
      };
      
    } else {
      // Local storage
      const uploadDir = path.join(process.cwd(), 'public', 'uploads');
      await fs.mkdir(uploadDir, { recursive: true });
      
      const filePath = path.join(uploadDir, safeFileName);
      
      // Read and optimize image
      const imageBuffer = await fs.readFile(file.filepath);
      const optimizedBuffer = await sharp(imageBuffer)
        .resize(1920, 1920, { 
          fit: 'inside', 
          withoutEnlargement: true 
        })
        .jpeg({ 
          quality: 85,
          progressive: true 
        })
        .toBuffer();
      
      // Save optimized image
      await fs.writeFile(filePath, optimizedBuffer);
      
      // Clean up temp file
      await fs.unlink(file.filepath).catch(() => {});
      
      // Get file stats
      const stats = await fs.stat(filePath);
      
      return {
        success: true,
        fileName: safeFileName,
        filePath,
        fileUrl: `/uploads/${safeFileName}`,
        url: `/uploads/${safeFileName}`,
        fileSize: stats.size,
        optimized: true
      };
    }
    
  } catch (error) {
    logger.error('Single file upload error', { 
      filename: file.originalFilename,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    // Clean up temp file on error
    await fs.unlink(file.filepath).catch(() => {});
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed'
    };
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<MultipleUploadResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed',
      totalFiles: 0,
      successCount: 0,
      errorCount: 0,
      results: []
    });
  }

  // Development logging
  if (process.env.NODE_ENV === 'development') {
    console.log('📨 [API] Multiple upload endpoint called');
  }

  try {
    // Set up formidable for multiple file uploads
    const uploadDir = process.env.VERCEL ? '/tmp' : path.join(process.cwd(), 'tmp');
    await fs.mkdir(uploadDir, { recursive: true });

    const form = formidable({
      keepExtensions: true,
      maxFileSize: MAX_FILE_SIZE,
      maxFiles: 10, // Limit to 10 files maximum
      uploadDir: uploadDir,
      multiples: true, // Enable multiple files
      filter: ({ mimetype }) => {
        return mimetype ? ALLOWED_TYPES.includes(mimetype) : false;
      }
    });

    if (process.env.NODE_ENV === 'development') {
      console.log('⚙️ [API] Starting multiple file form parsing...');
    }

    // Parse form data
    const [fields, files] = await form.parse(req);
    
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ [API] Form parsing completed');
      console.log('   Files found:', Object.keys(files).length);
    }

    // Extract files array
    let fileArray: formidable.File[] = [];
    
    // Handle different ways files might be structured
    if (files.files) {
      fileArray = Array.isArray(files.files) ? files.files : [files.files];
    } else if (files.file) {
      fileArray = Array.isArray(files.file) ? files.file : [files.file];
    } else {
      // Look for any file fields
      for (const [key, value] of Object.entries(files)) {
        if (value) {
          const fileValues = Array.isArray(value) ? value : [value];
          fileArray.push(...fileValues);
        }
      }
    }

    if (fileArray.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No files provided',
        totalFiles: 0,
        successCount: 0,
        errorCount: 0,
        results: []
      });
    }

    if (process.env.NODE_ENV === 'development') {
      console.log(`🔄 [API] Processing ${fileArray.length} files...`);
    }

    // Process all files
    const results: UploadResult[] = [];
    
    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      if (process.env.NODE_ENV === 'development') {
        console.log(`   Processing file ${i + 1}/${fileArray.length}: ${file.originalFilename}`);
      }
      
      const result = await processSingleFile(file);
      results.push(result);
    }

    // Calculate summary statistics
    const successCount = results.filter(r => r.success).length;
    const errorCount = results.filter(r => !r.success).length;

    logger.info('Multiple file upload completed', {
      totalFiles: fileArray.length,
      successCount,
      errorCount
    });

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ [API] Multiple upload completed');
      console.log(`   Success: ${successCount}, Errors: ${errorCount}`);
    }

    return res.status(200).json({
      success: true,
      totalFiles: fileArray.length,
      successCount,
      errorCount,
      results
    });

  } catch (error) {
    logger.error('Multiple upload API error', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      totalFiles: 0,
      successCount: 0,
      errorCount: 0,
      results: []
    });
  }
}