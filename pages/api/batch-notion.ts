// pages/api/batch-notion.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { saveWineToNotion, saveReceiptToNotion } from '@/lib/notion';
import { normalizeWineData } from '@/lib/data-normalizer';

interface WineData {
  wine_name?: string;
  vintage?: number;
  producer?: string;
  region?: string;
  varietal?: string;
  price?: number;
  quantity?: number;
}

interface BatchNotionItem {
  id: string;
  type: 'wine_label' | 'receipt';
  extractedData: WineData | any;
  imageUrl?: string; // For Vercel Blob cleanup
}

interface BatchNotionRequest {
  operation: 'save_all' | 'save_selected';
  items: BatchNotionItem[];
  selectedIds?: string[];
}

interface BatchSaveResult {
  id: string;
  itemId: string; // Same as id, for consistency
  success: boolean;
  notionResult?: any;
  error?: string;
}


interface BatchNotionResponse {
  success: boolean;
  totalItems: number;
  savedCount: number;
  failedCount: number;
  results: BatchSaveResult[];
  error?: string;
  processedAt: string;
}

// Save single item to Notion
async function saveSingleItem(item: BatchNotionItem): Promise<BatchSaveResult> {
  try {
    if (process.env.NODE_ENV === 'development') {
      console.log(`💾 [BATCH-NOTION] Saving item ${item.id} (${item.type})`);
    }

    let notionResult: any;

    if (item.type === 'wine_label') {
      // Normalize data to ensure correct types
      const normalizedData = normalizeWineData(item.extractedData);
      notionResult = await saveWineToNotion(normalizedData, 'wine_label');
    } else if (item.type === 'receipt') {
      notionResult = await saveReceiptToNotion(item.extractedData);
    } else {
      throw new Error(`Unsupported item type: ${item.type}`);
    }

    return {
      id: item.id,
      itemId: item.id,
      success: true,
      notionResult
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    console.error('Single item save error:', { 
      id: item.id,
      type: item.type,
      error: errorMessage
    });

    return {
      id: item.id,
      itemId: item.id,
      success: false,
      error: errorMessage
    };
  }
}

// Save multiple items to Notion with concurrency control
async function batchSaveItems(
  items: BatchNotionItem[], 
  maxConcurrent: number = 3
): Promise<BatchSaveResult[]> {
  const results: BatchSaveResult[] = [];
  
  // Process in batches to avoid overwhelming Notion API
  for (let i = 0; i < items.length; i += maxConcurrent) {
    const batch = items.slice(i, i + maxConcurrent);
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`💾 [BATCH-NOTION] Processing save batch ${Math.floor(i / maxConcurrent) + 1}: ${batch.length} items`);
    }
    
    // Process batch concurrently using Promise.allSettled for safety
    const batchPromises = batch.map(item => saveSingleItem(item));
    const batchResults = await Promise.allSettled(batchPromises);
    
    // Extract results (Promise.allSettled ensures all complete)
    for (const result of batchResults) {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        // Handle rejected promises
        if (process.env.NODE_ENV === 'development') {
          console.error('🚨 [BATCH-NOTION] Unexpected promise rejection in batch:', result.reason);
        }
        results.push({
          id: 'unknown',
          itemId: 'unknown',
          success: false,
          error: result.status === 'rejected' ? 'Promise rejected unexpectedly' : 'Unknown batch save error'
        });
      }
    }
    
    // Add small delay between batches to be gentle on Notion API
    if (i + maxConcurrent < items.length) {
      await new Promise(resolve => setTimeout(resolve, 500)); // 500ms delay
    }
  }
  
  return results;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<BatchNotionResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
      totalItems: 0,
      savedCount: 0,
      failedCount: 0,
      results: [],
      processedAt: new Date().toISOString()
    });
  }

  // Development logging
  if (process.env.NODE_ENV === 'development') {
    console.log('💾 [BATCH-NOTION] Batch save endpoint called');
  }

  try {
    const requestBody: BatchNotionRequest = req.body;
    
    // Validate request
    if (!requestBody.operation || !['save_all', 'save_selected'].includes(requestBody.operation)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid operation. Must be "save_all" or "save_selected"',
        totalItems: 0,
        savedCount: 0,
        failedCount: 0,
        results: [],
        processedAt: new Date().toISOString()
      });
    }

    if (!requestBody.items || !Array.isArray(requestBody.items)) {
      return res.status(400).json({
        success: false,
        error: 'No items provided',
        totalItems: 0,
        savedCount: 0,
        failedCount: 0,
        results: [],
        processedAt: new Date().toISOString()
      });
    }

    if (requestBody.items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No items provided',
        totalItems: 0,
        savedCount: 0,
        failedCount: 0,
        results: [],
        processedAt: new Date().toISOString()
      });
    }

    // Determine which items to save
    let itemsToSave: BatchNotionItem[] = [];
    
    if (requestBody.operation === 'save_all') {
      itemsToSave = requestBody.items;
    } else if (requestBody.operation === 'save_selected') {
      if (!requestBody.selectedIds || requestBody.selectedIds.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No selected items provided for save_selected operation',
          totalItems: 0,
          savedCount: 0,
          failedCount: 0,
          results: [],
          processedAt: new Date().toISOString()
        });
      }
      
      // Filter items by selected IDs
      itemsToSave = requestBody.items.filter(item => 
        requestBody.selectedIds!.includes(item.id)
      );
    }

    if (itemsToSave.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid items to save',
        totalItems: 0,
        savedCount: 0,
        failedCount: 0,
        results: [],
        processedAt: new Date().toISOString()
      });
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('💾 [BATCH-NOTION] Save parameters:');
      console.log('   Operation:', requestBody.operation);
      console.log('   Total items:', requestBody.items.length);
      console.log('   Items to save:', itemsToSave.length);
    }

    // Save items to Notion
    const saveResults = await batchSaveItems(itemsToSave);
    
    // Calculate summary statistics
    const savedCount = saveResults.filter(r => r.success).length;
    const failedCount = saveResults.filter(r => !r.success).length;

    // Cleanup Vercel Blob files for successfully saved items
    if (savedCount > 0) {
      try {
        const successfulItems = saveResults
          .filter(r => r.success)
          .map(r => r.itemId);
        
        const blobUrls = itemsToSave
          .filter(item => successfulItems.includes(item.id))
          .map(item => item.imageUrl)
          .filter(url => url && url.includes('vercel-storage.com')); // Only Vercel Blob URLs
        
        if (blobUrls.length > 0) {
          console.log(`Starting blob cleanup for ${blobUrls.length} successfully saved items`);
          
          // Call cleanup API
          const cleanupResponse = await fetch(`${req.headers.origin || 'http://localhost:3000'}/api/cleanup-blobs`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ urls: blobUrls })
          });
          
          if (cleanupResponse.ok) {
            const cleanupResult = await cleanupResponse.json();
            console.log('Blob cleanup completed:', {
              deletedCount: cleanupResult.deletedCount,
              failedCount: cleanupResult.failedCount
            });
          } else {
            console.warn('Blob cleanup API call failed:', {
              status: cleanupResponse.status,
              statusText: cleanupResponse.statusText
            });
          }
        }
      } catch (cleanupError) {
        console.warn('Blob cleanup failed:', {
          error: cleanupError instanceof Error ? cleanupError.message : 'Unknown cleanup error'
        });
        // Don't fail the main operation if cleanup fails
      }
    }

    console.log('Batch Notion save completed:', {
      operation: requestBody.operation,
      totalItems: itemsToSave.length,
      savedCount,
      failedCount
    });

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ [BATCH-NOTION] Batch save completed');
      console.log(`   Saved: ${savedCount}, Failed: ${failedCount}`);
    }

    return res.status(200).json({
      success: true,
      totalItems: itemsToSave.length,
      savedCount,
      failedCount,
      results: saveResults,
      processedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Batch Notion save API error:', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      totalItems: 0,
      savedCount: 0,
      failedCount: 0,
      results: [],
      processedAt: new Date().toISOString()
    });
  }
}