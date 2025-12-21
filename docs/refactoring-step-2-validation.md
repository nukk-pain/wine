# [작업 지시서] Step 2. 검증 로직 단일화 및 고도화 (Strict Mode)

## 1. 개요
분산된 검증 로직을 `notion-helpers.ts`로 통합하되, **저장 차단(Error)**과 **사용자 주의(Warning)**를 명확히 구분하여 유연성을 확보합니다.

## 2. 상세 지시 사항

### A. [lib/utils/notion-helpers.ts] (Validation Core)
- **수정**: `validateWineData` 함수의 반환 타입을 개선하십시오.
    ```typescript
    export interface ValidationResult {
        isValid: boolean;     // errors.length === 0
        errors: string[];     // 저장을 막아야 하는 치명적 오류 (예: 이름 누락)
        warnings: string[];   // 저장 허용하되 경고 표시 (예: 1800년 빈티지)
    }
    ```
- **로직 분리**:
    - **Error**: 필수 필드 누락(Name), 음수 가격/수량 등 데이터 무결성 위반.
    - **Warning**: 비현실적 범위(Vintage < 1900, Price > 1천만원 등), 품종 개수 과다 등.

### B. [lib/gemini.ts] (Cleanup)
- **삭제**: 파일 내 `validateWineInfo` 함수 삭제.
- **수정**: `extractWineInfo`에서 `notion-helpers.ts`의 검증 함수를 호출하되, `isValid` 여부와 관계없이 데이터는 반환하고 `validation` 결과를 함께 넘겨주십시오.

### C. [components/WineEditForm.tsx] (UI Update)
- **삭제**: 내부 `validate` 함수 삭제.
- **연동**: `onSave` 시점이 아닌 `useEffect`로 `editedData` 변경 시마다 `notion-helpers.ts`의 `validateWineData`를 호출하십시오.
- **UI**: 
    - `errors`가 있으면 저장 버튼 비활성화 (Red Alert).
    - `warnings`가 있으면 저장 버튼 활성화 유지하되 경고 메시지 표시 (Yellow Alert).

## 3. 검토 및 승인 조건
- [ ] 빈티지를 1700년으로 입력 시 저장이 가능하고 경고만 떠야 함.
- [ ] 이름 삭제 시 저장 버튼이 비활성화되어야 함.
- [ ] `validate` 로직이 오직 `notion-helpers.ts`에만 존재해야 함.
