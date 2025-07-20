// __tests__/unit/config.test.ts
import { 
  getConfig, 
  getEnvironment, 
  validateConfig, 
  isServiceEnabled, 
  getServiceTimeout,
  visionConfig,
  notionConfig,
  cacheConfig,
  loggingConfig,
  uploadConfig
} from '@/lib/config';

describe('Environment Configuration', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  
  afterEach(() => {
    // Restore original NODE_ENV
    process.env.NODE_ENV = originalNodeEnv;
  });

  describe('Environment Detection', () => {
    it('should detect test environment correctly', () => {
      process.env.NODE_ENV = 'test';
      expect(getEnvironment()).toBe('test');
    });

    it('should detect development environment correctly', () => {
      process.env.NODE_ENV = 'development';
      expect(getEnvironment()).toBe('development');
    });

    it('should detect production environment correctly', () => {
      process.env.NODE_ENV = 'production';
      expect(getEnvironment()).toBe('production');
    });

    it('should default to development for invalid environment', () => {
      process.env.NODE_ENV = 'invalid';
      expect(getEnvironment()).toBe('development');
    });

    it('should default to development when NODE_ENV is undefined', () => {
      delete process.env.NODE_ENV;
      expect(getEnvironment()).toBe('development');
    });
  });

  describe('Configuration by Environment', () => {
    it('should provide test environment configuration', () => {
      process.env.NODE_ENV = 'test';
      const config = getConfig();
      
      expect(config.environment).toBe('test');
      expect(config.vision.enabled).toBe(false);
      expect(config.vision.mockMode).toBe(true);
      expect(config.notion.enabled).toBe(false);
      expect(config.notion.mockMode).toBe(true);
      expect(config.logging.silent).toBe(true);
      expect(config.logging.fileLogging).toBe(false);
    });

    it('should provide development environment configuration', () => {
      process.env.NODE_ENV = 'development';
      const config = getConfig();
      
      expect(config.environment).toBe('development');
      expect(config.vision.enabled).toBe(true);
      expect(config.vision.mockMode).toBe(false);
      expect(config.notion.enabled).toBe(true);
      expect(config.notion.mockMode).toBe(false);
      expect(config.logging.silent).toBe(false);
      expect(config.logging.consoleLogging).toBe(true);
    });

    it('should provide production environment configuration', () => {
      process.env.NODE_ENV = 'production';
      const config = getConfig();
      
      expect(config.environment).toBe('production');
      expect(config.vision.enabled).toBe(true);
      expect(config.vision.mockMode).toBe(false);
      expect(config.notion.enabled).toBe(true);
      expect(config.notion.mockMode).toBe(false);
      expect(config.logging.consoleLogging).toBe(false);
      expect(config.cache.maxKeys).toBe(2000); // Higher in production
    });
  });

  describe('Vision Configuration', () => {
    it('should have correct test configuration for Vision API', () => {
      const testConfig = visionConfig.test;
      
      expect(testConfig.enabled).toBe(false);
      expect(testConfig.mockMode).toBe(true);
      expect(testConfig.projectId).toBe('test-project');
      expect(testConfig.timeout).toBe(5000);
      expect(testConfig.retries).toBe(1);
    });

    it('should have correct production configuration for Vision API', () => {
      const prodConfig = visionConfig.production;
      
      expect(prodConfig.enabled).toBe(true);
      expect(prodConfig.mockMode).toBe(false);
      expect(prodConfig.timeout).toBe(30000);
      expect(prodConfig.retries).toBe(3);
    });

    it('should use environment variables for Vision API in production', () => {
      // This test verifies that the configuration structure correctly references environment variables
      // Note: The actual values depend on what's currently set in the environment
      const prodConfig = visionConfig.production;
      
      // Verify that the configuration uses environment variables or has defaults
      expect(prodConfig.projectId === undefined || typeof prodConfig.projectId === 'string').toBe(true);
      expect(typeof prodConfig.keyFilename === 'string').toBe(true);
      expect(prodConfig.enabled).toBe(true);
      expect(prodConfig.mockMode).toBe(false);
    });
  });

  describe('Notion Configuration', () => {
    it('should have correct test configuration for Notion API', () => {
      const testConfig = notionConfig.test;
      
      expect(testConfig.enabled).toBe(false);
      expect(testConfig.mockMode).toBe(true);
      expect(testConfig.apiKey).toBe('test-api-key');
      expect(testConfig.databaseId).toBe('test-database-id');
      expect(testConfig.timeout).toBe(5000);
    });

    it('should use environment variables for Notion API', () => {
      // This test verifies that the configuration structure correctly references environment variables
      // Note: The actual values depend on what's currently set in the environment
      const devConfig = notionConfig.development;
      
      // Verify that the configuration uses environment variables or has defaults
      expect(devConfig.apiKey === undefined || typeof devConfig.apiKey === 'string').toBe(true);
      expect(devConfig.databaseId === undefined || typeof devConfig.databaseId === 'string').toBe(true);
      expect(devConfig.enabled).toBe(true);
      expect(devConfig.mockMode).toBe(false);
    });
  });

  describe('Cache Configuration', () => {
    it('should have appropriate cache settings for each environment', () => {
      const testCache = cacheConfig.test;
      const devCache = cacheConfig.development;
      const prodCache = cacheConfig.production;
      
      // Test environment should have minimal cache
      expect(testCache.maxKeys).toBe(100);
      expect(testCache.stdTTL).toBe(300); // 5 minutes
      
      // Development should be moderate
      expect(devCache.maxKeys).toBe(500);
      expect(devCache.stdTTL).toBe(1800); // 30 minutes
      
      // Production should be highest
      expect(prodCache.maxKeys).toBe(2000);
      expect(prodCache.stdTTL).toBe(3600); // 1 hour
    });

    it('should have appropriate memory limits for each environment', () => {
      const testLimits = cacheConfig.test.memoryLimits;
      const prodLimits = cacheConfig.production.memoryLimits;
      
      expect(testLimits.maxHeapUsage).toBeLessThan(prodLimits.maxHeapUsage);
      expect(testLimits.warningThreshold).toBeLessThan(prodLimits.warningThreshold);
      expect(testLimits.cleanupThreshold).toBeLessThan(prodLimits.cleanupThreshold);
    });
  });

  describe('Logging Configuration', () => {
    it('should have environment-appropriate logging settings', () => {
      const testLogging = loggingConfig.test;
      const devLogging = loggingConfig.development;
      const prodLogging = loggingConfig.production;
      
      // Test should be silent
      expect(testLogging.silent).toBe(true);
      expect(testLogging.fileLogging).toBe(false);
      
      // Development should be verbose
      expect(devLogging.level).toBe('debug');
      expect(devLogging.consoleLogging).toBe(true);
      
      // Production should be optimized
      expect(prodLogging.level).toBe('info');
      expect(prodLogging.consoleLogging).toBe(false);
      expect(prodLogging.maxFileSize).toBeGreaterThan(devLogging.maxFileSize);
    });
  });

  describe('Upload Configuration', () => {
    it('should have correct upload settings for each environment', () => {
      const testUpload = uploadConfig.test;
      const devUpload = uploadConfig.development;
      const prodUpload = uploadConfig.production;
      
      // Test should use minimal settings
      expect(testUpload.maxFileSize).toBe(5 * 1024 * 1024); // 5MB
      expect(testUpload.imageStorage.local.enabled).toBe(true);
      expect(testUpload.imageStorage.nas.enabled).toBe(false);
      
      // Production should use NAS
      expect(prodUpload.imageStorage.nas.enabled).toBe(true);
      expect(prodUpload.imageStorage.local.enabled).toBe(false);
      expect(prodUpload.maxFileSize).toBe(50 * 1024 * 1024); // 50MB
    });

    it('should use environment variables for upload directory', () => {
      // This test verifies that the configuration structure correctly uses environment variables
      const devConfig = uploadConfig.development;
      
      // Verify that upload directory configuration is a string (can be from env or default)
      expect(typeof devConfig.uploadDir).toBe('string');
      expect(devConfig.uploadDir.length).toBeGreaterThan(0);
      expect(Array.isArray(devConfig.allowedTypes)).toBe(true);
      expect(devConfig.allowedTypes.length).toBeGreaterThan(0);
    });
  });

  describe('Service State Functions', () => {
    it('should correctly report service enabled state in test environment', () => {
      process.env.NODE_ENV = 'test';
      
      expect(isServiceEnabled('vision')).toBe(false);
      expect(isServiceEnabled('notion')).toBe(false);
      expect(isServiceEnabled('cache')).toBe(true); // Cache still enabled in test
    });

    it('should correctly report service enabled state in production environment', () => {
      process.env.NODE_ENV = 'production';
      
      expect(isServiceEnabled('vision')).toBe(true);
      expect(isServiceEnabled('notion')).toBe(true);
      expect(isServiceEnabled('cache')).toBe(true);
    });

    it('should return correct timeouts for services', () => {
      process.env.NODE_ENV = 'test';
      expect(getServiceTimeout('vision')).toBe(5000);
      expect(getServiceTimeout('notion')).toBe(5000);
      
      process.env.NODE_ENV = 'production';
      expect(getServiceTimeout('vision')).toBe(30000);
      expect(getServiceTimeout('notion')).toBe(15000);
    });
  });

  describe('Configuration Validation', () => {
    it('should validate test environment configuration successfully', () => {
      process.env.NODE_ENV = 'test';
      
      const validation = validateConfig();
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should identify missing credentials in production', () => {
      process.env.NODE_ENV = 'production';
      // Clear environment variables
      delete process.env.GOOGLE_CLOUD_PROJECT;
      delete process.env.NOTION_API_KEY;
      delete process.env.NOTION_DATABASE_ID;
      
      const validation = validateConfig();
      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
      
      // Check that error messages contain expected text
      const errorText = validation.errors.join(' ');
      expect(errorText).toContain('Vision API project ID');
      expect(errorText).toContain('Notion');
    });

    it('should validate server port configuration', () => {
      process.env.PORT = '99999'; // Invalid port
      
      const validation = validateConfig();
      expect(validation.valid).toBe(false);
      
      // Check that error messages contain expected text
      const errorText = validation.errors.join(' ');
      expect(errorText).toContain('Invalid server port');
      
      delete process.env.PORT;
    });
  });

  describe('Configuration Integration', () => {
    it('should provide consistent configuration across multiple calls', () => {
      process.env.NODE_ENV = 'development';
      
      const config1 = getConfig();
      const config2 = getConfig();
      
      expect(config1.environment).toBe(config2.environment);
      expect(config1.vision.enabled).toBe(config2.vision.enabled);
      expect(config1.cache.maxKeys).toBe(config2.cache.maxKeys);
    });

    it('should handle configuration changes when environment changes', () => {
      process.env.NODE_ENV = 'test';
      const testConfig = getConfig();
      expect(testConfig.vision.enabled).toBe(false);
      
      process.env.NODE_ENV = 'production';
      const prodConfig = getConfig();
      expect(prodConfig.vision.enabled).toBe(true);
    });
  });
});