import React from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { FishData } from '../types';

interface CategoryCardProps {
  category: string;
  items: FishData[];
  onToggleCategory?: (category: string, disable: boolean) => void;
}

const CategoryCard: React.FC<CategoryCardProps> = ({ category, items, onToggleCategory }) => {
  const activeItems = items.filter(item => !item.disabled);
  const isActive = activeItems.length > 0;

  return (
    <div className={`bg-white rounded-lg shadow-sm border p-4 ${isActive ? 'border-blue-200' : 'border-gray-200'}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-800">{category}</h3>
        {onToggleCategory && (
          <button
            onClick={() => onToggleCategory(category, isActive)}
            className={`p-1 rounded hover:bg-gray-100 ${
              isActive ? 'text-red-600' : 'text-green-600'
            }`}
            title={isActive ? 'Disable category' : 'Enable category'}
          >
            {isActive ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <div className="font-semibold text-gray-900">{items.length}</div>
          <div className="text-gray-600">Total Items</div>
        </div>
        <div>
          <div className={`font-semibold ${isActive ? 'text-green-600' : 'text-red-600'}`}>
            {activeItems.length}
          </div>
          <div className="text-gray-600">Active Items</div>
        </div>
      </div>
    </div>
  );
};

export default CategoryCard;