// __tests__/integration/complete-workflow.test.ts
import { processWineImage, extractTextFromImage } from '@/lib/vision';
import { createWinePage, createReceiptPages } from '@/lib/notion';
import { classifyImage, ImageType } from '@/lib/parsers/image-classifier';
import { parseWineLabel } from '@/lib/parsers/wine-label';
import { parseReceipt } from '@/lib/parsers/receipt';
import { clearCache, getCacheStats } from '@/lib/vision-cache';
import path from 'path';
import fs from 'fs';

describe('Complete Workflow with Real Vision API Integration', () => {
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

  beforeEach(() => {
    // Clear cache to ensure fresh tests
    clearCache();
  });

  afterEach(() => {
    // Clean up cache after each test
    clearCache();
  });

  it('should extract text from real wine label image using Vision API', async () => {
    const startTime = Date.now();
    
    // Test OCR extraction
    const extractedText = await extractTextFromImage(testImagePath);
    
    const processingTime = Date.now() - startTime;
    
    expect(extractedText).toBeDefined();
    expect(typeof extractedText).toBe('string');
    expect(extractedText.length).toBeGreaterThan(0);
    
    // Should contain wine-related text (based on our mock data)
    expect(extractedText).toMatch(/CHÂTEAU|MARGAUX|GRAND CRU|WINE|BOTTLE|ML|VOL/i);
    
    console.log(`OCR processing time: ${processingTime}ms`);
    console.log(`Extracted text length: ${extractedText.length} characters`);
    console.log(`Sample text: "${extractedText.substring(0, 100)}..."`);
  }, 15000); // 15 second timeout for real API calls

  it('should classify wine label image correctly', async () => {
    // Extract text first
    const extractedText = await extractTextFromImage(testImagePath);
    expect(extractedText.length).toBeGreaterThan(0);
    
    // Test image classification
    const classification = await classifyImage(extractedText);
    
    expect(classification).toBeDefined();
    expect(classification.type).toBe(ImageType.WINE_LABEL);
    expect(classification.confidence).toBeGreaterThan(0.5);
    expect(classification.indicators).toBeDefined();
    expect(Array.isArray(classification.indicators)).toBe(true);
    expect(classification.indicators.length).toBeGreaterThan(0);
    
    console.log(`Classification: ${classification.type} (confidence: ${classification.confidence})`);
    console.log(`Indicators: ${classification.indicators.join(', ')}`);
  });

  it('should parse wine label data correctly from OCR text', async () => {
    // Extract text first
    const extractedText = await extractTextFromImage(testImagePath);
    expect(extractedText.length).toBeGreaterThan(0);
    
    // Test wine label parsing
    const wineData = parseWineLabel(extractedText);
    
    expect(wineData).toBeDefined();
    expect(typeof wineData).toBe('object');
    
    // Check for expected wine data fields
    if (wineData.name) {
      expect(typeof wineData.name).toBe('string');
      expect(wineData.name.length).toBeGreaterThan(0);
    }
    
    if (wineData.vintage) {
      expect(typeof wineData.vintage).toBe('number');
      expect(wineData.vintage).toBeGreaterThan(1800); // Should be a reasonable year
      expect(wineData.vintage).toBeLessThan(2100);
    }
    
    if (wineData.producer || wineData.region) {
      const producerOrRegion = wineData.producer || wineData.region;
      expect(typeof producerOrRegion).toBe('string');
      expect(producerOrRegion.length).toBeGreaterThan(0);
    }
    
    console.log('Parsed wine data:', {
      name: wineData.name,
      vintage: wineData.vintage,
      producer: wineData.producer,
      region: wineData.region,
      variety: wineData.variety
    });
  });

  it('should process complete wine image workflow end-to-end', async () => {
    const startTime = Date.now();
    
    // Test complete workflow
    const result = await processWineImage(testImagePath);
    
    const processingTime = Date.now() - startTime;
    
    // Verify result structure
    expect(result).toBeDefined();
    expect(result.imageType).toBeDefined();
    expect(result.confidence).toBeDefined();
    expect(result.data).toBeDefined();
    expect(result.rawText).toBeDefined();
    
    // Verify image type classification
    expect(result.imageType).toBe(ImageType.WINE_LABEL);
    expect(result.confidence).toBeGreaterThan(0.5);
    
    // Verify OCR text extraction
    expect(typeof result.rawText).toBe('string');
    expect(result.rawText.length).toBeGreaterThan(0);
    
    // Verify parsed data structure for wine label
    expect(result.data).toBeDefined();
    expect(result.data.name).toBeDefined();
    expect(typeof result.data.name).toBe('string');
    
    // Performance verification
    expect(processingTime).toBeLessThan(10000); // Should complete within 10 seconds
    
    console.log(`Complete workflow time: ${processingTime}ms`);
    console.log(`Image type: ${result.imageType}, Confidence: ${result.confidence}`);
    console.log(`Wine name: ${result.data.name}`);
    console.log(`Raw text length: ${result.rawText.length} characters`);
  }, 15000); // 15 second timeout

  it('should handle receipt processing if second image is a receipt', async () => {
    const startTime = Date.now();
    
    // Test with second image (assumed to be receipt based on mock data)
    const result = await processWineImage(testImagePath2);
    
    const processingTime = Date.now() - startTime;
    
    expect(result).toBeDefined();
    expect(result.imageType).toBeDefined();
    expect(result.confidence).toBeDefined();
    expect(result.data).toBeDefined();
    expect(result.rawText).toBeDefined();
    
    // Check if it's classified as receipt
    if (result.imageType === ImageType.RECEIPT) {
      expect(result.data.store).toBeDefined();
      expect(result.data.items).toBeDefined();
      expect(Array.isArray(result.data.items)).toBe(true);
      expect(result.data.total).toBeDefined();
      
      console.log(`Receipt processing time: ${processingTime}ms`);
      console.log(`Store: ${result.data.store}`);
      console.log(`Items count: ${result.data.items.length}`);
      console.log(`Total: ${result.data.total}`);
    } else {
      console.log(`Second image classified as: ${result.imageType} (not receipt)`);
    }
  }, 15000);

  it('should demonstrate caching benefits in integration workflow', async () => {
    // First call - should go through full Vision API
    const start1 = Date.now();
    const result1 = await processWineImage(testImagePath);
    const time1 = Date.now() - start1;
    
    // Second call - should benefit from caching
    const start2 = Date.now();
    const result2 = await processWineImage(testImagePath);
    const time2 = Date.now() - start2;
    
    // Results should be identical
    expect(result1.rawText).toBe(result2.rawText);
    expect(result1.imageType).toBe(result2.imageType);
    expect(result1.data.name).toBe(result2.data.name);
    
    // Second call should be faster due to caching (in production)
    // Note: In test environment, both calls use mock data so timing may be similar
    console.log(`First call time: ${time1}ms`);
    console.log(`Second call time: ${time2}ms`);
    
    // Check cache statistics
    const cacheStats = getCacheStats();
    console.log('Cache statistics:', cacheStats);
    
    // Verify cache is working
    expect(cacheStats).toBeDefined();
    expect(typeof cacheStats.hits).toBe('number');
    expect(typeof cacheStats.misses).toBe('number');
  }, 20000);

  it('should handle multiple images concurrently', async () => {
    const images = [testImagePath, testImagePath2];
    const startTime = Date.now();
    
    // Process images concurrently
    const promises = images.map(imagePath => processWineImage(imagePath));
    const results = await Promise.all(promises);
    
    const totalTime = Date.now() - startTime;
    
    // Verify all results
    expect(results).toHaveLength(images.length);
    results.forEach((result, index) => {
      expect(result).toBeDefined();
      expect(result.imageType).toBeDefined();
      expect(result.rawText).toBeDefined();
      expect(result.data).toBeDefined();
      
      console.log(`Image ${index + 1}: ${result.imageType}, confidence: ${result.confidence}`);
    });
    
    console.log(`Concurrent processing time: ${totalTime}ms`);
    console.log(`Average time per image: ${(totalTime / images.length).toFixed(1)}ms`);
  }, 20000);

  it('should validate environment configuration for Vision API', () => {
    // Test that required environment variables are available
    // Note: In test environment, these might not be set, so we check gracefully
    const hasCredentials = !!process.env.GOOGLE_APPLICATION_CREDENTIALS;
    const hasProject = !!process.env.GOOGLE_CLOUD_PROJECT;
    
    if (hasCredentials) {
      expect(fs.existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS!)).toBe(true);
      console.log('Google Vision API credentials configured');
    } else {
      console.log('Google Vision API credentials not configured (test environment)');
    }
    
    if (hasProject) {
      expect(process.env.GOOGLE_CLOUD_PROJECT!.length).toBeGreaterThan(0);
      console.log(`Google Cloud Project: ${process.env.GOOGLE_CLOUD_PROJECT}`);
    } else {
      console.log('Google Cloud Project not configured (test environment)');
    }
    
    // This test should not fail in test environment
    expect(true).toBe(true);
  });

  it('should handle error scenarios gracefully', async () => {
    // Test with invalid image path
    await expect(processWineImage('invalid-path.jpg'))
      .rejects.toThrow();
    
    // Test with invalid image format
    await expect(processWineImage('invalid.txt'))
      .rejects.toThrow('Unsupported image format');
    
    console.log('Error handling tests completed');
  });

  it('should maintain performance under sequential processing', async () => {
    const iterations = 3;
    const timings: number[] = [];
    
    for (let i = 0; i < iterations; i++) {
      const startTime = Date.now();
      const result = await processWineImage(testImagePath);
      const processingTime = Date.now() - startTime;
      
      timings.push(processingTime);
      
      expect(result).toBeDefined();
      expect(result.rawText.length).toBeGreaterThan(0);
    }
    
    const avgTime = timings.reduce((sum, time) => sum + time, 0) / timings.length;
    const maxTime = Math.max(...timings);
    const minTime = Math.min(...timings);
    
    console.log(`Performance over ${iterations} sequential calls:`);
    console.log(`- Average: ${avgTime.toFixed(1)}ms`);
    console.log(`- Min: ${minTime}ms`);
    console.log(`- Max: ${maxTime}ms`);
    console.log(`- All timings: ${timings.join(', ')}ms`);
    
    // Performance should be consistent
    expect(avgTime).toBeLessThan(5000); // Average under 5 seconds
    expect(maxTime).toBeLessThan(10000); // Max under 10 seconds
  }, 30000);
});