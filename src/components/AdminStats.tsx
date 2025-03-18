import React from 'react';
import { Stats } from '../types';
import { Activity, Box, CheckCircle, XCircle, Eye, EyeOff } from 'lucide-react';

interface AdminStatsProps {
  stats: Stats;
  onToggleCategory?: (categoryName: string, disabled: boolean) => void;
}

const AdminStats: React.FC<AdminStatsProps> = ({ stats, onToggleCategory }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Items Statistics */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <Box className="h-5 w-5 mr-2 text-blue-600" />
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
          <Activity className="h-5 w-5 mr-2 text-blue-600" />
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
      <div className="md:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Category Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stats.categories.list.map((category) => (
            <div key={category.name} className="border rounded-lg p-4">
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
                      onClick={() => onToggleCategory(category.name, category.status === 'active')}
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
    </div>
  );
};

export default AdminStats;