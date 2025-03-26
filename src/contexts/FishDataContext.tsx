import React, { createContext, useState, useEffect } from 'react';
import { FishData } from '../types';
import FishStorage from '../utils/fishStorage';
import ImageCache from '../utils/imageCache';
import LoadingIndicator from '../components/LoadingIndicator';
import ImageLoadingProgress from '../components/ImageLoadingProgress';
import { checkConnection } from '../lib/supabase';

interface FishDataContextType {
  fishData: FishData[];
  setFishData: React.Dispatch<React.SetStateAction<FishData[]>>;
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  categories: string[];
  updateCategories: (fishData: FishData[]) => void;
  connectionState: 'connecting' | 'connected' | 'error';
  imageLoadingProgress: { loaded: number; total: number } | null;
  progress: { loaded: number; total: number; stage?: 'database' | 'images' } | null;
}

const FishDataContext = createContext<FishDataContextType>({
  fishData: [],
  setFishData: () => {},
  loading: false,
  error: null,
  refreshData: async () => {},
  categories: [],
  updateCategories: () => {},
  connectionState: 'connecting',
  imageLoadingProgress: null,
  progress: null
});

const FishDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [fishData, setFishData] = useState<FishData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [progress, setProgress] = useState<{ loaded: number; total: number; stage?: 'database' | 'images' } | null>(null);
  const [imageLoadingProgress, setImageLoadingProgress] = useState<{ loaded: number; total: number } | null>(null);
  const [connectionState, setConnectionState] = useState<'connecting' | 'connected' | 'error'>('connecting');

  // Add a static flag to prevent duplicate loads across renders
  const loadId = React.useRef<string | null>(null);

  const loadInitialData = async () => {
    // Prevent multiple simultaneous loads
    if (loading) {
      console.log('Ignoring loadInitialData call - already loading');
      return;
    }
    
    // Generate a unique ID for this load operation
    const currentLoadId = Date.now().toString(36);
    
    // Check if we're trying to load again too quickly (potential double render)
    if (loadId.current) {
      const timeSinceLastLoad = Date.now() - parseInt(loadId.current, 36);
      if (timeSinceLastLoad < 1000) { // Within 1 second
        console.log(`Ignoring duplicate load call within ${timeSinceLastLoad}ms`);
        return;
      }
    }
    
    // Set current load ID
    loadId.current = currentLoadId;
    console.log(`Starting loadInitialData with ID: ${currentLoadId}`);
    
    let loadedData: FishData[] = [];
    setLoading(true);
    setError(null);
    setProgress({ loaded: 0, total: 0 }); // Initialize with 0
    setImageLoadingProgress(null);

    try {
      console.log('Starting loadInitialData...');
      
      // Initialize FishStorage with progress callback
      await FishStorage.initialize((loaded, total, stage) => {
        console.log(`Data loading progress: ${loaded}/${total} (${stage || 'unknown'})`);
        // Show data loading progress
        setProgress({ loaded, total, stage });
      });

      loadedData = await FishStorage.loadFishData();
      
      if (!loadedData || loadedData.length === 0) {
        throw new Error('No fish data available');
      }

      // Set initial data
      setFishData(loadedData);
      updateCategories(loadedData);

      // Check connection in background
      checkConnection().then(isConnected => {
        setConnectionState(isConnected ? 'connected' : 'error');
      });

      // Only clear loading state after everything is done
      setLoading(false);
      setProgress(null);

    } catch (error) {
      console.error('Error in loadInitialData:', error);
      setError(error instanceof Error ? error.message : 'Failed to load data');
      setLoading(false);
      setConnectionState('error');
      setProgress(null);
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

  // Load initial data when component mounts
  useEffect(() => {
    console.log('FishDataProvider useEffect triggered - loading initial data');
    // Create a unique ID for this render cycle to track multiple calls
    const renderCycleId = Date.now().toString(36);
    console.log(`Render cycle ID: ${renderCycleId}`);
    loadInitialData();
    
    return () => {
      console.log(`Cleanup for render cycle: ${renderCycleId}`);
    };
  }, []);

  // Show loading indicator whenever we're loading and have progress
  const showLoadingIndicator = loading || (progress !== null && progress.total > 0);

  return (
    <FishDataContext.Provider value={{
      fishData,
      setFishData,
      loading,
      error,
      refreshData,
      categories,
      updateCategories,
      connectionState,
      imageLoadingProgress,
      progress
    }}>
      {error && !loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="text-center text-red-600 mb-4">
              <div className="text-lg font-semibold mb-2">Error</div>
              <div className="text-sm whitespace-pre-wrap">{error}</div>
            </div>
            <button
              onClick={refreshData}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Retry Connection
            </button>
          </div>
        </div>
      )}
      {children}
    </FishDataContext.Provider>
  );
};

export { FishDataContext, FishDataProvider };