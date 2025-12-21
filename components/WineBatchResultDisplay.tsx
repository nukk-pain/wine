import React, { useState, useMemo } from 'react';
import { ImageProcessingItem, NotionWineProperties } from '@/types';
import { WineInfoCard } from './WineInfoCard';
import { WineEditForm } from './WineEditForm';
import { ManualWineForm } from './ManualWineForm';
import { useWineSelection } from '@/hooks/useWineSelection';

// Output input item structure from pages/index.tsx (Legacy)
// It has 'url' but not 'preview', and result.extractedData
interface LegacyInputItem {
  id: string;
  file: File;
  url?: string;
  preview?: string;
  status: any;
  result?: {
    extractedData?: any;
  };
  extractedData?: any;
  [key: string]: any;
}

interface BatchResultDisplayProps {
  items: LegacyInputItem[]; // Accept legacy input
  onSaveAll: (completedItems: any[]) => void;
  onSaveSelected: (selectedItems: any[]) => void;
  onSaveIndividual?: (itemId: string, wineData: NotionWineProperties) => Promise<boolean>;
  onAddManual?: (wineData: NotionWineProperties) => Promise<boolean>;
  onRetryAnalysis?: (itemId: string) => Promise<void>;
  onDelete?: (itemId: string) => void;
  loading?: boolean;
  className?: string;
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

  // Normalize items to ensure extractedData and preview are available
  // and convert to strict ImageProcessingItem type for internal use
  const normalizedItems: ImageProcessingItem[] = useMemo(() => {
    return items.map(item => {
      const normalized: any = {
        ...item,
        preview: item.preview || item.url || '', // Map legacy url to preview
        uploadedUrl: item.uploadedUrl || item.url, // Map legacy url to uploadedUrl
        extractedData: item.extractedData || item.result?.extractedData // Map legacy extractedData
      };

      // Ensure we match ImageProcessingItem structure
      return normalized as ImageProcessingItem;
    });
  }, [items]);

  const completedItems = normalizedItems.filter(item => item.status === 'completed' || item.status === 'saved');
  const errorItems = normalizedItems.filter(item => item.status === 'error');

  const {
    selectedIds,
    isSelected,
    toggleSelection,
    selectAll,
    selectedCount
  } = useWineSelection();

  // Editing state: map of itemId -> boolean
  const [editingIds, setEditingIds] = useState<Set<string>>(new Set());

  // Manual wine forms state: array of unique IDs for manual entry forms
  const [manualForms, setManualForms] = useState<string[]>([]);

