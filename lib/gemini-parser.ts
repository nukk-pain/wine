import { NotionWineProperties, validateWineData } from './notion-schema';
import { WineInfo, ReceiptInfo, geminiService } from './gemini';

export interface ParsedWineData {
  notionData: NotionWineProperties;
  additionalInfo: {
    country?: string;
    alcohol_content?: string;
    volume?: string;
    wine_type?: string;
    appellation?: string;
    notes?: string;
  };
  validation: {
    isValid: boolean;
    errors: string[];
  };
}

export interface ParsedReceiptData {
  wines: ParsedWineData[];
  receiptInfo: {
    store: string;
    date?: string;
    total_amount?: number;
    currency?: string;
  };
}

export class NotionCompatibleParser {
  async parseWineLabelForNotion(imageBuffer: Buffer, mimeType: string, imageUrl?: string): Promise<ParsedWineData> {
    try {
      const wineInfo = await geminiService.extractWineInfo(imageBuffer, mimeType);
      
      // Extract Notion-compatible fields
      const notionData: NotionWineProperties = {
        'Name': wineInfo.Name || '',
        'Vintage': wineInfo.Vintage || null,
        'Region/Producer': wineInfo['Region/Producer'] || '',
        'Price': wineInfo.Price || null,
        'Quantity': wineInfo.Quantity || 1, // Default to 1 for wine labels
        'Store': wineInfo.Store || '',
        'Varietal(품종)': wineInfo['Varietal(품종)'] || [],
        'Image': imageUrl || null
      };

      // Extract additional context info
      const additionalInfo = {
        country: wineInfo.country,
        alcohol_content: wineInfo.alcohol_content,
        volume: wineInfo.volume,
        wine_type: wineInfo.wine_type,
        appellation: wineInfo.appellation,
        notes: wineInfo.notes
      };

      // Validate the data
      const validation = validateWineData(notionData);

      return {
        notionData,
        additionalInfo,
        validation
      };
    } catch (error) {
      console.error('Error parsing wine label:', error);
      throw new Error(`Failed to parse wine label: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async parseReceiptForNotion(imageBuffer: Buffer, mimeType: string): Promise<ParsedReceiptData> {
    try {
      const receiptInfo = await geminiService.extractReceiptInfo(imageBuffer, mimeType);
      
      const wines: ParsedWineData[] = [];
      
      // Convert receipt items to Notion-compatible wine entries
      for (const item of receiptInfo.items || []) {
        const notionData: NotionWineProperties = {
          'Name': item.wine_name || '',
          'Vintage': item.vintage || null,
          'Region/Producer': '', // Usually not available in receipts
          'Price': item.price || null,
          'Quantity': item.quantity || 1,
          'Store': receiptInfo.store_name || '',
          'Varietal(품종)': [], // Usually not detailed in receipts
          'Image': null
        };

        const validation = validateWineData(notionData);

        wines.push({
          notionData,
          additionalInfo: {},
          validation
        });
      }

      return {
        wines,
        receiptInfo: {
          store: receiptInfo.store_name || '',
          date: receiptInfo.purchase_date,
          total_amount: receiptInfo.total_amount,
          currency: receiptInfo.currency
        }
      };
    } catch (error) {
      console.error('Error parsing receipt:', error);
      throw new Error(`Failed to parse receipt: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async parseImageForNotion(
    imageBuffer: Buffer, 
    mimeType: string, 
    imageUrl?: string
  ): Promise<{
    type: 'wine_label' | 'receipt' | 'unknown';
    data: ParsedWineData | ParsedReceiptData | null;
  }> {
    try {
      // First classify the image
      const imageType = await geminiService.classifyImage(imageBuffer, mimeType);
      
      let data: ParsedWineData | ParsedReceiptData | null = null;
      
      if (imageType === 'wine_label') {
        data = await this.parseWineLabelForNotion(imageBuffer, mimeType, imageUrl);
      } else if (imageType === 'receipt') {
        data = await this.parseReceiptForNotion(imageBuffer, mimeType);
      }
      
      return {
        type: imageType,
        data
      };
    } catch (error) {
      console.error('Error in parseImageForNotion:', error);
      throw error;
    }
  }
}

export const notionParser = new NotionCompatibleParser();

// Helper function to merge wine data with user edits
export function mergeWineDataWithEdits(
  originalData: NotionWineProperties,
  userEdits: Partial<NotionWineProperties>
): NotionWineProperties {
  return {
    ...originalData,
    ...userEdits
  };
}

// Helper function to prepare data for Notion API
export function prepareForNotionSubmission(wineData: NotionWineProperties) {
  // Ensure required fields have valid values
  const prepared: NotionWineProperties = {
    'Name': wineData.Name?.trim() || 'Unknown Wine',
    'Vintage': wineData.Vintage,
    'Region/Producer': wineData['Region/Producer']?.trim() || '',
    'Price': wineData.Price,
    'Quantity': wineData.Quantity || 1,
    'Store': wineData.Store?.trim() || '',
    'Varietal(품종)': wineData['Varietal(품종)'] || [],
    'Image': wineData.Image
  };

  return prepared;
}