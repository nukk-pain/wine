import formidable from 'formidable';
import path from 'path';
import { getConfig } from './config';

/**
 * Get temporary directory for file uploads based on environment
 */
export function getTempDir(): string {
  if (process.env.VERCEL || process.env.VERCEL_ENV) {
    return '/tmp';
  }
  return path.join(process.cwd(), 'tmp');
}

/**
 * Create formidable configuration with sensible defaults
 */
export function createFormidableConfig(options?: Partial<formidable.Options>): formidable.Options {
  const appConfig = getConfig();
  const tempDir = getTempDir();

  const defaultConfig: formidable.Options = {
    uploadDir: tempDir,
    keepExtensions: true,
    maxFileSize: appConfig.upload.maxFileSize,
    allowEmptyFiles: false,
    minFileSize: 1, // At least 1 byte
    filter: ({ mimetype }) => {
      if (!mimetype) return false;
      return appConfig.upload.allowedTypes.includes(mimetype);
    }
  };

  // Vercel-specific limits
  if (process.env.VERCEL || process.env.VERCEL_ENV) {
    defaultConfig.maxFiles = 5; // Reduced limit for Vercel
    defaultConfig.maxTotalFileSize = 25 * 1024 * 1024; // 25MB total for Vercel
  } else {
    defaultConfig.maxFiles = 10;
    defaultConfig.maxTotalFileSize = 50 * 1024 * 1024; // 50MB total for local/NAS
  }

  // Merge with provided options
  return {
    ...defaultConfig,
    ...options
  };
}

/**
 * Parse formidable error into user-friendly message
 */
export function parseFormidableError(err: any): string {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return 'File too large. Maximum 10MB allowed per file.';
  }
  if (err.code === 'LIMIT_FILE_TYPE') {
    return 'Invalid file type. Only images allowed (JPEG, PNG, WebP).';
  }
  if (err.code === 'LIMIT_FILE_COUNT') {
    return `Too many files. Maximum ${process.env.VERCEL ? '5' : '10'} files allowed.`;
  }
  if (err.code === 'LIMIT_TOTAL_FILE_SIZE') {
    return `Total file size too large. Maximum ${process.env.VERCEL ? '25MB' : '50MB'} allowed.`;
  }
  return err.message || 'Failed to process file upload';
}