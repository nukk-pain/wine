/**
 * Common API response types
 */

export interface UploadResponse {
  fileName: string;
  filePath: string;
  fileUrl: string;
  fileSize: number;
  optimized: boolean;
  url?: string; // For Vercel Blob compatibility
}

export interface ProcessResponse {
  imageType: 'wine_label' | 'receipt' | 'unknown';
  wines?: Array<{
    name: string;
    vintage?: number;
    producer?: string;
    region?: string;
    varietal?: string;
    price?: number;
    quantity?: number;
  }>;
  receiptData?: {
    store: string;
    date: string;
    items: Array<{
      wine_name: string;
      quantity: number;
      price: number;
      vintage?: number;
    }>;
    total?: number;
  };
  ocrText?: string;
  imageClassification?: string;
  notionPageId?: string;
  notionUrl?: string;
}

export interface BatchUploadResponse {
  totalFiles: number;
  successful: number;
  failed: number;
  results: Array<{
    fileName: string;
    success: boolean;
    error?: string;
    url?: string;
    filePath?: string;
    fileSize?: number;
  }>;
}

export interface BatchProcessResponse {
  processed: number;
  total: number;
  results: Array<{
    fileName: string;
    success: boolean;
    imageType?: 'wine_label' | 'receipt' | 'unknown';
    data?: any;
    notionPageId?: string;
    error?: string;
  }>;
}