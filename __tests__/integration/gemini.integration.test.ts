// __tests__/integration/gemini.integration.test.ts
import { refineWineDataWithGemini } from '@/lib/gemini';

describe('Gemini Service Integration', () => {
  // API 호출 시간을 고려하여 타임아웃을 15초로 설정
  jest.setTimeout(15000); 

  beforeAll(() => {
    // Skip test if GEMINI_API_KEY is not set
    if (!process.env.GEMINI_API_KEY) {
      console.log('Skipping Gemini integration tests: GEMINI_API_KEY not set');
    }
  });

  it('should return a structured wine data object from real OCR text', async () => {
    if (!process.env.GEMINI_API_KEY) {
      console.log('Test skipped: GEMINI_API_KEY not set');
      return;
    }

    const ocrText = "CHÂTEAU MARGAUX\nPREMIER GRAND CRU CLASSÉ\nAPPELLATION MARGAUX CONTRÔLÉE\n2019";
    
    const result = await refineWineDataWithGemini(ocrText);

    // 최소한의 구조 검증
    expect(result).toBeDefined();
    expect(result.name.toUpperCase()).toContain('MARGAUX');
    expect(result.vintage).toBe(2019);
  });

  it('should handle invalid JSON response from Gemini gracefully', async () => {
    if (!process.env.GEMINI_API_KEY) {
      console.log('Test skipped: GEMINI_API_KEY not set');
      return;
    }

    // Test with OCR text that might cause parsing issues
    const problematicText = "<<<INVALID>>> {broken json} NOT_VALID_JSON";
    
    // This should throw an error due to invalid response
    await expect(refineWineDataWithGemini(problematicText))
      .rejects.toThrow();
  });

  it('should validate required fields in Gemini response', async () => {
    if (!process.env.GEMINI_API_KEY) {
      console.log('Test skipped: GEMINI_API_KEY not set');
      return;
    }

    // Test with minimal text that might result in incomplete data
    const minimalText = "WINE 2020";
    
    try {
      const result = await refineWineDataWithGemini(minimalText);
      // If it succeeds, verify required fields
      expect(result.name).toBeDefined();
      expect(typeof result.vintage).toBe('number');
    } catch (error) {
      // If it fails due to validation, that's also acceptable
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toContain('Invalid wine data structure');
    }
  });
});