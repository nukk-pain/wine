/**
 * Request validation utilities and middleware
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { AppError, createValidationError } from './error-handling';

export interface ValidationRule<T = any> {
  field: string;
  required?: boolean;
  type?: 'string' | 'number' | 'boolean' | 'array' | 'object';
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  validator?: (value: T) => boolean;
  transform?: (value: any) => T;
  message?: string;
}

export interface ValidationSchema {
  [key: string]: ValidationRule;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  data?: any;
}

/**
 * Validate data against a schema
 */
export function validateData(data: any, schema: ValidationSchema): ValidationResult {
  const errors: string[] = [];
  const validatedData: any = {};

  for (const [fieldName, rule] of Object.entries(schema)) {
    const value = data?.[fieldName];
    
    // Check required fields
    if (rule.required && (value === undefined || value === null || value === '')) {
      errors.push(rule.message || `${rule.field || fieldName} is required`);
      continue;
    }
    
    // Skip validation if field is not required and not present
    if (!rule.required && (value === undefined || value === null)) {
      continue;
    }
    
    // Type validation
    if (rule.type && !isValidType(value, rule.type)) {
      errors.push(rule.message || `${rule.field || fieldName} must be of type ${rule.type}`);
      continue;
    }
    
    // String validations
    if (rule.type === 'string' && typeof value === 'string') {
      if (rule.minLength !== undefined && value.length < rule.minLength) {
        errors.push(rule.message || `${rule.field || fieldName} must be at least ${rule.minLength} characters`);
        continue;
      }
      
      if (rule.maxLength !== undefined && value.length > rule.maxLength) {
        errors.push(rule.message || `${rule.field || fieldName} must not exceed ${rule.maxLength} characters`);
        continue;
      }
      
      if (rule.pattern && !rule.pattern.test(value)) {
        errors.push(rule.message || `${rule.field || fieldName} format is invalid`);
        continue;
      }
    }
    
    // Number validations
    if (rule.type === 'number' && typeof value === 'number') {
      if (rule.min !== undefined && value < rule.min) {
        errors.push(rule.message || `${rule.field || fieldName} must be at least ${rule.min}`);
        continue;
      }
      
      if (rule.max !== undefined && value > rule.max) {
        errors.push(rule.message || `${rule.field || fieldName} must not exceed ${rule.max}`);
        continue;
      }
    }
    
    // Array validations
    if (rule.type === 'array' && Array.isArray(value)) {
      if (rule.minLength !== undefined && value.length < rule.minLength) {
        errors.push(rule.message || `${rule.field || fieldName} must have at least ${rule.minLength} items`);
        continue;
      }
      
      if (rule.maxLength !== undefined && value.length > rule.maxLength) {
        errors.push(rule.message || `${rule.field || fieldName} must not exceed ${rule.maxLength} items`);
        continue;
      }
    }
    
    // Custom validator
    if (rule.validator && !rule.validator(value)) {
      errors.push(rule.message || `${rule.field || fieldName} is invalid`);
      continue;
    }
    
    // Transform value if transformer provided
    const finalValue = rule.transform ? rule.transform(value) : value;
    validatedData[fieldName] = finalValue;
  }
  
  return {
    valid: errors.length === 0,
    errors,
    data: errors.length === 0 ? validatedData : undefined
  };
}

/**
 * Check if value matches expected type
 */
function isValidType(value: any, type: ValidationRule['type']): boolean {
  switch (type) {
    case 'string':
      return typeof value === 'string';
    case 'number':
      return typeof value === 'number' && !isNaN(value);
    case 'boolean':
      return typeof value === 'boolean';
    case 'array':
      return Array.isArray(value);
    case 'object':
      return typeof value === 'object' && value !== null && !Array.isArray(value);
    default:
      return true;
  }
}

/**
 * Validation middleware for API routes
 */
export function createValidationMiddleware(schema: ValidationSchema) {
  return (req: NextApiRequest, res: NextApiResponse, next: () => void) => {
    const result = validateData(req.body, schema);
    
    if (!result.valid) {
      throw createValidationError('Validation failed', {
        errors: result.errors,
        receivedData: req.body
      });
    }
    
    // Attach validated data to request
    (req as any).validatedData = result.data;
    next();
  };
}

/**
 * Validate file upload
 */
export function validateFileUpload(
  file: { size: number; mimetype?: string; originalFilename?: string },
  options: {
    maxSize?: number;
    allowedTypes?: string[];
    requiredExtensions?: string[];
  } = {}
): ValidationResult {
  const errors: string[] = [];
  
  const {
    maxSize = 10 * 1024 * 1024, // 10MB default
    allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    requiredExtensions = ['.jpg', '.jpeg', '.png', '.webp']
  } = options;
  
  // Check file size
  if (file.size > maxSize) {
    errors.push(`File size ${Math.round(file.size / 1024 / 1024)}MB exceeds maximum ${Math.round(maxSize / 1024 / 1024)}MB`);
  }
  
  // Check MIME type
  if (file.mimetype && !allowedTypes.includes(file.mimetype)) {
    errors.push(`File type ${file.mimetype} not allowed. Allowed types: ${allowedTypes.join(', ')}`);
  }
  
  // Check file extension
  if (file.originalFilename && requiredExtensions.length > 0) {
    const extension = file.originalFilename.toLowerCase().substring(file.originalFilename.lastIndexOf('.'));
    if (!requiredExtensions.includes(extension)) {
      errors.push(`File extension ${extension} not allowed. Allowed extensions: ${requiredExtensions.join(', ')}`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Common validation schemas
 */
export const schemas = {
  wineData: {
    Name: {
      field: 'Name',
      required: true,
      type: 'string' as const,
      minLength: 1,
      maxLength: 200,
      message: 'Wine name is required and must be 1-200 characters'
    },
    Vintage: {
      field: 'Vintage',
      required: false,
      type: 'number' as const,
      min: 1800,
      max: new Date().getFullYear() + 10,
      message: 'Vintage must be a valid year'
    },
    'Region/Producer': {
      field: 'Region/Producer',
      required: false,
      type: 'string' as const,
      maxLength: 200,
      message: 'Region/Producer must not exceed 200 characters'
    },
    Price: {
      field: 'Price',
      required: false,
      type: 'number' as const,
      min: 0,
      message: 'Price must be a positive number'
    },
    Quantity: {
      field: 'Quantity',
      required: false,
      type: 'number' as const,
      min: 1,
      message: 'Quantity must be at least 1'
    },
    Store: {
      field: 'Store',
      required: false,
      type: 'string' as const,
      maxLength: 100,
      message: 'Store name must not exceed 100 characters'
    },
    'Varietal(품종)': {
      field: 'Varietal(품종)',
      required: false,
      type: 'array' as const,
      maxLength: 10,
      message: 'Maximum 10 varietals allowed'
    }
  },
  
  notionAction: {
    action: {
      field: 'action',
      required: true,
      type: 'string' as const,
      validator: (value: string) => ['save_wine', 'save_wine_v2', 'save_receipt', 'update_status'].includes(value),
      message: 'Action must be one of: save_wine, save_wine_v2, save_receipt, update_status'
    },
    data: {
      field: 'data',
      required: true,
      type: 'object' as const,
      message: 'Data object is required'
    }
  }
};