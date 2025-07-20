// __tests__/unit/vision-memory-management.test.ts
import { 
  getMemoryStats,
  forceCleanup,
  clearCache,
  setCachedResult,
  getCachedResult,
  getCacheStats
} from '@/lib/vision-cache';

describe('Vision Cache Memory Management', () => {
  beforeEach(() => {
    clearCache();
  });

  afterEach(() => {
    clearCache();
  });

  it('should provide comprehensive memory statistics', () => {
    const memStats = getMemoryStats();
    
    expect(memStats).toHaveProperty('heapUsed');
    expect(memStats).toHaveProperty('heapTotal');
    expect(memStats).toHaveProperty('external');
    expect(memStats).toHaveProperty('rss');
    expect(memStats).toHaveProperty('heapUsedMB');
    expect(memStats).toHaveProperty('heapTotalMB');
    expect(memStats).toHaveProperty('limits');
    expect(memStats).toHaveProperty('withinLimits');
    
    expect(typeof memStats.heapUsed).toBe('number');
    expect(typeof memStats.heapUsedMB).toBe('number');
    expect(typeof memStats.withinLimits).toBe('boolean');
    
    expect(memStats.heapUsed).toBeGreaterThan(0);
    expect(memStats.heapUsedMB).toBeGreaterThan(0);
    
    console.log('Memory statistics:', {
      heapUsedMB: memStats.heapUsedMB,
      heapTotalMB: memStats.heapTotalMB,
      withinLimits: memStats.withinLimits
    });
  });

  it('should perform forced cleanup and remove specified percentage of cache', () => {
    // Add some test cache entries
    const numEntries = 20;
    for (let i = 0; i < numEntries; i++) {
      setCachedResult(`test_key_${i}`, `test_value_${i}`);
    }
    
    let stats = getCacheStats();
    expect(stats.keys).toBe(numEntries);
    
    // Force cleanup of 50% of entries
    const removedCount = forceCleanup(50);
    
    stats = getCacheStats();
    expect(removedCount).toBe(Math.floor(numEntries / 2));
    expect(stats.keys).toBe(numEntries - removedCount);
    expect(stats.evictions).toBe(removedCount);
    
    console.log(`Removed ${removedCount} entries, ${stats.keys} remaining`);
  });

  it('should perform forced cleanup with custom percentage', () => {
    // Add test cache entries
    const numEntries = 10;
    for (let i = 0; i < numEntries; i++) {
      setCachedResult(`test_key_${i}`, `test_value_${i}`);
    }
    
    // Force cleanup of 30% of entries
    const removedCount = forceCleanup(30);
    
    const stats = getCacheStats();
    const expectedRemoved = Math.floor(numEntries * 0.3);
    
    expect(removedCount).toBe(expectedRemoved);
    expect(stats.keys).toBe(numEntries - expectedRemoved);
    
    console.log(`30% cleanup: removed ${removedCount} entries`);
  });

  it('should handle cleanup when cache is empty', () => {
    // Ensure cache is empty
    clearCache();
    
    const stats = getCacheStats();
    expect(stats.keys).toBe(0);
    
    // Try to cleanup empty cache
    const removedCount = forceCleanup(50);
    
    expect(removedCount).toBe(0);
    expect(getCacheStats().keys).toBe(0);
  });

  it('should track eviction statistics correctly', () => {
    // Initial stats should show no evictions
    let stats = getCacheStats();
    expect(stats.evictions).toBe(0);
    
    // Add some entries and force cleanup
    for (let i = 0; i < 10; i++) {
      setCachedResult(`eviction_test_${i}`, `value_${i}`);
    }
    
    const removedCount = forceCleanup(40); // 40% cleanup
    
    stats = getCacheStats();
    expect(stats.evictions).toBe(removedCount);
    expect(stats.evictions).toBeGreaterThan(0);
    
    // Another cleanup should increase eviction count
    const secondCleanup = forceCleanup(50);
    stats = getCacheStats();
    expect(stats.evictions).toBe(removedCount + secondCleanup);
  });

  it('should maintain memory limits configuration', () => {
    const memStats = getMemoryStats();
    
    expect(memStats.limits).toHaveProperty('maxHeapUsage');
    expect(memStats.limits).toHaveProperty('warningThreshold');
    expect(memStats.limits).toHaveProperty('cleanupThreshold');
    
    // Verify limits are reasonable
    expect(memStats.limits.maxHeapUsage).toBe(100 * 1024 * 1024); // 100MB
    expect(memStats.limits.warningThreshold).toBe(80 * 1024 * 1024); // 80MB
    expect(memStats.limits.cleanupThreshold).toBe(90 * 1024 * 1024); // 90MB
    
    // Verify thresholds are in logical order
    expect(memStats.limits.warningThreshold).toBeLessThan(memStats.limits.cleanupThreshold);
    expect(memStats.limits.cleanupThreshold).toBeLessThan(memStats.limits.maxHeapUsage);
  });

  it('should calculate within limits correctly', () => {
    const memStats = getMemoryStats();
    
    // In most test environments, memory usage should be well within limits
    expect(memStats.withinLimits).toBe(true);
    expect(memStats.heapUsed).toBeLessThan(memStats.limits.maxHeapUsage);
    
    console.log('Memory status:', {
      currentUsageMB: memStats.heapUsedMB,
      limitMB: Math.round(memStats.limits.maxHeapUsage / 1024 / 1024),
      withinLimits: memStats.withinLimits
    });
  });

  it('should handle multiple cleanup operations efficiently', () => {
    // Add many entries
    const initialEntries = 100;
    for (let i = 0; i < initialEntries; i++) {
      setCachedResult(`bulk_test_${i}`, `data_${i}_${'x'.repeat(100)}`); // Some data per entry
    }
    
    let stats = getCacheStats();
    expect(stats.keys).toBe(initialEntries);
    
    // Perform multiple cleanups
    const cleanup1 = forceCleanup(25); // Remove 25%
    const cleanup2 = forceCleanup(25); // Remove 25% of remaining
    const cleanup3 = forceCleanup(50); // Remove 50% of remaining
    
    stats = getCacheStats();
    const totalEvictions = cleanup1 + cleanup2 + cleanup3;
    
    expect(stats.evictions).toBe(totalEvictions);
    expect(stats.keys).toBeLessThan(initialEntries);
    expect(stats.keys).toBeGreaterThanOrEqual(0);
    
    console.log('Multiple cleanup results:', {
      initialEntries,
      cleanup1,
      cleanup2,
      cleanup3,
      totalEvictions,
      remainingKeys: stats.keys
    });
  });
});