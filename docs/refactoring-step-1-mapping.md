# [작업 지시서] Step 1. 데이터 흐름 및 매핑 구조 개선 (Strict Mode)

## 1. 개요
기존 `gemini-parser.ts`의 클래스 기반 파싱 로직을 제거하고, `notion-helpers.ts`의 순수 함수로 이관합니다. 단, **AI 분석 데이터의 유실을 방지**하기 위해 저장용 데이터와 표시용 데이터를 명확히 분리합니다.

## 2. 상세 지시 사항

### A. [lib/utils/notion-helpers.ts] (Mapping Core)
- **추가**: `normalizeWineInfo` 함수를 구현하여 AI 응답(snake_case 등)을 프론트엔드 표준 `WineInfo` 타입(PascalCase)으로 변환하십시오.
    - AI가 반환한 모든 부가 정보(reasoning, app ellation 등)를 누락 없이 매핑해야 합니다.
- **수정**: `convertToNotionFormat` 함수는 **오직 DB 저장 시점에만 호출**되도록 명시하고, `WineInfo` 객체에서 `NotionWineProperties`를 추출하는 역할로 한정하십시오.

### B. [lib/gemini-parser.ts] (DEPRECATION)
- **삭제**: `NotionCompatibleParser` 클래스를 제거하십시오.
- **수정**: 이 파일이 제공하던 `mergeWineDataWithEdits` 같은 유틸리티 함수들은 `notion-helpers.ts`로 이동시키십시오.
- **최종**: 파일 자체를 삭제하십시오.

### C. [api/process.ts] (Data Flow)
- **수정**: 파서 클래스 대신 `gemini.ts`의 `extractWineInfo`를 직접 호출하십시오.
- **중요**: 응답 데이터는 `convertToNotionFormat`을 거친 "저장용 데이터"가 아니라, `normalizeWineInfo`를 거친 **"전체 분석 데이터(WineInfo)"**여야 합니다. 프론트엔드에서 AI 분석 근거를 볼 수 있어야 하기 때문입니다.

## 3. 검토 및 승인 조건
- [ ] API 응답에 `varietal_reasoning` 등의 필드가 포함되어야 함.
- [ ] `lib/gemini-parser.ts` 파일이 삭제되어야 함.
- [ ] 모든 데이터 변환 로직이 `lib/utils/notion-helpers.ts`에 위치해야 함.
