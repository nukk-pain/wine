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
    // Normalize initialData to ensure all fields have defined values
    const normalizedData: NotionWineProperties = {
        Name: initialData.Name || '',
        Vintage: initialData.Vintage || null,
        'Region/Producer': initialData['Region/Producer'] || '',
        Price: initialData.Price || null,
        Quantity: initialData.Quantity || null,
        Store: initialData.Store || '',
        'Varietal(품종)': initialData['Varietal(품종)'] || [],
        Image: initialData.Image || null,
        'Country(국가)': initialData['Country(국가)'] || undefined,
        'Appellation(원산지명칭)': initialData['Appellation(원산지명칭)'] || undefined,
        'Notes(메모)': initialData['Notes(메모)'] || undefined
    };

    const [editedData, setEditedData] = useState<NotionWineProperties>(normalizedData);
    const [validation, setValidation] = useState<ValidationResult>({ isValid: true, errors: [], warnings: [] });

    // Log initialData when component mounts or updates
    console.log('[WineEditForm] Rendering with initialData:', initialData);
    console.log('[WineEditForm] Normalized data:', normalizedData);

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
        console.log('[WineEditForm] handleSave called, editedData:', editedData);
        console.log('[WineEditForm] validation:', validation);
        if (validation.isValid) {
            console.log('[WineEditForm] Calling onSave with:', editedData);
            onSave(editedData);
        }
    };

    return (
        <div className="mt-3 space-y-3 bg-wine-glass backdrop-blur-xl p-4 rounded-xl border border-wine-glassBorder shadow-wine">
            <h3 className="text-sm font-playfair font-semibold text-wine-cream mb-2">✏️ 와인 정보 수정</h3>

            {/* Wine Name */}
            <div>
                <label className="block text-xs font-body font-medium text-wine-creamDim mb-1">
                    와인 이름 *
                </label>
                <input
                    type="text"
                    value={editedData.Name}
                    onChange={(e) => handleChange('Name', e.target.value)}
                    className={`w-full px-3 py-2 bg-wine-dark/30 border rounded-lg text-sm text-wine-cream placeholder:text-wine-creamDark focus:outline-none focus:ring-2 ${validation.errors.some(e => e.includes('이름'))
                        ? 'border-wine-red/50 focus:ring-wine-red'
                        : 'border-wine-glassBorder focus:ring-wine-gold/50'
                        }`}
                    placeholder="와인 이름을 입력하세요"
                    disabled={isSubmitting}
                />
            </div>

            {/* Vintage and Price */}
            <div className="grid grid-cols-2 gap-2">
                <div>
                    <label className="block text-xs font-body font-medium text-wine-creamDim mb-1">
                        빈티지
                    </label>
                    <input
                        type="number"
                        value={editedData.Vintage || ''}
                        onChange={(e) => handleChange('Vintage', e.target.value ? parseInt(e.target.value) : null)}
                        className="w-full px-3 py-2 bg-wine-dark/30 border border-wine-glassBorder rounded-lg text-sm text-wine-cream placeholder:text-wine-creamDark focus:outline-none focus:ring-2 focus:ring-wine-gold/50"
                        placeholder="2020"
                        disabled={isSubmitting}
                    />
                </div>
                <div>
                    <label className="block text-xs font-body font-medium text-wine-creamDim mb-1">
                        가격
                    </label>
                    <input
                        type="number"
                        step="0.01"
                        value={editedData.Price || ''}
                        onChange={(e) => handleChange('Price', e.target.value ? parseFloat(e.target.value) : null)}
                        className="w-full px-3 py-2 bg-wine-dark/30 border border-wine-glassBorder rounded-lg text-sm text-wine-cream placeholder:text-wine-creamDark focus:outline-none focus:ring-2 focus:ring-wine-gold/50"
                        placeholder="0"
                        disabled={isSubmitting}
                    />
                </div>
            </div>

            {/* Region/Producer */}
            <div>
                <label className="block text-xs font-body font-medium text-wine-creamDim mb-1">
                    지역/생산자
                </label>
                <input
                    type="text"
                    value={editedData['Region/Producer']}
                    onChange={(e) => handleChange('Region/Producer', e.target.value)}
                    className="w-full px-3 py-2 bg-wine-dark/30 border border-wine-glassBorder rounded-lg text-sm text-wine-cream placeholder:text-wine-creamDark focus:outline-none focus:ring-2 focus:ring-wine-gold/50"
                    placeholder="예: 나파 밸리, 보르도"
                    disabled={isSubmitting}
                />
            </div>

            {/* Varietal and Store */}
            <div className="grid grid-cols-2 gap-2">
                <div>
                    <label className="block text-xs font-body font-medium text-wine-creamDim mb-1">
                        품종
                    </label>
                    <input
                        type="text"
                        value={Array.isArray(editedData['Varietal(품종)']) ? editedData['Varietal(품종)'].join(', ') : editedData['Varietal(품종)']}
                        onChange={(e) => {
                            const varietals = e.target.value.split(',').map(v => v.trim()).filter(v => v);
                            handleChange('Varietal(품종)', varietals);
                        }}
                        className="w-full px-3 py-2 bg-wine-dark/30 border border-wine-glassBorder rounded-lg text-sm text-wine-cream placeholder:text-wine-creamDark focus:outline-none focus:ring-2 focus:ring-wine-gold/50"
                        placeholder="카베르네 소비뇽"
                        disabled={isSubmitting}
                    />
                </div>
                <div>
                    <label className="block text-xs font-body font-medium text-wine-creamDim mb-1">
                        구매처
                    </label>
                    <input
                        type="text"
                        value={editedData.Store}
                        onChange={(e) => handleChange('Store', e.target.value)}
                        className="w-full px-3 py-2 bg-wine-dark/30 border border-wine-glassBorder rounded-lg text-sm text-wine-cream placeholder:text-wine-creamDark focus:outline-none focus:ring-2 focus:ring-wine-gold/50"
                        placeholder="와인샵"
                        disabled={isSubmitting}
                    />
                </div>
            </div>

            {/* Validation Messages */}
            {validation.errors.length > 0 && (
                <div className="bg-wine-red/20 border border-wine-red/40 p-2 rounded-lg text-xs text-wine-red">
                    {validation.errors.map((err, idx) => (
                        <div key={idx}>⚠️ {err}</div>
                    ))}
                </div>
            )}
            {validation.warnings && validation.warnings.length > 0 && (
                <div className="bg-wine-gold/20 border border-wine-gold/40 p-2 rounded-lg text-xs text-wine-gold">
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
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-body font-bold transition-all duration-300 shadow-wine ${validation.isValid
                        ? 'bg-gradient-to-r from-wine-gold to-wine-goldDark text-wine-dark hover:shadow-wine-lg hover:from-wine-goldDark hover:to-wine-gold active:scale-95'
                        : 'bg-wine-glassBorder text-wine-creamDark cursor-not-allowed opacity-50'
                        }`}
                >
                    {isSubmitting ? '저장 중...' : '확인'}
                </button>
                <button
                    onClick={onCancel}
                    disabled={isSubmitting}
                    className="flex-1 bg-wine-dark/50 border border-wine-glassBorder text-wine-creamDim py-2 px-3 rounded-lg text-xs font-body font-medium hover:bg-wine-dark/70 hover:border-wine-gold/30 transition-all duration-300 disabled:opacity-50"
                >
                    취소
                </button>
            </div>
        </div>
    );
};
