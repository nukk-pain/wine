module.exports = {
  apps: [{
    name: 'wine-tracker',
    script: 'npm',
    args: 'start',
    cwd: '/volume2/web/wine/wine-tracker',
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    max_memory_restart: '500M',
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000,
      GOOGLE_APPLICATION_CREDENTIALS: './vision.json',
      GOOGLE_CLOUD_PROJECT: process.env.GOOGLE_CLOUD_PROJECT || '',
      NOTION_API_KEY: process.env.NOTION_API_KEY || '',
      NOTION_DATABASE_ID: process.env.NOTION_DATABASE_ID || '',
      UPLOAD_DIR: '/volume2/web/wine/wine-photos'
    },
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      GOOGLE_APPLICATION_CREDENTIALS: './vision.json',
      GOOGLE_CLOUD_PROJECT: process.env.GOOGLE_CLOUD_PROJECT || '',
      NOTION_API_KEY: process.env.NOTION_API_KEY || '',
      NOTION_DATABASE_ID: process.env.NOTION_DATABASE_ID || '',
      UPLOAD_DIR: '/volume2/web/wine/wine-photos'
    },
    env_development: {
      NODE_ENV: 'development',
      PORT: 3001,
      GOOGLE_APPLICATION_CREDENTIALS: './vision-dev.json',
      GOOGLE_CLOUD_PROJECT: process.env.GOOGLE_CLOUD_PROJECT_DEV || process.env.GOOGLE_CLOUD_PROJECT || '',
      NOTION_API_KEY: process.env.NOTION_API_KEY_DEV || process.env.NOTION_API_KEY || '',
      NOTION_DATABASE_ID: process.env.NOTION_DATABASE_ID_DEV || process.env.NOTION_DATABASE_ID || '',
      UPLOAD_DIR: './uploads'
    },
    log_file: '/volume2/web/wine/wine-tracker/logs/combined.log',
    out_file: '/volume2/web/wine/wine-tracker/logs/out.log',
    error_file: '/volume2/web/wine/wine-tracker/logs/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
};