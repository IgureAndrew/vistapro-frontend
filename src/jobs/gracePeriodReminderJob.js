// Grace Period Reminder Cron Job
// Runs daily to send automated email reminders to users
const cron = require('node-cron');
const { runAllScheduledReminders } = require('../services/gracePeriodReminderService');

/**
 * Schedule: Run daily at 9:00 AM (server time)
 * Cron expression: '0 9 * * *'
 * - minute: 0
 * - hour: 9
 * - day of month: *
 * - month: *
 * - day of week: *
 */
function startGracePeriodReminderJob() {
  // Run daily at 9:00 AM
  const job = cron.schedule('0 9 * * *', async () => {
    console.log('\n⏰ Grace Period Reminder Job Started');
    console.log(`Time: ${new Date().toISOString()}`);
    
    try {
      await runAllScheduledReminders();
      console.log('✅ Grace Period Reminder Job Completed Successfully\n');
    } catch (error) {
      console.error('❌ Grace Period Reminder Job Failed:', error);
    }
  });

  console.log('✅ Grace Period Reminder Job Scheduled (Daily at 9:00 AM)');
  
  // Optionally run immediately on startup for testing
  if (process.env.RUN_REMINDERS_ON_STARTUP === 'true') {
    console.log('🔄 Running grace period reminders on startup...');
    runAllScheduledReminders().catch(error => {
      console.error('Error running reminders on startup:', error);
    });
  }

  return job;
}

/**
 * Manual trigger for testing
 */
async function runReminderJobManually() {
  console.log('🔧 Manually triggering grace period reminders...');
  try {
    const results = await runAllScheduledReminders();
    console.log('✅ Manual reminder job completed:', results);
    return results;
  } catch (error) {
    console.error('❌ Manual reminder job failed:', error);
    throw error;
  }
}

module.exports = {
  startGracePeriodReminderJob,
  runReminderJobManually
};
