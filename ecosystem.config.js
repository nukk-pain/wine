module.exports = {
  apps: [{
    name: 'wine-tracker',
    script: 'npm',
    args: 'start',
    cwd: '/volume2/web/wine',
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    max_memory_restart: '1G',
    autorestart: true,
    min_uptime: '10s',
    max_restarts: 10,
    env_production: {
      NODE_ENV: 'production',
      PORT: 5959,
      GOOGLE_APPLICATION_CREDENTIALS: '/volume2/web/wine/vision.json',
      GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
      GOOGLE_CLOUD_PROJECT: process.env.GOOGLE_CLOUD_PROJECT || '',
      NOTION_API_KEY: process.env.NOTION_API_KEY || '',
      NOTION_DATABASE_ID: process.env.NOTION_DATABASE_ID || ''
    },
    env: {
      NODE_ENV: 'production',
      PORT: 5959,
      GOOGLE_APPLICATION_CREDENTIALS: '/volume2/web/wine/vision.json',
      GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
      GOOGLE_CLOUD_PROJECT: process.env.GOOGLE_CLOUD_PROJECT || '',
      NOTION_API_KEY: process.env.NOTION_API_KEY || '',
      NOTION_DATABASE_ID: process.env.NOTION_DATABASE_ID || ''
    },
    env_development: {
      NODE_ENV: 'development',
      PORT: 3001,
      GOOGLE_APPLICATION_CREDENTIALS: './vision-dev.json',
      GEMINI_API_KEY: process.env.GEMINI_API_KEY_DEV || process.env.GEMINI_API_KEY || '',
      GOOGLE_CLOUD_PROJECT: process.env.GOOGLE_CLOUD_PROJECT_DEV || process.env.GOOGLE_CLOUD_PROJECT || '',
      NOTION_API_KEY: process.env.NOTION_API_KEY_DEV || process.env.NOTION_API_KEY || '',
      NOTION_DATABASE_ID: process.env.NOTION_DATABASE_ID_DEV || process.env.NOTION_DATABASE_ID || ''
    },
    log_file: '/volume2/web/wine/logs/combined.log',
    out_file: '/volume2/web/wine/logs/out.log',
    error_file: '/volume2/web/wine/logs/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    time: true,
    combine_logs: true,
    merge_logs: true
  }]
};