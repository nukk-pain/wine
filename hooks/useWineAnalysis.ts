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

// NOTE: Delay utility for rate limiting
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// NOTE: Retry configuration for 429 rate limit errors
const RETRY_CONFIG = {
    maxRetries: 3,
    baseDelay: 1000,  // 1 second
    maxDelay: 10000,  // 10 seconds
};

export function useWineAnalysis(): UseWineAnalysisReturn {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const analyzeItemWithRetry = async (
        item: ImageProcessingItem,
        onComplete: (id: string, result: Partial<ImageProcessingItem>) => void,
        retryCount = 0
    ): Promise<void> => {
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

            // NOTE: Handle 429 rate limit with exponential backoff retry
            if (response.status === 429) {
                if (retryCount < RETRY_CONFIG.maxRetries) {
                    const backoffDelay = Math.min(
                        RETRY_CONFIG.baseDelay * Math.pow(2, retryCount),
                        RETRY_CONFIG.maxDelay
                    );
                    console.warn(`[429] Rate limited for item ${item.id}, retrying in ${backoffDelay}ms (attempt ${retryCount + 1}/${RETRY_CONFIG.maxRetries})`);
                    await delay(backoffDelay);
                    return analyzeItemWithRetry(item, onComplete, retryCount + 1);
                } else {
                    // NOTE: Max retries exceeded - throw clear error for frontend
                    throw new Error(`API 요청 한도 초과 (${RETRY_CONFIG.maxRetries}회 재시도 실패). 잠시 후 다시 시도해주세요.`);
                }
            }

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
            // NOTE: Re-throw to signal failure to Promise.allSettled
            throw err;
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
            // NOTE: Increased to 4 for paid Gemini tier with higher rate limits
            const MAX_CONCURRENT = 4;

            const pendingItems = items.filter(item =>
                item.status === 'pending' ||
                item.status === 'uploaded' ||
                item.status === 'error'
            );

            // NOTE: Delay between batches to avoid Gemini API rate limits (429)
            const BATCH_DELAY_MS = 1000;

            // NOTE: Track if any failure occurred to stop processing remaining batches
            let hasFailure = false;

            // Process in batches for controlled parallelism
            for (let i = 0; i < pendingItems.length; i += MAX_CONCURRENT) {
                // NOTE: Stop processing if previous batch had failures
                if (hasFailure) {
                    // Mark remaining items as skipped
                    const remainingItems = pendingItems.slice(i);
                    remainingItems.forEach(item => {
                        onItemComplete(item.id, {
                            status: 'error',
                            error: '이전 작업 실패로 건너뜀. 재시도 버튼을 눌러주세요.'
                        });
                    });
                    break;
                }

                const batch = pendingItems.slice(i, i + MAX_CONCURRENT);

                // Process batch items and track failures using allSettled
                const results = await Promise.allSettled(
                    batch.map(item => analyzeItemWithRetry(item, onItemComplete))
                );

                // NOTE: Check if any item in this batch failed (rejected promise)
                hasFailure = results.some(result => result.status === 'rejected');

                // Add delay between batches to prevent rate limiting
                if (!hasFailure && i + MAX_CONCURRENT < pendingItems.length) {
                    await delay(BATCH_DELAY_MS);
                }
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
            await analyzeItemWithRetry(item, onComplete);
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
