import React from 'react';
import { Image } from 'lucide-react';

interface ImageLoadingProgressProps {
  loaded: number;
  total: number;
}

const ImageLoadingProgress: React.FC<ImageLoadingProgressProps> = ({ loaded, total }) => {
  const percentage = Math.min(100, Math.round((loaded / total) * 100));
  
  return (
    <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 max-w-sm animate-fade-in">
      <div className="flex items-center gap-3 mb-2">
        <Image className="h-5 w-5 text-blue-600" />
        <span className="text-sm font-medium">Loading Images...</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-1.5">
        <div
          className="bg-blue-600 h-1.5 rounded-full transition-all duration-300 ease-in-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="mt-1 text-xs text-gray-500 text-right">
        {loaded} of {total}
      </div>
    </div>
  );
};

export default ImageLoadingProgress; 