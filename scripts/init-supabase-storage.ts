import { createClient } from '@supabase/supabase-js';

async function initSupabaseStorage() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE environment variables');
  }

  const supabaseStorage = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
  try {
    console.log('🔍 Checking Supabase Storage bucket...');
    
    const bucketName = process.env.SUPABASE_STORAGE_BUCKET || 'documents';
    const { data: buckets, error } = await supabaseStorage.storage.listBuckets();
    
    if (error) {
      throw error;
    }
    
    const bucketExists = buckets?.some(b => b.name === bucketName);
    
    if (!bucketExists) {
      console.log(`📦 Creating bucket: ${bucketName}`);
      const { error: createError } = await supabaseStorage.storage.createBucket(bucketName, {
        public: false,
        fileSizeLimit: 10485760,
        allowedMimeTypes: ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
      });
      
      if (createError) {
        throw createError;
      }
      
      console.log(`✅ Bucket created: ${bucketName}`);
    } else {
      console.log(`✅ Bucket already exists: ${bucketName}`);
    }
  } catch (error) {
    console.error('❌ Failed to initialize Supabase Storage:', error);
    process.exit(1);
  }
}

initSupabaseStorage();
