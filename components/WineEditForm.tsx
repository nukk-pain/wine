import React, { useState, useEffect } from 'react';
import { NotionWineProperties, ValidationResult } from '@/types';

interface WineEditFormProps {
    initialData: NotionWineProperties;
    onSave: (updatedData: NotionWineProperties) => void;
    onCancel: () => void;
    isSubmitting: boolean;
}

export const WineEditForm: React.FC<WineEditFormProps> = ({
    initialData,
    onSave,
    onCancel,
    isSubmitting
}) => {
    const [editedData, setEditedData] = useState<NotionWineProperties>(initialData);
    const [validation, setValidation] = useState<ValidationResult>({ isValid: true, errors: [], warnings: [] });

    // 유효성 검사 로직
    const validate = (data: NotionWineProperties): ValidationResult => {
        const errors: string[] = [];
        const warnings: string[] = [];

        if (!data.Name || data.Name.trim() === '') {
            errors.push('와인 이름은 필수입니다');
        }

        if (data.Price !== null && data.Price < 0) {
            errors.push('가격은 0 이상이어야 합니다');
        }

        if (data.Vintage !== null) {
            const currentYear = new Date().getFullYear();
            if (data.Vintage < 1800 || data.Vintage > currentYear + 5) {
                warnings.push(`빈티지가 비현실적입니다 (1800-${currentYear + 5})`);
            }
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    };

    // 데이터 변경 시 유효성 검사 수행
    useEffect(() => {
        setValidation(validate(editedData));
    }, [editedData]);

    const handleChange = (field: keyof NotionWineProperties, value: any) => {
        setEditedData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSave = () => {
        if (validation.isValid) {
            onSave(editedData);
        }
    };

    return (
        <div className="mt-3 space-y-3 bg-white p-4 rounded-xl border border-blue-200 shadow-sm">
            <h3 className="text-sm font-bold text-gray-700 mb-2">✏️ 와인 정보 수정</h3>

            {/* Wine Name */}
            <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                    와인 이름 *
                </label>
                <input
                    type="text"
                    value={editedData.Name}
                    onChange={(e) => handleChange('Name', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 ${validation.errors.some(e => e.includes('이름'))
                            ? 'border-red-300 focus:ring-red-500'
                            : 'border-gray-300 focus:ring-blue-500'
                        }`}
                    placeholder="와인 이름을 입력하세요"
                    disabled={isSubmitting}
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
                        value={editedData.Vintage || ''}
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
                        value={editedData.Price || ''}
                        onChange={(e) => handleChange('Price', e.target.value ? parseFloat(e.target.value) : null)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="0.00"
                        disabled={isSubmitting}
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
                    onChange={(e) => handleChange('Region/Producer', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="예: 나파 밸리, 보르도"
                    disabled={isSubmitting}
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
                        value={Array.isArray(editedData['Varietal(품종)']) ? editedData['Varietal(품종)'].join(', ') : editedData['Varietal(품종)']}
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
                        value={editedData.Store}
                        onChange={(e) => handleChange('Store', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="와인샵"
                        disabled={isSubmitting}
                    />
                </div>
            </div>

            {/* Validation Messages */}
            {validation.errors.length > 0 && (
                <div className="bg-red-50 p-2 rounded text-xs text-red-600">
                    {validation.errors.map((err, idx) => (
                        <div key={idx}>⚠️ {err}</div>
                    ))}
                </div>
            )}
            {validation.warnings && validation.warnings.length > 0 && (
                <div className="bg-yellow-50 p-2 rounded text-xs text-yellow-600">
                    {validation.warnings.map((warn, idx) => (
                        <div key={idx}>⚠️ {warn}</div>
                    ))}
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-2 pt-2">
                <button
                    onClick={handleSave}
                    disabled={isSubmitting || !validation.isValid}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-colors shadow-sm ${validation.isValid
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                >
                    {isSubmitting ? '저장 중...' : '확인'}
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
    );
};
