import React from 'react';

interface ProcessingStepProps {
    title: string;
    children: React.ReactNode;
    className?: string;
}

export const ProcessingStep: React.FC<ProcessingStepProps> = ({ title, children, className = "" }) => (
    <section className={`relative group ${className}`}>
        {/* Glassmorphism container */}
        <div className="relative backdrop-blur-xl bg-wine-glass border border-wine-glassBorder rounded-2xl p-6 transition-all duration-500 hover:bg-wine-glassHover hover:border-wine-gold/30">
            {/* Top decorative line */}
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-wine-gold/40 to-transparent" />

            {title && (
                <h2 className="font-playfair text-xl text-wine-cream font-normal mb-6">
                    {title}
                </h2>
            )}

            {/* Content */}
            <div className="relative z-10">
                {children}
            </div>

            {/* Hover glow effect */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-gradient-radial from-wine-gold/5 to-transparent rounded-2xl" />
        </div>
    </section>
);
