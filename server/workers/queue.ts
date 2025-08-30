import { Queue, Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { reminderService } from '../services/reminderService';
import { emailService } from '../services/emailService';

if (!process.env.REDIS_URL) {
  throw new Error('REDIS_URL environment variable is required');
}

const connection = new IORedis(process.env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  lazyConnect: true,
});

// Queue configuration with retry and backoff settings
const defaultQueueSettings = {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: 100, // Keep last 100 successful jobs
    removeOnFail: 50, // Keep last 50 failed jobs
  },
};

// Create queues
export const reminderQueue = new Queue('reminder', defaultQueueSettings);
export const emailQueue = new Queue('email', defaultQueueSettings);
export const pdfQueue = new Queue('pdf', defaultQueueSettings);

// Dead letter queue for failed jobs
export const deadLetterQueue = new Queue('dead-letter', {
  connection,
  defaultJobOptions: {
    removeOnComplete: 1000, // Keep more dead letter jobs for analysis
    removeOnFail: 1000,
  },
});

// Enhanced job interfaces
export interface ReminderJobData {
  type: 'evaluate-reminders' | 'send-deadline-reminder' | 'send-expiry-reminder';
  data?: {
    assignmentId?: string;
    documentId?: string;
    userId?: string;
  };
}

export interface EmailJobData {
  to: string;
  templateName: string;
  templateData: any;
  priority?: number;
}

export interface PdfJobData {
  templateKey: string;
  data: any;
  assignmentId: string;
  outputPath?: string;
}

// Enhanced error handling and logging
function logJobError(job: Job, error: Error) {
  console.error(`Job ${job.name} failed:`, {
    id: job.id,
    name: job.name,
    data: job.data,
    error: error.message,
    stack: error.stack,
    attemptsMade: job.attemptsMade,
    attemptsLeft: (job.opts.attempts || 1) - job.attemptsMade,
  });
}

function logJobSuccess(job: Job) {
  console.log(`Job ${job.name} completed successfully:`, {
    id: job.id,
    name: job.name,
    processedOn: new Date(job.processedOn || Date.now()).toISOString(),
    duration: job.finishedOn ? job.finishedOn - (job.processedOn || 0) : 0,
  });
}

// Setup workers with enhanced error handling and retries
export function setupWorkers() {
  // Enhanced reminder worker
  const reminderWorker = new Worker<ReminderJobData>(
    'reminder',
    async (job) => {
      const { type, data } = job.data;
      
      try {
        switch (type) {
          case 'evaluate-reminders':
            await reminderService.evaluateReminders();
            break;
          case 'send-deadline-reminder':
            if (!data?.assignmentId || !data?.userId) {
              throw new Error('Missing assignmentId or userId for deadline reminder');
            }
            // await reminderService.sendDeadlineReminder(data.assignmentId, data.userId);
            console.log('Deadline reminder:', data.assignmentId, data.userId);
            break;
          case 'send-expiry-reminder':
            if (!data?.documentId || !data?.userId) {
              throw new Error('Missing documentId or userId for expiry reminder');
            }
            // await reminderService.sendExpiryReminder(data.documentId, data.userId);
            console.log('Expiry reminder:', data.documentId, data.userId);
            break;
          default:
            throw new Error(`Unknown reminder job type: ${type}`);
        }
        
        logJobSuccess(job);
      } catch (error) {
        logJobError(job, error as Error);
        throw error; // Re-throw to trigger retry mechanism
      }
    },
    {
      connection,
      concurrency: 5, // Process up to 5 jobs concurrently
      // BullMQ worker options
    }
  );

  // Enhanced email worker
  const emailWorker = new Worker<EmailJobData>(
    'email',
    async (job) => {
      const { to, templateName, templateData } = job.data;
      
      try {
        let template;
        
        // Get the appropriate template
        switch (templateName) {
          case 'upload-reminder':
            template = emailService.getUploadReminderTemplate();
            break;
          case 'status-changed':
            template = emailService.getStatusChangedTemplate();
            break;
          case 'document-approved':
            template = emailService.getDocumentApprovedTemplate();
            break;
          case 'document-rejected':
            template = emailService.getDocumentRejectedTemplate();
            break;
          case 'stage-moved':
            template = emailService.getStageMovedTemplate();
            break;
          case 'deadline-reminder':
            template = emailService.getDeadlineReminderTemplate();
            break;
          case 'expiry-reminder':
            template = emailService.getExpiryReminderTemplate();
            break;
          default:
            throw new Error(`Unknown email template: ${templateName}`);
        }
        
        const success = await emailService.sendEmail(to, template, templateData);
        
        if (!success) {
          throw new Error('Email service returned false');
        }
        
        logJobSuccess(job);
      } catch (error) {
        logJobError(job, error as Error);
        throw error; // Re-throw to trigger retry mechanism
      }
    },
    {
      connection,
      concurrency: 10, // Process up to 10 email jobs concurrently
      // BullMQ worker options
    }
  );

  // Enhanced PDF worker
  const pdfWorker = new Worker<PdfJobData>(
    'pdf',
    async (job) => {
      const { templateKey, data, assignmentId, outputPath } = job.data;
      
      try {
        // PDF generation would be handled here
        console.log(`Generating PDF for template ${templateKey}, assignment ${assignmentId}`);
        
        // Simulate PDF generation process
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        if (outputPath) {
          console.log(`PDF saved to: ${outputPath}`);
        }
        
        logJobSuccess(job);
      } catch (error) {
        logJobError(job, error as Error);
        throw error;
      }
    },
    {
      connection,
      concurrency: 3, // Limit PDF generation concurrency
      // BullMQ worker options
    }
  );

  // Dead letter queue worker - handles jobs that have failed all retries
  const deadLetterWorker = new Worker(
    'dead-letter',
    async (job) => {
      console.error('Processing dead letter job:', {
        originalQueue: job.data.originalQueue,
        originalJobId: job.data.originalJobId,
        originalData: job.data.originalData,
        failureReason: job.data.failureReason,
        timestamp: new Date().toISOString(),
      });
      
      // Here you could:
      // 1. Send alerts to administrators
      // 2. Log to external monitoring systems
      // 3. Attempt manual recovery
      // 4. Store in database for later analysis
      
      // For now, just log and mark as processed
      console.log('Dead letter job logged for manual review');
    },
    {
      connection,
      concurrency: 1, // Process one at a time for careful handling
    }
  );

  // Set up error handlers for all workers
  const workers = [reminderWorker, emailWorker, pdfWorker, deadLetterWorker];
  
  workers.forEach((worker) => {
    worker.on('error', (error) => {
      console.error(`Worker ${worker.name} error:`, error);
    });
    
    worker.on('stalled', (jobId) => {
      console.warn(`Job ${jobId} in worker ${worker.name} stalled`);
    });
    
    worker.on('failed', async (job, err) => {
      if (job && job.attemptsMade >= (job.opts.attempts || 1)) {
        // Job has failed all retries, send to dead letter queue
        await deadLetterQueue.add('failed-job', {
          originalQueue: worker.name,
          originalJobId: job.id,
          originalData: job.data,
          failureReason: err.message,
          failedAt: new Date().toISOString(),
        });
      }
    });
  });

  // Schedule recurring jobs
  scheduleRecurringJobs();

  console.log('Enhanced workers setup completed with retry mechanisms and dead letter queue');

  return { reminderWorker, emailWorker, pdfWorker, deadLetterWorker };
}

