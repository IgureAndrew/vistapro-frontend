const { pool } = require('./src/config/database');

async function runMigration() {
  try {
    console.log('🔄 Running verification_submissions table migration...');
    
    // Check if table exists
    const checkTable = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'verification_submissions'
      );
    `);
    
    if (checkTable.rows[0].exists) {
      console.log('✅ verification_submissions table already exists');
      return;
    }
    
    // Create the table
    const createTable = await pool.query(`
      CREATE TABLE IF NOT EXISTS verification_submissions (
        id SERIAL PRIMARY KEY,
        marketer_id INTEGER NOT NULL,
        admin_id INTEGER NOT NULL,
        super_admin_id INTEGER NOT NULL,
        submission_status VARCHAR(50) NOT NULL DEFAULT 'pending_admin_review',
        -- Status values: pending_admin_review, admin_verified, pending_superadmin_review, 
        -- superadmin_verified, pending_masteradmin_approval, approved, rejected
        
        -- Timestamps for each stage
        admin_reviewed_at TIMESTAMP,
        superadmin_reviewed_at TIMESTAMP,
        masteradmin_approved_at TIMESTAMP,
        
        -- Rejection details
        rejection_reason TEXT,
        rejected_by VARCHAR(50), -- admin, superadmin, masteradmin
        rejected_at TIMESTAMP,
        
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    console.log('✅ Created verification_submissions table');
    
    // Add foreign key constraints
    await pool.query(`
      ALTER TABLE verification_submissions 
      ADD CONSTRAINT fk_verification_marketer 
      FOREIGN KEY (marketer_id) REFERENCES users(id);
    `);
    
    await pool.query(`
      ALTER TABLE verification_submissions 
      ADD CONSTRAINT fk_verification_admin 
      FOREIGN KEY (admin_id) REFERENCES users(id);
    `);
    
    await pool.query(`
      ALTER TABLE verification_submissions 
      ADD CONSTRAINT fk_verification_superadmin 
      FOREIGN KEY (super_admin_id) REFERENCES users(id);
    `);
    
    console.log('✅ Added foreign key constraints');
    
    // Create indexes for better performance
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_verification_submissions_marketer ON verification_submissions(marketer_id);
    `);
    
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_verification_submissions_admin ON verification_submissions(admin_id);
    `);
    
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_verification_submissions_superadmin ON verification_submissions(super_admin_id);
    `);
    
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_verification_submissions_status ON verification_submissions(submission_status);
    `);
    
    console.log('✅ Created indexes');
    console.log('🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

runMigration();
