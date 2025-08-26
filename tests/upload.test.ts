import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { s3Service } from '../server/services/s3Service';
import { storage } from '../server/storage';

describe('File Upload Tests', () => {
  beforeAll(async () => {
    await s3Service.ensureBucketExists();
  });

  it('should generate signed upload URL', async () => {
    const fileName = 'test-document.pdf';
    const contentType = 'application/pdf';
    
    const uploadUrl = await s3Service.generateUploadUrl(
      `test/${fileName}`,
      contentType,
      3600
    );

    expect(uploadUrl).toContain('test/test-document.pdf');
    expect(typeof uploadUrl).toBe('string');
  });

  it('should generate file key with timestamp', () => {
    const key = s3Service.generateFileKey('documents', 'test.pdf');
    
    expect(key).toMatch(/^documents\/\d+-[a-z0-9]+-test\.pdf$/);
  });

  it('should generate signed download URL', async () => {
    const s3Key = 'documents/test-file.pdf';
    
    const downloadUrl = await s3Service.generateDownloadUrl(s3Key, 3600);
    
    expect(downloadUrl).toContain(s3Key);
    expect(typeof downloadUrl).toBe('string');
  });

  it('should upload and delete file', async () => {
    const testContent = Buffer.from('Test file content');
    const s3Key = 'test/upload-test.txt';
    
    // Upload file
    await s3Service.uploadFile(s3Key, testContent, 'text/plain');
    
    // Delete file
    await s3Service.deleteFile(s3Key);
    
    // Test passes if no errors thrown
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
    };

    const documentFile = await storage.createDocumentFile(documentData);
    
    expect(documentFile).toHaveProperty('id');
    expect(documentFile.fileName).toBe(documentData.fileName);
    expect(documentFile.s3Key).toBe(documentData.s3Key);
  });
});
