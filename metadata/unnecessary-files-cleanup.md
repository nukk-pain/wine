# Wine Tracker 프로젝트 - 불필요한 파일 정리 목록

## 🗑️ 즉시 삭제 가능한 파일들 (안전)

### 1. 빌드 캐시 및 임시 파일
```bash
# Next.js 빌드 캐시 (개발 시 재생성됨)
.next/cache/webpack/client-development/index.pack.gz.old
.next/cache/webpack/client-development-fallback/index.pack.gz.old
.next/cache/webpack/client-production/index.pack.old
.next/cache/webpack/server-development/index.pack.gz.old
.next/cache/webpack/server-production/index.pack.old

# TypeScript 빌드 정보 (재생성 가능)
tsconfig.tsbuildinfo
.next/cache/.tsbuildinfo
```
**예상 절약 용량**: ~10MB

### 2. 로그 파일들
```bash
logs/combined.log        # 7KB
logs/error.log          # 152B
logs/notion-api.log     # 1.7KB
logs/upload.log         # 0B (빈 파일)
logs/vision-api.log     # 57KB
```
**예상 절약 용량**: ~66KB
**참고**: 로그 파일은 주기적으로 정리하거나 로그 로테이션 설정 권장

### 3. 테스트 결과물
```bash
coverage/               # Jest 커버리지 리포트
playwright-report/      # Playwright 테스트 리포트
test-results/          # Playwright 결과물
```
**예상 절약 용량**: 수 MB (정확한 크기 미확인)
**참고**: CI/CD에서 재생성되므로 로컬에서는 삭제 가능

## ⚠️ 검토 후 삭제 고려 대상

### 1. 루트 디렉토리 대용량 이미지 파일
```bash
test1.jpg               # 1.9MB
test2.jpg               # 2.4MB
```
**현재 위치**: 루트 디렉토리
**올바른 위치**: `test-assets/` 디렉토리에 동일한 파일 존재
**권장사항**: 루트의 중복 파일 삭제

### 2. 업로드된 테스트 파일들
```bash
uploads/wine_1754747094186.jpg    # 72KB
uploads/wine_1754747132115.png    # 239KB
```
**참고**: 개발/테스트 시 생성된 파일들로 주기적 정리 필요

### 3. 임시 파일들
```bash
tmp/aioyiuameib7bhsdujck22jsr.png # 1.2MB
tmp/dp55lyglzxpqfwgbwc0xrz179.png # 14KB
```
**참고**: 임시 파일들은 자동 정리되어야 하지만 현재 남아있음

## 📝 문서 파일 정리 고려사항

### 개발 계획 문서들
```bash
plan-ori.md                       # 58KB - 최초 개발 계획서
mock.md                          # 4.6KB - Mock 구현 현황
manual-analysis-button-plan.md   # 1.8KB - 기능 계획서
post-refactoring-test-plan.md    # 9.1KB - 리팩토링 테스트 계획
```
**권장사항**: 
- `plan-ori.md`: 개발 완료 후 아카이브 폴더로 이동
- `mock.md`: 현재 Mock 상태가 실제와 다를 수 있어 검토 필요
- `manual-analysis-button-plan.md`: 구현 완료 시 삭제
- `post-refactoring-test-plan.md`: 테스트 완료 시 아카이브

## 🔄 정리 스크립트 제안

### 즉시 실행 가능한 정리 명령어
```bash
# 1. 빌드 캐시 정리
rm -f .next/cache/webpack/*/*.old
rm -f tsconfig.tsbuildinfo .next/cache/.tsbuildinfo

# 2. 로그 파일 정리 (백업 후)
mkdir -p logs/archive
mv logs/*.log logs/archive/ 2>/dev/null || true
touch logs/upload.log logs/error.log logs/combined.log logs/notion-api.log logs/vision-api.log

# 3. 테스트 결과물 정리
rm -rf coverage/* playwright-report/* test-results/*

# 4. 중복 이미지 파일 정리 (루트의 test1.jpg, test2.jpg)
rm -f test1.jpg test2.jpg

# 5. 임시 파일 정리
rm -rf tmp/*

# 6. 업로드 파일 정리 (개발용)
rm -rf uploads/* 2>/dev/null || true
```

### 주기적 정리를 위한 .gitignore 업데이트 권장
```gitignore
# 추가 권장 항목
*.old
*.bak
*.tmp
logs/*.log
tmp/*
uploads/*
tsconfig.tsbuildinfo
```

## 📊 전체 절약 예상 용량
- **즉시 삭제 가능**: ~10MB + 66KB + 테스트 결과물
- **검토 후 삭제**: ~5.7MB (이미지 파일들)
- **총 예상 절약**: **15MB 이상**

## 💡 정리 우선순위
1. **HIGH**: .old 파일들, 빌드 캐시, 중복 이미지 파일
2. **MEDIUM**: 로그 파일들, 테스트 결과물
3. **LOW**: 개발 문서들 (아카이브 후 정리)

## ⚠️ 주의사항
- `node_modules/` 내부 파일들은 건드리지 않음
- `.git/` 디렉토리는 절대 정리하지 않음
- `.env*` 파일들은 보안상 중요하므로 유지
- `CLAUDE.md`, `README.md` 등 핵심 문서는 유지