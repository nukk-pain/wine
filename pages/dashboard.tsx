
import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { DashboardWineCard, DashboardWineRow } from '@/components/DashboardWineCard';

export default function Dashboard() {
    const [wines, setWines] = useState<DashboardWineRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        fetchWines();
    }, []);

    const fetchWines = async () => {
        try {
            const response = await fetch('/api/wines');
            if (!response.ok) throw new Error('Failed to fetch wines');
            const data = await response.json();
            setWines(data.data || []);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleConsume = async (rowNumber: number) => {
        // Optimistic UI update
        const previousWines = [...wines];
        setWines(prev => prev.filter(w => w.rowNumber !== rowNumber));

        try {
            const response = await fetch('/api/wines', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rowNumber, status: 'Consumed' })
            });

            if (!response.ok) {
                throw new Error('Failed to update status');
            }
        } catch (err) {
            console.error(err);
            alert('Failed to update status. Reverting changes.');
            setWines(previousWines);
        }
    };

    const filteredWines = wines.filter(wine =>
        wine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        wine.producer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        wine.vintage.includes(searchTerm)
    );

    return (
        <div className="min-h-screen bg-wine-dark text-wine-cream font-body pb-20">
            <Head>
                <title>Wine Cellar Dashboard</title>
                <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
            </Head>

            {/* Header */}
            <div className="sticky top-0 z-50 bg-wine-dark/80 backdrop-blur-md border-b border-wine-glassBorder px-4 py-4">
                <h1 className="text-2xl font-playfair font-bold text-wine-gold mb-4 text-center">My Wine Cellar</h1>

                {/* Search Bar */}
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search wines..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-wine-glass border border-wine-gold/30 rounded-xl py-3 px-4 text-wine-cream placeholder-wine-creamDim focus:outline-none focus:border-wine-gold transition-colors"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-wine-gold/50">
                        🔍
                    </div>
                </div>
            </div>

            {/* Content */}
            <main className="px-4 py-6 max-w-md mx-auto">
                {error && (
                    <div className="bg-wine-red/20 border border-wine-red/50 text-wine-red px-4 py-3 rounded-xl mb-4 text-sm">
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="text-center py-10 text-wine-creamDim">Loading cellar...</div>
                ) : filteredWines.length === 0 ? (
                    <div className="text-center py-10 text-wine-creamDim">
                        {searchTerm ? 'No wines found matching your search.' : 'Your cellar is empty! Time to go shopping.'}
                    </div>
                ) : (
                    <div className="space-y-2">
                        {filteredWines.map((wine) => (
                            <DashboardWineCard
                                key={`${wine.rowNumber}-${wine.name}`} // Use composite key for uniqueness
                                wine={wine}
                                onConsume={handleConsume}
                            />
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
