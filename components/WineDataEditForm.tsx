import React, { useState, useEffect } from 'react';
import { NotionWineProperties } from '@/types';

interface WineDataEditFormProps {
  initialData?: NotionWineProperties;
  onSave: (data: NotionWineProperties) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  mode?: 'create' | 'edit';
}

const emptyWineData: NotionWineProperties = {
  'Name': '',
  'Vintage': null,
  'Producer': '',
  'Region': '',
  'Price': null,
  'Quantity': 1,
  'Store': '',
  'Varietal(품종)': [],
  'Country(국가)': '',
  'Appellation(원산지명칭)': '',
  'Notes(메모)': '',
  'Image': null,
};

export default function WineDataEditForm({
  initialData,
  onSave,
  onCancel,
  isSubmitting = false,
  mode = 'edit'
}: WineDataEditFormProps) {
  const [formData, setFormData] = useState<NotionWineProperties>(initialData || emptyWineData);
  const [errors, setErrors] = useState<string[]>([]);

  const isCreateMode = mode === 'create';

  // Sync formData with initialData when it changes
  useEffect(() => {
    console.log('[WineDataEditForm] initialData changed:', initialData);
    setFormData(initialData || emptyWineData);
  }, [initialData]);

  const handleInputChange = (field: keyof NotionWineProperties, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear errors when user starts editing
    if (errors.length > 0) {
      setErrors([]);
    }
  };

  const handleVarietalChange = (value: string) => {
    const varietals = value.split(',').map(v => v.trim()).filter(v => v.length > 0);
    handleInputChange('Varietal(품종)', varietals);
  };

  const validateForm = (): boolean => {
    const newErrors: string[] = [];

    if (!formData.Name || formData.Name.trim() === '') {
      newErrors.push('Wine name is required');
    }

    if (formData.Vintage !== null && formData.Vintage !== undefined) {
      if (formData.Vintage < 1800 || formData.Vintage > new Date().getFullYear() + 1) {
        newErrors.push('Vintage must be between 1800 and current year + 1');
      }
    }

    if (formData.Price !== null && formData.Price !== undefined && formData.Price < 0) {
      newErrors.push('Price must be a positive number');
    }

    if (formData.Quantity !== null && formData.Quantity !== undefined && formData.Quantity < 0) {
      newErrors.push('Quantity must be a positive number');
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    console.log('[WineDataEditForm] Submitting formData:', formData);

    if (validateForm()) {
      onSave(formData);
    }
  };

  // Common input class for reuse
  const inputClass = "w-full px-4 py-3 bg-wine-dark/50 border border-wine-glassBorder rounded-xl text-sm text-wine-cream placeholder-wine-creamDim focus:outline-none focus:ring-2 focus:ring-wine-gold/50 focus:border-wine-gold transition-colors";

  return (
    <div className="bg-wine-glass/80 backdrop-blur-md p-5 rounded-xl border border-wine-gold/30 max-w-2xl mx-auto">
      <h2 className="text-xl font-semibold mb-5 text-wine-gold">
        {isCreateMode ? '➕ 수동으로 와인 추가' : 'Edit Wine Information'}
      </h2>

      {errors.length > 0 && (
        <div className="mb-4 p-4 bg-wine-red/10 border border-wine-red/30 text-wine-red rounded-xl">
          <h3 className="font-semibold mb-2">Please fix the following errors:</h3>
          <ul className="list-disc list-inside text-sm">
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Wine Name */}
        <div>
          <label className="block text-sm font-medium text-wine-cream mb-1.5">
            Wine Name *
          </label>
          <input
            type="text"
            value={formData.Name}
            onChange={(e) => handleInputChange('Name', e.target.value)}
            className={inputClass}
            placeholder="Enter wine name"
            required
          />
        </div>

        {/* Vintage and Price - 2 columns on desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-wine-cream mb-1.5">
              Vintage
            </label>
            <input
              type="number"
              value={formData.Vintage || ''}
              onChange={(e) => handleInputChange('Vintage', e.target.value ? parseInt(e.target.value) : null)}
              className={inputClass}
              placeholder="e.g., 2020"
              min="1800"
              max={new Date().getFullYear() + 1}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-wine-cream mb-1.5">
              Price
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.Price || ''}
              onChange={(e) => handleInputChange('Price', e.target.value ? parseFloat(e.target.value) : null)}
              className={inputClass}
              placeholder="e.g., 29.99"
              min="0"
            />
          </div>
        </div>

        {/* Producer and Region */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-wine-cream mb-1.5">
              Producer
            </label>
            <input
              type="text"
              value={formData.Producer}
              onChange={(e) => handleInputChange('Producer', e.target.value)}
              className={inputClass}
              placeholder="e.g., Château Margaux"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-wine-cream mb-1.5">
              Region
            </label>
            <input
              type="text"
              value={formData.Region}
              onChange={(e) => handleInputChange('Region', e.target.value)}
              className={inputClass}
              placeholder="e.g., Napa Valley, Bordeaux"
            />
          </div>
        </div>

        {/* Country and Appellation */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-wine-cream mb-1.5">
              Country (국가)
            </label>
            <input
              type="text"
              value={formData['Country(국가)'] || ''}
              onChange={(e) => handleInputChange('Country(국가)', e.target.value)}
              className={inputClass}
              placeholder="e.g., France, Italy, USA"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-wine-cream mb-1.5">
              Appellation (원산지명칭)
            </label>
            <input
              type="text"
              value={formData['Appellation(원산지명칭)'] || ''}
              onChange={(e) => handleInputChange('Appellation(원산지명칭)', e.target.value)}
              className={inputClass}
              placeholder="e.g., Bordeaux AOC"
            />
          </div>
        </div>

        {/* Quantity and Store */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-wine-cream mb-1.5">
              Quantity
            </label>
            <input
              type="number"
              value={formData.Quantity || ''}
              onChange={(e) => handleInputChange('Quantity', e.target.value ? parseInt(e.target.value) : null)}
              className={inputClass}
              placeholder="e.g., 1"
              min="1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-wine-cream mb-1.5">
              Store
            </label>
            <input
              type="text"
              value={formData.Store}
              onChange={(e) => handleInputChange('Store', e.target.value)}
              className={inputClass}
              placeholder="e.g., Wine Shop, Costco"
            />
          </div>
        </div>

        {/* Varietal */}
        <div>
          <label className="block text-sm font-medium text-wine-cream mb-1.5">
            Varietal (품종)
          </label>
          <input
            type="text"
            value={(formData['Varietal(품종)'] || []).join(', ')}
            onChange={(e) => handleVarietalChange(e.target.value)}
            className={inputClass}
            placeholder="e.g., Cabernet Sauvignon, Merlot"
          />
          <p className="text-xs text-wine-creamDim mt-1.5">
            Separate multiple varieties with commas
          </p>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-wine-cream mb-1.5">
            Notes (메모)
          </label>
          <textarea
            value={formData['Notes(메모)'] || ''}
            onChange={(e) => handleInputChange('Notes(메모)', e.target.value)}
            className={`${inputClass} resize-none`}
            placeholder="Additional notes about the wine..."
            rows={3}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 min-h-[44px] bg-gradient-to-r from-wine-gold to-wine-goldDark text-wine-dark py-3 px-4 rounded-xl text-sm font-bold hover:from-wine-goldDark hover:to-wine-gold transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (isCreateMode ? '저장 중...' : 'Saving...') : (isCreateMode ? '💾 저장' : 'Save Changes')}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex-1 min-h-[44px] bg-wine-glass border border-wine-glassBorder text-wine-cream py-3 px-4 rounded-xl text-sm font-medium hover:bg-wine-glassHover transition-colors active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreateMode ? '취소' : 'Cancel'}
          </button>
        </div>
      </form>
    </div>
  );
}