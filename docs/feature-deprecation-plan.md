# 기능 제거 및 단순화 계획 (Feature Deprecation Plan)

이 문서는 프로그램의 복잡도를 낮추고 핵심 기능(와인 라벨 인식)에 집중하기 위해 불필요한 기능을 제거하는 계획을 정리합니다.
> **Last Updated**: 2025-12-21
> **Status**: Planning

## 1. 제거 대상 보완 및 리스크 관리

### 1) 영수증 인식 및 자동 분류 (Legacy)
- **변경 사항**: 
    - AI 분석 시 **이미지 분류(Classification) 단계 생략** -> 무조건 `wine_label`로 처리.
    - `ReceiptInfo`, `ReceiptData` 등 영수증 관련 타입 정의 제거.
- **🚨 리스크 및 해결 방안**:
    - **문제**: `types/index.ts`에서 타입 제거 시 이를 참조하는 컴포넌트(`DataConfirmation.tsx`) 빌드 에러 발생.
    - **해결**: <span style="color:red">**반드시 프론트엔드 코드 먼저 수정 후 타입 제거.**</span>
    - **동시성 관리**: 현재 진행 중인 프론트엔드 개선 작업과 충돌할 수 있음. `DataConfirmation.tsx` 수정 시 **영수증 관련 UI 블록만 정밀하게 타격(삭제)**하여 와인 관련 로직 변경사항과 충돌을 최소화해야 함.

### 2) 직접 촬영 기능
- **변경 사항**: 
    - `ImageUpload` 컴포넌트에서 카메라 UI 제거.
- **리스크**: 모바일 UX 저하 (카메라 퀵 실행 불가).
- **해결**: `<input type="file" accept="image/*" capture="environment" />` 속성을 활용하여 모바일 네이티브 카메라 연동 유도.

### 3) 데이터 마이그레이션 스크립트
- **변경 사항**: `scripts/migrate-to-sheets.ts` 등 유지보수 대상 제외 파일 삭제.

---

## 2. 상세 실행 순서 (Execution Steps)

의존성 문제로 인해 **반드시 아래 순서대로** 작업을 진행해야 빌드가 깨지지 않습니다.

### Step 1: 프론트엔드 정리 (Priority)
> ⚠️ **프론트엔드 작업자 공유 필수**: `components/DataConfirmation.tsx`가 크게 변경됩니다.
1. `components/DataConfirmation.tsx`:
   - `ReceiptDataDisplay` 컴포넌트 삭제.
   - `type === 'receipt'` 분기 렌더링 삭제.
   - `ReceiptInfo` import 제거.
2. `components/ImageUpload.tsx`: 직접 촬영 관련 안내 문구/버튼 제거.

### Step 2: 타입 시스템 정리
1. `types/index.ts`:
   - `ReceiptInfo`, `ReceiptItem`, `LegacyReceiptData` 인터페이스 삭제.
   - `ImageType` 내 `'receipt'` 값 삭제 (또는 `'unknown'` 처리).
   - `ProcessResponse`, `ApiResponse` 등에서 영수증 관련 유니온 타입 제거.

### Step 3: 백엔드 로직 정리
1. `pages/api/process.ts`:
   - `geminiService.classifyImage` 호출 로직 삭제.
   - `extractReceiptInfo` 호출 분기 삭제.
2. `pages/api/notion.ts` (또는 Notion API 핸들러):
   - `action === 'save_receipt'` 케이스 삭제.
   - `saveReceiptToSheets` 등 영수증 저장 함수 호출부 제거.

### Step 4: 라이브러리 및 스크립트 정리
1. `lib/gemini.ts`:
   - `extractReceiptInfo`, `classifyImage` 메서드 삭제.
2. `lib/notion.ts`: `ReceiptData` 인터페이스 및 관련 헬퍼 삭제.
3. `scripts/` 폴더 내 마이그레이션 스크립트 삭제.

---

## 3. 기술적 수정 내역 (File Changes)

| 파일 경로 | 수정 내역 | 비고 |
|---|---|---|
| `types/index.ts` | `ReceiptInfo`, `LegacyReceiptData` 삭제 | **Breaking Change** |
| `components/DataConfirmation.tsx` | 영수증 UI 렌더링 로직 제거 | Conflict 주의 |
| `pages/api/process.ts` | 분류 로직 제거, 와인 인식 강제 | |
| `lib/gemini.ts` | `classifyImage`, `extractReceiptInfo` 삭제 | |
| `pages/api/notion.ts` | 영수증 저장 핸들러 삭제 | |

## 4. 향후 영향 및 검증
- **검증 방법**:
  - `npm run run-check` (Type Check) 성공 여부.
  - 와인 사진 업로드 시 정상적으로 인식 및 정보 노출 확인.
  - 영수증 사진 업로드 시 에러가 나거나, 와인으로 잘못 인식하더라도 시스템이 멈추지 않는지 확인.
