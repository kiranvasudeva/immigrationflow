import { supabaseStorage, getStorageBucket } from '../lib/supabaseStorage';
import { Readable } from 'stream';

export class SupabaseStorageService {
  async generateUploadUrl(key: string, contentType: string, expiresIn = 3600): Promise<string> {
    const bucket = getStorageBucket();
    
    const { data, error } = await bucket.createSignedUploadUrl(key);
    
    if (error) {
      throw new Error(`Failed to generate upload URL: ${error.message}`);
    }
    
    return data.signedUrl;
  }

  async generateDownloadUrl(key: string, expiresIn = 3600): Promise<string> {
    const bucket = getStorageBucket();
    
    const { data, error } = await bucket.createSignedUrl(key, expiresIn);
    
    if (error) {
      throw new Error(`Failed to generate download URL: ${error.message}`);
    }
    
    return data.signedUrl;
  }

  async uploadFile(key: string, buffer: Buffer, contentType: string, metadata?: Record<string, string>): Promise<void> {
    const bucket = getStorageBucket();
    
    const { error } = await bucket.upload(key, buffer, {
      contentType,
      upsert: false,
      cacheControl: '3600',
      ...(metadata && { 
        metadata: {
          'uploaded-via': 'supabase-storage-service',
          ...metadata
        }
      })
    });
    
    if (error) {
      throw new Error(`Failed to upload file: ${error.message}`);
    }
  }

  async deleteFile(key: string): Promise<void> {
    const bucket = getStorageBucket();
    
    const { error } = await bucket.remove([key]);
    
    if (error) {
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }

  async getFileStream(key: string): Promise<NodeJS.ReadableStream> {
    const bucket = getStorageBucket();
    
    const { data, error } = await bucket.download(key);
    
    if (error || !data) {
      throw new Error(`Failed to download file: ${error?.message || 'No data returned'}`);
    }
    
    const arrayBuffer = await data.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    return Readable.from(buffer);
  }

  generateFileKey(prefix: string, filename: string): string {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    
    return `${prefix}/${timestamp}-${randomString}-${sanitizedFilename}`;
  }

  async ensureBucketExists(): Promise<void> {
    const { data: buckets, error } = await supabaseStorage.storage.listBuckets();
    
    if (error) {
      console.warn('⚠️  Could not list buckets:', error.message);
      return;
    }
    
    const bucketName = process.env.SUPABASE_STORAGE_BUCKET || 'documents';
    const bucketExists = buckets?.some(b => b.name === bucketName);
    
    if (bucketExists) {
      console.log(`✓ Supabase Storage bucket exists: ${bucketName}`);
    } else {
      try {
        const { error: createError } = await supabaseStorage.storage.createBucket(bucketName, {
          public: false,
          fileSizeLimit: 10485760,
          allowedMimeTypes: ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
        });
        
        if (createError) {
          console.warn(`⚠️  Could not create bucket ${bucketName}:`, createError.message);
        } else {
          console.log(`✓ Supabase Storage bucket created: ${bucketName}`);
        }
      } catch (createError) {
        console.warn(`⚠️  Could not create bucket ${bucketName}:`, createError);
      }
    }
  }
}

let _storageServiceInstance: SupabaseStorageService | null = null;

export function getStorageService(): SupabaseStorageService {
  if (!_storageServiceInstance) {
    _storageServiceInstance = new SupabaseStorageService();
  }
  return _storageServiceInstance;
}

export const s3Service = {
  get generateUploadUrl() { return getStorageService().generateUploadUrl.bind(getStorageService()); },
  get generateDownloadUrl() { return getStorageService().generateDownloadUrl.bind(getStorageService()); },
  get uploadFile() { return getStorageService().uploadFile.bind(getStorageService()); },
  get deleteFile() { return getStorageService().deleteFile.bind(getStorageService()); },
  get getFileStream() { return getStorageService().getFileStream.bind(getStorageService()); },
  get generateFileKey() { return getStorageService().generateFileKey.bind(getStorageService()); },
  get ensureBucketExists() { return getStorageService().ensureBucketExists.bind(getStorageService()); },
};
