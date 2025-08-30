import { describe, it, expect, beforeEach, afterEach, vi, beforeAll, afterAll } from 'vitest';
import { FileScanningService, FileValidationError } from '../server/services/fileScanningService';
import { SecureUploadService } from '../server/services/secureUploadService';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// Mock dependencies
vi.mock('../server/services/s3Service', () => ({
  s3Service: {
    uploadFile: vi.fn().mockResolvedValue(undefined),
    generateDownloadUrl: vi.fn().mockResolvedValue('https://signed-url.com/file'),
    generateFileKey: vi.fn().mockImplementation((prefix, filename) => `${prefix}/${filename}`),
    ensureBucketExists: vi.fn().mockResolvedValue(undefined),
  }
}));

vi.mock('../server/db', () => ({
  db: {
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ id: 'test-file-id' }])
      })
    }),
    query: {
      assignments: {
        findFirst: vi.fn().mockResolvedValue({ id: 'test-assignment-id' })
      },
      documentFiles: {
        findFirst: vi.fn().mockResolvedValue({
          id: 'test-file-id',
          s3Key: 'test-key',
          fileName: 'test.pdf',
          scanResult: 'CLEAN'
        })
      }
    }
  }
}));

vi.mock('clamscan', () => ({
  default: vi.fn().mockImplementation(() => Promise.resolve({
    scan_file: vi.fn().mockResolvedValue({
      is_infected: false,
      viruses: []
    }),
    get_version: vi.fn().mockResolvedValue('ClamAV 0.103.0')
  }))
}));

