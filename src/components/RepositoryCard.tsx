
import React from 'react';
import { Link } from 'react-router-dom';
import { Star, GitFork, Calendar } from 'lucide-react';
import { Repository } from '../types/github';
import { formatDate, formatNumber } from '../services/github';

interface RepositoryCardProps {
  repository: Repository;
}

const RepositoryCard: React.FC<RepositoryCardProps> = ({ repository }) => {
  return (
    <Link to={`/repository/${repository.owner.login}/${repository.name}`} className="block">
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow p-4 h-full">
        <div className="flex items-center mb-3">
          <img 
            src={repository.owner.avatar_url} 
            alt={`${repository.owner.login} avatar`}
            className="w-8 h-8 rounded-full mr-2"
          />
          <div className="overflow-hidden">
            <h3 className="text-lg font-semibold text-gray-800 truncate">{repository.name}</h3>
            <p className="text-sm text-gray-600 truncate">{repository.owner.login}</p>
          </div>
        </div>
        
        {repository.description && (
          <p className="text-gray-700 text-sm mb-3 line-clamp-2">{repository.description}</p>
        )}
        
        <div className="flex justify-between text-sm text-gray-600 mb-3">
          <div className="flex items-center">
            <Star className="text-yellow-500 mr-1" size={16} />
            <span>{formatNumber(repository.stargazers_count)}</span>
          </div>
          <div className="flex items-center">
            <GitFork className="text-gray-500 mr-1" size={16} />
            <span>{formatNumber(repository.forks_count)}</span>
          </div>
          <div className="flex items-center">
            <Calendar className="text-gray-500 mr-1" size={16} />
            <span>{formatDate(repository.updated_at)}</span>
          </div>
        </div>
        
        {repository.language && (
          <div className="flex items-center">
            <span className="w-3 h-3 rounded-full bg-blue-500 mr-1"></span>
            <span className="text-xs text-gray-600">{repository.language}</span>
          </div>
        )}
      </div>
    </Link>
  );
};

export default RepositoryCard;
