import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, CreateBucketCommand, HeadBucketCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export class S3Service {
  private s3Client: S3Client;
  private bucket: string;

  constructor() {
    const endpoint = process.env.S3_ENDPOINT;
    const region = process.env.S3_REGION || 'eu-central-1';
    
    if (!endpoint) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('⚠️  S3_ENDPOINT not configured, using development defaults');
        // Use localhost MinIO defaults for development
        process.env.S3_ENDPOINT = 'http://localhost:9000';
        process.env.S3_ACCESS_KEY = process.env.S3_ACCESS_KEY || 'minioadmin';
        process.env.S3_SECRET_KEY = process.env.S3_SECRET_KEY || 'minioadmin';
      } else {
        throw new Error('S3_ENDPOINT environment variable is required');
      }
    }

    this.s3Client = new S3Client({
      endpoint: process.env.S3_ENDPOINT,
      region,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY!,
        secretAccessKey: process.env.S3_SECRET_KEY!,
      },
      forcePathStyle: true, // Required for MinIO
    });

    this.bucket = process.env.S3_BUCKET || 'immigration-flow-documents';
  }

  async generateUploadUrl(key: string, contentType: string, expiresIn = 3600): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
      ACL: 'private', // Ensure private access only
      ServerSideEncryption: 'AES256', // Enable server-side encryption
      Metadata: {
        'uploaded-via': 'patra-security-service',
        'encryption-enabled': 'true'
      }
    });

    return await getSignedUrl(this.s3Client, command, { expiresIn });
  }

  async generateDownloadUrl(key: string, expiresIn = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    return await getSignedUrl(this.s3Client, command, { expiresIn });
  }

  async uploadFile(key: string, buffer: Buffer, contentType: string, metadata?: Record<string, string>): Promise<void> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      ACL: 'private', // Ensure private access only
      ServerSideEncryption: 'AES256', // Enable server-side encryption
      Metadata: {
        'uploaded-via': 'patra-security-service',
        'encryption-enabled': 'true',
        ...metadata // Allow additional metadata
      }
    });

    await this.s3Client.send(command);
  }

  async deleteFile(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    await this.s3Client.send(command);
  }

  async getFileStream(key: string): Promise<NodeJS.ReadableStream> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    const response = await this.s3Client.send(command);
    
    if (!response.Body) {
      throw new Error('File not found or empty response');
    }

    return response.Body as NodeJS.ReadableStream;
  }

  generateFileKey(prefix: string, filename: string): string {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    
    return `${prefix}/${timestamp}-${randomString}-${sanitizedFilename}`;
  }

  async ensureBucketExists(): Promise<void> {
    try {
      // Check if bucket exists
      const headCommand = new HeadBucketCommand({
        Bucket: this.bucket,
      });
      await this.s3Client.send(headCommand);
      console.log(`✓ S3 bucket exists: ${this.bucket}`);
    } catch (error: any) {
      if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
        try {
          // Create bucket if it doesn't exist
          const createCommand = new CreateBucketCommand({
            Bucket: this.bucket,
          });
          await this.s3Client.send(createCommand);
          console.log(`✓ S3 bucket created: ${this.bucket}`);
        } catch (createError) {
          console.warn(`⚠️  Could not create bucket ${this.bucket}:`, createError);
          // Continue anyway - bucket might exist but we don't have HeadBucket permission
        }
      } else {
        console.warn(`⚠️  Could not verify bucket ${this.bucket}:`, error.message);
        // Continue anyway - bucket might exist but we don't have HeadBucket permission
      }
    }
  }
}

let _s3ServiceInstance: S3Service | null = null;

export function getS3Service(): S3Service {
  if (!_s3ServiceInstance) {
    _s3ServiceInstance = new S3Service();
  }
  return _s3ServiceInstance;
}

// For backwards compatibility
export const s3Service = {
  get generateUploadUrl() { return getS3Service().generateUploadUrl.bind(getS3Service()); },
  get generateDownloadUrl() { return getS3Service().generateDownloadUrl.bind(getS3Service()); },
  get uploadFile() { return getS3Service().uploadFile.bind(getS3Service()); },
  get deleteFile() { return getS3Service().deleteFile.bind(getS3Service()); },
  get getFileStream() { return getS3Service().getFileStream.bind(getS3Service()); },
  get generateFileKey() { return getS3Service().generateFileKey.bind(getS3Service()); },
  get ensureBucketExists() { return getS3Service().ensureBucketExists.bind(getS3Service()); },
};
