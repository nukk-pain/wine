import React from 'react';

export const LoadingSpinner: React.FC<{ message: string }> = ({ message }) => (
    <div className="text-center py-8">
        <div className="text-lg font-body font-medium text-wine-cream mb-4">{message}</div>
        <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-wine-gold"></div>
        </div>
    </div>
);
