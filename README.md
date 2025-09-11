# 🍷 Wine Tracker

AI 기반 와인 라벨 및 영수증 인식을 통한 모바일 우선 와인 관리 시스템

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fwine)

## 🌟 주요 기능

- **📱 모바일 최적화**: 터치 친화적 UI로 모바일에서 완벽한 사용 경험
- **🤖 AI 이미지 분석**: Google Gemini & Vision API를 활용한 와인 정보 자동 추출
- **📷 다중 이미지 처리**: 카메라 직접 촬영 및 여러 이미지 배치 처리 지원
- **✏️ 편집 워크플로우**: AI 분석 후 수동 편집 및 재요청 기능
- **💾 Notion 자동 저장**: 배치 처리를 통한 효율적인 데이터베이스 저장
- **🔄 재처리 기능**: 실패한 처리에 대한 재요청 및 오류 복구
- **☁️ 서버리스 아키텍처**: Vercel의 안정적이고 확장 가능한 인프라

## 🚀 빠른 시작 (Vercel 배포)

### 1. Vercel에 배포

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fwine)

또는 수동으로:

```bash
# 프로젝트 클론
git clone https://github.com/wine.git
cd wine

# Vercel CLI 설치 및 배포
npm install -g vercel
vercel
```

### 2. 환경 변수 설정

Vercel 대시보드에서 다음 환경 변수를 설정하세요:

| 환경 변수 | 설명 | 필수 |
|----------|------|------|
| `NOTION_API_KEY` | Notion Integration API 키 | ✅ |
| `NOTION_DATABASE_ID` | Notion 데이터베이스 ID | ✅ |
| `NOTION_DATA_SOURCE_ID` | (선택) 2025-09-03 버전의 데이터 소스 ID. 설정 시 데이터 소스 부모로 페이지 생성 | ❌ |
| `GEMINI_API_KEY` | Google Gemini API 키 | ✅ |
| `GOOGLE_APPLICATION_CREDENTIALS` | Google Vision API 서비스 계정 JSON (전체 내용) | ✅ |

## ⚙️ API 설정 가이드

### Google APIs 설정

