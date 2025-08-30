import { describe, it, expect, beforeEach, afterEach, vi, beforeAll, afterAll } from 'vitest';
import { EmailService } from '../../server/services/emailService';
import { addEmailJob, addReminderJob } from '../../server/workers/queue';

// Mock environment for testing
const mockEnv = {
  MAIL_PROVIDER: 'development',
  MAIL_FROM: 'test@patra.ro',
  REDIS_URL: 'redis://localhost:6379',
};

describe('Email and Reminder Integration', () => {
  let originalEnv: NodeJS.ProcessEnv;
  let emailService: EmailService;

  beforeAll(() => {
    originalEnv = { ...process.env };
    Object.assign(process.env, mockEnv);
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  beforeEach(() => {
    emailService = new EmailService();
    vi.clearAllMocks();
  });

  describe('End-to-End Email Workflow', () => {
    it('should process upload reminder workflow', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      // Test data
      const workerData = {
        workerName: 'Maria Popescu',
        documentName: 'Employment Contract',
        dueDate: '2024-12-15',
        loginUrl: 'https://patra.ro/login',
      };

      // 1. Get the template
      const template = emailService.getUploadReminderTemplate();
      expect(template).toBeDefined();
      expect(template.subject).toContain('Upload Required Document');

      // 2. Send email
      const result = await emailService.sendEmail(
        'maria.popescu@example.com',
        template,
        workerData
      );

      expect(result).toBe(true);

      // 3. Verify template was interpolated correctly
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Maria Popescu')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Employment Contract')
      );

      consoleSpy.mockRestore();
    });

    it('should process document status change workflow', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const statusData = {
        workerName: 'Ion Gheorghe',
        documentName: 'Passport Copy',
        status: 'Under Review',
        adminMessage: 'Document received and is being processed by immigration authorities.',
        loginUrl: 'https://patra.ro/dashboard',
      };

      const template = emailService.getStatusChangedTemplate();
      const result = await emailService.sendEmail(
        'ion.gheorghe@example.com',
        template,
        statusData
      );

      expect(result).toBe(true);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Under Review')
      );

      consoleSpy.mockRestore();
    });

    it('should process document approval workflow', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const approvalData = {
        workerName: 'Elena Radu',
        documentName: 'Work Permit Application',
        adminMessage: 'Congratulations! Your work permit has been approved.',
        loginUrl: 'https://patra.ro/documents',
      };

      const template = emailService.getDocumentApprovedTemplate();
      const result = await emailService.sendEmail(
        'elena.radu@example.com',
        template,
        approvalData
      );

      expect(result).toBe(true);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Document Approved')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('✓')
      );

      consoleSpy.mockRestore();
    });

    it('should process document rejection workflow', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const rejectionData = {
        workerName: 'Alexandru Munteanu',
        documentName: 'Medical Certificate',
        reason: 'The medical certificate is expired. Please provide a certificate issued within the last 6 months.',
        adminMessage: 'Please contact your healthcare provider for a new certificate.',
        loginUrl: 'https://patra.ro/resubmit',
      };

      const template = emailService.getDocumentRejectedTemplate();
      const result = await emailService.sendEmail(
        'alexandru.munteanu@example.com',
        template,
        rejectionData
      );

      expect(result).toBe(true);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Requires Attention')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('expired')
      );

      consoleSpy.mockRestore();
    });

    it('should process stage progression workflow', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const stageData = {
        workerName: 'Cristina Popescu',
        stageName: 'Work Permit Application (IGI)',
        adminMessage: 'Your AJOFM approval has been completed. We are now preparing your IGI work permit application.',
        loginUrl: 'https://patra.ro/progress',
      };

      const template = emailService.getStageMovedTemplate();
      const result = await emailService.sendEmail(
        'cristina.popescu@example.com',
        template,
        stageData
      );

      expect(result).toBe(true);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Progress Update')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('🎉')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Multi-language Support', () => {
    it('should handle Romanian worker names with diacritics', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const romanianData = {
        workerName: 'Ștefan Țăndărică',
        documentName: 'Certificat de cazier',
        loginUrl: 'https://patra.ro/login',
      };

      const template = emailService.getUploadReminderTemplate();
      const result = await emailService.sendEmail(
        'stefan.tandarica@example.com',
        template,
        romanianData
      );

      expect(result).toBe(true);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Ștefan Țăndărică')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Certificat de cazier')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Email Template Content Validation', () => {
    it('should contain all required Patra branding elements', () => {
      const templates = [
        emailService.getUploadReminderTemplate(),
        emailService.getStatusChangedTemplate(),
        emailService.getDocumentApprovedTemplate(),
        emailService.getDocumentRejectedTemplate(),
        emailService.getStageMovedTemplate(),
        emailService.getExpiryReminderTemplate(),
      ];

      templates.forEach((template) => {
        // Check branding
        expect(template.html).toContain('Patra');
        expect(template.text).toContain('Patra');
        expect(template.html).toContain('Romanian Immigration Services');
        expect(template.text).toContain('Romanian Immigration Services');
        
        // Check footer
        expect(template.html).toContain('Romanian Immigration Specialists');
        expect(template.text).toContain('Romanian Immigration Specialists');
        
        // Check automated message notice
        expect(template.html).toContain('automated message');
        expect(template.text).toContain('automated message');
      });
    });

    it('should have mobile-responsive design elements', () => {
      const template = emailService.getUploadReminderTemplate();
      
      // Check for responsive elements
      expect(template.html).toContain('viewport');
      expect(template.html).toContain('max-width');
      expect(template.html).toContain('margin: 20px auto');
    });

    it('should use proper color coding for different message types', () => {
      const approvedTemplate = emailService.getDocumentApprovedTemplate();
      const rejectedTemplate = emailService.getDocumentRejectedTemplate();
      const stageTemplate = emailService.getStageMovedTemplate();

      // Approved should use green colors
      expect(approvedTemplate.html).toContain('#059669');
      expect(approvedTemplate.html).toContain('#ECFDF5');

      // Rejected should use red colors
      expect(rejectedTemplate.html).toContain('#DC2626');
      expect(rejectedTemplate.html).toContain('#FEF2F2');

      // Stage progression should use purple colors
      expect(stageTemplate.html).toContain('#7C3AED');
      expect(stageTemplate.html).toContain('#F5F3FF');
    });
  });

  describe('Error Scenarios', () => {
    it('should handle missing template data gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const incompleteData = {
        workerName: 'Test User',
        // Missing other required fields
      };

      const template = emailService.getUploadReminderTemplate();
      const result = await emailService.sendEmail(
        'test@example.com',
        template,
        incompleteData
      );

      expect(result).toBe(true); // Should still succeed
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Test User')
      );

      consoleSpy.mockRestore();
    });

    it('should handle special characters in email data', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const specialCharsData = {
        workerName: 'José María Çağlar',
        documentName: 'Contract de muncă & Anexe',
        adminMessage: 'Document contains special chars: áéíóú, çğş, âîțș',
        loginUrl: 'https://patra.ro/login?ref=test&token=abc123',
      };

      const template = emailService.getStatusChangedTemplate();
      const result = await emailService.sendEmail(
        'jose.caglar@example.com',
        template,
        specialCharsData
      );

      expect(result).toBe(true);

      consoleSpy.mockRestore();
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle multiple concurrent email sends', async () => {
      const promises = [];
      const template = emailService.getUploadReminderTemplate();

      for (let i = 0; i < 10; i++) {
        promises.push(
          emailService.sendEmail(
            `user${i}@example.com`,
            template,
            {
              workerName: `User ${i}`,
              documentName: `Document ${i}`,
            }
          )
        );
      }

      const results = await Promise.all(promises);
      expect(results.every(result => result === true)).toBe(true);
    });

    it('should process large template data efficiently', async () => {
      const largeTemplateData = {
        workerName: 'Test User',
        documentName: 'Document with very long description '.repeat(100),
        adminMessage: 'This is a very long admin message '.repeat(50),
        loginUrl: 'https://patra.ro/login',
      };

      const template = emailService.getStatusChangedTemplate();
      const startTime = Date.now();
      
      const result = await emailService.sendEmail(
        'test@example.com',
        template,
        largeTemplateData
      );

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(result).toBe(true);
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });
  });
});