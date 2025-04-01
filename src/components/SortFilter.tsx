
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
  onOrderChange,
}) => {
  return (
    <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4 mb-4">
      <div className="flex items-center">
        <label htmlFor="sort-select" className="mr-2 text-gray-700">Sort by:</label>
        <select
          id="sort-select"
          value={selectedSort}
          onChange={(e) => onSortChange(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center">
        <label htmlFor="order-select" className="mr-2 text-gray-700">Order:</label>
        <select
          id="order-select"
          value={selectedOrder}
          onChange={(e) => onOrderChange(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
