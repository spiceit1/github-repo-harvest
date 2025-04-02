
import { createClient, User } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper function to check if a user has admin role
export const isUserAdmin = (user: User): boolean => {
  return user?.user_metadata?.role === 'admin';
};

// Helper function to check connection status
export const checkConnection = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase.from('fish_data').select('count(*)').limit(1);
    return !error && !!data;
  } catch (error) {
    console.error('Connection check failed:', error);
    return false;
  }
};
