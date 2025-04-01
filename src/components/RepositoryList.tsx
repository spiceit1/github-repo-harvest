
import React from 'react';
import RepositoryCard from './RepositoryCard';
import { Repository } from '../types/github';

interface RepositoryListProps {
  repositories: Repository[];
  loading: boolean;
}

const RepositoryList: React.FC<RepositoryListProps> = ({ repositories, loading }) => {
  if (loading) {
    return (
      <div className="w-full mt-8">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
        <p className="text-center mt-4 text-gray-600">Loading repositories...</p>
      </div>
    );
  }

  if (repositories.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-lg text-gray-600">No repositories found.</p>
        <p className="text-gray-500">Try adjusting your search criteria.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 mt-6">
      {repositories.map((repo) => (
        <RepositoryCard key={repo.id} repository={repo} />
      ))}
    </div>
  );
};

export default RepositoryList;
