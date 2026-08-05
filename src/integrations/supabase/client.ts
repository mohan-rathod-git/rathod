import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// SECURITY: These MUST be set as environment variables.
// Never add hardcoded fallback values here — they get bundled into the public JS.
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  throw new Error(
    '[Supabase] Missing required env vars: VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY. ' +
    'Copy .env.example to .env and fill in the values.'
  );
}

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionFromUrl: true, // Reads #access_token=... hash (Google OAuth implicit flow)
    flowType: 'implicit',       // Use implicit flow to match what Supabase dashboard sends
  },
});