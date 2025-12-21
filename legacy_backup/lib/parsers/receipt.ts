export interface ReceiptItem {
  name: string;
  price: number;
  quantity: number;
  vintage?: number;
}

export interface ReceiptData {
  store?: string;
  date?: string;
  time?: string;
  items: ReceiptItem[];
  subtotal?: number;
  tax?: number;
  total?: number;
  paymentMethod?: string;
}

export function parseReceipt(text: string): ReceiptData {
  if (!text || text.trim().length === 0) {
    return { items: [] };
  }

  // 영수증 관련 키워드가 없으면 빈 결과 반환
  const receiptKeywords = ['total', 'qty', 'payment', '총액', '수량', '결제', '₩', '$', '€'];
  const hasReceiptKeywords = receiptKeywords.some(keyword => 
    text.toLowerCase().includes(keyword.toLowerCase())
  );
  
  if (!hasReceiptKeywords && !extractDate(text)) {
    return { items: [] };
  }

  const lines = text.split('\n').map(line => line.trim()).filter(Boolean);

  return {
    store: extractStore(text, lines),
    date: extractDate(text),
    time: extractTime(text),
    items: extractItems(text, lines),
    subtotal: extractSubtotal(text),
    tax: extractTax(text),
    total: extractTotal(text),
    paymentMethod: extractPaymentMethod(text)
  };
}

function extractStore(text: string, lines: string[]): string | undefined {
  // 첫 번째 라인이 보통 상점명
  if (lines.length > 0) {
    const firstLine = lines[0];
    
    // 날짜나 가격이 아닌 경우 상점명으로 간주
    if (!/\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2}/.test(firstLine) &&
        !/[\₩\$\€\£]\s*\d/.test(firstLine) &&
        firstLine.length > 2) {
      return firstLine;
    }
  }

  // 상점 지표가 포함된 라인 찾기
  const storeIndicators = ['store', 'shop', 'mart', '점', '마트', '상점', 'wine', 'cellar'];
  for (const line of lines) {
    for (const indicator of storeIndicators) {
      if (line.toLowerCase().includes(indicator.toLowerCase())) {
        return line;
      }
    }
  }

  return undefined;
}

function extractDate(text: string): string | undefined {
  // 다양한 날짜 형식 패턴
  const datePatterns = [
    /(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/,  // YYYY/MM/DD, YYYY-MM-DD
    /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/,  // MM/DD/YYYY, DD/MM/YYYY
    /(\d{4})\.(\d{1,2})\.(\d{1,2})/           // YYYY.MM.DD
  ];

  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) {
      let year: string, month: string, day: string;
      
      if (match[1].length === 4) {
        // YYYY/MM/DD 형식
        [, year, month, day] = match;
      } else {
        // MM/DD/YYYY 또는 DD/MM/YYYY 형식
        [, month, day, year] = match;
        // 일반적으로 MM/DD/YYYY로 가정
      }
      
      // 정규화된 형식으로 반환 (YYYY-MM-DD)
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
  }

  return undefined;
}

function extractTime(text: string): string | undefined {
  // 시간 패턴들
  const timePatterns = [
    /(\d{1,2}):(\d{2}):(\d{2})/,              // HH:MM:SS
    /(\d{1,2}):(\d{2})\s*(AM|PM)/gi,          // HH:MM AM/PM
    /(\d{1,2}):(\d{2})/                       // HH:MM
  ];

  for (const pattern of timePatterns) {
    const match = text.match(pattern);
    if (match) {
      let hour = parseInt(match[1]);
      const minute = match[2];
      const second = match[3] || '';
      const ampm = match[3] && /^(AM|PM)$/i.test(match[3]) ? match[3] : match[4];

      // AM/PM 처리
      if (ampm) {
        if (ampm.toUpperCase() === 'PM' && hour !== 12) {
          hour += 12;
        } else if (ampm.toUpperCase() === 'AM' && hour === 12) {
          hour = 0;
        }
      }

      const hourStr = hour.toString().padStart(2, '0');
      return second ? `${hourStr}:${minute}:${second}` : `${hourStr}:${minute}`;
    }
  }

  return undefined;
}

function extractItems(text: string, lines: string[]): ReceiptItem[] {
  const items: ReceiptItem[] = [];
  const processedLines = new Set<number>();
  
  for (let i = 0; i < lines.length; i++) {
    if (processedLines.has(i)) continue;
    
    const line = lines[i];
    const nextLine = i + 1 < lines.length ? lines[i + 1] : '';
    
    // 제외할 라인들
    if (isExcludedLine(line)) {
      continue;
    }
    
    // 아이템 라인 패턴 매칭
    const item = parseReceiptLine(line, nextLine);
    if (item) {
      items.push(item);
      
      // 수량 정보가 다음 라인에 있는 경우 스킵
      if (nextLine && /^\s*(수량|qty|quantity):/gi.test(nextLine)) {
        processedLines.add(i + 1);
      }
    }
  }

  return items;
}

