
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { GitFork, Star, Eye, Calendar, ArrowLeft, Loader, ExternalLink } from 'lucide-react';
import { fetchRepositoryDetails } from '../services/github';
import { formatDate, formatNumber } from '../services/github';
import toast from 'react-hot-toast';

const RepositoryDetail: React.FC = () => {
  const { owner, name } = useParams<{ owner: string; name: string }>();
  const [repository, setRepository] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadRepositoryDetails = async () => {
      if (!owner || !name) return;
      
      try {
        setLoading(true);
        setError(null);
        const repoDetails = await fetchRepositoryDetails(owner, name);
        setRepository(repoDetails);
      } catch (err) {
        console.error('Error fetching repository details:', err);
        setError('Failed to fetch repository details. Please try again later.');
        toast.error('Failed to load repository details');
      } finally {
        setLoading(false);
      }
    };

    loadRepositoryDetails();
  }, [owner, name]);

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <Loader className="animate-spin h-8 w-8 text-blue-500" />
        <span className="ml-2">Loading repository details...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded mb-6 max-w-2xl">
          <p className="text-red-700">{error}</p>
        </div>
        <Link 
          to="/" 
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <ArrowLeft className="mr-2" size={16} />
          Back to Search
        </Link>
      </div>
    );
  }

  if (!repository) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <h2 className="text-2xl font-bold mb-4">Repository not found</h2>
        <Link 
          to="/" 
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <ArrowLeft className="mr-2" size={16} />
          Back to Search
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Link 
        to="/" 
        className="inline-flex items-center mb-6 text-blue-600 hover:text-blue-800"
      >
        <ArrowLeft className="mr-2" size={16} />
        Back to Search
      </Link>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div className="flex items-center mb-4 md:mb-0">
            <img 
              src={repository.owner.avatar_url} 
              alt={`${repository.owner.login} avatar`}
              className="w-12 h-12 rounded-full mr-4"
            />
            <div>
              <h1 className="text-2xl font-bold">{repository.name}</h1>
              <p className="text-gray-600">by {repository.owner.login}</p>
            </div>
          </div>
          
          <a 
            href={repository.html_url} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="flex items-center px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-900 transition-colors"
          >
            View on GitHub
            <ExternalLink className="ml-2" size={16} />
          </a>
        </div>

        {repository.description && (
          <p className="text-gray-700 mb-6 text-lg">{repository.description}</p>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center text-gray-600 mb-1">
              <Star className="mr-2" size={16} />
              <span>Stars</span>
            </div>
            <p className="text-2xl font-semibold">{formatNumber(repository.stargazers_count)}</p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center text-gray-600 mb-1">
              <GitFork className="mr-2" size={16} />
              <span>Forks</span>
            </div>
            <p className="text-2xl font-semibold">{formatNumber(repository.forks_count)}</p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center text-gray-600 mb-1">
              <Eye className="mr-2" size={16} />
              <span>Watchers</span>
            </div>
            <p className="text-2xl font-semibold">{formatNumber(repository.watchers_count)}</p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center text-gray-600 mb-1">
              <Calendar className="mr-2" size={16} />
              <span>Updated</span>
            </div>
            <p className="text-lg font-semibold">{formatDate(repository.updated_at)}</p>
          </div>
        </div>

        {repository.language && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Primary Language</h3>
            <div className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full">
              <span className="w-3 h-3 rounded-full bg-blue-500 mr-2"></span>
              {repository.language}
            </div>
          </div>
        )}

        {repository.topics && repository.topics.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Topics</h3>
            <div className="flex flex-wrap gap-2">
              {repository.topics.map((topic: string) => (
                <span 
                  key={topic} 
                  className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm"
                >
                  {topic}
                </span>
              ))}
            </div>
          </div>
        )}

        {repository.license && (
          <div>
            <h3 className="text-lg font-semibold mb-2">License</h3>
            <p className="text-gray-700">{repository.license.name}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RepositoryDetail;
