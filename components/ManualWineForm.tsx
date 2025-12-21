import React, { useState } from 'react';
import { NotionWineProperties, ValidationResult } from '@/types';

interface ManualWineFormProps {
    onSubmit: (data: NotionWineProperties) => void;
    onCancel: () => void;
    isSubmitting: boolean;
    defaultValues?: Partial<NotionWineProperties>;
}

export const ManualWineForm: React.FC<ManualWineFormProps> = ({
    onSubmit,
    onCancel,
    isSubmitting,
    defaultValues
}) => {
    const initialData: NotionWineProperties = {
        'Name': '',
        'Vintage': null,
        'Producer': '',               // C: 생산자 (분리)
        'Region': '',                 // D: 지역 (분리)
        'Price': null,
        'Quantity': 1,
        'Store': '',
        'Varietal(품종)': [],
        'Image': null,
        ...defaultValues
    };

    const [formData, setFormData] = useState<NotionWineProperties>(initialData);
    const [errors, setErrors] = useState<string[]>([]);

    const handleChange = (field: keyof NotionWineProperties, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Clear error when user types
        if (errors.length > 0) setErrors([]);
    };

    const handleSubmit = () => {
        const newErrors: string[] = [];
        if (!formData.Name || formData.Name.trim() === '') {
            newErrors.push('와인 이름은 필수입니다.');
        }

        if (newErrors.length > 0) {
            setErrors(newErrors);
            return;
        }

        onSubmit(formData);
    };

    return (
        <div className="bg-white rounded-xl shadow-lg border-2 border-dashed border-blue-300 p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-blue-800 flex items-center space-x-2">
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
                        value={formData.Name}
                        onChange={(e) => handleChange('Name', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 ${errors.length > 0 ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                            }`}
                        placeholder="와인 이름을 입력하세요"
                        disabled={isSubmitting}
                        autoFocus
                    />
                </div>

                {/* Vintage and Price */}
                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                            빈티지
                        </label>
                        <input
                            type="number"
                            value={formData.Vintage || ''}
                            onChange={(e) => handleChange('Vintage', e.target.value ? parseInt(e.target.value) : null)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="2020"
                            disabled={isSubmitting}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                            가격
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            value={formData.Price || ''}
                            onChange={(e) => handleChange('Price', e.target.value ? parseFloat(e.target.value) : null)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="0.00"
                            disabled={isSubmitting}
                        />
                    </div>
                </div>

                {/* Producer and Region */}
                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                            생산자
                        </label>
                        <input
                            type="text"
                            value={formData.Producer}
                            onChange={(e) => handleChange('Producer', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="예: Château Margaux"
                            disabled={isSubmitting}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                            지역
                        </label>
                        <input
                            type="text"
                            value={formData.Region}
                            onChange={(e) => handleChange('Region', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="예: Napa Valley"
                            disabled={isSubmitting}
                        />
                    </div>
                </div>

                {/* Varietal and Store */}
                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                            품종
                        </label>
                        <input
                            type="text"
                            value={Array.isArray(formData['Varietal(품종)']) ? formData['Varietal(품종)'].join(', ') : formData['Varietal(품종)']}
                            onChange={(e) => {
                                const varietals = e.target.value.split(',').map(v => v.trim()).filter(v => v);
                                handleChange('Varietal(품종)', varietals);
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="카베르네 소비뇽"
                            disabled={isSubmitting}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                            구매처
                        </label>
                        <input
                            type="text"
                            value={formData.Store}
                            onChange={(e) => handleChange('Store', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="와인샵"
                            disabled={isSubmitting}
                        />
                    </div>
                </div>

                {/* Error Messages */}
                {errors.length > 0 && (
                    <div className="bg-red-50 p-2 rounded text-xs text-red-600">
                        {errors.map((err, idx) => (
                            <div key={idx}>⚠️ {err}</div>
                        ))}
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex space-x-2 pt-2">
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="flex-1 bg-green-500 text-white py-2 px-3 rounded-lg text-xs font-bold hover:bg-green-600 transition-colors shadow-sm disabled:opacity-50"
                    >
                        {isSubmitting ? '저장 중...' : '💾 저장'}
                    </button>
                    <button
                        onClick={onCancel}
                        disabled={isSubmitting}
                        className="flex-1 bg-white border border-gray-300 text-gray-700 py-2 px-3 rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors"
                    >
                        취소
                    </button>
                </div>
            </div>
        </div>
    );
};
