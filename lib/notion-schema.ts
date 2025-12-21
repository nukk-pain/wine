// Notion database schema definitions and type mappings
// Re-export core types from centralized types module
export type { NotionWineProperties } from '@/types';
import type { NotionWineProperties } from '@/types';


export interface NotionPropertyMapping {
  name: {
    type: 'title';
    title: Array<{
      type: 'text';
      text: {
        content: string;
      };
    }>;
  };
  vintage: {
    type: 'number';
    number: number | null;
  };
  regionProducer: {
    type: 'rich_text';
    rich_text: Array<{
      type: 'text';
      text: {
        content: string;
      };
    }>;
  };
  price: {
    type: 'number';
    number: number | null;
  };
  quantity: {
    type: 'number';
    number: number | null;
  };
  store: {
    type: 'rich_text';
    rich_text: Array<{
      type: 'text';
      text: {
        content: string;
      };
    }>;
  };
  varietal: {
    type: 'multi_select';
    multi_select: Array<{
      name: string;
    }>;
  };
  image: {
    type: 'files';
    files: Array<{
      type: 'external';
      name: string;
      external: {
        url: string;
      };
    }>;
  };
}

export const NOTION_PROPERTY_NAMES = {
  NAME: 'Name',
  VINTAGE: 'Vintage',
  REGION_PRODUCER: 'Region/Producer',
  PRICE: 'Price',
  QUANTITY: 'Quantity',
  STORE: 'Store',
  VARIETAL: 'Varietal(품종)',
  IMAGE: 'Image',
  STATUS: 'Status',
  PURCHASE_DATE: 'Purchase date',
  COUNTRY: 'Country(국가)',
  APPELLATION: 'Appellation(원산지명칭)',
  NOTES: 'Notes(메모)'
} as const;

export function mapToNotionProperties(wineData: NotionWineProperties): Record<string, any> {
  if (process.env.NODE_ENV === 'development') {
    console.log('🔧 [NOTION-SCHEMA] Input wineData:', JSON.stringify(wineData, null, 2));
  }

  const properties: Record<string, any> = {};

  if (wineData.Name) {
    properties[NOTION_PROPERTY_NAMES.NAME] = {
      title: [
        {
          type: 'text',
          text: {
            content: wineData.Name
          }
        }
      ]
    };
  }

  if (wineData.Vintage !== null && wineData.Vintage !== undefined) {
    properties[NOTION_PROPERTY_NAMES.VINTAGE] = {
      number: wineData.Vintage
    };
  }

  if (wineData['Region/Producer']) {
    properties[NOTION_PROPERTY_NAMES.REGION_PRODUCER] = {
      rich_text: [
        {
          type: 'text',
          text: {
            content: wineData['Region/Producer']
          }
        }
      ]
    };
  }

  if (wineData.Price !== null && wineData.Price !== undefined) {
    properties[NOTION_PROPERTY_NAMES.PRICE] = {
      number: wineData.Price
    };
  }

  if (wineData.Quantity !== null && wineData.Quantity !== undefined) {
    properties[NOTION_PROPERTY_NAMES.QUANTITY] = {
      number: wineData.Quantity
    };
  }

  if (wineData.Store) {
    properties[NOTION_PROPERTY_NAMES.STORE] = {
      rich_text: [
        {
          type: 'text',
          text: {
            content: wineData.Store
          }
        }
      ]
    };
  }

  if (wineData['Varietal(품종)'] && Array.isArray(wineData['Varietal(품종)']) && wineData['Varietal(품종)'].length > 0) {
    // Filter out empty strings and trim whitespace
    const validVarietals = wineData['Varietal(품종)']
      .filter(v => v && typeof v === 'string' && v.trim().length > 0)
      .map(v => v.trim())
      .slice(0, 100); // Limit to 100 items

    if (validVarietals.length > 0) {
      properties[NOTION_PROPERTY_NAMES.VARIETAL] = {
        multi_select: validVarietals.map(varietal => ({
          name: varietal.substring(0, 100) // Limit to 100 characters
        }))
      };
    }
  }

  if (wineData.Image) {
    properties[NOTION_PROPERTY_NAMES.IMAGE] = {
      files: [
        {
          type: 'external',
          name: 'wine-image',
          external: {
            url: wineData.Image
          }
        }
      ]
    };
  }

  // Add new fields: Country, Appellation, Notes
  if (wineData['Country(국가)']) {
    properties[NOTION_PROPERTY_NAMES.COUNTRY] = {
      select: {
        name: wineData['Country(국가)']
      }
    };
  }

  if (wineData['Appellation(원산지명칭)']) {
    properties[NOTION_PROPERTY_NAMES.APPELLATION] = {
      rich_text: [
        {
          type: 'text',
          text: {
            content: wineData['Appellation(원산지명칭)']
          }
        }
      ]
    };
  }

  if (wineData['Notes(메모)']) {
    properties[NOTION_PROPERTY_NAMES.NOTES] = {
      rich_text: [
        {
          type: 'text',
          text: {
            content: wineData['Notes(메모)']
          }
        }
      ]
    };
  }

  // Always set Status to '재고' and Quantity to 1 (override any input values)
  properties[NOTION_PROPERTY_NAMES.STATUS] = {
    select: {
      name: '재고'
    }
  };

  // Force Quantity to always be 1 for wine labels
  properties[NOTION_PROPERTY_NAMES.QUANTITY] = {
    number: 1
  };

  // Set Purchase date to current date
  properties[NOTION_PROPERTY_NAMES.PURCHASE_DATE] = {
    date: {
      start: new Date().toISOString().split('T')[0] // YYYY-MM-DD format
    }
  };

  if (process.env.NODE_ENV === 'development') {
    console.log('🔧 [NOTION-SCHEMA] Output properties:', JSON.stringify(properties, null, 2));
  }

  return properties;
}

export function validateWineData(data: Partial<NotionWineProperties>): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check Name field (required)
  if (!data.Name || data.Name.trim() === '') {
    errors.push('Wine name is required');
  } else if (data.Name.length > 2000) {
    errors.push('Wine name is too long (max 2000 characters)');
  }

  if (data.Vintage !== null && data.Vintage !== undefined) {
    if (data.Vintage < 1800 || data.Vintage > new Date().getFullYear() + 1) {
      errors.push('Vintage must be between 1800 and current year + 1');
    }
  }

  if (data.Price !== null && data.Price !== undefined && data.Price < 0) {
    errors.push('Price must be a positive number');
  }

  if (data.Quantity !== null && data.Quantity !== undefined && data.Quantity < 0) {
    errors.push('Quantity must be a positive number');
  }

  // Check text field lengths
  if (data['Region/Producer'] && data['Region/Producer'].length > 2000) {
    errors.push('Region/Producer is too long (max 2000 characters)');
  }

  if (data.Store && data.Store.length > 2000) {
    errors.push('Store is too long (max 2000 characters)');
  }

  // Check Varietal array
  if (data['Varietal(품종)'] && Array.isArray(data['Varietal(품종)'])) {
    if (data['Varietal(품종)'].length > 100) {
      errors.push('Too many varietals (max 100)');
    }
    for (const varietal of data['Varietal(품종)']) {
      if (typeof varietal === 'string' && varietal.length > 100) {
        errors.push('Varietal name is too long (max 100 characters)');
        break;
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}