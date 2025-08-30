import NodeClam from 'clamscan';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

export interface ScanResult {
  isInfected: boolean;
  virusName?: string;
  scanTime: number;
  fileHash: string;
  fileSize: number;
  mimeType?: string;
}

export interface FileValidationError {
  code: 'FILE_TOO_LARGE' | 'INVALID_FILE_TYPE' | 'VIRUS_DETECTED' | 'SCAN_FAILED' | 'FILE_NOT_FOUND';
  message: string;
  details?: any;
}

export class FileScanningService {
  private clamAV: any = null;
  private isInitialized = false;
  private maxFileSize: number;
  private allowedTypes: string[];

  constructor() {
    // Get file size limit from environment (default 10MB)
    this.maxFileSize = parseInt(process.env.MAX_FILE_SIZE || '10485760');
    
    // Get allowed file types from environment
    const allowedTypesStr = process.env.ALLOWED_FILE_TYPES || 'pdf,doc,docx,jpg,jpeg,png,gif,txt';
    this.allowedTypes = allowedTypesStr.toLowerCase().split(',').map(type => type.trim());

    // Initialize ClamAV connection
    this.initializeClamAV();
  }

  private async initializeClamAV(): Promise<void> {
    try {
      const clamAVHost = process.env.CLAMAV_HOST || 'localhost';
      const clamAVPort = parseInt(process.env.CLAMAV_PORT || '3310');

      this.clamAV = new NodeClam({
        clamdscan: {
          host: clamAVHost,
          port: clamAVPort,
          timeout: 60000,
          local_fallback: false,
          path: '/usr/bin/clamdscan',
          config_file: '/etc/clamd.conf',
          multiscan: true,
          reload_db: false,
          active: true,
          bypass_test: false,
        },
        preference: 'clamdscan'
      });
      
      // Initialize the scanner
      await this.clamAV.init();

      this.isInitialized = true;
      console.log(`✅ ClamAV initialized successfully (${clamAVHost}:${clamAVPort})`);
    } catch (error) {
      console.error('❌ Failed to initialize ClamAV:', error);
      
      // In development, we might want to continue without ClamAV
      if (process.env.NODE_ENV === 'development') {
        console.warn('⚠️  Running in development mode without ClamAV scanning');
        this.isInitialized = false;
      } else {
        throw new Error('ClamAV initialization failed in production mode');
      }
    }
  }

  /**
   * Validate file size against configured limits
   */
  private validateFileSize(filePath: string): void {
    const stats = fs.statSync(filePath);
    if (stats.size > this.maxFileSize) {
      throw {
        code: 'FILE_TOO_LARGE',
        message: `File size (${this.formatFileSize(stats.size)}) exceeds maximum allowed size (${this.formatFileSize(this.maxFileSize)})`,
        details: { actualSize: stats.size, maxSize: this.maxFileSize }
      } as FileValidationError;
    }
  }

  /**
   * Validate file type based on extension and MIME type
   */
  private validateFileType(filePath: string, mimeType?: string): void {
    const ext = path.extname(filePath).toLowerCase().slice(1);
    
    if (!this.allowedTypes.includes(ext)) {
      throw {
        code: 'INVALID_FILE_TYPE',
        message: `File type '${ext}' is not allowed. Allowed types: ${this.allowedTypes.join(', ')}`,
        details: { fileExtension: ext, allowedTypes: this.allowedTypes, mimeType }
      } as FileValidationError;
    }
  }

  /**
   * Calculate SHA256 hash of file
   */
  private calculateFileHash(filePath: string): string {
    const fileBuffer = fs.readFileSync(filePath);
    return crypto.createHash('sha256').update(fileBuffer).digest('hex');
  }

