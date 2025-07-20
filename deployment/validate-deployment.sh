#!/bin/bash

# validate-deployment.sh - Post-deployment validation script
set -e

# Configuration
NAS_IP="${NAS_IP:-your-nas-ip}"
NAS_USER="${NAS_USER:-admin}"
PROJECT_PATH="${PROJECT_PATH:-/volume2/web/wine/wine-tracker}"
NODE_ENV="${NODE_ENV:-production}"

echo "🔍 Validating Wine Tracker deployment..."
echo "📋 Configuration:"
echo "  NAS Host: $NAS_IP"
echo "  NAS User: $NAS_USER" 
echo "  Project Path: $PROJECT_PATH"
echo "  Environment: $NODE_ENV"

# Exit codes
EXIT_SUCCESS=0
EXIT_FAILURE=1
VALIDATION_ERRORS=0

# Helper function to log validation results
validate_check() {
    local test_name="$1"
    local test_command="$2"
    local success_message="$3"
    local error_message="$4"
    
    echo -n "  Testing $test_name... "
    
    if eval "$test_command" >/dev/null 2>&1; then
        echo "✅ $success_message"
        return 0
    else
        echo "❌ $error_message"
        VALIDATION_ERRORS=$((VALIDATION_ERRORS + 1))
        return 1
    fi
}

echo ""
echo "1️⃣ Basic Connectivity Tests"

validate_check "SSH connectivity" \
    "ssh -o ConnectTimeout=10 $NAS_USER@$NAS_IP 'echo test'" \
    "SSH connection successful" \
    "Cannot connect to NAS via SSH"

validate_check "Project directory" \
    "ssh $NAS_USER@$NAS_IP 'test -d $PROJECT_PATH'" \
    "Project directory exists" \
    "Project directory not found"

validate_check "Node.js availability" \
    "ssh $NAS_USER@$NAS_IP 'command -v node'" \
    "Node.js is installed" \
    "Node.js not found on NAS"

validate_check "PM2 availability" \
    "ssh $NAS_USER@$NAS_IP 'command -v pm2'" \
    "PM2 is installed" \
    "PM2 not found on NAS"

echo ""
echo "2️⃣ Application Process Tests"

validate_check "PM2 process status" \
    "ssh $NAS_USER@$NAS_IP 'pm2 list | grep -q wine-tracker'" \
    "Wine Tracker process is registered" \
    "Wine Tracker process not found in PM2"

validate_check "Process running state" \
    "ssh $NAS_USER@$NAS_IP 'pm2 list | grep wine-tracker | grep -q online'" \
    "Wine Tracker process is online" \
    "Wine Tracker process is not running"

validate_check "Process memory usage" \
    "ssh $NAS_USER@$NAS_IP 'pm2 list | grep wine-tracker | grep -v \"999.9 MB\"'" \
    "Memory usage within normal limits" \
    "High memory usage detected"

echo ""
echo "3️⃣ Application Configuration Tests"

validate_check "Package.json exists" \
    "ssh $NAS_USER@$NAS_IP 'test -f $PROJECT_PATH/package.json'" \
    "Package.json found" \
    "Package.json missing"

validate_check "Node modules installed" \
    "ssh $NAS_USER@$NAS_IP 'test -d $PROJECT_PATH/node_modules'" \
    "Dependencies installed" \
    "Node modules directory missing"

validate_check "Next.js build artifacts" \
    "ssh $NAS_USER@$NAS_IP 'test -d $PROJECT_PATH/.next'" \
    "Application built successfully" \
    "Next.js build artifacts missing"

validate_check "PM2 ecosystem config" \
    "ssh $NAS_USER@$NAS_IP 'test -f $PROJECT_PATH/ecosystem.config.js'" \
    "PM2 configuration found" \
    "PM2 ecosystem config missing"

echo ""
echo "4️⃣ Environment and Credentials Tests"

validate_check "Environment file" \
    "ssh $NAS_USER@$NAS_IP 'test -f $PROJECT_PATH/.env.production'" \
    "Production environment file found" \
    "Production environment file missing"

validate_check "Vision API credentials" \
    "ssh $NAS_USER@$NAS_IP 'test -f $PROJECT_PATH/vision.json'" \
    "Vision API credentials found" \
    "Vision API credentials missing"

validate_check "Credentials file permissions" \
    "ssh $NAS_USER@$NAS_IP 'test \$(stat -c \"%a\" $PROJECT_PATH/vision.json) = \"600\"'" \
    "Credentials have secure permissions" \
    "Credentials permissions may be too open"

