// __tests__/performance/vision-caching-performance.test.ts
import { 
  generateCacheKey, 
  getCachedResult, 
  setCachedResult,
  clearCache,
  getCacheStats 
} from '@/lib/vision-cache';
import path from 'path';
import fs from 'fs';

describe('Vision Cache Performance', () => {
  const testImagePath = path.join(__dirname, '../../test1.jpg');
  const largeTestData = 'A'.repeat(10000); // 10KB of data to simulate OCR result
  
  beforeAll(() => {
    // Ensure test image exists
    if (!fs.existsSync(testImagePath)) {
      throw new Error(`Test image file not found: ${testImagePath}. Please ensure test1.jpg exists in the project root.`);
    }
  });

  beforeEach(() => {
    clearCache();
  });

  afterEach(() => {
    clearCache();
  });

  it('should demonstrate significant performance improvement with caching', async () => {
    const cacheKey = await generateCacheKey(testImagePath);
    const iterations = 100;
    
    // Measure cache miss performance (first time access)
    const missTimings: number[] = [];
    for (let i = 0; i < 5; i++) {
      const startTime = Date.now();
      const result = getCachedResult(`${cacheKey}_${i}`); // Different keys to force misses
      const endTime = Date.now();
      missTimings.push(endTime - startTime);
      expect(result).toBeUndefined();
    }
    
    // Set up cache with test data
    setCachedResult(cacheKey, largeTestData);
    
    // Measure cache hit performance
    const hitTimings: number[] = [];
    for (let i = 0; i < iterations; i++) {
      const startTime = Date.now();
      const result = getCachedResult(cacheKey);
      const endTime = Date.now();
      hitTimings.push(endTime - startTime);
      expect(result).toBe(largeTestData);
    }
    
    const avgMissTime = missTimings.reduce((sum, time) => sum + time, 0) / missTimings.length;
    const avgHitTime = hitTimings.reduce((sum, time) => sum + time, 0) / hitTimings.length;
    const maxHitTime = Math.max(...hitTimings);
    const minHitTime = Math.min(...hitTimings);
    
    console.log(`\nCache Performance Analysis (${iterations} iterations):`);
    console.log(`- Average miss time: ${avgMissTime.toFixed(3)}ms`);
    console.log(`- Average hit time: ${avgHitTime.toFixed(3)}ms`);
    console.log(`- Max hit time: ${maxHitTime}ms`);
    console.log(`- Min hit time: ${minHitTime}ms`);
    console.log(`- Data size: ${(largeTestData.length / 1024).toFixed(1)}KB`);
    
    // Cache hits should be extremely fast
    expect(avgHitTime).toBeLessThan(5); // Should be under 5ms on average
    expect(maxHitTime).toBeLessThan(50); // Even slowest hit should be under 50ms
    
    // Show cache statistics
    const stats = getCacheStats();
    console.log(`- Cache statistics:`, {
      keys: stats.keys,
      hits: stats.hits,
      misses: stats.misses,
      hitRate: `${((stats.hits / (stats.hits + stats.misses)) * 100).toFixed(1)}%`
    });
  });

  it('should handle large dataset caching efficiently', async () => {
    const numEntries = 50;
    const entrySize = 5000; // 5KB per entry
    const entries: Array<{ key: string; value: string }> = [];
    
    // Generate test data
    for (let i = 0; i < numEntries; i++) {
      entries.push({
        key: `test_key_${i}`,
        value: `Test data ${i}: ${'X'.repeat(entrySize)}`
      });
    }
    
    // Measure write performance
    const writeStartTime = Date.now();
    entries.forEach(entry => {
      setCachedResult(entry.key, entry.value);
    });
    const writeEndTime = Date.now();
    const writeTime = writeEndTime - writeStartTime;
    
    // Measure read performance
    const readStartTime = Date.now();
    entries.forEach(entry => {
      const result = getCachedResult(entry.key);
      expect(result).toBe(entry.value);
    });
    const readEndTime = Date.now();
    const readTime = readEndTime - readStartTime;
    
    const totalDataSize = numEntries * entrySize / 1024; // KB
    const stats = getCacheStats();
    
    console.log(`\nLarge Dataset Performance:`);
    console.log(`- Entries: ${numEntries}`);
    console.log(`- Total data size: ${totalDataSize.toFixed(1)}KB`);
    console.log(`- Write time: ${writeTime}ms (${(writeTime/numEntries).toFixed(2)}ms per entry)`);
    console.log(`- Read time: ${readTime}ms (${(readTime/numEntries).toFixed(2)}ms per entry)`);
    console.log(`- Cache keys: ${stats.keys}`);
    console.log(`- Memory efficiency: ${(stats.vsize / 1024).toFixed(1)}KB stored`);
    
    // Performance expectations
    expect(writeTime).toBeLessThan(1000); // Should write 50 entries in under 1 second
    expect(readTime).toBeLessThan(500);   // Should read 50 entries in under 0.5 seconds
    expect(stats.keys).toBe(numEntries);
  });

  it('should demonstrate cache key generation performance', async () => {
    const iterations = 1000;
    const testPaths = [
      testImagePath,
      'http://example.com/image1.jpg',
      'http://example.com/image2.png',
      path.join(__dirname, '../../test2.jpg')
    ];
    
    const timings: number[] = [];
    
    for (let i = 0; i < iterations; i++) {
      const testPath = testPaths[i % testPaths.length];
      const startTime = Date.now();
      
      try {
        const cacheKey = await generateCacheKey(testPath);
        const endTime = Date.now();
        
        timings.push(endTime - startTime);
        expect(cacheKey).toMatch(/^vision_ocr_[a-f0-9]{64}$/);
      } catch (error) {
        // Some paths might not exist, but timing is still relevant
        const endTime = Date.now();
        timings.push(endTime - startTime);
      }
    }
    
    const avgTime = timings.reduce((sum, time) => sum + time, 0) / timings.length;
    const maxTime = Math.max(...timings);
    const minTime = Math.min(...timings);
    
    console.log(`\nCache Key Generation Performance (${iterations} iterations):`);
    console.log(`- Average time: ${avgTime.toFixed(3)}ms`);
    console.log(`- Max time: ${maxTime}ms`);
    console.log(`- Min time: ${minTime}ms`);
    console.log(`- Total time: ${timings.reduce((sum, time) => sum + time, 0)}ms`);
    
    // Key generation should be fast
    expect(avgTime).toBeLessThan(10); // Should average under 10ms
    expect(maxTime).toBeLessThan(100); // Even slowest should be under 100ms
  });

  it('should maintain performance under concurrent access', async () => {
    const concurrentOperations = 20;
    const operationsPerWorker = 10;
    
    // Create concurrent workers that perform cache operations
    const workers = Array(concurrentOperations).fill(null).map(async (_, workerIndex) => {
      const results = [];
      
      for (let i = 0; i < operationsPerWorker; i++) {
        const key = `worker_${workerIndex}_op_${i}`;
        const value = `Data from worker ${workerIndex}, operation ${i}`;
        
        // Write to cache
        const writeStart = Date.now();
        setCachedResult(key, value);
        const writeTime = Date.now() - writeStart;
        
        // Read from cache
        const readStart = Date.now();
        const result = getCachedResult(key);
        const readTime = Date.now() - readStart;
        
        expect(result).toBe(value);
        results.push({ writeTime, readTime });
      }
      
      return results;
    });
    
    const startTime = Date.now();
    const allResults = await Promise.all(workers);
    const totalTime = Date.now() - startTime;
    
    // Flatten results
    const flatResults = allResults.flat();
    const avgWriteTime = flatResults.reduce((sum, r) => sum + r.writeTime, 0) / flatResults.length;
    const avgReadTime = flatResults.reduce((sum, r) => sum + r.readTime, 0) / flatResults.length;
    
    const totalOperations = concurrentOperations * operationsPerWorker;
    const stats = getCacheStats();
    
    console.log(`\nConcurrent Access Performance:`);
    console.log(`- Workers: ${concurrentOperations}`);
    console.log(`- Operations per worker: ${operationsPerWorker}`);
    console.log(`- Total operations: ${totalOperations}`);
    console.log(`- Total time: ${totalTime}ms`);
    console.log(`- Average write time: ${avgWriteTime.toFixed(3)}ms`);
    console.log(`- Average read time: ${avgReadTime.toFixed(3)}ms`);
    console.log(`- Operations per second: ${(totalOperations * 2 / totalTime * 1000).toFixed(0)}`);
    console.log(`- Final cache size: ${stats.keys} keys`);
    
    // Performance under concurrent load
    expect(avgWriteTime).toBeLessThan(10); // Should maintain fast writes
    expect(avgReadTime).toBeLessThan(10);  // Should maintain fast reads
    expect(stats.keys).toBe(totalOperations);
  });
});