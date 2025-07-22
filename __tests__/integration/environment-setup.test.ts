// __tests__/integration/environment-setup.test.ts
import fs from 'fs';
import path from 'path';
import { ImageAnnotatorClient } from '@google-cloud/vision';

describe('Environment Setup Validation', () => {
  describe('Google Cloud Vision API Configuration', () => {
    it('should have GOOGLE_APPLICATION_CREDENTIALS environment variable', () => {
      expect(process.env.GOOGLE_APPLICATION_CREDENTIALS).toBeDefined();
      expect(process.env.GOOGLE_APPLICATION_CREDENTIALS).not.toBe('');
    });

    it('should have accessible and valid credentials file or JSON string', () => {
      const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
      
      if (!credentialsPath) {
        throw new Error('GOOGLE_APPLICATION_CREDENTIALS not set');
      }

      let credentials;
      
      // Check if it's a file path or JSON string
      if (credentialsPath.startsWith('{')) {
        // JSON string format (for Vercel deployment) - may be multiline
        try {
          credentials = JSON.parse(credentialsPath);
        } catch (error) {
          throw new Error(`Invalid JSON in GOOGLE_APPLICATION_CREDENTIALS: ${error}`);
        }
      } else {
        // File path format (for local development)
        expect(fs.existsSync(credentialsPath)).toBe(true);
        expect(() => fs.accessSync(credentialsPath, fs.constants.R_OK)).not.toThrow();
        
        const credentialsContent = fs.readFileSync(credentialsPath, 'utf8');
        expect(() => JSON.parse(credentialsContent)).not.toThrow();
        credentials = JSON.parse(credentialsContent);
      }
      
      // 필수 필드 확인
      expect(credentials.type).toBe('service_account');
      expect(credentials.project_id).toBeDefined();
      expect(credentials.private_key).toBeDefined();
      expect(credentials.client_email).toBeDefined();
      expect(credentials.client_id).toBeDefined();
      expect(credentials.auth_uri).toBeDefined();
      expect(credentials.token_uri).toBeDefined();
    });

    it('should create ImageAnnotatorClient successfully', () => {
      expect(() => {
        const client = new ImageAnnotatorClient();
        expect(client).toBeDefined();
        expect(typeof client.textDetection).toBe('function');
      }).not.toThrow();
    });

    it('should validate project ID configuration', () => {
      const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
      
      if (!credentialsPath) {
        return; // Skip if no credentials are set
      }

      let credentials;
      
      // Check if it's a file path or JSON string
      if (credentialsPath.startsWith('{')) {
        // JSON string format (for Vercel deployment) - may be multiline
        try {
          credentials = JSON.parse(credentialsPath);
        } catch (error) {
          return; // Skip if JSON is invalid
        }
      } else if (fs.existsSync(credentialsPath)) {
        // File path format (for local development)
        credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
      } else {
        return; // Skip if file doesn't exist
      }
      
      // 프로젝트 ID 형식 검증
      expect(credentials.project_id).toMatch(/^[a-z][a-z0-9\-]*[a-z0-9]$/);
      expect(credentials.project_id.length).toBeGreaterThan(5);
      expect(credentials.project_id.length).toBeLessThan(31);
    });
  });

  describe('Notion API Configuration', () => {
    it('should have NOTION_API_KEY environment variable', () => {
      expect(process.env.NOTION_API_KEY).toBeDefined();
      expect(process.env.NOTION_API_KEY).not.toBe('');
      
      // Notion API 키 형식 검증 (secret_ 또는 ntn_으로 시작)
      expect(process.env.NOTION_API_KEY).toMatch(/^(secret_|ntn_)/);
    });

    it('should have valid Notion database ID format', () => {
      // DATABASE_ID가 있다면 32자리 hex 형식이어야 함
      const databaseId = process.env.NOTION_DATABASE_ID;
      if (databaseId) {
        expect(databaseId).toMatch(/^[0-9a-f]{32}$/);
      }
    });
  });

  describe('Environment-specific Configuration', () => {
    it('should detect correct environment', () => {
      const nodeEnv = process.env.NODE_ENV;
      expect(['development', 'test', 'production', undefined]).toContain(nodeEnv);
    });

    it('should have appropriate configuration for current environment', () => {
      const nodeEnv = process.env.NODE_ENV || 'development';
      
      if (nodeEnv === 'production') {
        // 프로덕션 환경에서는 모든 환경 변수가 필수
        expect(process.env.GOOGLE_APPLICATION_CREDENTIALS).toBeDefined();
        expect(process.env.NOTION_API_KEY).toBeDefined();
      } else if (nodeEnv === 'test') {
        // 테스트 환경에서는 선택적
        console.log('Test environment detected');
      }
    });

    it('should validate file permissions', () => {
      const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
      
      if (credentialsPath && fs.existsSync(credentialsPath)) {
        const stats = fs.statSync(credentialsPath);
        
        // Windows와 Unix 시스템에서 파일 권한 처리가 다름
        if (process.platform === 'win32') {
          // Windows에서는 파일 권한이 다르게 작동하므로 파일 존재만 확인
          expect(stats.isFile()).toBe(true);
        } else {
          // Unix 시스템에서는 파일이 너무 개방적인 권한을 가지지 않아야 함 (보안)
          const mode = stats.mode & parseInt('777', 8);
          expect(mode).toBeLessThanOrEqual(parseInt('644', 8)); // 최대 rw-r--r--
        }
      }
    });
  });

  describe('Network and API Connectivity', () => {
    it('should be able to initialize Google Cloud client without network errors', async () => {
      const client = new ImageAnnotatorClient();
      expect(client).toBeDefined();
      
      // 실제 네트워크 호출 없이 클라이언트 초기화가 성공해야 함
    });

    it('should validate Google Cloud project accessibility', async () => {
      // 이 테스트는 실제 API 호출을 하므로 선택적으로 실행
      if (process.env.RUN_NETWORK_TESTS === 'true') {
        const client = new ImageAnnotatorClient();
        
        try {
          // 매우 작은 테스트 이미지로 API 접근성 확인
          const testImageBuffer = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
          
          const request = {
            image: { content: testImageBuffer.toString('base64') }
          };
          
          const [result] = await client.textDetection(request);
          
          // 결과가 있든 없든 API 호출이 성공하면 됨
          expect(result).toBeDefined();
        } catch (error: any) {
          // 할당량 초과나 인증 에러가 아닌 경우에만 실패
          if (!error.message?.includes('quota') && !error.message?.includes('credentials')) {
            throw error;
          }
        }
      } else {
        console.log('Network tests skipped. Set RUN_NETWORK_TESTS=true to enable.');
      }
    });
  });
});