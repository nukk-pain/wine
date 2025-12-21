import { NotionWineProperties, validateWineData } from './utils/notion-helpers';
import { WineInfo } from '@/types';
import { geminiService } from './gemini';

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
      const result = await geminiService.extractWineInfo(imageBuffer, mimeType);

      if (!result.ok) {
        console.warn('Gemini validation failed:', result.reason);
        // Continue with data anyway
      }

      const wineInfo = result.data;

      // Extract Notion-compatible fields
      const notionData: NotionWineProperties = {
        'Name': wineInfo.Name || '',
        'Vintage': wineInfo.Vintage || null,
        'Producer': wineInfo.Producer || '',            // C: 생산자 (분리)
        'Region': wineInfo.Region || '',                // D: 지역 (분리)
        'Price': wineInfo.Price || null,
        'Quantity': wineInfo.Quantity || 1, // Default to 1 for wine labels
        'Store': wineInfo.Store || '',
        'Varietal(품종)': wineInfo['Varietal(품종)'] || [],
        'Image': imageUrl || null,
        'Country(국가)': wineInfo.country || '',
        'Appellation(원산지명칭)': wineInfo.appellation || '',
        'Notes(메모)': wineInfo.notes || ''
      };

      // Extract additional context info (still kept for backward compatibility)
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

  /* parseReceiptForNotion removed for deprecation */

  async parseImageForNotion(
    imageBuffer: Buffer,
    mimeType: string,
    imageUrl?: string
  ): Promise<{
    type: 'wine_label' | 'receipt' | 'unknown';
    data: ParsedWineData | ParsedReceiptData | null;
  }> {
    try {
      // Deprecated: Classification is skipped, default to wine_label
      const imageType = 'wine_label';

      let data: ParsedWineData | ParsedReceiptData | null = null;

      if (imageType === 'wine_label') {
        data = await this.parseWineLabelForNotion(imageBuffer, mimeType, imageUrl);
      }
      // Removed receipt handling

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
    'Producer': wineData.Producer?.trim() || '',       // C: 생산자 (분리)
    'Region': wineData.Region?.trim() || '',           // D: 지역 (분리)
    'Price': wineData.Price,
    'Quantity': wineData.Quantity || 1,
    'Store': wineData.Store?.trim() || '',
    'Varietal(품종)': wineData['Varietal(품종)'] || [],
    'Image': wineData.Image,
    'Country(국가)': wineData['Country(국가)']?.trim() || '',
    'Appellation(원산지명칭)': wineData['Appellation(원산지명칭)']?.trim() || '',
    'Notes(메모)': wineData['Notes(메모)']?.trim() || ''
  };

  return prepared;
}