
import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { DashboardWineCard, DashboardWineRow } from '@/components/DashboardWineCard';
import { WineDetailModal } from '@/components/WineDetailModal';

export default function Dashboard() {
    const [wines, setWines] = useState<DashboardWineRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState('');
    const [selectedWine, setSelectedWine] = useState<DashboardWineRow | null>(null);
    const [activeTab, setActiveTab] = useState<'stock' | 'consumed'>('stock');

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
        setWines(prev => prev.map(w => w.rowNumber === rowNumber ? { ...w, status: 'Consumed' } : w));

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

    const filteredWines = wines.filter(wine => {
        const matchesSearch =
            wine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            wine.producer.toLowerCase().includes(searchTerm.toLowerCase()) ||
            wine.vintage.includes(searchTerm);

        if (!matchesSearch) return false;

        // If searching, show all matches regardless of tab
        if (searchTerm) return true;

        // Otherwise filter by tab
        if (activeTab === 'stock') return wine.status === 'In Stock';
        return wine.status === 'Consumed';
    });

    return (
        <div className="min-h-screen bg-wine-dark text-wine-cream font-body pb-20">
            <Head>
                <title>Wine Cellar Dashboard</title>
                <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
            </Head>

            {/* Header */}
            <div className="sticky top-0 z-50 bg-wine-dark/80 backdrop-blur-md border-b border-wine-glassBorder px-4 pt-4 pb-0">
                <h1 className="text-2xl font-playfair font-bold text-wine-gold mb-4 text-center">My Wine Cellar</h1>

                {/* Search Bar */}
                <div className="relative mb-4">
                    <input
                        type="text"
                        placeholder="Search all wines..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-wine-glass border border-wine-gold/30 rounded-xl py-3 px-4 text-wine-cream placeholder-wine-creamDim focus:outline-none focus:border-wine-gold transition-colors"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-wine-gold/50">
                        🔍
                    </div>
                </div>

                {/* Tabs */}
                {!searchTerm && (
                    <div className="flex gap-6 justify-center">
                        <button
                            onClick={() => setActiveTab('stock')}
                            className={`pb-3 text-sm font-medium transition-all relative ${activeTab === 'stock' ? 'text-wine-gold' : 'text-wine-creamDim hover:text-wine-cream'
                                }`}
                        >
                            In Cellar ({wines.filter(w => w.status === 'In Stock').length})
                            {activeTab === 'stock' && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-wine-gold rounded-t-full" />
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab('consumed')}
                            className={`pb-3 text-sm font-medium transition-all relative ${activeTab === 'consumed' ? 'text-wine-gold' : 'text-wine-creamDim hover:text-wine-cream'
                                }`}
                        >
                            History ({wines.filter(w => w.status === 'Consumed').length})
                            {activeTab === 'consumed' && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-wine-gold rounded-t-full" />
                            )}
                        </button>
                    </div>
                )}
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
                                onClick={() => setSelectedWine(wine)}
                            />
                        ))}
                    </div>
                )}
            </main>

            {/* Detail Modal */}
            {selectedWine && (
                <WineDetailModal
                    wine={selectedWine}
                    onClose={() => setSelectedWine(null)}
                />
            )}
        </div>
    );
}
