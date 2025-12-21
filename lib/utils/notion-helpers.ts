import { NotionWineProperties } from '@/types';

/**
 * Convert extracted data to Notion format
 */
export const convertToNotionFormat = (extractedData: any): NotionWineProperties => {
    return {
        'Name': extractedData.Name || extractedData.wine_name || '',
        'Vintage': extractedData.Vintage || extractedData.vintage ? parseInt(extractedData.Vintage || extractedData.vintage) : null,
        'Region/Producer': extractedData['Region/Producer'] || [extractedData.region, extractedData.producer].filter(Boolean).join(', ') || '',
        'Price': extractedData.Price || extractedData.price ? parseFloat(extractedData.Price || extractedData.price) : null,
        'Quantity': extractedData.Quantity || 1,
        'Store': extractedData.Store || '',
        'Varietal(품종)': Array.isArray(extractedData['Varietal(품종)']) ? extractedData['Varietal(품종)'] : (extractedData.varietal ? [extractedData.varietal] : []),
        'Image': null,
        'Country(국가)': extractedData['Country(국가)'] || extractedData.country || '',
        'Appellation(원산지명칭)': extractedData['Appellation(원산지명칭)'] || extractedData.appellation || '',
        'Notes(메모)': extractedData['Notes(메모)'] || extractedData.notes || ''
    };
};
