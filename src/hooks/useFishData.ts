import { useContext } from 'react';
import { FishDataContext } from '../contexts/FishDataContext';

export function useFishData() {
  const context = useContext(FishDataContext);
  if (context === undefined) {
    throw new Error('useFishData must be used within a FishDataProvider');
  }
  return context;
} 