import { createClient } from '@supabase/supabase-js'

// O Vite requer o prefixo VITE_, mas vamos verificar fallbacks comuns
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

// Só criar o cliente se a URL for válida para evitar erro "Invalid supabaseUrl"
const isValidUrl = (url: string) => {
  try {
    return url && (url.startsWith('http://') || url.startsWith('https://'));
  } catch {
    return false;
  }
};

export const supabase = isValidUrl(supabaseUrl)
  ? createClient(supabaseUrl, supabaseAnonKey || '') 
  : (null as any); // Fallback para null para evitar crash na inicialização
