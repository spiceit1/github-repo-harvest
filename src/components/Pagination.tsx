
import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  const renderPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    if (startPage > 1) {
      pages.push(
        <button
          key={1}
          onClick={() => onPageChange(1)}
          className="px-3 py-1 mx-1 rounded-md hover:bg-gray-200"
        >
          1
        </button>
      );
      if (startPage > 2) {
        pages.push(<span key="start-ellipsis" className="px-2">...</span>);
      }
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => onPageChange(i)}
          className={`px-3 py-1 mx-1 rounded-md ${
            i === currentPage
              ? 'bg-blue-600 text-white'
              : 'hover:bg-gray-200'
          }`}
        >
          {i}
        </button>
      );
    }
    
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push(<span key="end-ellipsis" className="px-2">...</span>);
      }
      pages.push(
        <button
          key={totalPages}
          onClick={() => onPageChange(totalPages)}
          className="px-3 py-1 mx-1 rounded-md hover:bg-gray-200"
        >
          {totalPages}
        </button>
      );
    }
    
    return pages;
  };

  return (
    <div className="flex justify-center items-center mt-6">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className={`flex items-center px-3 py-1 rounded-md mr-2 ${
          currentPage <= 1
            ? 'text-gray-400 cursor-not-allowed'
            : 'hover:bg-gray-200'
        }`}
      >
        <ChevronLeft size={16} className="mr-1" />
        Previous
      </button>
      <div className="flex items-center">{renderPageNumbers()}</div>
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className={`flex items-center px-3 py-1 rounded-md ml-2 ${
          currentPage >= totalPages
            ? 'text-gray-400 cursor-not-allowed'
            : 'hover:bg-gray-200'
        }`}
      >
        Next
        <ChevronRight size={16} className="ml-1" />
      </button>
    </div>
  );
};

export default Pagination;
