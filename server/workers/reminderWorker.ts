import { setupWorkers } from './queue';

async function startWorkers() {
  try {
    const workers = setupWorkers();
    
    workers.reminderWorker.on('completed', (job) => {
      console.log(`Reminder job completed: ${job.id}`);
    });

    workers.reminderWorker.on('failed', (job, err) => {
      console.error(`Reminder job failed: ${job?.id}`, err);
    });

    workers.emailWorker.on('completed', (job) => {
      console.log(`Email job completed: ${job.id}`);
    });

    workers.emailWorker.on('failed', (job, err) => {
      console.error(`Email job failed: ${job?.id}`, err);
    });

    console.log('Reminder workers started successfully');
  } catch (error) {
    console.error('Failed to start workers:', error);
    process.exit(1);
  }
}

// Start workers if this file is run directly
if (require.main === module) {
  startWorkers();
}

export { startWorkers };
