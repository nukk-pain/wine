import React, { useState } from 'react';
import WineDataEditForm from './WineDataEditForm';
import { NotionWineProperties } from '../lib/notion-schema';

const SimpleWorkflowTest: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<'idle' | 'editing' | 'saving' | 'completed' | 'error'>('idle');
  const [wineData, setWineData] = useState<NotionWineProperties | null>(null);
  const [error, setError] = useState<string>('');

  const sampleData: NotionWineProperties = {
    'Name': 'Test Wine 2025',
    'Vintage': 2020,
    'Region/Producer': 'Napa Valley / Test Winery',
    'Price': 35.99,
    'Quantity': 1,
    'Store': 'Wine Test Shop',
    'Varietal(품종)': ['Cabernet Sauvignon', 'Merlot'],
    'Image': null
  };

  const handleStartEdit = () => {
    setWineData(sampleData);
    setCurrentStep('editing');
    setError('');
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
    setCurrentStep('idle');
    setWineData(null);
    setError('');
  };

  const handleReset = () => {
    setCurrentStep('idle');
    setWineData(null);
    setError('');
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          Simple Wine Edit Workflow Test
        </h1>

        {currentStep === 'idle' && (
          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <h2 className="text-xl font-semibold mb-4">Ready to Test</h2>
            <p className="text-gray-600 mb-6">
              Click the button below to test the edit workflow with sample wine data.
            </p>
            <button
              onClick={handleStartEdit}
              className="bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
            >
              Start Edit Test
            </button>
          </div>
        )}

        {currentStep === 'editing' && wineData && (
          <WineDataEditForm
            initialData={wineData}
            onSave={handleSave}
            onCancel={handleCancel}
            isSubmitting={false}
          />
        )}

        {currentStep === 'saving' && (
          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-700">Saving to Notion...</h2>
            <p className="text-gray-600 mt-2">Please wait while we save your wine data.</p>
          </div>
        )}

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
                Test Again
              </button>
            </div>
          </div>
        )}

        {currentStep === 'error' && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="text-center mb-6">
              <div className="rounded-full h-16 w-16 bg-red-100 flex items-center justify-center mx-auto mb-4">
                <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-red-600 mb-2">Error Occurred</h2>
              <p className="text-gray-600 mb-4">{error}</p>
            </div>

            <div className="text-center space-x-4">
              <button
                onClick={handleStartEdit}
                className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Try Again
              </button>
              <button
                onClick={handleReset}
                className="bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Start Over
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SimpleWorkflowTest;