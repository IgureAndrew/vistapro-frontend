const express = require('express');
const { fixWorkflowLogsSchema } = require('./fix_workflow_logs_schema');

const app = express();

app.get('/api/migration/fix-workflow-logs-schema', async (req, res) => {
  try {
    console.log('🔄 Starting verification_workflow_logs schema migration...');
    
    await fixWorkflowLogsSchema();
    
    res.json({
      success: true,
      message: 'verification_workflow_logs table schema updated successfully',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    res.status(500).json({
      success: false,
      message: 'Migration failed',
      error: error.message
    });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Migration server running on port ${PORT}`);
  console.log(`Access: http://localhost:${PORT}/api/migration/fix-workflow-logs-schema`);
});
