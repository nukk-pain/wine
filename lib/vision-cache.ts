// lib/vision-cache.ts
import NodeCache from 'node-cache';
import crypto from 'crypto';
import fs from 'fs';
import { visionLogger } from './config/logger';

import { getConfig } from './config';

// Get environment-specific cache configuration
const config = getConfig();
const cacheConf = config.cache;

// Cache configuration with environment-specific settings
const cache = new NodeCache({ 
  stdTTL: cacheConf.stdTTL,
  maxKeys: cacheConf.maxKeys,
  checkperiod: cacheConf.checkperiod,
  useClones: false, // 성능 향상을 위해 복제 비활성화
  deleteOnExpire: true, // 만료 시 자동 삭제
  enableLegacyCallbacks: false // 성능 향상을 위해 레거시 콜백 비활성화
});

// Cache statistics with enhanced metrics
let cacheStats = {
  hits: 0,
  misses: 0,
  errors: 0,
  evictions: 0, // LRU 정책에 의한 자동 제거 카운트
  memoryWarnings: 0 // 메모리 경고 카운트
};

// Environment-specific memory management configuration
const MEMORY_LIMITS = cacheConf.memoryLimits;

/**
 * 이미지 파일의 해시를 생성합니다.
 */
async function generateImageHash(imageUrl: string): Promise<string> {
  try {
    if (imageUrl.startsWith('http')) {
      // URL의 경우 URL 자체를 해시
      return crypto.createHash('sha256').update(imageUrl).digest('hex');
    } else {
      // 로컬 파일의 경우 파일 내용을 해시
      const fileBuffer = fs.readFileSync(imageUrl);
      const fileStats = fs.statSync(imageUrl);
      
      // 파일 내용 + 수정 시간을 조합하여 해시 생성
      const combinedData = Buffer.concat([
        fileBuffer,
        Buffer.from(fileStats.mtime.toISOString())
      ]);
      
      return crypto.createHash('sha256').update(combinedData).digest('hex');
    }
  } catch (error: any) {
    visionLogger.error('Failed to generate image hash', {
      imageUrl,
      error: error.message
    });
    // 해시 생성 실패 시 URL 자체를 기본 키로 사용
    return crypto.createHash('sha256').update(imageUrl).digest('hex');
  }
}

/**
 * 캐시된 결과를 가져옵니다.
 */
export function getCachedResult(cacheKey: string): string | undefined {
  try {
    const result = cache.get<string>(cacheKey);
    if (result !== undefined) {
      cacheStats.hits++;
      visionLogger.debug('Cache hit', { cacheKey, cacheStats });
      return result;
    } else {
      cacheStats.misses++;
      visionLogger.debug('Cache miss', { cacheKey, cacheStats });
      return undefined;
    }
  } catch (error: any) {
    cacheStats.errors++;
    visionLogger.error('Cache get error', {
      cacheKey,
      error: error.message,
      cacheStats
    });
    return undefined;
  }
}

/**
 * 결과를 캐시에 저장합니다.
 */
export function setCachedResult(cacheKey: string, result: string, ttl?: number): boolean {
  try {
    const success = cache.set(cacheKey, result, ttl);
    if (success) {
      visionLogger.debug('Cache set successful', { 
        cacheKey, 
        resultLength: result.length,
        ttl: ttl || cache.options.stdTTL,
        cacheStats
      });
    } else {
      visionLogger.warn('Cache set failed', { cacheKey, cacheStats });
    }
    return success;
  } catch (error: any) {
    cacheStats.errors++;
    visionLogger.error('Cache set error', {
      cacheKey,
      error: error.message,
      cacheStats
    });
    return false;
  }
}

/**
 * 이미지 URL에서 캐시 키를 생성합니다.
 */
export async function generateCacheKey(imageUrl: string): Promise<string> {
  const hash = await generateImageHash(imageUrl);
  return `vision_ocr_${hash}`;
}

/**
 * 캐시 통계를 반환합니다.
 */
export function getCacheStats() {
  const nodeStats = cache.getStats();
  return {
    ...cacheStats,
    keys: nodeStats.keys,
    hits: nodeStats.hits,
    misses: nodeStats.misses,
    ksize: nodeStats.ksize,
    vsize: nodeStats.vsize,
    evictions: cacheStats.evictions,
    memoryWarnings: cacheStats.memoryWarnings
  };
}

/**
 * 캐시를 초기화합니다.
 */
export function clearCache(): void {
  cache.flushAll();
  cacheStats = { 
    hits: 0, 
    misses: 0, 
    errors: 0, 
    evictions: 0, 
    memoryWarnings: 0 
  };
  visionLogger.info('Cache cleared', { cacheStats });
}

