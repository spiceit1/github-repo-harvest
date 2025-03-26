import React from 'react';

interface LoadingIndicatorProps {
  loaded?: number;
  total?: number;
  message?: string;
  showProgress?: boolean;
}

const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ 
  loaded, 
  total, 
  message = 'Loading...', 
  showProgress = true 
}) => {
  // Calculate progress if available
  const percentage = showProgress && typeof loaded === 'number' && typeof total === 'number'
    ? Math.min(100, Math.round((loaded / total) * 100))
    : null;

  return (
    <div className="flex flex-col items-center justify-center w-full py-4">
      <div className="w-12 h-12 mb-2">
        <svg className="animate-spin w-full h-full text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
      <div className="text-center mb-3">
        <div className="text-base font-medium text-gray-700 mb-1">{message}</div>
        {percentage !== null && (
          <div className="text-sm text-gray-500 font-medium">
            {loaded} of {total} ({percentage}%)
          </div>
        )}
      </div>
      <div className="w-32 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div 
          className={`h-full bg-blue-600 transition-all duration-300 ease-in-out rounded-full ${percentage === null ? 'animate-pulse' : ''}`}
          style={{ 
            width: percentage !== null ? `${percentage}%` : '100%'
          }}
        />
      </div>
    </div>
  );
};

export default LoadingIndicator;