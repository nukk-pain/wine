import React, { useState, useCallback } from 'react';
import WineDataEditForm from './WineDataEditForm';
import { NotionWineProperties } from '../lib/notion-schema';

export type WorkflowStep = 'upload' | 'processing' | 'editing' | 'saving' | 'completed' | 'error' | 'idle';

export interface WorkflowState {
  step: WorkflowStep;
  data?: NotionWineProperties;
  error?: string;
  imageUrl?: string;
  processingProgress?: string;
}

export interface UnifiedWorkflowProps {
  /** Initial step to start the workflow */
  initialStep?: WorkflowStep;
  /** Initial data for editing mode */
  initialData?: NotionWineProperties;
  /** Show upload functionality */
  enableUpload?: boolean;
  /** Show URL input functionality */
  enableUrlInput?: boolean;
  /** Show processing functionality */
  enableProcessing?: boolean;
  /** Skip directly to editing with sample data */
  useSampleData?: boolean;
  /** Callback when workflow completes */
  onComplete?: (data: NotionWineProperties) => void;
  /** Callback when an error occurs */
  onError?: (error: string) => void;
  /** Callback when step changes */
  onStepChange?: (step: WorkflowStep) => void;
}

const SAMPLE_DATA: NotionWineProperties = {
  'Name': 'Test Wine 2025',
  'Vintage': 2020,
  'Region/Producer': 'Napa Valley / Test Winery',
  'Price': 35.99,
  'Quantity': 1,
  'Store': 'Wine Test Shop',
  'Varietal(품종)': ['Cabernet Sauvignon', 'Merlot'],
  'Image': null
};