  /**
   * Get MIME type from file content (basic implementation)
   */
  private getMimeType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.txt': 'text/plain',
    };
    return mimeTypes[ext] || 'application/octet-stream';
  }

  /**
   * Format file size for human reading
   */
  private formatFileSize(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Scan file for viruses using ClamAV
   */
  private async scanForViruses(filePath: string): Promise<{ isInfected: boolean; virusName?: string }> {
    if (!this.isInitialized || !this.clamAV) {
      console.warn('⚠️  ClamAV not initialized, skipping virus scan');
      return { isInfected: false };
    }

    try {
      const scanResult = await this.clamAV.scan_file(filePath);
      
      if (scanResult.is_infected) {
        console.warn(`🦠 Virus detected in file ${filePath}: ${scanResult.viruses.join(', ')}`);
        return {
          isInfected: true,
          virusName: scanResult.viruses.join(', ')
        };
      }

      return { isInfected: false };
    } catch (error) {
      console.error('❌ Virus scan failed:', error);
      throw {
        code: 'SCAN_FAILED',
        message: 'Virus scan failed due to technical error',
        details: error
      } as FileValidationError;
    }
  }

  /**
   * Comprehensive file validation and scanning
   */
  async validateAndScanFile(filePath: string): Promise<ScanResult> {
    const startTime = Date.now();

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw {
        code: 'FILE_NOT_FOUND',
        message: `File not found: ${filePath}`
      } as FileValidationError;
    }

    try {
      // 1. Validate file size
      this.validateFileSize(filePath);

      // 2. Get file stats and MIME type
      const stats = fs.statSync(filePath);
      const mimeType = this.getMimeType(filePath);

      // 3. Validate file type
      this.validateFileType(filePath, mimeType);

      // 4. Calculate file hash
      const fileHash = this.calculateFileHash(filePath);

      // 5. Scan for viruses
      const virusScanResult = await this.scanForViruses(filePath);

      if (virusScanResult.isInfected) {
        throw {
          code: 'VIRUS_DETECTED',
          message: `Virus detected: ${virusScanResult.virusName}`,
          details: { virusName: virusScanResult.virusName }
        } as FileValidationError;
      }

      const scanTime = Date.now() - startTime;

      console.log(`✅ File validation completed for ${path.basename(filePath)} in ${scanTime}ms`);

      return {
        isInfected: false,
        scanTime,
        fileHash,
        fileSize: stats.size,
        mimeType
      };

    } catch (error: any) {
      const scanTime = Date.now() - startTime;
      
      if (error.code) {
        // Re-throw validation errors
        throw error;
      }
      
      // Wrap unexpected errors
      throw {
        code: 'SCAN_FAILED',
        message: 'File validation failed due to unexpected error',
        details: error
      } as FileValidationError;
    }
  }

  /**
   * Quick validation without virus scan (for pre-upload checks)
   */
  async quickValidate(filePath: string): Promise<{ valid: boolean; error?: FileValidationError }> {
    try {
      if (!fs.existsSync(filePath)) {
        return {
          valid: false,
          error: {
            code: 'FILE_NOT_FOUND',
            message: `File not found: ${filePath}`
          }
        };
      }

      this.validateFileSize(filePath);
      this.validateFileType(filePath);

      return { valid: true };
    } catch (error: any) {
      return {
        valid: false,
        error: error as FileValidationError
      };
    }
  }

  /**
   * Get configuration information
   */
  getConfiguration() {
    return {
      maxFileSize: this.maxFileSize,
      maxFileSizeFormatted: this.formatFileSize(this.maxFileSize),
      allowedTypes: this.allowedTypes,
      clamAVInitialized: this.isInitialized,
      clamAVHost: process.env.CLAMAV_HOST || 'localhost',
      clamAVPort: parseInt(process.env.CLAMAV_PORT || '3310')
    };
  }

  /**
   * Health check for the scanning service
   */
  async healthCheck(): Promise<{ healthy: boolean; details: any }> {
    const details: any = {
      fileValidation: true,
      clamAV: this.isInitialized,
      configuration: this.getConfiguration()
    };

    if (this.isInitialized && this.clamAV) {
      try {
        // Test ClamAV connection with a ping
        const version = await this.clamAV.get_version();
        details.clamAVVersion = version;
        details.clamAVConnected = true;
      } catch (error) {
        details.clamAVConnected = false;
        details.clamAVError = error instanceof Error ? error.message : String(error);
      }
    }

    const healthy = details.fileValidation && (details.clamAVConnected || process.env.NODE_ENV === 'development');

    return { healthy, details };
  }
}

let _fileScanningServiceInstance: FileScanningService | null = null;

export function getFileScanningService(): FileScanningService {
  if (!_fileScanningServiceInstance) {
    _fileScanningServiceInstance = new FileScanningService();
  }
  return _fileScanningServiceInstance;
}

// For backwards compatibility
export const fileScanningService = {
  get validateAndScanFile() { return getFileScanningService().validateAndScanFile.bind(getFileScanningService()); },
  get quickValidate() { return getFileScanningService().quickValidate.bind(getFileScanningService()); },
  get getConfiguration() { return getFileScanningService().getConfiguration.bind(getFileScanningService()); },
  get healthCheck() { return getFileScanningService().healthCheck.bind(getFileScanningService()); },
};