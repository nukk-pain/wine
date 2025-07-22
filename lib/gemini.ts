import { GoogleGenAI } from '@google/genai';
import { NotionWineProperties } from './notion-schema';

// Initialize Gemini API with new package
const genai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
});

// Wine information schema - updated to match Notion properties exactly
export interface WineInfo extends NotionWineProperties {
  // Additional fields that might be extracted but not stored in Notion
  country?: string;
  alcohol_content?: string;
  volume?: string;
  wine_type?: string;
  appellation?: string;
  notes?: string;
}

// Receipt information schema
export interface ReceiptInfo {
  store_name: string;
  purchase_date?: string;
  items: Array<{
    wine_name: string;
    quantity: number;
    price: number;
    vintage?: number;
  }>;
  total_amount?: number;
  currency?: string;
}

// Legacy interface for compatibility
export interface WineData {
  name: string;
  vintage: number;
  producer?: string;
  region?: string;
  grape_variety?: string;
  [key: string]: any;
}

export class GeminiService {
  private model = 'gemini-2.5-flash-lite-preview-06-17';

  async extractWineInfo(imageBuffer: Buffer, mimeType: string): Promise<WineInfo> {
    try {
      // Development logging
      if (process.env.NODE_ENV === 'development') {
        console.log('🍷 [Gemini] Starting wine label analysis...');
        console.log('📊 [Gemini] Image size:', imageBuffer.length, 'bytes');
        console.log('🎯 [Gemini] MIME type:', mimeType);
        console.log('🤖 [Gemini] Using model:', this.model);
      }
      const prompt = `You are a wine expert. Analyze this wine label image and extract information that matches these specific database fields:

      REQUIRED FIELDS (for Notion database):
      - Name: The wine name
      - Vintage: Year as number (or null if not visible)
      - Region/Producer: Region and/or producer name combined
      - Price: Price if visible on label (often not present)
      - Quantity: Number of bottles (usually 1 for label images)
      - Store: Store name if visible (often not on wine labels)
      - Varietal(품종): Array of grape varieties (e.g., ["Cabernet Sauvignon", "Merlot"])
      - Image: Will be handled separately
      
      ADDITIONAL CONTEXT (for reference but not stored):
      - Country, alcohol content, volume, wine type, appellation
      
      Return JSON with exact field names for Notion database:
      {
        "Name": "wine name (required)",
        "Vintage": year_as_number_or_null,
        "Region/Producer": "region and/or producer combined",
        "Price": price_as_number_or_null,
        "Quantity": 1,
        "Store": "store_name_or_empty_string",
        "Varietal(품종)": ["grape1", "grape2"] or [],
        "country": "country (for reference)",
        "alcohol_content": "alcohol % (for reference)",
        "volume": "volume (for reference)",
        "wine_type": "type (for reference)",
        "appellation": "appellation (for reference)",
        "notes": "any other info (for reference)"
      }
      
      Focus on extracting the Notion database fields accurately. Use null for numbers that are not found, empty string for text that is not found, and empty array for varietal if not found.`;

      const contents = [
        {
          role: 'user' as const,
          parts: [
            {
              text: prompt,
            },
            {
              inlineData: {
                data: imageBuffer.toString('base64'),
                mimeType: mimeType,
              },
            },
          ],
        },
      ];

      const config = {
        responseMimeType: 'application/json',
      };

      if (process.env.NODE_ENV === 'development') {
        console.log('⚡ [Gemini] Making API request to Gemini...');
        console.time('⏱️ [Gemini] Wine analysis duration');
      }

      const response = await genai.models.generateContent({
        model: this.model,
        config,
        contents,
      });

      if (process.env.NODE_ENV === 'development') {
        console.timeEnd('⏱️ [Gemini] Wine analysis duration');
        console.log('✅ [Gemini] Received response from Gemini API');
      }

      const text = response.text;
      if (!text) {
        throw new Error('No response from Gemini');
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('📝 [Gemini] Raw response length:', text.length, 'characters');
        console.log('🔍 [Gemini] Raw response preview:', text.substring(0, 200) + '...');
      }

      const wineInfo = JSON.parse(text) as WineInfo;
      
      if (process.env.NODE_ENV === 'development') {
        console.log('🎉 [Gemini] Successfully parsed wine info:');
        console.log('   Wine Name:', wineInfo.Name);
        console.log('   Region/Producer:', wineInfo['Region/Producer']);
        console.log('   Vintage:', wineInfo.Vintage);
        console.log('   Varietals:', wineInfo['Varietal(품종)']);
      }

      return wineInfo;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ [Gemini] Wine analysis error:', error);
        console.error('   Error type:', error instanceof Error ? error.constructor.name : typeof error);
        console.error('   Error message:', error instanceof Error ? error.message : String(error));
      }
      throw error;
    }
  }

  async extractReceiptInfo(imageBuffer: Buffer, mimeType: string): Promise<ReceiptInfo> {
    try {
      // Development logging
      if (process.env.NODE_ENV === 'development') {
        console.log('🧾 [Gemini] Starting receipt analysis...');
        console.log('📊 [Gemini] Image size:', imageBuffer.length, 'bytes');
        console.log('🎯 [Gemini] MIME type:', mimeType);
      }
      const prompt = `Analyze this receipt image and extract wine purchase information:
      - Store name
      - Purchase date
      - Wine items (name, quantity, price, vintage if mentioned)
      - Total amount
      - Currency
      
      Return the information in JSON format:
      {
        "store_name": "store name",
        "purchase_date": "date or null",
        "items": [
          {
            "wine_name": "wine name",
            "quantity": 1,
            "price": 0.00,
            "vintage": year or null
          }
        ],
        "total_amount": 0.00,
        "currency": "USD or other"
      }
      
      Only include items that appear to be wine or alcohol. If you cannot find specific information, use null.`;

      const contents = [
        {
          role: 'user' as const,
          parts: [
            {
              text: prompt,
            },
            {
              inlineData: {
                data: imageBuffer.toString('base64'),
                mimeType: mimeType,
              },
            },
          ],
        },
      ];

      const config = {
        responseMimeType: 'application/json',
      };

      if (process.env.NODE_ENV === 'development') {
        console.log('⚡ [Gemini] Making API request for receipt analysis...');
        console.time('⏱️ [Gemini] Receipt analysis duration');
      }

      const response = await genai.models.generateContent({
        model: this.model,
        config,
        contents,
      });

      if (process.env.NODE_ENV === 'development') {
        console.timeEnd('⏱️ [Gemini] Receipt analysis duration');
        console.log('✅ [Gemini] Received response from Gemini API');
      }

      const text = response.text;
      if (!text) {
        throw new Error('No response from Gemini');
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('📝 [Gemini] Raw response length:', text.length, 'characters');
      }

      const receiptInfo = JSON.parse(text) as ReceiptInfo;
      
      if (process.env.NODE_ENV === 'development') {
        console.log('🎉 [Gemini] Successfully parsed receipt info:');
        console.log('   Store:', receiptInfo.store_name);
        console.log('   Items count:', receiptInfo.items?.length || 0);
        console.log('   Total amount:', receiptInfo.total_amount);
      }

      return receiptInfo;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ [Gemini] Receipt analysis error:', error);
        console.error('   Error type:', error instanceof Error ? error.constructor.name : typeof error);
        console.error('   Error message:', error instanceof Error ? error.message : String(error));
      }
      throw error;
    }
  }

  async classifyImage(imageBuffer: Buffer, mimeType: string): Promise<'wine_label' | 'receipt' | 'unknown'> {
    try {
      // Development logging
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 [Gemini] Starting image classification...');
        console.log('📊 [Gemini] Image size:', imageBuffer.length, 'bytes');
      }
      const prompt = `Look at this image and classify it as one of the following:
      1. "wine_label" - if it's a wine bottle label
      2. "receipt" - if it's a purchase receipt or invoice
      3. "unknown" - if it's neither
      
      Respond with only one word: wine_label, receipt, or unknown`;

      const contents = [
        {
          role: 'user' as const,
          parts: [
            {
              text: prompt,
            },
            {
              inlineData: {
                data: imageBuffer.toString('base64'),
                mimeType: mimeType,
              },
            },
          ],
        },
      ];

      const config = {
        responseMimeType: 'text/plain',
      };

      if (process.env.NODE_ENV === 'development') {
        console.log('⚡ [Gemini] Making classification request...');
      }

      const response = await genai.models.generateContent({
        model: this.model,
        config,
        contents,
      });

      const classification = response.text?.trim().toLowerCase();
      
      if (process.env.NODE_ENV === 'development') {
        console.log('🏷️ [Gemini] Classification result:', classification);
      }
      
      if (classification === 'wine_label' || classification === 'receipt') {
        return classification;
      }
      
      return 'unknown';
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ [Gemini] Classification error:', error);
      }
      return 'unknown';
    }
  }
}

