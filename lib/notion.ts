// lib/notion.ts
import { Client } from '@notionhq/client';

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

const DATABASE_ID = process.env.NOTION_DATABASE_ID || '23638693-94a5-804f-aa3d-f64f826a2eab';

export interface WineData {
  name: string;
  vintage?: number;
  'Region/Producer'?: string;
  'Varietal(품종)'?: string;
  price?: number;
  quantity?: number;
  'Purchase date'?: string;
  Store?: string;
  Status?: string;
}

export interface ReceiptData {
  store: string;
  date: string;
  items: Array<{
    name: string;
    price: number;
    quantity: number;
    vintage?: number;
  }>;
  total: number;
}

export async function saveWineToNotion(wineData: WineData, source: 'wine_label' | 'receipt') {
  // Create properties object for Notion API
  const properties: any = {
    Name: {
      title: [
        {
          text: {
            content: wineData.name
          }
        }
      ]
    }
  };

  // Add optional properties if they exist
  if (wineData.vintage) {
    properties.Vintage = {
      number: wineData.vintage
    };
  }

  if (wineData['Region/Producer']) {
    properties['Region/Producer'] = {
      rich_text: [
        {
          text: {
            content: wineData['Region/Producer']
          }
        }
      ]
    };
  }

  if (wineData['Varietal(품종)']) {
    // Convert varietal to multi_select format
    const varietals = wineData['Varietal(품종)'].split(',').map(v => v.trim());
    properties['Varietal(품종)'] = {
      multi_select: varietals.map(varietal => ({
        name: varietal
      }))
    };
  }

  if (wineData.price) {
    properties.Price = {
      number: wineData.price
    };
  }

  if (wineData.quantity) {
    properties.Quantity = {
      number: wineData.quantity
    };
  }

  if (wineData['Purchase date']) {
    properties['Purchase date'] = {
      date: {
        start: wineData['Purchase date']
      }
    };
  }

  if (wineData.Store) {
    properties.Store = {
      rich_text: [
        {
          text: {
            content: wineData.Store
          }
        }
      ]
    };
  }

  if (wineData.Status) {
    properties.Status = {
      select: {
        name: wineData.Status
      }
    };
  }

  const response = await notion.pages.create({
    parent: {
      database_id: DATABASE_ID
    },
    properties
  });

  return {
    id: response.id,
    url: `https://notion.so/${response.id.replace(/-/g, '')}`
  };
}

export async function saveReceiptToNotion(receiptData: ReceiptData) {
  // 영수증에서 추출한 여러 와인 데이터 저장
  const results = [];
  
  for (const item of receiptData.items) {
    const wineEntry: WineData = {
      name: item.name,
      vintage: item.vintage,
      price: item.price,
      quantity: item.quantity,
      'Purchase date': receiptData.date,
      Store: receiptData.store,
      Status: '재고' // 새로 구매한 와인은 재고 상태
    };
    
    const saved = await saveWineToNotion(wineEntry, 'receipt');
    results.push(saved);
  }
  
  return results;
}

export async function updateWineRecord(pageId: string, status: string) {
  const response = await notion.pages.update({
    page_id: pageId,
    properties: {
      Status: {
        select: {
          name: status
        }
      }
    }
  });

  return {
    id: response.id,
    status: status
  };
}