import React, { useState, useEffect } from 'react';
import { Activity, Box, CheckCircle, XCircle, Eye, EyeOff, ChevronDown, ChevronUp } from 'lucide-react';
import { FishData, Stats } from '../types';

interface StatsProps {
  fishData: FishData[];
  onToggleCategory?: (category: string, disable: boolean) => void;
  onCategoryClick?: (category: string) => void;
}

const StatsDisplay: React.FC<StatsProps> = ({ fishData, onToggleCategory, onCategoryClick }) => {
  const [isExpanded, setIsExpanded] = useState(() => {
    // Initialize from localStorage, default to true if not set
    const saved = localStorage.getItem('statsOverviewExpanded');
    return saved === null ? true : saved === 'true';
  });

  // Save to localStorage whenever isExpanded changes
  useEffect(() => {
    localStorage.setItem('statsOverviewExpanded', isExpanded.toString());
  }, [isExpanded]);

  const calculateStats = (): Stats => {
    const stats: Stats = {
      items: {
        total: 0,
        active: 0,
        disabled: 0
      },
      categories: {
        total: 0,
        active: 0,
        disabled: 0,
        list: []
      }
    };

    // Get unique categories from current fish data only
    const categories = new Set<string>();
    fishData.forEach(fish => {
      if (!fish.isCategory && fish.category) {
        categories.add(fish.category);
      }
    });

    // Calculate stats for each category that exists in current data
    Array.from(categories).sort().forEach(category => {
      const categoryItems = fishData.filter(fish => 
        !fish.isCategory && fish.category === category
      );
      const activeItems = categoryItems.filter(item => !item.disabled);
      const disabledItems = categoryItems.filter(item => item.disabled);

      if (categoryItems.length > 0) {
        stats.categories.list.push({
          name: category,
          total: categoryItems.length,
          active: activeItems.length,
          disabled: disabledItems.length,
          status: activeItems.length > 0 ? 'active' : 'disabled'
        });
      }
    });

    // Calculate totals
    stats.items.total = fishData.filter(fish => !fish.isCategory).length;
    stats.items.active = fishData.filter(fish => !fish.isCategory && !fish.disabled).length;
    stats.items.disabled = fishData.filter(fish => !fish.isCategory && fish.disabled).length;

    stats.categories.total = stats.categories.list.length;
    stats.categories.active = stats.categories.list.filter(cat => cat.status === 'active').length;
    stats.categories.disabled = stats.categories.list.filter(cat => cat.status === 'disabled').length;

    return stats;
  };

  const getCategoryCardStyle = (category: { active: number; disabled: number }) => {
    const total = category.active + category.disabled;
    
    // All items are active
    if (category.active === total && category.disabled === 0) {
      return 'bg-green-50 border-green-200 hover:bg-green-100';
    }
    
    // All items are disabled
    if (category.active === 0 && category.disabled === total) {
      return 'bg-red-50 border-red-200 hover:bg-red-100';
    }
    
    // Mixed state - some active, some disabled
    return 'bg-blue-50 border-blue-200 hover:bg-blue-100';
  };

  const stats = calculateStats();

  return (
    <div className="space-y-6">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between bg-orange-50 p-4 rounded-lg hover:bg-orange-100 transition-colors"
      >
        <span className="font-semibold text-gray-800">Statistics Overview</span>
        {isExpanded ? (
          <ChevronUp className="h-5 w-5 text-orange-600" />
        ) : (
          <ChevronDown className="h-5 w-5 text-orange-600" />
        )}
      </button>

      {isExpanded && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Items Statistics */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <Box className="h-5 w-5 mr-2 text-orange-600" />
              Items Statistics
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{stats.items.total}</div>
                <div className="text-sm text-gray-600">Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.items.active}</div>
                <div className="text-sm text-gray-600">Active</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{stats.items.disabled}</div>
                <div className="text-sm text-gray-600">Disabled</div>
              </div>
            </div>
          </div>

          {/* Categories Statistics */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <Activity className="h-5 w-5 mr-2 text-orange-600" />
              Categories Statistics
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{stats.categories.total}</div>
                <div className="text-sm text-gray-600">Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.categories.active}</div>
                <div className="text-sm text-gray-600">Active</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{stats.categories.disabled}</div>
                <div className="text-sm text-gray-600">Disabled</div>
              </div>
            </div>
          </div>

          {/* Category Details */}
          {stats.categories.list.length > 0 && (
            <div className="md:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Category Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {stats.categories.list.map((category) => (
                  <div 
                    key={category.name} 
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      getCategoryCardStyle(category)
                    }`}
                    onClick={() => onCategoryClick?.(category.name)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{category.name}</h4>
                      <div className="flex items-center gap-2">
                        {category.status === 'active' ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500" />
                        )}
                        {onToggleCategory && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm(`Are you sure you want to ${category.status === 'active' ? 'disable' : 'enable'} all items in this category?`)) {
                                onToggleCategory(category.name, category.status === 'active');
                              }
                            }}
                            className={`p-1 rounded ${
                              category.status === 'active'
                                ? 'text-red-600 hover:bg-red-50'
                                : 'text-green-600 hover:bg-green-50'
                            }`}
                            title={category.status === 'active' ? 'Disable category' : 'Enable category'}
                          >
                            {category.status === 'active' ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <div className="font-semibold">{category.total}</div>
                        <div className="text-gray-600">Total</div>
                      </div>
                      <div>
                        <div className="font-semibold text-green-600">{category.active}</div>
                        <div className="text-gray-600">Active</div>
                      </div>
                      <div>
                        <div className="font-semibold text-red-600">{category.disabled}</div>
                        <div className="text-gray-600">Disabled</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StatsDisplay;