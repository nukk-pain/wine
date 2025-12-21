import type { NextApiRequest, NextApiResponse } from 'next';
import { ApiSuccessResponse, ApiErrorResponse } from '@/types';

/**
 * Send a success response
 */
export function sendSuccess<T>(res: NextApiResponse, data: T, statusCode = 200): void {
  const response: ApiSuccessResponse<T> = {
    success: true,
    data
  };
  res.status(statusCode).json(response);
}

/**
 * Send an error response
 */
export function sendError(res: NextApiResponse, error: string, statusCode = 400, details?: any): void {
  const response: ApiErrorResponse = {
    success: false,
    error
  };
  if (details) {
    response.details = details;
  }
  res.status(statusCode).json(response);
}

/**
 * Validate HTTP method
 */
export function validateMethod(
  req: NextApiRequest,
  res: NextApiResponse,
  allowedMethods: string[]
): boolean {
  if (!allowedMethods.includes(req.method || '')) {
    sendError(res, 'Method not allowed', 405);
    return false;
  }
  return true;
}

/**
 * Validate required fields in request body
 */
export function validateRequiredFields(
  body: any,
  requiredFields: string[],
  res: NextApiResponse
): boolean {
  const missingFields = requiredFields.filter(field => !body[field]);

  if (missingFields.length > 0) {
    sendError(
      res,
      `Missing required fields: ${missingFields.join(', ')}`,
      400
    );
    return false;
  }

  return true;
}

/**
 * Wrap API handler with error handling
 */
export function withErrorHandler(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      await handler(req, res);
    } catch (error) {
      console.error('API Error:', error);

      if (error instanceof Error) {
        sendError(res, error.message, 500);
      } else {
        sendError(res, 'Internal server error', 500);
      }
    }
  };
}

/**
 * Create a standardized API handler with method validation
 */
export function createApiHandler(
  handlers: {
    GET?: (req: NextApiRequest, res: NextApiResponse) => Promise<void>;
    POST?: (req: NextApiRequest, res: NextApiResponse) => Promise<void>;
    PUT?: (req: NextApiRequest, res: NextApiResponse) => Promise<void>;
    DELETE?: (req: NextApiRequest, res: NextApiResponse) => Promise<void>;
    PATCH?: (req: NextApiRequest, res: NextApiResponse) => Promise<void>;
  }
) {
  return withErrorHandler(async (req: NextApiRequest, res: NextApiResponse) => {
    const method = req.method as keyof typeof handlers;
    const handler = handlers[method];

    if (!handler) {
      const allowedMethods = Object.keys(handlers);
      sendError(res, 'Method not allowed', 405, { allowedMethods });
      return;
    }

    await handler(req, res);
  });
}

/**
 * Parse JSON body safely
 */
export function parseJsonBody<T>(body: any): T | null {
  if (typeof body === 'string') {
    try {
      return JSON.parse(body);
    } catch {
      return null;
    }
  }
  return body as T;
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}