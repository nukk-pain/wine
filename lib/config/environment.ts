// lib/config/environment.ts
import fs from 'fs';
import path from 'path';

export interface EnvironmentConfig {
  nodeEnv: string;
  googleCredentials: string | undefined;
  notionApiKey: string | undefined;
  notionDatabaseId: string | undefined;
  isDevelopment: boolean;
  isProduction: boolean;
  isTest: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * 현재 환경 설정을 반환합니다.
 */
export function getEnvironmentConfig(): EnvironmentConfig {
  const nodeEnv = process.env.NODE_ENV || 'development';
  
  return {
    nodeEnv,
    googleCredentials: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    notionApiKey: process.env.NOTION_API_KEY,
    notionDatabaseId: process.env.NOTION_DATABASE_ID,
    isDevelopment: nodeEnv === 'development',
    isProduction: nodeEnv === 'production',
    isTest: nodeEnv === 'test'
  };
}

/**
 * 환경 설정의 유효성을 검증합니다.
 */
export function validateEnvironmentConfig(): ValidationResult {
  const config = getEnvironmentConfig();
  const errors: string[] = [];
  const warnings: string[] = [];

  // Google Cloud Vision API 설정 검증
  if (!config.googleCredentials) {
    errors.push('GOOGLE_APPLICATION_CREDENTIALS environment variable is not set');
  } else {
    try {
      validateGoogleCredentials(config.googleCredentials);
    } catch (error: any) {
      errors.push(`Google credentials validation failed: ${error.message}`);
    }
  }

  // Notion API 설정 검증
  if (!config.notionApiKey) {
    errors.push('NOTION_API_KEY environment variable is not set');
  } else {
    try {
      validateNotionApiKey(config.notionApiKey);
    } catch (error: any) {
      errors.push(`Notion API key validation failed: ${error.message}`);
    }
  }

  // 프로덕션 환경에서의 추가 검증
  if (config.isProduction) {
    if (!config.notionDatabaseId) {
      errors.push('NOTION_DATABASE_ID is required in production environment');
    } else {
      try {
        validateNotionDatabaseId(config.notionDatabaseId);
      } catch (error: any) {
        errors.push(`Notion database ID validation failed: ${error.message}`);
      }
    }
  }

  // 개발 환경에서의 경고
  if (config.isDevelopment) {
    if (!config.notionDatabaseId) {
      warnings.push('NOTION_DATABASE_ID is not set - using default database');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Google Cloud 인증 파일을 검증합니다.
 */
function validateGoogleCredentials(credentialsPath: string): void {
  // 파일 존재 확인
  if (!fs.existsSync(credentialsPath)) {
    throw new Error(`Credentials file not found: ${credentialsPath}`);
  }

  // 파일 읽기 권한 확인
  try {
    fs.accessSync(credentialsPath, fs.constants.R_OK);
  } catch {
    throw new Error(`Cannot read credentials file: ${credentialsPath}`);
  }

  // JSON 형식 확인
  let credentials: any;
  try {
    const credentialsContent = fs.readFileSync(credentialsPath, 'utf8');
    credentials = JSON.parse(credentialsContent);
  } catch {
    throw new Error(`Invalid JSON format in credentials file: ${credentialsPath}`);
  }

  // 필수 필드 확인
  const requiredFields = [
    'type', 'project_id', 'private_key', 'client_email', 
    'client_id', 'auth_uri', 'token_uri'
  ];

  for (const field of requiredFields) {
    if (!credentials[field]) {
      throw new Error(`Missing required field '${field}' in credentials file`);
    }
  }

  // 서비스 계정 타입 확인
  if (credentials.type !== 'service_account') {
    throw new Error(`Expected service account credentials, got: ${credentials.type}`);
  }

  // 프로젝트 ID 형식 확인
  if (!/^[a-z][a-z0-9\-]*[a-z0-9]$/.test(credentials.project_id)) {
    throw new Error(`Invalid project ID format: ${credentials.project_id}`);
  }
}

/**
 * Notion API 키를 검증합니다.
 */
function validateNotionApiKey(apiKey: string): void {
  // API 키 형식 확인 (secret_ 또는 ntn_으로 시작)
  if (!/^(secret_|ntn_)/.test(apiKey)) {
    throw new Error('Notion API key must start with "secret_" or "ntn_"');
  }

  // 최소 길이 확인
  if (apiKey.length < 20) {
    throw new Error('Notion API key is too short');
  }
}

/**
 * Notion 데이터베이스 ID를 검증합니다.
 */
function validateNotionDatabaseId(databaseId: string): void {
  // UUID 형식 확인
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
  if (!uuidRegex.test(databaseId)) {
    throw new Error('Notion database ID must be a valid UUID format');
  }
}

/**
 * 환경 설정을 초기화하고 검증합니다.
 * 애플리케이션 시작 시 호출해야 합니다.
 */
export function initializeEnvironment(): void {
  const validation = validateEnvironmentConfig();
  
  // 경고 출력
  if (validation.warnings.length > 0) {
    console.warn('Environment configuration warnings:');
    validation.warnings.forEach(warning => console.warn(`  - ${warning}`));
  }
  
  // 오류가 있으면 실패
  if (!validation.isValid) {
    console.error('Environment configuration errors:');
    validation.errors.forEach(error => console.error(`  - ${error}`));
    throw new Error('Environment configuration validation failed');
  }
  
  console.log('Environment configuration validated successfully');
}