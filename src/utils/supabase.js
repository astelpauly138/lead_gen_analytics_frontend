import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Returns a Supabase client with the stored JWT injected.
 * Use this for authenticated DB operations (RLS) when the session
 * was established via the backend (not supabase.auth directly).
 */
export const getAuthedSupabase = () => {
  const token = localStorage.getItem('access_token');
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    },
  });
};
