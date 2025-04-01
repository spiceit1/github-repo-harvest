
import React, { useState, useEffect } from 'react';
import SearchBar from '../components/SearchBar';
import RepositoryList from '../components/RepositoryList';
import SortFilter from '../components/SortFilter';
import Pagination from '../components/Pagination';
import { searchRepositories } from '../services/github';
import { Repository, SortOption } from '../types/github';
import { AlertCircle } from 'lucide-react';

const sortOptions: SortOption[] = [
  { label: 'Stars', value: 'stars' },
  { label: 'Forks', value: 'forks' },
  { label: 'Updated', value: 'updated' },
];

const orderOptions: SortOption[] = [
  { label: 'Descending', value: 'desc' },
  { label: 'Ascending', value: 'asc' },
];

const Index: React.FC = () => {
  const [query, setQuery] = useState('');
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sort, setSort] = useState('stars');
  const [order, setOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasSearched, setHasSearched] = useState(false);

  const fetchRepositories = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await searchRepositories(searchQuery, sort, order, page);
      setRepositories(response.items);
      setTotalCount(response.total_count);
      setTotalPages(Math.min(Math.ceil(response.total_count / 30), 34)); // GitHub API limits to 1000 results (34 pages of 30)
      setHasSearched(true);
    } catch (err) {
      setError('An error occurred while fetching repositories. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (query) {
      fetchRepositories(query);
    }
  }, [sort, order, page]);

  const handleSearch = (searchQuery: string) => {
    setQuery(searchQuery);
    setPage(1); // Reset page when search changes
    fetchRepositories(searchQuery);
  };

  const handleSortChange = (newSort: string) => {
    setSort(newSort);
    setPage(1); // Reset page when sort changes
  };

  const handleOrderChange = (newOrder: string) => {
    setOrder(newOrder);
    setPage(1); // Reset page when order changes
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo(0, 0);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <h1 className="text-3xl font-bold text-center mb-2">GitHub Repository Explorer</h1>
      <p className="text-gray-600 text-center mb-8">
        Search for GitHub repositories and explore their details
      </p>
      
      <SearchBar onSearch={handleSearch} initialQuery={query} />
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mt-4 flex items-center">
          <AlertCircle className="mr-2" size={20} />
          <span>{error}</span>
        </div>
      )}
      
      {hasSearched && !loading && !error && (
        <div className="mt-6">
          <div className="flex justify-between items-center flex-wrap">
            <p className="text-gray-600 mb-4">
              {totalCount.toLocaleString()} repositories found
            </p>
            <SortFilter
              sortOptions={sortOptions}
              orderOptions={orderOptions}
              selectedSort={sort}
              selectedOrder={order}
              onSortChange={handleSortChange}
              onOrderChange={handleOrderChange}
            />
          </div>
          
          <RepositoryList repositories={repositories} loading={loading} />
          
          {totalPages > 1 && (
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          )}
        </div>
      )}
      
      {!hasSearched && !loading && (
        <div className="text-center py-16">
          <p className="text-gray-600 text-lg">
            Enter a search term to find GitHub repositories
          </p>
        </div>
      )}
    </div>
  );
};

export default Index;
