import React from 'react';
import UnifiedWorkflow, { UnifiedWorkflowProps, WorkflowStep } from '../UnifiedWorkflow';
import { NotionWineProperties } from '../../types';
import { validateWineData } from '../../lib/utils/notion-helpers';

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

/**
 * Wine processing workflow focused on editing and saving
 */
export default function WineProcessingWorkflow({
  initialStep,
  onComplete,
  onError
}: WineProcessingWorkflowProps) {
  // Map old step format to new format
  const mapStep = (step?: ProcessingStep): WorkflowStep => {
    if (!step) return 'editing';

    switch (step.step) {
      case 'uploading': return 'upload';
      case 'processing': return 'processing';
      case 'editing': return 'editing';
      case 'saving': return 'saving';
      case 'completed': return 'completed';
      case 'error': return 'error';
      default: return 'editing';
    }
  };

  return (
    <UnifiedWorkflow
      initialStep={mapStep(initialStep)}
      initialData={initialStep?.data}
      enableUpload={false}
      enableUrlInput={false}
      enableProcessing={false}
      useSampleData={false}
      onComplete={onComplete}
      onError={onError}
    />
  );
}