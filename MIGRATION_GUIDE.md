# 새로운 리포지토리로 이관 가이드 (Migration Guide)

이 문서는 Wine Tracker 프로젝트를 **새롭고 깨끗한 GitHub 리포지토리**에 배포하기 위한 절차를 안내합니다. 이 과정은 기존 개발 과정에서 포함되었을 수 있는 민감한 정보(API 키, 로그 등)가 공개되는 것을 방지하기 위함입니다.

## 1. 새 폴더 준비

로컬 컴퓨터의 안전한 위치에 새 폴더를 만드세요. 예: `wine-tracker-public`

```bash
mkdir wine-tracker-public
cd wine-tracker-public
```

## 2. 파일 복사

기존 프로젝트 폴더에서 **다음 파일과 폴더만** 새 폴더로 복사하세요.
(탐색기에서 복사하거나 터미널 명령어를 사용하세요)

### 복사해야 할 필수 항목:
- [ ] `.github/` (폴더 전체)
- [ ] `components/` (폴더 전체)
- [ ] `docs/` (폴더 전체)
- [ ] `hooks/` (폴더 전체)
- [ ] `lib/` (폴더 전체)
- [ ] `pages/` (폴더 전체)
- [ ] `public/` (폴더 전체 - *주의: `wine-photos`, `uploads` 등 테스트용 이미지가 있다면 제외*)
- [ ] `scripts/` (폴더 전체)
- [ ] `styles/` (폴더 전체)
- [ ] `types/` (폴더 전체)
- [ ] `.env.example`
- [ ] `.eslintrc.json`, `eslint.config.mjs` 등 설정 파일
- [ ] `.gitignore`
- [ ] `CONTRIBUTING.md`
- [ ] `LICENSE`
- [ ] `MIGRATION_GUIDE.md` (이 파일)
- [ ] `next.config.js`, `next-env.d.ts`
- [ ] `package.json`, `package-lock.json`
- [ ] `playwright.config.ts`
- [ ] `postcss.config.js`
- [ ] `README.md`
- [ ] `tailwind.config.js`
- [ ] `tsconfig.json`
- [ ] `jest.config.js`, `jest.setup.js`

### ❌ 절대 복사하면 안 되는 항목 (보안/용량 주의):
- `node_modules/`
- `.git/` (가장 중요! 기존 히스토리를 가져가지 않기 위함)
- `.env`, `.env.local` (실제 키가 들어있는 파일)
- `.next/`, `build/`, `dist/` (빌드 결과물)
- `logs/`
- `.claude/`, `.gemini/` (AI 설정 파일)

## 3. 새 리포지토리 초기화

새 폴더(`wine-tracker-public`) 내에서 다음 명령어를 실행하여 새로운 git 리포지토리를 시작합니다.

```bash
# git 초기화
git init

# 의존성 설치 (잘 복사되었는지 확인 겸)
npm install

# 첫 커밋
git add .
git commit -m "Initial commit: Open source release of Wine Tracker"
```

## 4. GitHub에 푸시

1. GitHub에서 새 리포지토리를 생성합니다 (Create a new repository).
2. 생성된 리포지토리 주소를 원격 저장소로 추가하고 푸시합니다.

```bash
git remote add origin https://github.com/YOUR_USERNAME/NEW_REPO_NAME.git
git push -u origin main
```

이제 깨끗한 상태로 프로젝트가 공개되었습니다! 🎉