  // Selection handlers
  const handleSelect = (id: string, checked: boolean) => {
    toggleSelection(id);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      selectAll(completedItems.map(item => item.id));
    } else {
      selectAll([]);
    }
  };

  // Editing handlers
  const handleEdit = (id: string) => {
    setEditingIds(prev => new Set(prev).add(id));
  };

  const handleCancelEdit = (id: string) => {
    setEditingIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const handleSaveEdit = (id: string, updatedData: NotionWineProperties) => {
    console.log('[WineBatchResultDisplay] handleSaveEdit (local update) for id:', id);

    if (onSaveIndividual) {
      // This now only updates local state, not sending to Google Sheets
      onSaveIndividual(id, updatedData).then(success => {
        if (success) {
          handleCancelEdit(id); // Close edit mode
        }
      });
    }
  };

  // Manual wine handlers
  const addManualForm = () => {
    setManualForms(prev => [...prev, `manual-${Date.now()}`]);
  };

  const removeManualForm = (id: string) => {
    setManualForms(prev => prev.filter(formId => formId !== id));
  };

  const handleManualSubmit = (id: string, data: NotionWineProperties) => {
    if (onAddManual) {
      onAddManual(data).then(success => {
        if (success) {
          removeManualForm(id);
        }
      });
    }
  };

  if (normalizedItems.length === 0 && manualForms.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      {/* Summary Statistics */}
      <div className="mb-6 backdrop-blur-xl bg-wine-glass border border-wine-glassBorder rounded-2xl p-5">
        <h3 className="font-playfair text-xl text-wine-cream font-normal mb-4">Analysis Summary</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="backdrop-blur-md bg-wine-glass border border-wine-glassBorder rounded-xl p-4 text-center">
            <div className="font-playfair text-2xl font-light text-wine-gold mb-1">
              {completedItems.length}
            </div>
            <div className="font-body text-xs text-wine-creamDark uppercase tracking-wide">
              Completed
            </div>
          </div>
          <div className="backdrop-blur-md bg-wine-glass border border-wine-glassBorder rounded-xl p-4 text-center">
            <div className="font-playfair text-2xl font-light text-wine-red mb-1">
              {errorItems.length}
            </div>
            <div className="font-body text-xs text-wine-creamDark uppercase tracking-wide">
              Errors
            </div>
          </div>
        </div>
      </div>

      {/* Add Manual Wine Button */}
      {onAddManual && (
        <div className="mb-6">
          <button
            onClick={addManualForm}
            className="w-full py-4 px-6 min-h-[56px] bg-wine-glass border border-wine-gold/50 text-wine-gold font-body font-medium text-base rounded-xl hover:bg-wine-gold/10 transition-all duration-200 active:scale-95"
          >
            Add Wine Manually
          </button>
        </div>
      )}

      {/* Manual Wine Forms */}
      {manualForms.length > 0 && (
        <div className="mb-6">
          <h3 className="font-playfair text-xl text-wine-cream font-normal mb-4">
            Manual Entries ({manualForms.length})
          </h3>
          <div className="grid grid-cols-1 gap-6">
            {manualForms.map(formId => (
              <ManualWineForm
                key={formId}
                onSubmit={(data) => handleManualSubmit(formId, data)}
                onCancel={() => removeManualForm(formId)}
                isSubmitting={loading}
              />
            ))}
          </div>
        </div>
      )}

      {/* Batch Save Controls */}
      {completedItems.length > 0 && (
        <div className="mb-6 backdrop-blur-xl bg-wine-glass border border-wine-gold/30 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-playfair text-xl text-wine-cream font-normal">Save to Notion</h3>
            <div className="font-body text-sm text-wine-creamDim">
              {selectedCount} / {completedItems.length} selected
            </div>
          </div>

          <div className="mb-5">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedCount === completedItems.length && completedItems.length > 0}
                onChange={(e) => handleSelectAll(e.target.checked)}
                className="w-5 h-5 rounded border-2 border-wine-gold/50 bg-wine-dark/50 backdrop-blur-sm checked:bg-wine-gold checked:border-wine-gold focus:ring-2 focus:ring-wine-gold/50 focus:ring-offset-0 transition-all duration-200"
              />
              <span className="font-body text-sm font-medium text-wine-cream">Select all completed items</span>
            </label>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => onSaveAll(items.filter(item => item.status === 'completed' || item.status === 'saved'))}
              disabled={loading || completedItems.length === 0}
              className="flex-1 py-4 px-5 min-h-[56px] bg-gradient-to-r from-wine-gold to-wine-goldDark text-wine-dark font-body font-semibold text-base rounded-xl shadow-wine hover:shadow-wine-lg transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
            >
              {loading ? 'Saving...' : `Save All (${completedItems.length})`}
            </button>

            <button
              onClick={() => {
                const selected = items.filter(item => isSelected(item.id));
                onSaveSelected(selected);
              }}
              disabled={loading || selectedCount === 0}
              className="flex-1 py-4 px-5 min-h-[56px] bg-wine-glass border border-wine-gold/50 text-wine-gold font-body font-semibold text-base rounded-xl hover:bg-wine-gold/10 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
            >
              {loading ? 'Saving...' : `Save Selected (${selectedCount})`}
            </button>
          </div>
        </div>
      )}

      {/* Processed Items List */}
      <div className="grid grid-cols-1 gap-6">
        {normalizedItems.map((item) => {
          const isEditing = editingIds.has(item.id);

          if (isEditing) {
            // When editing, we need the initial data.
            // extractedData is cast to any in WineInfoCard, same here.
            const initialData = item.extractedData as unknown as NotionWineProperties; // Assuming it matches or casting
            // Note: extractedData might not perfectly match NotionWineProperties if it's raw from AI.
            // But WineEditForm expects NotionWineProperties.
            // We should probably convert it first using convertToNotionFormat if needed, 
            // but WineInfoCard passes raw extractedData to props? No, WineInfoCard uses extractedData internally.
            // Here we pass initialData. 
            // Let's use the helper if we can import it, or just pass what we have if compatible.
            // Ideally we should import convertToNotionFormat.

            return (
              <WineEditForm
                key={item.id}
                initialData={initialData}
                onSave={(data) => handleSaveEdit(item.id, data)}
                onCancel={() => handleCancelEdit(item.id)}
                isSubmitting={loading}
              />
            );
          }

          return (
            item.status === 'error' ? (
              <div key={item.id} className="backdrop-blur-xl bg-wine-glass border border-wine-red/40 rounded-2xl p-5">
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-wine-red flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div className="flex-1">
                    <p className="font-body text-base font-medium text-wine-red mb-2">
                      Analysis Failed
                    </p>
                    <p className="font-body text-sm text-wine-red/80">
                      {item.error || 'Unknown error occurred'}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <WineInfoCard
                key={item.id}
                item={item}
                isSelected={isSelected(item.id)}
                isProcessing={loading}
                onSelect={handleSelect}
                onEdit={handleEdit}
                onDelete={onDelete || (() => { })}
                onRetryAnalysis={onRetryAnalysis}
                onSaveIndividual={onSaveIndividual}
              />
            )
          );
        })}
      </div>
    </div>
  );
}
