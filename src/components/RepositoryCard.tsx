
import React from 'react';
import { Link } from 'react-router-dom';
import { Star, GitFork, Eye } from 'lucide-react';
import { Repository } from '../types/github';
import { formatNumber, formatDate } from '../services/github';

interface RepositoryCardProps {
  repository: Repository;
}

const RepositoryCard: React.FC<RepositoryCardProps> = ({ repository }) => {
  return (
    <div className="border border-gray-200 rounded-md p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start space-x-3">
        <img 
          src={repository.owner.avatar_url} 
          alt={`${repository.owner.login}'s avatar`}
          className="w-10 h-10 rounded-full"
        />
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold truncate">
            <Link to={`/repository/${repository.id}`} className="text-blue-600 hover:underline">
              {repository.full_name}
            </Link>
          </h3>
          <p className="text-gray-600 text-sm mb-2">
            Updated {formatDate(repository.updated_at)}
          </p>
          {repository.description && (
            <p className="text-gray-700 mb-3 line-clamp-2">{repository.description}</p>
          )}
          <div className="flex flex-wrap gap-2 mb-3">
            {repository.topics && repository.topics.slice(0, 3).map(topic => (
              <span key={topic} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                {topic}
              </span>
            ))}
            {repository.topics && repository.topics.length > 3 && (
              <span className="text-gray-500 text-xs">+{repository.topics.length - 3} more</span>
            )}
          </div>
          <div className="flex items-center text-sm text-gray-600 space-x-4">
            {repository.language && (
              <div className="flex items-center">
                <span className="w-3 h-3 rounded-full bg-blue-500 mr-1"></span>
                <span>{repository.language}</span>
              </div>
            )}
            <div className="flex items-center">
              <Star size={16} className="mr-1" />
              <span>{formatNumber(repository.stargazers_count)}</span>
            </div>
            <div className="flex items-center">
              <GitFork size={16} className="mr-1" />
              <span>{formatNumber(repository.forks_count)}</span>
            </div>
            <div className="flex items-center">
              <Eye size={16} className="mr-1" />
              <span>{formatNumber(repository.watchers_count)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RepositoryCard;
