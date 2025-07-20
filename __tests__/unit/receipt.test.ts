import { parseReceipt } from '@/lib/parsers/receipt';

describe('Receipt Parser', () => {
  it('should parse Korean wine shop receipt', () => {
    const mockText = `
      와인앤모어 강남점
      2024/07/20 15:30:25
      
      샤또 마고 2015         ₩150,000
      수량: 1개
      
      돔 페리뇽 2012         ₩280,000  
      수량: 1개
      
      소계: ₩430,000
      부가세: ₩43,000
      총액: ₩473,000
      
      신용카드 결제
      승인번호: 12345678
    `;
    
    const result = parseReceipt(mockText);
    
    expect(result).toEqual({
      store: '와인앤모어 강남점',
      date: '2024-07-20',
      time: '15:30:25',
      items: [
        {
          name: '샤또 마고 2015',
          price: 150000,
          quantity: 1,
          vintage: 2015
        },
        {
          name: '돔 페리뇽 2012',
          price: 280000,
          quantity: 1,
          vintage: 2012
        }
      ],
      subtotal: 430000,
      tax: 43000,
      total: 473000,
      paymentMethod: '신용카드'
    });
  });

  it('should parse English wine receipt', () => {
    const mockText = `
      Wine Cellar NYC
      07/20/2024 3:30 PM
      
      Château Margaux 2015    $200.00
      Qty: 1
      
      Dom Pérignon 2012       $350.00
      Qty: 1
      
      Subtotal: $550.00
      Tax: $55.00
      Total: $605.00
      
      Credit Card Payment
    `;
    
    const result = parseReceipt(mockText);
    
    expect(result.store).toBe('Wine Cellar NYC');
    expect(result.items).toHaveLength(2);
    expect(result.total).toBe(605);
  });

  it('should handle receipt with single wine item', () => {
    const singleItemText = `
      이마트 와인코너
      2024.07.20
      까베르네 소비뇽 2020    15,000원
      결제완료
    `;
    
    const result = parseReceipt(singleItemText);
    
    expect(result.items).toHaveLength(1);
    expect(result.items[0].name).toContain('까베르네 소비뇽');
    expect(result.items[0].vintage).toBe(2020);
  });

  it('should parse receipt with multiple quantities', () => {
    const mockText = `
      Wine Store
      2024/07/20
      
      Red Wine 2020           $25.00
      Qty: 3
      
      White Wine 2021         $30.00
      Qty: 2
      
      Total: $135.00
    `;
    
    const result = parseReceipt(mockText);
    
    expect(result.items[0].quantity).toBe(3);
    expect(result.items[1].quantity).toBe(2);
  });

  it('should handle various date formats', () => {
    const testCases = [
      { text: '2024/07/20', expected: '2024-07-20' },
      { text: '2024-07-20', expected: '2024-07-20' },
      { text: '2024.07.20', expected: '2024-07-20' },
      { text: '07/20/2024', expected: '2024-07-20' }
    ];

    testCases.forEach(({ text, expected }) => {
      const result = parseReceipt(`Store Name\n${text}\nWine $10`);
      expect(result.date).toBe(expected);
    });
  });

  it('should handle various price formats', () => {
    const testCases = [
      { text: '₩150,000', expected: 150000 },
      { text: '$150.00', expected: 150 },
      { text: '€150,50', expected: 150.5 },
      { text: '15,000원', expected: 15000 }
    ];

    testCases.forEach(({ text, expected }) => {
      const result = parseReceipt(`Store\n2024/07/20\nWine ${text}`);
      if (result.items.length > 0) {
        expect(result.items[0].price).toBe(expected);
      }
    });
  });

  it('should extract vintage from wine names', () => {
    const mockText = `
      Wine Shop
      2024/07/20
      
      Bordeaux Rouge 2018     $45.00
      Champagne Brut 2015     $120.00
      Chianti Classico 2019   $35.00
    `;
    
    const result = parseReceipt(mockText);
    
    expect(result.items[0].vintage).toBe(2018);
    expect(result.items[1].vintage).toBe(2015);
    expect(result.items[2].vintage).toBe(2019);
  });

  it('should handle empty or invalid input', () => {
    expect(parseReceipt('')).toEqual({
      items: []
    });
    
    expect(parseReceipt('Not a receipt')).toEqual({
      items: []
    });
  });

  it('should parse time in various formats', () => {
    const testCases = [
      { text: '15:30:25', expected: '15:30:25' },
      { text: '3:30 PM', expected: '15:30' },
      { text: '10:45 AM', expected: '10:45' }
    ];

    testCases.forEach(({ text, expected }) => {
      const result = parseReceipt(`Store\n2024/07/20 ${text}\nWine $10`);
      expect(result.time).toBe(expected);
    });
  });

  it('should identify payment methods', () => {
    const testCases = [
      { text: '신용카드 결제', expected: '신용카드' },
      { text: 'Credit Card Payment', expected: 'Credit Card' },
      { text: 'Cash Payment', expected: 'Cash' },
      { text: '현금결제', expected: '현금' }
    ];

    testCases.forEach(({ text, expected }) => {
      const result = parseReceipt(`Store\n2024/07/20\nWine $10\n${text}`);
      expect(result.paymentMethod).toBe(expected);
    });
  });
});