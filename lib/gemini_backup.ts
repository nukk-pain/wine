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
      const prompt = `Extract wine-label info into ONE JSON object (JSON only, no extra text).

Steps:
1) Read all visible label text.
2) Identify Producer/Brand vs Product Name (cuvée/style).
3) Extract: vintage year, appellation, designations (Brut/Reserva/etc.), ABV, volume, country.
4) Varietal:
   - If grapes are printed, use them.
   - If not, infer conservatively from appellation/region (max 3) and explain; if unsure, [].

Rules:
- Name = product name ONLY (exclude producer). If no unique cuvée, use descriptive: Appellation + designation/style (e.g., "Cava Brut", "Rioja Reserva"). NEVER empty if any non-producer text exists.
- Region/Producer = "Producer, Region/Appellation" (or just Producer if region/appellation not visible).
- Vintage = 4-digit year else null (NV -> null; mention "NV" in notes if printed).
- Use null when not visible. Do not invent facts.

Return EXACT keys:
{
  "Name": "",
  "Vintage": null,
  "Region/Producer": "",
  "Price": null,
  "Quantity": 1,
  "Store": "",
  "Varietal(품종)": [],
  "varietal_reasoning": "",
  "country": null,
  "alcohol_content": null,
  "volume": null,
  "wine_type": null,
  "appellation": null,
  "notes": ""
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

  const prompt = `Analyze the following OCR text from a wine label and return ONLY one valid JSON object.

OCR Text:
${ocrText}

Do NOT output any extra text, explanations, or markdown—JSON only.

INTERNAL STEPS (do not print):
1) List all meaningful text tokens/lines (ignore obvious noise).
2) Identify producer/brand vs product/cuvée/style vs appellation/region/country vs vintage vs ABV vs volume vs designations.
3) Fill fields using explicit OCR text first; infer only when necessary and be conservative.

EXTRACTION RULES
- vintage: 4-digit year (e.g., 2018) if present, else null. If NV/non-vintage is present, keep null and include "NV" in notes.
- alcohol_content: normalize like "13.5%" if present, else null.
- volume: normalize like "750 mL" / "1.5 L" if present, else null.
- wine_type: one of "Red","White","Rosé","Sparkling","Dessert"; infer only if clear cues exist (e.g., "Brut" -> Sparkling). Else null.
- appellation: official appellation or appellation name if present, else null.
- notes: include designations/certifications/aging terms (Reserva, Crianza, Gran Reserva, Riserva, Brut, Extra Brut, Organic, Biodynamic, Grand Cru, 1er Cru, Single Vineyard, etc.). Keep concise.

NAME / PRODUCER LOGIC (STRICT)
- producer: brand/producer only (winery/house/château/domaine/company). Do NOT include the product name.
- name: product name only (exclude producer).
  - If there is a distinct cuvée/marketing name, use it.
  - If no distinct cuvée name exists, construct a descriptive name from label-supported terms, in this priority:
    1) appellation (e.g., "Barolo", "Sancerre")
    2) designation/style (e.g., "Reserva", "Crianza", "Brut")
    3) grape name if explicitly present (e.g., "Chardonnay")
    4) generic type if present (e.g., "Red Wine", "White Wine")
  - NEVER leave "name" empty if any non-producer text exists.

REGION / COUNTRY (STRICT)
- region: geographic region if present (e.g., "Central Valley"). If only appellation exists and no broader region is present, set region = appellation.
- country: use country if present in OCR. If not present but appellation uniquely implies a country (e.g., Barolo -> Italy), you may infer; otherwise null.

GRAPE VARIETY (STRICT)
- If OCR explicitly lists grapes, use them (comma-separated string if multiple).
- Else infer conservatively from appellation/region typical rules; if multiple common possibilities exist, return a comma-separated shortlist (max 3) and state uncertainty.
- If inference is too uncertain, set grape_variety = null.
- varietal_reasoning: ALWAYS fill; state "explicit" (quote the OCR grape text) or "inferred" (based on appellation/region), and mention uncertainty when inferred.

Common inference examples (use only when grapes not printed):
- Sancerre -> Sauvignon Blanc
- Barolo -> Nebbiolo
- Chablis -> Chardonnay
- Brunello di Montalcino -> Sangiovese
- Champagne -> Chardonnay, Pinot Noir, Pinot Meunier (shortlist; not certain)
- Cava -> Macabeo, Xarel-lo, Parellada (shortlist; not certain)

OUTPUT JSON (exact keys; use null when unknown)
{
  "name": "",
  "vintage": null,
  "producer": "",
  "region": null,
  "grape_variety": null,
  "varietal_reasoning": "",
  "country": null,
  "alcohol_content": null,
  "volume": null,
  "wine_type": null,
  "appellation": null,
  "notes": ""
}`;

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