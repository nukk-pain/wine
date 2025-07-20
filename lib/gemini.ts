import { GoogleGenerativeAI } from '@google/generative-ai';

// Polyfill fetch for Node.js environment if needed
if (typeof global !== 'undefined' && !global.fetch) {
  const fetchModule = require('cross-fetch');
  global.fetch = fetchModule.default || fetchModule;
}

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export interface WineData {
  name: string;
  vintage: number;
  producer?: string;
  region?: string;
  grape_variety?: string;
  [key: string]: any;
}

export async function refineWineDataWithGemini(ocrText: string): Promise<WineData> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY environment variable is not set');
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

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
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in Gemini response');
    }

    const parsedData = JSON.parse(jsonMatch[0]);
    
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