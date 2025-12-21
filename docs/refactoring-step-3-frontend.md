# [작업 지시서] Step 3. 프론트엔드 레거시 청소 및 타입 엄격화 (Strict Mode)

## 1. 개요
사용되지 않는 거대 컴포넌트를 제거하고, 개발 편의를 위해 방치된 `any` 타입을 일소합니다. 프로젝트의 아키텍처는 `hooks` 기반으로 확정합니다.

## 2. 상세 지시 사항

### A. [components/UnifiedWorkflow.tsx] (DELETION)
- **작업**: 해당 파일을 **즉시 삭제**하십시오. 
- **이유**: `pages/index.tsx`가 이미 모든 기능을 커스텀 훅으로 구현 완료하였으므로, 중복된 이 대형 파일은 기술 부채일 뿐입니다.
- **연쇄 삭제**: 이 파일에서만 사용되던 서브 컴포넌트나 스타일이 있다면 함께 삭제하십시오.

### B. [pages/index.tsx] (REFACTORING)
- **추가**: 파일 용량이 250라인을 넘어가고 있습니다. 하단에 정의된 `MobileLayout`, `ProcessingStep`, `LoadingSpinner`, `ErrorMessage`를 `components/layout/` 폴더로 물리적 분리하십시오.
- **수정**: 인라인으로 정의된 스타일이나 유틸리티를 모두 외부 상수로 분리하십시오.

### C. [components/WineBatchResultDisplay.tsx] (TYPE STRICTNESS)
- **수정**: `LegacyInputItem` 인터페이스 내의 `status: any`, `result?: { extractedData?: any }` 등 **`any` 타입을 모두 제거**하십시오.
- **교체**: `types/index.ts`에 정의된 `ImageProcessingItem`과 `WineInfo` 타입을 엄격하게 적용하십시오.
- **엄격 금지**: "편의상" 혹은 "임시로" `any` 타입을 사용하는 행위를 절대 금지합니다.

## 3. 검토 및 승인 조건
- [ ] `components/UnifiedWorkflow.tsx` 파일이 존재하지 않아야 함.
- [ ] `any` 타입 사용률이 0%에 수렴해야 함 (필수 불가결한 상황 제외).
- [ ] 모든 레이아웃 컴포넌트가 `components/layout/`으로 분리되었어야 함.

**지시된 리팩토링 범위를 벗어난 과도한 UI 변경이나 개인적인 취향의 코드 수정을 불허함.**
