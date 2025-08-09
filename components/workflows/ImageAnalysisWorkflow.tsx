import React from 'react';
import UnifiedWorkflow, { UnifiedWorkflowProps } from '../UnifiedWorkflow';

/**
 * Full workflow component for image analysis
 * Supports: upload → process → edit → save
 */
const ImageAnalysisWorkflow: React.FC<Omit<UnifiedWorkflowProps, 'enableUpload' | 'enableProcessing' | 'useSampleData'>> = (props) => {
  return (
    <UnifiedWorkflow
      {...props}
      enableUpload={true}
      enableUrlInput={true}
      enableProcessing={true}
      useSampleData={false}
      initialStep="upload"
    />
  );
};

export default ImageAnalysisWorkflow;