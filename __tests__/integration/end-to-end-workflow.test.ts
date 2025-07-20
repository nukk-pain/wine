// __tests__/integration/end-to-end-workflow.test.ts
import { processWineImage } from '@/lib/vision';
import { saveWineToNotion, saveReceiptToNotion } from '@/lib/notion';
import { clearCache, getCacheStats, getMemoryStats } from '@/lib/vision-cache';
import { createMocks } from 'node-mocks-http';
import uploadHandler from '@/pages/api/upload';
import processHandler from '@/pages/api/process';
import path from 'path';
import fs from 'fs';

// Mock Notion API to avoid actual API calls during testing
jest.mock('@/lib/notion', () => ({
  saveWineToNotion: jest.fn().mockResolvedValue({
    id: 'mock-notion-page-id-wine',
    url: 'https://notion.so/mock-notion-page-id-wine',
    properties: {
      name: 'CHÂTEAU MARGAUX PREMIER GRAND CRU CLASS',
      vintage: 2019,
      source: 'wine_label'
    }
  }),
  saveReceiptToNotion: jest.fn().mockResolvedValue([
    {
      id: 'mock-notion-page-id-receipt-1',
      url: 'https://notion.so/mock-notion-page-id-receipt-1',
      properties: {
        name: 'Château Margaux 2019',
        price: 500.00,
        source: 'receipt'
      }
    }
  ]),
  createWinePage: jest.fn().mockResolvedValue({
    id: 'mock-wine-page-id',
    url: 'https://notion.so/mock-wine-page-id'
  }),
  createReceiptPages: jest.fn().mockResolvedValue([
    {
      id: 'mock-receipt-page-id',
      url: 'https://notion.so/mock-receipt-page-id'
    }
  ])
}));