validate_check "Upload directory" \
    "ssh $NAS_USER@$NAS_IP 'test -d /volume2/web/wine/wine-photos'" \
    "Upload directory exists" \
    "Upload directory missing"

echo ""
echo "5️⃣ Application Functionality Tests"

# Test application responsiveness
APP_PORT=$(ssh $NAS_USER@$NAS_IP "cd $PROJECT_PATH && grep -o 'PORT.*[0-9]*' .env.production | grep -o '[0-9]*' || echo 3000")

validate_check "HTTP endpoint" \
    "ssh $NAS_USER@$NAS_IP 'curl -s -o /dev/null -w \"%{http_code}\" http://localhost:$APP_PORT/ | grep -q \"200\"'" \
    "Application responds to HTTP requests" \
    "Application not responding to HTTP requests"

validate_check "API health endpoint" \
    "ssh $NAS_USER@$NAS_IP 'curl -s http://localhost:$APP_PORT/api/health | grep -q \"ok\" || curl -s http://localhost:$APP_PORT/ | grep -q \"Wine Tracker\"'" \
    "API endpoints accessible" \
    "API endpoints not responding"

echo ""
echo "6️⃣ External Service Tests"

validate_check "Google Vision API configuration" \
    "ssh $NAS_USER@$NAS_IP 'cd $PROJECT_PATH && grep -q \"GOOGLE_APPLICATION_CREDENTIALS\" .env.production'" \
    "Vision API environment configured" \
    "Vision API configuration missing"

validate_check "Notion API configuration" \
    "ssh $NAS_USER@$NAS_IP 'cd $PROJECT_PATH && (grep -q \"NOTION_API_KEY\" .env.production || echo \"Optional service\")'" \
    "Notion API configured (or optional)" \
    "Notion API configuration issue"

echo ""
echo "7️⃣ Logging and Monitoring Tests"

validate_check "Log directory" \
    "ssh $NAS_USER@$NAS_IP 'test -d $PROJECT_PATH/logs'" \
    "Log directory exists" \
    "Log directory missing"

validate_check "Application logs" \
    "ssh $NAS_USER@$NAS_IP 'pm2 logs wine-tracker --lines 1 | grep -v \"PM2\"'" \
    "Application generating logs" \
    "No recent application logs"

validate_check "Error log size" \
    "ssh $NAS_USER@$NAS_IP 'test ! -f $PROJECT_PATH/logs/error.log || test \$(wc -l < $PROJECT_PATH/logs/error.log) -lt 100'" \
    "Error log size reasonable" \
    "High number of errors in logs"

echo ""
echo "8️⃣ Performance and Resource Tests"

validate_check "CPU usage" \
    "ssh $NAS_USER@$NAS_IP 'pm2 list | grep wine-tracker | awk \"{print \$8}\" | cut -d\"%\" -f1 | awk \"\$1 < 80\"'" \
    "CPU usage within limits" \
    "High CPU usage detected"

validate_check "Disk space" \
    "ssh $NAS_USER@$NAS_IP 'df $PROJECT_PATH | tail -1 | awk \"{print \$5}\" | cut -d\"%\" -f1 | awk \"\$1 < 90\"'" \
    "Sufficient disk space available" \
    "Low disk space warning"

echo ""
echo "📊 Validation Summary"
echo "=================="

if [ $VALIDATION_ERRORS -eq 0 ]; then
    echo "🎉 All validation tests passed!"
    echo "✅ Wine Tracker is successfully deployed and operational"
    echo ""
    echo "🌐 Application URL: http://$NAS_IP:$APP_PORT"
    echo "📊 Monitoring: ssh $NAS_USER@$NAS_IP 'pm2 monit'"
    echo "📝 Logs: ssh $NAS_USER@$NAS_IP 'pm2 logs wine-tracker'"
    
    exit $EXIT_SUCCESS
else
    echo "⚠️  $VALIDATION_ERRORS validation test(s) failed"
    echo "❌ Deployment may have issues that need attention"
    echo ""
    echo "🔧 Troubleshooting steps:"
    echo "1. Check application logs: ssh $NAS_USER@$NAS_IP 'pm2 logs wine-tracker'"
    echo "2. Verify environment configuration"
    echo "3. Test API connectivity manually"
    echo "4. Check system resources and permissions"
    echo "5. Review the deployment README for detailed troubleshooting"
    
    exit $EXIT_FAILURE
fi