# Vision-Only 구현 계획 (최종)

Gemini Vision API만 사용하는 순수 Vision 아키텍처로 전환. vision.ts는 유지하되 우회하는 구조.

## 아키텍처

### Before (OCR 방식)
```
API endpoint → vision.ts → Google Vision OCR → gemini.ts → 결과
```

### After (Vision-Only)
```
API endpoint → gemini.ts (extractWineInfo) → 결과
                          ↓
                    vision.ts (DEPRECATED, 유지만)
```

## 핵심 변경사항

### 1. Gemini Vision 설정
- **thinkingLevel**: `'HIGH'` (예시 없이 모델이 직접 추론)
- **mediaResolution**: `'high'` (라벨 텍스트 정확히 읽기)
- **googleSearch tool**: 와인 정보 검증
- **systemInstruction**: 상세한 역할 정의

### 2. 프롬프트 전략
- System instruction에 CRITICAL RULES 명시
- User prompt는 간결하게 (예시 제거)
- Notes에 URL 금지 규칙 추가

### 3. 데이터 흐름
- vision.ts 우회
- API endpoint에서 gemini.ts 직접 호출
- WineInfo → 필요 형식으로 변환

## 구현 단계

### Phase 1: gemini.ts 수정

**1. System Instruction 추가**
```typescript
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
```

**2. User Prompt (간결화)**
```typescript
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
```

**3. Config 업데이트**
```typescript
function buildGenConfig(schema: Record<string, any>) {
    return {
        responseMimeType: 'application/json',
        responseJsonSchema: schema,
        systemInstruction: [
            { text: getSystemInstruction() }
        ],
        temperature: 0.1,
        candidateCount: 1,
        maxOutputTokens: 600,
        thinkingConfig: {
            thinkingLevel: 'HIGH' as any // SDK 타입 호환성을 위해 casting 또는 Enum 사용 (import { ThinkingLevel } from '@google/genai')
        },
        // mediaResolution: 'high',  // SDK 미지원 옵션 가능성 있으므로 주석 처리
        tools: [
            {
                googleSearch: {}  // 와인 정보 검증용
            }
        ],
    };
}
```

**4. extractWineInfo 단순화**
```typescript
async extractWineInfo(
    imageBuffer: Buffer,
    mimeType: string
): Promise<Result<WineInfo>> {
    try {
        console.log('🍷 [Vision] Starting Gemini Vision analysis...');
        
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

        // 단일 호출 (HIGH thinking level로 충분)
        const response = await genai.models.generateContent({
            model: this.model,
            config: buildGenConfig(wineInfoJsonSchema),
            contents,
        });

        const text = response.text;
        if (!text) throw new Error('No response from Gemini Vision');

        const result = safeJsonParse<WineInfo>(text);
        const validation = validateWineInfo(result);

        if (!validation.valid) {
            console.error('❌ [Vision] Validation failed:', validation.reason);
            return { ok: false, data: result, reason: validation.reason! };
        }

        console.log('✅ [Vision] Success:', result.Name);
        return { ok: true, data: result };

    } catch (error) {
        console.error('❌ [Vision] Failed:', error);
        throw error;
    }
}
```

**5. 이미지 로딩 유틸리티 추가**
```typescript
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
```

**6. OCR 함수 주석처리**
```typescript
// ============================================================
// 10. OCR Refinement (DEPRECATED - Vision-only now)
// ============================================================

/*
export async function refineWineDataWithGemini(
    ocrText: string
): Promise<Result<WineData>> {
    // ... 전체 주석 처리
}

function compactOcrText(ocrText: string): string {
    // ... 주석 처리
}

function extractHintsFromText(text: string): ExtractHints {
    // ... 주석 처리
}

function buildOcrPrompt(cleanOcr: string, hints: ExtractHints): string {
    // ... 주석 처리
}
*/
```

---

### Phase 2: vision.ts 처리

**파일 상단에 DEPRECATED 주석 추가, 코드는 그대로 유지:**
```typescript
/*
 * ============================================================
 * DEPRECATED: Vision-only 아키텍처로 전환
 * 
 * 이 파일의 함수들은 더 이상 사용되지 않습니다.
 * API 엔드포인트에서 geminiService.extractWineInfo()를 직접 호출합니다.
 * 
 * 롤백 시 사용할 수 있도록 코드는 유지합니다.
 * ============================================================
 */

// 기존 코드 모두 유지 (수정 없음)
```

---

### Phase 3: API 엔드포인트 수정

