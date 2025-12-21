# 프로젝트 정리 계획 (Cleanup Plan)

이 문서는 Wine Tracker 프로젝트의 복잡도를 낮추고 유지보수성을 높이기 위해 불필요한 파일과 코드를 정리하는 계획을 기록합니다.

## 1. 레거시 코드 및 스크립트 (삭제 대상)
아래 파일들은 더 이상 사용되지 않거나 최신 타입 시스템(`types/index.ts`)으로 대체되었습니다.

- `lib/notion-schema.ts`: `types/index.ts`로 통합됨
- `lib/api-types.ts`: `types/index.ts`로 통합됨
- `check-sheet.ts`: 초기 시트 점검용 스크립트
- `test-sheet-upload.ts`: 초기 업로드 테스트용 스크립트
- `notion-upgrade.html`: 백업용 임시 HTML
- `vision.json`: Gemini API 응답 캐시 또는 테스트 파일

## 2. 완료된 계획 및 참조 문서 (아카이브 대상)
완료되었거나 현재는 참조만 필요한 문서들은 `docs/archive/` 폴더로 이동하여 루트와 `docs/` 폴더를 간결하게 유지합니다.

- `metadata/unnecessary-files-cleanup.md` -> `docs/archive/`
- `docs/vulnerable.md` -> `docs/archive/` (보안 공지 참조용)
- `docs/security-setup.md` -> `docs/archive/` (설정 완료 후 참조용)

## 3. 임시 파일 및 캐시 (삭제 대상)
빌드 과정이나 테스트 중에 생성된 임시 파일들입니다.

- `test_output.txt` 및 `test_output_*.txt` 파일들
- `logs/` 디렉토리 내 로그 파일들 (디렉토리는 유지)
- `tmp/` 디렉토리 내 임시 이미지들
- `uploads/` 디렉토리 내 개발용 테스트 업로드 파일들
- `.next/cache/` (필요 시 `npm run build`로 정리)

## 4. 실행 및 검증 절차
1. **백업**: 중요한 로직이 포함되어 있는지 최종 확인
2. **이동/삭제**: 계획에 따라 파일 처리
3. **의존성 체크**: `npm run type-check`를 통해 삭제된 파일에 대한 참조가 없는지 확인
4. **빌드 테스트**: `npm run build` 성공 여부 확인
