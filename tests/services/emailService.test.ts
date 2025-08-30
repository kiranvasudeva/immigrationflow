import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { EmailService, EmailData } from '../../server/services/emailService';

// Mock nodemailer
vi.mock('nodemailer', () => ({
  createTransport: vi.fn(() => ({
    sendMail: vi.fn().mockResolvedValue({ messageId: 'test-id' }),
  })),
}));

// Mock Resend
vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: {
      send: vi.fn().mockResolvedValue({ id: 'test-id' }),
    },
  })),
}));

describe('EmailService', () => {
  let emailService: EmailService;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('Provider Selection', () => {
    it('should use development provider by default', () => {
      process.env.MAIL_PROVIDER = 'development';
      emailService = new EmailService();
      expect(emailService).toBeInstanceOf(EmailService);
    });

    it('should use SMTP provider when configured', () => {
      process.env.MAIL_PROVIDER = 'smtp';
      process.env.MAIL_HOST = 'smtp.example.com';
      process.env.MAIL_USER = 'test@example.com';
      process.env.MAIL_PASS = 'password';
      emailService = new EmailService();
      expect(emailService).toBeInstanceOf(EmailService);
    });

    it('should use Resend provider when configured', () => {
      process.env.MAIL_PROVIDER = 'resend';
      process.env.MAIL_API_KEY = 'test-api-key';
      emailService = new EmailService();
      expect(emailService).toBeInstanceOf(EmailService);
    });

    it('should throw error for Resend without API key', () => {
      process.env.MAIL_PROVIDER = 'resend';
      delete process.env.MAIL_API_KEY;
      expect(() => new EmailService()).toThrow('MAIL_API_KEY is required for Resend provider');
    });
  });

  describe('Template Interpolation', () => {
    beforeEach(() => {
      process.env.MAIL_PROVIDER = 'development';
      emailService = new EmailService();
    });

    it('should interpolate template variables correctly', async () => {
      const template = emailService.getUploadReminderTemplate();
      const data: EmailData = {
        workerName: 'John Doe',
        documentName: 'Passport Copy',
        dueDate: '2024-12-31',
        loginUrl: 'https://patra.ro/login',
      };

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      await emailService.sendEmail('test@example.com', template, data);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('John Doe')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Passport Copy')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('2024-12-31')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('https://patra.ro/login')
      );

      consoleSpy.mockRestore();
    });

    it('should handle missing template variables gracefully', async () => {
      const template = emailService.getUploadReminderTemplate();
      const data: EmailData = {
        workerName: 'John Doe',
        // Missing documentName, dueDate, loginUrl
      };

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      await emailService.sendEmail('test@example.com', template, data);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('John Doe')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Email Templates', () => {
    beforeEach(() => {
      process.env.MAIL_PROVIDER = 'development';
      emailService = new EmailService();
    });

    it('should generate upload reminder template', () => {
      const template = emailService.getUploadReminderTemplate();
      
      expect(template.subject).toContain('Upload Required Document');
      expect(template.html).toContain('Document Upload Required');
      expect(template.text).toContain('Document Upload Required');
      expect(template.html).toContain('{{workerName}}');
      expect(template.text).toContain('{{documentName}}');
    });

    it('should generate status changed template', () => {
      const template = emailService.getStatusChangedTemplate();
      
      expect(template.subject).toContain('Status Update');
      expect(template.html).toContain('Status Update');
      expect(template.text).toContain('Status Update');
      expect(template.html).toContain('{{status}}');
      expect(template.text).toContain('{{adminMessage}}');
    });

    it('should generate document approved template', () => {
      const template = emailService.getDocumentApprovedTemplate();
      
      expect(template.subject).toContain('Document Approved');
      expect(template.html).toContain('Document Approved');
      expect(template.text).toContain('Document Approved');
      expect(template.html).toContain('✓');
      expect(template.text).toContain('✓');
    });

    it('should generate document rejected template', () => {
      const template = emailService.getDocumentRejectedTemplate();
      
      expect(template.subject).toContain('Requires Attention');
      expect(template.html).toContain('Requires Attention');
      expect(template.text).toContain('Requires Attention');
      expect(template.html).toContain('{{reason}}');
      expect(template.text).toContain('{{reason}}');
    });

    it('should generate stage moved template', () => {
      const template = emailService.getStageMovedTemplate();
      
      expect(template.subject).toContain('Progress Update');
      expect(template.html).toContain('Progress Update');
      expect(template.text).toContain('Progress Update');
      expect(template.html).toContain('🎉');
      expect(template.text).toContain('🎉');
    });

    it('should generate expiry reminder template', () => {
      const template = emailService.getExpiryReminderTemplate();
      
      expect(template.subject).toContain('Expiry Alert');
      expect(template.html).toContain('Expiry Alert');
      expect(template.text).toContain('Expiry Alert');
      expect(template.html).toContain('{{daysUntilDue}}');
      expect(template.text).toContain('{{daysUntilDue}}');
    });
  });

  describe('Email Sending', () => {
    it('should send email successfully in development mode', async () => {
      process.env.MAIL_PROVIDER = 'development';
      emailService = new EmailService();

      const template = emailService.getUploadReminderTemplate();
      const data: EmailData = {
        workerName: 'Test User',
        documentName: 'Test Document',
        loginUrl: 'https://test.com',
      };

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const result = await emailService.sendEmail('test@example.com', template, data);

      expect(result).toBe(true);
      expect(consoleSpy).toHaveBeenCalledWith('=== EMAIL DEBUG ===');
      
      consoleSpy.mockRestore();
    });

    it('should handle email sending errors', async () => {
      process.env.MAIL_PROVIDER = 'development';
      emailService = new EmailService();

      // Mock console.error to silence error logs during test
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Override the provider's sendEmail method to throw an error
      (emailService as any).provider.sendEmail = vi.fn().mockRejectedValue(new Error('Test error'));

      const template = emailService.getUploadReminderTemplate();
      const result = await emailService.sendEmail('test@example.com', template, {});

      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to send email:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('HTML Email Validation', () => {
    beforeEach(() => {
      process.env.MAIL_PROVIDER = 'development';
      emailService = new EmailService();
    });

    it('should generate valid HTML structure for all templates', () => {
      const templates = [
        emailService.getUploadReminderTemplate(),
        emailService.getStatusChangedTemplate(),
        emailService.getDocumentApprovedTemplate(),
        emailService.getDocumentRejectedTemplate(),
        emailService.getStageMovedTemplate(),
        emailService.getExpiryReminderTemplate(),
      ];

      templates.forEach((template) => {
        // Check for basic HTML structure
        expect(template.html).toContain('<!DOCTYPE html>');
        expect(template.html).toContain('<html>');
        expect(template.html).toContain('<head>');
        expect(template.html).toContain('<body>');
        expect(template.html).toContain('</body>');
        expect(template.html).toContain('</html>');
        
        // Check for responsive meta tag
        expect(template.html).toContain('viewport');
        
        // Check for UTF-8 charset
        expect(template.html).toContain('utf-8');
        
        // Check for Patra branding
        expect(template.html).toContain('Patra');
      });
    });

    it('should include proper styles for email compatibility', () => {
      const template = emailService.getUploadReminderTemplate();
      
      // Check for inline styles (required for email compatibility)
      expect(template.html).toContain('style=');
      expect(template.html).toContain('font-family');
      expect(template.html).toContain('max-width');
      expect(template.html).toContain('background-color');
    });
  });
});