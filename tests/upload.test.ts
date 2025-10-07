import { describe, it, expect, beforeAll } from 'vitest';
import { s3Service } from '../server/services/s3Service';
import { storage } from '../server/storage';

describe('Supabase Storage Service', () => {
  beforeAll(async () => {
    await s3Service.ensureBucketExists();
  });

  it('should generate signed upload URL', async () => {
    const key = 'documents/test-file.pdf';
    const contentType = 'application/pdf';
    
    const uploadUrl = await s3Service.generateUploadUrl(key, contentType, 3600);
    
    expect(uploadUrl).toBeTruthy();
    expect(typeof uploadUrl).toBe('string');
    expect(uploadUrl).toContain('supabase');
  });

  it('should generate signed download URL', async () => {
    const key = 'documents/test-file.pdf';
    
    const downloadUrl = await s3Service.generateDownloadUrl(key, 3600);
    
    expect(downloadUrl).toContain('supabase');
    expect(typeof downloadUrl).toBe('string');
  });

  it('should upload and delete file', async () => {
    const testContent = Buffer.from('Test file content');
    const key = 'test/upload-test.txt';
    
    await s3Service.uploadFile(key, testContent, 'text/plain');
    
    await s3Service.deleteFile(key);
    
    expect(true).toBe(true);
  });

  it('should create document file record', async () => {
    const documentData = {
      assignmentId: 'test-assignment-id',
      kind: 'USER_UPLOAD' as const,
      s3Key: 'documents/test-123.pdf',
      fileName: 'test-document.pdf',
      mimeType: 'application/pdf',
      uploadedByUserId: 'test-user-id',
      status: 'PENDING' as const,
      scanResult: 'CLEAN',
    };
    
    const documentFile = await storage.createDocumentFile(documentData);
    
    expect(documentFile).toHaveProperty('id');
    expect(documentFile.fileName).toBe(documentData.fileName);
    expect(documentFile.s3Key).toBe(documentData.s3Key);
  });

  it('should generate unique file keys', () => {
    const key1 = s3Service.generateFileKey('documents', 'test.pdf');
    const key2 = s3Service.generateFileKey('documents', 'test.pdf');
    
    expect(key1).not.toBe(key2);
    expect(key1).toContain('documents/');
    expect(key1).toContain('test.pdf');
  });
});
