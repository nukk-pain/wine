/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // 독립 실행형 빌드
  experimental: {
    outputFileTracingRoot: '/volume2/web/wine/wine-tracker',
  },
  async rewrites() {
    return [
      {
        source: '/uploads/:path*',
        destination: '/api/files/:path*' // NAS 파일 서빙
      }
    ];
  },
  env: {
    UPLOAD_DIR: process.env.UPLOAD_DIR || '/volume2/web/wine/wine-photos',
    BASE_URL: process.env.NODE_ENV === 'production' 
      ? 'http://your-nas-ip:3000' 
      : 'http://localhost:3001'
  }
};

module.exports = nextConfig;