// Schedule recurring reminder evaluation
async function scheduleRecurringJobs() {
  // Remove existing recurring job if it exists
  try {
    await reminderQueue.removeRepeatable('evaluate-reminders', {
      pattern: '0 9 * * *',
    });
  } catch (error) {
    // Job might not exist, ignore error
  }

  // Schedule daily reminder evaluation
  await reminderQueue.add(
    'evaluate-reminders',
    { type: 'evaluate-reminders' },
    {
      repeat: { pattern: '0 9 * * *' }, // Daily at 9 AM
      jobId: 'daily-reminder-evaluation',
    }
  );

  console.log('Recurring jobs scheduled');
}

// Utility functions for adding jobs with proper typing
export async function addEmailJob(
  to: string,
  templateName: string,
  templateData: any,
  options: { priority?: number; delay?: number } = {}
): Promise<Job<EmailJobData>> {
  return emailQueue.add(
    'send-email',
    {
      to,
      templateName,
      templateData,
      priority: options.priority || 0,
    },
    {
      priority: options.priority || 0,
      delay: options.delay || 0,
    }
  );
}

export async function addReminderJob(
  type: ReminderJobData['type'],
  data?: ReminderJobData['data'],
  options: { delay?: number } = {}
): Promise<Job<ReminderJobData>> {
  return reminderQueue.add(
    type,
    { type, data },
    {
      delay: options.delay || 0,
    }
  );
}

export async function addPdfJob(
  templateKey: string,
  data: any,
  assignmentId: string,
  outputPath?: string,
  options: { priority?: number } = {}
): Promise<Job<PdfJobData>> {
  return pdfQueue.add(
    'generate-pdf',
    {
      templateKey,
      data,
      assignmentId,
      outputPath,
    },
    {
      priority: options.priority || 0,
    }
  );
}

// Queue monitoring functions
export async function getQueueStats() {
  const [reminderStats, emailStats, pdfStats, deadLetterStats] = await Promise.all([
    reminderQueue.getJobCounts('waiting', 'active', 'completed', 'failed'),
    emailQueue.getJobCounts('waiting', 'active', 'completed', 'failed'),
    pdfQueue.getJobCounts('waiting', 'active', 'completed', 'failed'),
    deadLetterQueue.getJobCounts('waiting', 'active', 'completed', 'failed'),
  ]);

  return {
    reminder: reminderStats,
    email: emailStats,
    pdf: pdfStats,
    deadLetter: deadLetterStats,
  };
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Shutting down queue workers...');
  await connection.quit();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('Shutting down queue workers...');
  await connection.quit();
  process.exit(0);
});