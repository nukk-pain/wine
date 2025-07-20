// pages/api/notion.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { saveWineToNotion, saveReceiptToNotion, updateWineRecord } from '@/lib/notion';

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
      case 'save_wine':
        if (!data) {
          return res.status(400).json({
            success: false,
            error: 'Missing required data'
          });
        }
        result = await saveWineToNotion(data, source);
        break;

      case 'save_receipt':
        if (!data) {
          return res.status(400).json({
            success: false,
            error: 'Missing required data'
          });
        }
        result = await saveReceiptToNotion(data);
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