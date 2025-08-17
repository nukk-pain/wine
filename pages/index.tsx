// pages/index.tsx
import { useState } from 'react';
import Head from 'next/head';
import { ImageUpload } from '@/components/ImageUpload';
import { ImageTypeSelector, ImageType } from '@/components/ImageTypeSelector';
import { WineResultDisplay } from '@/components/WineResultDisplay';
import { DataConfirmation } from '@/components/DataConfirmation';
import { ImagePreviewGrid, ImageProcessingItem } from '@/components/ImagePreviewGrid';
import { ProcessingProgress } from '@/components/ProcessingProgress';
import { WineBatchResultDisplay } from '@/components/WineBatchResultDisplay';
import { NotionWineProperties } from '@/lib/notion-schema';

// Mobile-first layout components
const MobileLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="flex flex-col space-y-4">
    {children}
  </div>
);

// Mobile-optimized processing step wrapper
const ProcessingStep = ({ title, children, className = "" }: { 
  title: string; 
  children: React.ReactNode;
  className?: string;
}) => (
  <section className={`bg-white rounded-xl shadow-lg p-6 ${className}`}>
    {title && <h2 className="text-xl font-bold mb-6 text-gray-800">{title}</h2>}
    {children}
  </section>
);

// Mobile-optimized loading spinner
const LoadingSpinner = ({ message }: { message: string }) => (
  <div className="text-center py-8">
    <div className="text-lg font-medium text-gray-700 mb-4">{message}</div>
    <div className="flex justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600"></div>
    </div>
  </div>
);

// Mobile-optimized error message
const ErrorMessage = ({ message }: { message: string }) => (
  <div className="text-center py-8">
    <div className="text-lg font-medium text-red-600 bg-red-50 rounded-lg p-4 border border-red-200">
      ⚠️ 오류: {message}
    </div>
  </div>
);

interface ProcessedData {
  type: 'wine_label' | 'receipt';
  extractedData: any;
  notionResult?: any;
  notionResults?: any[];
  savedImagePath?: string;
}

interface ConfirmationData {
  type: 'wine_label' | 'receipt';
  extractedData: any;
  savedImagePath?: string;
}

