import React from 'react';

interface ProgressBarProps {
  progress: number;
  total: number;
  message: string;
  showPercentage?: boolean;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ progress, total, message, showPercentage = true }) => {
  const percentage = Math.round((progress / total) * 100);

  return (
    <div className="w-full max-w-xl mx-auto p-6">
      <div className="mb-4">
        <div className="text-lg font-semibold text-gray-800 mb-2">{message}</div>
        {showPercentage && (
          <div className="text-sm text-gray-600">
            {progress} of {total} items ({percentage}%)
          </div>
        )}
      </div>
      <div className="bg-gray-200 rounded-full h-4 overflow-hidden">
        <div 
          className="bg-orange-500 h-full transition-all duration-300 ease-in-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;