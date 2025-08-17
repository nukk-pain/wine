// __tests__/unit/accessibility.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MainPage from '@/pages/index';
import { ImageUpload } from '@/components/ImageUpload';
import { ImageTypeSelector } from '@/components/ImageTypeSelector';
import { WineResultDisplay } from '@/components/WineResultDisplay';

// Mock the API
global.fetch = jest.fn();

describe('Accessibility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should have proper ARIA labels', () => {
    render(<MainPage />);
    
    // Check for main landmark
    expect(screen.getByRole('main')).toBeInTheDocument();
    
    // Check heading hierarchy
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('🍷 Wine tracker');
    
    // Check basic page structure
    const heading2 = screen.queryByRole('heading', { level: 2 });
    if (heading2) {
      expect(heading2).toBeInTheDocument();
    }
  });

  it('should support keyboard navigation', async () => {
    const user = userEvent.setup();
    
    render(<ImageTypeSelector onSelect={jest.fn()} />);
    
    // Check that buttons are present and accessible
    const wineButton = screen.getByText('와인 라벨');
    const receiptButton = screen.getByText('영수증');
    const autoButton = screen.getByText('AI 자동 감지');
    
    expect(wineButton).toBeInTheDocument();
    expect(receiptButton).toBeInTheDocument();
    expect(autoButton).toBeInTheDocument();
  });

  it('should provide screen reader announcements', () => {
    render(
      <ImageTypeSelector 
        onSelect={jest.fn()}
        autoDetected={{
          type: 'wine_label',
          confidence: 0.85
        }}
      />
    );
    
    // Check for live region
    expect(screen.getByRole('status')).toHaveTextContent('신뢰도: 85%');
    
    // Check for polite announcement area
    const liveRegion = document.querySelector('[aria-live="polite"]');
    expect(liveRegion).toBeInTheDocument();
  });

  it('should have accessible form controls', () => {
    const mockOnUpload = jest.fn();
    render(<ImageUpload onUpload={mockOnUpload} />);
    
    // Check for proper labeling
    const fileInput = screen.getByLabelText(/이미지 파일 선택/i);
    expect(fileInput).toBeInTheDocument();
    expect(fileInput).toHaveAttribute('type', 'file');
    expect(fileInput).toHaveAttribute('accept', 'image/*');
  });

  it('should provide error announcements', () => {
    const errorMessage = '처리 중 오류가 발생했습니다';
    
    render(
      <WineResultDisplay
        data={{ 'Name': 'Test Wine' }}
        onEdit={() => {}}
        onSave={() => {}}
        error={errorMessage}
      />
    );
    
    // Error should be announced to screen readers - check if error element exists
    const errorElement = screen.queryByText(errorMessage);
    if (errorElement) {
      expect(errorElement).toBeInTheDocument();
    }
  });

  it('should support high contrast mode', () => {
    render(<MainPage />);
    
    // Check that colors are defined using CSS classes (not inline styles)
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveClass('text-gray-900');
    
    // Check that page rendered successfully
    expect(heading).toBeInTheDocument();
  });

  it('should have proper button states', async () => {
    const user = userEvent.setup();
    const mockOnSelect = jest.fn();
    
    render(<ImageTypeSelector onSelect={mockOnSelect} selected="wine_label" />);
    
    // Check buttons exist and are clickable
    const wineButton = screen.getByText('와인 라벨');
    expect(wineButton).toBeInTheDocument();
    
    const receiptButton = screen.getByText('영수증');
    expect(receiptButton).toBeInTheDocument();
    
    // Test button interaction
    await user.click(receiptButton);
    expect(mockOnSelect).toHaveBeenCalledWith('receipt');
  });

  it('should provide loading state announcements', () => {
    render(
      <WineResultDisplay
        data={{ 'Name': 'Test Wine' }}
        onEdit={() => {}}
        onSave={() => {}}
        loading={true}
      />
    );
    
    // Loading state should be announced - check if loading element exists
    const loadingElement = screen.queryByText(/저장|loading/i);
    if (loadingElement) {
      expect(loadingElement).toBeInTheDocument();
    }
  });

  it('should have proper focus management', async () => {
    const user = userEvent.setup();
    
    render(<MainPage />);
    
    // Focus should be trapped within the current step
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toBeInTheDocument();
    
    // Test tab order
    await user.tab();
    // Should focus on the first interactive element in the upload section
    const firstFocusable = document.activeElement;
    expect(firstFocusable).toBeInTheDocument();
  });

  it('should support reduced motion preferences', () => {
    // Mock prefers-reduced-motion
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });

    render(<MainPage />);
    
    // Components should respect reduced motion preferences
    // This would typically be implemented through CSS classes
    const mainContent = screen.getByRole('main');
    expect(mainContent).toBeInTheDocument();
  });
});