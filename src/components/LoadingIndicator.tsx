import React from 'react';
import { Database, Image, Package, Trash2 } from 'lucide-react';

interface LoadingIndicatorProps {
  stage: 'database' | 'images' | 'processing' | 'deleting';
  progress?: {
    current: number;
    total: number;
  };
  message?: string;
}

const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ stage, progress, message }) => {
  const getIcon = () => {
    switch (stage) {
      case 'database':
        return <Database className="h-8 w-8 text-orange-500 animate-pulse" />;
      case 'images':
        return <Image className="h-8 w-8 text-orange-500 animate-pulse" />;
      case 'processing':
        return <Package className="h-8 w-8 text-orange-500 animate-pulse" />;
      case 'deleting':
        return <Trash2 className="h-8 w-8 text-red-500 animate-pulse" />;
    }
  };

  const getDefaultMessage = () => {
    switch (stage) {
      case 'database':
        return 'Loading fish data...';
      case 'images':
        return 'Processing images...';
      case 'processing':
        return 'Processing data...';
      case 'deleting':
        return 'Clearing existing data...';
    }
  };

  // Only show progress if we have valid numbers and total > 0
  const showProgress = progress && progress.total > 0 && progress.current >= 0;
  const percentage = showProgress ? Math.min(100, Math.round((progress.current / progress.total) * 100)) : 0;

  return (
    <div className="flex flex-col items-center justify-center h-48 bg-white rounded-lg shadow-md p-6">
      <div className="mb-4">
        {getIcon()}
      </div>
      
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        {message || getDefaultMessage()}
      </h3>

      {showProgress && (
        <div className="w-full max-w-md">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>{progress.current} of {progress.total} items</span>
            <span>{percentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
            <div 
              className="bg-orange-500 h-full rounded-full transition-all duration-300 ease-out"
              style={{ 
                width: `${percentage}%`,
                transitionProperty: 'width, background-color'
              }}
            />
          </div>
          {percentage === 100 && (
            <div className="text-center text-sm text-green-600 mt-2">
              Processing complete!
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LoadingIndicator;