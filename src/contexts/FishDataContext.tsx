import React, { createContext, useContext, useState, useEffect } from 'react';
import { FishData } from '../types';
import FishStorage from '../utils/fishStorage';
import ImageCache from '../utils/imageCache';

interface FishDataContextType {
  fishData: FishData[];
  setFishData: React.Dispatch<React.SetStateAction<FishData[]>>;
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  categories: string[];
  updateCategories: (fishData: FishData[]) => void;
}

const FishDataContext = createContext<FishDataContextType>({
  fishData: [],
  setFishData: () => {},
  loading: true,
  error: null,
  refreshData: async () => {},
  categories: [],
  updateCategories: () => {}
});

export const useFishData = () => useContext(FishDataContext);

export const FishDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [fishData, setFishData] = useState<FishData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await FishStorage.loadFishData(
        (loaded, total) => {
          // Progress callback if needed
        },
        true
      );

      setFishData(data);
      updateCategories(data);
      
      // Preload images in the background
      ImageCache.preloadImages(data).catch(console.error);
    } catch (err) {
      console.error('Error loading fish data:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const updateCategories = (data: FishData[]) => {
    const uniqueCategories = Array.from(new Set(
      data
        .filter(fish => !fish.isCategory && (!fish.disabled || true))
        .filter(fish => fish.category)
        .map(fish => fish.category!)
        .sort()
    ));
    setCategories(uniqueCategories);
  };

  const refreshData = async () => {
    await loadInitialData();
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  return (
    <FishDataContext.Provider value={{
      fishData,
      setFishData,
      loading,
      error,
      refreshData,
      categories,
      updateCategories
    }}>
      {children}
    </FishDataContext.Provider>
  );
};