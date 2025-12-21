# [작업 지시서] Step 3. 프론트엔드 청소 및 타입 안전성 확보 (Strict Mode)

## 1. 개요
레거시 코드를 정리하고, Step 1~2에서 확립된 데이터 구조(`WineInfo`, `ValidationResult`)를 프론트엔드 전반에 엄격히 적용합니다.

## 2. 상세 지시 사항

### A. [components/UnifiedWorkflow.tsx] (DELETION)
- **작업**: 해당 파일을 **즉시 삭제**하십시오.
- **사유**: `pages/index.tsx`가 대체 완료함.

### B. [components/WineBatchResultDisplay.tsx] (TYPE STRICTNESS)
- **수정**: `any` 타입을 제거하고 엄격한 타입을 적용하십시오.
- **전제**: Step 1에 의해 이 컴포넌트로 전달되는 데이터는 반드시 `WineInfo` 형태임이 보장됩니다.
- **구현**:
    - `extractedData`는 `WineInfo` 타입을 사용.
    - 화면 표시 시 `extractedData?.Name` (PascalCase)를 기준으로 하되, 혹시 모를 하위 호환성을 위해 `normalizeWineInfo`를 한 번 더 거치거나 유틸리티를 사용해도 됨.
    - 툴팁이나 상세 보기에서 `varietal_reasoning`, `wine_type` 등 AI 부가 정보가 누락되지 않도록 연결하십시오.

### C. [pages/index.tsx] (REFACTORING)
- **분리**: 하단에 정의된 `MobileLayout`, `ProcessingStep` 등을 `components/layout/`으로 이동.
- **스타일**: 인라인 스타일을 제거하고 Tailwind 클래스 또는 공통 상수로 대체.

## 3. 검토 및 승인 조건
- [ ] `components/UnifiedWorkflow.tsx`가 삭제되어야 함.
- [ ] `WineBatchResultDisplay.tsx`에서 `any` 타입이 제거되어야 함.
- [ ] AI가 분석한 "품종 추론 근거"가 프론트엔드에서 확인 가능해야 함.
