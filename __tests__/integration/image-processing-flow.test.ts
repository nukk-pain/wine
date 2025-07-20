// __tests__/integration/image-processing-flow.test.ts
import fs from 'fs';
import path from 'path';
import { createMocks } from 'node-mocks-http';
import uploadHandler from '@/pages/api/upload';
import processHandler from '@/pages/api/process';

describe('Complete Image Processing Flow', () => {
  const testImagePath = path.join(__dirname, '../../test1.jpg');
  const uploadDir = path.join(__dirname, '../../test-uploads');

  beforeAll(() => {
    // 업로드 디렉토리 생성
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // 테스트 이미지가 없으면 생성 (실제로는 진짜 와인 라벨 이미지 필요)
    const testAssetsDir = path.dirname(testImagePath);
    if (!fs.existsSync(testAssetsDir)) {
      fs.mkdirSync(testAssetsDir, { recursive: true });
    }
    
    // test1.jpg 파일이 존재하는지 확인
    if (!fs.existsSync(testImagePath)) {
      throw new Error(`Test image file not found: ${testImagePath}. Please ensure test1.jpg exists in the project root.`);
    }

    // 환경 변수 설정
    process.env.UPLOAD_DIR = uploadDir;
  });

  it('should process uploaded wine label image end-to-end', async () => {
    // 실제 파일 경로로 직접 처리 API 테스트 (업로드는 별도 테스트)
    const { req: processReq, res: processRes } = createMocks({
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: { 
        imageUrl: testImagePath, 
        action: 'process_image' 
      }
    });

    // 처리 API 호출
    await processHandler(processReq, processRes);
    
    expect(processRes._getStatusCode()).toBe(200);
    const processResult = JSON.parse(processRes._getData());
    
    expect(processResult.success).toBe(true);
    expect(processResult.data).toBeDefined();
    expect(processResult.data.extractedData).toBeDefined();
    expect(processResult.data.extractedData.name).toBeDefined();
    expect(processResult.data.notionResult).toBeDefined();
    expect(processResult.data.notionResult.id).toBeDefined();
  });

  it('should handle upload API method validation', async () => {
    const { req, res } = createMocks({
      method: 'GET'
    });

    await uploadHandler(req, res);
    
    expect(res._getStatusCode()).toBe(405);
    const result = JSON.parse(res._getData());
    expect(result.error).toBe('Method not allowed');
  });

  it('should handle processing errors gracefully', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: { 
        imageUrl: 'invalid-path.jpg', 
        action: 'process_image' 
      }
    });

    await processHandler(req, res);
    
    expect(res._getStatusCode()).toBe(500);
    const result = JSON.parse(res._getData());
    expect(result.error).toBeDefined();
  });

  it('should validate upload configuration', async () => {
    // 업로드 디렉토리가 올바르게 설정되었는지 확인
    expect(process.env.UPLOAD_DIR).toBeDefined();
    expect(fs.existsSync(uploadDir)).toBe(true);
  });

  afterAll(() => {
    // 테스트 업로드 디렉토리만 정리 (실제 테스트 이미지 파일은 보존)
    if (fs.existsSync(uploadDir)) {
      const files = fs.readdirSync(uploadDir);
      files.forEach(file => {
        fs.unlinkSync(path.join(uploadDir, file));
      });
      fs.rmdirSync(uploadDir);
    }

    // test1.jpg와 test2.jpg는 프로젝트의 영구 테스트 파일이므로 삭제하지 않음
  });
});