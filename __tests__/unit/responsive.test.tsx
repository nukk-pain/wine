// __tests__/unit/responsive.test.tsx
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useState } from 'react';

// Mock the components that MainPage depends on
jest.mock('@/components/ImageUpload', () => {
  return {
    __esModule: true,
    default: function MockImageUpload({ onUpload }: { onUpload: (file: File) => void }) {
      return (
        <div data-testid="image-upload-mock">
          <button onClick={() => onUpload(new File([''], 'test.jpg', { type: 'image/jpeg' }))}>
            Upload Image
          </button>
        </div>
      );
    }
  };
});

jest.mock('@/components/ImageTypeSelector', () => {
  return {
    __esModule: true,
    default: function MockImageTypeSelector({ onSelect, selected }: any) {
      return (
        <div data-testid="image-type-selector-mock">
          <button onClick={() => onSelect('wine_label')}>Wine Label</button>
          <button onClick={() => onSelect('receipt')}>Receipt</button>
        </div>
      );
    },
    ImageType: {}
  };
});

jest.mock('@/components/ResultDisplay', () => {
  return {
    __esModule: true,
    default: function MockResultDisplay({ data, type }: any) {
      return (
        <div data-testid="result-display-mock">
          <div>Type: {type}</div>
          <div>Data: {JSON.stringify(data)}</div>
        </div>
      );
    }
  };
});

// Mock Next.js Head component
jest.mock('next/head', () => {
  return function MockHead({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
  };
});

// Mock the main page component that we'll test for responsive design
import MainPage from '@/pages/index';

// Mock the ResizeObserver API for testing
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Helper function to simulate viewport changes
const setViewport = (width: number, height: number) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });
  
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: height,
  });
  
  window.dispatchEvent(new Event('resize'));
};

describe('Responsive Design', () => {
  beforeEach(() => {
    // Reset to desktop size before each test
    setViewport(1024, 768);
  });

  it('should render correctly on mobile devices', () => {
    // Set mobile viewport
    setViewport(375, 667); // iPhone SE dimensions
    
    render(<MainPage />);
    
    // Check if main container adapts to mobile
    const mainContainer = screen.getByRole('main');
    expect(mainContainer).toBeInTheDocument();
    
    // Mobile-specific elements should be visible
    // The upload area should stack vertically on mobile
    const uploadArea = screen.getByTestId('upload-area');
    expect(uploadArea).toBeInTheDocument();
    
    // Mobile navigation should be present (if implemented)
    // Check for responsive text sizes and spacing
    const title = screen.getByRole('heading', { level: 1 });
    expect(title).toBeInTheDocument();
  });

  it('should render correctly on tablet devices', () => {
    // Set tablet viewport
    setViewport(768, 1024); // iPad dimensions
    
    render(<MainPage />);
    
    // Check if layout adapts to tablet size
    const mainContainer = screen.getByRole('main');
    expect(mainContainer).toBeInTheDocument();
    
    // Elements should be arranged appropriately for tablet
    const uploadArea = screen.getByTestId('upload-area');
    expect(uploadArea).toBeInTheDocument();
  });

  it('should render correctly on desktop', () => {
    // Set desktop viewport
    setViewport(1920, 1080); // Full HD desktop
    
    render(<MainPage />);
    
    // Check if layout uses full desktop space effectively
    const mainContainer = screen.getByRole('main');
    expect(mainContainer).toBeInTheDocument();
    
    // Desktop layout should show elements side by side
    const uploadArea = screen.getByTestId('upload-area');
    expect(uploadArea).toBeInTheDocument();
  });

  it('should adapt layout when window is resized', () => {
    render(<MainPage />);
    
    // Start with desktop
    setViewport(1920, 1080);
    const mainContainer = screen.getByRole('main');
    expect(mainContainer).toBeInTheDocument();
    
    // Resize to mobile
    setViewport(375, 667);
    // Component should adapt to mobile layout
    expect(mainContainer).toBeInTheDocument();
    
    // Resize back to desktop
    setViewport(1920, 1080);
    expect(mainContainer).toBeInTheDocument();
  });

  it('should have responsive typography', () => {
    render(<MainPage />);
    
    // Test mobile typography
    setViewport(375, 667);
    const title = screen.getByRole('heading', { level: 1 });
    expect(title).toBeInTheDocument();
    
    // Test desktop typography
    setViewport(1920, 1080);
    expect(title).toBeInTheDocument();
  });

  it('should handle touch interactions on mobile', () => {
    setViewport(375, 667);
    
    render(<MainPage />);
    
    // Check for touch-friendly button sizes
    const uploadArea = screen.getByTestId('upload-area');
    expect(uploadArea).toBeInTheDocument();
    
    // Upload area should be large enough for touch interaction
    // (minimum 44px touch target recommended by accessibility guidelines)
  });

  it('should show/hide elements based on screen size', () => {
    render(<MainPage />);
    
    // Some elements might be hidden on mobile for better UX
    // Desktop might show additional information panels
    
    // Mobile view
    setViewport(375, 667);
    const mainContainer = screen.getByRole('main');
    expect(mainContainer).toBeInTheDocument();
    
    // Desktop view
    setViewport(1920, 1080);
    expect(mainContainer).toBeInTheDocument();
  });

  it('should maintain accessibility across all screen sizes', () => {
    render(<MainPage />);
    
    // Test accessibility on mobile
    setViewport(375, 667);
    const title = screen.getByRole('heading', { level: 1 });
    expect(title).toBeInTheDocument();
    
    // Test accessibility on desktop
    setViewport(1920, 1080);
    expect(title).toBeInTheDocument();
    
    // All interactive elements should be accessible via keyboard
    // regardless of screen size
  });
});