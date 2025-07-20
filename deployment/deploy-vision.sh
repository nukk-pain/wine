#!/bin/bash

# deploy-vision.sh - Google Vision API deployment script for NAS
set -e  # Exit on any error

echo "🔧 Setting up Google Vision API credentials..."

# Validate required environment variables
if [ -z "$NAS_USER" ]; then
    echo "❌ Error: NAS_USER environment variable is required"
    exit 1
fi

if [ -z "$NAS_IP" ]; then
    echo "❌ Error: NAS_IP environment variable is required"
    exit 1
fi

if [ -z "$PROJECT_PATH" ]; then
    echo "❌ Error: PROJECT_PATH environment variable is required"
    exit 1
fi

if [ -z "$GOOGLE_CLOUD_PROJECT" ]; then
    echo "❌ Error: GOOGLE_CLOUD_PROJECT environment variable is required"
    exit 1
fi

# Check if vision.json credentials file exists locally
VISION_CREDS_FILE="./vision.json"
if [ ! -f "$VISION_CREDS_FILE" ]; then
    echo "❌ Error: Vision API credentials file not found: $VISION_CREDS_FILE"
    echo "Please ensure the Google Cloud Vision API credentials file exists"
    exit 1
fi

echo "📋 Deployment Configuration:"
echo "  NAS Host: $NAS_IP"
echo "  NAS User: $NAS_USER"
echo "  Project Path: $PROJECT_PATH"
echo "  Google Cloud Project: $GOOGLE_CLOUD_PROJECT"

# Create backup of existing credentials (if any)
echo "💾 Creating backup of existing credentials..."
ssh $NAS_USER@$NAS_IP "
    cd $PROJECT_PATH
    if [ -f vision.json ]; then
        cp vision.json vision.json.backup.$(date +%Y%m%d_%H%M%S)
        echo \"  ✅ Backup created\"
    else
        echo \"  ℹ️  No existing credentials to backup\"
    fi
"

# Vision API 키 파일 복사
echo "📤 Copying Vision API credentials to NAS..."
scp "$VISION_CREDS_FILE" $NAS_USER@$NAS_IP:$PROJECT_PATH/ || {
    echo "❌ Error: Failed to copy credentials file"
    exit 1
}

# 환경 변수 설정
echo "⚙️  Setting up environment variables..."
ssh $NAS_USER@$NAS_IP "
    cd $PROJECT_PATH
    
    # Create or update .env.production file
    if [ -f .env.production ]; then
        # Backup existing .env.production
        cp .env.production .env.production.backup.$(date +%Y%m%d_%H%M%S)
    fi
    
    # Remove existing Vision API related env vars to avoid duplicates
    if [ -f .env.production ]; then
        grep -v '^GOOGLE_APPLICATION_CREDENTIALS=' .env.production > .env.production.tmp || touch .env.production.tmp
        grep -v '^GOOGLE_CLOUD_PROJECT=' .env.production.tmp > .env.production.new || touch .env.production.new
        mv .env.production.new .env.production
        rm -f .env.production.tmp
    fi
    
    # Add Vision API environment variables
    echo 'GOOGLE_APPLICATION_CREDENTIALS=./vision.json' >> .env.production
    echo 'GOOGLE_CLOUD_PROJECT=$GOOGLE_CLOUD_PROJECT' >> .env.production
    
    echo '  ✅ Environment variables configured'
"

# Validate credentials on NAS
echo "🔍 Validating credentials on NAS..."
ssh $NAS_USER@$NAS_IP "
    cd $PROJECT_PATH
    
    # Check if credentials file exists and is readable
    if [ -f vision.json ] && [ -r vision.json ]; then
        echo '  ✅ Credentials file is accessible'
        
        # Check if it's valid JSON
        if command -v node >/dev/null 2>&1; then
            if node -e 'JSON.parse(require(\"fs\").readFileSync(\"vision.json\", \"utf8\"))' >/dev/null 2>&1; then
                echo '  ✅ Credentials file is valid JSON'
            else
                echo '  ⚠️  Warning: Credentials file may not be valid JSON'
            fi
        fi
    else
        echo '  ❌ Error: Credentials file is not accessible'
        exit 1
    fi
    
    # Check if .env.production contains required variables
    if grep -q 'GOOGLE_APPLICATION_CREDENTIALS' .env.production && grep -q 'GOOGLE_CLOUD_PROJECT' .env.production; then
        echo '  ✅ Environment variables are properly set'
    else
        echo '  ❌ Error: Environment variables are not properly set'
        exit 1
    fi
"

# Test Vision API connectivity (if Node.js is available on NAS)
echo "🧪 Testing Vision API connectivity..."
ssh $NAS_USER@$NAS_IP "
    cd $PROJECT_PATH
    
    if command -v node >/dev/null 2>&1; then
        # Try to load the Vision API client (basic validation)
        node -e \"
            try {
                const { ImageAnnotatorClient } = require('@google-cloud/vision');
                const client = new ImageAnnotatorClient({
                    keyFilename: './vision.json',
                    projectId: '$GOOGLE_CLOUD_PROJECT'
                });
                console.log('  ✅ Vision API client initialized successfully');
            } catch (error) {
                console.error('  ⚠️  Warning: Vision API client initialization failed:', error.message);
            }
        \" 2>/dev/null || echo '  ℹ️  Vision API validation skipped (dependencies not installed yet)'
    else
        echo '  ℹ️  Vision API validation skipped (Node.js not available)'
    fi
"

echo "✅ Vision API setup complete"
echo ""
echo "📋 Next steps:"
echo "  1. Run the main deployment script"
echo "  2. Verify the application can access Vision API"
echo "  3. Test OCR functionality with sample images"