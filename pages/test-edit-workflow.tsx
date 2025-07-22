import React, { useState } from 'react';
import WineProcessingWorkflow from '../components/WineProcessingWorkflow';
import { NotionWineProperties } from '../lib/notion-schema';

const TestEditWorkflow: React.FC = () => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string>('');
  const [workflowRef, setWorkflowRef] = useState<any>(null);

  const handleFileUpload = (file: File) => {
    setUploadedFile(file);
    setUploadedUrl('');
  };

  const handleProcessImage = async () => {
    if (!uploadedFile && !uploadedUrl) {
      alert('Please upload an image or provide a URL first');
      return;
    }

    // Update workflow to processing state
    if (workflowRef && workflowRef.updateStep) {
      workflowRef.updateStep({ step: 'processing' });
    }

    try {
      let requestBody: any = {};
      
      if (uploadedFile) {
        // For files, we need to upload first
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
        let wineData: NotionWineProperties;
        
        if (result.imageType === 'wine_label') {
          wineData = result.parsedData.notionData;
        } else if (result.imageType === 'receipt' && result.parsedData.wines.length > 0) {
          // For receipts, use the first wine item
          wineData = result.parsedData.wines[0].notionData;
        } else {
          throw new Error('No wine data found in the processed result');
        }

        // Update workflow to editing state with parsed data
        if (workflowRef && workflowRef.updateStep) {
          workflowRef.updateStep({ 
            step: 'editing', 
            data: wineData,
            imageUrl: requestBody.fileUrl 
          });
        }
      } else {
        throw new Error('Processing failed: No data returned');
      }

    } catch (error) {
      console.error('Processing error:', error);
      
      if (workflowRef && workflowRef.updateStep) {
        workflowRef.updateStep({ 
          step: 'error', 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          Wine Edit Workflow Test
        </h1>

        {/* File Upload Section */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Upload Image</h2>
          
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
              onChange={(e) => {
                setUploadedUrl(e.target.value);
                setUploadedFile(null);
              }}
              placeholder="https://example.com/wine-image.jpg"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Process Button */}
          <button
            onClick={handleProcessImage}
            disabled={!uploadedFile && !uploadedUrl}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Process Image
          </button>

          {/* Upload Status */}
          {uploadedFile && (
            <div className="mt-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
              File uploaded: {uploadedFile.name}
            </div>
          )}
          
          {uploadedUrl && (
            <div className="mt-4 p-3 bg-blue-100 border border-blue-400 text-blue-700 rounded">
              URL ready: {uploadedUrl}
            </div>
          )}
        </div>

        {/* Workflow Component */}
        <WineProcessingWorkflow
          onComplete={(data) => {
            console.log('Workflow completed successfully:', data);
            alert('Wine data saved successfully to Notion!');
          }}
          onError={(error) => {
            console.error('Workflow error:', error);
            alert(`Error: ${error}`);
          }}
        />

        {/* Test Data Section */}
        <div className="bg-white rounded-lg shadow-lg p-6 mt-8">
          <h2 className="text-xl font-semibold mb-4">Test with Sample Data</h2>
          <p className="text-gray-600 mb-4">
            Click the button below to test the edit workflow with sample wine data.
          </p>
          <button
            onClick={() => {
              const sampleData: NotionWineProperties = {
                'Name': 'Sample Wine 2025',
                'Vintage': 2020,
                'Region/Producer': 'Napa Valley / Sample Winery',
                'Price': 45.99,
                'Quantity': 1,
                'Store': 'Test Wine Shop',
                'Varietal(품종)': ['Cabernet Sauvignon', 'Merlot'],
                'Image': null
              };

              if (workflowRef && workflowRef.updateStep) {
                workflowRef.updateStep({ 
                  step: 'editing', 
                  data: sampleData 
                });
              }
            }}
            className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            Test with Sample Data
          </button>
        </div>
      </div>
    </div>
  );
};

export default TestEditWorkflow;