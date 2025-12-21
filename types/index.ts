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
export type ImageType = 'wine_label' | 'unknown';

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
export interface WineInfo extends NotionWineProperties {
    // Additional fields that might be extracted but not stored in Notion
    country?: string;
    alcohol_content?: string;
    volume?: string;
    wine_type?: string;
    appellation?: string;
    notes?: string;

    // Legacy fields (optional, for backward compatibility if needed)
    name?: string;
    vintage?: number;
    producer?: string;
    region?: string;
    grape_variety?: string;
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
// API Response for process endpoint
export interface ProcessResponse {
    type: ImageType;
    extractedData: WineInfo;
    uploadedUrl?: string; // Standardized URL for the uploaded/saved image
    savedImagePath?: string; // Legacy/Internal path
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
    data?: WineInfo;
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
    | 'uploaded'
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
    extractedData?: WineInfo;
    imageType?: ImageType;
    error?: string;
    notionResult?: {
        id: string;
        url: string;
    };
    progress?: number;
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
    data: WineInfo | null;
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
