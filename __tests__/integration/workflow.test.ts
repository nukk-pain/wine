// __tests__/integration/workflow.test.ts
import { createMocks } from 'node-mocks-http';
import handler from '@/pages/api/process';

// Mock dependencies
jest.mock('@/lib/vision', () => ({
  processWineImage: jest.fn()
}));

jest.mock('@/lib/notion', () => ({
  saveWineToNotion: jest.fn(),
  saveReceiptToNotion: jest.fn()
}));

import { processWineImage } from '@/lib/vision';
import { saveWineToNotion, saveReceiptToNotion } from '@/lib/notion';

const mockProcessWineImage = processWineImage as jest.MockedFunction<typeof processWineImage>;
const mockSaveWineToNotion = saveWineToNotion as jest.MockedFunction<typeof saveWineToNotion>;
const mockSaveReceiptToNotion = saveReceiptToNotion as jest.MockedFunction<typeof saveReceiptToNotion>;

describe('Complete Wine Processing Workflow', () => {
  it('should process wine label image end-to-end', async () => {
    // Mock the vision processing result
    mockProcessWineImage.mockResolvedValue({
      type: 'wine_label',
      data: {
        name: 'Château Margaux',
        vintage: 2015,
        'Region/Producer': 'Bordeaux - Château Margaux',
        'Varietal(품종)': 'Cabernet Sauvignon'
      }
    });

    // Mock the Notion save result
    mockSaveWineToNotion.mockResolvedValue({
      id: 'test-page-id-123',
      url: 'https://notion.so/test-page-id-123'
    });

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        imageUrl: '/api/files/test-wine.jpg',
        action: 'process_image'
      }
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const result = JSON.parse(res._getData());
    expect(result).toMatchObject({
      success: true,
      data: {
        type: 'wine_label',
        extractedData: expect.objectContaining({
          name: 'Château Margaux',
          vintage: 2015
        }),
        notionResult: expect.objectContaining({
          id: 'test-page-id-123',
          url: 'https://notion.so/test-page-id-123'
        })
      }
    });
  });

  it('should process receipt image end-to-end', async () => {
    // Mock the vision processing result
    mockProcessWineImage.mockResolvedValue({
      type: 'receipt',
      data: {
        store: '와인앤모어',
        date: '2024-07-20',
        items: [
          { name: '샤또 마고 2015', price: 150000, quantity: 1, vintage: 2015 },
          { name: '돔 페리뇽 2012', price: 280000, quantity: 1, vintage: 2012 }
        ],
        total: 430000
      }
    });

    // Mock the Notion save result
    mockSaveReceiptToNotion.mockResolvedValue([
      { id: 'test-page-id-1', url: 'https://notion.so/test-page-id-1' },
      { id: 'test-page-id-2', url: 'https://notion.so/test-page-id-2' }
    ]);

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        imageUrl: '/api/files/test-receipt.jpg',
        action: 'process_image'
      }
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const result = JSON.parse(res._getData());
    expect(result).toMatchObject({
      success: true,
      data: {
        type: 'receipt',
        extractedData: expect.objectContaining({
          store: '와인앤모어',
          date: '2024-07-20',
          items: expect.any(Array)
        }),
        notionResults: expect.arrayContaining([
          expect.objectContaining({
            id: 'test-page-id-1',
            url: 'https://notion.so/test-page-id-1'
          })
        ])
      }
    });
  });

  it('should handle processing errors gracefully', async () => {
    // Mock a processing error
    mockProcessWineImage.mockRejectedValue(new Error('Vision processing failed'));

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        imageUrl: 'invalid-url',
        action: 'process_image'
      }
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(500);
    const result = JSON.parse(res._getData());
    expect(result).toMatchObject({
      success: false,
      error: expect.any(String)
    });
  });
});