**process-multiple.ts:**
```typescript
// 기존 import 수정
import { geminiService, loadImageBuffer, getMimeType } from '@/lib/gemini';
// import { processWineImage } from '@/lib/vision';  // 더 이상 사용 안 함

// 처리 로직 변경
if (useGemini) {
    console.log('🎯 [Vision-Only] Processing image...');
    
    // [CONFIRMED] 영수증은 더 이상 지원하지 않음
    if (imageRequest.type === 'receipt') {
        throw new Error('Receipt parsing is deprecated and not supported.');
    }

    const imageBuffer = await loadImageBuffer(imageRequest.url);
    const mimeType = getMimeType(imageRequest.url);
    const result = await geminiService.extractWineInfo(imageBuffer, mimeType);
    
    if (!result.ok) {
        throw new Error(`Vision extraction failed: ${result.reason}`);
    }
    
    // WineInfo → 필요한 형식으로 변환
    extractedData = {
        Name: result.data.Name,
        name: result.data.Name,
        Vintage: result.data.Vintage,
        vintage: result.data.Vintage,
        'Region/Producer': result.data['Region/Producer'],
        'Varietal(품종)': result.data['Varietal(품종)'] || [],
        Price: null,                                          // 사용자 입력
        price: null,
        Quantity: 1,                                           // [CONFIRMED] 기본값 1 고정
        quantity: 1,
        Store: '',                                             // 사용자 입력
        'Purchase date': new Date().toISOString().split('T')[0], // [CONFIRMED] 오늘 날짜 고정
        Status: 'In Stock',                                    // [CONFIRMED] 기본값 In Stock
        'Country(국가)': result.data.country,
        country: result.data.country,
        'Appellation(원산지명칭)': result.data.appellation,
        appellation: result.data.appellation,
        'Notes(메모)': result.data.notes,
        notes: result.data.notes,
        wine_type: result.data.wine_type,
        alcohol_content: result.data.alcohol_content,
        volume: result.data.volume,
    };
    
    console.log('✅ [Vision-Only] Extracted:', extractedData.Name);
}
```

**process.ts (있다면):**
동일한 패턴으로 수정.

---

### Phase 4: 기타 파일

**image-classifier.ts:**
```typescript
/*
 * DEPRECATED: Vision-only 전환으로 사용 안 함
 * Gemini Vision이 이미지 타입 자동 판단
 */
```

---

## 검증 계획

### 로컬 테스트

**테스트 이미지:**
1. BONA VAL (미니멀) - 현재 실패 케이스
2. Velarino (상세) - 현재 성공 케이스
3. Château Margaux (프랑스 고급)
4. 흐릿한 이미지 (품질 테스트)

**성공 기준:**
- ✅ BONA VAL에서 "(No Name)" 없이 "Cava Brut" 추출
- ✅ 모든 필수 필드 채워짐
- ✅ Producer와 Name 명확히 구분
- ✅ Notes에 URL 없음
- ✅ 실패율 5% 이하

### 프로덕션 배포

**Canary 배포:**
1. 10% 트래픽 → 24시간 모니터링
2. 50% 트래픽 → 24시간 모니터링
3. 100% 트래픽

**모니터링 메트릭:**
```typescript
{
    visionSuccess: 0,
    visionValidationFailed: 0,
    visionException: 0,
    avgResponseTime: 0
}
```

---

## 비용 분석

**현재 (OCR):**
- Google Vision OCR: $1.50/1000 images
- Gemini 텍스트: 무시 가능
- **총**: $0.15/100 images

**Vision-Only:**
- Gemini Vision (HIGH thinking): ~$0.02/100 images
- Google Search tool: 무시 가능
- **총**: $0.02/100 images

**절감액: 87% 비용 절감**

---

## Rollback 계획

### 빠른 롤백 (1단계)
```typescript
// process-multiple.ts
import { processWineImage } from '@/lib/vision';  // 주석 해제
// import { geminiService, loadImageBuffer, getMimeType } from '@/lib/gemini';  // 주석 처리

const visionResult = await processWineImage(imageRequest.url);  // 주석 해제
extractedData = visionResult.data;
```

### 완전 롤백 (2단계)
```bash
git revert <commit-hash>
git push origin main
```

### Vercel 즉시 롤백
Vercel Dashboard에서 이전 배포 버전으로 롤백

**Rollback 트리거:**
- 실패율 10% 초과
- 평균 응답 시간 10초 초과
- "(No Name)" 발생률 20% 초과

---

## Timeline

- **Day 1**: gemini.ts 수정 (system instruction, prompt, config, utils)
- **Day 2**: API 엔드포인트 수정 + 로컬 테스트
- **Day 3**: 스테이징 배포 + 검증
- **Day 4-5**: Canary 배포 (10% → 50%)
- **Day 6**: 100% 배포
- **Day 7-14**: 집중 모니터링

---

## Success Metrics

**1주일 목표:**
- ✅ Vision 성공률: 90%+
- ✅ "(No Name)" 발생: 5% 미만
- ✅ 평균 응답 시간: 5초 이하
- ✅ 비용: 기존 대비 80%+ 절감
- ✅ Notes에 URL 0건
