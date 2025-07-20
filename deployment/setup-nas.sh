#!/bin/bash

echo "🔧 Setting up NAS environment for Wine Tracker..."

# 1. 필요한 디렉토리 생성
mkdir -p /volume2/web/wine/wine-tracker
mkdir -p /volume2/web/wine/wine-photos
mkdir -p /volume2/web/wine/wine-tracker/logs

# 2. 권한 설정
chmod 755 /volume2/web/wine/wine-tracker
chmod 755 /volume2/web/wine/wine-photos
chmod 755 /volume2/web/wine/wine-tracker/logs

# 3. Node.js 및 PM2 설치 확인
if ! command -v node &> /dev/null; then
    echo "Installing Node.js..."
    opkg update
    opkg install node npm
fi

if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2..."
    npm install -g pm2
fi

# 4. PM2 startup 설정
pm2 startup
pm2 save

# 5. 방화벽 포트 열기 (DSM 7.0+)
echo "Don't forget to open port 3000 in DSM Control Panel > External Access > Router Configuration"

# 6. 환경 변수 파일 템플릿 생성
cat > /volume2/web/wine/wine-tracker/.env.local << EOF
# Notion API
NOTION_TOKEN=your_notion_integration_token_here
NOTION_DATABASE_ID=23638693-94a5-804f-aa3d-f64f826a2eab

# Google Cloud Vision API
GOOGLE_CLOUD_PROJECT_ID=your_project_id
GOOGLE_CLOUD_PRIVATE_KEY="your_private_key"
GOOGLE_CLOUD_CLIENT_EMAIL=your_service_account@project.iam.gserviceaccount.com

# File Upload
UPLOAD_DIR=/volume2/web/wine/wine-photos
MAX_FILE_SIZE=10485760

# App Configuration
BASE_URL=http://your-nas-ip:3000
NODE_ENV=production
PORT=3000
EOF

echo "✅ NAS setup completed!"
echo "📝 Please edit /volume2/web/wine/wine-tracker/.env.local with your API keys"