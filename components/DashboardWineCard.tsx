
import React, { useState } from 'react';
import { formatKRW } from '@/lib/utils/formatters';

export interface DashboardWineRow {
    rowNumber: number;
    name: string;
    vintage: string;
    producer: string;
    country: string;
    region: string;
    appellation: string;
    varietal: string;
    price: string;
    quantity: string;
    store: string;
    purchaseDate: string;
    status: string;
    notes: string;
}

interface DashboardWineCardProps {
    wine: DashboardWineRow;
    onConsume: (rowNumber: number) => void;
}

export const DashboardWineCard: React.FC<DashboardWineCardProps> = ({ wine, onConsume }) => {
    const [isConsuming, setIsConsuming] = useState(false);

    const handleConsume = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (window.confirm(`Drink ${wine.name}? 🍷`)) {
            setIsConsuming(true);
            onConsume(wine.rowNumber);
        }
    };

    return (
        <article className="relative overflow-hidden rounded-xl bg-wine-glass/30 backdrop-blur-sm border border-wine-glassBorder shadow-sm transition-all duration-300 hover:border-wine-gold/30 hover:bg-wine-glass/50 group">
            <div className="flex items-center justify-between p-3 gap-3">

                {/* Left: Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 mb-0.5">
                        <h3 className="font-playfair text-base text-wine-cream font-medium leading-tight truncate">
                            {wine.name}
                        </h3>
                        {wine.vintage && (
                            <span className="font-playfair text-sm text-wine-gold shrink-0">
                                {wine.vintage}
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-wine-creamDim font-body truncate">
                        {wine.appellation && <span>{wine.appellation}</span>}

                        {(wine.appellation && (wine.producer || wine.region || wine.country)) && <span className="text-wine-glassBorder">•</span>}

                        {wine.producer && <span>{wine.producer}</span>}

                        {(wine.producer && (wine.region || wine.country)) && <span className="text-wine-glassBorder">•</span>}

                        {(wine.region || wine.country) && (
                            <span>{[wine.region, wine.country].filter(Boolean).join(', ')}</span>
                        )}
                    </div>
                </div>

                {/* Right: Action */}
                <button
                    onClick={handleConsume}
                    disabled={isConsuming}
                    className="shrink-0 py-2 px-3 bg-wine-gold/10 border border-wine-gold/20 text-wine-gold font-body font-semibold text-xs rounded-lg hover:bg-wine-gold/20 hover:border-wine-gold/40 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                    {isConsuming ? '...' : 'Drink!'}
                </button>
            </div>
        </article>
    );
};
