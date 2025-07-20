// pages/index.tsx
import { useState } from 'react';
import Head from 'next/head';
import { ImageUpload } from '@/components/ImageUpload';
import { ImageTypeSelector, ImageType } from '@/components/ImageTypeSelector';
import { ResultDisplay } from '@/components/ResultDisplay';
import { DataConfirmation } from '@/components/DataConfirmation';

// Mobile-first layout components
const MobileLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="flex flex-col space-y-4">
    {children}
  </div>
);

// Mobile-optimized processing step wrapper
const ProcessingStep = ({ title, children, className = "" }: { 
  title: string; 
  children: React.ReactNode;
  className?: string;
}) => (
  <section className={`bg-white rounded-xl shadow-lg p-6 ${className}`}>
    {title && <h2 className="text-xl font-bold mb-6 text-gray-800">{title}</h2>}
    {children}
  </section>
);

// Mobile-optimized loading spinner
const LoadingSpinner = ({ message }: { message: string }) => (
  <div className="text-center py-8">
    <div className="text-lg font-medium text-gray-700 mb-4">{message}</div>
    <div className="flex justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600"></div>
    </div>
  </div>
);

// Mobile-optimized error message
const ErrorMessage = ({ message }: { message: string }) => (
  <div className="text-center py-8">
    <div className="text-lg font-medium text-red-600 bg-red-50 rounded-lg p-4 border border-red-200">
      ⚠️ 오류: {message}
    </div>
  </div>
);

interface ProcessedData {
  type: 'wine_label' | 'receipt';
  extractedData: any;
  notionResult?: any;
  notionResults?: any[];
  savedImagePath?: string;
}

interface ConfirmationData {
  type: 'wine_label' | 'receipt';
  extractedData: any;
  savedImagePath?: string;
}

