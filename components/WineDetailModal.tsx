import React, { useEffect } from 'react';
import { DashboardWineRow } from './DashboardWineCard';
import { formatKRW } from '@/lib/utils/formatters';

interface WineDetailModalProps {
    wine: DashboardWineRow;
    onClose: () => void;
}

export const WineDetailModal: React.FC<WineDetailModalProps> = ({ wine, onClose }) => {
    // Close on escape key
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    // Prevent body scroll when modal is open
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-wine-dark/90 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative w-full max-w-lg bg-wine-dark/95 backdrop-blur-md border border-wine-gold/30 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="relative p-6 pb-4 border-b border-wine-glassBorder">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 text-wine-creamDim hover:text-wine-cream hover:bg-wine-glassBorder/50 rounded-full transition-colors"
                    >
                        ✕
                    </button>

                    <h2 className="font-playfair text-2xl text-wine-gold font-bold pr-8">
                        {wine.name}
                    </h2>
                    {wine.vintage && (
                        <div className="mt-1 font-playfair text-lg text-wine-cream">
                            {wine.vintage}
                        </div>
                    )}
                </div>

                {/* Body */}
                <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">

                    {/* Origin Section */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-wine-gold uppercase tracking-wider">Country</label>
                            <div className="text-wine-cream">{wine.country || '-'}</div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-wine-gold uppercase tracking-wider">Region</label>
                            <div className="text-wine-cream">{wine.region || '-'}</div>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-wine-gold uppercase tracking-wider">Appellation</label>
                        <div className="text-wine-cream">{wine.appellation || '-'}</div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-wine-gold uppercase tracking-wider">Producer</label>
                        <div className="text-wine-cream font-medium">{wine.producer || '-'}</div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-wine-gold uppercase tracking-wider">Varietal</label>
                        <div className="text-wine-cream">{wine.varietal || '-'}</div>
                    </div>

                    <div className="h-px bg-wine-glassBorder/50 my-4" />

                    {/* Purchase Info Section */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-wine-gold uppercase tracking-wider">Price</label>
                            <div className="text-wine-cream font-mono">{wine.price ? formatKRW(wine.price) : '-'}</div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-wine-gold uppercase tracking-wider">Quantity</label>
                            <div className="text-wine-cream font-mono">{wine.quantity || '1'}</div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-wine-gold uppercase tracking-wider">Store</label>
                            <div className="text-wine-cream">{wine.store || '-'}</div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-wine-gold uppercase tracking-wider">Purchase Date</label>
                            <div className="text-wine-cream">{wine.purchaseDate || '-'}</div>
                        </div>
                    </div>

                    {/* Notes Section - Full Width */}
                    {wine.notes && (
                        <div className="space-y-2 pt-2">
                            <label className="text-xs font-bold text-wine-gold uppercase tracking-wider">Notes</label>
                            <div className="bg-wine-dark/30 rounded-xl p-4 text-wine-creamDim text-sm italic leading-relaxed border border-wine-glassBorder/30">
                                {wine.notes}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
