/**
 * Wine Tracker - Centralized Type Definitions
 * 
 * This file consolidates all type definitions across the codebase.
 * Other modules should import types from here for consistency.
 */

// =============================================================================
// IMAGE TYPES
// =============================================================================

/** Supported image classification types */
export type ImageType = 'wine_label' | 'receipt' | 'unknown';

// =============================================================================
// WINE DATA TYPES
// =============================================================================

/** 
 * Core Notion wine properties - the primary wine data structure
 * Used for saving to Notion database
 */
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
    'Country(국가)'?: string;
    'Appellation(원산지명칭)'?: string;
    'Notes(메모)'?: string;
}

/**
 * Wine info extracted from AI analysis
 * Used by Gemini service for wine label extraction
 */
export interface WineInfo {
    name?: string;
    vintage?: number;
    producer?: string;
    region?: string;
    grape_variety?: string;
    country?: string;
    alcohol_content?: string;
    volume?: string;
    wine_type?: string;
    appellation?: string;
    notes?: string;
}

/**
 * Receipt info extracted from AI analysis
 * Used by Gemini service for receipt extraction
 */
export interface ReceiptInfo {
    store_name: string;
    purchase_date?: string;
    items: ReceiptItem[];
    total_amount?: number;
    currency?: string;
}

export interface ReceiptItem {
    wine_name: string;
    quantity: number;
    price: number;
    vintage?: number;
}

/**
 * @deprecated Use NotionWineProperties instead
 * Legacy interface maintained for backwards compatibility
 */
export interface LegacyWineData {
    name: string;
    vintage?: number;
    'Region/Producer'?: string;
    'Varietal(품종)'?: string | string[];
    price?: number;
    quantity?: number;
    'Purchase date'?: string;
    Store?: string;
    Status?: string;
}

/**
 * @deprecated Use ReceiptInfo instead
 * Legacy interface maintained for backwards compatibility
 */
export interface LegacyReceiptData {
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

// =============================================================================
// API RESPONSE TYPES
// =============================================================================

/** Standard API success response wrapper */
export interface ApiSuccessResponse<T = unknown> {
    success: true;
    data: T;
}

/** Standard API error response wrapper */
export interface ApiErrorResponse {
    success: false;
    error: string;
    code?: string;
    details?: unknown;
}

/** Union type for all API responses */
export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

/** Upload endpoint response */
export interface UploadResponse {
    fileName: string;
    filePath: string;
    fileUrl: string;
    fileSize: number;
    optimized: boolean;
    url?: string; // For Vercel Blob compatibility
}

/** Process endpoint response */
export interface ProcessResponse {
    imageType: ImageType;
    wines?: WineInfo[];
    receiptData?: ReceiptInfo;
    ocrText?: string;
    imageClassification?: string;
    notionPageId?: string;
    notionUrl?: string;
}

/** Batch upload response */
export interface BatchUploadResponse {
    totalFiles: number;
    successful: number;
    failed: number;
    results: BatchUploadResult[];
}

export interface BatchUploadResult {
    fileName: string;
    success: boolean;
    error?: string;
    url?: string;
    filePath?: string;
    fileSize?: number;
}

/** Batch process response */
export interface BatchProcessResponse {
    processed: number;
    total: number;
    results: BatchProcessResult[];
}

export interface BatchProcessResult {
    fileName: string;
    success: boolean;
    imageType?: ImageType;
    data?: WineInfo | ReceiptInfo;
    notionPageId?: string;
    error?: string;
}

// =============================================================================
// COMPONENT TYPES
// =============================================================================

/** Status of an image processing item */
export type ProcessingStatus =
    | 'pending'
    | 'uploading'
    | 'processing'
    | 'completed'
    | 'error'
    | 'saving'
    | 'saved';

/** Image processing item used in batch workflows */
export interface ImageProcessingItem {
    id: string;
    file: File;
    preview: string;
    status: ProcessingStatus;
    uploadedUrl?: string;
    extractedData?: WineInfo | ReceiptInfo;
    imageType?: ImageType;
    error?: string;
    notionResult?: {
        id: string;
        url: string;
    };
}

/** Validation result for wine data */
export interface ValidationResult {
    isValid: boolean;
    errors: string[];
    warnings?: string[];
}

// =============================================================================
// SERVICE TYPES
// =============================================================================

/** Vision API processing result */
export interface ProcessedImageResult {
    imageType: ImageType;
    confidence: number;
    data: WineInfo | ReceiptInfo | null;
    rawText: string;
}

/** Notion save result */
export interface NotionSaveResult {
    id: string;
    url: string;
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

/** Make all properties optional and allow null */
export type Nullable<T> = {
    [P in keyof T]?: T[P] | null;
};

/** Extract item type from array type */
export type ArrayItem<T> = T extends (infer U)[] ? U : never;
