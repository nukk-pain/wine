import { useState, useCallback } from 'react';

interface UseWineSelectionReturn {
    selectedIds: Set<string>;
    isSelected: (id: string) => boolean;
    toggleSelection: (id: string) => void;
    selectAll: (ids: string[]) => void;
    clearSelection: () => void;
    selectedCount: number;
}

export function useWineSelection(initialIds: string[] = []): UseWineSelectionReturn {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(initialIds));

    const isSelected = useCallback((id: string) => {
        return selectedIds.has(id);
    }, [selectedIds]);

    const toggleSelection = useCallback((id: string) => {
        setSelectedIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    }, []);

    const selectAll = useCallback((ids: string[]) => {
        setSelectedIds(new Set(ids));
    }, []);

    const clearSelection = useCallback(() => {
        setSelectedIds(new Set());
    }, []);

    return {
        selectedIds,
        isSelected,
        toggleSelection,
        selectAll,
        clearSelection,
        selectedCount: selectedIds.size
    };
}
