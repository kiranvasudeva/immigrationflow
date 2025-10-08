import { createClient } from '@supabase/supabase-js';

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE environment variables');
}

export const supabaseStorage = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export const STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'documents';

export function getStorageBucket() {
  return supabaseStorage.storage.from(STORAGE_BUCKET);
}
