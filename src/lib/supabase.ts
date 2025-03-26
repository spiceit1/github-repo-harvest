import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables:', {
    url: supabaseUrl ? 'present' : 'missing',
    key: supabaseAnonKey ? 'present' : 'missing'
  });
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

// Create Supabase client with basic configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  db: {
    schema: 'public'
  }
});

// Helper function to check if user is admin
export const isUserAdmin = (user: any) => {
  return user?.user_metadata?.role === 'admin' || 
         user?.app_metadata?.role === 'admin';
};

// Helper function to handle database error
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
  
  return 'An unexpected error occurred. Please try again later.';
};

// Helper to check connection status
export const checkConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('fish_data')
      .select('id', { count: 'exact', head: true });

    if (error) {
      console.error('Connection check failed:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Connection check error:', error);
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

// Helper function to initialize Supabase
export const initializeSupabase = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('fish_data')
      .select('id')
      .limit(1);

    if (error) {
      console.error('Supabase initialization error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Failed to initialize Supabase:', error);
    return false;
  }
};