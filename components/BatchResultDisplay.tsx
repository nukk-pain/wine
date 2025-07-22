import React, { useState } from 'react';
import { ImageProcessingItem } from './ImagePreviewGrid';

interface BatchResultDisplayProps {
  items: ImageProcessingItem[];
  onSaveAll: (completedItems: ImageProcessingItem[]) => void;
  onSaveSelected: (selectedItems: ImageProcessingItem[]) => void;
  loading?: boolean;
  className?: string;
}

interface BatchSaveResult {
  id: string;
  success: boolean;
  error?: string;
}

export function BatchResultDisplay({ 
  items, 
  onSaveAll, 
  onSaveSelected, 
  loading = false,
  className = '' 
}: BatchResultDisplayProps) {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  if (items.length === 0) {
    return null;
  }

  // Filter items by status
  const completedItems = items.filter(item => item.status === 'completed');
  const errorItems = items.filter(item => item.status === 'error');

  // Handle individual selection
  const handleItemSelection = (itemId: string, checked: boolean) => {
    const newSelection = new Set(selectedItems);
    if (checked) {
      newSelection.add(itemId);
    } else {
      newSelection.delete(itemId);
    }
    setSelectedItems(newSelection);
  };

  // Handle select all/none
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allCompletedIds = completedItems.map(item => item.id);
      setSelectedItems(new Set(allCompletedIds));
    } else {
      setSelectedItems(new Set());
    }
  };

  // Get selected items for saving
  const getSelectedItemsForSave = () => {
    return completedItems.filter(item => selectedItems.has(item.id));
  };

  // Render wine information
  const renderWineInfo = (item: ImageProcessingItem) => {
    if (!item.result || !item.result.extractedData) return null;

    const data = item.result.extractedData;
    return (
      <div className="mt-3 text-sm space-y-1">
        {data.wine_name && (
          <div className="font-medium text-gray-800">
            🍷 {data.wine_name}
          </div>
        )}
        <div className="flex flex-wrap gap-2 text-xs text-gray-600">
          {data.vintage && (
            <span className="bg-gray-100 px-2 py-1 rounded">
              📅 {data.vintage}년
            </span>
          )}
          {data.producer && (
            <span className="bg-gray-100 px-2 py-1 rounded">
              🏭 {data.producer}
            </span>
          )}
          {data.region && (
            <span className="bg-gray-100 px-2 py-1 rounded">
              📍 {data.region}
            </span>
          )}
          {data.varietal && (
            <span className="bg-gray-100 px-2 py-1 rounded">
              🍇 {data.varietal}
            </span>
          )}
          {data.price && (
            <span className="bg-gray-100 px-2 py-1 rounded">
              💰 ${data.price}
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={className}>
      {/* Summary Statistics */}
      <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
        <h3 className="text-lg font-bold text-blue-800 mb-3">📊 분석 결과 요약</h3>
        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="bg-white rounded-lg p-3">
            <div className="text-2xl mb-1">✅</div>
            <div className="text-sm font-medium text-green-700">성공</div>
            <div className="text-lg font-bold text-green-800">
              {completedItems.length}
            </div>
          </div>
          <div className="bg-white rounded-lg p-3">
            <div className="text-2xl mb-1">❌</div>
            <div className="text-sm font-medium text-red-700">실패</div>
            <div className="text-lg font-bold text-red-800">
              {errorItems.length}
            </div>
          </div>
        </div>
      </div>

      {/* Batch Save Controls */}
      {completedItems.length > 0 && (
        <div className="mb-6 bg-white rounded-xl shadow-lg p-4 border-2 border-green-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-800">💾 Notion 저장</h3>
            <div className="text-sm text-gray-600">
              {selectedItems.size} / {completedItems.length} 선택됨
            </div>
          </div>

          {/* Select All Checkbox */}
          <div className="mb-4">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedItems.size === completedItems.length && completedItems.length > 0}
                onChange={(e) => handleSelectAll(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">모든 성공한 항목 선택</span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => onSaveAll(completedItems)}
              disabled={loading || completedItems.length === 0}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed"
            >
              {loading ? '💾 저장 중...' : `✅ 모두 저장 (${completedItems.length}개)`}
            </button>
            
            <button
              onClick={() => onSaveSelected(getSelectedItemsForSave())}
              disabled={loading || selectedItems.size === 0}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed"
            >
              {loading ? '💾 저장 중...' : `📋 선택한 항목 저장 (${selectedItems.size}개)`}
            </button>
          </div>
        </div>
      )}

      {/* Success Results */}
      {completedItems.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-bold text-green-800 mb-4 flex items-center space-x-2">
            <span>✅</span>
            <span>성공한 분석 ({completedItems.length}개)</span>
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-4">
            {completedItems.map((item) => (
              <div key={item.id} className="bg-white rounded-xl shadow-lg border-2 border-green-200 overflow-hidden">
                {/* Checkbox and Image */}
                <div className="relative">
                  <img 
                    src={item.url} 
                    alt={`분석된 와인 이미지 ${item.id}`}
                    className="w-full h-32 object-cover"
                  />
                  <div className="absolute top-2 left-2">
                    <input
                      type="checkbox"
                      checked={selectedItems.has(item.id)}
                      onChange={(e) => handleItemSelection(item.id, e.target.checked)}
                      className="w-5 h-5 text-green-600 border-white border-2 rounded focus:ring-green-500 shadow-lg"
                    />
                  </div>
                  <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                    ✅ 완료
                  </div>
                </div>

                {/* Wine Information */}
                <div className="p-4">
                  <div className="text-xs text-gray-500 mb-2 truncate" title={item.file.name}>
                    📁 {item.file.name}
                  </div>
                  {renderWineInfo(item)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error Results */}
      {errorItems.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-bold text-red-800 mb-4 flex items-center space-x-2">
            <span>❌</span>
            <span>실패한 분석 ({errorItems.length}개)</span>
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-4">
            {errorItems.map((item) => (
              <div key={item.id} className="bg-white rounded-xl shadow-lg border-2 border-red-200 overflow-hidden">
                {/* Image */}
                <div className="relative">
                  <img 
                    src={item.url} 
                    alt={`실패한 와인 이미지 ${item.id}`}
                    className="w-full h-32 object-cover opacity-75"
                  />
                  <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                    ❌ 실패
                  </div>
                </div>

                {/* Error Information */}
                <div className="p-4">
                  <div className="text-xs text-gray-500 mb-2 truncate" title={item.file.name}>
                    📁 {item.file.name}
                  </div>
                  {item.error && (
                    <div className="text-sm text-red-600 bg-red-50 p-2 rounded border border-red-200">
                      ⚠️ {item.error}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {completedItems.length === 0 && errorItems.length === 0 && (
        <div className="text-center py-8">
          <div className="text-6xl mb-4">🤔</div>
          <div className="text-lg font-medium text-gray-600">분석 완료된 결과가 없습니다</div>
          <div className="text-sm text-gray-500 mt-2">먼저 이미지를 분석해주세요.</div>
        </div>
      )}
    </div>
  );
}