
import React, { useState, useEffect } from 'react';
import SearchBar from '../components/SearchBar';
import RepositoryList from '../components/RepositoryList';
import SortFilter from '../components/SortFilter';
import { Repository, SortOption } from '../types/github';
import { searchRepositories } from '../services/github';

const Index: React.FC = () => {
  const [query, setQuery] = useState<string>('');
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [sort, setSort] = useState<string>('stars');
  const [order, setOrder] = useState<string>('desc');

  const sortOptions: SortOption[] = [
    { label: 'Stars', value: 'stars' },
    { label: 'Forks', value: 'forks' },
    { label: 'Updated', value: 'updated' },
  ];

  const orderOptions: SortOption[] = [
    { label: 'Descending', value: 'desc' },
    { label: 'Ascending', value: 'asc' },
  ];

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    
    try {
      setQuery(searchQuery);
      setLoading(true);
      setError(null);
      
      const response = await searchRepositories(searchQuery, sort, order);
      setRepositories(response.items);
    } catch (err) {
      console.error('Search error:', err);
      setError('Failed to fetch repositories. Please try again later.');
      setRepositories([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSortChange = (newSort: string) => {
    setSort(newSort);
    if (query) {
      handleSearch(query);
    }
  };

  const handleOrderChange = (newOrder: string) => {
    setOrder(newOrder);
    if (query) {
      handleSearch(query);
    }
  };

  useEffect(() => {
    // Initial search or demo data
    if (!repositories.length && !loading) {
      handleSearch('react');
    }
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-center mb-6">GitHub Repository Explorer</h1>
        <SearchBar onSearch={handleSearch} initialQuery="" />
      </div>

      {error ? (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-xl font-semibold text-gray-800">
              {query ? `Results for "${query}"` : 'Popular Repositories'}
            </h2>
          </div>
          <SortFilter
            sortOptions={sortOptions}
            orderOptions={orderOptions}
            selectedSort={sort}
            selectedOrder={order}
            onSortChange={handleSortChange}
            onOrderChange={handleOrderChange}
          />
        </div>
      )}

      <RepositoryList repositories={repositories} loading={loading} />
    </div>
  );
};

export default Index;
