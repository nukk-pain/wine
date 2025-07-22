import { GoogleGenAI } from '@google/genai';

// Initialize Gemini API with new package
const genai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
});

// Wine information schema
export interface WineInfo {
  name: string;
  producer: string;
  vintage?: number;
  region?: string;
  country?: string;
  grape_variety?: string;
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
      const prompt = `You are a wine expert. Analyze this wine label image and extract the following information:
      - Wine name
      - Producer/winery name
      - Vintage year (if visible)
      - Region
      - Country
      - Grape variety
      - Alcohol content
      - Volume (e.g., 750ml)
      - Wine type (red, white, rosé, sparkling, etc.)
      - Appellation or classification
      - Any notable information
      
      Return the information in JSON format with these keys:
      {
        "name": "wine name",
        "producer": "producer name",
        "vintage": year or null,
        "region": "region or null",
        "country": "country or null",
        "grape_variety": "grape variety or null",
        "alcohol_content": "alcohol % or null",
        "volume": "volume or null",
        "wine_type": "type or null",
        "appellation": "appellation or null",
        "notes": "any other notable information or null"
      }
      
      If you cannot find a specific piece of information, use null for that field.`;

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
        console.log('   Wine Name:', wineInfo.name);
        console.log('   Producer:', wineInfo.producer);
        console.log('   Vintage:', wineInfo.vintage);
        console.log('   Region:', wineInfo.region);
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