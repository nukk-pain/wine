import React from 'react';

export const MobileLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="flex flex-col space-y-4">
        {children}
    </div>
);
