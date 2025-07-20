# Wine Tracker NAS Deployment Guide

This directory contains deployment scripts and configuration for deploying the Wine Tracker application to a Synology NAS with PM2 process management and Google Vision API integration.

## 📋 Prerequisites

### Local Development Machine
- Node.js 18+ with npm
- rsync (for file synchronization)
- SSH access to your Synology NAS

### Synology NAS Setup
- SSH enabled (Control Panel > Terminal & SNMP > Enable SSH service)
- Node.js and npm installed (Package Center > Node.js)
- PM2 installed globally: `npm install -g pm2`
- Git installed (optional, for version control)

### Google Cloud Vision API
- Google Cloud Project with Vision API enabled
- Service account key file (vision.json) with appropriate permissions
- Vision API quota allocation

### Notion API (Optional)
- Notion integration with database access
- API key and database ID

## 🚀 Quick Start

### 1. Environment Setup

Create the following environment variables on your local machine:

```bash
# Required for all deployments
export NAS_IP="192.168.1.100"              # Your NAS IP address
export NAS_USER="admin"                     # NAS SSH username
export PROJECT_PATH="/volume2/web/wine/wine-tracker"  # NAS project path

# Required for Google Vision API
export GOOGLE_CLOUD_PROJECT="your-project-id"

# Required for Notion integration
export NOTION_API_KEY="secret_..."
export NOTION_DATABASE_ID="your-database-id"
```

### 2. Prepare Credentials

Place your Google Cloud Vision API service account key file in the project root:
- For production: `./vision.json`
- For development: `./vision-dev.json`

### 3. Deploy to NAS

```bash
# Full deployment with Vision API setup
chmod +x deployment/deploy.sh
./deployment/deploy.sh

# Development environment deployment
NODE_ENV=development ./deployment/deploy.sh
```

## 📁 File Structure

```
deployment/
├── README.md              # This guide
├── deploy.sh              # Main deployment script
├── deploy-vision.sh       # Vision API setup script
├── validate-deployment.sh # Post-deployment validation
└── health-check.sh        # Application health monitoring
```

## 🔧 Deployment Scripts

### Main Deployment Script (`deploy.sh`)

The primary deployment script that orchestrates the entire deployment process:

**Features:**
- Environment validation and configuration
- Automated backup creation with rollback capability
- Vision API credentials deployment
- File synchronization with rsync
- PM2 process management
- Health checks and validation
- Error handling with automatic rollback

**Usage:**
```bash
# Production deployment
./deployment/deploy.sh

# Development deployment
NODE_ENV=development ./deployment/deploy.sh

# Custom configuration
NAS_IP=192.168.1.200 NAS_USER=myuser ./deployment/deploy.sh
```

### Vision API Setup Script (`deploy-vision.sh`)

Specialized script for setting up Google Cloud Vision API integration:

**Features:**
- Credentials validation and transfer
- Environment variable configuration
- Backup of existing credentials
- Basic API connectivity testing
- Comprehensive error handling

**Manual Usage:**
```bash
export NAS_IP="192.168.1.100"
export NAS_USER="admin"
export PROJECT_PATH="/volume2/web/wine/wine-tracker"
export GOOGLE_CLOUD_PROJECT="your-project-id"

./deployment/deploy-vision.sh
```

### Validation Script (`validate-deployment.sh`)

Post-deployment validation to ensure everything is working correctly:

**Checks:**
- Application process status
- API endpoint responsiveness
- Vision API functionality
- Notion API connectivity
- File permissions and accessibility

### Health Check Script (`health-check.sh`)

Ongoing monitoring script for production environments:

**Monitors:**
- PM2 process health
- Memory usage
- API response times
- Error rates
- Cache performance

## 🏗️ PM2 Configuration

The `ecosystem.config.js` file defines environment-specific configurations:

### Production Environment
```javascript
env_production: {
  NODE_ENV: 'production',
  PORT: 3000,
  GOOGLE_APPLICATION_CREDENTIALS: './vision.json',
  GOOGLE_CLOUD_PROJECT: process.env.GOOGLE_CLOUD_PROJECT,
  NOTION_API_KEY: process.env.NOTION_API_KEY,
  NOTION_DATABASE_ID: process.env.NOTION_DATABASE_ID,
  UPLOAD_DIR: '/volume2/web/wine/wine-photos'
}
```

### Development Environment
```javascript
env_development: {
  NODE_ENV: 'development',
  PORT: 3001,
  GOOGLE_APPLICATION_CREDENTIALS: './vision-dev.json',
  // ... other development-specific settings
}
```

## 🔒 Security Considerations

