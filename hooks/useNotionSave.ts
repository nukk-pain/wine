import { useState, useCallback } from 'react';
import { ImageProcessingItem, NotionWineProperties, NotionSaveResult } from '@/types';
import { convertToNotionFormat } from '@/lib/utils/wine-data-helpers';

interface UseNotionSaveReturn {
    isSaving: boolean;
    saveProgress: {
        current: number;
        total: number;
    };
    saveAll: (
        items: ImageProcessingItem[],
        onItemUpdate: (id: string, updates: Partial<ImageProcessingItem>) => void
    ) => Promise<void>;
    saveSelected: (
        items: ImageProcessingItem[],
        selectedIds: string[], // In case items is full list, we filter
        onItemUpdate: (id: string, updates: Partial<ImageProcessingItem>) => void
    ) => Promise<void>;
    saveIndividual: (
        itemId: string,
        data: NotionWineProperties,
        onSuccess?: () => void
    ) => Promise<boolean>;
}

export function useNotionSave(): UseNotionSaveReturn {
    const [isSaving, setIsSaving] = useState(false);
    const [saveProgress, setSaveProgress] = useState({ current: 0, total: 0 });

    const saveItemToNotion = async (item: ImageProcessingItem, dataToSave: NotionWineProperties): Promise<NotionSaveResult> => {
        const response = await fetch('/api/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'save_wine',
                data: dataToSave,
                source: 'wine_label'
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Notion 저장 실패');
        }

        return await response.json();
    };

    const saveAll = useCallback(async (
        items: ImageProcessingItem[],
        onItemUpdate: (id: string, updates: Partial<ImageProcessingItem>) => void
    ) => {
        // Filter items that are completed and NOT saved yet?
        // Or save all passed items.
        // Generally 'Save All' implies saving all 'completed' items.
        const targets = items.filter(item => item.status === 'completed' && !!item.extractedData);

        if (targets.length === 0) return;

        setIsSaving(true);
        setSaveProgress({ current: 0, total: targets.length });

        // Parallel or Sequential? Notion API rate limits suggest Sequential or throttled.
        let completedCount = 0;

        for (const item of targets) {
            onItemUpdate(item.id, { status: 'saving' });
            try {
                // Need to convert data. extractedData -> NotionWineProperties
                // Using helper
                // Note: extractedData might allow any, so we assume it has required fields or helper handles it
                const wineData = convertToNotionFormat(item.extractedData!);

                // If image is available (uploadedUrl), we should pass it?
                // NotionWineProperties has 'Image' field.
                if (item.uploadedUrl) {
                    wineData.Image = item.uploadedUrl;
                }

                const result = await saveItemToNotion(item, wineData);

                onItemUpdate(item.id, {
                    status: 'saved',
                    notionResult: result
                });
            } catch (error: any) {
                console.error(`Failed to save item ${item.id}`, error);
                onItemUpdate(item.id, {
                    status: 'error',
                    error: `저장 실패: ${error.message}`
                });
            }

            completedCount++;
            setSaveProgress({ current: completedCount, total: targets.length });
        }

        setIsSaving(false);
    }, []);

    const saveSelected = useCallback(async (
        items: ImageProcessingItem[],
        selectedIds: string[], // ids of items to save
        onItemUpdate: (id: string, updates: Partial<ImageProcessingItem>) => void
    ) => {
        // Identify items from IDs
        const targets = items.filter(item => selectedIds.includes(item.id) && item.status === 'completed' && !!item.extractedData);

        if (targets.length === 0) return;

        setIsSaving(true);
        setSaveProgress({ current: 0, total: targets.length });

        let completedCount = 0;
        for (const item of targets) {
            onItemUpdate(item.id, { status: 'saving' });
            try {
                const wineData = convertToNotionFormat(item.extractedData!);
                if (item.uploadedUrl) wineData.Image = item.uploadedUrl;

                const result = await saveItemToNotion(item, wineData);

                onItemUpdate(item.id, {
                    status: 'saved',
                    notionResult: result
                });
            } catch (error: any) {
                onItemUpdate(item.id, {
                    status: 'error',
                    error: `저장 실패: ${error.message}`
                });
            }
            completedCount++;
            setSaveProgress({ current: completedCount, total: targets.length });
        }
        setIsSaving(false);
    }, []);

    const saveIndividual = useCallback(async (
        itemId: string,
        data: NotionWineProperties,
        onSuccess?: () => void
    ) => {
        console.log('[useNotionSave] saveIndividual called with itemId:', itemId);
        console.log('[useNotionSave] data to save:', data);

        setIsSaving(true);
        try {
            // Here we don't have the 'item' object, just ID and data.
            // But saveItemToNotion helper (if I reused logic) might need item?
            // Actually saveItemToNotion was defined inside component using 'item' in closure?
            // Ah, current saveItemToNotion takes `item`.
            // I should refactor saveItemToNotion to not need item, or create a simpler fetcher.
            // Or just inline fetch here.

            const response = await fetch('/api/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'save_wine',
                    data: data,
                    source: itemId ? 'wine_label' : 'manual_entry'
                }),
            });

            if (!response.ok) {
                throw new Error('Notion 저장 실패');
            }

            if (onSuccess) onSuccess();
            return true;
        } catch (error) {
            console.error(error);
            return false;
        } finally {
            setIsSaving(false);
        }
    }, []);

    return {
        isSaving,
        saveProgress,
        saveAll,
        saveSelected,
        saveIndividual
    };
}
