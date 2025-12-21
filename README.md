# 🍷 Wine Tracker

AI 기반 와인 라벨 분석을 통한 프리미엄 와인 관리 시스템 (Mobile-First)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fwine)

## 🌟 주요 기능

- **📱 프리미엄 모바일 UI**: Wine Cellar 테마의 다크 모드와 Glassmorphism이 적용된 유려한 디자인
- **🤖 AI 이미지 분석**: Google Gemini API를 활용한 와인 정보(이름, 빈티지, 지역, 품종 등) 자동 추출
- **� Google Sheets 연동**: 추출된 와인 데이터를 Google Sheets에 실시간 저장 및 관리
- **📷 다중 이미지 배치 처리**: 여러 장의 와인 라벨을 한 번에 업로드하고 일괄 분석
- **✏️ 인라인 편집**: AI가 추출한 정보를 저장 전 즉시 수정할 수 있는 직관적인 워크플로우
- **🔄 스마트 재시도**: 분석 실패 시 개별 항목에 대한 재분석 및 오류 복구 지원
- **☁️ 클라우드 기반**: Vercel의 서버리스 인프라와 Blob Storage를 활용한 안정적인 운영

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
| `GEMINI_API_KEY` | Google Gemini API 키 (AI 모델 호출용) | ✅ |
| `GOOGLE_SHEET_ID` | 데이터가 저장될 Google Spreadsheet ID | ✅ |
| `GOOGLE_APPLICATION_CREDENTIALS` | Google Sheets API 서비스 계정 JSON (전체 내용) | ✅ |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob 저장소 토큰 (이미지 업로드용) | ✅ |

## ⚙️ API 설정 가이드

### 1. Google Gemini API
1. [Google AI Studio](https://aistudio.google.com/)에서 API 키 생성
2. `GEMINI_API_KEY` 환경 변수에 설정

### 2. Google Sheets API 설정
1. [Google Cloud Console](https://console.cloud.google.com/)에서 프로젝트 생성
2. Google Sheets API 활성화
3. 서비스 계정 생성 및 서비스 계정 이메일 주소 복사
4. 사용할 Google Spreadsheet를 생성하고, 서비스 계정 이메일에 **편집자(Editor)** 권한 공유
5. 서비스 계정의 JSON 키를 생성/다운로드한 후, 그 내용을 `GOOGLE_APPLICATION_CREDENTIALS`에 설정

### 3. Google Sheets 구조
스프레드시트의 첫 번째 시트 이름을 **`WineList`**로 설정하고, 1행에 다음 헤더를 추가하세요:

`Name`, `Vintage`, `Region/Producer`, `Varietal`, `Price`, `Quantity`, `Store`, `Purchase Date`, `Status`, `Country`, `Appellation`, `Notes`, `Image URL`, `ID`

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

### 개발 명령어

```bash
# 타입 체크 및 빌드
npm run type-check
npm run build

# 테스트 실행
npm test                    # 모든 Jest 테스트
npm run test:unit          # 단위 테스트
```

## 🏗️ 아키텍처

### 기술 스택
- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Design**: Custom Glassmorphism UI (Wine Cellar Theme)
- **Backend**: Next.js API Routes (Serverless)
- **Storage**: Vercel Blob (Temporary image storage)
- **AI**: Google Gemini Pro Vision
- **Database**: Google Sheets (Spreadsheet API)

### 데이터 플로우
1. **이미지 업로드** → Vercel Blob에 임시 저장 및 미리보기 생성
2. **AI 분석** → Gemini API를 통해 이미지에서 구조화된 와인 데이터 추출
3. **데이터 확인** → 사용자가 추출된 결과를 검토 및 필요시 수정
4. **저장** → 최종 데이터를 Google Sheets API를 통해 시트에 행(Row)으로 추가
5. **정리** → 저장 완료 후 클라우드에 저장된 임시 이미지 파일 자동 삭제

## 🔒 보안 및 비용 관리

- **API 키 관리**: Vercel 환경 변수를 통해 안전하게 저장 및 관리
- **이미지 자동 삭제**: 분석 및 저장이 완료된 이미지는 Vercel Blob에서 즉시 삭제하여 저장 공간 최적화
- **Rate Limiting**: Gemini API 및 Google Sheets API의 할당량을 준수하도록 설계

## 📄 라이선스

This project is licensed under the MIT License.

## 🙏 감사

- [Google Gemini API](https://deepmind.google/technologies/gemini/)
- [Google Sheets API](https://developers.google.com/sheets/api)
- [Vercel](https://vercel.com/)
- [Next.js](https://nextjs.org/)

---

**🍷 Happy Wine Tracking! 🚀**
