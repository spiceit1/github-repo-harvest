
import { SearchResponse } from '../types/github';

export async function searchRepositories(
  query: string,
  sort: string = 'stars',
  order: string = 'desc',
  page: number = 1
): Promise<SearchResponse> {
  try {
    const response = await fetch(
      `/api/github/search?q=${encodeURIComponent(query)}&sort=${sort}&order=${order}&page=${page}`
    );
    
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error searching repositories:', error);
    throw error;
  }
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

export function formatNumber(num: number): string {
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k';
  }
  return num.toString();
}
