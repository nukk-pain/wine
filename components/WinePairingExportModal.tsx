import React, { useEffect, useState } from 'react';
import { WineRow } from '@/lib/google-sheets';
import { generatePairingPrompt } from '@/lib/utils/WineListFormatter';

interface WinePairingExportModalProps {
    wines: WineRow[];
    onClose: () => void;
}

export const WinePairingExportModal: React.FC<WinePairingExportModalProps> = ({ wines, onClose }) => {
    const [showCopySuccess, setShowCopySuccess] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
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

    const handleShare = async () => {
        const prompt = generatePairingPrompt(wines);

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
            <div className="relative w-full max-w-lg bg-wine-dark/95 backdrop-blur-md border-t sm:border border-wine-gold/30 rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[85vh] sm:max-h-[70vh] overflow-hidden animate-in slide-in-from-bottom sm:fade-in sm:zoom-in-95 duration-300">

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
                <div className="px-6 py-4 space-y-4 max-h-[50vh] overflow-y-auto custom-scrollbar">

                    {/* Wine List Preview */}
                    <div className="space-y-2">
                        <button
                            onClick={() => setShowPreview(!showPreview)}
                            className="flex items-center gap-2 text-wine-gold hover:text-wine-goldDark transition-colors text-sm font-medium"
                        >
                            <span>{showPreview ? '▼' : '▶'}</span>
                            <span>📝 와인 목록 미리보기</span>
                        </button>

                        {showPreview && (
                            <div className="pl-6 space-y-2 text-sm text-wine-cream bg-wine-glass border border-wine-glassBorder rounded-xl p-4 max-h-48 overflow-y-auto custom-scrollbar">
                                {wines.slice(0, 10).map((wine, index) => (
                                    <div key={index} className="text-wine-creamDim">
                                        • {wine.name} {wine.vintage && `(${wine.vintage})`}
                                    </div>
                                ))}
                                {wines.length > 10 && (
                                    <div className="text-wine-gold text-xs italic">
                                        ... and {wines.length - 10} more wines
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Tip */}
                    <div className="bg-wine-glass border border-wine-gold/20 rounded-xl p-4">
                        <div className="flex gap-3">
                            <span className="text-2xl">💡</span>
                            <div className="flex-1 text-sm text-wine-cream leading-relaxed">
                                <p className="font-medium text-wine-gold mb-1">How it works:</p>
                                {hasShareAPI ? (
                                    <p className="text-wine-creamDim">
                                        Select ChatGPT or Gemini from the share menu. The app will open with your wine list, ready for pairing recommendations.
                                    </p>
                                ) : (
                                    <p className="text-wine-creamDim">
                                        Your wine list will be copied to clipboard. Open ChatGPT or Gemini and paste to get pairing recommendations.
                                    </p>
                                )}
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
