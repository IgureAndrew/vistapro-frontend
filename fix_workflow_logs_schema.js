const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function fixWorkflowLogsSchema() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking current verification_workflow_logs table structure...');
    
    // Check current table structure
    const tableInfo = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'verification_workflow_logs' 
      AND table_schema = 'public'
      ORDER BY ordinal_position;
    `);
    
    console.log('Current columns:', tableInfo.rows.map(row => row.column_name));
    
    // Check if new columns exist
    const hasNewColumns = tableInfo.rows.some(row => 
      ['verification_submission_id', 'action_by', 'action_by_role', 'action_type'].includes(row.column_name)
    );
    
    if (hasNewColumns) {
      console.log('✅ Table already has new schema columns');
      return;
    }
    
    console.log('🔄 Updating verification_workflow_logs table schema...');
    
    // Step 1: Add new columns
    await client.query(`
      ALTER TABLE verification_workflow_logs 
      ADD COLUMN IF NOT EXISTS verification_submission_id INTEGER,
      ADD COLUMN IF NOT EXISTS action_by INTEGER,
      ADD COLUMN IF NOT EXISTS action_by_role VARCHAR(50),
      ADD COLUMN IF NOT EXISTS action_type VARCHAR(50),
      ADD COLUMN IF NOT EXISTS action_description TEXT,
      ADD COLUMN IF NOT EXISTS previous_status VARCHAR(50),
      ADD COLUMN IF NOT EXISTS new_status VARCHAR(50)
    `);
    
    console.log('✅ Added new columns');
    
    // Step 2: Migrate existing data (if any)
    const existingData = await client.query('SELECT COUNT(*) as count FROM verification_workflow_logs');
    console.log(`Found ${existingData.rows[0].count} existing records`);
    
    if (parseInt(existingData.rows[0].count) > 0) {
      console.log('🔄 Migrating existing data...');
      
      // Update existing records to use new schema
      await client.query(`
        UPDATE verification_workflow_logs 
        SET 
          action_by = CASE 
            WHEN admin_id IS NOT NULL THEN admin_id
            WHEN super_admin_id IS NOT NULL THEN super_admin_id
            WHEN master_admin_id IS NOT NULL THEN master_admin_id
            ELSE marketer_id
          END,
          action_by_role = CASE 
            WHEN admin_id IS NOT NULL THEN 'Admin'
            WHEN super_admin_id IS NOT NULL THEN 'SuperAdmin'
            WHEN master_admin_id IS NOT NULL THEN 'MasterAdmin'
            ELSE 'Marketer'
          END,
          action_type = action,
          action_description = notes,
          new_status = status
        WHERE action_by IS NULL
      `);
      
      console.log('✅ Migrated existing data');
    }
    
    // Step 3: Add foreign key constraints for new columns
    try {
      await client.query(`
        ALTER TABLE verification_workflow_logs 
        ADD CONSTRAINT fk_workflow_verification_submission 
        FOREIGN KEY (verification_submission_id) REFERENCES verification_submissions(id) ON DELETE CASCADE
      `);
      console.log('✅ Added verification_submission_id foreign key');
    } catch (error) {
      if (error.code === '42710') {
        console.log('✅ Foreign key already exists');
      } else {
        console.log('⚠️ Could not add verification_submission_id foreign key:', error.message);
      }
    }
    
    try {
      await client.query(`
        ALTER TABLE verification_workflow_logs 
        ADD CONSTRAINT fk_workflow_action_by 
        FOREIGN KEY (action_by) REFERENCES users(id)
      `);
      console.log('✅ Added action_by foreign key');
    } catch (error) {
      if (error.code === '42710') {
        console.log('✅ Foreign key already exists');
      } else {
        console.log('⚠️ Could not add action_by foreign key:', error.message);
      }
    }
    
    // Step 4: Create indexes for new columns
    try {
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_workflow_submission 
        ON verification_workflow_logs(verification_submission_id)
      `);
      console.log('✅ Added verification_submission_id index');
    } catch (error) {
      console.log('⚠️ Could not add index:', error.message);
    }
    
    try {
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_workflow_action_by 
        ON verification_workflow_logs(action_by)
      `);
      console.log('✅ Added action_by index');
    } catch (error) {
      console.log('⚠️ Could not add index:', error.message);
    }
    
    try {
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_workflow_action_type 
        ON verification_workflow_logs(action_type)
      `);
      console.log('✅ Added action_type index');
    } catch (error) {
      console.log('⚠️ Could not add index:', error.message);
    }
    
    console.log('🎉 verification_workflow_logs table schema updated successfully!');
    
  } catch (error) {
    console.error('❌ Error updating verification_workflow_logs schema:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run the migration
if (require.main === module) {
  fixWorkflowLogsSchema()
    .then(() => {
      console.log('✅ Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { fixWorkflowLogsSchema };
