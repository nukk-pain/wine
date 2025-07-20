// lib/config/logger.ts
import winston from 'winston';
import path from 'path';
import fs from 'fs';
import { getConfig } from './index';

// Get environment-specific logging configuration
const config = getConfig();
const logConfig = config.logging;

// Ensure logs directory exists (only if file logging is enabled)
const logsDir = path.join(process.cwd(), 'logs');
if (logConfig.fileLogging && !fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Create base logger configuration
const baseLoggerConfig: winston.LoggerOptions = {
  level: logConfig.level,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { 
    service: 'wine-tracker',
    environment: config.environment 
  },
  silent: logConfig.silent,
  transports: []
};

// Add file transports only if file logging is enabled
if (logConfig.fileLogging && !logConfig.silent) {
  (baseLoggerConfig.transports as winston.transport[]).push(
    // Error log file - only errors
    new winston.transports.File({ 
      filename: path.join(logsDir, 'error.log'), 
      level: 'error',
      maxsize: logConfig.maxFileSize,
      maxFiles: logConfig.maxFiles,
    }),
    
    // Combined log file - all levels
    new winston.transports.File({ 
      filename: path.join(logsDir, 'combined.log'),
      maxsize: logConfig.maxFileSize,
      maxFiles: logConfig.maxFiles,
    })
  );
}

// Add console transport if console logging is enabled
if (logConfig.consoleLogging && !logConfig.silent) {
  (baseLoggerConfig.transports as winston.transport[]).push(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  );
}

// Create winston logger with environment-specific configuration
const logger = winston.createLogger(baseLoggerConfig);

export default logger;

// Helper function to create module-specific logger
function createModuleLogger(moduleName: string): winston.Logger {
  const transports: winston.transport[] = [];
  
  // Add file transport if file logging is enabled
  if (logConfig.fileLogging && !logConfig.silent) {
    transports.push(
      new winston.transports.File({
        filename: path.join(logsDir, `${moduleName}.log`),
        maxsize: logConfig.maxFileSize,
        maxFiles: logConfig.maxFiles,
      })
    );
  }
  
  // Add console transport if console logging is enabled
  if (logConfig.consoleLogging && !logConfig.silent) {
    transports.push(
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        )
      })
    );
  }
  
  return winston.createLogger({
    level: logConfig.level,
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json()
    ),
    defaultMeta: { 
      service: 'wine-tracker', 
      module: moduleName,
      environment: config.environment 
    },
    silent: logConfig.silent,
    transports
  });
}

// Specific loggers for different modules with environment-specific configuration
export const visionLogger = createModuleLogger('vision-api');
export const uploadLogger = createModuleLogger('upload');
export const notionLogger = createModuleLogger('notion-api');