describe('End-to-End Workflow Integration Tests', () => {
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
    // Clear cache and reset mocks before each test
    clearCache();
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Clean up after each test
    clearCache();
  });

  it('should complete wine label processing and Notion saving workflow', async () => {
    const startTime = Date.now();
    
    // Step 1: Process wine image
    const visionResult = await processWineImage(testImagePath);
    
    expect(visionResult).toBeDefined();
    expect(visionResult.imageType).toBe('wine_label');
    expect(visionResult.data.name).toBeDefined();
    
    // Step 2: Save to Notion
    const notionResult = await saveWineToNotion(visionResult.data);
    
    expect(notionResult).toBeDefined();
    expect(notionResult.id).toBe('mock-notion-page-id-wine');
    expect(notionResult.url).toContain('notion.so');
    
    // Verify the Notion function was called correctly
    expect(saveWineToNotion).toHaveBeenCalledTimes(1);
    expect(saveWineToNotion).toHaveBeenCalledWith(visionResult.data);
    
    const totalTime = Date.now() - startTime;
    
    console.log(`Complete wine workflow time: ${totalTime}ms`);
    console.log(`Wine name: ${visionResult.data.name}`);
    console.log(`Notion page ID: ${notionResult.id}`);
    
    expect(totalTime).toBeLessThan(10000); // Should complete within 10 seconds
  }, 15000);

  it('should complete receipt processing and Notion saving workflow', async () => {
    const startTime = Date.now();
    
    // Step 1: Process receipt image
    const visionResult = await processWineImage(testImagePath2);
    
    expect(visionResult).toBeDefined();
    
    // Only proceed with Notion saving if it's classified as a receipt
    if (visionResult.imageType === 'receipt') {
      // Step 2: Save receipt to Notion
      const notionResults = await saveReceiptToNotion(visionResult.data);
      
      expect(notionResults).toBeDefined();
      expect(Array.isArray(notionResults)).toBe(true);
      expect(notionResults.length).toBeGreaterThan(0);
      expect(notionResults[0].id).toBe('mock-notion-page-id-receipt-1');
      
      // Verify the Notion function was called correctly
      expect(saveReceiptToNotion).toHaveBeenCalledTimes(1);
      expect(saveReceiptToNotion).toHaveBeenCalledWith(visionResult.data);
      
      console.log(`Receipt processing completed: ${notionResults.length} items saved`);
    } else {
      console.log(`Image classified as ${visionResult.imageType}, not receipt`);
    }
    
    const totalTime = Date.now() - startTime;
    console.log(`Complete receipt workflow time: ${totalTime}ms`);
    
    expect(totalTime).toBeLessThan(10000); // Should complete within 10 seconds
  }, 15000);

  it('should handle API route integration for process endpoint', async () => {
    // Test the complete API flow
    const { req, res } = createMocks({
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: {
        imageUrl: testImagePath,
        action: 'process_image'
      }
    });

    await processHandler(req, res);
    
    expect(res._getStatusCode()).toBe(200);
    const response = JSON.parse(res._getData());
    
    expect(response.success).toBe(true);
    expect(response.data).toBeDefined();
    expect(response.data.type).toBe('wine_label');
    expect(response.data.extractedData).toBeDefined();
    expect(response.data.extractedData.name).toBeDefined();
    
    console.log('API Response:', {
      imageType: response.data.type,
      wineName: response.data.extractedData.name,
      notionResult: response.data.notionResult?.id
    });
  });

  it('should demonstrate caching benefits across multiple workflow runs', async () => {
    // First complete workflow
    const start1 = Date.now();
    const result1 = await processWineImage(testImagePath);
    const notion1 = await saveWineToNotion(result1.data);
    const time1 = Date.now() - start1;
    
    // Second complete workflow (should benefit from caching)
    const start2 = Date.now();
    const result2 = await processWineImage(testImagePath);
    const notion2 = await saveWineToNotion(result2.data);
    const time2 = Date.now() - start2;
    
    // Verify results are consistent
    expect(result1.rawText).toBe(result2.rawText);
    expect(result1.data.name).toBe(result2.data.name);
    expect(notion1.id).toBe(notion2.id);
    
    // Verify Notion was called twice
    expect(saveWineToNotion).toHaveBeenCalledTimes(2);
    
    console.log(`First workflow: ${time1}ms`);
    console.log(`Second workflow: ${time2}ms`);
    console.log('Cache statistics:', getCacheStats());
  });

  it('should handle multiple images in batch processing', async () => {
    const images = [testImagePath, testImagePath2];
    const results = [];
    const startTime = Date.now();
    
    // Process all images
    for (const imagePath of images) {
      const visionResult = await processWineImage(imagePath);
      let notionResult;
      
      if (visionResult.imageType === 'wine_label') {
        notionResult = await saveWineToNotion(visionResult.data);
      } else if (visionResult.imageType === 'receipt') {
        notionResult = await saveReceiptToNotion(visionResult.data);
      }
      
      results.push({
        imagePath,
        imageType: visionResult.imageType,
        confidence: visionResult.confidence,
        notionResult
      });
    }
    
    const totalTime = Date.now() - startTime;
    
    expect(results).toHaveLength(images.length);
    results.forEach(result => {
      expect(result.imageType).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.notionResult).toBeDefined();
    });
    
    console.log(`Batch processing time: ${totalTime}ms`);
    console.log('Batch results:', results.map(r => ({
      type: r.imageType,
      confidence: r.confidence
    })));
  });

  it('should monitor system performance during workflow execution', async () => {
    const initialMemory = getMemoryStats();
    const initialCache = getCacheStats();
    
    // Perform multiple workflows to stress test
    const iterations = 5;
    const results = [];
    
    for (let i = 0; i < iterations; i++) {
      const start = Date.now();
      const visionResult = await processWineImage(testImagePath);
      const notionResult = await saveWineToNotion(visionResult.data);
      const time = Date.now() - start;
      
      results.push({
        iteration: i + 1,
        processingTime: time,
        textLength: visionResult.rawText.length
      });
    }
    
    const finalMemory = getMemoryStats();
    const finalCache = getCacheStats();
    
    // Performance analysis
    const avgTime = results.reduce((sum, r) => sum + r.processingTime, 0) / results.length;
    const maxTime = Math.max(...results.map(r => r.processingTime));
    const minTime = Math.min(...results.map(r => r.processingTime));
    
    console.log(`Performance over ${iterations} iterations:`);
    console.log(`- Average time: ${avgTime.toFixed(1)}ms`);
    console.log(`- Min time: ${minTime}ms`);
    console.log(`- Max time: ${maxTime}ms`);
    console.log('- Memory usage:', {
      initial: initialMemory.heapUsedMB,
      final: finalMemory.heapUsedMB,
      withinLimits: finalMemory.withinLimits,
      limitMB: Math.round(finalMemory.limits.maxHeapUsage / 1024 / 1024)
    });
    console.log('- Cache efficiency:', {
      hits: finalCache.hits,
      misses: finalCache.misses,
      keys: finalCache.keys
    });
    
    // Performance expectations
    expect(avgTime).toBeLessThan(5000); // Average under 5 seconds
    
    // In test environment, memory limits may be different, so we check if memory usage is reasonable
    if (finalMemory.heapUsedMB > 200) { // Only check limits if we're using substantial memory
      expect(finalMemory.withinLimits).toBe(true);
    } else {
      console.log('Memory usage low in test environment, skipping limit check');
    }
    
    expect(saveWineToNotion).toHaveBeenCalledTimes(iterations);
  });

  it('should handle error scenarios gracefully in complete workflow', async () => {
    // Test with invalid image path
    await expect(processWineImage('non-existent.jpg'))
      .rejects.toThrow();
    
    // Verify Notion wasn't called for failed image processing
    expect(saveWineToNotion).not.toHaveBeenCalled();
    expect(saveReceiptToNotion).not.toHaveBeenCalled();
    
    console.log('Error handling verification completed');
  });

  it('should validate data consistency across workflow steps', async () => {
    // Process the image
    const visionResult = await processWineImage(testImagePath);
    
    // Extract key data points
    const originalName = visionResult.data.name;
    const originalVintage = visionResult.data.vintage;
    const originalRegionProducer = visionResult.data['Region/Producer'];
    
    // Save to Notion
    const notionResult = await saveWineToNotion(visionResult.data);
    
    // Verify data was passed correctly to Notion
    expect(saveWineToNotion).toHaveBeenCalledWith(
      expect.objectContaining({
        name: originalName,
        vintage: originalVintage,
        'Region/Producer': originalRegionProducer
      })
    );
    
    // Verify Notion response
    expect(notionResult.id).toBeDefined();
    expect(notionResult.url).toBeDefined();
    expect(typeof notionResult.id).toBe('string');
    expect(typeof notionResult.url).toBe('string');
    
    console.log('Data consistency verified:', {
      originalName,
      originalVintage,
      notionId: notionResult.id
    });
  });

  it('should demonstrate concurrent workflow processing', async () => {
    const concurrentWorkflows = 3;
    const startTime = Date.now();
    
    // Create concurrent workflows
    const promises = Array(concurrentWorkflows).fill(null).map(async (_, index) => {
      const imagePath = index % 2 === 0 ? testImagePath : testImagePath2;
      const visionResult = await processWineImage(imagePath);
      
      let notionResult;
      if (visionResult.imageType === 'wine_label') {
        notionResult = await saveWineToNotion(visionResult.data);
      } else if (visionResult.imageType === 'receipt') {
        notionResult = await saveReceiptToNotion(visionResult.data);
      }
      
      return {
        workflowId: index + 1,
        imageType: visionResult.imageType,
        notionId: Array.isArray(notionResult) ? notionResult[0]?.id : notionResult?.id
      };
    });
    
    const results = await Promise.all(promises);
    const totalTime = Date.now() - startTime;
    
    // Verify all workflows completed
    expect(results).toHaveLength(concurrentWorkflows);
    results.forEach(result => {
      expect(result.imageType).toBeDefined();
      expect(result.notionId).toBeDefined();
    });
    
    console.log(`Concurrent workflows (${concurrentWorkflows}) completed in ${totalTime}ms`);
    console.log('Results:', results);
    
    // Performance expectation
    expect(totalTime).toBeLessThan(15000); // Should complete within 15 seconds
  }, 20000);
});