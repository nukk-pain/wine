import React from 'react';
import { ImageProcessingItem } from '@/types';
import { DebugInfo } from './DebugInfo';
import { formatKRW } from '@/lib/utils/formatters';
import { normalizeWineInfo, convertToNotionFormat } from '@/lib/utils/wine-data-helpers';

interface WineInfoCardProps {
    item: ImageProcessingItem;
    isSelected: boolean;
    isProcessing: boolean;
    onSelect: (id: string, checked: boolean) => void;
    onEdit: (id: string) => void;
    onDelete: (id: string) => void;
    onRetryAnalysis?: (id: string) => void;
    onSaveIndividual?: (id: string, notionData: any) => void;
}

export const WineInfoCard: React.FC<WineInfoCardProps> = ({
    item,
    isSelected,
    isProcessing,
    onSelect,
    onEdit,
    onDelete,
    onRetryAnalysis,
    onSaveIndividual
}) => {
    const data = (item.extractedData || {}) as any;

    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onSelect(item.id, e.target.checked);
    };

    return (
        <article className={`relative overflow-hidden rounded-2xl bg-gradient-to-br from-wine-glass to-wine-glass/50 backdrop-blur-md border transition-all duration-300 ${isSelected
            ? 'border-wine-gold shadow-wine-selected'
            : 'border-wine-glassBorder hover:border-wine-gold/40'
            }`}>
            {/* Selection glow effect */}
            {isSelected && (
                <div className="absolute inset-0 bg-gradient-radial from-wine-gold/10 to-transparent pointer-events-none" />
            )}

            {/* Top: Image + Vintage */}
            <div className="relative h-40 overflow-hidden">
                {/* Image background */}
                <div className="absolute inset-0 bg-gradient-to-b from-wine-deep/30 to-wine-dark/80" />
                <img
                    src={item.preview}
                    alt={data.Name || 'Wine'}
                    className="w-full h-full object-cover opacity-60"
                />

                {/* Vintage overlay */}
                {(data.Vintage || data.vintage) && (
                    <div className="absolute bottom-2 right-3">
                        <span className="font-playfair text-[28px] font-light text-wine-gold drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                            {data.Vintage || data.vintage}
                        </span>
                    </div>
                )}

                {/* Checkbox (top left) */}
                <label className="absolute top-3 left-3 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={handleCheckboxChange}
                        disabled={isProcessing}
                        className="w-6 h-6 rounded border-2 border-wine-gold/50 bg-wine-dark/50 backdrop-blur-sm checked:bg-wine-gold checked:border-wine-gold focus:ring-2 focus:ring-wine-gold/50 focus:ring-offset-0 transition-all duration-200 disabled:opacity-40"
                    />
                </label>

                {/* Status badge (top right) */}
                <div className="absolute top-3 right-3">
                    <span className={`px-2 py-1 rounded-lg text-xs font-body font-semibold backdrop-blur-sm ${item.status === 'completed' ? 'bg-wine-gold/20 text-wine-gold border border-wine-gold/50' :
                        item.status === 'error' ? 'bg-wine-red/20 text-wine-red border border-wine-red/50' :
                            item.status === 'saved' ? 'bg-wine-gold/30 text-wine-cream border border-wine-gold/60' :
                                'bg-wine-glass text-wine-creamDim border border-wine-glassBorder'
                        }`}>
                        {item.status === 'completed' ? 'Analyzed' :
                            item.status === 'error' ? 'Error' :
                                item.status === 'saved' ? 'Saved' : 'Processing'}
                    </span>
                </div>
            </div>

            {/* Middle: Wine Info */}
            <div className="p-4 space-y-3">
                {/* Wine name + status */}
                <div>
                    <h3 className="font-playfair text-lg text-wine-cream font-medium leading-tight line-clamp-2 mb-1.5">
                        {data.Name || data.name || data.wine_name || '(No Name)'}
                    </h3>
                </div>

                {/* Divider */}
                <div className="h-[1px] bg-gradient-to-r from-transparent via-wine-glassBorder to-transparent" />

                {/* Details grid */}
                <dl className="space-y-2 text-sm">
                    {(data.Producer || data.producer) && (
                        <div className="flex items-start gap-3">
                            <dt className="font-body text-wine-creamDark w-16 flex-shrink-0 text-xs">
                                Producer
                            </dt>
                            <dd className="font-body text-wine-cream flex-1 font-medium">
                                {data.Producer || data.producer}
                            </dd>
                        </div>
                    )}

                    {(data.Region || data.region) && (
                        <div className="flex items-start gap-3">
                            <dt className="font-body text-wine-creamDark w-16 flex-shrink-0 text-xs">
                                Region
                            </dt>
                            <dd className="font-body text-wine-creamDim flex-1">
                                {data.Region || data.region}
                            </dd>
                        </div>
                    )}

                    {(data['Varietal(품종)'] || data.varietal) && (
                        <div className="flex items-start gap-3">
                            <dt className="font-body text-wine-creamDark w-16 flex-shrink-0 text-xs">
                                Varietal
                            </dt>
                            <dd className="font-body text-wine-creamDim flex-1">
                                {Array.isArray(data['Varietal(품종)'])
                                    ? data['Varietal(품종)'].join(', ')
                                    : data['Varietal(품종)'] || data.varietal}
                            </dd>
                        </div>
                    )}

                    {(data.Price || data.price) && (
                        <div className="flex items-center gap-3">
                            <dt className="font-body text-wine-creamDark w-16 flex-shrink-0 text-xs">
                                Price
                            </dt>
                            <dd className="font-body text-wine-gold flex-1 font-semibold">
                                {formatKRW(data.Price || data.price)}
                            </dd>
                        </div>
                    )}

                    {(data.Quantity || data.quantity) && (
                        <div className="flex items-center gap-3">
                            <dt className="font-body text-wine-creamDark w-16 flex-shrink-0 text-xs">
                                Quantity
                            </dt>
                            <dd className="font-body text-wine-creamDim flex-1">
                                {data.Quantity || data.quantity} bottles
                            </dd>
                        </div>
                    )}

                    {(data.Store || data.store) && (
                        <div className="flex items-center gap-3">
                            <dt className="font-body text-wine-creamDark w-16 flex-shrink-0 text-xs">
                                Store
                            </dt>
                            <dd className="font-body text-wine-creamDim flex-1">
                                {data.Store || data.store}
                            </dd>
                        </div>
                    )}
                </dl>

                {/* Debug Info (development only) */}
                <DebugInfo data={data} title="API 응답 데이터" />
            </div>

            {/* Bottom: Action Buttons */}
            <div className="p-4 pt-0 space-y-2">
                {/* Primary actions */}
                <div className="flex gap-2">
                    <button
                        onClick={() => onEdit(item.id)}
                        disabled={isProcessing}
                        className="flex-1 py-3 px-4 min-h-[48px] bg-wine-glass border border-wine-gold/50 text-wine-gold font-body font-medium text-sm rounded-xl hover:bg-wine-gold/10 transition-all duration-200 active:scale-95 disabled:opacity-40"
                    >
                        Edit
                    </button>

                    {onSaveIndividual && (
                        <button
                            onClick={() => {
                                const notionData = convertToNotionFormat(data);
                                onSaveIndividual(item.id, notionData);
                            }}
                            disabled={isProcessing}
                            className="flex-1 py-3 px-4 min-h-[48px] bg-gradient-to-r from-wine-gold to-wine-goldDark text-wine-dark font-body font-semibold text-sm rounded-xl shadow-wine hover:shadow-wine-lg transition-all duration-200 active:scale-95 disabled:opacity-40"
                        >
                            Save
                        </button>
                    )}
                </div>

                {/* Secondary actions */}
                <div className="flex gap-2">
                    {onRetryAnalysis && (
                        <button
                            onClick={() => {
                                if (window.confirm('Re-analyze this image? Current results will be replaced.')) {
                                    onRetryAnalysis(item.id);
                                }
                            }}
                            disabled={isProcessing}
                            className="flex-1 py-2.5 px-3 min-h-[44px] bg-wine-gold/10 border border-wine-gold/40 text-wine-gold font-body font-medium text-xs rounded-lg hover:bg-wine-gold/20 transition-all duration-200 active:scale-95 disabled:opacity-40"
                        >
                            Re-analyze
                        </button>
                    )}

                    <button
                        onClick={() => {
                            if (window.confirm('Delete this wine?')) {
                                onDelete(item.id);
                            }
                        }}
                        disabled={isProcessing}
                        className="flex-1 py-2.5 px-3 min-h-[44px] bg-wine-glass border border-wine-glassBorder text-wine-creamDark font-body font-medium text-xs rounded-lg hover:bg-wine-red/10 hover:border-wine-red/40 hover:text-wine-red transition-all duration-200 active:scale-95 disabled:opacity-40"
                    >
                        Delete
                    </button>
                </div>
            </div>
        </article>
    );
};
