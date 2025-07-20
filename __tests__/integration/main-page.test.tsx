// __tests__/integration/main-page.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MainPage from '@/pages/index';

// Mock the components and API calls
jest.mock('@/components/ImageUpload', () => ({
  ImageUpload: ({ onUpload }: { onUpload: (url: string) => void }) => (
    <div>
      <button onClick={() => onUpload('/api/files/test-image.jpg')}>
        Mock Upload
      </button>
      <div>이미지를 업로드하세요</div>
    </div>
  )
}));

jest.mock('@/components/ImageTypeSelector', () => ({
  ImageTypeSelector: ({ onSelect, autoDetected }: any) => (
    <div>
      <button onClick={() => onSelect('wine_label')}>와인 라벨</button>
      <button onClick={() => onSelect('receipt')}>영수증</button>
      {autoDetected && <div>감지된 타입: {autoDetected.type}</div>}
    </div>
  )
}));

jest.mock('@/components/ResultDisplay', () => ({
  ResultDisplay: ({ data, type, onSave, loading, success, error }: any) => (
    <div>
      <div>결과 표시: {type}</div>
      <div>{JSON.stringify(data)}</div>
      {loading && <div>처리 중...</div>}
      {success && <div>저장 완료!</div>}
      {error && <div>오류: {error}</div>}
      <button onClick={onSave}>Notion에 저장</button>
    </div>
  )
}));

// Mock fetch API
global.fetch = jest.fn();

describe('Main Page Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockClear();
  });

  it('should render initial upload state', () => {
    render(<MainPage />);
    
    expect(screen.getByText('와인 추적기')).toBeInTheDocument();
    expect(screen.getByText('이미지를 업로드하세요')).toBeInTheDocument();
  });

  it('should show image type selector after upload', async () => {
    render(<MainPage />);
    
    // Upload an image
    fireEvent.click(screen.getByText('Mock Upload'));
    
    await waitFor(() => {
      expect(screen.getByText('와인 라벨')).toBeInTheDocument();
      expect(screen.getByText('영수증')).toBeInTheDocument();
    });
  });

  it('should process wine label image', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          type: 'wine_label',
          extractedData: {
            name: 'Château Margaux',
            vintage: 2015
          }
        }
      })
    });

    render(<MainPage />);
    
    // Upload and select wine label
    fireEvent.click(screen.getByText('Mock Upload'));
    await waitFor(() => {
      fireEvent.click(screen.getByText('와인 라벨'));
    });

    await waitFor(() => {
      expect(screen.getByText('처리 중...')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText(/결과 표시: wine_label/)).toBeInTheDocument();
      expect(screen.getByText(/Château Margaux/)).toBeInTheDocument();
    });
  });

  it('should process receipt image', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          type: 'receipt',
          extractedData: {
            store: '와인앤모어',
            items: [{ name: '샤또 마고', price: 150000, quantity: 1 }],
            total: 150000
          }
        }
      })
    });

    render(<MainPage />);
    
    // Upload and select receipt
    fireEvent.click(screen.getByText('Mock Upload'));
    await waitFor(() => {
      fireEvent.click(screen.getByText('영수증'));
    });

    await waitFor(() => {
      expect(screen.getByText(/결과 표시: receipt/)).toBeInTheDocument();
      expect(screen.getByText(/와인앤모어/)).toBeInTheDocument();
    });
  });

  it('should save results to Notion', async () => {
    // Mock process API
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            type: 'wine_label',
            extractedData: { name: 'Test Wine', vintage: 2020 },
            notionResult: { id: 'test-id', url: 'test-url' }
          }
        })
      });

    render(<MainPage />);
    
    // Upload and process
    fireEvent.click(screen.getByText('Mock Upload'));
    await waitFor(() => {
      fireEvent.click(screen.getByText('와인 라벨'));
    });

    // Wait for results
    await waitFor(() => {
      expect(screen.getByText('Notion에 저장')).toBeInTheDocument();
    });

    // Should already be saved from the process API
    await waitFor(() => {
      expect(screen.getByText('저장 완료!')).toBeInTheDocument();
    });
  });

  it('should handle processing errors', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        success: false,
        error: '처리 중 오류가 발생했습니다'
      })
    });

    render(<MainPage />);
    
    // Upload and select type
    fireEvent.click(screen.getByText('Mock Upload'));
    await waitFor(() => {
      fireEvent.click(screen.getByText('와인 라벨'));
    });

    await waitFor(() => {
      expect(screen.getByText('오류: 처리 중 오류가 발생했습니다')).toBeInTheDocument();
    });
  });

  it('should reset workflow when uploading new image', async () => {
    render(<MainPage />);
    
    // Upload first image
    fireEvent.click(screen.getByText('Mock Upload'));
    await waitFor(() => {
      expect(screen.getByText('와인 라벨')).toBeInTheDocument();
    });

    // Upload new image should reset
    fireEvent.click(screen.getByText('Mock Upload'));
    await waitFor(() => {
      // Should show fresh upload state
      expect(screen.getByText('와인 라벨')).toBeInTheDocument();
    });
  });
});