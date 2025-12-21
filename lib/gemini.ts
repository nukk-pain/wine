import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import { WineInfo } from '@/types';

const genai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY || '',
});

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
        'Region/Producer': { type: 'string', nullable: true },
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
        'Region/Producer',
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
    return [
        'Extract wine info from label image. Return JSON only.',
        '',
        'REQUIRED FIELDS:',
        '- Name: wine product name (NOT producer)',
        '- Region/Producer: "Producer, Region" format',
        '- Varietal(품종): array of grape varieties',
        '- Vintage: year (number) or null',
        '',
        'RULES:',
        '- If no product name, use: appellation + style (e.g., "Cava Brut")',
        '- Infer grapes from region if not visible',
        '- Use null for unknown fields',
    ].join('\n');
}

// ============================================================
// 5. Config (responseJsonSchema만 사용)
// ============================================================

function buildGenConfig(
    schema: Record<string, any>,
    thinkingLevel: ThinkingLevel = ThinkingLevel.MINIMAL
) {
    return {
        responseMimeType: 'application/json',  // 필수
        responseJsonSchema: schema,             // responseSchema와 동시 사용 금지
        thinkingConfig: { thinkingLevel },      // Gemini 3 Flash용
        temperature: 0.2,
        candidateCount: 1,
        maxOutputTokens: 350,
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
    if (!data.Name || data.Name.length < 2) {
        return { valid: false, reason: 'Name missing/short' };
    }
    if (!data['Region/Producer']) {
        return { valid: false, reason: 'Region/Producer null' };
    }
    return { valid: true };
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
     * [수정] Result<T> 반환 - 검증 실패 시 ok: false + reason
     * [수정] prompt/config 1회 생성, level만 변경하여 재시도
     */
    async extractWineInfo(
        imageBuffer: Buffer,
        mimeType: string
    ): Promise<Result<WineInfo>> {
        try {
            devLog('🍷 [Vision] Starting...');
            devTime('⏱️ [Vision]');

            // 프롬프트 1회 생성
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

            // 1차: MINIMAL
            let response = await genai.models.generateContent({
                model: this.model,
                config: buildGenConfig(wineInfoJsonSchema, ThinkingLevel.MINIMAL),
                contents,
            });

            let text = response.text;
            if (!text) throw new Error('No response');

            let result = safeJsonParse<WineInfo>(text);
            let validation = validateWineInfo(result);

            // 검증 실패 → 2차: LOW (같은 contents 재사용)
            if (!validation.valid) {
                devLog(`⚠️ [Vision] Retry with LOW: ${validation.reason}`);

                response = await genai.models.generateContent({
                    model: this.model,
                    config: buildGenConfig(wineInfoJsonSchema, ThinkingLevel.LOW),
                    contents,
                });

                text = response.text;
                if (!text) throw new Error('No response on retry');

                result = safeJsonParse<WineInfo>(text);
                validation = validateWineInfo(result);
            }

            devTimeEnd('⏱️ [Vision]');

            if (!validation.valid) {
                devLog(`❌ [Vision] Still invalid: ${validation.reason}`);
                return { ok: false, data: result, reason: validation.reason! };
            }

            devLog('✅ [Vision] OK');
            return { ok: true, data: result };

        } catch (error) {
            devError('❌ [Vision]', error);
            throw error;
        }
    }
}

export const geminiService = new GeminiService();

// ============================================================
// 10. OCR Refinement
// ============================================================

/**
 * [수정] compact/hints/prompt 1회 생성 → level만 변경 재시도
 * [수정] Result<T> 반환
 */
export async function refineWineDataWithGemini(
    ocrText: string
): Promise<Result<WineData>> {
    if (!process.env.GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY not set');
    }

    try {
        devLog('🔄 [OCR] Starting...');
        devTime('⏱️ [OCR]');

        // 1회만 계산
        const compact = compactOcrText(ocrText);
        const hints = extractHintsFromText(compact);
        const prompt = buildOcrPrompt(compact, hints);

        devLog(`📝 [OCR] ${ocrText.length}→${compact.length} chars`);
        devLog(`🎯 [OCR] Hints: ${formatHints(hints)}`);

        const contents = [
            { role: 'user' as const, parts: [{ text: prompt }] },
        ];

        // 1차: MINIMAL
        let response = await genai.models.generateContent({
            model: DEFAULT_MODEL,
            config: buildGenConfig(wineDataJsonSchema, ThinkingLevel.MINIMAL),
            contents,
        });

        let text = response.text;
        if (!text) throw new Error('No response');

        let result = safeJsonParse<WineData>(text);
        let validation = validateWineData(result);

        // 검증 실패 → 2차: LOW
        if (!validation.valid) {
            devLog(`⚠️ [OCR] Retry with LOW: ${validation.reason}`);

            response = await genai.models.generateContent({
                model: DEFAULT_MODEL,
                config: buildGenConfig(wineDataJsonSchema, ThinkingLevel.LOW),
                contents,
            });

            text = response.text;
            if (!text) throw new Error('No response on retry');

            result = safeJsonParse<WineData>(text);
            validation = validateWineData(result);
        }

        devTimeEnd('⏱️ [OCR]');

        if (!validation.valid) {
            devLog(`❌ [OCR] Still invalid: ${validation.reason}`);
            return { ok: false, data: result, reason: validation.reason! };
        }

        devLog('✅ [OCR] OK');
        return { ok: true, data: result };

    } catch (error) {
        devError('❌ [OCR]', error);
        throw error;
    }
}
