// pages/api/process.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { processWineImage } from '@/lib/vision';
import { saveWineToNotion, saveReceiptToNotion } from '@/lib/notion';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { imageUrl, action } = req.body;

  if (!imageUrl || action !== 'process_image') {
    return res.status(400).json({ 
      success: false, 
      error: 'Missing required parameters: imageUrl and action' 
    });
  }

  try {
    // Process the image using vision API
    const visionResult = await processWineImage(imageUrl);

    let notionResult;

    if (visionResult.imageType === 'wine_label') {
      // Save wine label data to Notion
      notionResult = await saveWineToNotion(visionResult.data, 'wine_label');
      
      return res.status(200).json({
        success: true,
        data: {
          type: visionResult.imageType,
          extractedData: visionResult.data,
          notionResult: notionResult
        }
      });
    } else if (visionResult.imageType === 'receipt') {
      // Save receipt data as multiple entries to Notion
      const notionResults = await saveReceiptToNotion(visionResult.data);
      
      return res.status(200).json({
        success: true,
        data: {
          type: visionResult.imageType,
          extractedData: visionResult.data,
          notionResults: notionResults
        }
      });
    } else {
      return res.status(400).json({
        success: false,
        error: 'Unsupported image type'
      });
    }

  } catch (error) {
    console.error('Process API error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
}