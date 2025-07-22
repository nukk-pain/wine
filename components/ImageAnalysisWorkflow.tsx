import React, { useState } from 'react';
import WineDataEditForm from './WineDataEditForm';
import { NotionWineProperties } from '../lib/notion-schema';

const ImageAnalysisWorkflow: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<'upload' | 'processing' | 'editing' | 'saving' | 'completed' | 'error'>('upload');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string>('');
  const [wineData, setWineData] = useState<NotionWineProperties | null>(null);
  const [error, setError] = useState<string>('');
  const [processingProgress, setProcessingProgress] = useState<string>('');

  const handleFileUpload = (file: File) => {
    setUploadedFile(file);
    setUploadedUrl('');
    setCurrentStep('upload');
    setError('');
  };

  const handleUrlInput = (url: string) => {
    setUploadedUrl(url);
    setUploadedFile(null);
    setCurrentStep('upload');
    setError('');
  };

  const handleAnalyzeImage = async () => {
    if (!uploadedFile && !uploadedUrl) {
      setError('Please upload an image or provide a URL first');
      return;
    }

    setCurrentStep('processing');
    setError('');
    setProcessingProgress('Uploading image...');

    try {
      let requestBody: any = {};
      
      if (uploadedFile) {
        // For files, we need to upload first
        setProcessingProgress('Uploading image to server...');
        const formData = new FormData();
        formData.append('file', uploadedFile);
        
        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        
        if (!uploadResponse.ok) {
          throw new Error('Failed to upload image');
        }
        
        const uploadResult = await uploadResponse.json();
        requestBody.filePath = uploadResult.filePath;
        requestBody.fileUrl = uploadResult.url;
      } else {
        requestBody.fileUrl = uploadedUrl;
      }

      setProcessingProgress('Analyzing image with AI...');

      // Process with edit workflow
      const response = await fetch('/api/process-with-edit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Processing failed');
      }

      const result = await response.json();
      
      if (result.success && result.parsedData) {
        let extractedWineData: NotionWineProperties;
        
        if (result.imageType === 'wine_label') {
          extractedWineData = result.parsedData.notionData;
        } else if (result.imageType === 'receipt' && result.parsedData.wines.length > 0) {
          // For receipts, use the first wine item
          extractedWineData = result.parsedData.wines[0].notionData;
        } else {
          throw new Error('No wine data found in the processed result');
        }

        console.log('Successfully processed image, extracted data:', extractedWineData);
        
        // Move to editing step with extracted data
        setWineData(extractedWineData);
        setCurrentStep('editing');
        setProcessingProgress('');
      } else {
        throw new Error('Processing failed: No data returned');
      }

    } catch (error) {
      console.error('Processing error:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
      setCurrentStep('error');
      setProcessingProgress('');
    }
  };

  const handleSave = async (editedData: NotionWineProperties) => {
    setCurrentStep('saving');
    
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
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save to Notion');
      }

      const result = await response.json();
      console.log('Successfully saved to Notion:', result);
      
      setCurrentStep('completed');
      setWineData(editedData);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMessage);
      setCurrentStep('error');
      console.error('Save error:', error);
    }
  };

  const handleCancel = () => {
    setCurrentStep('upload');
    setWineData(null);
    setError('');
    setProcessingProgress('');
  };

  const handleReset = () => {
    setCurrentStep('upload');
    setUploadedFile(null);
    setUploadedUrl('');
    setWineData(null);
    setError('');
    setProcessingProgress('');
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          Wine Image Analysis
        </h1>

        {/* Upload Section - Always visible when not editing/saving/completed */}
        {['upload', 'processing', 'error'].includes(currentStep) && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Upload Wine Image</h2>
            
            {/* File Upload */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Wine Label or Receipt
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleFileUpload(file);
                  }
                }}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                disabled={currentStep === 'processing'}
              />
            </div>

            {/* URL Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Or Enter Image URL
              </label>
              <input
                type="url"
                value={uploadedUrl}
                onChange={(e) => handleUrlInput(e.target.value)}
                placeholder="https://example.com/wine-image.jpg"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={currentStep === 'processing'}
              />
            </div>

            {/* Upload Status */}
            {uploadedFile && (
              <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
                File uploaded: {uploadedFile.name}
              </div>
            )}
            
            {uploadedUrl && (
              <div className="mb-4 p-3 bg-blue-100 border border-blue-400 text-blue-700 rounded">
                URL ready: {uploadedUrl}
              </div>
            )}

            {/* Analyze Button */}
            <button
              onClick={handleAnalyzeImage}
              disabled={(!uploadedFile && !uploadedUrl) || currentStep === 'processing'}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              {currentStep === 'processing' ? 'Analyzing...' : 'Analyze Image'}
            </button>
          </div>
        )}

        {/* Processing Progress */}
        {currentStep === 'processing' && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h2 className="text-xl font-semibold text-gray-700 mb-2">Processing Image</h2>
              <p className="text-gray-600">{processingProgress || 'Analyzing with AI...'}</p>
            </div>
          </div>
        )}

        {/* Error Display */}
        {currentStep === 'error' && error && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <div className="text-center">
              <div className="rounded-full h-12 w-12 bg-red-100 flex items-center justify-center mx-auto mb-4">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-red-600 mb-2">Processing Error</h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={() => setCurrentStep('upload')}
                className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Edit Form */}
        {currentStep === 'editing' && wineData && (
          <div className="mb-8">
            <WineDataEditForm
              initialData={wineData}
              onSave={handleSave}
              onCancel={handleCancel}
              isSubmitting={false}
            />
          </div>
        )}

        {/* Saving Progress */}
        {currentStep === 'saving' && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
              <h2 className="text-xl font-semibold text-gray-700">Saving to Notion...</h2>
              <p className="text-gray-600 mt-2">Please wait while we save your wine data.</p>
            </div>
          </div>
        )}

        {/* Success Display */}
        {currentStep === 'completed' && wineData && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="text-center mb-6">
              <div className="rounded-full h-16 w-16 bg-green-100 flex items-center justify-center mx-auto mb-4">
                <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-green-600 mb-2">Success!</h2>
              <p className="text-gray-600">Wine data has been successfully saved to Notion.</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-gray-800 mb-2">Saved Data:</h3>
              <div className="space-y-1 text-sm text-gray-600">
                <p><span className="font-medium">Name:</span> {wineData.Name}</p>
                <p><span className="font-medium">Vintage:</span> {wineData.Vintage || 'N/A'}</p>
                <p><span className="font-medium">Region/Producer:</span> {wineData['Region/Producer'] || 'N/A'}</p>
                <p><span className="font-medium">Price:</span> ${wineData.Price || 'N/A'}</p>
                <p><span className="font-medium">Quantity:</span> {wineData.Quantity || 'N/A'}</p>
                <p><span className="font-medium">Store:</span> {wineData.Store || 'N/A'}</p>
                <p><span className="font-medium">Varietal:</span> {wineData['Varietal(품종)']?.join(', ') || 'N/A'}</p>
              </div>
            </div>

            <div className="text-center">
              <button
                onClick={handleReset}
                className="bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Analyze Another Image
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageAnalysisWorkflow;