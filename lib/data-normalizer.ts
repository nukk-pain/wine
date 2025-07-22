// lib/data-normalizer.ts

/**
 * Normalize extracted wine data to ensure correct types for Notion API
 * Converts string numbers to actual numbers and maps field names
 */
export function normalizeWineData(rawData: any): any {
  if (process.env.NODE_ENV === 'development') {
    console.log('🔄 [Normalizer] Input data:', JSON.stringify(rawData, null, 2));
  }
  
  // 🚨 CRITICAL: Gemini API returns data with exact Notion field names!
  // We should preserve them instead of changing them
  const normalized: any = {};

  // Name field (most critical)
  normalized.name = rawData.Name || rawData.wine_name || rawData.name || 'Unknown Wine';

  // Convert vintage to number if it's a string  
  const vintage = rawData.Vintage || rawData.vintage;
  if (vintage !== null && vintage !== undefined) {
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
  if (price !== null && price !== undefined) {
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
  if (quantity !== null && quantity !== undefined) {
    if (typeof quantity === 'string') {
      const quantityNum = parseInt(quantity, 10);
      if (!isNaN(quantityNum)) {
        normalized.quantity = quantityNum;
      }
    } else if (typeof quantity === 'number') {
      normalized.quantity = quantity;
    }
  }

  // 🚨 CRITICAL: Preserve exact Notion field names from Gemini
  if (rawData['Region/Producer']) {
    normalized['Region/Producer'] = rawData['Region/Producer'];
  } else if (rawData.producer) {
    normalized['Region/Producer'] = rawData.producer;
  } else if (rawData.region) {
    normalized['Region/Producer'] = rawData.region;
  }

  // 🚨 CRITICAL: Handle varietals as array from Gemini  
  if (rawData['Varietal(품종)']) {
    if (Array.isArray(rawData['Varietal(품종)'])) {
      normalized['Varietal(품종)'] = rawData['Varietal(품종)'].join(', ');
    } else {
      normalized['Varietal(품종)'] = rawData['Varietal(품종)'];
    }
  } else if (rawData.varietal) {
    normalized['Varietal(품종)'] = rawData.varietal;
  }

  // Store field
  if (rawData.Store || rawData.store) {
    normalized.Store = rawData.Store || rawData.store;
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('✅ [Normalizer] Output data:', JSON.stringify(normalized, null, 2));
  }
  
  return normalized;
}