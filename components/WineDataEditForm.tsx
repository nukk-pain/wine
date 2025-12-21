import React, { useState, useEffect } from 'react';
import { NotionWineProperties } from '@/types';

interface WineDataEditFormProps {
  initialData: NotionWineProperties;
  onSave: (data: NotionWineProperties) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export default function WineDataEditForm({
  initialData,
  onSave,
  onCancel,
  isSubmitting = false
}: WineDataEditFormProps) {
  const [formData, setFormData] = useState<NotionWineProperties>(initialData);
  const [errors, setErrors] = useState<string[]>([]);

  // Sync formData with initialData when it changes
  useEffect(() => {
    console.log('[WineDataEditForm] initialData changed:', initialData);
    setFormData(initialData);
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

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Edit Wine Information</h2>

      {errors.length > 0 && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          <h3 className="font-semibold mb-2">Please fix the following errors:</h3>
          <ul className="list-disc list-inside">
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Wine Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Wine Name *
          </label>
          <input
            type="text"
            value={formData.Name}
            onChange={(e) => handleInputChange('Name', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter wine name"
            required
          />
        </div>

        {/* Vintage */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Vintage
          </label>
          <input
            type="number"
            value={formData.Vintage || ''}
            onChange={(e) => handleInputChange('Vintage', e.target.value ? parseInt(e.target.value) : null)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., 2020"
            min="1800"
            max={new Date().getFullYear() + 1}
          />
        </div>

        {/* Region/Producer */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Region/Producer
          </label>
          <input
            type="text"
            value={formData['Region/Producer']}
            onChange={(e) => handleInputChange('Region/Producer', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Napa Valley, Château Margaux"
          />
        </div>

        {/* Price */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Price
          </label>
          <input
            type="number"
            step="0.01"
            value={formData.Price || ''}
            onChange={(e) => handleInputChange('Price', e.target.value ? parseFloat(e.target.value) : null)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., 29.99"
            min="0"
          />
        </div>

        {/* Quantity */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Quantity
          </label>
          <input
            type="number"
            value={formData.Quantity || ''}
            onChange={(e) => handleInputChange('Quantity', e.target.value ? parseInt(e.target.value) : null)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., 1"
            min="1"
          />
        </div>

        {/* Store */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Store
          </label>
          <input
            type="text"
            value={formData.Store}
            onChange={(e) => handleInputChange('Store', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Wine Shop, Costco"
          />
        </div>

        {/* Varietal */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Varietal (품종)
          </label>
          <input
            type="text"
            value={(formData['Varietal(품종)'] || []).join(', ')}
            onChange={(e) => handleVarietalChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Cabernet Sauvignon, Merlot"
          />
          <p className="text-xs text-gray-500 mt-1">
            Separate multiple varieties with commas
          </p>
        </div>

        {/* Country */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Country (국가)
          </label>
          <input
            type="text"
            value={formData['Country(국가)'] || ''}
            onChange={(e) => handleInputChange('Country(국가)', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., France, Italy, USA"
          />
        </div>

        {/* Appellation */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Appellation (원산지명칭)
          </label>
          <input
            type="text"
            value={formData['Appellation(원산지명칭)'] || ''}
            onChange={(e) => handleInputChange('Appellation(원산지명칭)', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Bordeaux AOC, Napa Valley AVA"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes (메모)
          </label>
          <textarea
            value={formData['Notes(메모)'] || ''}
            onChange={(e) => handleInputChange('Notes(메모)', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Additional notes about the wine..."
            rows={3}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 pt-6">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Saving...' : 'Save to Notion'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}