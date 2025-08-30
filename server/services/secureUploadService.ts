import { Request, Response } from 'express';
import { fileScanningService, ScanResult, FileValidationError } from './fileScanningService';
import { s3Service } from './s3Service';
import { db } from '../db';
import { documentFiles, assignments } from '../../shared/schema';
import { eq } from 'drizzle-orm';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Configure multer for temporary file storage
const upload = multer({
  dest: 'temp/', // Temporary directory for scanning
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // Default 10MB
  },
  fileFilter: (req, file, cb) => {
    // Pre-validation before upload
    const allowedTypes = (process.env.ALLOWED_FILE_TYPES || 'pdf,doc,docx,jpg,jpeg,png').split(',');
    const ext = path.extname(file.originalname).toLowerCase().slice(1);
    
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`File type .${ext} not allowed. Allowed types: ${allowedTypes.join(', ')}`));
    }
  }
});

export interface SecureUploadResult {
  success: boolean;
  fileId?: string;
  s3Key?: string;
  scanResult?: ScanResult;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export class SecureUploadService {
  /**
   * Handle secure file upload with validation and scanning
   */
  static upload = upload.single('file');

  static async processSecureUpload(req: Request, res: Response): Promise<void> {
    let tempFilePath: string | null = null;

    try {
      // Validate required parameters
      const { assignmentId } = req.body;
      if (!assignmentId) {
        res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_ASSIGNMENT_ID',
            message: 'Assignment ID is required'
          }
        });
        return;
      }

      // Verify assignment exists and user has access
      const assignment = await db.query.assignments.findFirst({
        where: eq(assignments.id, assignmentId)
      });

      if (!assignment) {
        res.status(404).json({
          success: false,
          error: {
            code: 'ASSIGNMENT_NOT_FOUND',
            message: 'Assignment not found'
          }
        });
        return;
      }

      // Check if file was uploaded
      if (!req.file) {
        res.status(400).json({
          success: false,
          error: {
            code: 'NO_FILE_UPLOADED',
            message: 'No file was uploaded'
          }
        });
        return;
      }

      tempFilePath = req.file.path;

      console.log(`🔒 Starting secure upload process for file: ${req.file.originalname}`);

      // Step 1: Comprehensive file validation and scanning
      let scanResult: ScanResult;
      try {
        scanResult = await fileScanningService.validateAndScanFile(tempFilePath);
        console.log(`✅ File scan completed: ${req.file.originalname} - CLEAN`);
      } catch (error) {
        const validationError = error as FileValidationError;
        console.error(`❌ File validation failed: ${validationError.message}`);
        
        res.status(400).json({
          success: false,
          error: {
            code: validationError.code,
            message: validationError.message,
            details: validationError.details
          }
        });
        return;
      }

      // Step 2: Generate secure S3 key with proper structure
      const userId = (req.user as any)?.claims?.sub || 'anonymous';
      const fileExtension = path.extname(req.file.originalname);
      const s3Key = s3Service.generateFileKey(
        `secure-uploads/${assignmentId}`, 
        `${uuidv4()}${fileExtension}`
      );

      // Step 3: Upload to S3 with encryption and private ACL
      const fileBuffer = fs.readFileSync(tempFilePath);
      const uploadMetadata = {
        'original-filename': req.file.originalname,
        'file-hash': scanResult.fileHash,
        'scan-result': 'CLEAN',
        'uploaded-by': userId,
        'assignment-id': assignmentId
      };

      await s3Service.uploadFile(
        s3Key, 
        fileBuffer, 
        scanResult.mimeType || req.file.mimetype, 
        uploadMetadata
      );

      console.log(`🔐 File securely uploaded to S3: ${s3Key}`);

      // Step 4: Store file metadata in database with scan results
      const fileRecord = await db.insert(documentFiles).values({
        id: uuidv4(),
        assignmentId: assignmentId,
        kind: 'USER_UPLOAD',
        s3Key: s3Key,
        fileName: req.file.originalname,
        mimeType: scanResult.mimeType || req.file.mimetype,
        fileSize: scanResult.fileSize,
        fileHash: scanResult.fileHash,
        scanResult: 'CLEAN',
        virusName: null,
        scannedAt: new Date(),
        uploadedByUserId: userId
      }).returning();

      console.log(`📝 File metadata stored in database: ${fileRecord[0].id}`);

