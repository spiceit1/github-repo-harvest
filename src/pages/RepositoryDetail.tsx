
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, GitFork, Eye, ArrowLeft, Calendar, Clock, ExternalLink, Shield, FileCode } from 'lucide-react';
import { Repository } from '../types/github';
import { formatNumber, formatDate } from '../services/github';

const RepositoryDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [repository, setRepository] = useState<Repository | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRepository = async () => {
      setLoading(true);
      try {
        // In a real app, we'd fetch the specific repo by ID
        // Since GitHub API doesn't have a direct endpoint for this, we're simulating it
        const searchResponse = await fetch(`/api/github/search?q=repo:${id}`);
        
        if (!searchResponse.ok) {
          throw new Error('Failed to fetch repository details');
        }
        
        const data = await searchResponse.json();
        if (data.items && data.items.length > 0) {
          setRepository(data.items[0]);
        } else {
          setError('Repository not found');
        }
      } catch (err) {
        console.error('Error fetching repository details:', err);
        setError('Failed to load repository details');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchRepository();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
        <p className="text-center mt-4 text-gray-600">Loading repository details...</p>
      </div>
    );
  }

  if (error || !repository) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>{error || 'Repository not found'}</p>
        </div>
        <div className="mt-6">
          <Link to="/" className="text-blue-600 hover:underline flex items-center">
            <ArrowLeft size={16} className="mr-1" /> Back to search
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <Link to="/" className="text-blue-600 hover:underline flex items-center">
          <ArrowLeft size={16} className="mr-1" /> Back to search
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center mb-6">
          <img 
            src={repository.owner.avatar_url} 
            alt={`${repository.owner.login}'s avatar`}
            className="w-16 h-16 rounded-full mr-4"
          />
          <div>
            <h1 className="text-2xl font-bold">{repository.name}</h1>
            <p className="text-gray-600">
              by <a href={repository.owner.html_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                {repository.owner.login}
              </a>
            </p>
          </div>
        </div>

        {repository.description && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">Description</h2>
            <p className="text-gray-700">{repository.description}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h2 className="text-lg font-semibold mb-2">Repository Stats</h2>
            <div className="bg-gray-50 p-4 rounded-md">
              <div className="flex items-center mb-3">
                <Star size={18} className="text-yellow-500 mr-2" />
                <span className="font-medium">{repository.stargazers_count.toLocaleString()} stars</span>
              </div>
              <div className="flex items-center mb-3">
                <GitFork size={18} className="text-blue-500 mr-2" />
                <span className="font-medium">{repository.forks_count.toLocaleString()} forks</span>
              </div>
              <div className="flex items-center mb-3">
                <Eye size={18} className="text-purple-500 mr-2" />
                <span className="font-medium">{repository.watchers_count.toLocaleString()} watchers</span>
              </div>
              <div className="flex items-center">
                <Shield size={18} className="text-red-500 mr-2" />
                <span className="font-medium">{repository.open_issues_count.toLocaleString()} open issues</span>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-2">Information</h2>
            <div className="bg-gray-50 p-4 rounded-md">
              {repository.language && (
                <div className="flex items-center mb-3">
                  <FileCode size={18} className="text-green-500 mr-2" />
                  <span className="font-medium">Primary language: {repository.language}</span>
                </div>
              )}
              <div className="flex items-center mb-3">
                <Calendar size={18} className="text-indigo-500 mr-2" />
                <span className="font-medium">Created: {formatDate(repository.created_at)}</span>
              </div>
              <div className="flex items-center">
                <Clock size={18} className="text-orange-500 mr-2" />
                <span className="font-medium">Last updated: {formatDate(repository.updated_at)}</span>
              </div>
            </div>
          </div>
        </div>

        {repository.topics && repository.topics.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">Topics</h2>
            <div className="flex flex-wrap gap-2">
              {repository.topics.map(topic => (
                <span key={topic} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                  {topic}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6">
          <a 
            href={repository.html_url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center justify-center bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            <ExternalLink size={16} className="mr-2" />
            View on GitHub
          </a>
        </div>
      </div>
    </div>
  );
};

export default RepositoryDetail;
