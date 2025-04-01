
import React from 'react';
import RepositoryCard from './RepositoryCard';
import { Repository } from '../types/github';
import { Loader } from 'lucide-react';

interface RepositoryListProps {
  repositories: Repository[];
  loading: boolean;
}

const RepositoryList: React.FC<RepositoryListProps> = ({ repositories, loading }) => {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <Loader className="animate-spin h-8 w-8 text-blue-500" />
        <span className="ml-2 text-gray-600">Loading repositories...</span>
      </div>
    );
  }

  if (repositories.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">No repositories found. Try a different search term.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {repositories.map((repo) => (
        <RepositoryCard key={repo.id} repository={repo} />
      ))}
    </div>
  );
};

export default RepositoryList;
