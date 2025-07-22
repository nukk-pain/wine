/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove standalone output for Vercel deployment
  // Remove NAS-specific rewrites and paths
  // Environment variables will be handled by Vercel dashboard
  
  // Performance optimizations
  experimental: {
    swcMinify: true,
    esmExternals: true,
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