// Debug info component for development
import { useState } from 'react';

interface DebugInfoProps {
  data: any;
  title?: string;
}

export function DebugInfo({ data, title = "디버그 정보" }: DebugInfoProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Only show in development or when debug parameter is present
  if (process.env.NODE_ENV !== 'development' && !window.location.search.includes('debug=true')) {
    return null;
  }

  if (!data) {
    return null;
  }

  return (
    <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center w-full text-left text-sm font-medium text-yellow-800 hover:text-yellow-900"
      >
        <span className="mr-2">{isOpen ? '🔽' : '🔍'}</span>
        {title} (개발용)
      </button>

      {isOpen && (
        <div className="mt-3">
          <pre className="bg-black text-green-400 rounded p-4 text-xs overflow-x-auto max-h-96 overflow-y-auto font-mono border border-green-600">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

// Helper function to add debug info to any response data
export function withDebugInfo(responseData: any) {
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 Response Debug Info:', responseData);
  }
  return responseData;
}