export const geminiService = new GeminiService();

// Legacy function for compatibility - updated to use new API
export async function refineWineDataWithGemini(ocrText: string): Promise<WineData> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY environment variable is not set');
  }

  const prompt = `You are a wine expert. Parse the following OCR text from a wine label and extract structured information.
  
OCR Text:
${ocrText}

Return a JSON object with the following structure:
{
  "name": "wine name",
  "vintage": year as number,
  "producer": "producer name",
  "region": "region",
  "grape_variety": "grape variety"
}

Important: Return ONLY the JSON object, no additional text or explanation.`;

  try {
    const contents = [
      {
        role: 'user' as const,
        parts: [
          {
            text: prompt,
          },
        ],
      },
    ];

    const config = {
      responseMimeType: 'application/json',
    };

    const response = await genai.models.generateContent({
      model: 'gemini-2.5-flash-lite-preview-06-17',
      config,
      contents,
    });

    const text = response.text;
    if (!text) {
      throw new Error('No response from Gemini');
    }

    const parsedData = JSON.parse(text);
    
    // Validate the response has required fields
    if (!parsedData.name || typeof parsedData.vintage !== 'number') {
      throw new Error('Invalid wine data structure from Gemini');
    }

    return parsedData;
  } catch (error) {
    console.error('Error in refineWineDataWithGemini:', error);
    throw error;
  }
}