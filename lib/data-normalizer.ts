// lib/data-normalizer.ts

/**
 * Normalize extracted wine data to ensure correct types for Notion API
 * Converts string numbers to actual numbers and maps field names
 */
export function normalizeWineData(rawData: any): any {
  const normalized: any = {
    name: rawData.Name || rawData.wine_name || rawData.name || 'Unknown Wine',
  };

  // Convert vintage to number if it's a string
  const vintage = rawData.Vintage || rawData.vintage;
  if (vintage) {
    if (typeof vintage === 'string') {
      const vintageNum = parseInt(vintage, 10);
      if (!isNaN(vintageNum)) {
        normalized.vintage = vintageNum;
      }
    } else if (typeof vintage === 'number') {
      normalized.vintage = vintage;
    }
  }

  // Convert price to number if it's a string
  const price = rawData.Price || rawData.price;
  if (price) {
    if (typeof price === 'string') {
      const priceNum = parseFloat(price.replace(/[$,]/g, ''));
      if (!isNaN(priceNum)) {
        normalized.price = priceNum;
      }
    } else if (typeof price === 'number') {
      normalized.price = price;
    }
  }

  // Convert quantity to number if it's a string
  const quantity = rawData.Quantity || rawData.quantity;
  if (quantity) {
    if (typeof quantity === 'string') {
      const quantityNum = parseInt(quantity, 10);
      if (!isNaN(quantityNum)) {
        normalized.quantity = quantityNum;
      }
    } else if (typeof quantity === 'number') {
      normalized.quantity = quantity;
    }
  }

  // Map extracted fields to Notion field names
  if (rawData['Region/Producer']) {
    normalized['Region/Producer'] = rawData['Region/Producer'];
  } else if (rawData.producer) {
    normalized['Region/Producer'] = rawData.producer;
  } else if (rawData.region) {
    normalized['Region/Producer'] = rawData.region;
  }

  if (rawData['Varietal(품종)']) {
    normalized['Varietal(품종)'] = Array.isArray(rawData['Varietal(품종)']) ? rawData['Varietal(품종)'].join(', ') : rawData['Varietal(품종)'];
  } else if (rawData.varietal) {
    normalized['Varietal(품종)'] = rawData.varietal;
  }

  if (rawData.Store || rawData.store) {
    normalized.store = rawData.Store || rawData.store;
  }

  return normalized;
}