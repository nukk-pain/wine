/**
 * Advanced error handling utilities for the Wine Tracker application
 */

export enum ErrorCodes {
  // Validation errors
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  REQUIRED_FIELD_MISSING = 'REQUIRED_FIELD_MISSING',
  INVALID_FORMAT = 'INVALID_FORMAT',
  
  // File upload errors
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE = 'INVALID_FILE_TYPE',
  UPLOAD_FAILED = 'UPLOAD_FAILED',
  
  // Processing errors
  PROCESSING_FAILED = 'PROCESSING_FAILED',
  OCR_FAILED = 'OCR_FAILED',
  AI_PARSING_FAILED = 'AI_PARSING_FAILED',
  
  // External service errors
  NOTION_ERROR = 'NOTION_ERROR',
  GEMINI_ERROR = 'GEMINI_ERROR',
  VISION_ERROR = 'VISION_ERROR',
  VERCEL_BLOB_ERROR = 'VERCEL_BLOB_ERROR',
  
  // System errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  TIMEOUT = 'TIMEOUT'
}

export class AppError extends Error {
  public readonly code: ErrorCodes;
  public readonly statusCode: number;
  public readonly details?: any;
  public readonly timestamp: Date;

  constructor(
    code: ErrorCodes,
    message: string,
    statusCode: number = 500,
    details?: any
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.timestamp = new Date();
    
    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * Create validation error
 */
export function createValidationError(message: string, details?: any): AppError {
  return new AppError(ErrorCodes.VALIDATION_FAILED, message, 400, details);
}

/**
 * Create file upload error
 */
export function createUploadError(message: string, details?: any): AppError {
  return new AppError(ErrorCodes.UPLOAD_FAILED, message, 400, details);
}

/**
 * Create processing error
 */
export function createProcessingError(message: string, details?: any): AppError {
  return new AppError(ErrorCodes.PROCESSING_FAILED, message, 500, details);
}

/**
 * Create external service error
 */
export function createServiceError(
  service: 'notion' | 'gemini' | 'vision' | 'blob',
  message: string,
  details?: any
): AppError {
  const codeMap = {
    notion: ErrorCodes.NOTION_ERROR,
    gemini: ErrorCodes.GEMINI_ERROR,
    vision: ErrorCodes.VISION_ERROR,
    blob: ErrorCodes.VERCEL_BLOB_ERROR
  };
  
  return new AppError(codeMap[service], message, 502, details);
}

/**
 * Create timeout error
 */
export function createTimeoutError(operation: string, timeout: number): AppError {
  return new AppError(
    ErrorCodes.TIMEOUT,
    `Operation '${operation}' timed out after ${timeout}ms`,
    408
  );
}

/**
 * Error logger with structured logging
 */
export function logError(error: AppError | Error, context?: Record<string, any>) {
  const logData = {
    timestamp: new Date().toISOString(),
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack
    },
    ...(error instanceof AppError && {
      code: error.code,
      statusCode: error.statusCode,
      details: error.details
    }),
    ...(context && { context })
  };

  if (error instanceof AppError && error.statusCode < 500) {
    // Client errors - log as warning
    console.warn('Client Error:', JSON.stringify(logData, null, 2));
  } else {
    // Server errors - log as error
    console.error('Server Error:', JSON.stringify(logData, null, 2));
  }
}

/**
 * Safe error converter for client responses
 */
export function sanitizeErrorForClient(error: AppError | Error): {
  message: string;
  code?: string;
  details?: any;
} {
  if (error instanceof AppError) {
    return {
      message: error.message,
      code: error.code,
      // Only include details for client errors (4xx)
      ...(error.statusCode < 500 && error.details && { details: error.details })
    };
  }
  
  // For unknown errors, return generic message
  return {
    message: 'An unexpected error occurred',
    code: ErrorCodes.INTERNAL_ERROR
  };
}

/**
 * Retry wrapper for operations that may fail
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000,
  operationName: string = 'operation'
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt === maxRetries) {
        throw new AppError(
          ErrorCodes.PROCESSING_FAILED,
          `${operationName} failed after ${maxRetries} attempts: ${lastError.message}`,
          500,
          { attempts: maxRetries, originalError: lastError.message }
        );
      }
      
      // Wait before retry (exponential backoff)
      const delay = delayMs * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

/**
 * Timeout wrapper for async operations
 */
export async function withTimeout<T>(
  operation: Promise<T>,
  timeoutMs: number,
  operationName: string = 'operation'
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(createTimeoutError(operationName, timeoutMs));
    }, timeoutMs);
  });
  
  return Promise.race([operation, timeoutPromise]);
}