// __tests__/unit/wine-processing.test.ts
import { processWineImage } from '@/lib/vision';

describe('Wine Processing Tests', () => {
  it('should process SOAVE FARINA wine label correctly', async () => {
    const result = await processWineImage('soave-wine-label.jpg');
    
    expect(result).toBeDefined();
    expect(result.imageType).toBe('wine_label');
    expect(result.data).toBeDefined();
    
    // Check wine-specific data structure
    expect(result.data.name).toBe('SOAVE');
    expect(result.data['Region/Producer']).toBe('FARINA');
    expect(result.data['Varietal(품종)']).toBe('GARGANEGA');
    
    console.log('✅ SOAVE wine processing test passed');
    console.log('Extracted data:', JSON.stringify(result.data, null, 2));
  });

  it('should process receipt correctly', async () => {
    const result = await processWineImage('receipt.jpg');
    
    expect(result).toBeDefined();
    expect(result.imageType).toBe('receipt');
    expect(result.data).toBeDefined();
    
    // Check receipt-specific data structure
    expect(result.data.store).toBeDefined();
    expect(result.data.items).toBeDefined();
    expect(Array.isArray(result.data.items)).toBe(true);
    expect(result.data.total).toBeDefined();
    
    console.log('✅ Receipt processing test passed');
    console.log('Extracted data:', JSON.stringify(result.data, null, 2));
  });

  it('should handle raw text extraction correctly', async () => {
    const result = await processWineImage('soave-wine-label.jpg');
    
    expect(result.rawText).toBeDefined();
    expect(result.rawText).toContain('SOAVE');
    expect(result.rawText).toContain('FARINA');
    expect(result.rawText).toContain('GARGANEGA');
    
    console.log('✅ Raw text extraction test passed');
  });
});