# 🍷 Wine Tracker

AI 기반 와인 라벨 및 영수증 인식을 통한 모바일 우선 와인 관리 시스템

## 📱 주요 기능

- **모바일 최적화**: 터치 친화적 UI로 모바일에서 완벽한 사용 경험
- **AI 이미지 분석**: Google Gemini 2.5 Flash를 활용한 와인 정보 자동 추출
- **카메라 직접 촬영**: 모바일 카메라로 와인 라벨 또는 영수증 직접 촬영
- **Notion 자동 저장**: 추출된 정보를 Notion 데이터베이스에 자동 저장
- **데이터 확인 및 수정**: 저장 전 정보 확인 및 편집 가능

## 🏠 Synology NAS 배포 가이드

### 사전 요구사항

- Synology NAS (DSM 7.0 이상)
- Node.js 18 이상
- Git
- SSH 접근 권한

### 1. NAS 환경 준비

#### Node.js 설치
```bash
# Synology Package Center에서 Node.js 설치
# 또는 SSH로 직접 설치
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

#### PM2 설치 (프로세스 관리)
```bash
sudo npm install -g pm2
```

### 2. 프로젝트 배포

#### 소스 코드 클론
```bash
# NAS의 웹 디렉토리로 이동
cd /volume2/web

# 프로젝트 클론
git clone <repository-url> wine-tracker
cd wine-tracker
```

#### 의존성 설치 및 빌드
```bash
# 의존성 설치
npm install

# 프로덕션 빌드
npm run build
```

### 3. 환경 변수 설정

#### .env.local 파일 생성
```bash
# 환경 파일 생성
touch .env.local
nano .env.local
```

#### 필수 환경 변수
```env
# Google APIs
GOOGLE_APPLICATION_CREDENTIALS="/volume2/web/wine-tracker/vision.json"
GEMINI_API_KEY="your-gemini-api-key-here"

# Notion API
NOTION_API_KEY="your-notion-api-key-here"
NOTION_DATABASE_ID="your-notion-database-id-here"

# 환경 설정
NODE_ENV="production"
PORT=3000
```

### 4. Google API 설정

#### Google Vision API 설정
1. [Google Cloud Console](https://console.cloud.google.com/)에서 프로젝트 생성
2. Vision API 활성화
3. 서비스 계정 키 생성 (JSON 파일)
4. `vision.json` 파일로 저장

```bash
# 서비스 계정 키 파일 업로드
scp path/to/your/vision.json user@nas-ip:/volume2/web/wine-tracker/
```

#### Google Gemini API 설정
1. [Google AI Studio](https://aistudio.google.com/)에서 API 키 생성
2. `.env.local`에 `GEMINI_API_KEY` 추가

### 5. Notion 데이터베이스 설정

#### Notion Integration 생성
1. [Notion Developers](https://developers.notion.com/)에서 새 Integration 생성
2. API 키 복사하여 `.env.local`에 추가

#### 데이터베이스 구조
다음 속성을 가진 Notion 데이터베이스 생성:

| 속성명 | 타입 | 설명 |
|--------|------|------|
| Name | Title | 와인 이름 |
| Vintage | Number | 빈티지 년도 |
| Region/Producer | Text | 지역/생산자 |
| Varietal(품종) | Multi-select | 포도 품종 |
| Price | Number | 가격 |
| Quantity | Number | 수량 |
| Purchase date | Date | 구매일자 |
| Store | Text | 구매처 |
| Status | Select | 상태 (재고, 소비됨 등) |

### 6. PM2로 프로덕션 실행

#### PM2 설정 파일 (ecosystem.config.js)
```javascript
module.exports = {
  apps: [{
    name: 'wine-tracker',
    script: 'npm',
    args: 'start',
    cwd: '/volume2/web/wine-tracker',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    log_file: '/volume2/web/wine-tracker/logs/combined.log',
    out_file: '/volume2/web/wine-tracker/logs/out.log',
    error_file: '/volume2/web/wine-tracker/logs/error.log',
    time: true
  }]
};
```

#### PM2 실행
```bash
# PM2로 애플리케이션 시작
pm2 start ecosystem.config.js

