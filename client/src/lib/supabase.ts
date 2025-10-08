import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type AuthMode = 'otp' | 'magic-link';

export interface AuthOptions {
  email: string;
  options: {
    shouldCreateUser: true;
    emailRedirectTo?: string;
  };
}

export function buildAuthOptions(mode: AuthMode, email: string): AuthOptions {
  const baseOptions: AuthOptions = {
    email: email.toLowerCase().trim(),
    options: {
      shouldCreateUser: true
    }
  };

  if (mode === 'magic-link') {
    baseOptions.options.emailRedirectTo = `${window.location.origin}/auth/callback`;
  }

  return baseOptions;
}
