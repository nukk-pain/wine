// __tests__/integration/google-vision-api.test.ts
import path from 'path';
import fs from 'fs';
import { extractTextFromImage } from '@/lib/vision';

describe('Google Vision API Integration', () => {
  const testImagePath = path.join(__dirname, '../../test-assets/test1.jpg');
  
  beforeAll(() => {
    // 테스트 이미지가 존재하는지 확인
    if (!fs.existsSync(testImagePath)) {
      throw new Error(`Test image file not found: ${testImagePath}. Please ensure test1.jpg exists in the project root.`);
    }
  });

  it('should extract text from real image using Google Vision API', async () => {
    // 실제 이미지 파일로 테스트
    const extractedText = await extractTextFromImage(testImagePath);
    
    // 실제 Google Vision API를 사용한다면 문자열이 반환되어야 함 (빈 문자열일 수도 있음)
    expect(extractedText).toBeDefined();
    expect(typeof extractedText).toBe('string');
    expect(extractedText).not.toBe('default extracted text'); // Mock 기본값이 아님을 확인
    
    // 실제 Vision API 호출이 성공했는지 확인 (에러 없이 완료)
    console.log('Extracted text length:', extractedText.length);
    console.log('Extracted text:', JSON.stringify(extractedText));
  });

  it('should handle Google Vision API errors gracefully', async () => {
    const invalidPath = 'invalid-image-path.jpg';
    
    // 잘못된 경로로 호출하면 에러가 발생해야 함
    await expect(extractTextFromImage(invalidPath)).rejects.toThrow();
  });

  it('should return text for test2.jpg image', async () => {
    // test2.jpg는 영수증 이미지로 사용
    const test2ImagePath = path.join(__dirname, '../../test-assets/test2.jpg');
    
    if (fs.existsSync(test2ImagePath)) {
      const extractedText = await extractTextFromImage(test2ImagePath);
      expect(typeof extractedText).toBe('string');
      expect(extractedText.length).toBeGreaterThan(0);
      // 테스트 환경에서는 모의 영수증 텍스트 반환
      if (process.env.NODE_ENV === 'test') {
        expect(extractedText).toContain('Receipt');
      }
    }
  });

  it('should validate image file extensions', async () => {
    const textFilePath = path.join(__dirname, '../../test-assets/not-image.txt');
    fs.writeFileSync(textFilePath, 'This is not an image');
    
    // 이미지가 아닌 파일은 에러를 발생시켜야 함
    await expect(extractTextFromImage(textFilePath)).rejects.toThrow('Unsupported image format');
  });

  afterAll(() => {
    // 테스트 파일 정리 (test-assets 디렉토리의 임시 파일만)
    const testFiles = [
      path.join(__dirname, '../../test-assets/not-image.txt')
    ];
    
    testFiles.forEach(filePath => {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });
  });
});