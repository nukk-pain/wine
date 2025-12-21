# [작업 지시서] Step 2. 데이터 매핑 함수화 및 파서 삭제 (Strict Mode)

## 1. 개요
불필요하게 복잡하게 설계된 `NotionCompatibleParser` 클래스를 폐기하고, 단순 함수형 매퍼로 통합합니다. 클래스 인스턴스 생성을 금지합니다.

## 2. 상세 지시 사항

### A. [lib/utils/notion-helpers.ts] (Mapping Central)
- **수정**: `convertToNotionFormat` 함수를 강화하여 `gemini-parser.ts`에 분산되어 있던 매핑 로직을 모두 흡수하십시오.
- **필수 포함 필드**: Name, Vintage, Producer, Region, Price, Quantity, Store, Varietal(품종), Image, Country, Appellation, Notes.
- **주의**: AI가 반환한 `WineInfo`의 선택적 필드들이 `NotionWineProperties`의 올바른 키값(대문자 및 특수문자 포함)으로 정확히 매핑되도록 하십시오.

### B. [lib/gemini-parser.ts] (PERMANENT DELETION)
- **작업**: 해당 파일과 `notionParser` 인스턴스를 **영구 삭제**하거나 `legacy_backup`으로 이동 후 코드 참조를 모두 끊으십시오.
- **엄격 금지**: 클래스 기반의 파서 구조를 한 줄이라도 남기지 마십시오.

### C. [pages/api/process.ts] (API REFACTORING)
- **수정**: `notionParser.parseWineLabelForNotion` 호출부를 제거하십시오.
- **교체**: 대신 `lib/gemini.ts`의 `geminiService.extractWineInfo` 결과를 직접 받고, 이를 `convertToNotionFormat` 유틸리티로 즉시 변환하도록 수정하십시오.

## 3. 검토 및 승인 조건
- [ ] `lib/gemini-parser.ts` 파일이 `legacy_backup` 외의 경로에 존재하지 않아야 함.
- [ ] `api/process.ts`에서 클래스 인스턴스(`notionParser`) 사용이 없어야 함.
- [ ] 모든 데이터 변환은 `lib/utils/notion-helpers.ts`의 순수 함수를 사용할 것.

**설계된 유틸리티 함수 외에 별도의 파싱 클래스를 생성하는 행위를 금함.**
