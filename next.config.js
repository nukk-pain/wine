/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove standalone output for Vercel deployment
  // Remove NAS-specific rewrites and paths
  // Environment variables will be handled by Vercel dashboard

  // Performance optimizations
  experimental: {
    esmExternals: true,
  },

  // ESLint는 별도로 실행 (빌드 시 비활성화)
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Webpack optimizations for development
  webpack: (config, { dev }) => {
    if (dev) {
      // Optimize watch mode
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
        ignored: /node_modules/
      };

      // Reduce bundle analysis overhead
      config.optimization = {
        ...config.optimization,
        removeAvailableModules: false,
        removeEmptyChunks: false,
        splitChunks: false,
      };
    }

    return config;
  },
};

module.exports = nextConfig;