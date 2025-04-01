
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Star, GitFork } from 'lucide-react';
import { Repository } from '../types/github';
import { searchRepositories, formatDate } from '../services/github';

const RepositoryDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [repository, setRepository] = useState<Repository | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRepositoryDetail = async () => {
      try {
        setLoading(true);
        if (id) {
          const searchResponse = await searchRepositories(`repo:${id}`);
          if (searchResponse.items.length > 0) {
            setRepository(searchResponse.items[0]);
          } else {
            setError(`Repository "${id}" not found`);
          }
        }
      } catch (err) {
        setError('Failed to fetch repository details');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchRepositoryDetail();
  }, [id]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
        <p className="text-center mt-4 text-gray-600">Loading repository details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
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
        <div className="mt-6">
          <Link to="/" className="flex items-center text-blue-600 hover:text-blue-800">
            <ArrowLeft className="mr-2" size={18} />
            Back to search
          </Link>
        </div>
      </div>
    );
  }

  if (!repository) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-center text-gray-700">Repository not found</p>
        <div className="mt-6 text-center">
          <Link to="/" className="flex items-center justify-center text-blue-600 hover:text-blue-800">
            <ArrowLeft className="mr-2" size={18} />
            Back to search
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link to="/" className="flex items-center text-blue-600 hover:text-blue-800">
          <ArrowLeft className="mr-2" size={18} />
          Back to search
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          <div className="flex items-center mb-4">
            <img 
              src={repository.owner.avatar_url} 
              alt={`${repository.owner.login} avatar`}
              className="w-12 h-12 rounded-full mr-4"
            />
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{repository.name}</h1>
              <a 
                href={repository.owner.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                {repository.owner.login}
              </a>
            </div>
          </div>

          {repository.description && (
            <p className="text-gray-700 mb-6">{repository.description}</p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="flex items-center">
              <Star className="text-yellow-500 mr-2" size={20} />
              <span className="font-semibold">{repository.stargazers_count.toLocaleString()}</span>
              <span className="ml-1 text-gray-600">stars</span>
            </div>
            <div className="flex items-center">
              <GitFork className="text-gray-600 mr-2" size={20} />
              <span className="font-semibold">{repository.forks_count.toLocaleString()}</span>
              <span className="ml-1 text-gray-600">forks</span>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">
                  Created: <span className="text-gray-800">{formatDate(repository.created_at)}</span>
                </p>
                <p className="text-sm text-gray-600">
                  Updated: <span className="text-gray-800">{formatDate(repository.updated_at)}</span>
                </p>
              </div>
              <div>
                {repository.language && (
                  <p className="text-sm text-gray-600">
                    Language: <span className="text-gray-800">{repository.language}</span>
                  </p>
                )}
                {repository.license && (
                  <p className="text-sm text-gray-600">
                    License: <span className="text-gray-800">{repository.license.name}</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6">
            <a 
              href={repository.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              View on GitHub
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RepositoryDetail;
