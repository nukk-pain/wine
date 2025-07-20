// pages/index.tsx
import { useState } from 'react';
import Head from 'next/head';
import { ImageUpload } from '@/components/ImageUpload';
import { ImageTypeSelector, ImageType } from '@/components/ImageTypeSelector';
import { ResultDisplay } from '@/components/ResultDisplay';

// Layout components for responsive design
const ResponsiveLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
    {children}
  </div>
);

ResponsiveLayout.LeftColumn = ({ children }: { children: React.ReactNode }) => (
  <div className="space-y-6">
    {children}
  </div>
);

ResponsiveLayout.RightColumn = ({ children }: { children: React.ReactNode }) => (
  <div className="space-y-6">
    {children}
  </div>
);

// Processing step wrapper component
const ProcessingStep = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="bg-white rounded-lg shadow-md p-4 sm:p-6">
    {title && <h2 className="text-lg sm:text-xl font-semibold mb-4">{title}</h2>}
    {children}
  </section>
);

// Loading spinner component
const LoadingSpinner = ({ message }: { message: string }) => (
  <div className="text-center">
    <div className="text-base sm:text-lg">{message}</div>
    <div className="mt-4 flex justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  </div>
);

// Error message component
const ErrorMessage = ({ message }: { message: string }) => (
  <div className="text-center text-red-600">
    <div className="text-base sm:text-lg">오류: {message}</div>
  </div>
);

interface ProcessedData {
  type: 'wine_label' | 'receipt';
  extractedData: any;
  notionResult?: any;
  notionResults?: any[];
}

export default function MainPage() {
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>('');
  const [selectedType, setSelectedType] = useState<ImageType | null>(null);
  const [processedData, setProcessedData] = useState<ProcessedData | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string>('');
  const [autoDetected, setAutoDetected] = useState<any>(null);

  const handleImageUpload = (file: File) => {
    // Create URL for the uploaded file
    const imageUrl = URL.createObjectURL(file);
    
    // Reset state for new upload
    setUploadedImageUrl(imageUrl);
    setSelectedType(null);
    setProcessedData(null);
    setLoading(false);
    setSuccess(false);
    setError('');
    setAutoDetected(null);
  };

  const handleTypeSelection = async (type: ImageType) => {
    setSelectedType(type);
    
    if (type === 'auto') {
      // For auto detection, we would normally classify the image first
      // For now, just proceed with processing
      return;
    }

    // Process the image
    await processImage(type);
  };

  const processImage = async (type: ImageType) => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageUrl: uploadedImageUrl,
          action: 'process_image',
          type: type !== 'auto' ? type : undefined
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setProcessedData(result.data);
        // If the processing includes Notion saving, mark as success
        if (result.data.notionResult || result.data.notionResults) {
          setSuccess(true);
        }
      } else {
        setError(result.error || '처리 중 오류가 발생했습니다');
      }
    } catch (err) {
      setError('처리 중 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToNotion = async () => {
    if (!processedData) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/notion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: processedData.type === 'wine_label' ? 'save_wine' : 'save_receipt',
          data: processedData.extractedData
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSuccess(true);
      } else {
        setError(result.error || '저장 중 오류가 발생했습니다');
      }
    } catch (err) {
      setError('저장 중 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Wine Tracker</title>
        <meta name="description" content="Track your wine collection with OCR" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <main className="min-h-screen bg-gray-50 py-4 sm:py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Responsive Typography */}
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-center text-gray-900 mb-6 sm:mb-8">
            와인 추적기
          </h1>

          {/* Responsive Layout: Two columns on desktop, single column on mobile/tablet */}
          <ResponsiveLayout>
            <ResponsiveLayout.LeftColumn>
              <ProcessingStep title="1. 이미지 업로드">
                <div data-testid="upload-area">
                  <ImageUpload onUpload={handleImageUpload} />
                </div>
              </ProcessingStep>

              {uploadedImageUrl && (
                <ProcessingStep title="2. 이미지 타입 선택">
                  <ImageTypeSelector 
                    onSelect={handleTypeSelection}
                    selected={selectedType}
                    autoDetected={autoDetected}
                  />
                </ProcessingStep>
              )}
            </ResponsiveLayout.LeftColumn>

            <ResponsiveLayout.RightColumn>
              {processedData && (
                <ProcessingStep title="3. 처리 결과">
                  <ResultDisplay
                    data={processedData.extractedData}
                    type={processedData.type}
                    loading={loading}
                    success={success}
                    error={error}
                    onSave={handleSaveToNotion}
                  />
                </ProcessingStep>
              )}

              {loading && !processedData && (
                <ProcessingStep title="">
                  <LoadingSpinner message="처리 중..." />
                </ProcessingStep>
              )}

              {error && !processedData && (
                <ProcessingStep title="">
                  <ErrorMessage message={error} />
                </ProcessingStep>
              )}
            </ResponsiveLayout.RightColumn>
          </ResponsiveLayout>

          {/* Mobile-specific help text */}
          <div className="mt-8 lg:hidden">
            <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-800">
              <p className="font-medium mb-2">모바일 팁:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>와인 라벨이나 영수증을 선명하게 촬영해주세요</li>
                <li>조명이 밝은 곳에서 촬영하면 인식률이 높아집니다</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}