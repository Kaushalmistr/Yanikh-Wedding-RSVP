import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Debug: Log Supabase configuration (only in development)
if (import.meta.env.DEV) {
  console.log('🔧 Supabase Config:', {
    url: supabaseUrl ? '✓ Set' : '✗ Missing',
    key: supabaseAnonKey ? '✓ Set' : '✗ Missing',
    urlValue: supabaseUrl,
  });
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Supabase credentials are missing!');
    console.error('Check your .env file has:');
    console.error('  VITE_SUPABASE_URL=...');
    console.error('  VITE_SUPABASE_ANON_KEY=...');
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)