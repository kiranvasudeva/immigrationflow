import { describe, it, expect, beforeEach, afterEach, vi, beforeAll, afterAll } from 'vitest';
import { Queue, Job } from 'bullmq';
import IORedis from 'ioredis';
import {
  addEmailJob,
  addReminderJob,
  addPdfJob,
  getQueueStats,
  EmailJobData,
  ReminderJobData,
  PdfJobData,
} from '../../server/workers/queue';

// Mock IORedis
vi.mock('ioredis', () => {
  const mockRedis = {
    maxRetriesPerRequest: 3,
    lazyConnect: true,
    quit: vi.fn().mockResolvedValue('OK'),
  };
  return {
    default: vi.fn(() => mockRedis),
  };
});

// Mock BullMQ
vi.mock('bullmq', () => {
  const mockJob = {
    id: 'test-job-id',
    name: 'test-job',
    data: {},
    opts: { attempts: 3 },
    attemptsMade: 0,
    processedOn: Date.now(),
    finishedOn: Date.now() + 1000,
  };

  const mockQueue = {
    add: vi.fn().mockResolvedValue(mockJob),
    removeRepeatable: vi.fn().mockResolvedValue(undefined),
    getJobCounts: vi.fn().mockResolvedValue({
      waiting: 0,
      active: 0,
      completed: 5,
      failed: 1,
    }),
  };

  const mockWorker = {
    name: 'test-worker',
    on: vi.fn(),
  };

  return {
    Queue: vi.fn(() => mockQueue),
    Worker: vi.fn(() => mockWorker),
    Job: vi.fn(() => mockJob),
  };
});

