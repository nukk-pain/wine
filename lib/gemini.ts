import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import { WineInfo } from '@/types';

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

export interface WineData {
    name: string | null;
    vintage: number | null;
    producer: string | null;
    region: string | null;
    grape_variety: string | null;
    varietal_reasoning: string;  // non-nullable (필수)
    country: string | null;
    alcohol_content: string | null;
    volume: string | null;
    wine_type: 'Red' | 'White' | 'Rosé' | 'Sparkling' | 'Dessert' | null;
    appellation: string | null;
    notes: string | null;
}

/**
 * Result 타입: 검증 실패 시에도 데이터 반환하되 플래그로 구분
 */
export type Result<T> =
    | { ok: true; data: T }
    | { ok: false; data: T; reason: string };

type ExtractHints = {
    v?: number | null;
    nv?: boolean;
    abv?: string | null;
    vol?: string | null;
    t?: 'R' | 'W' | 'P' | 'S' | 'D' | null;
};

const DEFAULT_MODEL = 'gemini-3-flash-preview';

// ============================================================
// 1. JSON Schema (Gemini 호환: nullable + enum)
// ============================================================

/**
 * [수정] oneOf 대신 nullable: true + enum 사용
 * Gemini Structured Output 지원 필드: enum, items, nullable, properties, required
 * 
 * 참고: responseJsonSchema 사용 시 responseMimeType = 'application/json' 필수
 */
const wineDataJsonSchema: Record<string, any> = {
    type: 'object',
    additionalProperties: false,
    properties: {
        name: { type: 'string', nullable: true },
        vintage: { type: 'integer', nullable: true },
        producer: { type: 'string', nullable: true },
        region: { type: 'string', nullable: true },
        grape_variety: { type: 'string', nullable: true },
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
        'name',
        'vintage',
        'producer',
        'region',
        'grape_variety',
        'varietal_reasoning',
        'country',
        'alcohol_content',
        'volume',
        'wine_type',
        'appellation',
    ],
};

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
// 2. OCR 텍스트 압축 (secondary 하단 우선)
// ============================================================

/**
 * [수정] secondaryLines.slice(-maxSecondary) 로 하단 우선
 * 수입사/병입 정보는 라벨 하단에 많음
 */
