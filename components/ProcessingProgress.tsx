import React from 'react';
import { ImageProcessingItem } from '@/types';

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
  const uploadedCount = items.filter(item => item.status === 'uploaded').length;
  const errorCount = items.filter(item => item.status === 'error').length;
  const totalCount = items.length;
  const progressPercentage = Math.round(((completedCount + errorCount) / totalCount) * 100);

  const getOverallStatus = () => {
    if (processingCount > 0) return 'processing';
    if (errorCount > 0 && completedCount + errorCount === totalCount) return 'partial';
    if (completedCount === totalCount) return 'completed';
    return 'waiting';
  };

  const getStatusMessage = () => {
    const status = getOverallStatus();
    switch (status) {
      case 'processing':
        return `Analyzing ${processingCount} image${processingCount > 1 ? 's' : ''}...`;
      case 'completed':
        return 'All images analyzed!';
      case 'partial':
        return `${completedCount} completed, ${errorCount} error${errorCount > 1 ? 's' : ''}`;
      case 'waiting':
        return 'Waiting to analyze...';
      default:
        return '';
    }
  };

  return (
    <div className={className}>
      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm font-body mb-2">
          <span className="text-wine-creamDim">{getStatusMessage()}</span>
          <span className="text-wine-gold font-semibold">{progressPercentage}%</span>
        </div>
        <div className="w-full bg-wine-glass rounded-full h-2">
          <div
            className="h-2 rounded-full transition-all duration-300 bg-gradient-to-r from-wine-gold to-wine-goldDark"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Statistics grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="backdrop-blur-md bg-wine-glass border border-wine-glassBorder rounded-xl p-4 text-center">
          <div className="font-playfair text-2xl font-light text-wine-creamDark mb-1">
            {uploadedCount}
          </div>
          <div className="font-body text-xs text-wine-creamDark uppercase tracking-wide">
            Waiting
          </div>
        </div>

        <div className="backdrop-blur-md bg-wine-glass border border-wine-glassBorder rounded-xl p-4 text-center">
          <div className="font-playfair text-2xl font-light text-wine-gold mb-1">
            {processingCount}
          </div>
          <div className="font-body text-xs text-wine-creamDark uppercase tracking-wide">
            Processing
          </div>
        </div>

        <div className="backdrop-blur-md bg-wine-glass border border-wine-glassBorder rounded-xl p-4 text-center">
          <div className="font-playfair text-2xl font-light text-wine-gold mb-1">
            {completedCount}
          </div>
          <div className="font-body text-xs text-wine-creamDark uppercase tracking-wide">
            Completed
          </div>
        </div>

        <div className="backdrop-blur-md bg-wine-glass border border-wine-glassBorder rounded-xl p-4 text-center">
          <div className="font-playfair text-2xl font-light text-wine-red mb-1">
            {errorCount}
          </div>
          <div className="font-body text-xs text-wine-creamDark uppercase tracking-wide">
            Errors
          </div>
        </div>
      </div>

      {/* Currently processing items */}
      {processingCount > 0 && (
        <div className="mt-6">
          <h4 className="font-body text-sm font-medium text-wine-creamDim mb-3">Processing now</h4>
          <div className="space-y-2">
            {items
              .filter(item => item.status === 'processing')
              .map(item => (
                <div key={item.id} className="backdrop-blur-md bg-wine-glass border border-wine-gold/30 rounded-lg p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                      <img src={item.preview} className="w-full h-full object-cover" alt="" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-body text-wine-cream text-sm font-medium truncate">
                        {item.file.name}
                      </p>
                      <div className="w-full bg-wine-glass rounded-full h-1.5 mt-1">
                        <div
                          className="bg-wine-gold h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${item.progress || 0}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-xs font-body font-medium text-wine-gold">
                      {Math.round(item.progress || 0)}%
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Error summary */}
      {errorCount > 0 && (
        <div className="mt-6 p-4 bg-wine-red/10 border border-wine-red/40 rounded-xl">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-wine-red flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="flex-1">
              <p className="font-body text-sm font-medium text-wine-red">
                {errorCount} image{errorCount > 1 ? 's' : ''} failed to process
              </p>
              <p className="font-body text-xs text-wine-red/80 mt-1">
                Use the retry button on individual images to process again.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
