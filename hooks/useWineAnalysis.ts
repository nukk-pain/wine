import { useState, useCallback } from 'react';
import { ImageProcessingItem, ProcessResponse, ApiSuccessResponse, ApiErrorResponse } from '@/types';
import { normalizeWineInfo } from '@/lib/utils/wine-data-helpers';

interface UseWineAnalysisReturn {
    isAnalyzing: boolean;
    error: string | null;
    analyzeBatch: (
        items: ImageProcessingItem[],
        onItemComplete: (id: string, result: Partial<ImageProcessingItem>) => void
    ) => Promise<void>;
    analyzeRetry: (
        item: ImageProcessingItem,
        onComplete: (id: string, result: Partial<ImageProcessingItem>) => void
    ) => Promise<void>;
}

export function useWineAnalysis(): UseWineAnalysisReturn {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const analyzeItem = async (
        item: ImageProcessingItem,
        onComplete: (id: string, result: Partial<ImageProcessingItem>) => void
    ) => {
        try {
            // Start processing status
            onComplete(item.id, { status: 'processing', error: undefined });

            const formData = new FormData();
            formData.append('image', item.file);
            formData.append('type', 'wine_label'); // Default to wine_label
            formData.append('useGemini', 'true'); // Use Gemini for analysis

            const response = await fetch('/api/process', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || '분석 실패');
            }

            const successData = data as ApiSuccessResponse<ProcessResponse>;
            const resultData = successData.data;

            // Update item with success result
            onComplete(item.id, {
                status: 'completed',
                imageType: resultData.type as any, // Cast if mismatch with strict enum
                extractedData: resultData.extractedData,
                uploadedUrl: resultData.uploadedUrl,
            });

        } catch (err: any) {
            console.error(`Error analyzing item ${item.id}: `, err);
            onComplete(item.id, {
                status: 'error',
                error: err.message || '분석 중 오류 발생'
            });
        }
    };

    const analyzeBatch = useCallback(async (
        items: ImageProcessingItem[],
        onItemComplete: (id: string, result: Partial<ImageProcessingItem>) => void
    ) => {
        if (items.length === 0) return;

        setIsAnalyzing(true);
        setError(null);

        try {
            // Parallel processing with concurrency limit
            // Process up to MAX_CONCURRENT items at once to balance speed and API limits
            const MAX_CONCURRENT = 3; // Adjust based on API rate limits

            const pendingItems = items.filter(item =>
                item.status === 'pending' ||
                item.status === 'uploaded' ||
                item.status === 'error'
            );

            // Process in batches for controlled parallelism
            for (let i = 0; i < pendingItems.length; i += MAX_CONCURRENT) {
                const batch = pendingItems.slice(i, i + MAX_CONCURRENT);

                // Process batch items in parallel
                await Promise.all(
                    batch.map(item => analyzeItem(item, onItemComplete))
                );
            }

        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsAnalyzing(false);
        }
    }, []);

    const analyzeRetry = useCallback(async (
        item: ImageProcessingItem,
        onComplete: (id: string, result: Partial<ImageProcessingItem>) => void
    ) => {
        setIsAnalyzing(true);
        setError(null);
        try {
            await analyzeItem(item, onComplete);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsAnalyzing(false);
        }
    }, []);

    return {
        isAnalyzing,
        error,
        analyzeBatch,
        analyzeRetry
    };
}
