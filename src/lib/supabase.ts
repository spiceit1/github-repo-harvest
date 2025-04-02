
import { supabase } from '../integrations/supabase/client';
import { User } from '@supabase/supabase-js';

// Helper function to check if a user has admin role
export const isUserAdmin = (user: User): boolean => {
  return user?.user_metadata?.role === 'admin';
};

export { supabase };
