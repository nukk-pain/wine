import { parseWineLabel } from '@/lib/parsers/wine-label';

describe('Wine Label Parser', () => {
  it('should parse French wine label', () => {
    const mockText = `
      Château Margaux
      2015
      Appellation Margaux Contrôlée
      Bordeaux
      75cl
      13.5% vol
    `;
    
    const result = parseWineLabel(mockText);
    
    expect(result).toEqual({
      name: 'Château Margaux',
      vintage: 2015,
      region: 'Bordeaux',
      appellation: 'Margaux',
      alcohol: 13.5,
      volume: '75cl',
      producer: 'Château Margaux'
    });
  });

  it('should parse Korean wine label', () => {
    const mockText = `
      까베르네 소비뇽
      2020년산
      프랑스 보르도
      14도
    `;
    
    const result = parseWineLabel(mockText);
    
    expect(result).toMatchObject({
      variety: 'Cabernet Sauvignon',
      vintage: 2020,
      region: '보르도',
      alcohol: 14
    });
  });

  it('should handle incomplete wine label data', () => {
    const incompleteText = 'Red Wine 2020';
    const result = parseWineLabel(incompleteText);
    
    expect(result.vintage).toBe(2020);
    expect(result.name).toContain('Red Wine');
  });

  it('should parse Italian wine label', () => {
    const mockText = `
      Barolo
      Brunate 2018
      Piedmont
      Giuseppe Rinaldi
      14.5% vol
      750ml
    `;
    
    const result = parseWineLabel(mockText);
    
    expect(result).toMatchObject({
      name: expect.stringContaining('Barolo'),
      vintage: 2018,
      region: 'Piedmont',
      producer: expect.stringContaining('Giuseppe Rinaldi'),
      alcohol: 14.5,
      volume: '750ml'
    });
  });

  it('should parse wine with multiple grape varieties', () => {
    const mockText = `
      Côtes du Rhône
      2019
      Grenache, Syrah, Mourvèdre
      13% vol
      E. Guigal
    `;
    
    const result = parseWineLabel(mockText);
    
    expect(result.variety).toContain('Grenache');
    expect(result.variety).toContain('Syrah');
    expect(result.variety).toContain('Mourvèdre');
  });

  it('should extract appellation from complex text', () => {
    const mockText = `
      Domaine de la Romanée-Conti
      La Tâche
      2017
      Appellation La Tâche Contrôlée
      Grand Cru
    `;
    
    const result = parseWineLabel(mockText);
    
    expect(result.appellation).toBe('La Tâche');
    expect(result.classification).toBe('Grand Cru');
  });

  it('should handle empty or invalid input', () => {
    expect(parseWineLabel('')).toEqual({});
    expect(parseWineLabel('   ')).toEqual({});
    expect(parseWineLabel('Not a wine label at all')).toEqual({});
  });

  it('should parse alcohol content in various formats', () => {
    const testCases = [
      { text: '13.5% vol', expected: 13.5 },
      { text: '14도', expected: 14 },
      { text: '12.5% alcohol', expected: 12.5 },
      { text: 'alc. 13%', expected: 13 }
    ];

    testCases.forEach(({ text, expected }) => {
      const result = parseWineLabel(text);
      expect(result.alcohol).toBe(expected);
    });
  });

  it('should parse vintage in various formats', () => {
    const testCases = [
      { text: 'Vintage 2020', expected: 2020 },
      { text: '2019년산', expected: 2019 },
      { text: 'Récolte 2018', expected: 2018 },
      { text: 'Harvest 2021', expected: 2021 }
    ];

    testCases.forEach(({ text, expected }) => {
      const result = parseWineLabel(text);
      expect(result.vintage).toBe(expected);
    });
  });

  it('should parse volume in various formats', () => {
    const testCases = [
      { text: '750ml', expected: '750ml' },
      { text: '75cl', expected: '75cl' },
      { text: '1.5L', expected: '1.5L' },
      { text: '500 ml', expected: '500ml' }
    ];

    testCases.forEach(({ text, expected }) => {
      const result = parseWineLabel(text);
      expect(result.volume).toBe(expected);
    });
  });
});