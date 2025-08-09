import React, { useState } from 'react';
import { ImageProcessingItem } from './ImagePreviewGrid';
import { NotionWineProperties } from '@/lib/notion-schema';
import { DebugInfo } from './DebugInfo';

interface BatchResultDisplayProps {
  items: ImageProcessingItem[];
  onSaveAll: (completedItems: ImageProcessingItem[]) => void;
  onSaveSelected: (selectedItems: ImageProcessingItem[]) => void;
  onSaveIndividual?: (itemId: string, wineData: NotionWineProperties) => Promise<boolean>;
  onAddManual?: (wineData: NotionWineProperties) => Promise<boolean>;
  onRetryAnalysis?: (itemId: string) => Promise<void>;
  onDelete?: (itemId: string) => void;
  loading?: boolean;
  className?: string;
}

interface EditingState {
  [itemId: string]: {
    isEditing: boolean;
    editedData: NotionWineProperties;
    originalData: NotionWineProperties;
    isSaving: boolean;
  };
}

interface ManualWineEntry {
  id: string;
  isEditing: boolean;
  editedData: NotionWineProperties;
  isSaving: boolean;
}

interface BatchSaveResult {
  id: string;
  success: boolean;
  error?: string;
}

export function WineBatchResultDisplay({ 
  items, 
  onSaveAll, 
  onSaveSelected, 
  onSaveIndividual,
  onAddManual,
  onRetryAnalysis,
  onDelete,
  loading = false,
  className = '' 
}: BatchResultDisplayProps) {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [editingState, setEditingState] = useState<EditingState>({});
  const [manualWines, setManualWines] = useState<ManualWineEntry[]>([]);

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

  // Convert extracted data to Notion format
  const convertToNotionFormat = (extractedData: any): NotionWineProperties => {
    return {
      'Name': extractedData.Name || extractedData.wine_name || '',
      'Vintage': extractedData.Vintage || extractedData.vintage ? parseInt(extractedData.Vintage || extractedData.vintage) : null,
      'Region/Producer': extractedData['Region/Producer'] || [extractedData.region, extractedData.producer].filter(Boolean).join(', ') || '',
      'Price': extractedData.Price || extractedData.price ? parseFloat(extractedData.Price || extractedData.price) : null,
      'Quantity': extractedData.Quantity || 1,
      'Store': extractedData.Store || '',
      'Varietal(품종)': Array.isArray(extractedData['Varietal(품종)']) ? extractedData['Varietal(품종)'] : (extractedData.varietal ? [extractedData.varietal] : []),
      'Image': null
    };
  };

  // Start editing an item
  const startEditing = (itemId: string, extractedData: any) => {
    const notionData = convertToNotionFormat(extractedData);
    setEditingState(prev => ({
      ...prev,
      [itemId]: {
        isEditing: true,
        editedData: notionData,
        originalData: notionData,
        isSaving: false
      }
    }));
  };

  // Cancel editing
  const cancelEditing = (itemId: string) => {
    setEditingState(prev => {
      const newState = { ...prev };
      delete newState[itemId];
      return newState;
    });
  };

  // Update edited data
  const updateEditedData = (itemId: string, updates: Partial<NotionWineProperties>) => {
    setEditingState(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        editedData: { ...prev[itemId].editedData, ...updates }
      }
    }));
  };

  // Save individual item
  const saveIndividualItem = async (itemId: string) => {
    const editState = editingState[itemId];
    if (!editState) return;

    setEditingState(prev => ({
      ...prev,
      [itemId]: { ...prev[itemId], isSaving: true }
    }));

    // Simulate saving delay
    setTimeout(() => {
      // Update the actual item data with edited values
      const item = items.find(item => item.id === itemId);
      if (item && item.result && item.result.extractedData) {
        // Update the extracted data with edited values
        Object.assign(item.result.extractedData, {
          Name: editState.editedData.Name,
          Vintage: editState.editedData.Vintage,
          'Region/Producer': editState.editedData['Region/Producer'],
          Price: editState.editedData.Price,
          Quantity: editState.editedData.Quantity,
          Store: editState.editedData.Store,
          'Varietal(품종)': editState.editedData['Varietal(품종)']
        });
      }

      // Clear editing state and show success
      setEditingState(prev => {
        const newState = { ...prev };
        delete newState[itemId];
        return newState;
      });
      
      // Show success message
      alert('✅ 수정내용이 저장되었습니다!');
    }, 500);
  };

  // Add manual wine entry
  const addManualWine = () => {
    const newManualWine: ManualWineEntry = {
      id: `manual-${Date.now()}`,
      isEditing: true,
      editedData: {
        'Name': '',
        'Vintage': null,
        'Region/Producer': '',
        'Price': null,
        'Quantity': 1,
        'Store': '',
        'Varietal(품종)': [],
        'Image': null
      },
      isSaving: false
    };
    
    setManualWines(prev => [...prev, newManualWine]);
  };

  // Update manual wine data
  const updateManualWineData = (id: string, updates: Partial<NotionWineProperties>) => {
    setManualWines(prev => 
      prev.map(wine => 
        wine.id === id 
          ? { ...wine, editedData: { ...wine.editedData, ...updates } }
          : wine
      )
    );
  };

  // Save manual wine
  const saveManualWine = async (id: string) => {
    if (!onAddManual) return;
    
    const manualWine = manualWines.find(wine => wine.id === id);
    if (!manualWine) return;

    setManualWines(prev => 
      prev.map(wine => 
        wine.id === id 
          ? { ...wine, isSaving: true }
          : wine
      )
    );

    try {
      const success = await onAddManual(manualWine.editedData);
      if (success) {
        // Remove from manual wines list on success
        setManualWines(prev => prev.filter(wine => wine.id !== id));
      } else {
        // Reset saving state on failure
        setManualWines(prev => 
          prev.map(wine => 
            wine.id === id 
              ? { ...wine, isSaving: false }
              : wine
          )
        );
      }
    } catch (error) {
      setManualWines(prev => 
        prev.map(wine => 
          wine.id === id 
            ? { ...wine, isSaving: false }
            : wine
        )
      );
    }
  };

  // Cancel manual wine entry
  const cancelManualWine = (id: string) => {
    setManualWines(prev => prev.filter(wine => wine.id !== id));
  };

  // Validate wine data
  const validateWineData = (data: NotionWineProperties) => {
    const errors: { [key: string]: string } = {};
    const warnings: { [key: string]: string } = {};
    
    // Required field validation
    if (!data.Name || data.Name.trim() === '') {
      errors.Name = '와인 이름은 필수입니다';
    } else if (data.Name.length > 100) {
      warnings.Name = '와인 이름이 너무 깁니다 (100자 이하 권장)';
    }
    
    // Vintage validation
    if (data.Vintage !== null) {
      const currentYear = new Date().getFullYear();
      if (data.Vintage < 1800 || data.Vintage > currentYear + 5) {
        warnings.Vintage = `빈티지가 비현실적입니다 (1800-${currentYear + 5})`;
      }
    }
    
    // Price validation
    if (data.Price !== null && data.Price < 0) {
      errors.Price = '가격은 0 이상이어야 합니다';
    } else if (data.Price !== null && data.Price > 100000) {
      warnings.Price = '가격이 매우 높습니다. 단위를 확인해주세요';
    }
    
    // Quantity validation
    if (data.Quantity !== null && (data.Quantity < 1 || data.Quantity > 1000)) {
      errors.Quantity = '수량은 1-1000 범위에 있어야 합니다';
    }
    
    return {
      errors,
      warnings,
      isValid: Object.keys(errors).length === 0
    };
  };

  // Get validation for a specific item
  const getValidationForItem = (itemId: string, isManual: boolean = false) => {
    if (isManual) {
      const manualWine = manualWines.find(wine => wine.id === itemId);
      return manualWine ? validateWineData(manualWine.editedData) : { errors: {}, warnings: {}, isValid: false };
    } else {
      const editState = editingState[itemId];
      return editState ? validateWineData(editState.editedData) : { errors: {}, warnings: {}, isValid: false };
    }
  };

  // Render wine information in read-only mode
  const renderWineInfo = (item: ImageProcessingItem) => {
    if (!item.result || !item.result.extractedData) return null;

    const data = item.result.extractedData;
    const editState = editingState[item.id];
    
    if (editState && editState.isEditing) {
      return renderEditingForm(item.id, editState);
    }

    return (
      <div className="mt-3 space-y-3">
        {/* Debug information for development */}
        <DebugInfo 
          data={item.result} 
          title="API 응답 데이터"
        />
        
        {(data.Name || data.wine_name) && (
          <div className="text-lg font-bold text-gray-900">
            {data.Name || data.wine_name}
          </div>
        )}
        <div className="space-y-2 text-sm">
          {(data.Vintage || data.vintage) && (
            <div className="flex items-center">
              <span className="text-gray-600 w-24">📅 빈티지:</span>
              <span className="text-gray-800 font-medium">{data.Vintage || data.vintage}년</span>
            </div>
          )}
          {(data['Region/Producer'] || data.producer || data.region) && (
            <div className="flex items-center">
              <span className="text-gray-600 w-24">🏭 생산자:</span>
              <span className="text-gray-800">{data['Region/Producer'] || data.producer || data.region}</span>
            </div>
          )}
          {(data['Varietal(품종)'] || data.varietal) && (
            <div className="flex items-center">
              <span className="text-gray-600 w-24">🍇 품종:</span>
              <span className="text-gray-800">{Array.isArray(data['Varietal(품종)']) ? data['Varietal(품종)'].join(', ') : data['Varietal(품종)'] || data.varietal}</span>
            </div>
          )}
          {(data.Price || data.price) && (
            <div className="flex items-center">
              <span className="text-gray-600 w-24">💰 가격:</span>
              <span className="text-gray-800 font-medium">${data.Price || data.price}</span>
            </div>
          )}
          {(data.Quantity || data.quantity) && (
            <div className="flex items-center">
              <span className="text-gray-600 w-24">📦 수량:</span>
              <span className="text-gray-800">{data.Quantity || data.quantity}병</span>
            </div>
          )}
          {(data.Store || data.store) && (
            <div className="flex items-center">
              <span className="text-gray-600 w-24">🏪 구매처:</span>
              <span className="text-gray-800">{data.Store || data.store}</span>
            </div>
          )}
        </div>
        
        {/* Action Buttons */}
        <div className="space-y-2 pt-2">
          {/* Primary Actions */}
          <div className="flex space-x-2">
            <button
              onClick={() => startEditing(item.id, data)}
              className="flex-1 bg-blue-500 text-white py-2 px-3 rounded-lg text-xs font-medium hover:bg-blue-600 transition-colors"
            >
              ✏️ 편집
            </button>
            {onSaveIndividual && (
              <button
                onClick={() => {
                  const notionData = convertToNotionFormat(data);
                  onSaveIndividual(item.id, notionData);
                }}
                className="flex-1 bg-green-500 text-white py-2 px-3 rounded-lg text-xs font-medium hover:bg-green-600 transition-colors"
              >
                💾 저장
              </button>
            )}
          </div>
          
          {/* Quick Actions */}
          {(onRetryAnalysis || onDelete) && (
            <div className="flex space-x-2">
              {onRetryAnalysis && (
                <button
                  onClick={() => {
                    if (window.confirm('이 이미지를 다시 분석하시겠습니까? 현재 결과가 새로운 결과로 교체됩니다.')) {
                      onRetryAnalysis(item.id);
                    }
                  }}
                  className="flex-1 bg-orange-500 text-white py-1 px-2 rounded text-xs font-medium hover:bg-orange-600 transition-colors"
                  title="Gemini API로 이미지 재분석"
                >
                  🔄 재요청
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => {
                    if (window.confirm('이 와인 결과를 삭제하시겠습니까?')) {
                      onDelete(item.id);
                    }
                  }}
                  className="flex-1 bg-red-500 text-white py-1 px-2 rounded text-xs font-medium hover:bg-red-600 transition-colors"
                  title="이 와인 결과 삭제"
                >
                  🗑️ 삭제
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render editing form
  const renderEditingForm = (itemId: string, editState: EditingState[string]) => {
    const { editedData, isSaving } = editState;
    
    return (
      <div className="mt-3 space-y-3">
        {/* Wine Name */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            와인 이름 *
          </label>
          <input
            type="text"
            value={editedData.Name}
            onChange={(e) => updateEditedData(itemId, { Name: e.target.value })}
            className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 ${
              getValidationForItem(itemId).errors.Name 
                ? 'border-red-300 focus:ring-red-500' 
                : getValidationForItem(itemId).warnings.Name
                ? 'border-yellow-300 focus:ring-yellow-500'
                : 'border-gray-300 focus:ring-blue-500'
            }`}
            placeholder="와인 이름을 입력하세요"
            disabled={isSaving}
          />
          {getValidationForItem(itemId).errors.Name && (
            <div className="text-xs text-red-600 mt-1">
              ⚠️ {getValidationForItem(itemId).errors.Name}
            </div>
          )}
          {getValidationForItem(itemId).warnings.Name && (
            <div className="text-xs text-yellow-600 mt-1">
              ⚠️ {getValidationForItem(itemId).warnings.Name}
            </div>
          )}
        </div>

        {/* Vintage and Price */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              빈티지
            </label>
            <input
              type="number"
              value={editedData.Vintage || ''}
              onChange={(e) => updateEditedData(itemId, { Vintage: e.target.value ? parseInt(e.target.value) : null })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="2020"
              disabled={isSaving}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              가격
            </label>
            <input
              type="number"
              step="0.01"
              value={editedData.Price || ''}
              onChange={(e) => updateEditedData(itemId, { Price: e.target.value ? parseFloat(e.target.value) : null })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0.00"
              disabled={isSaving}
            />
          </div>
        </div>

        {/* Region/Producer */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            지역/생산자
          </label>
          <input
            type="text"
            value={editedData['Region/Producer']}
            onChange={(e) => updateEditedData(itemId, { 'Region/Producer': e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="예: 나파 밸리, 보르도"
            disabled={isSaving}
          />
        </div>

        {/* Varietal and Store */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              품종
            </label>
            <input
              type="text"
              value={editedData['Varietal(품종)'].join(', ')}
              onChange={(e) => {
                const varietals = e.target.value.split(',').map(v => v.trim()).filter(v => v);
                updateEditedData(itemId, { 'Varietal(품종)': varietals });
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="카베르네 소비뇽"
              disabled={isSaving}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              구매처
            </label>
            <input
              type="text"
              value={editedData.Store}
              onChange={(e) => updateEditedData(itemId, { Store: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="와인샵"
              disabled={isSaving}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2 pt-2">
          <button
            onClick={() => saveIndividualItem(itemId)}
            disabled={isSaving || !getValidationForItem(itemId).isValid}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-colors ${
              getValidationForItem(itemId).isValid
                ? 'bg-green-500 text-white hover:bg-green-600'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            title={!getValidationForItem(itemId).isValid ? '필수 정보를 모두 입력하고 오류를 수정해주세요' : ''}
          >
            {isSaving ? '⚙️ 수정 중...' : getValidationForItem(itemId).isValid ? '✅ 수정완료' : '⚠️ 오류 수정 필요'}
          </button>
          <button
            onClick={() => cancelEditing(itemId)}
            disabled={isSaving}
            className="flex-1 bg-gray-400 text-white py-2 px-3 rounded-lg text-xs font-medium hover:bg-gray-500 disabled:opacity-50 transition-colors"
          >
            취소
          </button>
        </div>
      </div>
    );
  };

  // Render manual wine form
  const renderManualWineForm = (manualWine: ManualWineEntry) => {
    const { id, editedData, isSaving } = manualWine;
    
    return (
      <div className="bg-white rounded-xl shadow-lg border-2 border-dashed border-blue-300 p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-blue-800 flex items-center space-x-2">
            <span>➕</span>
            <span>수동으로 와인 추가</span>
          </h4>
        </div>
        
        <div className="space-y-3">
          {/* Wine Name */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              와인 이름 *
            </label>
            <input
              type="text"
              value={editedData.Name}
              onChange={(e) => updateManualWineData(id, { Name: e.target.value })}
              className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 ${
                getValidationForItem(id, true).errors.Name 
                  ? 'border-red-300 focus:ring-red-500' 
                  : getValidationForItem(id, true).warnings.Name
                  ? 'border-yellow-300 focus:ring-yellow-500'
                  : 'border-gray-300 focus:ring-blue-500'
              }`}
              placeholder="와인 이름을 입력하세요"
              disabled={isSaving}
              autoFocus
            />
            {getValidationForItem(id, true).errors.Name && (
              <div className="text-xs text-red-600 mt-1">
                ⚠️ {getValidationForItem(id, true).errors.Name}
              </div>
            )}
            {getValidationForItem(id, true).warnings.Name && (
              <div className="text-xs text-yellow-600 mt-1">
                ⚠️ {getValidationForItem(id, true).warnings.Name}
              </div>
            )}
          </div>

          {/* Vintage and Price */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                빈티지
              </label>
              <input
                type="number"
                value={editedData.Vintage || ''}
                onChange={(e) => updateManualWineData(id, { Vintage: e.target.value ? parseInt(e.target.value) : null })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="2020"
                disabled={isSaving}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                가격
              </label>
              <input
                type="number"
                step="0.01"
                value={editedData.Price || ''}
                onChange={(e) => updateManualWineData(id, { Price: e.target.value ? parseFloat(e.target.value) : null })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
                disabled={isSaving}
              />
            </div>
          </div>

          {/* Region/Producer */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              지역/생산자
            </label>
            <input
              type="text"
              value={editedData['Region/Producer']}
              onChange={(e) => updateManualWineData(id, { 'Region/Producer': e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="예: 나파 밸리, 보르도"
              disabled={isSaving}
            />
          </div>

          {/* Varietal and Store */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                품종
              </label>
              <input
                type="text"
                value={editedData['Varietal(품종)'].join(', ')}
                onChange={(e) => {
                  const varietals = e.target.value.split(',').map(v => v.trim()).filter(v => v);
                  updateManualWineData(id, { 'Varietal(품종)': varietals });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="카베르네 소비뇽"
                disabled={isSaving}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                구매처
              </label>
              <input
                type="text"
                value={editedData.Store}
                onChange={(e) => updateManualWineData(id, { Store: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="와인샵"
                disabled={isSaving}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2 pt-2">
            <button
              onClick={() => saveManualWine(id)}
              disabled={isSaving || !getValidationForItem(id, true).isValid}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-colors ${
                getValidationForItem(id, true).isValid
                  ? 'bg-green-500 text-white hover:bg-green-600'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              title={!getValidationForItem(id, true).isValid ? '필수 정보를 모두 입력하고 오류를 수정해주세요' : ''}
            >
              {isSaving ? '💾 저장 중...' : getValidationForItem(id, true).isValid ? '💾 저장' : '⚠️ 오류 수정 필요'}
            </button>
            <button
              onClick={() => cancelManualWine(id)}
              disabled={isSaving}
              className="flex-1 bg-gray-400 text-white py-2 px-3 rounded-lg text-xs font-medium hover:bg-gray-500 disabled:opacity-50 transition-colors"
            >
              취소
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={className}>
      {/* Summary Statistics */}
      <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
        <h3 className="text-lg font-bold text-blue-800 mb-3">📊 분석 결과 요약</h3>
        <div className="grid grid-cols-2 gap-4 text-center mb-4">
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
        
        {/* Validation Summary */}
        {(completedItems.length > 0 || manualWines.length > 0) && (
          <div className="bg-white rounded-lg p-3 border-t border-blue-200">
            <div className="text-sm font-medium text-blue-800 mb-2">📄 유효성 검사</div>
            <div className="flex space-x-4 text-xs">
              <div className="text-green-600">
                ✅ 유효: {completedItems.filter(item => {
                  const editState = editingState[item.id];
                  return editState ? validateWineData(editState.editedData).isValid : true;
                }).length + manualWines.filter(wine => validateWineData(wine.editedData).isValid).length}
              </div>
              <div className="text-yellow-600">
                ⚠️ 경고: {completedItems.filter(item => {
                  const editState = editingState[item.id];
                  return editState ? Object.keys(validateWineData(editState.editedData).warnings).length > 0 : false;
                }).length + manualWines.filter(wine => Object.keys(validateWineData(wine.editedData).warnings).length > 0).length}
              </div>
              <div className="text-red-600">
                ❌ 오류: {completedItems.filter(item => {
                  const editState = editingState[item.id];
                  return editState ? !validateWineData(editState.editedData).isValid : false;
                }).length + manualWines.filter(wine => !validateWineData(wine.editedData).isValid).length}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Manual Wine Button */}
      {onAddManual && (
        <div className="mb-6">
          <button
            onClick={addManualWine}
            className="w-full py-3 px-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white font-bold rounded-xl shadow-lg hover:from-purple-600 hover:to-purple-700 transition-all duration-200 transform active:scale-95"
          >
            ➕ 수동으로 와인 추가
          </button>
        </div>
      )}

      {/* Manual Wine Entries */}
      {manualWines.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-bold text-purple-800 mb-4 flex items-center space-x-2">
            <span>➕</span>
            <span>수동 추가 와인 ({manualWines.length}개)</span>
          </h3>
          
          <div className="grid grid-cols-1 gap-6">
            {manualWines.map((manualWine) => (
              <div key={manualWine.id}>
                {renderManualWineForm(manualWine)}
              </div>
            ))}
          </div>
        </div>
      )}

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
          
          <div className="grid grid-cols-1 gap-6">
            {completedItems.map((item) => (
              <div key={item.id} className="bg-white rounded-xl shadow-lg border-2 border-green-200 overflow-hidden">
                {/* Checkbox and Image */}
                <div className="relative">
                  <img 
                    src={item.url} 
                    alt={`분석된 와인 이미지 ${item.id}`}
                    className="w-full h-64 object-contain bg-gray-50"
                  />
                  <div className="absolute top-3 left-3">
                    <input
                      type="checkbox"
                      checked={selectedItems.has(item.id)}
                      onChange={(e) => handleItemSelection(item.id, e.target.checked)}
                      className="w-6 h-6 text-green-600 border-white border-2 rounded focus:ring-green-500 shadow-lg"
                    />
                  </div>
                  <div className="absolute top-3 right-3 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                    ✅ 분석 완료
                  </div>
                </div>

                {/* Wine Information */}
                <div className="p-6">
                  <div className="text-sm text-gray-500 mb-3" title={item.file.name}>
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
          
          <div className="grid grid-cols-1 gap-6">
            {errorItems.map((item) => (
              <div key={item.id} className="bg-white rounded-xl shadow-lg border-2 border-red-200 overflow-hidden">
                {/* Image */}
                <div className="relative">
                  <img 
                    src={item.url} 
                    alt={`실패한 와인 이미지 ${item.id}`}
                    className="w-full h-64 object-contain bg-gray-50 opacity-75"
                  />
                  <div className="absolute top-3 right-3 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                    ❌ 분석 실패
                  </div>
                </div>

                {/* Error Information */}
                <div className="p-6">
                  <div className="text-sm text-gray-500 mb-3" title={item.file.name}>
                    📁 {item.file.name}
                  </div>
                  {item.error && (
                    <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
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