#### 1. Google Vision API
1. [Google Cloud Console](https://console.cloud.google.com/)에서 프로젝트 생성
2. Vision API 활성화
3. 서비스 계정 생성 및 JSON 키 다운로드
4. **중요**: Vercel에서는 파일 경로가 아닌 JSON 내용 전체를 환경 변수로 설정

```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "key-id",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  ...
}
```

#### 2. Google Gemini API
1. [Google AI Studio](https://aistudio.google.com/)에서 API 키 생성
2. Vercel 환경 변수에 `GEMINI_API_KEY` 설정

### Notion 설정

#### 1. Integration 생성
1. [Notion Developers](https://developers.notion.com/)에서 새 Integration 생성
2. API 키 복사하여 Vercel 환경 변수에 설정

#### 2. 데이터베이스 생성
다음 속성을 가진 Notion 데이터베이스 생성:

| 속성명 | 타입 | 설명 |
|--------|------|------|
| `Name` | Title | 와인 이름 |
| `Vintage` | Number | 빈티지 년도 |
| `Region/Producer` | Rich text | 지역/생산자 |
| `Varietal(품종)` | Rich text | 포도 품종 |
| `Price` | Number | 가격 |
| `Quantity` | Number | 수량 |
| `Purchase date` | Date | 구매일자 |
| `Store` | Rich text | 구매처 |
| `Status` | Select | 상태 (재고, 소비됨) |
| `Image` | Files | 와인 사진 |

#### 3. 데이터베이스 권한 설정
- 생성된 데이터베이스에서 Integration에 권한 부여
- 데이터베이스 ID를 복사하여 Vercel 환경 변수에 설정

## 💻 로컬 개발

### 사전 요구사항
- Node.js 18 이상
- npm 또는 yarn

### 개발 환경 설정

```bash  
# 의존성 설치
npm install

# 환경 변수 파일 생성
cp .env.example .env

# 개발 서버 시작
npm run dev
```

### 환경 변수 (.env)

```env
# Google APIs
GEMINI_API_KEY=your-gemini-api-key
GOOGLE_APPLICATION_CREDENTIALS={"type":"service_account",...}

# Notion API
NOTION_API_KEY=your-notion-api-key
NOTION_DATABASE_ID=your-database-id
# 선택: 데이터 소스 ID가 고정되어 있다면 설정하세요
# NOTION_DATA_SOURCE_ID=your-data-source-id
```

### 개발 명령어

```bash
# 개발 서버 시작
npm run dev

# 빌드
npm run build

# 타입 체크
npm run type-check

# 테스트 실행 (커스텀 테스트 러너)
npm test                    # 모든 Jest 테스트
npm run test:unit          # 단위 테스트만
npm run test:integration   # 통합 테스트만
npm run test:performance   # 성능 테스트
npm run test:all           # 모든 테스트 카테고리
npm run test:ci            # CI용 (실패 시에도 계속)

# E2E 테스트
npm run test:e2e

# Lint
npm run lint
```

## 🏗️ 아키텍처

### 기술 스택
- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes (서버리스)
- **Storage**: Vercel Blob (이미지 저장)
- **AI/ML**: Google Vision API, Google Gemini
- **Database**: Notion API
- **Deployment**: Vercel (자동 CI/CD)
- **Testing**: Jest, React Testing Library, Playwright

### 디렉토리 구조
```
wine/
├── __tests__/               # 포괄적 테스트 스위트
│   ├── unit/               # 단위 테스트 (컴포넌트, 파서, 유틸리티)
│   ├── integration/        # 통합 테스트 (API, 워크플로우)
│   ├── performance/        # 성능 테스트 (캐싱, 메모리)
│   └── e2e/               # E2E 테스트 (Playwright)
├── components/             # React 컴포넌트
│   ├── workflows/         # 워크플로우 컴포넌트
│   └── ...
├── lib/                   # 핵심 라이브러리
│   ├── config/            # 환경별 설정
│   ├── parsers/           # AI 응답 파서
│   └── ...
├── pages/                 # Next.js 페이지
│   └── api/              # API 라우트 (업로드, 처리, Notion)
├── scripts/               # 커스텀 테스트 러너
└── public/               # 정적 파일 및 업로드
```

### 데이터 플로우
1. **이미지 업로드** → Vercel Blob 저장 (단일/다중)
2. **AI 분석** → Vision API (OCR) + Gemini (구조화 파싱)
3. **결과 처리** → 데이터 정규화 및 검증
4. **편집 워크플로우** → 사용자 확인 및 수정 인터페이스
5. **배치 저장** → Notion 데이터베이스 일괄 처리
6. **후처리** → Blob 정리 및 캐시 관리

## 📱 사용 방법

1. **📷 이미지 업로드**: 
   - 모바일에서 카메라 아이콘 터치
   - 와인 라벨 또는 영수증 촬영

2. **🎯 타입 선택**: 
   - 와인 라벨, 영수증 선택
   - 또는 AI 자동 감지 사용

3. **🤖 AI 분석**: 
   - "분석하기" 버튼으로 AI 분석 시작
   - Google Vision + Gemini가 정보 추출

4. **✅ 정보 확인**: 
   - 추출된 정보 검토
   - 필요시 직접 편집

5. **💾 저장**: 
   - Notion 데이터베이스에 자동 저장
   - 저장 완료 확인

## 🔧 트러블슈팅

### 일반적인 문제

#### 1. Vercel 배포 실패
- 환경 변수가 올바르게 설정되었는지 확인
- 빌드 로그에서 오류 메시지 확인
- `vercel logs` 명령어로 런타임 로그 확인

#### 2. Google API 오류
```bash
# Vision API 권한 확인
# Vercel 대시보드에서 GOOGLE_APPLICATION_CREDENTIALS 확인

# Gemini API 할당량 확인
# Google AI Studio에서 사용량 모니터링
```

#### 3. Notion 연결 오류
- Integration이 데이터베이스에 권한이 있는지 확인
- 데이터베이스 스키마가 일치하는지 확인
- API 키가 유효한지 확인

#### 4. 이미지 업로드 실패
- Vercel Blob 할당량 확인
- 파일 크기 제한 (10MB) 확인
- 지원되는 이미지 형식 확인 (JPEG, PNG, WebP)

### 디버깅

#### 로그 확인
```bash
# Vercel 함수 로그
vercel logs

# 로컬 개발 로그
npm run dev
```

#### 테스트 실행
```bash
# 커스텀 테스트 러너 사용
npm run test:all           # 전체 테스트 (unit, integration, performance)
npm run test:unit          # 단위 테스트만
npm run test:integration   # 통합 테스트만
npm run test:performance   # 성능 테스트만
npm run test:ci            # CI 환경 (계속 실행)

# 표준 Jest 명령어
npm test                    # 기본 Jest 실행
npm test -- --coverage     # 커버리지 리포트
```

## 🔒 보안 고려사항

- **환경 변수**: 민감한 정보는 Vercel 환경 변수에만 저장
- **API 키 관리**: Google Cloud에서 API 키 제한 설정
- **Rate Limiting**: API 호출 제한으로 비용 관리
- **CORS**: 허용된 도메인에서만 접근 가능
- **File Validation**: 업로드 파일 타입 및 크기 검증

## 📊 모니터링

### Vercel Analytics
- 페이지 방문 및 성능 지표
- API 호출 횟수 및 응답 시간
- 에러율 모니터링

### Cost Management
- Google API 사용량 모니터링
- Vercel 함수 실행 시간 최적화
- Blob 저장소 사용량 관리

## 🔄 업데이트

```bash
# 로컬 변경사항 배포
git add .
git commit -m "Update features"
git push origin master

# Vercel이 자동으로 배포 수행
```

## 🤝 기여하기

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 라이선스

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 감사

- [Google Cloud Vision API](https://cloud.google.com/vision)
- [Google Gemini](https://deepmind.google/technologies/gemini/)
- [Notion API](https://developers.notion.com/)
- [Vercel](https://vercel.com/)
- [Next.js](https://nextjs.org/)

---

**🍷 Happy Wine Tracking on Vercel! 🚀**
