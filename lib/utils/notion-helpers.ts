import { NotionWineProperties, WineInfo, ValidationResult } from '@/types';
export type { NotionWineProperties, WineInfo, ValidationResult };

export const NOTION_PROPERTY_NAMES = {
    NAME: 'Name',
    VINTAGE: 'Vintage',
    PRODUCER: 'Producer',             // C: 생산자 (분리)
    REGION: 'Region',                 // D: 지역 (분리)
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

/**
 * Normalize extracted data into standardized WineInfo format.
 * This ensures all AI-detected metadata is preserved.
 */
export const normalizeWineInfo = (data: any, savedImagePath: string | null = null): WineInfo => {
    // PascalCase primary fields for Notion, but keep lowercase for technical context
    const normalized: WineInfo = {
        Name: data.Name || data.name || 'Unknown Wine',
        Vintage: data.Vintage !== undefined ? data.Vintage : (data.vintage ? parseInt(data.vintage) : null),
        Producer: data.Producer || data.producer || '',
        Region: data.Region || data.region || '',
        Price: data.Price !== undefined ? data.Price : (data.price ? parseFloat(data.price) : null),
        Quantity: data.Quantity !== undefined ? data.Quantity : (data.quantity || 1),
        Store: data.Store || data.store || '',
        'Varietal(품종)': Array.isArray(data['Varietal(품종)'])
            ? data['Varietal(품종)']
            : (data.varietal ? [data.varietal] : (data.grape_variety ? [data.grape_variety] : [])),
        Image: data.Image || savedImagePath || null,

        // Metadata preservation
        country: data.country || data['Country(국가)'] || null,
        alcohol_content: data.alcohol_content || null,
        volume: data.volume || null,
        wine_type: data.wine_type || null,
        appellation: data.appellation || data['Appellation(원산지명칭)'] || null,
        notes: data.notes || data['Notes(메모)'] || null,
        varietal_reasoning: data.varietal_reasoning || null,

        // Technical fields for backward compatibility
        name: data.name || data.Name || 'Unknown Wine',
        vintage: data.vintage || data.Vintage || null,
        producer: data.producer || data.Producer || '',
        region: data.region || data.Region || '',
    };

    return normalized;
};

/**
 * Convert normalized WineInfo to specific Notion database properties.
 * ONLY call this when preparing data for Notion API submission.
 */
export const convertToNotionFormat = (wineInfo: WineInfo): NotionWineProperties => {
    return {
        'Name': wineInfo.Name,
        'Vintage': wineInfo.Vintage,
        'Producer': wineInfo.Producer,
        'Region': wineInfo.Region,
        'Price': wineInfo.Price,
        'Quantity': wineInfo.Quantity,
        'Store': wineInfo.Store,
        'Varietal(품종)': wineInfo['Varietal(품종)'],
        'Image': wineInfo.Image,
        'Country(국가)': wineInfo.country || '',
        'Appellation(원산지명칭)': wineInfo.appellation || '',
        'Notes(메모)': wineInfo.notes || ''
    };
};

/**
 * Helper function to merge wine data with user edits
 */
export function mergeWineDataWithEdits(
    originalData: NotionWineProperties,
    userEdits: Partial<NotionWineProperties>
): NotionWineProperties {
    return {
        ...originalData,
        ...userEdits
    };
}

/**
 * Helper function to prepare data for Notion API
 */
export function prepareForNotionSubmission(wineData: NotionWineProperties): NotionWineProperties {
    return {
        'Name': wineData.Name?.trim() || 'Unknown Wine',
        'Vintage': wineData.Vintage,
        'Producer': wineData.Producer?.trim() || '',
        'Region': wineData.Region?.trim() || '',
        'Price': wineData.Price,
        'Quantity': wineData.Quantity || 1,
        'Store': wineData.Store?.trim() || '',
        'Varietal(품종)': wineData['Varietal(품종)'] || [],
        'Image': wineData.Image,
        'Country(국가)': (wineData as any)['Country(국가)']?.trim() || '',
        'Appellation(원산지명칭)': (wineData as any)['Appellation(원산지명칭)']?.trim() || '',
        'Notes(메모)': (wineData as any)['Notes(메모)']?.trim() || ''
    };
}

export function mapToNotionProperties(wineData: NotionWineProperties): Record<string, any> {
    if (process.env.NODE_ENV === 'development') {
        console.log('🔧 [NOTION-HELPERS] Input wineData:', JSON.stringify(wineData, null, 2));
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

    if (wineData.Producer) {
        properties[NOTION_PROPERTY_NAMES.PRODUCER] = {
            rich_text: [
                {
                    type: 'text',
                    text: {
                        content: wineData.Producer
                    }
                }
            ]
        };
    }

    if (wineData.Region) {
        properties[NOTION_PROPERTY_NAMES.REGION] = {
            rich_text: [
                {
                    type: 'text',
                    text: {
                        content: wineData.Region
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
        const validVarietals = wineData['Varietal(품종)']
            .filter((v: string) => v && typeof v === 'string' && v.trim().length > 0)
            .map((v: string) => v.trim())
            .slice(0, 100);

        if (validVarietals.length > 0) {
            properties[NOTION_PROPERTY_NAMES.VARIETAL] = {
                multi_select: validVarietals.map((varietal: string) => ({
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

    properties[NOTION_PROPERTY_NAMES.STATUS] = {
        select: {
            name: '재고'
        }
    };

    properties[NOTION_PROPERTY_NAMES.QUANTITY] = {
        number: 1
    };

    properties[NOTION_PROPERTY_NAMES.PURCHASE_DATE] = {
        date: {
            start: new Date().toISOString().split('T')[0]
        }
    };

    if (process.env.NODE_ENV === 'development') {
        console.log('🔧 [NOTION-HELPERS] Output properties:', JSON.stringify(properties, null, 2));
    }

    return properties;
}

export function validateWineData(data: Partial<NotionWineProperties>): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // --- ERRORS (Blocking) ---
    if (!data.Name || data.Name.trim() === '') {
        errors.push('와인 이름은 필수입니다.');
    } else if (data.Name.length > 2000) {
        errors.push('와인 이름이 너무 깁니다 (최대 2000자).');
    }

    if (data.Price !== null && data.Price !== undefined && data.Price < 0) {
        errors.push('가격은 0원 이상이어야 합니다.');
    }

    if (data.Quantity !== null && data.Quantity !== undefined && data.Quantity < 0) {
        errors.push('수량은 0개 이상이어야 합니다.');
    }

    // --- WARNINGS (Non-Blocking) ---
    if (data.Vintage !== null && data.Vintage !== undefined) {
        const currentYear = new Date().getFullYear();
        if (data.Vintage < 1900 || data.Vintage > currentYear + 1) {
            warnings.push(`빈티지가 비현실적입니다 (${data.Vintage}). 1900-${currentYear + 1} 사이가 권장됩니다.`);
        }
    }

    if (data.Price !== null && data.Price !== undefined && data.Price > 10000000) {
        warnings.push('가격이 매우 높게 설정되었습니다 (1,000만원 이상).');
    }

    if (data.Producer && data.Producer.length > 2000) {
        warnings.push('생산자 정보가 너무 깁니다.');
    }

    if (data['Varietal(품종)'] && Array.isArray(data['Varietal(품종)'])) {
        if (data['Varietal(품종)'].length > 10) { // Notion limit is usually high, but 10 is enough for UI warning
            warnings.push('품종이 너무 많습니다 (10개 초과).');
        }
    }

    return {
        isValid: errors.length === 0,
        errors,
        warnings
    };
}
