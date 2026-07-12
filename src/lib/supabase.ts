import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummyurl.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummyanonkey';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummyservicerolekey';

// Browser/public client (respects RLS)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server admin client (bypasses RLS - use only in server-side code)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
