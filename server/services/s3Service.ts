import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export class S3Service {
  private s3Client: S3Client;
  private bucket: string;

  constructor() {
    const endpoint = process.env.S3_ENDPOINT;
    const region = process.env.S3_REGION || 'eu-central-1';
    
    if (!endpoint) {
      throw new Error('S3_ENDPOINT environment variable is required');
    }

    this.s3Client = new S3Client({
      endpoint,
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

  generateFileKey(prefix: string, filename: string): string {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    
    return `${prefix}/${timestamp}-${randomString}-${sanitizedFilename}`;
  }

  async ensureBucketExists(): Promise<void> {
    // In a production environment, you might want to create the bucket if it doesn't exist
    // For now, we assume the bucket is already created
    console.log(`Using S3 bucket: ${this.bucket}`);
  }
}

export const s3Service = new S3Service();
