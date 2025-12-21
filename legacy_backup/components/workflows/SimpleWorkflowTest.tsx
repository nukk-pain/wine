import React from 'react';
import UnifiedWorkflow, { UnifiedWorkflowProps } from '../UnifiedWorkflow';

/**
 * Simple test workflow component
 * Starts with sample data for testing the editing interface
 */
const SimpleWorkflowTest: React.FC<Omit<UnifiedWorkflowProps, 'useSampleData' | 'enableUpload' | 'enableProcessing'>> = (props) => {
  return (
    <UnifiedWorkflow
      {...props}
      enableUpload={false}
      enableUrlInput={false}
      enableProcessing={false}
      useSampleData={true}
      initialStep="idle"
    />
  );
};

export default SimpleWorkflowTest;