export default function MainPage() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>('');
  const [selectedType, setSelectedType] = useState<ImageType | null>(null);
  const [processedData, setProcessedData] = useState<ProcessedData | null>(null);
  const [confirmationData, setConfirmationData] = useState<ConfirmationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string>('');
  const [autoDetected, setAutoDetected] = useState<any>(null);

  const handleImageUpload = (file: File) => {
    // Store the file object
    setUploadedFile(file);
    
    // Create URL for preview
    const imageUrl = URL.createObjectURL(file);
    setUploadedImageUrl(imageUrl);
    
    // Reset state for new upload
    setSelectedType(null);
    setProcessedData(null);
    setConfirmationData(null);
    setLoading(false);
    setSuccess(false);
    setError('');
    setAutoDetected(null);
  };

  const handleTypeSelection = (type: ImageType) => {
    setSelectedType(type);
  };

  const handleAnalysis = () => {
    if (selectedType) {
      processImage(selectedType);
    }
  };

  const processImage = async (type: ImageType) => {
    if (!uploadedFile) return;
    
    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('image', uploadedFile);
    formData.append('type', type);
    formData.append('useGemini', 'true');
    formData.append('skipNotion', 'true'); // Skip Notion saving for now

    try {
      const response = await fetch('/api/process', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Show confirmation data instead of immediately saving to Notion
        setConfirmationData({
          type: result.data.type,
          extractedData: result.data.extractedData,
          savedImagePath: result.data.savedImagePath
        });
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
    if (!confirmationData) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/notion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: confirmationData.type === 'wine_label' ? 'save_wine' : 'save_receipt',
          data: confirmationData.extractedData,
          source: confirmationData.type
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setProcessedData({
          type: confirmationData.type,
          extractedData: confirmationData.extractedData,
          savedImagePath: confirmationData.savedImagePath,
          notionResult: result.result
        });
        setSuccess(true);
        setConfirmationData(null); // Clear confirmation data after saving
      } else {
        setError(result.error || result.details || '저장 중 오류가 발생했습니다');
      }
    } catch (err) {
      setError('저장 중 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSave = () => {
    setConfirmationData(null);
    setError('');
  };

  const handleEditData = (editedData: any) => {
    if (confirmationData) {
      setConfirmationData({
        ...confirmationData,
        extractedData: editedData
      });
    }
  };

  return (
    <>
      <Head>
        <title>Wine Tracker</title>
        <meta name="description" content="모바일에서 와인 라벨을 촬영하여 와인 정보를 자동으로 기록하세요" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="theme-color" content="#3B82F6" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-6 max-w-md">
          {/* Mobile-first header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">🍷 와인 추적기</h1>
            <p className="text-gray-600">라벨이나 영수증을 촬영해서 와인 정보를 기록하세요</p>
          </div>

          {/* Mobile-first single column layout */}
          <MobileLayout>
            <ProcessingStep title="📷 이미지 업로드" className="border-l-4 border-l-blue-500">
              <div data-testid="upload-area">
                <ImageUpload onUpload={handleImageUpload} />
              </div>
            </ProcessingStep>

            {uploadedImageUrl && (
              <ProcessingStep title="🎯 이미지 타입 선택" className="border-l-4 border-l-orange-500">
                <ImageTypeSelector 
                  onSelect={handleTypeSelection}
                  selected={selectedType}
                  autoDetected={autoDetected}
                />
                {selectedType && (
                  <div className="mt-6">
                    <button
                      onClick={handleAnalysis}
                      disabled={loading}
                      className="w-full py-4 px-6 bg-gradient-to-r from-green-500 to-green-600 text-white text-lg font-bold rounded-xl shadow-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transform active:scale-95"
                    >
                      {loading ? '🔄 분석 중...' : '🚀 분석하기'}
                    </button>
                  </div>
                )}
              </ProcessingStep>
            )}

            {confirmationData && (
              <ProcessingStep title="✅ 정보 확인 및 저장" className="border-l-4 border-l-purple-500">
                <DataConfirmation
                  type={confirmationData.type}
                  data={confirmationData.extractedData}
                  loading={loading}
                  error={error}
                  onConfirm={handleSaveToNotion}
                  onCancel={handleCancelSave}
                  onEdit={handleEditData}
                />
              </ProcessingStep>
            )}

            {processedData && !confirmationData && (
              <ProcessingStep title="🎉 저장 완료!" className="border-l-4 border-l-green-500">
                <div className="text-center py-6">
                  <div className="text-6xl mb-4">✅</div>
                  <h3 className="text-xl font-bold text-green-700 mb-2">Notion에 저장 완료!</h3>
                  <p className="text-gray-600 mb-6">와인 정보가 성공적으로 저장되었습니다.</p>
                  <button
                    onClick={() => {
                      setUploadedFile(null);
                      setUploadedImageUrl('');
                      setSelectedType(null);
                      setProcessedData(null);
                      setConfirmationData(null);
                      setSuccess(false);
                      setError('');
                    }}
                    className="w-full py-3 px-6 bg-blue-500 text-white font-bold rounded-xl hover:bg-blue-600 transition-colors"
                  >
                    🔄 새로운 와인 추가하기
                  </button>
                </div>
              </ProcessingStep>
            )}

            {loading && !processedData && !confirmationData && (
              <ProcessingStep title="" className="border-l-4 border-l-blue-500">
                <LoadingSpinner message="AI가 이미지를 분석하고 있습니다..." />
              </ProcessingStep>
            )}

            {error && !processedData && !confirmationData && (
              <ProcessingStep title="" className="border-l-4 border-l-red-500">
                <ErrorMessage message={error} />
              </ProcessingStep>
            )}
          </MobileLayout>

          {/* Mobile tips - always visible */}
          <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
            <h3 className="text-lg font-bold text-blue-800 mb-3">📱 촬영 팁</h3>
            <ul className="space-y-2 text-blue-700">
              <li className="flex items-start space-x-2">
                <span className="text-blue-500 mt-1">💡</span>
                <span>밝은 곳에서 촬영하세요</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-blue-500 mt-1">📐</span>
                <span>라벨이 화면에 가득 차도록 가까이 촬영하세요</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-blue-500 mt-1">🎯</span>
                <span>글씨가 선명하게 보이도록 초점을 맞추세요</span>
              </li>
            </ul>
          </div>
        </div>
      </main>
    </>
  );
}