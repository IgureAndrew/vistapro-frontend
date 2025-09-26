// backend/src/jobs/refreshSummary.js
const cron = require('node-cron');
const { pool } = require('../config/database');

// Function to refresh daily sales summary
async function refreshSummary() {
  try {
    // This would contain the logic to refresh daily sales summary
    // For now, just log that it's running
    console.log('Refreshing daily sales summary...');
    
    // Add your refresh logic here when needed
    // Example: await pool.query('REFRESH MATERIALIZED VIEW daily_sales_summary;');
    
    return true;
  } catch (error) {
    console.error('Error refreshing summary:', error);
    throw error;
  }
}

cron.schedule('0 2 * * *', async () => {
  try {
    await refreshSummary();
    console.log('daily_sales_summary refreshed at 2am');
  } catch (err) {
    console.error('refresh failed', err);
  }
});
