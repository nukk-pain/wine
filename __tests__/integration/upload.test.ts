import { createMocks } from 'node-mocks-http';
import handler from '@/pages/api/upload';
import fs from 'fs/promises';
import path from 'path';

// Mock environment variables for testing
process.env.UPLOAD_DIR = '/tmp/test-uploads';

describe('/api/upload', () => {
  beforeEach(async () => {
    // 테스트용 업로드 디렉토리 생성
    await fs.mkdir('/tmp/test-uploads', { recursive: true });
  });

  afterEach(async () => {
    // 테스트 파일 정리
    await fs.rm('/tmp/test-uploads', { recursive: true, force: true });
  });

  it('should upload image to NAS storage', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      headers: { 'content-type': 'multipart/form-data' }
    });

    // Mock file data
    const mockFile = Buffer.from('fake image data');
    req.body = mockFile;

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const response = JSON.parse(res._getData());
    
    expect(response).toMatchObject({
      success: true,
      fileName: expect.stringMatching(/^wine_\d+_.*\.(jpg|jpeg|png)$/),
      filePath: expect.stringContaining('/tmp/test-uploads'),
      fileUrl: expect.stringContaining('/uploads/'),
      fileSize: expect.any(Number)
    });

    // 실제 파일이 저장되었는지 확인
    const filePath = path.join('/tmp/test-uploads', response.fileName);
    const fileExists = await fs.access(filePath).then(() => true).catch(() => false);
    expect(fileExists).toBe(true);
  });

  it('should reject files larger than 10MB', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      headers: { 'content-type': 'multipart/form-data' }
    });

    // Create a large file mock (larger than 10MB)
    const largeBuffer = Buffer.alloc(11 * 1024 * 1024); // 11MB
    req.body = largeBuffer;

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
    const response = JSON.parse(res._getData());
    expect(response.error).toContain('File too large');
  });

  it('should reject non-image files', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      headers: { 'content-type': 'multipart/form-data' }
    });

    // Mock non-image file
    const mockFile = Buffer.from('not an image');
    req.body = mockFile;

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
    const response = JSON.parse(res._getData());
    expect(response.error).toContain('Invalid file type');
  });

  it('should handle NAS storage errors', async () => {
    // Mock fs.mkdir to throw error
    const originalMkdir = fs.mkdir;
    fs.mkdir = jest.fn().mockRejectedValue(new Error('Disk full'));

    const { req, res } = createMocks({
      method: 'POST',
      headers: { 'content-type': 'multipart/form-data' }
    });

    const mockFile = Buffer.from('fake image data');
    req.body = mockFile;

    await handler(req, res);

    expect(res._getStatusCode()).toBe(500);
    const response = JSON.parse(res._getData());
    expect(response.error).toBe('File upload failed');

    // Restore original function
    fs.mkdir = originalMkdir;
  });

  it('should return 405 for non-POST methods', async () => {
    const { req, res } = createMocks({
      method: 'GET',
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(405);
    const response = JSON.parse(res._getData());
    expect(response.error).toBe('Method not allowed');
  });
});