#!/bin/bash

# Wine Tracker NAS Deployment Script with Vision API Support
set -e  # Exit on any error

# Default environment (can be overridden)
NODE_ENV="${NODE_ENV:-production}"
NAS_IP="${NAS_IP:-your-nas-ip}"
NAS_USER="${NAS_USER:-admin}"
PROJECT_PATH="${PROJECT_PATH:-/volume2/web/wine/wine-tracker}"

echo "🚀 Deploying Wine Tracker to NAS..."
echo "📋 Configuration:"
echo "  Environment: $NODE_ENV"
echo "  NAS Host: $NAS_IP"
echo "  NAS User: $NAS_USER"
echo "  Project Path: $PROJECT_PATH"

# Pre-deployment validation
echo "🔍 Pre-deployment validation..."
if [ "$NAS_IP" = "your-nas-ip" ]; then
    echo "❌ Error: Please set NAS_IP environment variable"
    exit 1
fi

# Create backup of current deployment
echo "💾 Creating backup of current deployment..."
BACKUP_NAME="backup_$(date +%Y%m%d_%H%M%S)"
ssh ${NAS_USER}@${NAS_IP} "
    if [ -d ${PROJECT_PATH} ]; then
        cp -r ${PROJECT_PATH} ${PROJECT_PATH}_${BACKUP_NAME}
        echo '  ✅ Backup created: ${PROJECT_PATH}_${BACKUP_NAME}'
    else
        echo '  ℹ️  No existing deployment to backup'
    fi
"

# 1. 로컬에서 빌드
echo "📦 Building application..."
npm run build

# 2. Deploy Vision API credentials
echo "🔧 Deploying Vision API credentials..."
export NAS_IP NAS_USER PROJECT_PATH
if [ -f "./deployment/deploy-vision.sh" ]; then
    chmod +x ./deployment/deploy-vision.sh
    ./deployment/deploy-vision.sh
else
    echo "⚠️  Warning: deploy-vision.sh not found, skipping Vision API setup"
fi

# 3. NAS로 파일 전송 (rsync 사용)
echo "📤 Uploading files to NAS..."
rsync -avz --delete \
  --exclude node_modules \
  --exclude .git \
  --exclude .next \
  --exclude '*.log' \
  --exclude '.env.local' \
  --exclude 'test-uploads' \
  ./ ${NAS_USER}@${NAS_IP}:${PROJECT_PATH}/

# 4. NAS에서 의존성 설치 및 빌드
echo "📥 Installing dependencies on NAS..."
ssh ${NAS_USER}@${NAS_IP} "
  cd ${PROJECT_PATH} && \
  export NODE_ENV=${NODE_ENV} && \
  npm ci --production && \
  npm run build
"

# 5. PM2로 앱 재시작
echo "🔄 Restarting application with PM2..."
ssh ${NAS_USER}@${NAS_IP} "
  cd ${PROJECT_PATH} && \
  export NODE_ENV=${NODE_ENV} && \
  pm2 stop wine-tracker || true && \
  pm2 delete wine-tracker || true && \
  pm2 start ecosystem.config.js --env ${NODE_ENV} && \
  pm2 save
"

# 6. 상태 확인 및 검증
echo "✅ Checking application status..."
ssh ${NAS_USER}@${NAS_IP} "
    cd ${PROJECT_PATH} && \
    pm2 status wine-tracker && \
    echo '🌡️  Application health check...' && \
    sleep 5 && \
    if pm2 list | grep -q 'online'; then
        echo '  ✅ Application is running'
    else
        echo '  ❌ Application failed to start'
        pm2 logs wine-tracker --lines 10
        exit 1
    fi
"

# 7. Rollback procedure (in case of failure)
rollback() {
    echo "🔄 Rolling back to previous version..."
    ssh ${NAS_USER}@${NAS_IP} "
        if [ -d ${PROJECT_PATH}_${BACKUP_NAME} ]; then
            pm2 stop wine-tracker || true
            rm -rf ${PROJECT_PATH}
            mv ${PROJECT_PATH}_${BACKUP_NAME} ${PROJECT_PATH}
            cd ${PROJECT_PATH}
            pm2 start ecosystem.config.js --env ${NODE_ENV}
            echo '  ✅ Rollback completed'
        else
            echo '  ❌ No backup found for rollback'
        fi
    "
}

# Set up trap for rollback on failure
trap 'echo "❌ Deployment failed!"; rollback; exit 1' ERR

echo "🎉 Deployment completed successfully!"
echo "🌐 Access your app at: http://${NAS_IP}:3000"
echo "📊 Monitor with: ssh ${NAS_USER}@${NAS_IP} 'pm2 monit'"
echo ""
echo "💾 Backup available at: ${PROJECT_PATH}_${BACKUP_NAME}"
echo "🔄 To rollback: ssh ${NAS_USER}@${NAS_IP} 'cd ${PROJECT_PATH} && pm2 stop wine-tracker && rm -rf ${PROJECT_PATH} && mv ${PROJECT_PATH}_${BACKUP_NAME} ${PROJECT_PATH} && cd ${PROJECT_PATH} && pm2 start ecosystem.config.js --env ${NODE_ENV}'"