function compactOcrText(ocrText: string): string {
    const rawLines = ocrText
        .replace(/\r/g, '\n')
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean);

    const seen = new Set<string>();
    const primaryLines: string[] = [];
    const secondaryLines: string[] = [];

    for (const line of rawLines) {
        const norm = line
            .toLowerCase()
            .replace(/[^\p{L}\p{N}%.\-/'" ]+/gu, ' ')
            .replace(/\s+/g, ' ')
            .trim();

        if (seen.has(norm)) continue;
        seen.add(norm);

        // 바코드/시리얼 제거
        const digitRatio = norm.length > 0
            ? (norm.replace(/[^0-9]/g, '').length / norm.length)
            : 0;
        if (norm.length >= 18 && digitRatio > 0.7) continue;

        // URL/전화 완전 제거
        if (/www\.|http|tel:|phone:/i.test(norm)) continue;

        // Importer → secondary
        if (/imported by|importer|distributed by|bottled by/i.test(norm)) {
            secondaryLines.push(line);
            continue;
        }

        primaryLines.push(line);
    }

    let result: string[] = [];
    if (primaryLines.length <= 45) {
        result = primaryLines;
    } else {
        result = [...primaryLines.slice(0, 30), ...primaryLines.slice(-15)];
    }

    // [수정] 하단 우선: slice(-5)
    result.push(...secondaryLines.slice(-5));

    return result.join('\n');
}

// ============================================================
// 3. Hint 추출
// ============================================================

function extractHintsFromText(text: string): ExtractHints {
    const years = Array.from(text.matchAll(/\b(19|20)\d{2}\b/g))
        .map((m) => Number(m[0]))
        .filter((y) => y >= 1900 && y <= 2099)
        .sort((a, b) => b - a);
    const v = years[0] ?? null;

    const nv = /\bNV\b|non[- ]?vintage/i.test(text);

    const abvMatch = text.match(/\b(\d{1,2}(?:\.\d)?)\s*%(\s*vol)?\b/i);
    const abv = abvMatch && Number(abvMatch[1]) >= 6 && Number(abvMatch[1]) <= 25
        ? `${abvMatch[1]}%`
        : null;

    const volMatch = text.match(
        /\b(187|375|500|700|720|750|1000|1500|3000)\s*(ml|mL|ML)\b|\b(1|1\.5|3)\s*(l|L)\b/
    );
    const vol = volMatch
        ? volMatch[0].replace(/\s+/g, '').replace(/ml/i, 'mL').replace(/\bl\b/i, 'L')
        : null;

    let t: ExtractHints['t'] = null;
    if (/\bbrut\b|\bcava\b|\bchampagne\b|\bprosecco\b|\bspumante\b/i.test(text)) {
        t = 'S';
    } else if (/\bros[ée]\b|rosato|rosado/i.test(text)) {
        t = 'P';
    } else if (/dessert|late harvest|sauternes|tokaji|icewine/i.test(text)) {
        t = 'D';
    }

    return { v, nv: nv || undefined, abv, vol, t };
}

function formatHints(hints: ExtractHints): string {
    const parts: string[] = [];
    if (hints.v) parts.push(`v=${hints.v}`);
    if (hints.nv) parts.push('nv=1');
    if (hints.abv) parts.push(`abv=${hints.abv}`);
    if (hints.vol) parts.push(`vol=${hints.vol}`);
    if (hints.t) parts.push(`t=${hints.t}`);
    return parts.length > 0 ? parts.join(';') : 'none';
}

// ============================================================
// 4. 프롬프트 빌더
// ============================================================

function buildOcrPrompt(cleanOcr: string, hints: ExtractHints): string {
    return [
        'Extract wine info from OCR. JSON only.',
        'Rules:',
        '- producer=brand; name=product (exclude producer)',
        '- No cuvée → appellation+style',
        '- Grapes: explicit first, infer if needed (Barolo→Nebbiolo)',
        '- null if unknown',
        `Hints: ${formatHints(hints)}`,
        'OCR:',
        cleanOcr,
    ].join('\n');
}

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
// 5. Config (responseJsonSchema만 사용)
// ============================================================

function buildGenConfig(
    schema: Record<string, any>,
    thinkingLevel: ThinkingLevel = ThinkingLevel.MINIMAL
) {
    return {
        responseMimeType: 'application/json',
        responseJsonSchema: schema,
        thinkingConfig: { thinkingLevel },
        temperature: 0.2,
        candidateCount: 1,
        maxOutputTokens: 350,
    };
}

/**
 * Vision-Only용 Config (HIGH thinking level 기본, System Instruction 포함)
 */
function buildVisionGenConfig(schema: Record<string, any>) {
    return {
        responseMimeType: 'application/json',
        responseJsonSchema: schema,
        systemInstruction: getSystemInstruction(),
        thinkingConfig: {
            thinkingLevel: ThinkingLevel.HIGH,  // 예시 없이 모델이 직접 추론
        },
        // mediaResolution: 'high',  // SDK 미지원 옵션 - 주석 처리
        tools: [
            {
                googleSearch: {},  // 와인 정보 검증용
            },
        ],
        temperature: 0.1,
        candidateCount: 1,
        maxOutputTokens: 600,
    };
}

// ============================================================
// 6. 검증
// ============================================================

interface ValidationResult {
    valid: boolean;
    reason?: string;
}

function validateWineData(data: WineData): ValidationResult {
    if (!data.name || data.name.length < 2) {
        return { valid: false, reason: 'name missing/short' };
    }
    if (!data.producer) {
        return { valid: false, reason: 'producer null' };
    }
    if (data.producer.toLowerCase() === data.name.toLowerCase()) {
        return { valid: false, reason: 'producer===name' };
    }
    if (!data.varietal_reasoning || data.varietal_reasoning.length < 5) {
        return { valid: false, reason: 'varietal_reasoning short' };
    }
    return { valid: true };
}

function validateWineInfo(data: WineInfo): ValidationResult {
    // Gemini가 간헐적으로 대소문자를 다르게 반환할 수 있으므로 둘 다 확인
    const name = data.Name || (data as any).name;
    if (!name || name.length < 2) {
        return { valid: false, reason: 'Name missing/short' };
    }
    const producer = data.Producer || (data as any).producer;
    if (!producer) {
        return { valid: false, reason: 'Producer null' };
    }
    return { valid: true };
}

/**
 * Gemini 응답을 정규화하여 필드명 일관성 확보
 * (소문자 → 대문자 변환, Producer/Region 분리)
 */
function normalizeWineInfo(data: any): WineInfo {
    return {
        Name: data.Name || data.name || null,
        Vintage: data.Vintage || data.vintage || null,
        Producer: data.Producer || data.producer || '',      // 생산자 (분리)
        Region: data.Region || data.region || '',            // 지역 (분리)
        Price: data.Price || data.price || null,
        Quantity: data.Quantity || data.quantity || 1,
        Store: data.Store || data.store || '',
        'Varietal(품종)': data['Varietal(품종)'] || data.varietal ||
            (data.grape_variety ? [data.grape_variety] : []),
        Image: data.Image || null,
        country: data.country || null,
        alcohol_content: data.alcohol_content || null,
        volume: data.volume || null,
        wine_type: data.wine_type || null,
        appellation: data.appellation || null,
        notes: data.notes || null,
        varietal_reasoning: data.varietal_reasoning || null,
    };
}

// ============================================================
// 7. Safe JSON Parse
// ============================================================

function safeJsonParse<T>(text: string): T {
    try {
        return JSON.parse(text) as T;
    } catch {
        const m = text.match(/\{[\s\S]*\}/);
        if (!m) throw new Error('Invalid JSON');
        return JSON.parse(m[0]) as T;
    }
}

// ============================================================
// 8. 로깅
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
// 9. GeminiService
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
// 10. Image Loading Utilities (Vision-Only용)
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

// ============================================================
// 11. OCR Refinement (DEPRECATED - Vision-Only 전환)
// ============================================================

/*
 * ============================================================
 * DEPRECATED: Vision-Only 아키텍처로 전환됨
 * 
 * 이 함수는 더 이상 적극 사용되지 않습니다.
 * API 엔드포인트에서 geminiService.extractWineInfo()를 직접 호출합니다.
 * 
 * 롤백이 필요한 경우를 위해 코드는 유지됩니다.
 * ============================================================
 */

/**
 * @deprecated Vision-Only 전환으로 사용 안 함. geminiService.extractWineInfo() 사용 권장
 */
export async function refineWineDataWithGemini(
    ocrText: string
): Promise<Result<WineData>> {
    if (!process.env.GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY not set');
    }

    try {
        console.log('🔄 [Gemini OCR] Starting refinement...');
        console.log('📊 [Gemini OCR] Input length:', ocrText.length, 'characters');
        devTime('⏱️ [OCR]');

        // 1회만 계산
        const compact = compactOcrText(ocrText);
        const hints = extractHintsFromText(compact);
        const prompt = buildOcrPrompt(compact, hints);

        console.log('📝 [Gemini OCR] Compacted:', ocrText.length, '→', compact.length, 'chars');
        console.log('🎯 [Gemini OCR] Hints:', formatHints(hints));
        console.log('📤 [Gemini OCR] Prompt preview:', prompt.substring(0, 200));

        const contents = [
            { role: 'user' as const, parts: [{ text: prompt }] },
        ];

        // 1차: MINIMAL
        console.log('⚡ [Gemini OCR] Calling API with MINIMAL thinking...');
        let response = await genai.models.generateContent({
            model: DEFAULT_MODEL,
            config: buildGenConfig(wineDataJsonSchema, ThinkingLevel.MINIMAL),
            contents,
        });

        let text = response.text;
        console.log('📥 [Gemini OCR] Response received, length:', text?.length || 0);
        console.log('📥 [Gemini OCR] Response preview:', text?.substring(0, 300));

        if (!text) throw new Error('No response');

        let result = safeJsonParse<WineData>(text);
        console.log('✅ [Gemini OCR] Parsed result:', JSON.stringify({
            name: result.name,
            producer: result.producer,
            vintage: result.vintage,
            grape_variety: result.grape_variety
        }));
        let validation = validateWineData(result);

        // 검증 실패 → 2차: LOW
        if (!validation.valid) {
            console.log(`⚠️ [Gemini OCR] Validation failed: ${validation.reason}, retrying with LOW...`);

            response = await genai.models.generateContent({
                model: DEFAULT_MODEL,
                config: buildGenConfig(wineDataJsonSchema, ThinkingLevel.LOW),
                contents,
            });

            text = response.text;
            console.log('📥 [Gemini OCR] Retry response:', text?.substring(0, 300));
            if (!text) throw new Error('No response on retry');

            result = safeJsonParse<WineData>(text);
            console.log('✅ [Gemini OCR] Retry result:', JSON.stringify({
                name: result.name,
                producer: result.producer
            }));
            validation = validateWineData(result);
        }

        devTimeEnd('⏱️ [OCR]');

        if (!validation.valid) {
            console.log(`❌ [Gemini OCR] Still invalid after retry: ${validation.reason}`);
            console.log('❌ [Gemini OCR] Final data:', JSON.stringify(result));
            return { ok: false, data: result, reason: validation.reason! };
        }

        console.log('✅ [Gemini OCR] Validation successful!');
        console.log('✅ [Gemini OCR] Final result:', JSON.stringify(result, null, 2));
        return { ok: true, data: result };

    } catch (error) {
        devError('❌ [OCR]', error);
        throw error;
    }
}
/**
 * Maps extracted WineInfo to the format expected by the frontend.
 * Ensures consistent field naming and provides default values.
 */
export function mapToFrontendFormat(wineInfo: WineInfo, savedImagePath: string | null = null) {
    return {
        // Direct mappings from WineInfo (which extends NotionWineProperties)
        Name: wineInfo.Name || 'Unknown Wine',
        name: wineInfo.Name || 'Unknown Wine', // Lowercase fallback for compatibility

        Vintage: wineInfo.Vintage,
        vintage: wineInfo.Vintage,

        Producer: wineInfo.Producer || '',
        producer: wineInfo.Producer || '',

        Region: wineInfo.Region || '',
        region: wineInfo.Region || '',

        'Varietal(품종)': wineInfo['Varietal(품종)'] || [],

        // Static/Computed defaults for the frontend workflow
        Price: null,
        price: null,
        Quantity: 1,
        quantity: 1,
        Store: '',
        'Purchase date': new Date().toISOString().split('T')[0],
        Status: 'In Stock',

        // Contextual fields
        'Country(국가)': wineInfo.country || '',
        country: wineInfo.country || '',
        'Appellation(원산지명칭)': wineInfo.appellation || '',
        appellation: wineInfo.appellation || '',
        'Notes(메모)': wineInfo.notes || '',
        notes: wineInfo.notes || '',

        // Technical fields
        wine_type: wineInfo.wine_type || null,
        alcohol_content: wineInfo.alcohol_content || null,
        volume: wineInfo.volume || null,
        varietal_reasoning: wineInfo.varietal_reasoning || '',

        // Image info
        savedImagePath: savedImagePath,
        uploadedUrl: savedImagePath,
        Image: savedImagePath
    };
}
