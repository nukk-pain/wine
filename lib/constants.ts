/**
 * Shared constants for client and server
 * These must match the server-side configuration in lib/config/index.ts
 */

export const UPLOAD_CONSTANTS = {
  ALLOWED_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'] as string[],
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  BATCH_SIZE: 5, // Upload 5 files at a time
};

export const API_ENDPOINTS = {
  UPLOAD: '/api/upload',
  UPLOAD_MULTIPLE: '/api/upload-multiple',
  PROCESS: '/api/process',
  PROCESS_MULTIPLE: '/api/process-multiple',
  NOTION: '/api/notion',
  NOTION_BATCH: '/api/notion-batch',
} as const;