function isExcludedLine(line: string): boolean {
  const excludePatterns = [
    /^\s*$/,                          // 빈 라인
    /^\s*[-=*]+\s*$/,                // 구분선
    /^\s*매장|점포|상점/,            // 매장 정보
    /^\s*tel|phone|전화/gi,          // 전화번호
    /^\s*address|주소/gi,            // 주소
    /^\s*receipt|영수증/gi,          // 영수증 헤더
    /^\s*thank\s*you/gi,             // 감사 메시지
    /^\s*감사합니다/,                // 한국어 감사 메시지
    /^\s*승인번호|approval/gi,       // 승인번호
    /^\s*카드번호|card\s*no/gi,      // 카드번호
    /^\s*소계|subtotal/gi,           // 소계 (별도 처리)
    /^\s*부가세|tax|vat/gi,          // 세금 (별도 처리)
    /^\s*총액|total|합계/gi,         // 총액 (별도 처리)
    /^\s*결제|payment/gi,            // 결제 방법 (별도 처리)
  ];

  return excludePatterns.some(pattern => pattern.test(line));
}

function parseReceiptLine(line: string, nextLine: string): ReceiptItem | null {
  // 가격 패턴들
  const pricePatterns = [
    /[\₩]\s*([0-9,]+)/,           // ₩150,000
    /\$\s*([0-9,]+\.?\d*)/,       // $150.00
    /€\s*([0-9,]+\.?\d*)/,        // €150.50
    /([0-9,]+)원/,                // 15,000원
    /([0-9,]+\.?\d*)\s*$/         // 끝에 오는 숫자
  ];

  let price: number | undefined;
  let itemName: string | undefined;

  // 라인에서 가격 추출
  for (const pattern of pricePatterns) {
    const match = line.match(pattern);
    if (match) {
      const priceStr = match[1].replace(/,/g, '');
      price = parseFloat(priceStr);
      
      // 가격 부분을 제거하여 아이템명 추출
      itemName = line.replace(match[0], '').trim();
      break;
    }
  }

  if (!price || !itemName || itemName.length < 2) {
    return null;
  }

  // 수량 추출 (현재 라인 또는 다음 라인에서)
  let quantity = 1;
  const qtyText = `${line} ${nextLine}`;
  const qtyPatterns = [
    /수량:\s*(\d+)/,              // 수량: 1
    /qty:\s*(\d+)/gi,             // Qty: 1
    /quantity:\s*(\d+)/gi,        // Quantity: 1
    /(\d+)개/                     // 1개
  ];

  for (const pattern of qtyPatterns) {
    const match = qtyText.match(pattern);
    if (match) {
      quantity = parseInt(match[1]);
      break;
    }
  }

  // 빈티지 추출
  const vintage = extractVintageFromName(itemName);

  return {
    name: itemName,
    price,
    quantity,
    vintage
  };
}

function extractVintageFromName(name: string): number | undefined {
  // 이름에서 년도 추출 (1950-2030)
  const vintagePattern = /\b(19[5-9]\d|20[0-3]\d)\b/;
  const match = name.match(vintagePattern);
  
  if (match) {
    return parseInt(match[1]);
  }

  return undefined;
}

function extractSubtotal(text: string): number | undefined {
  const patterns = [
    /소계:\s*[\₩\$\€]?\s*([0-9,]+\.?\d*)/gi,
    /subtotal:\s*[\₩\$\€]?\s*([0-9,]+\.?\d*)/gi
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return parseFloat(match[1].replace(/,/g, ''));
    }
  }

  return undefined;
}

function extractTax(text: string): number | undefined {
  const patterns = [
    /부가세:\s*[\₩\$\€]?\s*([0-9,]+\.?\d*)/gi,
    /tax:\s*[\₩\$\€]?\s*([0-9,]+\.?\d*)/gi,
    /vat:\s*[\₩\$\€]?\s*([0-9,]+\.?\d*)/gi
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return parseFloat(match[1].replace(/,/g, ''));
    }
  }

  return undefined;
}

function extractTotal(text: string): number | undefined {
  const patterns = [
    /총액:\s*[\₩\$\€]?\s*([0-9,]+\.?\d*)/gi,
    /total:\s*[\₩\$\€]?\s*([0-9,]+\.?\d*)/gi,
    /합계:\s*[\₩\$\€]?\s*([0-9,]+\.?\d*)/gi
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return parseFloat(match[1].replace(/,/g, ''));
    }
  }

  return undefined;
}

function extractPaymentMethod(text: string): string | undefined {
  const paymentMethods = [
    { pattern: /신용카드\s*결제/gi, method: '신용카드' },
    { pattern: /credit\s*card/gi, method: 'Credit Card' },
    { pattern: /현금\s*결제/gi, method: '현금' },
    { pattern: /cash\s*payment/gi, method: 'Cash' },
    { pattern: /카드\s*결제/gi, method: '카드' },
    { pattern: /debit\s*card/gi, method: 'Debit Card' }
  ];

  for (const { pattern, method } of paymentMethods) {
    if (pattern.test(text)) {
      return method;
    }
  }

  return undefined;
}