export default function MainPage() {
  // Multiple images mode (only mode)
  const [processingItems, setProcessingItems] = useState<ImageProcessingItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>('');

  const handleImageUpload = async (files: File[]) => {
    handleMultipleImageUpload(files);
  };

  const handleMultipleImageUpload = async (files: File[]) => {
    setError('');
    setLoading(true);
    
    try {
      console.log(`📤 [CLIENT] Starting batch upload for ${files.length} files`);
      
      // Split files into batches of 5
      const BATCH_SIZE = 5;
      const batches: File[][] = [];
      for (let i = 0; i < files.length; i += BATCH_SIZE) {
        batches.push(files.slice(i, i + BATCH_SIZE));
      }
      
      console.log(`📦 [CLIENT] Split into ${batches.length} batches`);
      
      // Initialize processing items for all files
      const allItems: ImageProcessingItem[] = files.map((file, index) => ({
        id: `${Date.now()}-${index}`,
        file,
        url: URL.createObjectURL(file),
        status: 'uploaded',
        uploadResult: null
      }));
      
      setProcessingItems(allItems);
      
      // Process each batch sequentially
      const allResults: any[] = [];
      
      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];
        console.log(`📋 [CLIENT] Processing batch ${batchIndex + 1}/${batches.length} (${batch.length} files)`);
        
        try {
          // Use individual uploads instead of batch upload API
          const batchResults = await Promise.allSettled(
            batch.map(async (file, fileIndex) => {
              const formData = new FormData();
              formData.append('file', file);
              
              const uploadResponse = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
              });
              
              if (!uploadResponse.ok) {
                throw new Error(`HTTP Error: ${uploadResponse.status} ${uploadResponse.statusText}`);
              }
              
              const result = await uploadResponse.json();
              if (!result.success) {
                throw new Error(result.error || 'Upload failed');
              }
              
              return result;
            })
          );
          
          // Convert Promise.allSettled results to upload results format
          const uploadResults = batchResults.map((result, index) => {
            if (result.status === 'fulfilled') {
              return {
                success: true,
                fileUrl: result.value.url || result.value.fileUrl,
                fileName: result.value.fileName,
                fileSize: result.value.fileSize
              };
            } else {
              return {
                success: false,
                error: result.reason?.message || 'Upload failed'
              };
            }
          });
          
          // Create mock response to match expected format
          const successCount = uploadResults.filter(r => r.success).length;
          const uploadResult = {
            success: true,
            results: uploadResults,
            successCount,
            failedCount: uploadResults.length - successCount
          };
          
          // Add results from this batch
          allResults.push(...uploadResult.results);
          
          console.log(`✅ [CLIENT] Batch ${batchIndex + 1} completed: ${uploadResult.successCount}/${batch.length} successful`);
          
        } catch (batchError) {
          console.error(`❌ [CLIENT] Batch ${batchIndex + 1} failed:`, batchError);
          
          // Add error results for this batch
          batch.forEach(() => {
            allResults.push({
              success: false,
              error: `Batch ${batchIndex + 1} failed: ${batchError instanceof Error ? batchError.message : 'Unknown error'}`
            });
          });
        }
      }
      
      // Update processing items with final results
      const updatedItems: ImageProcessingItem[] = files.map((file, index) => {
        const result = allResults[index];
        return {
          id: `${Date.now()}-${index}`,
          file,
          url: result?.success ? (result.url || result.fileUrl) : URL.createObjectURL(file),
          status: result?.success ? 'uploaded' : 'error',
          error: result?.success ? undefined : result.error,
          uploadResult: result
        };
      });
      
      setProcessingItems(updatedItems);
      
      const successCount = allResults.filter(r => r?.success).length;
      console.log(`🎉 [CLIENT] All batches completed: ${successCount}/${files.length} files successful`);
      
    } catch (error) {
      setError(`업로드 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
      console.error('Multiple upload error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Auto-process uploaded images
  const handleBatchAnalyze = async (items: ImageProcessingItem[]) => {
    if (items.length === 0) return;
    
    console.log(`🔄 [CLIENT] Processing ${items.length} uploaded images...`);
    
    // Update status to processing
    setProcessingItems(prevItems => 
      prevItems.map(item => 
        items.find(i => i.id === item.id) 
          ? { ...item, status: 'processing', progress: 0 }
          : item
      )
    );
    
    try {
      // Use process-multiple API
      const response = await fetch('/api/process-multiple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          images: items.map(item => ({
            id: item.id,
            url: item.url,
            type: 'wine_label' // Default to wine_label, let Gemini auto-classify
          })),
          useGemini: 'true',
          skipNotion: 'true' // Skip Notion for now, save manually later
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success && result.results) {
        console.log(`✅ [CLIENT] Processing completed: ${result.successCount}/${result.totalImages} successful`);
        
        // Update items with processing results
        setProcessingItems(prevItems => 
          prevItems.map(item => {
            const processResult = result.results.find((r: any) => r.id === item.id);
            if (processResult) {
              return {
                ...item,
                status: processResult.success ? 'completed' : 'error',
                result: processResult.success ? {
                  extractedData: processResult.extractedData,
                  type: processResult.type
                } : undefined,
                error: processResult.success ? undefined : processResult.error,
                progress: processResult.success ? 100 : 0
              };
            }
            return item;
          })
        );
      } else {
        throw new Error(result.error || 'Processing failed');
      }
      
    } catch (error) {
      console.error('❌ [CLIENT] Batch processing failed:', error);
      
      // Update items with error status
      setProcessingItems(prevItems => 
        prevItems.map(item => 
          items.find(i => i.id === item.id) 
            ? { ...item, status: 'error', error: error instanceof Error ? error.message : 'Processing failed' }
            : item
        )
      );
    }
  };

  // Retry analysis for a single item
  const handleRetryAnalysis = async (itemId: string) => {
    const item = processingItems.find(item => item.id === itemId);
    if (!item) return;
    
    console.log(`🔄 [CLIENT] Retrying analysis for image ${itemId}...`);
    
    // Update status to processing
    setProcessingItems(prevItems => 
      prevItems.map(i => 
        i.id === itemId 
          ? { ...i, status: 'processing', progress: 0, error: undefined, result: undefined }
          : i
      )
    );
    
    try {
      // Use process-multiple API for single item retry
      const response = await fetch('/api/process-multiple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          images: [{
            id: item.id,
            url: item.url,
            type: 'wine_label' // Default to wine_label, let Gemini auto-classify
          }],
          useGemini: 'true',
          skipNotion: 'true' // Skip Notion for now, save manually later
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success && result.results && result.results.length > 0) {
        const apiResult = result.results[0];
        
        console.log(`✅ [CLIENT] Retry analysis completed for image ${itemId}`);
        
        // Update item with new results
        setProcessingItems(prevItems => 
          prevItems.map(i => 
            i.id === itemId ? {
              ...i,
              status: apiResult.success ? 'completed' : 'error',
              result: apiResult.success ? {
                extractedData: apiResult.extractedData,
                type: apiResult.type
              } : undefined,
              error: apiResult.success ? undefined : apiResult.error,
              progress: apiResult.success ? 100 : 0
            } : i
          )
        );
        
      } else {
        throw new Error(result.error || 'Retry analysis failed');
      }
      
    } catch (error) {
      console.error('❌ [CLIENT] Retry analysis failed:', error);
      
      // Update item with error status
      setProcessingItems(prevItems => 
        prevItems.map(i => 
          i.id === itemId 
            ? { ...i, status: 'error', error: error instanceof Error ? error.message : 'Retry analysis failed' }
            : i
        )
      );
    }
  };

  const handleRemoveImage = (id: string) => {
    setProcessingItems(items => {
      const itemToRemove = items.find(item => item.id === id);
      if (itemToRemove) {
        // Clean up object URL
        URL.revokeObjectURL(itemToRemove.url);
      }
      return items.filter(item => item.id !== id);
    });
  };

  const handleRetryImage = async (id: string) => {
    const item = processingItems.find(item => item.id === id);
    if (!item) return;
    
    // Set item to processing
    setProcessingItems(items => 
      items.map(i => 
        i.id === id 
          ? { ...i, status: 'processing', error: undefined, progress: 0 }
          : i
      )
    );
    
    try {
      console.log(`🔄 [CLIENT] Retrying analysis for image ${id}`);
      
      // Use the process-multiple API for single retry
      const response = await fetch('/api/process-multiple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          images: [{
            id: item.id,
            url: item.url,
            type: 'wine_label'
          }],
          useGemini: 'true',
          skipNotion: 'true'
        }),
      });
      
      const result = await response.json();
      
      if (response.ok && result.success && result.results.length > 0) {
        const apiResult = result.results[0];
        
        setProcessingItems(items => 
          items.map(i => 
            i.id === id ? {
              ...i,
              status: apiResult.success ? 'completed' : 'error',
              result: apiResult.success ? { extractedData: apiResult.extractedData, type: apiResult.type } : undefined,
              error: apiResult.success ? undefined : apiResult.error,
              progress: apiResult.success ? 100 : 0
            } : i
          )
        );
        
        console.log(`✅ [CLIENT] Retry successful for image ${id}`);
        
      } else {
        throw new Error(result.error || 'Retry failed');
      }
      
    } catch (error) {
      console.error(`❌ [CLIENT] Retry failed for image ${id}:`, error);
      
      setProcessingItems(items => 
        items.map(i => 
          i.id === id 
            ? { ...i, status: 'error', error: error instanceof Error ? error.message : 'Retry failed', progress: 0 }
            : i
        )
      );
    }
  };

  const handleBatchAnalysis = async () => {
    if (processingItems.length === 0) return;
    
    setLoading(true);
    setError('');
    
    // Identify which items need processing BEFORE updating state
    const itemsToProcess = processingItems.filter(item => 
      item.status === 'uploaded' || item.status === 'error'
    );
    
    if (itemsToProcess.length === 0) {
      setLoading(false);
      setError('처리할 수 있는 이미지가 없습니다.');
      return;
    }
    
    // Set all eligible items to processing
    setProcessingItems(items => 
      items.map(item => 
        item.status === 'uploaded' || item.status === 'error'
          ? { ...item, status: 'processing', progress: 0 }
          : item
      )
    );
    
    try {
      // Prepare images for batch processing using the identified items
      const imagesToProcess = itemsToProcess.map(item => ({
        id: item.id,
        url: item.url,
        type: 'wine_label' as const
      }));
      
      console.log('🚀 [CLIENT] Starting batch analysis for', imagesToProcess.length, 'images');
      
      // Use individual process API calls instead of batch
      console.log('🚀 [CLIENT] Starting individual analysis for', imagesToProcess.length, 'images');
      
      // Process each item individually using Promise.allSettled
      const analysisResults = await Promise.allSettled(
        imagesToProcess.map(async (item, index) => {
          try {
            // Update individual item progress
            setProcessingItems(items => 
              items.map(i => 
                i.id === item.id 
                  ? { ...i, status: 'processing', progress: 25 }
                  : i
              )
            );
            
            const response = await fetch('/api/process', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                imageUrl: item.url,
                useGemini: 'true',
                skipNotion: 'true'
              }),
            });
            
            if (!response.ok) {
              throw new Error(`HTTP Error: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (!result.success) {
              throw new Error(result.error || 'Analysis failed');
            }
            
            return {
              id: item.id,
              success: true,
              extractedData: result.data.extractedData,
              type: result.data.type
            };
            
          } catch (error) {
            return {
              id: item.id,
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error'
            };
          }
        })
      );
      
      // Update all items with their analysis results
      setProcessingItems(items => 
        items.map(item => {
          const analysisResult = analysisResults.find((r, index) => {
            if (r.status === 'fulfilled') {
              return r.value.id === item.id;
            } else if (r.status === 'rejected') {
              return itemsToProcess[index]?.id === item.id;
            }
            return false;
          });
          
          if (analysisResult) {
            if (analysisResult.status === 'fulfilled') {
              const result = analysisResult.value;
              return {
                ...item,
                status: result.success ? 'completed' : 'error',
                result: result.success ? { extractedData: result.extractedData, type: result.type } : undefined,
                error: result.success ? undefined : result.error,
                progress: result.success ? 100 : 0
              };
            } else {
              return {
                ...item,
                status: 'error',
                error: 'Analysis failed unexpectedly',
                progress: 0
              };
            }
          }
          return item;
        })
      );
      
      const successCount = analysisResults.filter(r => 
        r.status === 'fulfilled' && r.value.success
      ).length;
      
      console.log(`✅ [CLIENT] Individual analysis completed: ${successCount}/${itemsToProcess.length} successful`);
      
    } catch (error) {
      console.error('❌ [CLIENT] Individual analysis failed:', error);
      setError(`분석 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
      
      // Reset processing items back to uploaded/error status
      setProcessingItems(items => 
        items.map(item => 
          item.status === 'processing'
            ? { ...item, status: 'error', error: 'Analysis processing failed', progress: 0 }
            : item
        )
      );
    } finally {
      setLoading(false);
    }
  };



  const handleSaveAll = async (completedItems: ImageProcessingItem[]) => {
    if (completedItems.length === 0) return;

    setSaving(true);
    setError('');

    try {
      console.log('💾 [CLIENT] Starting batch save all for', completedItems.length, 'items');

      // Prepare items for batch save
      const itemsForSave = completedItems.map(item => ({
        id: item.id,
        type: 'wine_label' as const,
        extractedData: item.result?.extractedData || {},
        imageUrl: item.url // Include imageUrl for blob cleanup
      }));

      const response = await fetch('/api/batch-notion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operation: 'save_all',
          items: itemsForSave
        }),
      });

      const result = await response.json();

      console.log('💾 [CLIENT] Batch save all response:', result);

      if (response.ok && result.success) {
        console.log(`✅ [CLIENT] Batch save completed: ${result.savedCount}/${result.totalItems} saved`);
        
        // Show success message
        alert(`성공! ${result.savedCount}개 항목이 Notion에 저장되었습니다.`);
        
        if (result.failedCount > 0) {
          alert(`⚠️ ${result.failedCount}개 항목 저장에 실패했습니다.`);
        }
      } else {
        throw new Error(result.error || 'Batch save failed');
      }

    } catch (error) {
      console.error('❌ [CLIENT] Batch save all failed:', error);
      setError(`일괄 저장 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSelected = async (selectedItems: ImageProcessingItem[]) => {
    if (selectedItems.length === 0) return;

    setSaving(true);
    setError('');

    try {
      console.log('💾 [CLIENT] Starting batch save selected for', selectedItems.length, 'items');

      // Prepare items for batch save
      const itemsForSave = processingItems
        .filter(item => item.status === 'completed')
        .map(item => ({
          id: item.id,
          type: 'wine_label' as const,
          extractedData: item.result?.extractedData || {},
          imageUrl: item.url // Include imageUrl for blob cleanup
        }));

      const selectedIds = selectedItems.map(item => item.id);

      const response = await fetch('/api/batch-notion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operation: 'save_selected',
          items: itemsForSave,
          selectedIds
        }),
      });

      const result = await response.json();

      console.log('💾 [CLIENT] Batch save selected response:', result);

      if (response.ok && result.success) {
        console.log(`✅ [CLIENT] Batch save selected completed: ${result.savedCount}/${result.totalItems} saved`);
        
        // Show success message
        alert(`성공! 선택한 ${result.savedCount}개 항목이 Notion에 저장되었습니다.`);
        
        if (result.failedCount > 0) {
          alert(`⚠️ ${result.failedCount}개 항목 저장에 실패했습니다.`);
        }
      } else {
        throw new Error(result.error || 'Batch save selected failed');
      }

    } catch (error) {
      console.error('❌ [CLIENT] Batch save selected failed:', error);
      setError(`선택 저장 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveIndividual = async (itemId: string, wineData: NotionWineProperties): Promise<boolean> => {
    try {
      console.log('💾 [CLIENT] Starting individual save for item:', itemId);
      console.log('   Wine data:', wineData);

      const response = await fetch('/api/notion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'save_wine',
          data: wineData,
          source: 'wine_label'
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        console.log('✅ [CLIENT] Individual save successful for item:', itemId);
        alert('✅ 와인이 성공적으로 Notion에 저장되었습니다!');
        return true;
      } else {
        console.error('❌ [CLIENT] Individual save failed:', result.error);
        alert(`❌ 저장 실패: ${result.error || '알 수 없는 오류'}`);
        return false;
      }
    } catch (error) {
      console.error('❌ [CLIENT] Individual save error:', error);
      alert(`❌ 저장 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
      return false;
    }
  };

  const handleAddManual = async (wineData: NotionWineProperties): Promise<boolean> => {
    try {
      console.log('➕ [CLIENT] Starting manual wine save');
      console.log('   Wine data:', wineData);

      const response = await fetch('/api/notion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'save_wine',
          data: wineData,
          source: 'manual_entry'
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        console.log('✅ [CLIENT] Manual wine save successful');
        alert('✅ 수동 추가 와인이 성공적으로 Notion에 저장되었습니다!');
        return true;
      } else {
        console.error('❌ [CLIENT] Manual wine save failed:', result.error);
        alert(`❌ 저장 실패: ${result.error || '알 수 없는 오류'}`);
        return false;
      }
    } catch (error) {
      console.error('❌ [CLIENT] Manual wine save error:', error);
      alert(`❌ 저장 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
      return false;
    }
  };

  const handleDelete = (itemId: string) => {
    console.log('🗑️ [CLIENT] Deleting wine result:', itemId);
    
    // Remove from processing items
    setProcessingItems((prev: ImageProcessingItem[]) => {
      const itemToRemove = prev.find(item => item.id === itemId);
      if (itemToRemove && itemToRemove.url.startsWith('blob:')) {
        // Clean up blob URL
        URL.revokeObjectURL(itemToRemove.url);
      }
      return prev.filter(item => item.id !== itemId);
    });
    
    alert('🗑️ 와인 결과가 삭제되었습니다.');
  };

  return (
    <>
      <Head>
        <title>Wine Tracker</title>
        <meta name="description" content="모바일에서 와인 라벨을 촬영하여 와인 정보를 자동으로 기록하세요" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="theme-color" content="#3B82F6" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-6 max-w-md">
          {/* Mobile-first header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">🍷 Wine tracker</h1>
            <p className="text-gray-600">라벨을 촬영해서 와인 정보를 기록하세요</p>
          </div>

          {/* Mobile-first single column layout */}
          <MobileLayout>
            <ProcessingStep title="📷 이미지 업로드" className="border-l-4 border-l-blue-500">
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

                <ProcessingStep title="📊 분석 진행상황" className="border-l-4 border-l-yellow-500">
                  <ProcessingProgress items={processingItems} />
                </ProcessingStep>

                {processingItems.some(item => item.status === 'uploaded' || item.status === 'error') && (
                  <ProcessingStep title="🚀 일괄 분석" className="border-l-4 border-l-orange-500">
                    <div className="text-center">
                      <p className="text-gray-600 mb-6">
                        선택된 {processingItems.filter(item => item.status === 'uploaded' || item.status === 'error').length}개 
                        이미지를 AI가 분석하여 와인 정보를 추출합니다.
                      </p>
                      <button
                        onClick={handleBatchAnalysis}
                        disabled={loading}
                        className="w-full py-4 px-6 bg-gradient-to-r from-green-500 to-green-600 text-white text-lg font-bold rounded-xl shadow-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transform active:scale-95"
                      >
                        {loading ? '🔄 분석 중...' : '🚀 모든 이미지 분석하기'}
                      </button>
                    </div>
                  </ProcessingStep>
                )}

                {/* Batch Results Display - show when analysis is complete */}
                {processingItems.some(item => item.status === 'completed') && (
                  <ProcessingStep title="📊 분석 결과" className="border-l-4 border-l-purple-500">
                    <WineBatchResultDisplay
                      items={processingItems}
                      onSaveAll={handleSaveAll}
                      onSaveSelected={handleSaveSelected}
                      onSaveIndividual={handleSaveIndividual}
                      onAddManual={handleAddManual}
                      onRetryAnalysis={handleRetryAnalysis}
                      onDelete={handleDelete}
                      loading={saving}
                    />
                  </ProcessingStep>
                )}
              </>
            )}

            {error && (
              <ProcessingStep title="" className="border-l-4 border-l-red-500">
                <ErrorMessage message={error} />
              </ProcessingStep>
            )}
          </MobileLayout>

         
        </div>
      </main>
    </>
  );
}