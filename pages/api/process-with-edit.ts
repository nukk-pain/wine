import { NextApiRequest, NextApiResponse } from 'next';
import { notionParser } from '../../lib/gemini-parser';
import fs from 'fs';
import path from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { filePath, fileUrl } = req.body;

    if (!filePath && !fileUrl) {
      return res.status(400).json({ error: 'File path or URL is required' });
    }

    let imageBuffer: Buffer;
    let mimeType: string;

    if (filePath) {
      // Read local file
      const fullPath = path.resolve(filePath);
      if (!fs.existsSync(fullPath)) {
        return res.status(404).json({ error: 'File not found' });
      }
      
      imageBuffer = fs.readFileSync(fullPath);
      const ext = path.extname(fullPath).toLowerCase();
      mimeType = ext === '.png' ? 'image/png' : 
                 ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' :
                 ext === '.webp' ? 'image/webp' : 'image/jpeg';
    } else if (fileUrl) {
      // Fetch remote file
      const response = await fetch(fileUrl);
      if (!response.ok) {
        return res.status(400).json({ error: 'Failed to fetch image from URL' });
      }
      
      imageBuffer = Buffer.from(await response.arrayBuffer());
      mimeType = response.headers.get('content-type') || 'image/jpeg';
    } else {
      return res.status(400).json({ error: 'Invalid file source' });
    }

    console.log('Processing image with Notion-compatible parser...');
    console.log('Image size:', imageBuffer.length, 'bytes');
    console.log('MIME type:', mimeType);

    // Parse image for Notion compatibility
    const result = await notionParser.parseImageForNotion(imageBuffer, mimeType, fileUrl);

    if (result.type === 'unknown') {
      return res.status(400).json({ 
        error: 'Unable to classify image. Please upload a wine label or receipt image.' 
      });
    }

    console.log('Successfully parsed image:', {
      type: result.type,
      hasData: !!result.data
    });

    // Return parsed data for user editing
    res.status(200).json({
      success: true,
      imageType: result.type,
      parsedData: result.data
    });

  } catch (error) {
    console.error('Error in process-with-edit API:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    res.status(500).json({ 
      success: false,
      error: `Processing failed: ${errorMessage}`
    });
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};