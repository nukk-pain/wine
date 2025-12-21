import React from 'react';

export const ErrorMessage: React.FC<{ message: string }> = ({ message }) => (
    <div className="text-center py-8">
        <div className="text-lg font-body font-medium text-wine-red bg-wine-red/10 rounded-xl p-4 border border-wine-red/40">
            {message}
        </div>
    </div>
);