/**
 * 특정 키의 캐시를 삭제합니다.
 */
export function deleteCachedResult(cacheKey: string): number {
  const deleted = cache.del(cacheKey);
  visionLogger.debug('Cache key deleted', { cacheKey, deleted });
  return deleted;
}

/**
 * 캐시 TTL을 업데이트합니다.
 */
export function updateCacheTTL(cacheKey: string, ttl: number): boolean {
  const success = cache.ttl(cacheKey, ttl);
  visionLogger.debug('Cache TTL updated', { cacheKey, ttl, success });
  return success;
}

/**
 * 캐시 이벤트 리스너 설정
 */
cache.on('set', (key, value) => {
  visionLogger.debug('Cache item set', { key, valueLength: typeof value === 'string' ? value.length : 0 });
});

cache.on('del', (key, value) => {
  visionLogger.debug('Cache item deleted', { key });
});

cache.on('expired', (key, value) => {
  visionLogger.debug('Cache item expired', { key });
});

cache.on('flush', () => {
  visionLogger.info('Cache flushed');
});

/**
 * 메모리 사용량을 모니터링하고 필요시 정리합니다.
 */
function checkMemoryUsage(): void {
  const memUsage = process.memoryUsage();
  const heapUsed = memUsage.heapUsed;
  
  if (heapUsed > MEMORY_LIMITS.cleanupThreshold) {
    visionLogger.warn('Memory usage high, performing cache cleanup', {
      heapUsed: Math.round(heapUsed / 1024 / 1024),
      threshold: Math.round(MEMORY_LIMITS.cleanupThreshold / 1024 / 1024),
      action: 'cache_cleanup'
    });
    
    // 캐시의 절반을 정리 (LRU 방식으로 오래된 항목들이 제거됨)
    const currentKeys = cache.keys();
    const keysToRemove = Math.floor(currentKeys.length / 2);
    
    for (let i = 0; i < keysToRemove && i < currentKeys.length; i++) {
      cache.del(currentKeys[i]);
      cacheStats.evictions++;
    }
    
    visionLogger.info('Cache cleanup completed', {
      removedKeys: keysToRemove,
      remainingKeys: cache.keys().length,
      newHeapUsage: Math.round(process.memoryUsage().heapUsed / 1024 / 1024)
    });
  } else if (heapUsed > MEMORY_LIMITS.warningThreshold) {
    cacheStats.memoryWarnings++;
    visionLogger.warn('Memory usage approaching limit', {
      heapUsed: Math.round(heapUsed / 1024 / 1024),
      warningThreshold: Math.round(MEMORY_LIMITS.warningThreshold / 1024 / 1024),
      cacheKeys: cache.keys().length
    });
  }
}

/**
 * 메모리 사용량 통계를 반환합니다.
 */
export function getMemoryStats() {
  const memUsage = process.memoryUsage();
  return {
    heapUsed: memUsage.heapUsed,
    heapTotal: memUsage.heapTotal,
    external: memUsage.external,
    rss: memUsage.rss,
    heapUsedMB: Math.round(memUsage.heapUsed / 1024 / 1024),
    heapTotalMB: Math.round(memUsage.heapTotal / 1024 / 1024),
    limits: MEMORY_LIMITS,
    withinLimits: memUsage.heapUsed < MEMORY_LIMITS.maxHeapUsage
  };
}

/**
 * 캐시를 강제로 정리합니다 (메모리 절약).
 */
export function forceCleanup(percentage: number = 50): number {
  const currentKeys = cache.keys();
  const keysToRemove = Math.floor(currentKeys.length * (percentage / 100));
  
  for (let i = 0; i < keysToRemove && i < currentKeys.length; i++) {
    cache.del(currentKeys[i]);
    cacheStats.evictions++;
  }
  
  visionLogger.info('Forced cache cleanup', {
    removedKeys: keysToRemove,
    remainingKeys: cache.keys().length,
    percentage
  });
  
  return keysToRemove;
}

// 캐시 상태 주기적 로깅 및 메모리 모니터링 (개발/프로덕션 환경에서만)
if (process.env.NODE_ENV !== 'test') {
  setInterval(() => {
    const stats = getCacheStats();
    const memStats = getMemoryStats();
    
    if (stats.hits + stats.misses > 0) {
      const hitRate = ((stats.hits / (stats.hits + stats.misses)) * 100).toFixed(2);
      visionLogger.info('Cache statistics', {
        ...stats,
        hitRate: `${hitRate}%`,
        memoryUsageMB: memStats.heapUsedMB,
        withinMemoryLimits: memStats.withinLimits
      });
    }
    
    // 메모리 사용량 체크
    checkMemoryUsage();
    
  }, 300000); // 5분마다
}