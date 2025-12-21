import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import { WineInfo } from '@/types';
import { normalizeWineInfo, validateWineData } from './utils/notion-helpers';

const genai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY || '',
});

// ============================================================
// Vision-Only System Instruction
// ============================================================

function getSystemInstruction(): string {
    return `You are an expert wine label analyzer with deep knowledge of:
- Global wine regions and appellations
- Wine terminology and classifications
- Grape varieties and their regional associations
- Label reading conventions across different countries

CRITICAL RULES:
1. PRODUCER vs NAME distinction is mandatory
   - Producer = Winery/Château/Domaine/Estate/Brand
   - Name = Product/Cuvée/Wine name
   - They are NEVER the same

2. For minimal labels with only brand + type:
   - Producer = Brand name
   - Name = Appellation + Style/Designation
   - Example: "BONA VAL CAVA BRUT" → Producer:"BONA VAL", Name:"Cava Brut"

3. Grape variety inference:
   - If grapes visible on label: use exact text
   - If not visible: infer from appellation (Barolo→Nebbiolo, Chablis→Chardonnay)
   - If uncertain: return reasonable candidates with reasoning

4. Quality over speed:
   - Read ALL visible text on the label
   - Consider label design, colors, symbols
   - Use contextual clues (bottle shape, capsule, etc.)

5. Notes field:
   - Include wine designation, style, special features
   - DO NOT include URLs or web links
   - Keep concise and informative

OUTPUT: Valid JSON matching exact schema, no markdown formatting.`;
}

// ============================================================
// 타입 정의
// ============================================================

/**
 * Result 타입: 검증 실패 시에도 데이터 반환하되 플래그로 구분
 */
export type Result<T> =
    | { ok: true; data: T }
    | { ok: false; data: T; reason: string };

const DEFAULT_MODEL = 'gemini-3-flash-preview';

// ============================================================
// 1. JSON Schema (Gemini Structured Output용)
// ============================================================

const wineInfoJsonSchema: Record<string, any> = {
    type: 'object',
    additionalProperties: false,
    properties: {
        Name: { type: 'string', nullable: true },
        Vintage: { type: 'integer', nullable: true },
        Producer: { type: 'string', nullable: true },   // C: 생산자 (분리)
        Region: { type: 'string', nullable: true },     // D: 지역 (분리)
        Price: { type: 'number', nullable: true },
        Quantity: { type: 'integer' },
        Store: { type: 'string', nullable: true },
        'Varietal(품종)': { type: 'array', items: { type: 'string' } },
        varietal_reasoning: { type: 'string' },  // non-nullable
        country: { type: 'string', nullable: true },
        alcohol_content: { type: 'string', nullable: true },
        volume: { type: 'string', nullable: true },
        wine_type: {
            type: 'string',
            enum: ['Red', 'White', 'Rosé', 'Sparkling', 'Dessert'],
            nullable: true,
        },
        appellation: { type: 'string', nullable: true },
        notes: { type: 'string', nullable: true },
    },
    required: [
        'Name',
        'Vintage',
        'Producer',
        'Region',
        'Price',
        'Quantity',
        'Store',
        'Varietal(품종)',
        'varietal_reasoning',
        'country',
        'alcohol_content',
        'volume',
        'wine_type',
        'appellation',
    ],
};

// ============================================================
// 2. 프롬프트 빌더
// ============================================================

function buildVisionPrompt(): string {
    return `Analyze this wine label image and extract structured information.

PROCESS:
1. Identify PRODUCER (winery/brand) and PRODUCT NAME (cuvée/designation)
2. Find VINTAGE, REGION/APPELLATION, GRAPE VARIETIES
3. Check for ALCOHOL %, VOLUME, WINE TYPE indicators

OUTPUT REQUIREMENTS:
- Return valid JSON only
- Follow exact schema fields
- Include varietal_reasoning explaining grape source
- Notes: designations/style only, NO URLs`;
}

// ============================================================
// 3. Config
// ============================================================

/**
 * Vision-Only용 Config (HIGH thinking level 기본, System Instruction 포함)
 */
