import React, { useEffect, useState } from 'react';
import { WineRow } from '@/lib/google-sheets';
import { generatePairingPrompt, PairingMode } from '@/lib/utils/WineListFormatter';

interface WinePairingExportModalProps {
    wines: WineRow[];
    onClose: () => void;
}

export const WinePairingExportModal: React.FC<WinePairingExportModalProps> = ({ wines, onClose }) => {
    const [showCopySuccess, setShowCopySuccess] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [mode, setMode] = useState<PairingMode>('food-to-wine');
    const [foodInput, setFoodInput] = useState('');
    const [selectedWineIds, setSelectedWineIds] = useState<Set<number>>(new Set());
    const hasShareAPI = typeof navigator !== 'undefined' && typeof navigator.share !== 'undefined';

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

    const toggleWineSelection = (rowNumber: number) => {
        const newSet = new Set(selectedWineIds);
        if (newSet.has(rowNumber)) {
            newSet.delete(rowNumber);
        } else {
            newSet.add(rowNumber);
        }
        setSelectedWineIds(newSet);
    };

    const handleShare = async () => {
        const selectedWines = wines.filter(w => selectedWineIds.has(w.rowNumber));

        const prompt = generatePairingPrompt(wines, {
            mode,
            foodInput,
            selectedWines: mode === 'wine-to-food' && selectedWines.length > 0 ? selectedWines : undefined,
        });

        // 1. Try Share API (mobile)
        if (hasShareAPI) {
            try {
                await navigator.share({
                    title: 'Wine Pairing Request',
                    text: prompt,
                });
                // Success - user selected an app
                onClose();
            } catch (err: any) {
                // User cancelled or error
                if (err.name !== 'AbortError') {
                    console.error('Share failed:', err);
                    // Fallback to clipboard
                    fallbackCopy(prompt);
                }
            }
        }
        // 2. Fallback: Clipboard copy (desktop)
        else {
            fallbackCopy(prompt);
        }
    };

    const fallbackCopy = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setShowCopySuccess(true);
            setTimeout(() => {
                setShowCopySuccess(false);
            }, 2000);
        } catch (err) {
            alert('Failed to copy. Please try again.');
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-wine-dark/90 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal Content - Bottom Sheet on Mobile, Centered on Desktop */}
            <div className="relative w-full max-w-lg bg-wine-dark/95 backdrop-blur-md border-t sm:border border-wine-gold/30 rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[85vh] sm:max-h-[70vh] overflow-hidden animate-in slide-in-from-bottom sm:fade-in sm:zoom-in-95 duration-300 flex flex-col">

                {/* Handle bar (mobile only) */}
                <div className="sm:hidden pt-3 pb-2">
                    <div className="w-12 h-1.5 bg-wine-gold/50 rounded-full mx-auto"></div>
                </div>

                {/* Header */}
                <div className="relative px-6 pt-4 sm:pt-6 pb-4 border-b border-wine-glassBorder">
                    <button
                        onClick={onClose}
                        className="absolute top-4 sm:top-6 right-4 sm:right-6 p-2 text-wine-creamDim hover:text-wine-cream hover:bg-wine-glassBorder/50 rounded-full transition-colors"
                        aria-label="Close modal"
                    >
                        ✕
                    </button>

                    <h2 className="font-playfair text-xl sm:text-2xl text-wine-gold font-bold pr-10">
                        음식 페어링 추천
                    </h2>
                    <div className="mt-1 flex items-center gap-2 text-sm text-wine-cream">
                        <span className="text-lg">🍽️</span>
                        <span>{wines.length} wine{wines.length !== 1 ? 's' : ''}</span>
                        {wines.length >= 200 && (
                            <span className="ml-2 px-2 py-0.5 bg-wine-gold/20 text-wine-gold text-xs rounded-full">
                                ⚠️ Large list
                            </span>
                        )}
                    </div>
                </div>

                {/* Body */}
                <div className="px-6 py-4 space-y-4 overflow-y-auto custom-scrollbar flex-1">

                    {/* Mode Selection */}
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-wine-gold">추천 방식을 선택하세요:</label>

                        <label className="flex items-start gap-3 p-3 rounded-xl border border-wine-glassBorder hover:border-wine-gold/50 cursor-pointer transition-colors">
                            <input
                                type="radio"
                                name="mode"
                                value="food-to-wine"
                                checked={mode === 'food-to-wine'}
                                onChange={() => setMode('food-to-wine')}
                                className="mt-0.5"
                            />
                            <div className="flex-1">
                                <div className="font-medium text-wine-cream">음식 → 와인 추천</div>
                                <div className="text-xs text-wine-creamDim mt-0.5">먹을 음식에 맞는 와인 추천</div>
                            </div>
                        </label>

                        <label className="flex items-start gap-3 p-3 rounded-xl border border-wine-glassBorder hover:border-wine-gold/50 cursor-pointer transition-colors">
                            <input
                                type="radio"
                                name="mode"
                                value="wine-to-food"
                                checked={mode === 'wine-to-food'}
                                onChange={() => setMode('wine-to-food')}
                                className="mt-0.5"
                            />
                            <div className="flex-1">
                                <div className="font-medium text-wine-cream">와인 → 음식 추천</div>
                                <div className="text-xs text-wine-creamDim mt-0.5">선택한 와인에 맞는 음식 추천</div>
                            </div>
                        </label>

                        <label className="flex items-start gap-3 p-3 rounded-xl border border-wine-glassBorder hover:border-wine-gold/50 cursor-pointer transition-colors">
                            <input
                                type="radio"
                                name="mode"
                                value="wine-only"
                                checked={mode === 'wine-only'}
                                onChange={() => setMode('wine-only')}
                                className="mt-0.5"
                            />
                            <div className="flex-1">
                                <div className="font-medium text-wine-cream">와인 테이스팅</div>
                                <div className="text-xs text-wine-creamDim mt-0.5">음식 없이 와인만 즐기기</div>
                            </div>
                        </label>
                    </div>

                    {/* Food Input (food-to-wine mode) */}
                    {mode === 'food-to-wine' && (
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-wine-gold">먹을 음식:</label>
                            <input
                                type="text"
                                value={foodInput}
                                onChange={(e) => setFoodInput(e.target.value)}
                                placeholder="예: 안심 스테이크, 연어 회, 치즈 플래터..."
                                className="w-full bg-wine-glass border border-wine-gold/30 rounded-xl py-2.5 px-4 text-wine-cream placeholder-wine-creamDim focus:outline-none focus:border-wine-gold transition-colors text-sm"
                            />
                        </div>
                    )}

                    {/* Wine Selection (wine-to-food mode) */}
                    {mode === 'wine-to-food' && (
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-wine-gold">
                                와인 선택 ({selectedWineIds.size}/{wines.length}):
                            </label>
                            <div className="bg-wine-glass border border-wine-glassBorder rounded-xl p-2 max-h-60 sm:max-h-48 overflow-y-auto custom-scrollbar">
                                <div className="grid grid-cols-1 gap-0.5">
                                    {wines.map((wine) => (
                                        <label
                                            key={wine.rowNumber}
                                            className={`flex items-center gap-2 cursor-pointer px-3 py-2.5 sm:py-1.5 rounded transition-colors text-sm sm:text-xs ${
                                                selectedWineIds.has(wine.rowNumber)
                                                    ? 'bg-wine-gold/20 text-wine-gold'
                                                    : 'hover:bg-wine-glass/50 text-wine-cream'
                                            }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedWineIds.has(wine.rowNumber)}
                                                onChange={() => toggleWineSelection(wine.rowNumber)}
                                                className="w-4 h-4 sm:w-3 sm:h-3 flex-shrink-0"
                                            />
                                            <span className="truncate">
                                                {wine.name}{wine.vintage ? ` '${String(wine.vintage).slice(-2)}` : ''}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Info */}
                    <div className="bg-wine-glass border border-wine-gold/20 rounded-xl p-3">
                        <div className="flex gap-2">
                            <span className="text-lg">💡</span>
                            <div className="flex-1 text-xs text-wine-creamDim leading-relaxed">
                                모든 와인은 냉장고에 보관 중입니다. AI가 서빙 온도와 준비 방법(미리 꺼내둘 시간, 디캔팅 등)을 안내해드립니다.
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-wine-glassBorder bg-wine-dark/50">
                    <button
                        onClick={handleShare}
                        className="w-full py-4 bg-gradient-to-r from-wine-gold to-wine-goldDark text-wine-dark font-bold text-base sm:text-lg rounded-xl active:scale-95 transition-transform shadow-wine flex items-center justify-center gap-2"
                    >
                        {hasShareAPI ? (
                            <>
                                <span>🔗</span>
                                <span>Share to App</span>
                            </>
                        ) : (
                            <>
                                <span>📋</span>
                                <span>Copy to Clipboard</span>
                            </>
                        )}
                    </button>

                    {/* Copy Success Toast */}
                    {showCopySuccess && (
                        <div className="mt-3 px-4 py-2 bg-wine-gold/20 border border-wine-gold/40 rounded-lg text-center text-wine-gold text-sm animate-in fade-in duration-200">
                            ✓ Copied! Paste into ChatGPT or Gemini
                        </div>
                    )}
                </div>
            </div>

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: rgba(201, 160, 80, 0.1);
                    border-radius: 3px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(201, 160, 80, 0.3);
                    border-radius: 3px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(201, 160, 80, 0.5);
                }
            `}</style>
        </div>
    );
};
