// pages/api/cleanup-blobs.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { del } from '@vercel/blob';

interface CleanupRequest {
  urls: string[];
}

interface CleanupResponse {
  success: boolean;
  deletedCount: number;
  failedCount: number;
  errors?: string[];
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CleanupResponse>
) {
  console.log('Blob cleanup API called:', {
    method: req.method,
    vercelEnv: process.env.VERCEL_ENV || 'none'
  });

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      deletedCount: 0,
      failedCount: 0,
      error: 'Method not allowed'
    });
  }

  // Handle both Vercel Blob cleanup and local file cleanup
  const isVercelEnv = process.env.VERCEL && process.env.BLOB_READ_WRITE_TOKEN;
  const isDevelopment = process.env.NODE_ENV === 'development';

  if (!isVercelEnv && !isDevelopment) {
    console.warn('Blob cleanup skipped: not in Vercel environment or development mode');
    return res.status(200).json({
      success: true,
      deletedCount: 0,
      failedCount: 0,
      error: 'Cleanup not needed (not Vercel Blob or development)'
    });
  }

  try {
    const { urls }: CleanupRequest = req.body;

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return res.status(400).json({
        success: false,
        deletedCount: 0,
        failedCount: 0,
        error: 'No URLs provided for cleanup'
      });
    }

    console.log(`Starting cleanup for ${urls.length} file URLs (isVercel: ${isVercelEnv}, isDev: ${isDevelopment})`);

    const results = await Promise.allSettled(
      urls.map(async (url) => {
        try {
          // Check if it's a Vercel Blob URL
          if (url.includes('vercel-storage.com') || url.includes('blob.vercel-storage')) {
            if (isVercelEnv) {
              await del(url);
              console.log(`Successfully deleted Vercel Blob: ${url}`);
              return { success: true, url };
            } else {
              console.log(`Skipping Vercel Blob (not in Vercel env): ${url}`);
              return { success: true, url, skipped: true };
            }
          }

          // Check if it's a local file (development mode)
          if (isDevelopment && (url.startsWith('/wine-photos/') || url.includes('wine-photos'))) {
            // Import fs dynamically for server-side only
            const fs = await import('fs/promises');
            const path = await import('path');

            // Extract filename and build full path
            const filename = url.split('/').pop();
            if (filename) {
              const filePath = path.join(process.cwd(), 'public', 'wine-photos', filename);

              try {
                await fs.unlink(filePath);
                console.log(`Successfully deleted local file: ${filePath}`);
                return { success: true, url };
              } catch (fsError: any) {
                if (fsError.code === 'ENOENT') {
                  console.log(`File already deleted or not found: ${filePath}`);
                  return { success: true, url, skipped: true };
                }
                throw fsError;
              }
            }
          }

          console.log(`Unknown URL format, skipping: ${url}`);
          return { success: true, url, skipped: true };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.warn(`Failed to delete file: ${url}`, { error: errorMessage });
          return { success: false, url, error: errorMessage };
        }
      })
    );

    const deletedCount = results.filter(
      (result) => result.status === 'fulfilled' && result.value.success
    ).length;

    const failedResults = results.filter(
      (result) => result.status === 'fulfilled' && !result.value.success
    );

    const rejectedResults = results.filter(
      (result) => result.status === 'rejected'
    );

    const failedCount = failedResults.length + rejectedResults.length;

    const errors = [
      ...failedResults.map(result =>
        result.status === 'fulfilled' ? result.value.error : 'Unknown error'
      ),
      ...rejectedResults.map(result =>
        result.status === 'rejected' ? result.reason : 'Promise rejected'
      )
    ].filter(Boolean);

    console.log('Blob cleanup completed:', {
      deletedCount,
      failedCount,
      totalUrls: urls.length
    });

    return res.status(200).json({
      success: deletedCount > 0 || failedCount === 0,
      deletedCount,
      failedCount,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Blob cleanup API error:', { error: errorMessage });

    return res.status(500).json({
      success: false,
      deletedCount: 0,
      failedCount: 0,
      error: errorMessage
    });
  }
}