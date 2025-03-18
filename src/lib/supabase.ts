import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

// Retry configuration
const RETRY_COUNT = 3;
const INITIAL_RETRY_DELAY = 1000;
const MAX_RETRY_DELAY = 5000;

// Custom fetch implementation with retry logic and backoff
const fetchWithRetry: typeof fetch = async (input, init) => {
  let lastError: Error | null = null;
  let delay = INITIAL_RETRY_DELAY;

  for (let attempt = 0; attempt < RETRY_COUNT; attempt++) {
    try {
      // Add headers to optimize query performance
      const response = await fetch(input, {
        ...init,
        headers: {
          ...init?.headers,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Prefer': 'count=exact'
        }
      });
      
      // Check if response is ok
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return response;
    } catch (error) {
      lastError = error as Error;
      console.warn(`Fetch attempt ${attempt + 1} failed:`, error);

      // Don't wait on the last attempt
      if (attempt < RETRY_COUNT - 1) {
        await new Promise(resolve => setTimeout(resolve, delay));
        // Exponential backoff with max delay
        delay = Math.min(delay * 2, MAX_RETRY_DELAY);
      }
    }
  }

  throw new Error(`Failed after ${RETRY_COUNT} attempts: ${lastError?.message}`);
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storageKey: 'fish-store-auth',
    storage: window.localStorage
  },
  global: {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${supabaseAnonKey}`,
      'X-Client-Info': 'fish-store@1.0.0',
      'Prefer': 'count=exact'
    },
    fetch: fetchWithRetry
  }
});

// Initialize connection with retries
export const initializeSupabase = async () => {
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 1000;
  let lastError = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      // Test connection with a minimal query
      const { data, error } = await supabase
        .from('fish_data')
        .select('id')
        .limit(1)
        .single();

      if (error) throw error;

      console.log('Supabase connection initialized successfully');
      return true;
    } catch (error) {
      lastError = error;
      if (attempt === MAX_RETRIES - 1) {
        console.error('Failed to initialize Supabase connection after all retries:', error);
        return false;
      }
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * Math.pow(2, attempt)));
    }
  }

  if (lastError) {
    console.error('Final connection error:', lastError);
  }
  return false;
};

// Helper function to check if user is admin
export const isUserAdmin = (user: any) => {
  return user?.user_metadata?.role === 'admin' || 
         user?.app_metadata?.role === 'admin';
};

// Helper function to handle database errors
export const handleDatabaseError = (error: any): string => {
  console.error('Database error:', error);
  
  if (error?.message?.includes('Failed to fetch')) {
    return 'Network error. Please check your internet connection and try again.';
  }
  
  if (error?.code === 'PGRST116') {
    return 'Database connection error. Please try again later.';
  }
  
  if (error?.code === '42P01') {
    return 'Required database tables are not set up. Please contact support.';
  }
  
  if (error?.code === '23505') {
    return 'A duplicate entry was found. Please try again with different data.';
  }
  
  if (error?.code === 'PGRST301') {
    return 'Database query error. Please try again.';
  }
  
  return 'An unexpected error occurred. Please try again later.';
};

// Helper to check connection status
export const checkConnection = async () => {
  try {
    const { error } = await supabase
      .from('fish_data')
      .select('id')
      .limit(1)
      .single();

    return !error;
  } catch (error) {
    console.error('Connection check failed:', error);
    return false;
  }
};

// Helper for updating fish prices
export const updateFishPrice = async (fishId: string, price: number) => {
  try {
    // First try to update or insert into manual_prices
    const { error: manualPriceError } = await supabase
      .from('manual_prices')
      .upsert(
        { fish_id: fishId, price },
        { onConflict: 'fish_id' }
      );

    if (manualPriceError) throw manualPriceError;

    // Then update the fish_data table
    const { error: fishDataError } = await supabase
      .from('fish_data')
      .update({ sale_cost: price })
      .eq('id', fishId);

    if (fishDataError) throw fishDataError;

    return true;
  } catch (error) {
    console.error('Error updating price:', error);
    return false;
  }
};