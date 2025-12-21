import { useState } from 'react';
import Head from 'next/head';
import { ImageUpload } from '@/components/ImageUpload';
import { WineBatchResultDisplay } from '@/components/WineBatchResultDisplay';
import { ProcessingProgress } from '@/components/ProcessingProgress';
import { ImageProcessingItem, NotionWineProperties } from '@/types';
import { useImageUpload } from '@/hooks/useImageUpload';
import { useWineAnalysis } from '@/hooks/useWineAnalysis';
import { useNotionSave } from '@/hooks/useNotionSave';

// Mobile-first layout components
const MobileLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="flex flex-col space-y-4">
    {children}
  </div>
);

// Mobile-optimized processing step wrapper - Wine Cellar glassmorphism
const ProcessingStep = ({ title, children, className = "" }: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) => (
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

// Mobile-optimized loading spinner - Wine Cellar theme
const LoadingSpinner = ({ message }: { message: string }) => (
  <div className="text-center py-8">
    <div className="text-lg font-body font-medium text-wine-cream mb-4">{message}</div>
    <div className="flex justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-wine-gold"></div>
    </div>
  </div>
);

// Mobile-optimized error message - Wine Cellar theme
const ErrorMessage = ({ message }: { message: string }) => (
  <div className="text-center py-8">
    <div className="text-lg font-body font-medium text-wine-red bg-wine-red/10 rounded-xl p-4 border border-wine-red/40">
      {message}
    </div>
  </div>
);

export default function MainPage() {
  const [processingItems, setProcessingItems] = useState<ImageProcessingItem[]>([]);

  // Hooks
  const { uploadFiles, isUploading, error: uploadError } = useImageUpload();
  const { analyzeBatch, analyzeRetry, isAnalyzing, error: analysisError } = useWineAnalysis();
  const { saveAll, saveSelected, saveIndividual, isSaving, saveProgress } = useNotionSave();

  // Combined Loading/Error state for UI
  const isLoading = isUploading || isAnalyzing || isSaving;
  // Display analysis error or upload error.
  const error = analysisError || uploadError;

  const handleImageUpload = async (files: File[]) => {
    const results = await uploadFiles(files);

    if (results.length > 0) {
      const newItems: ImageProcessingItem[] = results.map((res, index) => ({
        id: `${Date.now()}-${index}`,
        file: res.file,
        preview: res.preview,
        status: 'uploaded',
        progress: 0
      }));
      setProcessingItems(prev => [...prev, ...newItems]);
    }
  };

  const onItemUpdate = (id: string, updates: Partial<ImageProcessingItem>) => {
    setProcessingItems(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const handleBatchAnalysis = async () => {
    const targetItems = processingItems.filter(item => item.status === 'uploaded' || item.status === 'error');
    if (targetItems.length > 0) {
      await analyzeBatch(targetItems, onItemUpdate);
    }
  };

  const handleRetryAnalysis = async (id: string) => {
    const item = processingItems.find(i => i.id === id);
    if (item) {
      await analyzeRetry(item, onItemUpdate);
    }
  };

  const handleSaveAll = async (items: any[]) => {
    // We ignore passed items and save all completed from state to ensure consistency, 
    // or we can use the filtered list if needed. 
    // Using processingItems is safer for global state sync.
    await saveAll(processingItems, onItemUpdate);
  };

  const handleSaveSelected = async (items: any[]) => {
    const ids = items.map((i: any) => i.id);
    await saveSelected(processingItems, ids, onItemUpdate);
  };

  const handleSaveIndividual = async (id: string, data: NotionWineProperties) => {
    return await saveIndividual(id, data);
  };

  const handleAddManual = async (data: NotionWineProperties) => {
    // Empty ID signals manual entry in our updated useNotionSave logic
    return await saveIndividual('', data);
  };

  const handleDelete = (id: string) => {
    setProcessingItems(prev => prev.filter(i => i.id !== id));
  };

  return (
    <>
      <Head>
        <title>Wine Cellar</title>
        <meta name="description" content="Track your personal wine collection with AI-powered label recognition" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="theme-color" content="#1a0a0a" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="min-h-screen bg-wine-dark relative overflow-hidden">
        {/* Main gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-wine-dark via-wine-deep to-wine-midnight" />

        {/* Noise texture for cellar atmosphere */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' /%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat',
          }}
        />

        {/* Top glow effect (wine cellar lighting) */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-80 bg-wine-gold/10 rounded-full blur-[120px] pointer-events-none" />

        {/* Content layer */}
        <div className="relative z-10 container mx-auto px-4 py-6 max-w-md">
          {/* Mobile-first header */}
          <header className="text-center mb-10 pt-6">
            <div className="mb-3">
              <h1 className="font-playfair text-[32px] font-light text-wine-gold tracking-wide leading-tight">
                Wine Cellar
              </h1>
              <div className="w-16 h-[1px] bg-gradient-to-r from-transparent via-wine-gold/50 to-transparent mx-auto mt-2" />
            </div>
            <p className="font-body text-[13px] text-wine-creamDim tracking-[0.1em] uppercase">
              Personal Collection
            </p>
          </header>

          {/* Mobile-first single column layout */}
          <MobileLayout>
            <ProcessingStep title="Upload Images">
              <div data-testid="upload-area">
                <ImageUpload
                  onUpload={handleImageUpload}
                  multiple={true}
                />
              </div>
            </ProcessingStep>

            {/* Multiple images preview and progress */}
            {processingItems.length > 0 && (
              <>

                <ProcessingStep title="Analysis Progress">
                  <ProcessingProgress items={processingItems} />
                </ProcessingStep>

                {processingItems.some(item => item.status === 'uploaded' || item.status === 'error') && (
                  <ProcessingStep title="Batch Analysis">
                    <div className="text-center">
                      <p className="text-wine-creamDim font-body mb-6">
                        AI will analyze {processingItems.filter(item => item.status === 'uploaded' || item.status === 'error').length} selected images
                        to extract wine information.
                      </p>
                      <button
                        onClick={handleBatchAnalysis}
                        disabled={isLoading}
                        className="w-full py-4 px-6 min-h-[56px] bg-gradient-to-r from-wine-gold to-wine-goldDark text-wine-dark text-lg font-body font-semibold rounded-xl shadow-wine hover:shadow-wine-lg hover:from-wine-goldDark hover:to-wine-gold transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
                      >
                        {isLoading ? 'Analyzing...' : 'Analyze All Images'}
                      </button>
                    </div>
                  </ProcessingStep>
                )}

                {/* Batch Results Display - show when analysis is complete */}
                {processingItems.some(item => item.status === 'completed') && (
                  <ProcessingStep title="Analysis Results">
                    <WineBatchResultDisplay
                      items={processingItems}
                      onSaveAll={handleSaveAll}
                      onSaveSelected={handleSaveSelected}
                      onSaveIndividual={handleSaveIndividual}
                      onAddManual={handleAddManual}
                      onRetryAnalysis={handleRetryAnalysis}
                      onDelete={handleDelete}
                      loading={isSaving}
                    />
                  </ProcessingStep>
                )}
              </>
            )}

            {error && (
              <ProcessingStep title="">
                <ErrorMessage message={error} />
              </ProcessingStep>
            )}
          </MobileLayout>
        </div>
      </main>
    </>
  );
}