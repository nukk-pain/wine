// lib/config/index.ts
import path from 'path';
import fs from 'fs';

/**
 * Environment-specific configuration for the Wine Tracker application
 * Supports development, production, and test environments
 */

export type Environment = 'development' | 'production' | 'test';

export interface VisionConfig {
  projectId?: string;
  keyFilename?: string;
  enabled: boolean;
  timeout: number;
  retries: number;
  mockMode: boolean;
}

export interface NotionConfig {
  apiKey?: string;
  databaseId?: string;
  enabled: boolean;
  timeout: number;
  retries: number;
  mockMode: boolean;
}

export interface CacheConfig {
  enabled: boolean;
  stdTTL: number;
  maxKeys: number;
  checkperiod: number;
  memoryLimits: {
    maxHeapUsage: number;
    warningThreshold: number;
    cleanupThreshold: number;
  };
}

export interface LoggingConfig {
  level: string;
  fileLogging: boolean;
  consoleLogging: boolean;
  maxFileSize: number;
  maxFiles: number;
  silent: boolean;
}

export interface UploadConfig {
  uploadDir: string;
  maxFileSize: number;
  allowedTypes: string[];
  imageStorage: {
    nas: {
      enabled: boolean;
      path: string;
    };
    local: {
      enabled: boolean;
      path: string;
    };
  };
}

export interface AppConfig {
  environment: Environment;
  vision: VisionConfig;
  notion: NotionConfig;
  cache: CacheConfig;
  logging: LoggingConfig;
  upload: UploadConfig;
  server: {
    port: number;
    host: string;
  };
}

/**
 * Get the current environment
 */
export function getEnvironment(): Environment {
  const env = process.env.NODE_ENV as Environment;
  return ['development', 'production', 'test'].includes(env) ? env : 'development';
}

/**
 * Vision API configuration by environment
 */
export const visionConfig: Record<Environment, VisionConfig> = {
  development: {
    projectId: process.env.GOOGLE_CLOUD_PROJECT_DEV,
    keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS_DEV || './vision-dev.json',
    enabled: true,
    timeout: 30000, // 30 seconds
    retries: 2,
    mockMode: false
  },
  production: {
    projectId: process.env.GOOGLE_CLOUD_PROJECT_PROD || process.env.GOOGLE_CLOUD_PROJECT,
    keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS || './vision.json',
    enabled: true,
    timeout: 30000,
    retries: 3,
    mockMode: false
  },
  test: {
    projectId: 'test-project',
    keyFilename: undefined, // No real credentials in test
    enabled: false, // Disable real API calls in test
    timeout: 5000,
    retries: 1,
    mockMode: true // Always use mock in test
  }
};

/**
 * Notion API configuration by environment
 */
export const notionConfig: Record<Environment, NotionConfig> = {
  development: {
    apiKey: process.env.NOTION_API_KEY_DEV || process.env.NOTION_API_KEY,
    databaseId: process.env.NOTION_DATABASE_ID_DEV || process.env.NOTION_DATABASE_ID,
    enabled: true,
    timeout: 15000,
    retries: 2,
    mockMode: false
  },
  production: {
    apiKey: process.env.NOTION_API_KEY,
    databaseId: process.env.NOTION_DATABASE_ID,
    enabled: true,
    timeout: 15000,
    retries: 3,
    mockMode: false
  },
  test: {
    apiKey: 'test-api-key',
    databaseId: 'test-database-id',
    enabled: false,
    timeout: 5000,
    retries: 1,
    mockMode: true
  }
};

/**
 * Cache configuration by environment
 */
export const cacheConfig: Record<Environment, CacheConfig> = {
  development: {
    enabled: true,
    stdTTL: 1800, // 30 minutes
    maxKeys: 500,
    checkperiod: 300, // 5 minutes
    memoryLimits: {
      maxHeapUsage: 200 * 1024 * 1024, // 200MB
      warningThreshold: 150 * 1024 * 1024, // 150MB
      cleanupThreshold: 180 * 1024 * 1024, // 180MB
    }
  },
  production: {
    enabled: true,
    stdTTL: 3600, // 1 hour
    maxKeys: 2000,
    checkperiod: 600, // 10 minutes
    memoryLimits: {
      maxHeapUsage: 500 * 1024 * 1024, // 500MB
      warningThreshold: 400 * 1024 * 1024, // 400MB
      cleanupThreshold: 450 * 1024 * 1024, // 450MB
    }
  },
  test: {
    enabled: true,
    stdTTL: 300, // 5 minutes
    maxKeys: 100,
    checkperiod: 60, // 1 minute
    memoryLimits: {
      maxHeapUsage: 100 * 1024 * 1024, // 100MB
      warningThreshold: 80 * 1024 * 1024, // 80MB
      cleanupThreshold: 90 * 1024 * 1024, // 90MB
    }
  }
};

/**
 * Logging configuration by environment
 */
export const loggingConfig: Record<Environment, LoggingConfig> = {
  development: {
    level: 'debug',
    fileLogging: true,
    consoleLogging: true,
    maxFileSize: 5 * 1024 * 1024, // 5MB
    maxFiles: 3,
    silent: false
  },
  production: {
    level: 'info',
    fileLogging: true,
    consoleLogging: false,
    maxFileSize: 10 * 1024 * 1024, // 10MB
    maxFiles: 5,
    silent: false
  },
  test: {
    level: 'error',
    fileLogging: false,
    consoleLogging: false,
    maxFileSize: 1 * 1024 * 1024, // 1MB
    maxFiles: 1,
    silent: true
  }
};

