// __tests__/unit/vision-config.test.ts
import fs from 'fs';
import { ImageAnnotatorClient } from '@google-cloud/vision';

describe('Vision API Configuration', () => {
  it('should have valid Google Cloud credentials environment variable', () => {
    // GOOGLE_APPLICATION_CREDENTIALS 환경 변수가 설정되어 있어야 함
    expect(process.env.GOOGLE_APPLICATION_CREDENTIALS).toBeDefined();
  });

  it('should have accessible credentials file', () => {
    const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (credentialsPath) {
      expect(fs.existsSync(credentialsPath)).toBe(true);
    } else {
      // 환경 변수가 없으면 테스트 스킵
      console.warn('GOOGLE_APPLICATION_CREDENTIALS not set, skipping credentials file test');
    }
  });

  it('should create ImageAnnotatorClient without throwing', () => {
    // ImageAnnotatorClient 생성이 에러 없이 되어야 함
    expect(() => {
      const client = new ImageAnnotatorClient();
      expect(client).toBeDefined();
    }).not.toThrow();
  });

  it('should validate credentials file format if exists', () => {
    const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (credentialsPath && fs.existsSync(credentialsPath)) {
      const credentialsContent = fs.readFileSync(credentialsPath, 'utf8');
      
      // JSON 형식이어야 함
      expect(() => JSON.parse(credentialsContent)).not.toThrow();
      
      const credentials = JSON.parse(credentialsContent);
      
      // 필수 필드들이 있어야 함
      expect(credentials.type).toBe('service_account');
      expect(credentials.project_id).toBeDefined();
      expect(credentials.private_key).toBeDefined();
      expect(credentials.client_email).toBeDefined();
    } else {
      console.warn('Credentials file not found, skipping format validation');
    }
  });
});