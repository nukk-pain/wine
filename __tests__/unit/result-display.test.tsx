// __tests__/unit/result-display.test.tsx
import { render, screen } from '@testing-library/react';
import { ResultDisplay } from '@/components/ResultDisplay';

describe('Result Display', () => {
  it('should display wine label extraction results', () => {
    const wineData = {
      name: 'Château Margaux',
      vintage: 2015,
      'Region/Producer': 'Bordeaux'
    };
    
    render(<ResultDisplay data={wineData} type="wine_label" />);
    
    expect(screen.getByText('Château Margaux')).toBeInTheDocument();
    expect(screen.getByText('2015')).toBeInTheDocument();
  });

  it('should display receipt processing results', () => {
    const receiptData = {
      store: '와인앤모어',
      items: [
        { name: '샤또 마고', price: 150000, quantity: 1 }
      ],
      total: 150000
    };
    
    render(<ResultDisplay data={receiptData} type="receipt" />);
    
    expect(screen.getByText('와인앤모어')).toBeInTheDocument();
    expect(screen.getByText('₩150,000')).toBeInTheDocument();
  });

  it('should display save to Notion button', () => {
    const wineData = {
      name: 'Test Wine',
      vintage: 2020
    };
    
    render(<ResultDisplay data={wineData} type="wine_label" />);
    
    expect(screen.getByText('Notion에 저장')).toBeInTheDocument();
  });

  it('should show loading state when saving', () => {
    const wineData = {
      name: 'Test Wine',
      vintage: 2020
    };
    
    render(<ResultDisplay data={wineData} type="wine_label" loading={true} />);
    
    expect(screen.getByText('저장 중...')).toBeInTheDocument();
  });

  it('should show success message after saving', () => {
    const wineData = {
      name: 'Test Wine',
      vintage: 2020
    };
    
    render(<ResultDisplay data={wineData} type="wine_label" success={true} />);
    
    expect(screen.getByText('저장 완료!')).toBeInTheDocument();
  });

  it('should display error message on save failure', () => {
    const wineData = {
      name: 'Test Wine',
      vintage: 2020
    };
    
    render(<ResultDisplay data={wineData} type="wine_label" error="저장에 실패했습니다" />);
    
    expect(screen.getByText('저장에 실패했습니다')).toBeInTheDocument();
  });
});