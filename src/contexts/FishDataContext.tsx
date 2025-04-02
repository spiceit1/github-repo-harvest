import React, { createContext, useContext, useState, useEffect } from 'react';
import * as fishStorage from '../utils/fishStorage';
import { supabase, checkConnection } from '../lib/supabase';

interface FishDataContextType {
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
}

const FishDataContext = createContext<FishDataContextType>({
  loading: false,
  error: null,
  refreshData: async () => {},
});

export const useFishData = () => useContext(FishDataContext);

export const FishDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(true);

  const checkServerConnection = async () => {
    try {
      const connected = await checkConnection();
      setIsConnected(connected);
      return connected;
    } catch (err) {
      console.error('Connection check failed:', err);
      setIsConnected(false);
      return false;
    }
  };

  const refreshData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const isConnected = await checkServerConnection();
      if (!isConnected) {
        setError('Cannot connect to server');
        return;
      }
      
      // This is a placeholder for actual data loading
      await fishStorage.fetchFishData();
      
    } catch (err) {
      console.error('Error refreshing data:', err);
      setError('Failed to refresh data');
    } finally {
      setLoading(false);
    }
  };

  // Check connection on mount
  useEffect(() => {
    const initialCheck = async () => {
      await checkServerConnection();
    };
    initialCheck();
  }, []);

  // Recheck connection when tab becomes active
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkServerConnection();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return (
    <FishDataContext.Provider
      value={{
        loading,
        error,
        refreshData,
      }}
    >
      {children}
    </FishDataContext.Provider>
  );
};
