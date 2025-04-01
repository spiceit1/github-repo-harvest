
import axios from 'axios';
import { Repository, SearchResponse } from '../types/github';

const GITHUB_API_URL = 'https://api.github.com';

// Format numbers for display (e.g., 1000 -> 1k)
export const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'm';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k';
  }
  return num.toString();
};

// Format date to readable format
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date);
};

// Search repositories
export const searchRepositories = async (
  query: string,
  sort: string = 'stars',
  order: string = 'desc'
): Promise<SearchResponse> => {
  try {
    const response = await axios.get(`${GITHUB_API_URL}/search/repositories`, {
      params: {
        q: query,
        sort,
        order,
        per_page: 30
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error searching repositories:', error);
    throw new Error('Failed to search repositories');
  }
};

// Fetch repository details
export const fetchRepositoryDetails = async (owner: string, name: string): Promise<Repository> => {
  try {
    const response = await axios.get(`${GITHUB_API_URL}/repos/${owner}/${name}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching repository details:', error);
    throw new Error('Failed to fetch repository details');
  }
};
