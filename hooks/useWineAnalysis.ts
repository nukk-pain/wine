import { useState, useCallback } from 'react';
import { ImageProcessingItem, ProcessResponse, ApiSuccessResponse, ApiErrorResponse } from '@/types';
import { convertToNotionFormat } from '@/lib/utils/notion-helpers';

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
            formData.append('imageType', 'wine_label'); // Defaulting to wine_label for now
            // If we support receipts, we need to pass that info. 
            // But items don't have imageType set yet usually? Or passed in item?
            // item.imageType might be set if manually selected.

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
            console.error(`Error analyzing item ${item.id}:`, err);
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
            // Process strictly sequentially or parallel?
            // Existing index.tsx `analyzeImage` is 1 by 1 inside loop?
            // `handleBatchAnalyze` uses `for ... of` with `await`. So SEQUENTIAL.
            // Sequential is safer for rate limits.

            const pendingItems = items.filter(item =>
                item.status === 'pending' ||
                item.status === 'uploaded' ||
                item.status === 'error'
            );

            for (const item of pendingItems) {
                await analyzeItem(item, onItemComplete);
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
