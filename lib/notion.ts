// lib/notion.ts
import { Client } from '@notionhq/client';
import { NotionWineProperties, mapToNotionProperties, validateWineData } from './notion-schema';

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

const DATABASE_ID = process.env.NOTION_DATABASE_ID || '23638693-94a5-804f-aa3d-f64f826a2eab';

// Legacy interface for backwards compatibility
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

// New function using NotionWineProperties schema
export async function saveWineToNotionV2(wineData: NotionWineProperties): Promise<{
  id: string;
  url: string;
}> {
  // Validate data before saving
  const validation = validateWineData(wineData);
  if (!validation.isValid) {
    throw new Error(`Invalid wine data: ${validation.errors.join(', ')}`);
  }

  // Map to Notion properties format
  const properties = mapToNotionProperties(wineData);

  console.log('Saving to Notion with properties:', JSON.stringify(properties, null, 2));

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

// Legacy function - maintained for backwards compatibility
export async function saveWineToNotion(wineData: WineData, source: 'wine_label' | 'receipt') {
  if (process.env.NODE_ENV === 'development') {
    console.log('💾 [NOTION] Legacy saveWineToNotion called with:', JSON.stringify(wineData, null, 2));
    console.log('💾 [NOTION] Source:', source);
  }
  
  // Convert legacy WineData to NotionWineProperties
  const notionData: NotionWineProperties = {
    'Name': wineData.name || 'Unknown Wine',
    'Vintage': wineData.vintage || null,
    'Region/Producer': wineData['Region/Producer'] || '',
    'Price': wineData.price || null,
    'Quantity': wineData.quantity || null,
    'Store': wineData.Store || '',
    'Varietal(품종)': wineData['Varietal(품종)'] ? 
      (Array.isArray(wineData['Varietal(품종)']) ? 
        wineData['Varietal(품종)'] : 
        wineData['Varietal(품종)'].split(',').map(v => v.trim())
      ) : [],
    'Image': null
  };

  if (process.env.NODE_ENV === 'development') {
    console.log('💾 [NOTION] Converted to NotionWineProperties:', JSON.stringify(notionData, null, 2));
  }

  return saveWineToNotionV2(notionData);
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