### Credential Management
- Never commit credential files to version control
- Use environment variables for sensitive data
- Regularly rotate API keys and service account keys
- Limit service account permissions to minimum required

### NAS Security
- Use SSH keys instead of passwords for authentication
- Regularly update NAS firmware and Node.js
- Configure firewall rules to restrict access
- Monitor access logs for unauthorized attempts

### Network Security
- Use VPN or SSH tunneling for remote deployments
- Configure SSL/TLS certificates for production
- Implement proper CORS policies
- Monitor network traffic for anomalies

## 🚨 Troubleshooting

### Common Issues

#### Deployment Fails with SSH Timeout
```bash
# Check SSH connectivity
ssh -v $NAS_USER@$NAS_IP

# Verify SSH service is running on NAS
# Control Panel > Terminal & SNMP > Enable SSH service
```

#### Vision API Authentication Errors
```bash
# Verify credentials file exists and is valid JSON
cat vision.json | jq .

# Check environment variables
echo $GOOGLE_CLOUD_PROJECT
echo $GOOGLE_APPLICATION_CREDENTIALS

# Test API access locally
node -e "
const vision = require('@google-cloud/vision');
const client = new vision.ImageAnnotatorClient();
console.log('Vision API client created successfully');
"
```

#### PM2 Process Not Starting
```bash
# SSH to NAS and check PM2 status
ssh $NAS_USER@$NAS_IP
cd $PROJECT_PATH
pm2 status
pm2 logs wine-tracker

# Check ecosystem config
node -e "console.log(require('./ecosystem.config.js'))"
```

#### File Permission Issues
```bash
# Fix ownership and permissions
ssh $NAS_USER@$NAS_IP "
cd $PROJECT_PATH
chown -R $NAS_USER:users .
chmod -R 755 .
chmod 600 vision.json
"
```

### Rollback Procedure

If deployment fails or issues arise:

```bash
# Automatic rollback (built into deploy.sh)
# Manual rollback
ssh $NAS_USER@$NAS_IP "
cd /volume2/web/wine
pm2 stop wine-tracker
rm -rf wine-tracker
mv wine-tracker_backup_YYYYMMDD_HHMMSS wine-tracker
cd wine-tracker
pm2 start ecosystem.config.js --env production
"
```

## 📊 Monitoring and Maintenance

### Regular Monitoring
```bash
# Check application status
ssh $NAS_USER@$NAS_IP "pm2 monit"

# View application logs
ssh $NAS_USER@$NAS_IP "pm2 logs wine-tracker --lines 50"

# Check system resources
ssh $NAS_USER@$NAS_IP "top"
```

### Maintenance Tasks
- Regular log rotation and cleanup
- Database optimization and backups
- Security updates and patches
- Performance monitoring and optimization
- Credential rotation and updates

## 🔄 CI/CD Integration

### GitHub Actions

The deployment can be integrated with GitHub Actions for automated deployments:

```yaml
name: Deploy to NAS
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to NAS
        env:
          NAS_IP: ${{ secrets.NAS_IP }}
          NAS_USER: ${{ secrets.NAS_USER }}
          GOOGLE_CLOUD_PROJECT: ${{ secrets.GOOGLE_CLOUD_PROJECT }}
        run: ./deployment/deploy.sh
```

### Deployment Environments

- **Development**: Automatic deployment on feature branch pushes
- **Staging**: Manual deployment from develop branch
- **Production**: Manual deployment from main branch with approval

## 📝 Environment Variables Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `NAS_IP` | Yes | Synology NAS IP address | `192.168.1.100` |
| `NAS_USER` | Yes | SSH username for NAS | `admin` |
| `PROJECT_PATH` | Yes | Application path on NAS | `/volume2/web/wine/wine-tracker` |
| `GOOGLE_CLOUD_PROJECT` | Yes | Google Cloud project ID | `wine-tracker-prod` |
| `GOOGLE_APPLICATION_CREDENTIALS` | Auto | Path to credentials file | `./vision.json` |
| `NOTION_API_KEY` | Optional | Notion integration API key | `secret_...` |
| `NOTION_DATABASE_ID` | Optional | Notion database ID | `abc123...` |
| `NODE_ENV` | Optional | Environment mode | `production` |
| `UPLOAD_DIR` | Optional | Image storage directory | `/volume2/web/wine/wine-photos` |

## 🆘 Support

For deployment issues:
1. Check the troubleshooting section above
2. Review application logs: `pm2 logs wine-tracker`
3. Verify environment configuration
4. Test API connectivity manually
5. Check NAS system resources and permissions

For development and feature requests, see the main project README.