// __tests__/performance/vision-performance.test.ts
import { extractTextFromImage, processWineImage } from '@/lib/vision';
import path from 'path';
import fs from 'fs';

describe('Vision API Performance', () => {
  const testImagePath = path.join(__dirname, '../../test1.jpg');
  const testImagePath2 = path.join(__dirname, '../../test2.jpg');

  beforeAll(() => {
    // Ensure test images exist
    if (!fs.existsSync(testImagePath)) {
      throw new Error(`Test image file not found: ${testImagePath}. Please ensure test1.jpg exists in the project root.`);
    }
    if (!fs.existsSync(testImagePath2)) {
      throw new Error(`Test image file not found: ${testImagePath2}. Please ensure test2.jpg exists in the project root.`);
    }
  });

  it('should process image within reasonable time (< 5 seconds)', async () => {
    const startTime = Date.now();
    
    const result = await extractTextFromImage(testImagePath);
    
    const processingTime = Date.now() - startTime;
    
    expect(result).toBeDefined();
    expect(typeof result).toBe('string');
    expect(processingTime).toBeLessThan(5000); // 5초 이내
    
    console.log(`Image processing time: ${processingTime}ms`);
  }, 10000); // 10초 타임아웃

  it('should process multiple images efficiently', async () => {
    const images = [testImagePath, testImagePath2];
    const results = [];
    const startTime = Date.now();
    
    // Sequential processing
    for (const imagePath of images) {
      const result = await extractTextFromImage(imagePath);
      results.push(result);
    }
    
    const totalTime = Date.now() - startTime;
    const averageTime = totalTime / images.length;
    
    expect(results).toHaveLength(images.length);
    expect(averageTime).toBeLessThan(3000); // 평균 3초 이내
    
    console.log(`Total processing time for ${images.length} images: ${totalTime}ms`);
    console.log(`Average processing time per image: ${averageTime}ms`);
  }, 15000); // 15초 타임아웃

  it('should handle concurrent image processing', async () => {
    const images = [testImagePath, testImagePath2];
    const startTime = Date.now();
    
    // Concurrent processing
    const promises = images.map(imagePath => extractTextFromImage(imagePath));
    const results = await Promise.all(promises);
    
    const totalTime = Date.now() - startTime;
    
    expect(results).toHaveLength(images.length);
    results.forEach(result => {
      expect(typeof result).toBe('string');
    });
    
    console.log(`Concurrent processing time for ${images.length} images: ${totalTime}ms`);
  }, 10000); // 10초 타임아웃

  it('should process complete wine image workflow efficiently', async () => {
    const startTime = Date.now();
    
    const result = await processWineImage(testImagePath);
    
    const processingTime = Date.now() - startTime;
    
    expect(result).toBeDefined();
    expect(result.rawText).toBeDefined();
    expect(result.imageType).toBeDefined();
    expect(result.confidence).toBeDefined();
    expect(result.data).toBeDefined();
    expect(processingTime).toBeLessThan(6000); // 6초 이내 (분류 및 파싱 포함)
    
    console.log(`Complete workflow processing time: ${processingTime}ms`);
    console.log(`Image type: ${result.imageType}, Confidence: ${result.confidence}`);
  }, 12000); // 12초 타임아웃

  it('should demonstrate performance baseline for caching comparison', async () => {
    const measurements = [];
    const iterations = 3;
    
    // 같은 이미지를 여러 번 처리하여 기준 성능 측정
    for (let i = 0; i < iterations; i++) {
      const startTime = Date.now();
      await extractTextFromImage(testImagePath);
      const processingTime = Date.now() - startTime;
      measurements.push(processingTime);
    }
    
    const averageTime = measurements.reduce((sum, time) => sum + time, 0) / measurements.length;
    const minTime = Math.min(...measurements);
    const maxTime = Math.max(...measurements);
    
    console.log(`Performance baseline (${iterations} iterations):`);
    console.log(`- Average: ${averageTime}ms`);
    console.log(`- Min: ${minTime}ms`);
    console.log(`- Max: ${maxTime}ms`);
    console.log(`- All measurements: ${measurements.join(', ')}ms`);
    
    // 기준 성능 검증
    expect(averageTime).toBeLessThan(4000); // 평균 4초 이내
    expect(measurements).toHaveLength(iterations);
  }, 20000); // 20초 타임아웃

  it('should measure memory usage during processing', async () => {
    const initialMemory = process.memoryUsage();
    
    // 여러 이미지 처리
    const images = [testImagePath, testImagePath2];
    for (const imagePath of images) {
      await extractTextFromImage(imagePath);
    }
    
    const finalMemory = process.memoryUsage();
    const memoryIncrease = {
      heapUsed: finalMemory.heapUsed - initialMemory.heapUsed,
      heapTotal: finalMemory.heapTotal - initialMemory.heapTotal,
      rss: finalMemory.rss - initialMemory.rss
    };
    
    console.log('Memory usage increase:');
    console.log(`- Heap Used: ${(memoryIncrease.heapUsed / 1024 / 1024).toFixed(2)} MB`);
    console.log(`- Heap Total: ${(memoryIncrease.heapTotal / 1024 / 1024).toFixed(2)} MB`);
    console.log(`- RSS: ${(memoryIncrease.rss / 1024 / 1024).toFixed(2)} MB`);
    
    // 메모리 증가량이 합리적인 범위 내인지 확인 (100MB 미만)
    expect(memoryIncrease.heapUsed).toBeLessThan(100 * 1024 * 1024); // 100MB
  }, 15000); // 15초 타임아웃
});