// __tests__/unit/image-type-selector.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { ImageTypeSelector } from '@/components/ImageTypeSelector';

describe('ImageTypeSelector', () => {
  it('should allow manual image type selection', () => {
    const mockOnSelect = jest.fn();
    
    render(<ImageTypeSelector onSelect={mockOnSelect} />);
    
    // 와인 라벨 선택
    fireEvent.click(screen.getByText('와인 라벨'));
    expect(mockOnSelect).toHaveBeenCalledWith('wine_label');
    
    // 영수증 선택
    fireEvent.click(screen.getByText('영수증'));
    expect(mockOnSelect).toHaveBeenCalledWith('receipt');
    
    // 자동 감지 선택
    fireEvent.click(screen.getByText('자동 감지'));
    expect(mockOnSelect).toHaveBeenCalledWith('auto');
  });

  it('should display confidence level for auto-detected type', () => {
    const mockOnSelect = jest.fn();
    
    render(
      <ImageTypeSelector 
        onSelect={mockOnSelect}
        autoDetected={{
          type: 'wine_label',
          confidence: 0.85
        }}
      />
    );
    
    expect(screen.getByText(/감지된 타입: 와인 라벨/)).toBeInTheDocument();
    expect(screen.getByText(/신뢰도: 85%/)).toBeInTheDocument();
  });

  it('should call onSelect when user clicks detected type', () => {
    const mockOnSelect = jest.fn();
    
    render(
      <ImageTypeSelector 
        onSelect={mockOnSelect}
        autoDetected={{
          type: 'receipt',
          confidence: 0.92
        }}
      />
    );
    
    fireEvent.click(screen.getByText('감지된 타입 사용'));
    expect(mockOnSelect).toHaveBeenCalledWith('receipt');
  });

  it('should highlight selected type', () => {
    const mockOnSelect = jest.fn();
    
    render(<ImageTypeSelector onSelect={mockOnSelect} selected="wine_label" />);
    
    const wineLabel = screen.getByText('와인 라벨');
    expect(wineLabel.closest('button')).toHaveClass('bg-blue-500');
  });

  it('should show warning for low confidence detection', () => {
    const mockOnSelect = jest.fn();
    
    render(
      <ImageTypeSelector 
        onSelect={mockOnSelect}
        autoDetected={{
          type: 'wine_label',
          confidence: 0.45
        }}
      />
    );
    
    expect(screen.getByText(/신뢰도가 낮습니다/)).toBeInTheDocument();
    expect(screen.getByText(/수동으로 선택해주세요/)).toBeInTheDocument();
  });
});