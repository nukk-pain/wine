// pages/api/notion.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { updateWineRecord, ReceiptData } from '@/lib/notion'; // Kept legacy ReceiptData for now if needed, or replace with types
// import { ReceiptInfo } from '@/lib/gemini'; // Removed
import { NotionWineProperties, validateWineData } from '@/lib/utils/notion-helpers';
import { createApiHandler, sendSuccess, sendError } from '@/lib/api-utils';
import { saveWineToSheets, saveReceiptToSheets } from '@/lib/google-sheets';

/*
// Helper for Legacy Receipt Support (Cleanup target)
function convertReceiptInfoToReceiptData(receiptInfo: ReceiptInfo): ReceiptData {
  return {
    store: receiptInfo.store_name,
    date: receiptInfo.purchase_date || new Date().toISOString().split('T')[0],
    items: receiptInfo.items.map(item => ({
      name: item.wine_name,
      price: item.price,
      quantity: item.quantity,
      vintage: item.vintage
    })),
    total: receiptInfo.total_amount || 0
  };
}
*/

export default createApiHandler({
  POST: async (req, res) => {
    await handleNotionRequest(req, res);
  },
  PUT: async (req, res) => {
    await handleNotionRequest(req, res);
  }
});

async function handleNotionRequest(
  req: NextApiRequest,
  res: NextApiResponse
) {

  try {
    const { action, data, pageId, status, imageUrl } = req.body;

    if (process.env.NODE_ENV === 'development') {
      console.log('[API /api/notion] Received request:', { action, data, pageId, status, imageUrl });
    }

    if (!action) {
      return sendError(res, 'Missing action', 400);
    }

    let result;

    switch (action) {
      case 'save_wine':
      case 'save_wine_v2': // Support both for backward compatibility during transition
        if (!data) {
          return sendError(res, 'Missing required wine data', 400);
        }

        // We assume data is NotionWineProperties (Converted by Client)
        // If data is legacy WineData or WineInfo, this might fail validation or have missing fields,
        // but our refactored client ensures NotionWineProperties.
        const validation = validateWineData(data as NotionWineProperties);

        if (process.env.NODE_ENV === 'development') {
          console.log('[API /api/notion] Validation result:', validation);
        }

        if (!validation.isValid) {
          return sendError(res, 'Invalid wine data', 400, validation.errors);
        }

        if (process.env.NODE_ENV === 'development') {
          console.log('[API /api/notion] Saving to Google Sheets:', data);
        }

        result = await saveWineToSheets(data as NotionWineProperties);

        if (process.env.NODE_ENV === 'development') {
          console.log('[API /api/notion] Save result:', result);
        }
        break;

      // case 'save_receipt': deprecated
      // break;

      case 'update_status':
        if (!pageId || !status) {
          return sendError(res, 'Missing pageId or status', 400);
        }
        result = await updateWineRecord(pageId, status);
        break;

      default:
        return sendError(res, 'Invalid action', 400);
    }

    // Cleanup Vercel Blob file if save was successful and we have an imageUrl
    if (result && imageUrl && imageUrl.includes('vercel-storage.com')) {
      try {
        const cleanupResponse = await fetch(`${req.headers.origin || 'http://localhost:3000'}/api/cleanup-blobs`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ urls: [imageUrl] })
        });
        if (!cleanupResponse.ok) {
          console.warn('⚠️ [NOTION] Blob cleanup failed:', cleanupResponse.statusText);
        }
      } catch (cleanupError) {
        console.warn('⚠️ [NOTION] Blob cleanup error:', cleanupError);
      }
    }

    sendSuccess(res, result);

  } catch (error) {
    console.error('Notion API error:', error);
    sendError(
      res,
      'Notion operation failed',
      500,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}
