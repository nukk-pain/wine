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

  // Only allow cleanup in Vercel environment with blob token
  if (!process.env.VERCEL || !process.env.BLOB_READ_WRITE_TOKEN) {
    console.warn('Blob cleanup skipped: not in Vercel environment or no blob token');
    return res.status(200).json({
      success: true,
      deletedCount: 0,
      failedCount: 0,
      error: 'Blob cleanup not needed (not using Vercel Blob)'
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

    console.log(`Starting cleanup for ${urls.length} blob URLs`);

    const results = await Promise.allSettled(
      urls.map(async (url) => {
        try {
          await del(url);
          console.log(`Successfully deleted blob: ${url}`);
          return { success: true, url };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.warn(`Failed to delete blob: ${url}`, { error: errorMessage });
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