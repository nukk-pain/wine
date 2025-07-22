import React from 'react';

export interface ImageProcessingItem {
  id: string;
  file: File;
  url: string;
  status: 'uploaded' | 'processing' | 'completed' | 'error';
  result?: any;
  error?: string;
  progress?: number;
  uploadResult?: any;
}

interface ImagePreviewGridProps {
  items: ImageProcessingItem[];
  onRemove: (id: string) => void;
  onRetry?: (id: string) => void;
  className?: string;
}

export function ImagePreviewGrid({ 
  items, 
  onRemove, 
  onRetry, 
  className = '' 
}: ImagePreviewGridProps) {
  const getStatusIcon = (status: ImageProcessingItem['status']) => {
    switch (status) {
      case 'uploaded':
        return '⏳';
      case 'processing':
        return '🔄';
      case 'completed':
        return '✅';
      case 'error':
        return '❌';
      default:
        return '📷';
    }
  };

  const getStatusText = (status: ImageProcessingItem['status']) => {
    switch (status) {
      case 'uploaded':
        return '대기중';
      case 'processing':
        return '분석중';
      case 'completed':
        return '완료';
      case 'error':
        return '오류';
      default:
        return '준비';
    }
  };

  const getStatusColor = (status: ImageProcessingItem['status']) => {
    switch (status) {
      case 'uploaded':
        return 'bg-gray-100 text-gray-700';
      case 'processing':
        return 'bg-blue-100 text-blue-700';
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'error':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  if (items.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-800">
          📸 선택된 이미지 ({items.length}개)
        </h3>
        <div className="text-sm text-gray-600">
          완료: {items.filter(item => item.status === 'completed').length} / 
          전체: {items.length}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {items.map((item) => (
          <div key={item.id} className="relative bg-white rounded-xl shadow-lg border-2 border-gray-200 overflow-hidden">
            {/* 이미지 */}
            <div className="aspect-square relative">
              <img 
                src={item.url} 
                alt={`와인 이미지 ${item.id}`}
                className="w-full h-full object-cover"
              />
              
              {/* 진행률 오버레이 (processing 상태일 때) */}
              {item.status === 'processing' && item.progress && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <div className="text-white text-center">
                    <div className="text-2xl mb-2">🔄</div>
                    <div className="text-sm">{Math.round(item.progress)}%</div>
                  </div>
                </div>
              )}
              
              {/* 상태 표시 */}
              <div className={`absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-bold ${getStatusColor(item.status)}`}>
                <span className="mr-1">{getStatusIcon(item.status)}</span>
                {getStatusText(item.status)}
              </div>

              {/* 제거 버튼 */}
              <button
                onClick={() => onRemove(item.id)}
                className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs font-bold hover:bg-red-600 transition-colors flex items-center justify-center"
                aria-label={`${item.file.name} 제거`}
              >
                ×
              </button>
            </div>

            {/* 파일 정보 */}
            <div className="p-3">
              <div className="text-sm font-medium text-gray-800 truncate" title={item.file.name}>
                {item.file.name}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {(item.file.size / 1024 / 1024).toFixed(1)}MB
              </div>
              
              {/* 에러 메시지 */}
              {item.status === 'error' && item.error && (
                <div className="text-xs text-red-600 mt-2 truncate" title={item.error}>
                  {item.error}
                </div>
              )}
              
              {/* 재시도 버튼 */}
              {item.status === 'error' && onRetry && (
                <button
                  onClick={() => onRetry(item.id)}
                  className="mt-2 w-full py-1 px-2 bg-blue-500 text-white text-xs rounded-md hover:bg-blue-600 transition-colors"
                >
                  🔄 재시도
                </button>
              )}
              
              {/* 결과 미리보기 */}
              {item.status === 'completed' && item.result && (
                <div className="mt-2 text-xs text-green-600">
                  {(item.result.extractedData?.Name || item.result.extractedData?.wine_name) && (
                    <div className="truncate" title={item.result.extractedData.Name || item.result.extractedData.wine_name}>
                      🍷 {item.result.extractedData.Name || item.result.extractedData.wine_name}
                    </div>
                  )}
                  {(item.result.extractedData?.Vintage || item.result.extractedData?.vintage) && (
                    <div>{item.result.extractedData.Vintage || item.result.extractedData.vintage}년</div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}