// pages/api/notion.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { saveWineToNotion, saveReceiptToNotion, updateWineRecord, WineData, ReceiptData, saveWineToNotionV2 } from '@/lib/notion';
import { WineInfo, ReceiptInfo } from '@/lib/gemini';
import { NotionWineProperties, validateWineData } from '@/lib/notion-schema';

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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (!['POST', 'PUT'].includes(req.method || '')) {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }

  try {
    const { action, data, source, pageId, status } = req.body;

    if (!action) {
      return res.status(400).json({
        success: false,
        error: 'Missing action'
      });
    }

    let result;

    switch (action) {
      case 'save_wine_v2':
        // New API for NotionWineProperties
        if (!data) {
          return res.status(400).json({
            success: false,
            error: 'Missing required wine data'
          });
        }

        const validation = validateWineData(data as NotionWineProperties);
        if (!validation.isValid) {
          return res.status(400).json({ 
            success: false,
            error: 'Invalid wine data', 
            details: validation.errors 
          });
        }

        result = await saveWineToNotionV2(data as NotionWineProperties);
        break;

      case 'save_wine':
        if (!data) {
          return res.status(400).json({
            success: false,
            error: 'Missing required data'
          });
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
          return res.status(400).json({
            success: false,
            error: 'Missing required data'
          });
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
          return res.status(400).json({
            success: false,
            error: 'Missing pageId or status'
          });
        }
        result = await updateWineRecord(pageId, status);
        break;

      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid action'
        });
    }

    res.status(200).json({
      success: true,
      result
    });

  } catch (error) {
    console.error('Notion API error:', error);
    res.status(500).json({
      success: false,
      error: 'Notion operation failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}