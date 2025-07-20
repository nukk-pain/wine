export enum ImageType {
  WINE_LABEL = 'wine_label',
  RECEIPT = 'receipt',
  UNKNOWN = 'unknown'
}

export interface ClassificationResult {
  type: ImageType;
  confidence: number;
  indicators: string[];
}

export async function classifyImage(text: string): Promise<ClassificationResult> {
  if (!text || text.trim().length === 0) {
    return {
      type: ImageType.UNKNOWN,
      confidence: 0,
      indicators: []
    };
  }

  const normalizedText = text.toLowerCase().trim();
  
  const wineLabelIndicators = [
    'appellation', 'château', 'chateau', 'domaine', 'vintage', 'estate',
    'wine', 'rouge', 'blanc', 'rosé', 'rose', 'sec', 'demi-sec',
    'cabernet', 'merlot', 'chardonnay', 'pinot', 'sauvignon',
    'bordeaux', 'burgundy', 'champagne', 'contrôlée', 'controlee',
    'vol', 'ml', 'cl', 'alcohol', '도', '년산', '와인', 'winery',
    'producer', 'harvest', 'reserve', 'grand', 'cru', 'premier',
    'soave', 'farina', 'doc', 'docg', 'denominazione', 'origine',
    'controllata', 'prodotto', 'italia', 'garganega'
  ];
  
  const receiptIndicators = [
    'total', 'subtotal', 'tax', 'receipt', 'qty', 'quantity',
    'payment', 'card', 'cash', 'change', 'date', 'time',
    '₩', '$', '€', '£', 'no.', '#', '수량', '소계', '총액',
    '부가세', '결제', '신용카드', '카드', '현금', '승인번호',
    '매장', '점포', '상점', 'store', 'shop', 'mart'
  ];
  
  // 발견된 지표들을 추적
  const foundWineIndicators: string[] = [];
  const foundReceiptIndicators: string[] = [];
  
  // 와인 라벨 지표 검사 (정확한 단어 매칭)
  for (const indicator of wineLabelIndicators) {
    if (containsWord(normalizedText, indicator)) {
      foundWineIndicators.push(indicator);
    }
  }
  
  // 영수증 지표 검사
  for (const indicator of receiptIndicators) {
    if (containsWord(normalizedText, indicator)) {
      foundReceiptIndicators.push(indicator);
    }
  }
  
  // 가중치 계산
  const wineScore = calculateWineScore(normalizedText, foundWineIndicators);
  const receiptScore = calculateReceiptScore(normalizedText, foundReceiptIndicators);
  
  // 분류 결정 (임계값 조정)
  const threshold = 0.4;
  const confidenceGap = Math.abs(wineScore - receiptScore);
  
  if (wineScore > receiptScore && wineScore > threshold) {
    return {
      type: ImageType.WINE_LABEL,
      confidence: Math.min(wineScore + (confidenceGap * 0.1), 0.95),
      indicators: foundWineIndicators
    };
  } else if (receiptScore > wineScore && receiptScore > threshold) {
    return {
      type: ImageType.RECEIPT,
      confidence: Math.min(receiptScore + (confidenceGap * 0.1), 0.95),
      indicators: foundReceiptIndicators
    };
  } else {
    return {
      type: ImageType.UNKNOWN,
      confidence: Math.max(wineScore, receiptScore),
      indicators: foundWineIndicators.concat(foundReceiptIndicators)
    };
  }
}

// 단어 경계를 고려한 검색 함수
function containsWord(text: string, word: string): boolean {
  // 특수 문자는 단순 포함 검사
  if (/[₩$€£#]/.test(word)) {
    return text.includes(word);
  }
  
  // 단어 경계를 고려한 정규식 패턴
  const pattern = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
  return pattern.test(text);
}

function calculateWineScore(text: string, indicators: string[]): number {
  let score = 0;
  
  // 기본 지표 점수
  score += indicators.length * 0.1;
  
  // 특별 가중치
  if (text.includes('château') || text.includes('chateau')) score += 0.3;
  if (text.includes('appellation')) score += 0.3;
  if (text.includes('contrôlée') || text.includes('controlee')) score += 0.3;
  if (text.includes('bordeaux')) score += 0.2;
  if (text.includes('vintage') || text.includes('년산')) score += 0.2;
  
  // 이탈리아 와인 지표
  if (text.includes('doc') || text.includes('docg')) score += 0.3;
  if (text.includes('denominazione') && text.includes('origine')) score += 0.3;
  if (text.includes('soave')) score += 0.2;
  if (text.includes('farina')) score += 0.2;
  
  // 년도 패턴 (1900-2030)
  const yearPattern = /\b(19|20)\d{2}\b/;
  if (yearPattern.test(text)) score += 0.2;
  
  // 알코올 도수 패턴
  const alcoholPattern = /\d+\.?\d*\s*(%)?\s*(vol|도)/;
  if (alcoholPattern.test(text)) score += 0.2;
  
  // 용량 패턴
  const volumePattern = /\d+\s*(ml|cl|l)/;
  if (volumePattern.test(text)) score += 0.1;
  
  return Math.min(score, 1.0);
}

function calculateReceiptScore(text: string, indicators: string[]): number {
  let score = 0;
  
  // 기본 지표 점수
  score += indicators.length * 0.1;
  
  // 특별 가중치
  if (text.includes('total') || text.includes('총액')) score += 0.3;
  if (text.includes('subtotal') || text.includes('소계')) score += 0.2;
  if (text.includes('qty') || text.includes('quantity') || text.includes('수량')) score += 0.2;
  if (text.includes('payment') || text.includes('결제')) score += 0.2;
  if (text.includes('₩') || text.includes('$') || text.includes('€')) score += 0.3;
  
  // 날짜 패턴 (YYYY/MM/DD, YYYY-MM-DD, YYYY.MM.DD)
  const datePattern = /\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2}/;
  if (datePattern.test(text)) score += 0.2;
  
  // 시간 패턴 (HH:MM:SS, HH:MM)
  const timePattern = /\d{1,2}:\d{2}(:\d{2})?/;
  if (timePattern.test(text)) score += 0.1;
  
  // 가격 패턴 (숫자 + 화폐 기호)
  const pricePattern = /[\₩\$\€\£]\s*\d{1,3}(,\d{3})*/;
  if (pricePattern.test(text)) score += 0.3;
  
  // 상점명 패턴 (매장, 점, 마트 등)
  if (text.includes('점') || text.includes('마트') || text.includes('store')) score += 0.2;
  
  return Math.min(score, 1.0);
}