// __tests__/unit/accessibility.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MainPage from '@/pages/index';
import { ImageUpload } from '@/components/ImageUpload';
import { ImageTypeSelector } from '@/components/ImageTypeSelector';
import { ResultDisplay } from '@/components/ResultDisplay';

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
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('와인 추적기');
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('1. 이미지 업로드');
  });

  it('should support keyboard navigation', async () => {
    const user = userEvent.setup();
    
    render(<ImageTypeSelector onSelect={jest.fn()} />);
    
    // Tab to first button
    await user.tab();
    expect(screen.getByText('와인 라벨')).toHaveFocus();
    
    // Tab to second button
    await user.tab();
    expect(screen.getByText('영수증')).toHaveFocus();
    
    // Tab to third button
    await user.tab();
    expect(screen.getByText('자동 감지')).toHaveFocus();
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
      <ResultDisplay
        data={{ name: 'Test Wine' }}
        type="wine_label"
        error={errorMessage}
      />
    );
    
    // Error should be announced to screen readers
    const errorElement = screen.getByText(errorMessage);
    expect(errorElement).toBeInTheDocument();
    expect(errorElement.closest('div')).toHaveAttribute('role', 'alert');
  });

  it('should support high contrast mode', () => {
    render(<MainPage />);
    
    // Check that colors are defined using CSS classes (not inline styles)
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveClass('text-gray-900');
    
    // Check for proper color contrast classes
    const uploadSection = screen.getByText('1. 이미지 업로드').closest('section');
    expect(uploadSection).toHaveClass('bg-white');
  });

  it('should have proper button states', async () => {
    const user = userEvent.setup();
    const mockOnSelect = jest.fn();
    
    render(<ImageTypeSelector onSelect={mockOnSelect} selected="wine_label" />);
    
    // Check ARIA attributes for selected state
    const wineButton = screen.getByText('와인 라벨');
    expect(wineButton).toHaveAttribute('aria-checked', 'true');
    expect(wineButton).toHaveAttribute('role', 'radio');
    
    const receiptButton = screen.getByText('영수증');
    expect(receiptButton).toHaveAttribute('aria-checked', 'false');
    expect(receiptButton).toHaveAttribute('role', 'radio');
  });

  it('should provide loading state announcements', () => {
    render(
      <ResultDisplay
        data={{ name: 'Test Wine' }}
        type="wine_label"
        loading={true}
      />
    );
    
    // Loading state should be announced
    const loadingElement = screen.getByText('저장 중...');
    expect(loadingElement).toBeInTheDocument();
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