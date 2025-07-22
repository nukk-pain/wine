import React, { useState } from 'react';
import { NotionWineProperties } from '../lib/notion-schema';
import WineDataEditForm from './WineDataEditForm';

interface ProcessingStep {
  step: 'uploading' | 'processing' | 'editing' | 'saving' | 'completed' | 'error';
  data?: NotionWineProperties;
  error?: string;
  imageUrl?: string;
}

interface WineProcessingWorkflowProps {
  initialStep?: ProcessingStep;
  onComplete?: (data: NotionWineProperties) => void;
  onError?: (error: string) => void;
}

export default function WineProcessingWorkflow({
  initialStep,
  onComplete,
  onError
}: WineProcessingWorkflowProps) {
  const [currentStep, setCurrentStep] = useState<ProcessingStep>(
    initialStep || { step: 'uploading' }
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSaveToNotion = async (editedData: NotionWineProperties) => {
    setIsSubmitting(true);
    setCurrentStep({ step: 'saving', data: editedData });

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
      setCurrentStep({ step: 'completed', data: editedData });
      
      if (onComplete) {
        onComplete(editedData);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setCurrentStep({ step: 'error', error: errorMessage, data: editedData });
      
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setCurrentStep({ step: 'uploading' });
  };

  const handleRetry = () => {
    if (currentStep.data) {
      setCurrentStep({ step: 'editing', data: currentStep.data });
    }
  };

  const renderStepContent = () => {
    switch (currentStep.step) {
      case 'uploading':
        return (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Upload an image to get started...</p>
          </div>
        );

      case 'processing':
        return (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Analyzing image with AI...</p>
            <p className="text-sm text-gray-500 mt-2">This may take a few moments</p>
          </div>
        );

      case 'editing':
        if (!currentStep.data) {
          return (
            <div className="text-center py-8">
              <p className="text-red-600">No data available for editing</p>
            </div>
          );
        }
        return (
          <WineDataEditForm
            initialData={currentStep.data}
            onSave={handleSaveToNotion}
            onCancel={handleCancel}
            isSubmitting={isSubmitting}
          />
        );

      case 'saving':
        return (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Saving to Notion...</p>
          </div>
        );

      case 'completed':
        return (
          <div className="text-center py-8">
            <div className="rounded-full h-12 w-12 bg-green-100 flex items-center justify-center mx-auto mb-4">
              <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-green-600 font-semibold">Successfully saved to Notion!</p>
            <button
              onClick={() => setCurrentStep({ step: 'uploading' })}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Process Another Image
            </button>
          </div>
        );

      case 'error':
        return (
          <div className="text-center py-8">
            <div className="rounded-full h-12 w-12 bg-red-100 flex items-center justify-center mx-auto mb-4">
              <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <p className="text-red-600 font-semibold mb-2">Error occurred</p>
            <p className="text-gray-600 text-sm mb-4">{currentStep.error}</p>
            <div className="flex gap-4 justify-center">
              {currentStep.data && (
                <button
                  onClick={handleRetry}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  Try Again
                </button>
              )}
              <button
                onClick={() => setCurrentStep({ step: 'uploading' })}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
              >
                Start Over
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const renderProgressBar = () => {
    const steps = ['upload', 'process', 'edit', 'save', 'complete'];
    const currentStepIndex = (() => {
      switch (currentStep.step) {
        case 'uploading': return 0;
        case 'processing': return 1;
        case 'editing': return 2;
        case 'saving': return 3;
        case 'completed': return 4;
        case 'error': return Math.max(0, steps.length - 2); // Show error at previous step
        default: return 0;
      }
    })();

    return (
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          {steps.map((step, index) => (
            <div key={step} className="flex items-center">
              <div
                className={`rounded-full h-8 w-8 flex items-center justify-center text-sm font-semibold ${
                  index <= currentStepIndex
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {index + 1}
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`h-1 w-16 ml-2 ${
                    index < currentStepIndex ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between text-xs text-gray-500">
          <span>Upload</span>
          <span>Process</span>
          <span>Edit</span>
          <span>Save</span>
          <span>Complete</span>
        </div>
      </div>
    );
  };

  // Function to update step from parent components
  const updateStep = (newStep: ProcessingStep) => {
    setCurrentStep(newStep);
  };

  // Expose the updateStep function via ref or callback
  React.useImperativeHandle(
    React.useRef({ updateStep }),
    () => ({ updateStep })
  );

  return (
    <div className="max-w-4xl mx-auto p-6">
      {renderProgressBar()}
      {renderStepContent()}
    </div>
  );
}

// Export the updateStep type for parent components
export type WorkflowUpdateFunction = (step: ProcessingStep) => void;