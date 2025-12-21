# [작업 지시서] Step 1. 검증 로직 단일화 및 통합 (Strict Mode)

## 1. 개요
개발자의 자의적 판단을 배제하고, 프로젝트의 모든 와인 데이터 검증을 단일화합니다. 지시된 사항 외의 추가 로직 구현은 불허합니다.

## 2. 상세 지시 사항

### A. [lib/utils/notion-helpers.ts] (Source of Truth)
- **추가/수정**: `validateWineData` 함수가 `types/index.ts`의 `ValidationResult` 타입을 반환하도록 수정하십시오.
- **규칙**: 아래의 항목이 반드시 포함되어야 하며, 로직은 이 파일에만 존재해야 합니다.
    - `Name`: 필수, 공백 제외 최소 1자 이상.
    - `Vintage`: 1800 ~ 현재연도+1 사이의 숫자만 허용 (null 허용).
    - `Price/Quantity`: 0 이상의 숫자.

### B. [lib/gemini.ts] (DELETION & REPLACEMENT)
- **삭제**: 378~389라인의 `validateWineInfo` 함수를 **완전히 삭제**하십시오.
- **삭제**: 관련 인터페이스 `ValidationResult` 정의를 삭제하십시오.
- **수정**: `GeminiService.extractWineInfo` 내부에서 분석 결과 반환 전, 반드시 `notion-helpers.ts`의 `validateWineData`를 호출하여 검증하십시오.
- **엄격 금지**: 이 파일 안에 자체적인 `if (!data.Name)` 식의 검증 코드를 남기지 마십시오.

### C. [components/WineEditForm.tsx] (CLEANUP)
- **삭제**: 내부 `validate` 함수 전체를 삭제하십시오.
- **수정**: `handleSave` 함수 시작 부분에서 `notion-helpers.ts`의 `validateWineData`를 호출하도록 교체하십시오.
- **UI 반영**: 반환된 `errors` 배열을 기존 에러 메시지 UI에 그대로 바인딩하십시오.

## 3. 검토 및 승인 조건
- [ ] `grep -r "validateWineInfo" .` 결과가 0건이어야 함.
- [ ] `grep -r "validate" components/WineEditForm.tsx` 결과가 import 문 외에 없어야 함.
- [ ] 모든 검증은 `notion-helpers.ts`를 거쳐야 함.

**위 지시 사항을 위반하여 로직을 분산시킬 경우 반려 조치함.**
