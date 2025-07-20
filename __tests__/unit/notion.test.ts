// __tests__/unit/notion.test.ts
import { saveWineToNotion, saveReceiptToNotion, updateWineRecord } from '@/lib/notion';

// Mock the Notion client
jest.mock('@notionhq/client', () => ({
  Client: jest.fn().mockImplementation(() => ({
    pages: {
      create: jest.fn().mockResolvedValue({
        id: 'test-page-id-123',
        url: 'https://notion.so/test-page-id-123',
        properties: {}
      }),
      update: jest.fn().mockResolvedValue({
        id: 'test-page-id',
        properties: {}
      })
    }
  }))
}));

describe('Notion Integration', () => {
  it('should save wine label data to database', async () => {
    const wineData = {
      name: 'Château Margaux',
      vintage: 2015,
      'Region/Producer': 'Bordeaux - Château Margaux',
      'Varietal(품종)': 'Cabernet Sauvignon'
    };

    const result = await saveWineToNotion(wineData, 'wine_label');

    expect(result).toEqual({
      id: 'test-page-id-123',
      url: 'https://notion.so/test-page-id-123'
    });
  });

  it('should save receipt data as multiple wine entries', async () => {
    const receiptData = {
      store: '와인앤모어',
      date: '2024-07-20',
      items: [
        { name: '샤또 마고 2015', price: 150000, quantity: 1, vintage: 2015 },
        { name: '돔 페리뇽 2012', price: 280000, quantity: 1, vintage: 2012 }
      ],
      total: 430000
    };

    const result = await saveReceiptToNotion(receiptData);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      id: 'test-page-id-123',
      url: 'https://notion.so/test-page-id-123'
    });
    expect(result[1]).toEqual({
      id: 'test-page-id-123',
      url: 'https://notion.so/test-page-id-123'
    });
  });

  it('should update wine record status', async () => {
    const updateData = {
      id: 'test-page-id',
      status: '소비됨'
    };

    const result = await updateWineRecord(updateData.id, updateData.status);

    expect(result).toEqual({
      id: 'test-page-id',
      status: '소비됨'
    });
  });
});