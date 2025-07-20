import { classifyImage, ImageType } from '@/lib/parsers/image-classifier';

describe('Image Classifier', () => {
  it('should classify wine label image', async () => {
    const mockWineLabelText = `
      Château Margaux
      2015
      Bordeaux
      Appellation Margaux Contrôlée
    `;
    
    const result = await classifyImage(mockWineLabelText);
    expect(result.type).toBe(ImageType.WINE_LABEL);
    expect(result.confidence).toBeGreaterThan(0.8);
  });

  it('should classify receipt image', async () => {
    const mockReceiptText = `
      Wine & More
      2024/07/20 15:30
      Château Margaux 2015    ₩150,000
      Qty: 1
      Total: ₩150,000
      Card Payment
    `;
    
    const result = await classifyImage(mockReceiptText);
    expect(result.type).toBe(ImageType.RECEIPT);
    expect(result.confidence).toBeGreaterThan(0.8);
  });

  it('should handle ambiguous images', async () => {
    const ambiguousText = 'Wine 2020';
    const result = await classifyImage(ambiguousText);
    expect(result.confidence).toBeLessThan(0.7);
  });

  it('should classify Korean wine label', async () => {
    const mockKoreanWineLabelText = `
      샤또 마고
      2015년산
      프랑스 보르도
      13.5도
      750ml
    `;
    
    const result = await classifyImage(mockKoreanWineLabelText);
    expect(result.type).toBe(ImageType.WINE_LABEL);
    expect(result.confidence).toBeGreaterThan(0.7);
  });

  it('should classify Korean receipt', async () => {
    const mockKoreanReceiptText = `
      와인앤모어 강남점
      2024/07/20 15:30:25
      샤또 마고 2015         ₩150,000
      수량: 1개
      소계: ₩150,000
      부가세: ₩15,000
      총액: ₩165,000
      신용카드 결제
    `;
    
    const result = await classifyImage(mockKoreanReceiptText);
    expect(result.type).toBe(ImageType.RECEIPT);
    expect(result.confidence).toBeGreaterThan(0.8);
  });

  it('should return unknown for non-wine related text', async () => {
    const unrelatedText = `
      How to cook pasta
      Recipe instructions
      Boil water for 10 minutes
    `;
    
    const result = await classifyImage(unrelatedText);
    expect(result.type).toBe(ImageType.UNKNOWN);
    expect(result.confidence).toBeLessThan(0.5);
  });

  it('should return indicators for classification', async () => {
    const wineText = `
      Château Margaux
      Appellation Bordeaux Contrôlée
      13.5% vol
    `;
    
    const result = await classifyImage(wineText);
    expect(result.indicators).toContain('château');
    expect(result.indicators).toContain('appellation');
  });
});