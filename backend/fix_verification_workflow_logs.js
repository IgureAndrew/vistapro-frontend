const { Pool } = require('pg');
require('dotenv').config();

// Database configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function fixVerificationWorkflowLogs() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking verification_workflow_logs table structure...');
    
    // Check current table structure
    const tableInfo = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'verification_workflow_logs' 
      AND table_schema = 'public'
      ORDER BY ordinal_position;
    `);
    
    console.log('📋 Current table structure:');
    tableInfo.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });
    
    // Check if verification_submission_id column exists
    const hasVerificationSubmissionId = tableInfo.rows.some(row => row.column_name === 'verification_submission_id');
    
    if (hasVerificationSubmissionId) {
      console.log('✅ verification_submission_id column already exists');
      return;
    }
    
    console.log('🔄 Adding verification_submission_id column...');
    
    // Add the missing column
    await client.query(`
      ALTER TABLE verification_workflow_logs 
      ADD COLUMN verification_submission_id INTEGER;
    `);
    
    console.log('✅ Added verification_submission_id column');
    
    // Check if we need to populate the column with data
    const countResult = await client.query('SELECT COUNT(*) FROM verification_workflow_logs');
    const totalRows = parseInt(countResult.rows[0].count);
    
    if (totalRows > 0) {
      console.log(`🔄 Found ${totalRows} existing rows, attempting to populate verification_submission_id...`);
      
      // Try to populate the column by matching with verification_submissions table
      // This is a best-effort approach since the old structure used marketer_id
      const updateResult = await client.query(`
        UPDATE verification_workflow_logs 
        SET verification_submission_id = vs.id
        FROM verification_submissions vs
        WHERE verification_workflow_logs.marketer_id = vs.marketer_id
        AND verification_workflow_logs.verification_submission_id IS NULL;
      `);
      
      console.log(`✅ Updated ${updateResult.rowCount} rows with verification_submission_id`);
    }
    
    // Make the column NOT NULL if we have data
    if (totalRows > 0) {
      console.log('🔄 Making verification_submission_id NOT NULL...');
      await client.query(`
        ALTER TABLE verification_workflow_logs 
        ALTER COLUMN verification_submission_id SET NOT NULL;
      `);
      console.log('✅ Made verification_submission_id NOT NULL');
    }
    
    // Add foreign key constraint
    console.log('🔄 Adding foreign key constraint...');
    await client.query(`
      ALTER TABLE verification_workflow_logs 
      ADD CONSTRAINT fk_workflow_verification_submission 
      FOREIGN KEY (verification_submission_id) REFERENCES verification_submissions(id) ON DELETE CASCADE;
    `);
    console.log('✅ Added foreign key constraint');
    
    // Add index
    console.log('🔄 Adding index...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_workflow_submission 
      ON verification_workflow_logs(verification_submission_id);
    `);
    console.log('✅ Added index');
    
    console.log('🎉 verification_workflow_logs table structure fixed successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing verification_workflow_logs table:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run the migration
fixVerificationWorkflowLogs()
  .then(() => {
    console.log('✅ Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  });
