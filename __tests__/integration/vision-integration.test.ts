// __tests__/integration/vision-integration.test.ts
import { processWineImage } from '@/lib/vision';

describe('Vision Integration', () => {
  it('should process wine label and return structured data', async () => {
    const mockImageUrl = 'https://example.com/wine-label.jpg';
    
    const result = await processWineImage(mockImageUrl);
    
    expect(result).toEqual({
      imageType: 'wine_label',
      confidence: expect.any(Number),
      data: expect.objectContaining({
        name: expect.any(String),
        vintage: expect.any(Number),
      }),
      rawText: expect.any(String)
    });
  });

  it('should process receipt and return multiple wine entries', async () => {
    const mockReceiptUrl = 'https://example.com/receipt.jpg';
    
    const result = await processWineImage(mockReceiptUrl);
    
    expect(result.imageType).toBe('receipt');
    expect(result.data.items).toBeInstanceOf(Array);
    expect(result.data.items.length).toBeGreaterThan(0);
  });

  it('should handle low-quality images gracefully', async () => {
    const blurryImageUrl = 'https://example.com/blurry.jpg';
    
    const result = await processWineImage(blurryImageUrl);
    
    expect(result.confidence).toBeLessThan(0.5);
    expect(result.data).toBeDefined();
  });
});