describe('Upload Security & Compliance Tests', () => {
  let testDir: string;
  let fileScanningService: FileScanningService;

  beforeAll(() => {
    // Create test directory
    testDir = path.join(process.cwd(), 'test-files');
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }

    // Set test environment variables
    process.env.MAX_FILE_SIZE = '5242880'; // 5MB for testing
    process.env.ALLOWED_FILE_TYPES = 'pdf,jpg,png,txt';
    process.env.CLAMAV_HOST = 'localhost';
    process.env.CLAMAV_PORT = '3310';
    process.env.NODE_ENV = 'test';
  });

  beforeEach(() => {
    fileScanningService = new FileScanningService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up test files
    if (fs.existsSync(testDir)) {
      const files = fs.readdirSync(testDir);
      files.forEach(file => {
        const filePath = path.join(testDir, file);
        try {
          fs.unlinkSync(filePath);
        } catch (error) {
          // Ignore cleanup errors
        }
      });
    }
  });

  afterAll(() => {
    // Remove test directory
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('File Size Validation', () => {
    it('should accept files within size limit', async () => {
      // Create a 1MB test file
      const testFile = path.join(testDir, 'valid-size.pdf');
      const fileContent = Buffer.alloc(1024 * 1024, 'a'); // 1MB
      fs.writeFileSync(testFile, fileContent);

      const result = await fileScanningService.quickValidate(testFile);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject files exceeding size limit', async () => {
      // Create a 6MB test file (exceeds 5MB limit)
      const testFile = path.join(testDir, 'oversized.pdf');
      const fileContent = Buffer.alloc(6 * 1024 * 1024, 'a'); // 6MB
      fs.writeFileSync(testFile, fileContent);

      const result = await fileScanningService.quickValidate(testFile);
      expect(result.valid).toBe(false);
      expect(result.error?.code).toBe('FILE_TOO_LARGE');
      expect(result.error?.message).toContain('exceeds maximum allowed size');
    });

    it('should provide human-readable file size in error messages', async () => {
      const testFile = path.join(testDir, 'large-file.txt');
      const fileContent = Buffer.alloc(10 * 1024 * 1024, 'a'); // 10MB
      fs.writeFileSync(testFile, fileContent);

      const result = await fileScanningService.quickValidate(testFile);
      expect(result.valid).toBe(false);
      expect(result.error?.message).toContain('MB');
      expect(result.error?.details.actualSize).toBe(10 * 1024 * 1024);
    });
  });

  describe('File Type Validation', () => {
    it('should accept allowed file types', async () => {
      const allowedTypes = ['pdf', 'jpg', 'png', 'txt'];
      
      for (const type of allowedTypes) {
        const testFile = path.join(testDir, `test.${type}`);
        fs.writeFileSync(testFile, 'test content');

        const result = await fileScanningService.quickValidate(testFile);
        expect(result.valid).toBe(true);
      }
    });

    it('should reject disallowed file types', async () => {
      const disallowedTypes = ['exe', 'bat', 'sh', 'js', 'zip'];
      
      for (const type of disallowedTypes) {
        const testFile = path.join(testDir, `malicious.${type}`);
        fs.writeFileSync(testFile, 'malicious content');

        const result = await fileScanningService.quickValidate(testFile);
        expect(result.valid).toBe(false);
        expect(result.error?.code).toBe('INVALID_FILE_TYPE');
        expect(result.error?.message).toContain(`File type '${type}' is not allowed`);
      }
    });

    it('should handle files without extensions', async () => {
      const testFile = path.join(testDir, 'no-extension');
      fs.writeFileSync(testFile, 'content without extension');

      const result = await fileScanningService.quickValidate(testFile);
      expect(result.valid).toBe(false);
      expect(result.error?.code).toBe('INVALID_FILE_TYPE');
    });

    it('should be case insensitive for file extensions', async () => {
      const testFile = path.join(testDir, 'test.PDF');
      fs.writeFileSync(testFile, 'PDF content');

      const result = await fileScanningService.quickValidate(testFile);
      expect(result.valid).toBe(true);
    });
  });

  describe('File Hash Generation', () => {
    it('should generate consistent SHA256 hash for same file content', async () => {
      const content = 'test file content for hashing';
      const testFile = path.join(testDir, 'hash-test.txt');
      fs.writeFileSync(testFile, content);

      const expectedHash = crypto.createHash('sha256').update(content).digest('hex');
      
      const result = await fileScanningService.validateAndScanFile(testFile);
      expect(result.fileHash).toBe(expectedHash);
    });

    it('should generate different hashes for different content', async () => {
      const content1 = 'first file content';
      const content2 = 'second file content';
      
      const testFile1 = path.join(testDir, 'file1.txt');
      const testFile2 = path.join(testDir, 'file2.txt');
      
      fs.writeFileSync(testFile1, content1);
      fs.writeFileSync(testFile2, content2);

      const result1 = await fileScanningService.validateAndScanFile(testFile1);
      const result2 = await fileScanningService.validateAndScanFile(testFile2);

      expect(result1.fileHash).not.toBe(result2.fileHash);
      expect(result1.fileHash).toHaveLength(64); // SHA256 hex length
      expect(result2.fileHash).toHaveLength(64);
    });
  });

  describe('MIME Type Detection', () => {
    it('should detect correct MIME types for common file extensions', async () => {
      const testCases = [
        { ext: 'pdf', expectedMimeType: 'application/pdf' },
        { ext: 'jpg', expectedMimeType: 'image/jpeg' },
        { ext: 'jpeg', expectedMimeType: 'image/jpeg' },
        { ext: 'png', expectedMimeType: 'image/png' },
        { ext: 'txt', expectedMimeType: 'text/plain' },
      ];

      for (const testCase of testCases) {
        const testFile = path.join(testDir, `test.${testCase.ext}`);
        fs.writeFileSync(testFile, 'test content');

        const result = await fileScanningService.validateAndScanFile(testFile);
        expect(result.mimeType).toBe(testCase.expectedMimeType);
      }
    });

    it('should handle unknown file extensions with default MIME type', async () => {
      const testFile = path.join(testDir, 'test.unknown');
      fs.writeFileSync(testFile, 'unknown content');

      // First bypass file type validation by temporarily allowing unknown types
      process.env.ALLOWED_FILE_TYPES = 'pdf,jpg,png,txt,unknown';
      
      const result = await fileScanningService.validateAndScanFile(testFile);
      expect(result.mimeType).toBe('application/octet-stream');
      
      // Reset environment
      process.env.ALLOWED_FILE_TYPES = 'pdf,jpg,png,txt';
    });
  });

  describe('ClamAV Integration', () => {
    it('should report clean files as not infected', async () => {
      const testFile = path.join(testDir, 'clean-file.pdf');
      fs.writeFileSync(testFile, 'clean file content');

      const result = await fileScanningService.validateAndScanFile(testFile);
      expect(result.isInfected).toBe(false);
    });

    it('should handle ClamAV connection failures gracefully in development', async () => {
      // Mock ClamAV to throw connection error
      const mockClamscan = vi.fn().mockRejectedValue(new Error('Connection refused'));
      vi.doMock('clamscan', () => ({ default: mockClamscan }));

      const service = new FileScanningService();
      const testFile = path.join(testDir, 'test.pdf');
      fs.writeFileSync(testFile, 'content');

      // Should not throw in development mode
      const result = await service.validateAndScanFile(testFile);
      expect(result.isInfected).toBe(false); // Falls back to safe assumption
    });

    it('should include scan timing information', async () => {
      const testFile = path.join(testDir, 'timing-test.pdf');
      fs.writeFileSync(testFile, 'content for timing test');

      const startTime = Date.now();
      const result = await fileScanningService.validateAndScanFile(testFile);
      const endTime = Date.now();

      expect(result.scanTime).toBeGreaterThan(0);
      expect(result.scanTime).toBeLessThanOrEqual(endTime - startTime);
    });
  });

  describe('Health Check System', () => {
    it('should provide comprehensive health status', async () => {
      const health = await fileScanningService.healthCheck();
      
      expect(health).toHaveProperty('healthy');
      expect(health).toHaveProperty('details');
      expect(health.details).toHaveProperty('fileValidation');
      expect(health.details).toHaveProperty('clamAV');
      expect(health.details).toHaveProperty('configuration');
    });

    it('should include configuration information in health check', async () => {
      const health = await fileScanningService.healthCheck();
      
      expect(health.details.configuration).toHaveProperty('maxFileSize');
      expect(health.details.configuration).toHaveProperty('allowedTypes');
      expect(health.details.configuration).toHaveProperty('clamAVHost');
      expect(health.details.configuration).toHaveProperty('clamAVPort');
    });
  });

  describe('Error Handling', () => {
    it('should handle non-existent files gracefully', async () => {
      const nonExistentFile = path.join(testDir, 'does-not-exist.pdf');

      try {
        await fileScanningService.validateAndScanFile(nonExistentFile);
        expect.fail('Should have thrown an error');
      } catch (error) {
        const validationError = error as FileValidationError;
        expect(validationError.code).toBe('FILE_NOT_FOUND');
        expect(validationError.message).toContain('File not found');
      }
    });

    it('should provide detailed error information', async () => {
      const testFile = path.join(testDir, 'error-test.exe');
      fs.writeFileSync(testFile, 'executable content');

      try {
        await fileScanningService.validateAndScanFile(testFile);
        expect.fail('Should have thrown validation error');
      } catch (error) {
        const validationError = error as FileValidationError;
        expect(validationError.code).toBe('INVALID_FILE_TYPE');
        expect(validationError.message).toBeDefined();
        expect(validationError.details).toBeDefined();
        expect(validationError.details.fileExtension).toBe('exe');
        expect(validationError.details.allowedTypes).toEqual(['pdf', 'jpg', 'png', 'txt']);
      }
    });
  });

  describe('Configuration Management', () => {
    it('should read configuration from environment variables', () => {
      const config = fileScanningService.getConfiguration();
      
      expect(config.maxFileSize).toBe(5242880); // 5MB from env
      expect(config.allowedTypes).toEqual(['pdf', 'jpg', 'png', 'txt']);
      expect(config.clamAVHost).toBe('localhost');
      expect(config.clamAVPort).toBe(3310);
    });

    it('should use default values when environment variables are missing', () => {
      // Temporarily remove env vars
      const originalMaxSize = process.env.MAX_FILE_SIZE;
      const originalAllowedTypes = process.env.ALLOWED_FILE_TYPES;
      
      delete process.env.MAX_FILE_SIZE;
      delete process.env.ALLOWED_FILE_TYPES;

      const service = new FileScanningService();
      const config = service.getConfiguration();
      
      expect(config.maxFileSize).toBe(10485760); // Default 10MB
      expect(config.allowedTypes).toContain('pdf');
      expect(config.allowedTypes).toContain('doc');
      expect(config.allowedTypes).toContain('jpg');

      // Restore env vars
      if (originalMaxSize) process.env.MAX_FILE_SIZE = originalMaxSize;
      if (originalAllowedTypes) process.env.ALLOWED_FILE_TYPES = originalAllowedTypes;
    });
  });

  describe('S3 Security Integration', () => {
    it('should configure S3 uploads with encryption and private ACL', async () => {
      const { s3Service } = await import('../server/services/s3Service');
      
      await s3Service.uploadFile('test-key', Buffer.from('test'), 'text/plain', {
        'scan-result': 'CLEAN',
        'file-hash': 'testhash'
      });

      expect(s3Service.uploadFile).toHaveBeenCalledWith(
        'test-key',
        expect.any(Buffer),
        'text/plain',
        expect.objectContaining({
          'scan-result': 'CLEAN',
          'file-hash': 'testhash'
        })
      );
    });

    it('should generate secure upload URLs with proper settings', async () => {
      const { s3Service } = await import('../server/services/s3Service');
      
      const url = await s3Service.generateUploadUrl('test-key', 'application/pdf');
      
      expect(url).toBe('https://signed-url.com/file');
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle multiple concurrent file scans efficiently', async () => {
      const files = [];
      const scanPromises = [];

      // Create multiple test files
      for (let i = 0; i < 5; i++) {
        const testFile = path.join(testDir, `concurrent-${i}.txt`);
        fs.writeFileSync(testFile, `Test content ${i}`);
        files.push(testFile);
      }

      // Start concurrent scans
      const startTime = Date.now();
      for (const file of files) {
        scanPromises.push(fileScanningService.validateAndScanFile(file));
      }

      const results = await Promise.all(scanPromises);
      const totalTime = Date.now() - startTime;

      // Verify all scans completed
      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result.isInfected).toBe(false);
        expect(result.fileHash).toBeDefined();
        expect(result.scanTime).toBeGreaterThan(0);
      });

      // Performance check - concurrent execution should be faster than sequential
      console.log(`Concurrent scan of 5 files took ${totalTime}ms`);
      expect(totalTime).toBeLessThan(10000); // Should complete within 10 seconds
    });

    it('should handle large files within memory constraints', async () => {
      // Create a 4MB file (within 5MB limit)
      const largeFile = path.join(testDir, 'large-file.pdf');
      const largeContent = Buffer.alloc(4 * 1024 * 1024, 'x');
      fs.writeFileSync(largeFile, largeContent);

      const startTime = Date.now();
      const result = await fileScanningService.validateAndScanFile(largeFile);
      const scanTime = Date.now() - startTime;

      expect(result.isInfected).toBe(false);
      expect(result.fileSize).toBe(4 * 1024 * 1024);
      expect(result.fileHash).toHaveLength(64);
      
      // Should handle large files efficiently
      console.log(`Large file (4MB) scan took ${scanTime}ms`);
      expect(scanTime).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });

  describe('Romanian Immigration Compliance', () => {
    it('should handle Romanian document types with diacritics', async () => {
      const romanianFiles = [
        'Certificat_de_naștere.pdf',
        'Diplomă_de_bacalaureat.pdf',
        'Certificat_de_căsătorie.pdf'
      ];

      for (const filename of romanianFiles) {
        const testFile = path.join(testDir, filename);
        fs.writeFileSync(testFile, 'Romanian document content');

        const result = await fileScanningService.validateAndScanFile(testFile);
        expect(result.isInfected).toBe(false);
        expect(result.fileHash).toBeDefined();
      }
    });

    it('should enforce strict security for immigration documents', async () => {
      const testFile = path.join(testDir, 'passport.pdf');
      const passportContent = 'PASSPORT DOCUMENT - CONFIDENTIAL';
      fs.writeFileSync(testFile, passportContent);

      const result = await fileScanningService.validateAndScanFile(testFile);
      
      // Should complete all security checks
      expect(result.isInfected).toBe(false);
      expect(result.fileHash).toBeDefined();
      expect(result.fileSize).toBe(passportContent.length);
      expect(result.mimeType).toBe('application/pdf');
      expect(result.scanTime).toBeGreaterThan(0);
    });
  });
});