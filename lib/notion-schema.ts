// Notion database schema definitions and type mappings

export interface NotionWineProperties {
  'Name': string;
  'Vintage': number | null;
  'Region/Producer': string;
  'Price': number | null;
  'Quantity': number | null;
  'Store': string;
  'Varietal(품종)': string[];
  'Image': string | null;
  'Status'?: string;
  'Purchase date'?: string;
}

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
  PURCHASE_DATE: 'Purchase date'
} as const;

export function mapToNotionProperties(wineData: NotionWineProperties): Record<string, any> {
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

  if (wineData['Varietal(품종)'] && wineData['Varietal(품종)'].length > 0) {
    properties[NOTION_PROPERTY_NAMES.VARIETAL] = {
      multi_select: wineData['Varietal(품종)'].map(varietal => ({
        name: varietal
      }))
    };
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

  // Always set Status to '재고' and Quantity to 1
  properties[NOTION_PROPERTY_NAMES.STATUS] = {
    select: {
      name: '재고'
    }
  };

  properties[NOTION_PROPERTY_NAMES.QUANTITY] = {
    number: 1
  };

  // Set Purchase date to current date
  properties[NOTION_PROPERTY_NAMES.PURCHASE_DATE] = {
    date: {
      start: new Date().toISOString().split('T')[0] // YYYY-MM-DD format
    }
  };

  return properties;
}

export function validateWineData(data: Partial<NotionWineProperties>): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!data.Name || data.Name.trim() === '') {
    errors.push('Wine name is required');
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

  return {
    isValid: errors.length === 0,
    errors
  };
}