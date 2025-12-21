# 코드베이스 리팩토링 및 구조 개선 제안안

본 문서는 현재 와인 트래커 프로젝트의 기능 중복을 제거하고, 유지보수가 용이한 표준 아키텍처로 통합하기 위한 개선안을 담고 있습니다.

---

## 1. 데이터 검증 로직의 단일화 (Validation Consolidation)

현재 `gemini.ts`, `notion-helpers.ts`, `WineEditForm.tsx` 등에 파편화된 검증 로직을 하나의 모듈로 통합합니다.

- **대상**: `lib/utils/notion-helpers.ts` 내의 `validateWineData`
- **개선 내용**:
    - 모든 서비스 레이어(AI 추출 직후)와 UI 레이어(수정 폼 제출 전)에서 해당 함수를 **유일한 진실의 원천(Source of Truth)**으로 사용합니다.
    - 중복된 `validateWineInfo`(gemini.ts) 및 폼 내부의 커스텀 검증 함수를 삭제합니다.

## 2. 데이터 매핑 및 정규화 기능 통합 (Data Mapping Standardization)

AI 응답을 애플리케이션 포맷으로 변환하는 중복된 로직을 정리합니다.

- **제안 아키텍처**:
    1. **Gemini Service**: 원시 응답을 최소한으로 정규화 (`normalizeWineInfo`).
    2. **Notion Helpers**: 최종 저장 포맷으로의 매핑 유틸리티 제공 (`convertToNotionFormat`).
- **삭제 대상**: `lib/gemini-parser.ts` 클래스 기반의 과도하게 복잡한 매핑 로직을 제거하고, 단순 유틸리티 함수(Pure Function) 기반으로 전환합니다.

## 3. 프론트엔드 아키텍처 표준화 (Frontend Standardization)

서로 다른 두 가지 워크플로우 관리 방식을 하나로 통일합니다.

- **권장 방식**: `pages/index.tsx`가 채택하고 있는 **커스텀 훅(`use...`) + 경량 컴포넌트 조합** 방식을 표준으로 확정합니다.
- **삭제 대상**:
    - 거대 단일 컴포넌트인 `components/UnifiedWorkflow.tsx` 및 관련 레거시 워크플로우 파일들.
    - 백업 폴더로 이동된 구버전 컴포넌트들(`WineResultDisplay.tsx` 등)의 완전한 제거.

## 4. 타입 시스템 활용 강화

- **대상**: `types/index.ts`
- **개선 내용**:
    - `any` 타입을 사용하고 있는 인터페이스(`LegacyInputItem` 등)를 구체적인 전역 타입으로 대체합니다.
    - 백앤드 API 응답 타입과 프론트엔드 데이터 타입을 엄격하게 일치시켜 런타임 에러 가능성을 차단합니다.

---

## 향후 실행 계획 (Next Steps)

1. **1단계**: 검증 로직 `notion-helpers.ts`로 통합 및 import 경로 수정.
2. **2단계**: `UnifiedWorkflow.tsx` 삭제 및 메인 페이지(`index.tsx`)의 코드 가독성 개선.
3. **3단계**: 데이터 매핑 로직을 유틸리티 함수 중심으로 간소화.

> [!NOTE]
> 이 제안안은 시스템의 중단 없이 점진적으로 적용할 수 있도록 설계되었습니다.
