import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import { reminderService } from '../services/reminderService';

if (!process.env.REDIS_URL) {
  throw new Error('REDIS_URL environment variable is required');
}

const connection = new IORedis(process.env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  lazyConnect: true,
});

// Create queues
export const reminderQueue = new Queue('reminder', { connection });
export const emailQueue = new Queue('email', { connection });
export const pdfQueue = new Queue('pdf', { connection });

// Setup workers
export function setupWorkers() {
  // Reminder worker
  const reminderWorker = new Worker(
    'reminder',
    async (job) => {
      const { type, data } = job.data;
      
      switch (type) {
        case 'evaluate-reminders':
          await reminderService.evaluateReminders();
          break;
        case 'send-deadline-reminder':
          // await reminderService.sendDeadlineReminder(data.assignmentId, data.userId);
          console.log('Deadline reminder:', data.assignmentId, data.userId);
          break;
        case 'send-expiry-reminder':
          // await reminderService.sendExpiryReminder(data.documentId, data.userId);
          console.log('Expiry reminder:', data.documentId, data.userId);
          break;
        default:
          throw new Error(`Unknown reminder job type: ${type}`);
      }
    },
    { connection }
  );

  // Email worker
  const emailWorker = new Worker(
    'email',
    async (job) => {
      const { to, subject, content, template } = job.data;
      // await reminderService.sendEmail(to, subject, content, template);
      console.log('Sending email:', { to, subject, template });
    },
    { connection }
  );

  // PDF worker
  const pdfWorker = new Worker(
    'pdf',
    async (job) => {
      const { templateKey, data, assignmentId } = job.data;
      // PDF generation would be handled here
      console.log(`Generating PDF for template ${templateKey}, assignment ${assignmentId}`);
    },
    { connection }
  );

  // Schedule recurring reminder evaluation
  reminderQueue.add(
    'evaluate-reminders',
    { type: 'evaluate-reminders' },
    {
      repeat: { cron: '0 9 * * *' }, // Daily at 9 AM
      jobId: 'daily-reminder-evaluation',
    }
  );

  console.log('Workers setup completed');

  return { reminderWorker, emailWorker, pdfWorker };
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  await connection.quit();
  process.exit(0);
});