/**
 * Upload configuration by environment
 */
export const uploadConfig: Record<Environment, UploadConfig> = {
  development: {
    uploadDir: process.env.UPLOAD_DIR || './uploads',
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    imageStorage: {
      nas: {
        enabled: false,
        path: ''
      },
      local: {
        enabled: true,
        path: './uploads'
      }
    }
  },
  production: {
    uploadDir: process.env.UPLOAD_DIR || '/tmp/uploads',
    maxFileSize: 50 * 1024 * 1024, // 50MB for production
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    imageStorage: {
      nas: {
        enabled: false,
        path: ''
      },
      local: {
        enabled: true,
        path: '/tmp/uploads'
      }
    }
  },
  test: {
    uploadDir: './test-uploads',
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png'],
    imageStorage: {
      nas: {
        enabled: false,
        path: ''
      },
      local: {
        enabled: true,
        path: './test-uploads'
      }
    }
  }
};

/**
 * Get configuration for current environment
 */
export function getConfig(): AppConfig {
  const env = getEnvironment();
  
  return {
    environment: env,
    vision: visionConfig[env],
    notion: notionConfig[env],
    cache: cacheConfig[env],
    logging: loggingConfig[env],
    upload: uploadConfig[env],
    server: {
      port: parseInt(process.env.PORT || '3000'),
      host: process.env.HOST || 'localhost'
    }
  };
}

/**
 * Validate configuration for current environment
 */
export function validateConfig(): { valid: boolean; errors: string[] } {
  const config = getConfig();
  const errors: string[] = [];

  // Vision API validation
  if (config.vision.enabled && config.environment !== 'test') {
    // In Vercel, we check for credentials string instead of file
    if (process.env.VERCEL) {
      if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        errors.push('GOOGLE_APPLICATION_CREDENTIALS environment variable is required for Vercel deployment');
      }
    } else if (config.vision.keyFilename && !fs.existsSync(config.vision.keyFilename)) {
      errors.push(`Vision API credentials file not found: ${config.vision.keyFilename}`);
    }
  }

  // Notion API validation
  if (config.notion.enabled && config.environment !== 'test') {
    if (!config.notion.apiKey) {
      errors.push('Notion API key is required for non-test environments');
    }
    
    if (!config.notion.databaseId) {
      errors.push('Notion database ID is required for non-test environments');
    }
  }

  // Upload directory validation - skip for Vercel
  if (!process.env.VERCEL) {
    const uploadParent = path.dirname(config.upload.uploadDir);
    if (!fs.existsSync(uploadParent)) {
      errors.push(`Upload directory parent does not exist: ${uploadParent}`);
    }
  }

  // Server configuration validation
  if (config.server.port < 1 || config.server.port > 65535) {
    errors.push(`Invalid server port: ${config.server.port}`);
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Get environment-specific credentials path
 */
export function getCredentialsPath(service: 'vision' | 'notion'): string | undefined {
  const config = getConfig();
  
  switch (service) {
    case 'vision':
      return config.vision.keyFilename;
    case 'notion':
      // Notion uses API key, not file
      return undefined;
    default:
      return undefined;
  }
}

/**
 * Check if a service is enabled in current environment
 */
export function isServiceEnabled(service: 'vision' | 'notion' | 'cache'): boolean {
  const config = getConfig();
  
  switch (service) {
    case 'vision':
      return config.vision.enabled;
    case 'notion':
      return config.notion.enabled;
    case 'cache':
      return config.cache.enabled;
    default:
      return false;
  }
}

/**
 * Get environment-specific timeout for a service
 */
export function getServiceTimeout(service: 'vision' | 'notion'): number {
  const config = getConfig();
  
  switch (service) {
    case 'vision':
      return config.vision.timeout;
    case 'notion':
      return config.notion.timeout;
    default:
      return 30000; // Default 30 seconds
  }
}

/**
 * Get Notion configuration for current environment
 */
export function getNotionConfig(): NotionConfig & { credentials?: string } {
  const env = getEnvironment();
  const config = notionConfig[env];
  
  // For Vercel deployment, ensure we use process.env directly
  if (process.env.VERCEL) {
    return {
      ...config,
      apiKey: process.env.NOTION_API_KEY || config.apiKey,
      databaseId: process.env.NOTION_DATABASE_ID || config.databaseId,
    };
  }
  
  return config;
}

/**
 * Get Vision configuration for current environment
 */
export function getVisionConfig(): VisionConfig & { credentials?: string } {
  const env = getEnvironment();
  const config = visionConfig[env];
  
  // For Vercel deployment, handle Google credentials as JSON string
  if (process.env.VERCEL) {
    return {
      ...config,
      credentials: process.env.GOOGLE_APPLICATION_CREDENTIALS || '',
      keyFilename: undefined, // Don't use file path in Vercel
    };
  }
  
  // In non-Vercel environments, try to read from file or use env var
  const credentials = process.env.GOOGLE_APPLICATION_CREDENTIALS || 
    (config.keyFilename && fs.existsSync(config.keyFilename) ? 
      fs.readFileSync(config.keyFilename, 'utf8') : undefined);
  
  return {
    ...config,
    credentials,
  };
}

// Export the current config as default
export default getConfig();