# PM2 자동 시작 설정
pm2 startup
pm2 save

# 상태 확인
pm2 status
pm2 logs wine-tracker
```

### 7. 리버스 프록시 설정 (선택사항)

#### Nginx 설정
```nginx
server {
    listen 80;
    server_name your-nas-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 🔧 개발 환경 설정

### 로컬 개발
```bash
# 개발 서버 시작
npm run dev

# 테스트 실행
npm test

# 타입 체크
npm run type-check
```

### 환경별 설정
- **개발**: `http://localhost:3001`
- **프로덕션**: `http://your-nas-ip:3000`
- **이미지 저장**: 
  - 개발: `public/wine-photos/`
  - 프로덕션: `/volume2/web/wine/wine-photos/`

## 📋 사용 방법

1. **📷 이미지 촬영**: 모바일에서 와인 라벨 또는 영수증 촬영
2. **🎯 타입 선택**: 와인 라벨, 영수증, 또는 AI 자동 감지 선택
3. **🚀 분석 실행**: "분석하기" 버튼으로 AI 분석 시작
4. **✅ 정보 확인**: 추출된 정보 확인 및 필요시 수정
5. **💾 Notion 저장**: 최종 확인 후 Notion 데이터베이스에 저장

## 🔧 트러블슈팅

### 일반적인 문제 해결

#### 1. PM2 프로세스가 시작되지 않을 때
```bash
# 로그 확인
pm2 logs wine-tracker

# 프로세스 재시작
pm2 restart wine-tracker

# 프로세스 삭제 후 재시작
pm2 delete wine-tracker
pm2 start ecosystem.config.js
```

#### 2. Google API 오류
```bash
# 환경 변수 확인
echo $GOOGLE_APPLICATION_CREDENTIALS
cat /volume2/web/wine-tracker/.env.local

# vision.json 파일 권한 확인
ls -la vision.json
chmod 600 vision.json
```

#### 3. Notion API 연결 오류
- Notion Integration이 데이터베이스에 권한이 있는지 확인
- API 키가 올바른지 확인
- 데이터베이스 ID가 정확한지 확인

#### 4. 포트 충돌
```bash
# 포트 사용 확인
netstat -tulpn | grep :3000

# 다른 포트로 변경
# .env.local에서 PORT=3001로 변경
```

### 로그 확인
```bash
# 애플리케이션 로그
tail -f /volume2/web/wine-tracker/logs/combined.log

# PM2 로그
pm2 logs wine-tracker --lines 100

# 시스템 로그
journalctl -u pm2-root -f
```

## 🔒 보안 고려사항

- `.env.local` 파일 권한: `600` (소유자만 읽기/쓰기)
- `vision.json` 파일 권한: `600`
- 방화벽에서 필요한 포트만 개방
- 정기적인 보안 업데이트

## 📱 모바일 최적화 기능

- **터치 친화적 UI**: 최소 44px 터치 타겟
- **카메라 직접 접근**: `capture="environment"` 속성으로 후면 카메라 사용
- **반응형 디자인**: 모바일 우선 설계
- **PWA 지원**: 모바일 앱과 같은 사용 경험

## 🔄 업데이트 방법

```bash
# 소스 코드 업데이트
cd /volume2/web/wine-tracker
git pull origin main

# 의존성 업데이트
npm install

# 빌드
npm run build

# PM2 재시작
pm2 restart wine-tracker
```

## 📞 지원

- 문제 발생 시 로그 파일과 함께 이슈 제기
- 모바일 최적화 관련 문의 환영
- NAS 배포 관련 질문 지원

---

**🍷 Happy Wine Tracking! 🍷**