// lib/data-normalizer.ts

/**
 * Normalize extracted wine data to ensure correct types for Notion API
 * Converts string numbers to actual numbers and maps field names
 */
export function normalizeWineData(rawData: any): any {
  const normalized: any = {
    name: rawData.wine_name || rawData.name || 'Unknown Wine',
  };

  // Convert vintage to number if it's a string
  if (rawData.vintage) {
    if (typeof rawData.vintage === 'string') {
      const vintageNum = parseInt(rawData.vintage, 10);
      if (!isNaN(vintageNum)) {
        normalized.vintage = vintageNum;
      }
    } else if (typeof rawData.vintage === 'number') {
      normalized.vintage = rawData.vintage;
    }
  }

  // Convert price to number if it's a string
  if (rawData.price) {
    if (typeof rawData.price === 'string') {
      const priceNum = parseFloat(rawData.price.replace(/[$,]/g, ''));
      if (!isNaN(priceNum)) {
        normalized.price = priceNum;
      }
    } else if (typeof rawData.price === 'number') {
      normalized.price = rawData.price;
    }
  }

  // Convert quantity to number if it's a string
  if (rawData.quantity) {
    if (typeof rawData.quantity === 'string') {
      const quantityNum = parseInt(rawData.quantity, 10);
      if (!isNaN(quantityNum)) {
        normalized.quantity = quantityNum;
      }
    } else if (typeof rawData.quantity === 'number') {
      normalized.quantity = rawData.quantity;
    }
  }

  // Map extracted fields to Notion field names
  if (rawData.producer) {
    normalized['Region/Producer'] = rawData.producer;
  } else if (rawData.region) {
    normalized['Region/Producer'] = rawData.region;
  }

  if (rawData.varietal) {
    normalized['Varietal(품종)'] = rawData.varietal;
  }

  return normalized;
}