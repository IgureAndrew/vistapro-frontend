const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function addMissingWorkflowColumns() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Adding missing columns to verification_workflow_logs...');
    
    // Add the missing columns one by one
    const columnsToAdd = [
      'action_by INTEGER',
      'action_by_role VARCHAR(50)',
      'action_type VARCHAR(50)',
      'action_description TEXT',
      'previous_status VARCHAR(50)',
      'new_status VARCHAR(50)'
    ];
    
    for (const column of columnsToAdd) {
      try {
        const columnName = column.split(' ')[0];
        console.log(`🔄 Adding column: ${columnName}`);
        
        await client.query(`ALTER TABLE verification_workflow_logs ADD COLUMN IF NOT EXISTS ${column};`);
        console.log(`✅ Added column: ${columnName}`);
      } catch (error) {
        if (error.code === '42701') {
          console.log(`⏭️ Column already exists: ${column.split(' ')[0]}`);
        } else {
          console.log(`❌ Error adding column ${column.split(' ')[0]}:`, error.message);
        }
      }
    }
    
    // Check final table structure
    const tableInfo = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'verification_workflow_logs' 
      AND table_schema = 'public'
      ORDER BY ordinal_position;
    `);
    
    console.log('📋 Final table structure:');
    tableInfo.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });
    
    // Add foreign key constraints
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
    
    // Create indexes
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
    
    console.log('🎉 Missing columns added successfully!');
    
  } catch (error) {
    console.error('❌ Error adding missing columns:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run the migration
if (require.main === module) {
  addMissingWorkflowColumns()
    .then(() => {
      console.log('✅ Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { addMissingWorkflowColumns };
