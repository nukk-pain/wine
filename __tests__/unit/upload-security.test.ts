// __tests__/unit/upload-security.test.ts
import { createMocks } from 'node-mocks-http';
import uploadHandler from '@/pages/api/upload';

describe('Upload API Security', () => {
  it('should only accept POST method', async () => {
    const { req, res } = createMocks({
      method: 'GET'
    });

    await uploadHandler(req, res);
    
    expect(res._getStatusCode()).toBe(405);
    const result = JSON.parse(res._getData());
    expect(result.error).toBe('Method not allowed');
  });

  it('should reject PUT method', async () => {
    const { req, res } = createMocks({
      method: 'PUT'
    });

    await uploadHandler(req, res);
    
    expect(res._getStatusCode()).toBe(405);
    const result = JSON.parse(res._getData());
    expect(result.error).toBe('Method not allowed');
  });

  it('should reject DELETE method', async () => {
    const { req, res } = createMocks({
      method: 'DELETE'
    });

    await uploadHandler(req, res);
    
    expect(res._getStatusCode()).toBe(405);
    const result = JSON.parse(res._getData());
    expect(result.error).toBe('Method not allowed');
  });
});