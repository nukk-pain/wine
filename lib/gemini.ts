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
  private model = 'gemini-2.5-flash';

  async extractWineInfo(imageBuffer: Buffer, mimeType: string): Promise<WineInfo> {
    try {
      // Development logging
      if (process.env.NODE_ENV === 'development') {
        console.log('🍷 [Gemini] Starting wine label analysis...');
        console.log('📊 [Gemini] Image size:', imageBuffer.length, 'bytes');
        console.log('🎯 [Gemini] MIME type:', mimeType);
        console.log('🤖 [Gemini] Using model:', this.model);
      }
      const prompt = `You are a knowledgeable AI wine sommelier. Your task is to analyze a wine label image and populate a JSON object with specific information.

### Crucial Rule for "Varietal(품종)" field
This is the most important instruction.
1.  **First, try to extract** the grape varietal(s) directly from the text on the label.
2.  **If the varietal is NOT explicitly written on the label, you MUST use your expert knowledge to INFER it** from the wine's appellation, region, or name. This is a required step.
3.  **Provide your reasoning** in the "varietal_reasoning" field.
4.  If the varietal cannot be extracted or reasonably inferred (e.g., for a generic table wine blend), and only then, return an empty array "[]".

**Examples of required inference:**
* If "appellation" is "Sancerre", "Varietal(품종)" must be ["Sauvignon Blanc"].
* If "appellation" is "Barolo", "Varietal(품종)" must be ["Nebbiolo"].
* If "appellation" is "Chablis", "Varietal(품종)" must be ["Chardonnay"].
* If "name" or "region" includes "Chianti Classico", "Varietal(품종)" should include ["Sangiovese"].

### Important Rule for "notes" field
Extract special designations and production information visible on the label. Focus on:
1. **Wine tier/classification**: Reserve, Grand Reserve, Gran Reserva, Riserva, Grand Cru, Premier Cru, Estate, Single Vineyard, Old Vines, etc.
2. **Certifications**: Organic, Biodynamic, Sustainable, Vegan, Natural Wine, etc.
3. **Production methods**: Barrel aged (with duration), Oak aged, Stainless steel, Unfiltered, Unfined, Hand-harvested, Estate bottled, etc.
4. **Awards/Medals**: Gold Medal, Silver Medal, 90+ points, Competition awards visible on label
5. **Special series**: Limited Edition, Special Selection, Winemaker's Reserve, etc.

Format as a brief comma-separated list. If multiple items exist, include the most important ones.
Examples:
- "Reserve, 18 months oak aged, Organic certified"
- "Grand Cru, Estate bottled, Gold Medal 2023"
- "Single Vineyard, Hand-harvested, Unfiltered"
- If none of these special designations are visible, return empty string ""

### JSON Output Structure
Return a single, clean JSON object. Do not add any text before or after the JSON.

{
  "Name": "wine name (required)",
  "Vintage": "year_as_number_or_null",
  "Region/Producer": "region and/or producer combined",
  "Price": "price_as_number_or_null",
  "Quantity": 1,
  "Store": "store_name_or_empty_string",
  "Varietal(품종)": ["grape1", "grape2"],
  "varietal_reasoning": "State how you found the varietal (e.g., \"Extracted from label\", \"Inferred from Sancerre appellation\")",
  "country": "country name",
  "alcohol_content": "alcohol % as string",
  "volume": "bottle volume (e.g., 750ml)",
  "wine_type": "Red/White/Rosé/Sparkling/Dessert",
  "appellation": "official appellation if visible",
  "notes": "special designations as comma-separated list (see instructions above)"
}`;

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

      console.log('📝 [Gemini] Raw response length:', text.length, 'characters');
      console.log('🔍 [Gemini] Raw response preview:', text.substring(0, 500));

      const wineInfo = JSON.parse(text) as WineInfo;
      
      if (process.env.NODE_ENV === 'development') {
        console.log('🎉 [Gemini] Successfully parsed wine info:');
        console.log('   Raw parsed data:', JSON.stringify(wineInfo, null, 2));
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