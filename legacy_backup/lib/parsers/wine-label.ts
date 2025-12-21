export interface WineLabelData {
  name?: string;
  vintage?: number;
  producer?: string;
  region?: string;
  appellation?: string;
  variety?: string;
  alcohol?: number;
  volume?: string;
  classification?: string;
}

export function parseWineLabel(text: string): WineLabelData {
  if (!text || text.trim().length === 0) {
    return {};
  }

  // 와인 관련 키워드가 없으면 빈 객체 반환
  const wineKeywords = ['wine', 'château', 'domaine', 'appellation', 'vintage', '와인', '년산', 'vol', '도', 'soave', 'denominazione', 'doc', 'docg', 'farina'];
  const hasWineKeywords = wineKeywords.some(keyword => 
    text.toLowerCase().includes(keyword.toLowerCase())
  );
  
  if (!hasWineKeywords && !extractVintage(text)) {
    return {};
  }

  const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
  
  return {
    vintage: extractVintage(text),
    name: extractWineName(lines, text),
    producer: extractProducer(lines, text),
    region: extractRegion(text),
    appellation: extractAppellation(text),
    variety: extractVariety(text),
    alcohol: extractAlcohol(text),
    volume: extractVolume(text),
    classification: extractClassification(text)
  };
}

function extractVintage(text: string): number | undefined {
  // 년도 추출 로직 (1900-2030)
  const patterns = [
    /\b(19[5-9]\d|20[0-3]\d)\b/g,  // 1950-2030
    /(\d{4})년산/g,                 // 한국어 년산
    /vintage\s+(\d{4})/gi,          // Vintage 2020
    /récolte\s+(\d{4})/gi,          // Récolte 2020
    /harvest\s+(\d{4})/gi           // Harvest 2020
  ];

  for (const pattern of patterns) {
    const matches = text.match(pattern);
    if (matches) {
      const year = parseInt(matches[0].replace(/[^\d]/g, ''));
      if (year >= 1950 && year <= 2030) {
        return year;
      }
    }
  }

  return undefined;
}

