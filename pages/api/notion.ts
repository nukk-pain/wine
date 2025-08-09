// pages/api/notion.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { saveWineToNotion, saveReceiptToNotion, updateWineRecord, WineData, ReceiptData, saveWineToNotionV2 } from '@/lib/notion';
import { WineInfo, ReceiptInfo } from '@/lib/gemini';
import { NotionWineProperties, validateWineData } from '@/lib/notion-schema';
import { createApiHandler, sendSuccess, sendError, validateRequiredFields } from '@/lib/api-utils';

// Convert Gemini WineInfo to Notion WineData format
function convertWineInfoToWineData(wineInfo: WineInfo): WineData {
  return {
    name: wineInfo.Name,
    vintage: wineInfo.Vintage || undefined,
    'Region/Producer': wineInfo['Region/Producer'] || undefined,
    'Varietal(품종)': wineInfo['Varietal(품종)'] ? wineInfo['Varietal(품종)'].join(', ') : undefined,
    // Default values - these will be set by the API
    'Purchase date': undefined, // Will be set to current date
    Status: undefined // Will be set to "재고"
  };
}

// Convert Gemini ReceiptInfo to Notion ReceiptData format
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
    const { action, data, source, pageId, status, imageUrl } = req.body;

    if (!action) {
      return sendError(res, 'Missing action', 400);
    }

    let result;

    switch (action) {
      case 'save_wine_v2':
        // New API for NotionWineProperties
        if (!data) {
          return sendError(res, 'Missing required wine data', 400);
        }

        const validation = validateWineData(data as NotionWineProperties);
        if (!validation.isValid) {
          return sendError(res, 'Invalid wine data', 400, validation.errors);
        }

        result = await saveWineToNotionV2(data as NotionWineProperties);
        break;

      case 'save_wine':
        if (!data) {
          return sendError(res, 'Missing required data', 400);
        }
        
        // Convert Gemini format to Notion format if needed
        let wineData: WineData;
        if (data.Name || data['Region/Producer'] || data['Varietal(품종)']) {
          // This looks like Gemini WineInfo format (new schema)
          wineData = convertWineInfoToWineData(data as WineInfo);
        } else {
          // Already in WineData format or similar
          wineData = data as WineData;
        }
        
        // Add current date as purchased_date and set status to "재고"
        const enrichedWineData: WineData = {
          ...wineData,
          'Purchase date': new Date().toISOString().split('T')[0], // YYYY-MM-DD format
          Status: '재고'
        };
        
        result = await saveWineToNotion(enrichedWineData, source);
        break;

      case 'save_receipt':
        if (!data) {
          return sendError(res, 'Missing required data', 400);
        }
        
        // Convert Gemini format to Notion format if needed
        let receiptData: ReceiptData;
        if (data.store_name && data.items) {
          // This looks like Gemini ReceiptInfo format
          receiptData = convertReceiptInfoToReceiptData(data as ReceiptInfo);
        } else {
          // Already in ReceiptData format
          receiptData = data as ReceiptData;
        }
        
        // Ensure current date is set
        const enrichedReceiptData: ReceiptData = {
          ...receiptData,
          date: new Date().toISOString().split('T')[0] // YYYY-MM-DD format
        };
        
        result = await saveReceiptToNotion(enrichedReceiptData);
        break;

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
        
        if (cleanupResponse.ok) {
          console.log('✅ [NOTION] Blob cleanup successful for:', imageUrl);
        } else {
          console.warn('⚠️ [NOTION] Blob cleanup failed:', cleanupResponse.statusText);
        }
      } catch (cleanupError) {
        console.warn('⚠️ [NOTION] Blob cleanup error:', cleanupError);
        // Don't fail the main operation if cleanup fails
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