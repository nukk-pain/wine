import React from 'react';
import { ImageProcessingItem } from './ImagePreviewGrid';

interface ProcessingProgressProps {
  items: ImageProcessingItem[];
  className?: string;
}

export function ProcessingProgress({ items, className = '' }: ProcessingProgressProps) {
  if (items.length === 0) {
    return null;
  }

  const completedCount = items.filter(item => item.status === 'completed').length;
  const processingCount = items.filter(item => item.status === 'processing').length;
  const errorCount = items.filter(item => item.status === 'error').length;
  const totalCount = items.length;
  const progressPercentage = Math.round((completedCount / totalCount) * 100);

  const getOverallStatus = () => {
    if (processingCount > 0) {
      return 'processing';
    } else if (errorCount > 0 && completedCount + errorCount === totalCount) {
      return 'partial';
    } else if (completedCount === totalCount) {
      return 'completed';
    } else {
      return 'waiting';
    }
  };

  const getStatusMessage = () => {
    const status = getOverallStatus();
    switch (status) {
      case 'processing':
        return `${processingCount}개 이미지 분석 중...`;
      case 'completed':
        return '모든 이미지 분석 완료!';
      case 'partial':
        return `${completedCount}개 완료, ${errorCount}개 오류 발생`;
      case 'waiting':
        return '분석 대기 중...';
      default:
        return '';
    }
  };

  const getProgressColor = () => {
    const status = getOverallStatus();
    switch (status) {
      case 'processing':
        return 'bg-blue-500';
      case 'completed':
        return 'bg-green-500';
      case 'partial':
        return 'bg-yellow-500';
      case 'waiting':
        return 'bg-gray-400';
      default:
        return 'bg-gray-400';
    }
  };

  const getProgressIcon = () => {
    const status = getOverallStatus();
    switch (status) {
      case 'processing':
        return '🔄';
      case 'completed':
        return '✅';
      case 'partial':
        return '⚠️';
      case 'waiting':
        return '⏳';
      default:
        return '📊';
    }
  };

  return (
    <div className={`bg-white rounded-xl shadow-lg p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-800 flex items-center space-x-2">
          <span>{getProgressIcon()}</span>
          <span>처리 진행상황</span>
        </h3>
        <div className="text-sm font-medium text-gray-600">
          {completedCount} / {totalCount}
        </div>
      </div>

      {/* 전체 진행률 바 */}
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>{getStatusMessage()}</span>
          <span>{progressPercentage}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className={`h-3 rounded-full transition-all duration-300 ${getProgressColor()}`}
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>

      {/* 상세 통계 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-2xl mb-1">⏳</div>
          <div className="text-sm font-medium text-gray-700">대기</div>
          <div className="text-lg font-bold text-gray-800">
            {items.filter(item => item.status === 'uploaded').length}
          </div>
        </div>
        
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="text-2xl mb-1">🔄</div>
          <div className="text-sm font-medium text-blue-700">처리중</div>
          <div className="text-lg font-bold text-blue-800">
            {processingCount}
          </div>
        </div>
        
        <div className="bg-green-50 rounded-lg p-3">
          <div className="text-2xl mb-1">✅</div>
          <div className="text-sm font-medium text-green-700">완료</div>
          <div className="text-lg font-bold text-green-800">
            {completedCount}
          </div>
        </div>
        
        <div className="bg-red-50 rounded-lg p-3">
          <div className="text-2xl mb-1">❌</div>
          <div className="text-sm font-medium text-red-700">오류</div>
          <div className="text-lg font-bold text-red-800">
            {errorCount}
          </div>
        </div>
      </div>

      {/* 진행 중인 이미지들의 개별 진행률 */}
      {processingCount > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">개별 진행상황</h4>
          <div className="space-y-2">
            {items
              .filter(item => item.status === 'processing')
              .map(item => (
                <div key={item.id} className="flex items-center space-x-3">
                  <div className="text-xs text-gray-600 truncate flex-1" title={item.file.name}>
                    {item.file.name}
                  </div>
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${item.progress || 0}%` }}
                    ></div>
                  </div>
                  <div className="text-xs font-medium text-gray-600 w-10 text-right">
                    {Math.round(item.progress || 0)}%
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* 오류가 있는 경우 요약 */}
      {errorCount > 0 && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2 text-red-700">
            <span>⚠️</span>
            <span className="text-sm font-medium">
              {errorCount}개 이미지에서 오류가 발생했습니다.
            </span>
          </div>
          <div className="text-xs text-red-600 mt-1">
            개별 이미지에서 재시도 버튼을 클릭하여 다시 처리할 수 있습니다.
          </div>
        </div>
      )}
    </div>
  );
}