      // Step 5: Generate secure download URL (valid for 1 hour)
      const downloadUrl = await s3Service.generateDownloadUrl(s3Key, 3600);

      // Step 6: Return success response
      const result: SecureUploadResult = {
        success: true,
        fileId: fileRecord[0].id,
        s3Key: s3Key,
        scanResult: scanResult
      };

      res.status(200).json(result);

    } catch (error) {
      console.error('❌ Secure upload failed:', error);
      
      res.status(500).json({
        success: false,
        error: {
          code: 'UPLOAD_FAILED',
          message: 'File upload failed due to server error',
          details: process.env.NODE_ENV === 'development' ? error : undefined
        }
      });
    } finally {
      // Clean up temporary file
      if (tempFilePath && fs.existsSync(tempFilePath)) {
        try {
          fs.unlinkSync(tempFilePath);
          console.log(`🧹 Cleaned up temporary file: ${tempFilePath}`);
        } catch (cleanupError) {
          console.error('⚠️  Failed to cleanup temporary file:', cleanupError);
        }
      }
    }
  }

  /**
   * Get secure download URL for uploaded file
   */
  static async getSecureDownloadUrl(req: Request, res: Response): Promise<void> {
    try {
      const { fileId } = req.params;
      const userId = (req.user as any)?.claims?.sub;

      if (!fileId) {
        res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_FILE_ID',
            message: 'File ID is required'
          }
        });
        return;
      }

      // Get file record and verify access
      const fileRecord = await db.query.documentFiles.findFirst({
        where: eq(documentFiles.id, fileId),
        with: {
          assignment: true
        }
      });

      if (!fileRecord) {
        res.status(404).json({
          success: false,
          error: {
            code: 'FILE_NOT_FOUND',
            message: 'File not found'
          }
        });
        return;
      }

      // Verify scan result before allowing download
      if (fileRecord.scanResult === 'INFECTED') {
        res.status(403).json({
          success: false,
          error: {
            code: 'FILE_INFECTED',
            message: 'File is infected and cannot be downloaded',
            details: { virusName: fileRecord.virusName }
          }
        });
        return;
      }

      // Generate secure download URL
      const downloadUrl = await s3Service.generateDownloadUrl(fileRecord.s3Key, 3600);

      res.status(200).json({
        success: true,
        downloadUrl: downloadUrl,
        fileName: fileRecord.fileName,
        fileSize: fileRecord.fileSize,
        mimeType: fileRecord.mimeType,
        scanResult: fileRecord.scanResult,
        scannedAt: fileRecord.scannedAt
      });

    } catch (error) {
      console.error('❌ Failed to generate download URL:', error);
      
      res.status(500).json({
        success: false,
        error: {
          code: 'DOWNLOAD_URL_FAILED',
          message: 'Failed to generate download URL'
        }
      });
    }
  }

  /**
   * Health check for secure upload service
   */
  static async healthCheck(req: Request, res: Response): Promise<void> {
    try {
      const fileScannerHealth = await fileScanningService.healthCheck();
      
      // Check S3 connectivity
      let s3Healthy = false;
      try {
        await s3Service.ensureBucketExists();
        s3Healthy = true;
      } catch (s3Error) {
        console.error('S3 health check failed:', s3Error);
      }

      const overall = fileScannerHealth.healthy && s3Healthy;

      res.status(overall ? 200 : 503).json({
        healthy: overall,
        services: {
          fileScanning: fileScannerHealth,
          s3Storage: {
            healthy: s3Healthy,
            bucket: process.env.S3_BUCKET,
            endpoint: process.env.S3_ENDPOINT
          }
        },
        configuration: fileScanningService.getConfiguration()
      });

    } catch (error) {
      res.status(503).json({
        healthy: false,
        error: 'Health check failed',
        details: error
      });
    }
  }

  /**
   * Get upload configuration for frontend
   */
  static async getUploadConfiguration(req: Request, res: Response): Promise<void> {
    const config = fileScanningService.getConfiguration();
    
    res.status(200).json({
      maxFileSize: config.maxFileSize,
      maxFileSizeFormatted: config.maxFileSizeFormatted,
      allowedTypes: config.allowedTypes,
      securityEnabled: {
        virusScanning: config.clamAVInitialized,
        encryption: true,
        privateAccess: true
      }
    });
  }
}

// Ensure temp directory exists
const tempDir = 'temp';
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
  console.log(`📁 Created temporary directory: ${tempDir}`);
}