export default function UnifiedWorkflow({
  initialStep = 'upload',
  initialData,
  enableUpload = true,
  enableUrlInput = true,
  enableProcessing = true,
  useSampleData = false,
  onComplete,
  onError,
  onStepChange
}: UnifiedWorkflowProps) {
  const [state, setState] = useState<WorkflowState>({
    step: useSampleData ? 'idle' : initialStep,
    data: initialData,
    error: ''
  });
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateState = useCallback((updates: Partial<WorkflowState>) => {
    setState(prev => ({ ...prev, ...updates }));
    if (updates.step && onStepChange) {
      onStepChange(updates.step);
    }
    if (updates.error && onError) {
      onError(updates.error);
    }
  }, [onStepChange, onError]);

  const handleFileUpload = useCallback((file: File) => {
    setUploadedFile(file);
    setUploadedUrl('');
    updateState({ step: 'upload', error: '' });
  }, [updateState]);

  const handleUrlInput = useCallback((url: string) => {
    setUploadedUrl(url);
    setUploadedFile(null);
    updateState({ step: 'upload', error: '' });
  }, [updateState]);

  const handleStartEdit = useCallback(() => {
    const dataToUse = useSampleData ? SAMPLE_DATA : state.data;
    updateState({ 
      step: 'editing', 
      data: dataToUse,
      error: '' 
    });
  }, [useSampleData, state.data, updateState]);

  const handleAnalyzeImage = async () => {
    if (!enableProcessing) {
      return handleStartEdit();
    }

    if (!uploadedFile && !uploadedUrl) {
      updateState({ error: 'Please upload an image or provide a URL first' });
      return;
    }

    updateState({ 
      step: 'processing', 
      error: '',
      processingProgress: 'Uploading image...' 
    });

    try {
      let requestBody: any = {};
      
      if (uploadedFile) {
        // For files, we need to upload first
        updateState({ processingProgress: 'Uploading image to server...' });
        const formData = new FormData();
        formData.append('file', uploadedFile);
        
        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        
        if (!uploadResponse.ok) {
          const uploadError = await uploadResponse.json();
          throw new Error(uploadError.error || 'Failed to upload image');
        }
        
        const uploadResult = await uploadResponse.json();
        requestBody.filePath = uploadResult.filePath;
        requestBody.fileUrl = uploadResult.fileUrl;
      } else if (uploadedUrl) {
        // For URLs, pass directly
        requestBody.imageUrl = uploadedUrl;
      }

      // Process image
      updateState({ processingProgress: 'Analyzing image...' });
      const processResponse = await fetch('/api/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!processResponse.ok) {
        const processError = await processResponse.json();
        throw new Error(processError.error || 'Failed to process image');
      }

      const processResult = await processResponse.json();
      
      if (processResult.wines && processResult.wines.length > 0) {
        // Convert to NotionWineProperties format
        const wine = processResult.wines[0];
        const wineData: NotionWineProperties = {
          'Name': wine.name,
          'Vintage': wine.vintage || null,
          'Region/Producer': wine.region || wine.producer || '',
          'Price': wine.price || null,
          'Quantity': wine.quantity || 1,
          'Store': '',
          'Varietal(품종)': wine.varietal ? [wine.varietal] : [],
          'Image': requestBody.fileUrl || uploadedUrl || null
        };
        
        updateState({ 
          step: 'editing',
          data: wineData,
          processingProgress: ''
        });
      } else {
        updateState({ 
          error: 'No wine data found in the image',
          step: 'error' 
        });
      }
    } catch (error) {
      console.error('Image analysis error:', error);
      updateState({ 
        error: error instanceof Error ? error.message : 'Failed to analyze image',
        step: 'error'
      });
    }
  };

  const handleSaveToNotion = async (editedData: NotionWineProperties) => {
    setIsSubmitting(true);
    updateState({ step: 'saving', data: editedData });

    try {
      const response = await fetch('/api/notion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'save_wine_v2',
          data: editedData
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to save to Notion' }));
        throw new Error(errorData.error || 'Failed to save to Notion');
      }

      const result = await response.json();
      updateState({ step: 'completed', data: editedData });
      
      if (onComplete) {
        onComplete(editedData);
      }
    } catch (error) {
      console.error('Save to Notion error:', error);
      updateState({ 
        error: error instanceof Error ? error.message : 'Failed to save to Notion',
        step: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = useCallback(() => {
    setUploadedFile(null);
    setUploadedUrl('');
    setIsSubmitting(false);
    updateState({
      step: useSampleData ? 'idle' : 'upload',
      data: initialData,
      error: '',
      processingProgress: ''
    });
  }, [useSampleData, initialData, updateState]);

  // Render based on current step
  const renderStep = () => {
    switch (state.step) {
      case 'idle':
        return (
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold">Wine Data Entry Test</h2>
            <button
              onClick={handleStartEdit}
              className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Start Editing Sample Data
            </button>
          </div>
        );

      case 'upload':
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Upload Wine Image</h2>
            
            {enableUpload && (
              <div>
                <label className="block text-sm font-medium mb-2">Upload Image File</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {uploadedFile && (
                  <p className="text-sm text-green-600 mt-2">
                    File selected: {uploadedFile.name}
                  </p>
                )}
              </div>
            )}

            {enableUrlInput && (
              <div>
                <label className="block text-sm font-medium mb-2">Or provide URL</label>
                <input
                  type="url"
                  value={uploadedUrl}
                  onChange={(e) => handleUrlInput(e.target.value)}
                  placeholder="https://example.com/wine-image.jpg"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            <button
              onClick={handleAnalyzeImage}
              disabled={!uploadedFile && !uploadedUrl}
              className="px-6 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {enableProcessing ? 'Analyze Image' : 'Start Editing'}
            </button>
          </div>
        );

      case 'processing':
        return (
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold">Processing Image</h2>
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
            {state.processingProgress && (
              <p className="text-gray-600">{state.processingProgress}</p>
            )}
          </div>
        );

      case 'editing':
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Edit Wine Data</h2>
              <button
                onClick={handleReset}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Start Over
              </button>
            </div>
            {state.data && (
              <WineDataEditForm
                initialData={state.data}
                onSave={handleSaveToNotion}
                onCancel={handleReset}
                isSubmitting={isSubmitting}
              />
            )}
          </div>
        );

      case 'saving':
        return (
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold">Saving to Notion</h2>
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
            </div>
            <p className="text-gray-600">Please wait while we save your wine data...</p>
          </div>
        );

      case 'completed':
        return (
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold text-green-600">Success!</h2>
            <p className="text-gray-600">Wine data has been saved to Notion successfully.</p>
            <button
              onClick={handleReset}
              className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Process Another Wine
            </button>
          </div>
        );

      case 'error':
        return (
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold text-red-600">Error</h2>
            <p className="text-red-600">{state.error}</p>
            <button
              onClick={handleReset}
              className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Try Again
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {renderStep()}
    </div>
  );
}