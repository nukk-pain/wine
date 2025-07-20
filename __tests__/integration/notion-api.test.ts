// __tests__/integration/notion-api.test.ts
import { createMocks } from 'node-mocks-http';
import handler from '@/pages/api/notion';

// Mock the notion lib functions
jest.mock('@/lib/notion', () => ({
  saveWineToNotion: jest.fn().mockResolvedValue({
    id: 'test-page-id-123',
    url: 'https://notion.so/test-page-id-123'
  }),
  saveReceiptToNotion: jest.fn().mockResolvedValue([
    {
      id: 'test-page-id-123',
      url: 'https://notion.so/test-page-id-123'
    },
    {
      id: 'test-page-id-456',
      url: 'https://notion.so/test-page-id-456'
    }
  ]),
  updateWineRecord: jest.fn().mockResolvedValue({
    id: 'test-page-id',
    status: '소비됨'
  })
}));

describe('/api/notion', () => {
  it('should save wine label data to Notion', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        action: 'save_wine',
        data: {
          name: 'Château Margaux',
          vintage: 2015,
          'Region/Producer': 'Bordeaux - Château Margaux',
          'Varietal(품종)': 'Cabernet Sauvignon'
        },
        source: 'wine_label'
      }
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const response = JSON.parse(res._getData());
    
    expect(response).toEqual({
      success: true,
      result: {
        id: 'test-page-id-123',
        url: 'https://notion.so/test-page-id-123'
      }
    });
  });

  it('should save receipt data as multiple entries to Notion', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        action: 'save_receipt',
        data: {
          store: '와인앤모어',
          date: '2024-07-20',
          items: [
            { name: '샤또 마고 2015', price: 150000, quantity: 1, vintage: 2015 },
            { name: '돔 페리뇽 2012', price: 280000, quantity: 1, vintage: 2012 }
          ],
          total: 430000
        }
      }
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const response = JSON.parse(res._getData());
    
    expect(response).toEqual({
      success: true,
      result: [
        {
          id: 'test-page-id-123',
          url: 'https://notion.so/test-page-id-123'
        },
        {
          id: 'test-page-id-456',
          url: 'https://notion.so/test-page-id-456'
        }
      ]
    });
  });

  it('should update wine record status', async () => {
    const { req, res } = createMocks({
      method: 'PUT',
      body: {
        action: 'update_status',
        pageId: 'test-page-id',
        status: '소비됨'
      }
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const response = JSON.parse(res._getData());
    
    expect(response).toEqual({
      success: true,
      result: {
        id: 'test-page-id',
        status: '소비됨'
      }
    });
  });

  it('should return error for invalid action', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        action: 'invalid_action'
      }
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
    const response = JSON.parse(res._getData());
    
    expect(response).toEqual({
      success: false,
      error: 'Invalid action'
    });
  });

  it('should return error for unsupported HTTP method', async () => {
    const { req, res } = createMocks({
      method: 'GET'
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(405);
    const response = JSON.parse(res._getData());
    
    expect(response).toEqual({
      success: false,
      error: 'Method not allowed'
    });
  });

  it('should handle validation errors for missing data', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        action: 'save_wine'
        // Missing data field
      }
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
    const response = JSON.parse(res._getData());
    
    expect(response).toEqual({
      success: false,
      error: 'Missing required data'
    });
  });

  it('should handle Notion API errors gracefully', async () => {
    // Mock notion functions to throw error
    const { saveWineToNotion } = require('@/lib/notion');
    saveWineToNotion.mockRejectedValueOnce(new Error('Notion API error'));

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        action: 'save_wine',
        data: {
          name: 'Test Wine'
        },
        source: 'wine_label'
      }
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(500);
    const response = JSON.parse(res._getData());
    
    expect(response).toEqual({
      success: false,
      error: 'Notion operation failed',
      details: 'Notion API error'
    });
  });
});