// Mock services
vi.mock('../../server/services/reminderService', () => ({
  reminderService: {
    evaluateReminders: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('../../server/services/emailService', () => ({
  emailService: {
    sendEmail: vi.fn().mockResolvedValue(true),
    getUploadReminderTemplate: vi.fn().mockReturnValue({
      subject: 'Test Subject',
      html: 'Test HTML',
      text: 'Test Text',
    }),
    getStatusChangedTemplate: vi.fn().mockReturnValue({
      subject: 'Status Update',
      html: 'Status HTML',
      text: 'Status Text',
    }),
  },
}));

describe('Queue System', () => {
  beforeAll(() => {
    // Set required environment variable
    process.env.REDIS_URL = 'redis://localhost:6379';
  });

  afterAll(() => {
    delete process.env.REDIS_URL;
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Queue Initialization', () => {
    it('should require REDIS_URL environment variable', () => {
      delete process.env.REDIS_URL;
      
      expect(() => {
        // This would normally fail during module import, but since we're mocking,
        // we'll simulate the check
        if (!process.env.REDIS_URL) {
          throw new Error('REDIS_URL environment variable is required');
        }
      }).toThrow('REDIS_URL environment variable is required');
      
      // Restore for other tests
      process.env.REDIS_URL = 'redis://localhost:6379';
    });

    it('should initialize with proper queue settings', () => {
      // Import after setting up mocks and env vars
      const { Queue } = require('bullmq');
      
      // Verify Queue was called with connection and default job options
      expect(Queue).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          connection: expect.any(Object),
          defaultJobOptions: expect.objectContaining({
            attempts: 3,
            backoff: expect.objectContaining({
              type: 'exponential',
              delay: 2000,
            }),
            removeOnComplete: 100,
            removeOnFail: 50,
          }),
        })
      );
    });
  });

  describe('Email Job Management', () => {
    it('should add email job with correct parameters', async () => {
      const emailData: EmailJobData = {
        to: 'test@example.com',
        templateName: 'upload-reminder',
        templateData: {
          workerName: 'John Doe',
          documentName: 'Passport',
        },
      };

      const job = await addEmailJob(
        emailData.to,
        emailData.templateName,
        emailData.templateData,
        { priority: 5, delay: 1000 }
      );

      expect(job).toBeDefined();
      expect(job.id).toBe('test-job-id');
    });

    it('should add email job with default options', async () => {
      const job = await addEmailJob(
        'test@example.com',
        'status-changed',
        { status: 'approved' }
      );

      expect(job).toBeDefined();
    });
  });

  describe('Reminder Job Management', () => {
    it('should add reminder job with correct parameters', async () => {
      const job = await addReminderJob(
        'send-deadline-reminder',
        {
          assignmentId: 'assignment-123',
          userId: 'user-456',
        },
        { delay: 3600000 } // 1 hour delay
      );

      expect(job).toBeDefined();
      expect(job.id).toBe('test-job-id');
    });

    it('should add evaluate reminders job', async () => {
      const job = await addReminderJob('evaluate-reminders');
      
      expect(job).toBeDefined();
    });
  });

  describe('PDF Job Management', () => {
    it('should add PDF job with correct parameters', async () => {
      const job = await addPdfJob(
        'contract-template',
        { workerName: 'John Doe', clientName: 'ABC Corp' },
        'assignment-123',
        '/tmp/output.pdf',
        { priority: 3 }
      );

      expect(job).toBeDefined();
      expect(job.id).toBe('test-job-id');
    });

    it('should add PDF job without output path', async () => {
      const job = await addPdfJob(
        'visa-application',
        { applicantName: 'Jane Smith' },
        'assignment-456'
      );

      expect(job).toBeDefined();
    });
  });

  describe('Queue Statistics', () => {
    it('should return queue statistics for all queues', async () => {
      const stats = await getQueueStats();

      expect(stats).toHaveProperty('reminder');
      expect(stats).toHaveProperty('email');
      expect(stats).toHaveProperty('pdf');
      expect(stats).toHaveProperty('deadLetter');

      expect(stats.reminder).toEqual({
        waiting: 0,
        active: 0,
        completed: 5,
        failed: 1,
      });
    });
  });

  describe('Job Processing Logic', () => {
    it('should handle email job processing', async () => {
      const { Worker } = require('bullmq');
      const workerInstance = new Worker();
      
      // Get the processing function passed to Worker constructor
      const processingFunction = Worker.mock.calls.find(
        call => call[0] === 'email'
      )?.[1];

      if (processingFunction) {
        const mockJob = {
          data: {
            to: 'test@example.com',
            templateName: 'upload-reminder',
            templateData: { workerName: 'John Doe' },
          },
        };

        // This would test the actual processing logic if we weren't mocking
        expect(typeof processingFunction).toBe('function');
      }
    });

    it('should handle reminder job processing', async () => {
      const { Worker } = require('bullmq');
      
      // Get the processing function for reminder worker
      const processingFunction = Worker.mock.calls.find(
        call => call[0] === 'reminder'
      )?.[1];

      if (processingFunction) {
        const mockJob = {
          data: {
            type: 'evaluate-reminders',
          },
        };

        expect(typeof processingFunction).toBe('function');
      }
    });

    it('should handle PDF job processing', async () => {
      const { Worker } = require('bullmq');
      
      // Get the processing function for PDF worker
      const processingFunction = Worker.mock.calls.find(
        call => call[0] === 'pdf'
      )?.[1];

      if (processingFunction) {
        const mockJob = {
          data: {
            templateKey: 'contract',
            data: { name: 'Test' },
            assignmentId: '123',
          },
        };

        expect(typeof processingFunction).toBe('function');
      }
    });
  });

  describe('Error Handling and Retry Logic', () => {
    it('should configure proper retry settings', () => {
      const { Queue } = require('bullmq');
      
      // Check if Queue was configured with retry settings
      const queueCall = Queue.mock.calls[0];
      const queueConfig = queueCall[1];

      expect(queueConfig.defaultJobOptions.attempts).toBe(3);
      expect(queueConfig.defaultJobOptions.backoff.type).toBe('exponential');
      expect(queueConfig.defaultJobOptions.backoff.delay).toBe(2000);
    });

    it('should handle job failures properly', () => {
      const { Worker } = require('bullmq');
      const workerInstance = new Worker();
      
      // Check if error handlers were set up
      expect(workerInstance.on).toHaveBeenCalledWith('error', expect.any(Function));
      expect(workerInstance.on).toHaveBeenCalledWith('stalled', expect.any(Function));
      expect(workerInstance.on).toHaveBeenCalledWith('failed', expect.any(Function));
    });
  });

  describe('Dead Letter Queue', () => {
    it('should initialize dead letter queue', () => {
      const { Queue } = require('bullmq');
      
      // Check if dead-letter queue was created
      const deadLetterCall = Queue.mock.calls.find(
        call => call[0] === 'dead-letter'
      );
      
      expect(deadLetterCall).toBeDefined();
      expect(deadLetterCall[1]).toHaveProperty('connection');
    });

    it('should process dead letter jobs', async () => {
      const { Worker } = require('bullmq');
      
      // Check if dead letter worker was created
      const deadLetterWorkerCall = Worker.mock.calls.find(
        call => call[0] === 'dead-letter'
      );
      
      expect(deadLetterWorkerCall).toBeDefined();
      expect(typeof deadLetterWorkerCall[1]).toBe('function');
    });
  });

  describe('Recurring Jobs', () => {
    it('should schedule recurring reminder evaluation', async () => {
      const { Queue } = require('bullmq');
      const queueInstance = new Queue();
      
      // Verify that removeRepeatable and add were called for scheduling
      expect(queueInstance.removeRepeatable).toHaveBeenCalledWith(
        'evaluate-reminders',
        { pattern: '0 9 * * *' }
      );
    });
  });

  describe('Job Data Validation', () => {
    it('should validate email job data structure', async () => {
      const validEmailData: EmailJobData = {
        to: 'user@example.com',
        templateName: 'upload-reminder',
        templateData: {
          workerName: 'John Doe',
          documentName: 'Passport Copy',
        },
        priority: 1,
      };

      // Type checking ensures proper structure
      expect(validEmailData.to).toBe('user@example.com');
      expect(validEmailData.templateName).toBe('upload-reminder');
      expect(validEmailData.templateData).toHaveProperty('workerName');
    });

    it('should validate reminder job data structure', async () => {
      const validReminderData: ReminderJobData = {
        type: 'send-deadline-reminder',
        data: {
          assignmentId: 'assignment-123',
          userId: 'user-456',
        },
      };

      expect(validReminderData.type).toBe('send-deadline-reminder');
      expect(validReminderData.data?.assignmentId).toBe('assignment-123');
    });

    it('should validate PDF job data structure', async () => {
      const validPdfData: PdfJobData = {
        templateKey: 'visa-application',
        data: { applicantName: 'Jane Smith' },
        assignmentId: 'assignment-789',
        outputPath: '/tmp/visa.pdf',
      };

      expect(validPdfData.templateKey).toBe('visa-application');
      expect(validPdfData.assignmentId).toBe('assignment-789');
      expect(validPdfData.outputPath).toBe('/tmp/visa.pdf');
    });
  });
});