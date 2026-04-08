import { createClient } from '@supabase/supabase-js'

// Vite requires VITE_ prefix, but we'll check common fallbacks
const supabaseUrl = (
  import.meta.env.VITE_SUPABASE_URL || 
  import.meta.env.NEXT_PUBLIC_SUPABASE_URL ||
  ''
).trim();

const supabaseAnonKey = (
  import.meta.env.VITE_SUPABASE_ANON_KEY || 
  import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
  ''
).trim();

if (!supabaseUrl) {
  console.error('CRITICAL: VITE_SUPABASE_URL is missing. Please set it in the Settings menu.')
}

if (!supabaseAnonKey) {
  console.error('CRITICAL: VITE_SUPABASE_ANON_KEY is missing. Please set it in the Settings menu.')
}

// Only create client if URL is valid to avoid "Invalid supabaseUrl" error
const isValidUrl = (url: string) => {
  try {
    return url && (url.startsWith('http://') || url.startsWith('https://'));
  } catch {
    return false;
  }
};

export const supabase = isValidUrl(supabaseUrl)
  ? createClient(supabaseUrl, supabaseAnonKey || '') 
  : (null as any); // Fallback to null to prevent crash on startup
