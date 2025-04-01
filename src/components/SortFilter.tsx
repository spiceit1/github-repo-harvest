
import React from 'react';
import { SortOption } from '../types/github';

interface SortFilterProps {
  sortOptions: SortOption[];
  orderOptions: SortOption[];
  selectedSort: string;
  selectedOrder: string;
  onSortChange: (sort: string) => void;
  onOrderChange: (order: string) => void;
}

const SortFilter: React.FC<SortFilterProps> = ({
  sortOptions,
  orderOptions,
  selectedSort,
  selectedOrder,
  onSortChange,
  onOrderChange
}) => {
  return (
    <div className="flex flex-col md:flex-row gap-4 my-4">
      <div className="flex items-center">
        <label htmlFor="sort" className="mr-2 text-sm font-medium text-gray-700">
          Sort by:
        </label>
        <select
          id="sort"
          value={selectedSort}
          onChange={(e) => onSortChange(e.target.value)}
          className="block w-full md:w-auto px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      
      <div className="flex items-center">
        <label htmlFor="order" className="mr-2 text-sm font-medium text-gray-700">
          Order:
        </label>
        <select
          id="order"
          value={selectedOrder}
          onChange={(e) => onOrderChange(e.target.value)}
          className="block w-full md:w-auto px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          {orderOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default SortFilter;