function buildVisionGenConfig(schema: Record<string, any>) {
    return {
        responseMimeType: 'application/json',
        responseJsonSchema: schema,
        systemInstruction: getSystemInstruction(),
        tools: [
            {
                googleSearch: {},  // 와인 정보 검증용
            },
        ],
        temperature: 0.1,
        candidateCount: 1,
        maxOutputTokens: 2000,
    };
}

// ============================================================
// 4. Safe JSON Parse
// ============================================================

function safeJsonParse<T>(text: string): T {
    try {
        // First try direct parse
        return JSON.parse(text) as T;
    } catch (e: any) {
        // Try to extract JSON from markdown or text
        const m = text.match(/\{[\s\S]*\}/);
        if (!m) {
            console.error('❌ [JSON Parse Error] No JSON object found in response:', text);
            throw new Error('Invalid JSON: No object structure found');
        }

        let cleaned = m[0];
        // Remove markdown backticks if present within the match (unlikely but safe)
        cleaned = cleaned.replace(/```json|```/g, '');

        try {
            return JSON.parse(cleaned) as T;
        } catch (innerE: any) {
            console.error('❌ [JSON Parse Error] Failed to parse cleaned string:', cleaned);
            throw new Error(`Invalid JSON format: ${innerE.message}`);
        }
    }
}

// ============================================================
// 5. 로깅 유틸리티
// ============================================================

const isDev = process.env.NODE_ENV === 'development';
const devLog = (msg: string, ...args: any[]) => isDev && console.log(msg, ...args);
const devTime = (label: string) => isDev && console.time(label);
const devTimeEnd = (label: string) => isDev && console.timeEnd(label);
const devError = (msg: string, err: any) => {
    if (isDev) {
        console.error(msg, err?.message);
    }
};

// ============================================================
// 6. GeminiService
// ============================================================

export class GeminiService {
    private model = DEFAULT_MODEL;

    /**
     * Vision-Only 와인 정보 추출 (HIGH thinking level 단일 호출)
     * System Instruction + Google Search tool 사용
     */
    async extractWineInfo(
        imageBuffer: Buffer,
        mimeType: string
    ): Promise<Result<WineInfo>> {
        try {
            console.log('🍷 [Vision-Only] Starting Gemini Vision analysis...');
            devTime('⏱️ [Vision]');

            const prompt = buildVisionPrompt();
            const contents = [
                {
                    role: 'user' as const,
                    parts: [
                        { text: prompt },
                        { inlineData: { data: imageBuffer.toString('base64'), mimeType } },
                    ],
                },
            ];

            // Vision-Only: HIGH thinking level 단일 호출
            const response = await genai.models.generateContent({
                model: this.model,
                config: buildVisionGenConfig(wineInfoJsonSchema),
                contents,
            });

            const text = response.text;
            if (!text) throw new Error('No response from Gemini Vision');

            // 파싱 후 정규화하여 필드명 일관성 확보
            const rawResult = safeJsonParse<any>(text);
            const result = normalizeWineInfo(rawResult);

            devTimeEnd('⏱️ [Vision]');

            console.log('✅ [Vision-Only] Success:', result.Name);
            return { ok: true, data: result };

        } catch (error) {
            devError('❌ [Vision-Only]', error);
            throw error;
        }
    }
}

export const geminiService = new GeminiService();

// ============================================================
// 7. Image Loading Utilities
// ============================================================

/**
 * 이미지 URL에서 Buffer 로딩 (HTTP URL 또는 로컬 파일)
 */
export async function loadImageBuffer(imageUrl: string): Promise<Buffer> {
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
        const response = await fetch(imageUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.statusText}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        return Buffer.from(arrayBuffer);
    } else {
        const fs = require('fs').promises;
        const path = require('path');
        const filePath = imageUrl.startsWith('/')
            ? imageUrl
            : path.join(process.cwd(), 'public', imageUrl);
        return await fs.readFile(filePath);
    }
}

/**
 * 이미지 URL에서 MIME 타입 추출
 */
export function getMimeType(imageUrl: string): string {
    const ext = imageUrl.split('.').pop()?.toLowerCase();
    const mimeTypes: Record<string, string> = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'webp': 'image/webp',
        'gif': 'image/gif',
    };
    return mimeTypes[ext || 'jpg'] || 'image/jpeg';
}