function extractWineName(lines: string[], text: string): string | undefined {
  // 특별 와인명 패턴 (Château, Domaine 등) 우선 검색
  const prestigePatterns = [
    /(?:château|chateau)\s+[\w\s\-'\.]+/gi,
    /domaine\s+[\w\s\-'\.]+/gi,
    /estate\s+[\w\s\-'\.]+/gi,
    /winery\s+[\w\s\-'\.]+/gi
  ];

  for (const pattern of prestigePatterns) {
    const match = text.match(pattern);
    if (match) {
      // 년도나 기타 정보 제거
      let name = match[0].trim();
      name = name.replace(/\b\d{4}\b/g, '').trim();
      name = name.replace(/\s+/g, ' ');
      if (name.length > 3) {
        return name;
      }
    }
  }

  // 첫 번째 유의미한 라인을 와인명으로 사용
  for (const line of lines) {
    // 제외할 패턴들
    if (/^\d{4}$/.test(line) ||                    // 단독 년도
        /appellation/gi.test(line) ||              // Appellation 라인
        /\d+\s*(ml|cl|l|%)/gi.test(line) ||       // 용량/도수 라인
        /vol|alcohol/gi.test(line) ||              // 알코올 관련
        line.length < 3 ||                         // 너무 짧은 라인
        /^\d+\.?\d*\s*도$/.test(line)) {          // 한국어 도수
      continue;
    }
    
    return line;
  }

  return undefined;
}

function extractProducer(lines: string[], text: string): string | undefined {
  // 생산자 지표들
  const producerIndicators = ['domaine', 'château', 'chateau', 'estate', 'winery', 'producer'];
  
  for (const line of lines) {
    for (const indicator of producerIndicators) {
      if (line.toLowerCase().includes(indicator)) {
        return line;
      }
    }
  }

  // 이름에서 생산자 추출 (Château = 생산자)
  const name = extractWineName(lines, text);
  if (name && (name.toLowerCase().includes('château') || name.toLowerCase().includes('domaine'))) {
    return name;
  }

  // SOAVE와 같은 이탈리아 와인의 경우, 두 번째 라인이 생산자인 경우가 많음
  if (lines.length >= 2 && lines[0].toLowerCase().includes('soave')) {
    const potentialProducer = lines[1];
    if (potentialProducer && potentialProducer.length > 2 && 
        !potentialProducer.toLowerCase().includes('denominazione') &&
        !potentialProducer.toLowerCase().includes('doc')) {
      return potentialProducer;
    }
  }
  
  // 일반적으로 두 번째 유의미한 라인을 생산자로 시도
  if (lines.length >= 2) {
    const potentialProducer = lines[1];
    // DOC, denomination 등 분류명이 아닌 경우에만
    if (potentialProducer && 
        !potentialProducer.toLowerCase().includes('denominazione') &&
        !potentialProducer.toLowerCase().includes('appellation') &&
        !potentialProducer.toLowerCase().includes('doc') &&
        !/^\d/.test(potentialProducer) && // 숫자로 시작하지 않음
        potentialProducer.length > 2) {
      return potentialProducer;
    }
  }

  return undefined;
}

function extractRegion(text: string): string | undefined {
  // 유명 와인 지역들
  const regions = [
    'bordeaux', 'burgundy', 'champagne', 'loire', 'rhône', 'alsace',
    'tuscany', 'piedmont', 'veneto', 'sicily',
    'napa valley', 'sonoma', 'paso robles',
    'rioja', 'ribera del duero',
    'barossa', 'hunter valley',
    '보르도', '부르고뉴', '샴페인', '토스카나'
  ];

  const lowerText = text.toLowerCase();
  for (const region of regions) {
    if (lowerText.includes(region.toLowerCase())) {
      // 원본 텍스트에서 대소문자 유지하여 반환
      const regionPattern = new RegExp(region.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      const match = text.match(regionPattern);
      if (match) {
        return match[0];
      }
    }
  }

  return undefined;
}

function extractAppellation(text: string): string | undefined {
  // Appellation 패턴 매칭
  const appellationPattern = /appellation\s+([\w\s\-']+?)\s+contrôlée/gi;
  const match = text.match(appellationPattern);
  
  if (match) {
    // "Appellation Margaux Contrôlée" -> "Margaux"
    const appellationText = match[0];
    const appellationName = appellationText
      .replace(/appellation\s+/gi, '')
      .replace(/\s+contrôlée/gi, '')
      .trim();
    return appellationName;
  }

  return undefined;
}

function extractVariety(text: string): string | undefined {
  // 포도 품종들
  const varieties = [
    'cabernet sauvignon', 'merlot', 'pinot noir', 'chardonnay', 'sauvignon blanc',
    'syrah', 'shiraz', 'grenache', 'mourvèdre', 'tempranillo', 'sangiovese',
    'riesling', 'gewürztraminer', 'pinot grigio', 'pinot gris', 'garganega',
    '까베르네 소비뇽', '메를로', '피노 누아', '샤르도네'
  ];

  const foundVarieties: string[] = [];
  const lowerText = text.toLowerCase();

  for (const variety of varieties) {
    if (lowerText.includes(variety.toLowerCase())) {
      // 원본 텍스트에서 대소문자 유지
      const varietyPattern = new RegExp(variety.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      const match = text.match(varietyPattern);
      if (match) {
        foundVarieties.push(match[0]);
      }
    }
  }

  // 까베르네 소비뇽 -> Cabernet Sauvignon 변환
  const koreanToEnglish: { [key: string]: string } = {
    '까베르네 소비뇽': 'Cabernet Sauvignon',
    '메를로': 'Merlot',
    '피노 누아': 'Pinot Noir',
    '샤르도네': 'Chardonnay'
  };

  const normalizedVarieties = foundVarieties.map(variety => 
    koreanToEnglish[variety] || variety
  );

  return normalizedVarieties.length > 0 ? normalizedVarieties.join(', ') : undefined;
}

function extractAlcohol(text: string): number | undefined {
  // 알코올 도수 패턴들
  const patterns = [
    /(\d+\.?\d*)\s*%\s*vol/gi,      // 13.5% vol
    /(\d+\.?\d*)\s*%\s*alcohol/gi,  // 13.5% alcohol
    /alc\.\s*(\d+\.?\d*)\s*%/gi,    // alc. 13.5%
    /(\d+\.?\d*)도/g                // 13도 (한국어)
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const alcoholStr = match[0].replace(/[^\d.]/g, '');
      const alcohol = parseFloat(alcoholStr);
      if (alcohol > 0 && alcohol <= 20) { // 현실적인 알코올 도수 범위
        return alcohol;
      }
    }
  }

  return undefined;
}

function extractVolume(text: string): string | undefined {
  // 용량 패턴들
  const patterns = [
    /\d+\.?\d*\s*ml/gi,    // 750ml, 750 ml
    /\d+\.?\d*\s*cl/gi,    // 75cl, 75 cl
    /\d+\.?\d*\s*l/gi      // 1.5L, 1.5 l
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      // 공백 제거하여 정규화
      return match[0].replace(/\s+/g, '');
    }
  }

  return undefined;
}

function extractClassification(text: string): string | undefined {
  // 와인 등급 분류
  const classifications = [
    'grand cru', 'premier cru', 'cru classé', 'reserve', 'réserve',
    'superieur', 'supérieur', 'villages', 'doc', 'docg', 'igt',
    'aoc', 'ava', 'appellation'
  ];

  const lowerText = text.toLowerCase();
  for (const classification of classifications) {
    if (lowerText.includes(classification)) {
      // 원본 텍스트에서 대소문자 유지
      const classPattern = new RegExp(classification.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      const match = text.match(classPattern);
      if (match) {
        return match[0];
      }
    }
  }

  return undefined;
}