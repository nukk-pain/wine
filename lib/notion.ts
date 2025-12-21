// lib/notion.ts
import { Client } from '@notionhq/client';
import { NotionWineProperties, mapToNotionProperties, validateWineData } from './utils/wine-data-helpers';

// Use the 2025-09-03 API version to enable data sources
const notion = new Client({
  auth: process.env.NOTION_API_KEY,
  notionVersion: '2025-09-03'
});

const DATABASE_ID = process.env.NOTION_DATABASE_ID || '23638693-94a5-804f-aa3d-f64f826a2eab';
const ENV_DATA_SOURCE_ID = process.env.NOTION_DATA_SOURCE_ID;

let cachedDataSourceId: string | null = ENV_DATA_SOURCE_ID || null;

async function resolveDataSourceId(): Promise<string> {
  if (cachedDataSourceId) return cachedDataSourceId;

  try {
    const db: any = await notion.databases.retrieve({ database_id: DATABASE_ID });
    const firstDataSourceId: string | undefined = db?.data_sources?.[0]?.id;
    if (!firstDataSourceId) {
      throw new Error('No data_sources found on database');
    }
    cachedDataSourceId = firstDataSourceId;
    if (process.env.NODE_ENV === 'development') {
      console.log('🔧 [NOTION] Resolved data_source_id:', cachedDataSourceId);
    }
    return cachedDataSourceId;
  } catch (e) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️ [NOTION] Failed to resolve data_source_id, will fallback to database_id. Error:', e);
    }
    // As a safe fallback, return an empty string to signal caller to fallback
    return '';
  }
}

// Legacy interface for backwards compatibility
export interface WineData {
  name: string;
  vintage?: number;
  producer?: string;               // C: 생산자 (분리)
  region?: string;                 // D: 지역 (분리)
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

  if (process.env.NODE_ENV === 'development') {
    console.log('💾 [NOTION] Saving to Notion with properties:', JSON.stringify(properties, null, 2));
    console.log('💾 [NOTION] Database ID:', DATABASE_ID);
  }

  try {
    // Prefer creating the page under a data source parent
    let parent: any;
    const dataSourceId = await resolveDataSourceId();
    if (dataSourceId) {
      parent = { type: 'data_source_id', data_source_id: dataSourceId } as any;
    } else {
      // Fallback to database_id for compatibility
      parent = { database_id: DATABASE_ID } as any;
    }

    const response = await notion.pages.create({
      parent,
      properties
    } as any);

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ [NOTION] Successfully created page:', response.id);
    }

    return {
      id: response.id,
      url: `https://notion.so/${response.id.replace(/-/g, '')}`
    };
  } catch (notionError: any) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ [NOTION] Notion API Error Details:');
      console.error('   Error:', notionError);
      console.error('   Error code:', notionError.code);
      console.error('   Error status:', notionError.status);
      console.error('   Error body:', JSON.stringify(notionError.body, null, 2));
    }

    // Re-throw with more specific error message
    if (notionError.code === 'conflict') {
      throw new Error('Notion conflict: This record may already exist or there may be a database schema mismatch');
    } else if (notionError.code === 'validation_error') {
      throw new Error(`Notion validation error: ${notionError.message || 'Invalid data format'}`);
    } else {
      throw new Error(`Notion API error: ${notionError.message || 'Unknown error'}`);
    }
  }
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
    'Producer': wineData.producer || '',             // C: 생산자 (분리)
    'Region': wineData.region || '',                 // D: 지역 (분리)
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
