import { GoogleGenAI } from '@google/genai';
import { WineInfo } from '@/types';

// Initialize Gemini API with new package
const genai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
});

// Wine information schema - updated to match Notion properties exactly
/* WineInfo imported from @/types */

// Receipt information schema
/* ReceiptInfo removed */

// Legacy interface for compatibility - extended to match enhanced extraction
export interface WineData {
  name: string;
  vintage?: number | null;
  producer?: string;
  region?: string;
  grape_variety?: string;
  varietal_reasoning?: string;
  country?: string;
  alcohol_content?: string;
  volume?: string;
  wine_type?: string;
  appellation?: string;
  notes?: string;
  [key: string]: any;
}

export class GeminiService {
  private model = 'gemini-3-flash-preview';

  async extractWineInfo(imageBuffer: Buffer, mimeType: string): Promise<WineInfo> {
    try {
      // Development logging
      if (process.env.NODE_ENV === 'development') {
        console.log('🍷 [Gemini] Starting wine label analysis...');
        console.log('📊 [Gemini] Image size:', imageBuffer.length, 'bytes');
        console.log('🎯 [Gemini] MIME type:', mimeType);
        console.log('🤖 [Gemini] Using model:', this.model);
      }
      const prompt = `Analyze this wine label image and extract information into a structured JSON format.

Think step-by-step:
1. Identify all text on the label
2. Distinguish between brand/producer name and wine product name
3. Extract grape variety (explicit or infer from appellation/region)
4. Identify region, country, and any special designations

Required JSON format:
{
  "Name": "wine product name (NOT including brand/producer)",
  "Vintage": year_or_null,
  "Region/Producer": "producer and region (NOT wine name)",
  "Price": null,
  "Quantity": 1,
  "Store": "",
  "Varietal(품종)": ["array of grape varieties"],
  "varietal_reasoning": "how you determined the variety",
  "country": "country name",
  "alcohol_content": "percentage if visible",
  "volume": "bottle size if visible",
  "wine_type": "Red/White/Rosé/Sparkling/Dessert",
  "appellation": "official appellation if present",
  "notes": "special designations: Reserve, Organic, etc."
}

Key rules:
- Name: Product name only (e.g., "Hacienda de Sierra Bella" NOT "Las Condes Hacienda de Sierra Bella")
- Region/Producer: Brand + region (e.g., "Las Condes, Chile")
- Varietal: Extract from label OR infer from appellation (Sancerre→Sauvignon Blanc, Barolo→Nebbiolo, etc.)
- Return valid JSON only, no additional text`;

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
        thinkingLevel: 'low', // Reduced thinking for faster response
      };

      if (process.env.NODE_ENV === 'development') {
        console.log('⚡ [Gemini] Making API request to Gemini...');
        console.log('🧠 [Gemini] Thinking level: low (faster response)');
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

  /* extractReceiptInfo removed for deprecation */

  /* classifyImage removed for deprecation */
}

export const geminiService = new GeminiService();

// Legacy function for compatibility - upgraded to match new extraction schema
export async function refineWineDataWithGemini(ocrText: string): Promise<WineData> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY environment variable is not set');
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('\n========================================');
    console.log('🔄 [Gemini OCR Refinement] STARTING');
    console.log('========================================');
    console.log('📝 OCR Text Input:');
    console.log('---');
    console.log(ocrText);
    console.log('---');
    console.log(`📊 OCR Text Length: ${ocrText.length} characters\n`);
  }

  const prompt = `Analyze this OCR text from a wine label and extract information into structured JSON.

OCR Text:
${ocrText}

Think step-by-step:
1. Identify all text elements
2. Distinguish brand/producer from wine product name
3. Extract or infer grape variety
4. Identify region, country, special designations

Required JSON format:
{
  "name": "wine product name (NOT including brand/producer)",
  "vintage": year_or_null,
  "producer": "producer/brand name",
  "region": "region name",
  "grape_variety": "grape variety (extract or infer from appellation)",
  "varietal_reasoning": "how you determined the variety",
  "country": "country name",
  "alcohol_content": "alcohol % if present",
  "volume": "bottle size if present",
  "wine_type": "Red/White/Rosé/Sparkling/Dessert",
  "appellation": "appellation if present",
  "notes": "special designations: Reserve, Organic, etc."
}

Key rules:
- name: Product name only (e.g., "Hacienda de Sierra Bella" NOT "Las Condes Hacienda de Sierra Bella")
- producer: Brand name only (e.g., "Las Condes")
- region/country: Separate fields (e.g., region: "Central Valley", country: "Chile")
- grape_variety: Extract from text OR infer from appellation (Sancerre→Sauvignon Blanc, Barolo→Nebbiolo)
- Return valid JSON only, no additional text`;

  try {
    if (process.env.NODE_ENV === 'development') {
      console.log('📤 [Gemini] SENDING PROMPT:');
      console.log('---');
      console.log(prompt);
      console.log('---\n');
      console.log('🤖 [Gemini] Model: gemini-3-flash-preview');
      console.log('🧠 [Gemini] Thinking Level: low (faster response)');
      console.time('⏱️ [Gemini] API Call Duration');
    }

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
      thinkingLevel: 'low', // Reduced thinking for faster response
    };

    const response = await genai.models.generateContent({
      model: 'gemini-3-flash-preview',
      config,
      contents,
    });

    if (process.env.NODE_ENV === 'development') {
      console.timeEnd('⏱️ [Gemini] API Call Duration');
    }

    const text = response.text;
    if (!text) {
      throw new Error('No response from Gemini');
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('\n📥 [Gemini] RAW RESPONSE:');
      console.log('---');
      console.log(text);
      console.log('---\n');
    }

    const parsedData = JSON.parse(text);

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ [Gemini] PARSED RESULT:');
      console.log(JSON.stringify(parsedData, null, 2));
      console.log('\n🎯 Key Fields:');
      console.log('   Name:', parsedData.name);
      console.log('   Producer:', parsedData.producer);
      console.log('   Region:', parsedData.region);
      console.log('   Country:', parsedData.country);
      console.log('   Vintage:', parsedData.vintage);
      console.log('   Grape Variety:', parsedData.grape_variety);
      console.log('   Varietal Reasoning:', parsedData.varietal_reasoning);
      console.log('========================================\n');
    }

    // Validate the response has required fields
    if (!parsedData.name) {
      throw new Error('Invalid wine data structure from Gemini (missing name)');
    }

    return parsedData;
  } catch (error) {
    console.error('❌ [Gemini Refinement] Error:', error);
    throw error;
  }
}