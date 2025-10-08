const express = require('express');
const { Pool } = require('pg');
const router = express.Router();

// Production migration endpoint
router.post('/guarantor-structure', async (req, res) => {
  try {
    console.log('🔍 Starting production guarantor structure migration...');
    
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      }
    });
    
    // Step 1: Add missing columns
    const columnsToAdd = [
      'means_of_identification TEXT',
      'guarantor_full_name TEXT',
      'guarantor_email TEXT',
      'guarantor_phone TEXT',
      'guarantor_home_address TEXT',
      'guarantor_office_address TEXT',
      'candidate_name TEXT'
    ];
    
    const results = [];
    
    for (const column of columnsToAdd) {
      try {
        await pool.query(`ALTER TABLE marketer_guarantor_form ADD COLUMN IF NOT EXISTS ${column};`);
        results.push(`✅ Added column: ${column.split(' ')[0]}`);
        console.log(`✅ Added column: ${column.split(' ')[0]}`);
      } catch (error) {
        if (error.code === '42701') {
          results.push(`⏭️ Column already exists: ${column.split(' ')[0]}`);
          console.log(`⏭️ Column already exists: ${column.split(' ')[0]}`);
        } else {
          results.push(`❌ Error adding column ${column.split(' ')[0]}: ${error.message}`);
          console.log(`❌ Error adding column ${column.split(' ')[0]}:`, error.message);
        }
      }
    }
    
    // Step 2: Check existing data
    const countResult = await pool.query('SELECT COUNT(*) as count FROM marketer_guarantor_form;');
    console.log('📊 Total guarantor records:', countResult.rows[0].count);
    
    let dataInfo = [];
    if (parseInt(countResult.rows[0].count) > 0) {
      const dataResult = await pool.query(`
        SELECT 
          id, marketer_id, is_candidate_well_known, relationship, known_duration, occupation,
          means_of_identification, guarantor_full_name, guarantor_email, guarantor_phone,
          guarantor_home_address, guarantor_office_address, candidate_name
        FROM marketer_guarantor_form 
        ORDER BY created_at DESC
        LIMIT 5;
      `);
      
      dataInfo = dataResult.rows.map((row, index) => ({
        record: index + 1,
        id: row.id,
        marketer_id: row.marketer_id,
        is_candidate_well_known: row.is_candidate_well_known,
        relationship: row.relationship,
        known_duration: row.known_duration,
        occupation: row.occupation,
        means_of_identification: row.means_of_identification,
        guarantor_full_name: row.guarantor_full_name,
        guarantor_email: row.guarantor_email,
        guarantor_phone: row.guarantor_phone,
        guarantor_home_address: row.guarantor_home_address,
        guarantor_office_address: row.guarantor_office_address,
        candidate_name: row.candidate_name
      }));
    }
    
    await pool.end();
    
    console.log('✅ Production migration completed successfully!');
    
    res.json({
      success: true,
      message: 'Guarantor structure migration completed successfully!',
      results: results,
      totalRecords: parseInt(countResult.rows[0].count),
      sampleData: dataInfo
    });
    
  } catch (error) {
    console.error('❌ Production migration error:', error);
    res.status(500).json({
      success: false,
      message: 'Migration failed',
      error: error.message
    });
  }
});

// Check Bayo Lawal's data endpoint
router.get('/check-bayo-data', async (req, res) => {
  try {
    console.log('🔍 Checking Bayo Lawal guarantor data in production...');
    
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      }
    });
    
    // First, find Bayo Lawal's user ID
    const userQuery = `
      SELECT id, unique_id, first_name, last_name, email, role 
      FROM users 
      WHERE first_name ILIKE '%bayo%' OR last_name ILIKE '%lawal%' OR email ILIKE '%bayo%'
      ORDER BY created_at DESC;
    `;
    
    const userResult = await pool.query(userQuery);
    console.log('👤 Found users:', userResult.rows.length);
    
    let userInfo = [];
    if (userResult.rows.length > 0) {
      userInfo = userResult.rows.map((user, index) => ({
        id: user.id,
        unique_id: user.unique_id,
        name: `${user.first_name} ${user.last_name}`,
        email: user.email,
        role: user.role
      }));
      
      // Check guarantor data for each user
      for (const user of userResult.rows) {
        console.log(`\n🔍 Checking guarantor data for ${user.first_name} ${user.last_name} (ID: ${user.id})...`);
        
        const guarantorQuery = `
          SELECT 
            id, marketer_id, is_candidate_well_known, relationship, known_duration, occupation,
            means_of_identification, guarantor_full_name, guarantor_email, guarantor_phone,
            guarantor_home_address, guarantor_office_address, candidate_name,
            id_document_url, passport_photo_url, signature_url,
            created_at, updated_at
          FROM marketer_guarantor_form 
          WHERE marketer_id = $1
          ORDER BY created_at DESC;
        `;
        
        const guarantorResult = await pool.query(guarantorQuery, [user.id]);
        console.log(`📋 Guarantor records found: ${guarantorResult.rows.length}`);
        
        if (guarantorResult.rows.length > 0) {
          user.guarantorData = guarantorResult.rows.map((record, index) => ({
            id: record.id,
            marketer_id: record.marketer_id,
            is_candidate_well_known: record.is_candidate_well_known,
            relationship: record.relationship,
            known_duration: record.known_duration,
            occupation: record.occupation,
            means_of_identification: record.means_of_identification,
            guarantor_full_name: record.guarantor_full_name,
            guarantor_email: record.guarantor_email,
            guarantor_phone: record.guarantor_phone,
            guarantor_home_address: record.guarantor_home_address,
            guarantor_office_address: record.guarantor_office_address,
            candidate_name: record.candidate_name,
            has_id_document: !!record.id_document_url,
            has_passport_photo: !!record.passport_photo_url,
            has_signature: !!record.signature_url,
            created_at: record.created_at,
            updated_at: record.updated_at
          }));
        } else {
          user.guarantorData = [];
        }
      }
    }
    
    // Also check all guarantor records to see what we have
    console.log('\n🔍 Checking all guarantor records in database...');
    const allGuarantorQuery = `
      SELECT 
        mgf.id, mgf.marketer_id, u.first_name, u.last_name, u.email,
        mgf.is_candidate_well_known, mgf.relationship, mgf.known_duration, mgf.occupation,
        mgf.means_of_identification, mgf.guarantor_full_name, mgf.guarantor_email, mgf.guarantor_phone,
        mgf.guarantor_home_address, mgf.guarantor_office_address, mgf.candidate_name,
        mgf.created_at
      FROM marketer_guarantor_form mgf
      JOIN users u ON mgf.marketer_id = u.id
      ORDER BY mgf.created_at DESC
      LIMIT 10;
    `;
    
    const allGuarantorResult = await pool.query(allGuarantorQuery);
    console.log(`📊 Total guarantor records in database: ${allGuarantorResult.rows.length}`);
    
    const allGuarantorData = allGuarantorResult.rows.map((record, index) => ({
      id: record.id,
      marketer: `${record.first_name} ${record.last_name} (${record.email})`,
      is_candidate_well_known: record.is_candidate_well_known,
      relationship: record.relationship,
      known_duration: record.known_duration,
      occupation: record.occupation,
      means_of_identification: record.means_of_identification,
      guarantor_full_name: record.guarantor_full_name,
      guarantor_email: record.guarantor_email,
      guarantor_phone: record.guarantor_phone,
      guarantor_home_address: record.guarantor_home_address,
      guarantor_office_address: record.guarantor_office_address,
      candidate_name: record.candidate_name,
      created_at: record.created_at
    }));
    
    await pool.end();
    
    res.json({
      success: true,
      message: 'Bayo Lawal data check completed',
      users: userInfo,
      totalGuarantorRecords: allGuarantorResult.rows.length,
      allGuarantorData: allGuarantorData
    });
    
  } catch (error) {
    console.error('❌ Error checking Bayo data:', error);
    res.status(500).json({
      success: false,
      message: 'Data check failed',
      error: error.message
    });
  }
});

// Reset Bayo Lawal's guarantor form to allow refill
router.post('/reset-bayo-guarantor', async (req, res) => {
  try {
    console.log('🔄 Resetting Bayo Lawal guarantor form...');
    
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      }
    });
    
    // Find Bayo Lawal's user ID
    const userQuery = `
      SELECT id, unique_id, first_name, last_name, email 
      FROM users 
      WHERE (first_name ILIKE '%bayo%' AND last_name ILIKE '%lawal%') OR email = 'lawal@gmail.com'
      ORDER BY created_at DESC
      LIMIT 1;
    `;
    
    const userResult = await pool.query(userQuery);
    
    if (userResult.rows.length === 0) {
      await pool.end();
      return res.status(404).json({
        success: false,
        message: 'Bayo Lawal not found'
      });
    }
    
    const bayo = userResult.rows[0];
    console.log(`👤 Found Bayo Lawal: ${bayo.first_name} ${bayo.last_name} (ID: ${bayo.id})`);
    
    // Delete existing guarantor form data
    const deleteQuery = `
      DELETE FROM marketer_guarantor_form 
      WHERE marketer_id = $1;
    `;
    
    const deleteResult = await pool.query(deleteQuery, [bayo.id]);
    console.log(`🗑️ Deleted ${deleteResult.rowCount} guarantor form records for Bayo`);
    
    // Update verification status to allow form refill
    const updateStatusQuery = `
      UPDATE users 
      SET overall_verification_status = NULL 
      WHERE id = $1;
    `;
    
    const updateResult = await pool.query(updateStatusQuery, [bayo.id]);
    console.log(`🔄 Updated verification status for Bayo`);
    
    await pool.end();
    
    res.json({
      success: true,
      message: 'Bayo Lawal guarantor form reset successfully!',
      user: {
        id: bayo.id,
        unique_id: bayo.unique_id,
        name: `${bayo.first_name} ${bayo.last_name}`,
        email: bayo.email
      },
      deletedRecords: deleteResult.rowCount,
      statusUpdated: updateResult.rowCount > 0
    });
    
  } catch (error) {
    console.error('❌ Error resetting Bayo guarantor form:', error);
    res.status(500).json({
      success: false,
      message: 'Reset failed',
      error: error.message
    });
  }
});

// Fix verification_workflow_logs table structure
router.post('/fix-workflow-logs', async (req, res) => {
  try {
    console.log('🔍 Starting verification_workflow_logs table fix...');
    
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      }
    });
    
    // Check current table structure
    const tableInfo = await pool.query(`
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
      await pool.end();
      return res.status(200).json({
        success: true,
        message: 'verification_submission_id column already exists',
        tableStructure: tableInfo.rows
      });
    }
    
    console.log('🔄 Adding verification_submission_id column...');
    
    // Add the missing column
    await pool.query(`
      ALTER TABLE verification_workflow_logs 
      ADD COLUMN verification_submission_id INTEGER;
    `);
    
    console.log('✅ Added verification_submission_id column');
    
    // Check if we need to populate the column with data
    const countResult = await pool.query('SELECT COUNT(*) FROM verification_workflow_logs');
    const totalRows = parseInt(countResult.rows[0].count);
    
    let updatedRows = 0;
    if (totalRows > 0) {
      console.log(`🔄 Found ${totalRows} existing rows, attempting to populate verification_submission_id...`);
      
      // Try to populate the column by matching with verification_submissions table
      const updateResult = await pool.query(`
        UPDATE verification_workflow_logs 
        SET verification_submission_id = vs.id
        FROM verification_submissions vs
        WHERE verification_workflow_logs.marketer_id = vs.marketer_id
        AND verification_workflow_logs.verification_submission_id IS NULL;
      `);
      
      updatedRows = updateResult.rowCount;
      console.log(`✅ Updated ${updatedRows} rows with verification_submission_id`);
    }
    
    // Add foreign key constraint
    console.log('🔄 Adding foreign key constraint...');
    await pool.query(`
      ALTER TABLE verification_workflow_logs 
      ADD CONSTRAINT fk_workflow_verification_submission 
      FOREIGN KEY (verification_submission_id) REFERENCES verification_submissions(id) ON DELETE CASCADE;
    `);
    console.log('✅ Added foreign key constraint');
    
    // Add index
    console.log('🔄 Adding index...');
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_workflow_submission 
      ON verification_workflow_logs(verification_submission_id);
    `);
    console.log('✅ Added index');
    
    await pool.end();
    
    res.status(200).json({
      success: true,
      message: 'verification_workflow_logs table structure fixed successfully!',
      changes: {
        addedColumn: 'verification_submission_id',
        updatedRows: updatedRows,
        totalRows: totalRows,
        addedConstraint: 'fk_workflow_verification_submission',
        addedIndex: 'idx_workflow_submission'
      }
    });
    
  } catch (error) {
    console.error('❌ Error fixing verification_workflow_logs table:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fix verification_workflow_logs table structure.', 
      error: error.message 
    });
  }
});

// Fix Bayo Lawal's verification submission
router.post('/fix-bayo-verification', async (req, res) => {
  try {
    console.log('🔍 Fixing Bayo Lawal verification submission...');
    
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      }
    });
    
    // Find Bayo Lawal
    const userQuery = `
      SELECT id, unique_id, first_name, last_name, email, admin_id, super_admin_id
      FROM users 
      WHERE (first_name ILIKE '%bayo%' AND last_name ILIKE '%lawal%') OR email = 'lawal@gmail.com'
      ORDER BY created_at DESC
      LIMIT 1;
    `;
    
    const userResult = await pool.query(userQuery);
    
    if (userResult.rows.length === 0) {
      await pool.end();
      return res.status(404).json({
        success: false,
        message: 'Bayo Lawal not found'
      });
    }
    
    const bayo = userResult.rows[0];
    console.log(`👤 Found Bayo Lawal: ${bayo.first_name} ${bayo.last_name} (ID: ${bayo.id})`);
    console.log(`📋 Admin ID: ${bayo.admin_id}, Super Admin ID: ${bayo.super_admin_id}`);
    
    // Check if verification submission exists
    const submissionQuery = `
      SELECT id, marketer_id, admin_id, super_admin_id, submission_status, created_at
      FROM verification_submissions 
      WHERE marketer_id = $1;
    `;
    
    const submissionResult = await pool.query(submissionQuery, [bayo.id]);
    console.log(`📊 Verification submissions found: ${submissionResult.rows.length}`);
    
    if (submissionResult.rows.length === 0) {
      // Create verification submission
      if (!bayo.admin_id) {
        await pool.end();
        return res.status(400).json({
          success: false,
          message: 'Bayo Lawal has no admin assigned. Cannot create verification submission.',
          user: {
            id: bayo.id,
            unique_id: bayo.unique_id,
            name: `${bayo.first_name} ${bayo.last_name}`,
            email: bayo.email,
            admin_id: bayo.admin_id,
            super_admin_id: bayo.super_admin_id
          }
        });
      }
      
      console.log('🔄 Creating verification submission...');
      const createSubmissionQuery = `
        INSERT INTO verification_submissions (marketer_id, admin_id, super_admin_id, submission_status, created_at, updated_at)
        VALUES ($1, $2, $3, 'pending_marketer_forms', NOW(), NOW())
        RETURNING id;
      `;
      
      const createResult = await pool.query(createSubmissionQuery, [bayo.id, bayo.admin_id, bayo.super_admin_id]);
      console.log(`✅ Created verification submission with ID: ${createResult.rows[0].id}`);
      
      await pool.end();
      
      return res.json({
        success: true,
        message: 'Verification submission created successfully!',
        user: {
          id: bayo.id,
          unique_id: bayo.unique_id,
          name: `${bayo.first_name} ${bayo.last_name}`,
          email: bayo.email,
          admin_id: bayo.admin_id,
          super_admin_id: bayo.super_admin_id
        },
        submission: {
          id: createResult.rows[0].id,
          status: 'pending_marketer_forms'
        }
      });
    } else {
      // Update existing submission
      console.log('🔄 Updating existing verification submission...');
      const updateSubmissionQuery = `
        UPDATE verification_submissions 
        SET admin_id = $2, super_admin_id = $3, updated_at = NOW()
        WHERE marketer_id = $1
        RETURNING id, submission_status;
      `;
      
      const updateResult = await pool.query(updateSubmissionQuery, [bayo.id, bayo.admin_id, bayo.super_admin_id]);
      console.log(`✅ Updated verification submission`);
      
      await pool.end();
      
      return res.json({
        success: true,
        message: 'Verification submission updated successfully!',
        user: {
          id: bayo.id,
          unique_id: bayo.unique_id,
          name: `${bayo.first_name} ${bayo.last_name}`,
          email: bayo.email,
          admin_id: bayo.admin_id,
          super_admin_id: bayo.super_admin_id
        },
        submission: {
          id: updateResult.rows[0].id,
          status: updateResult.rows[0].submission_status
        }
      });
    }
    
  } catch (error) {
    console.error('❌ Error fixing Bayo verification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fix Bayo verification',
      error: error.message
    });
  }
});

// Check Bayo Lawal's complete verification status
router.get('/check-bayo-status', async (req, res) => {
  try {
    console.log('🔍 Checking Bayo Lawal complete verification status...');
    
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      }
    });
    
    // Get complete user information
    const userQuery = `
      SELECT 
        id, unique_id, first_name, last_name, email, role,
        bio_submitted, guarantor_submitted, commitment_submitted,
        overall_verification_status, admin_id, super_admin_id,
        created_at, updated_at
      FROM users 
      WHERE (first_name ILIKE '%bayo%' AND last_name ILIKE '%lawal%') OR email = 'lawal@gmail.com'
      ORDER BY created_at DESC
      LIMIT 1;
    `;
    
    const userResult = await pool.query(userQuery);
    
    if (userResult.rows.length === 0) {
      await pool.end();
      return res.status(404).json({
        success: false,
        message: 'Bayo Lawal not found'
      });
    }
    
    const bayo = userResult.rows[0];
    
    // Check guarantor form submissions
    const guarantorQuery = `
      SELECT 
        id, marketer_id, is_candidate_well_known, relationship, known_duration, occupation,
        means_of_identification, guarantor_full_name, guarantor_email, guarantor_phone,
        guarantor_home_address, guarantor_office_address, candidate_name,
        id_document_url, passport_photo_url, signature_url,
        created_at, updated_at
      FROM marketer_guarantor_form 
      WHERE marketer_id = $1
      ORDER BY created_at DESC;
    `;
    
    const guarantorResult = await pool.query(guarantorQuery, [bayo.id]);
    
    // Check verification submissions
    const verificationQuery = `
      SELECT 
        id, marketer_id, admin_id, super_admin_id, submission_status,
        admin_reviewed_at, superadmin_reviewed_at, masteradmin_approved_at,
        rejection_reason, rejected_by, rejected_at,
        created_at, updated_at
      FROM verification_submissions 
      WHERE marketer_id = $1
      ORDER BY created_at DESC;
    `;
    
    const verificationResult = await pool.query(verificationQuery, [bayo.id]);
    
    // Check workflow logs
    const workflowQuery = `
      SELECT 
        id, verification_submission_id, action_by, action_by_role, action_type,
        action_description, previous_status, new_status, notes, created_at
      FROM verification_workflow_logs 
      WHERE action_by = $1 OR verification_submission_id IN (
        SELECT id FROM verification_submissions WHERE marketer_id = $1
      )
      ORDER BY created_at DESC
      LIMIT 10;
    `;
    
    const workflowResult = await pool.query(workflowQuery, [bayo.id]);
    
    await pool.end();
    
    res.json({
      success: true,
      message: 'Bayo Lawal complete status check completed',
      user: {
        id: bayo.id,
        unique_id: bayo.unique_id,
        name: `${bayo.first_name} ${bayo.last_name}`,
        email: bayo.email,
        role: bayo.role,
        formSubmissions: {
          bio_submitted: bayo.bio_submitted,
          guarantor_submitted: bayo.guarantor_submitted,
          commitment_submitted: bayo.commitment_submitted
        },
        verificationStatus: bayo.overall_verification_status,
        admin_id: bayo.admin_id,
        super_admin_id: bayo.super_admin_id,
        created_at: bayo.created_at,
        updated_at: bayo.updated_at
      },
      guarantorForms: guarantorResult.rows.length,
      guarantorData: guarantorResult.rows,
      verificationSubmissions: verificationResult.rows.length,
      verificationData: verificationResult.rows,
      workflowLogs: workflowResult.rows.length,
      workflowData: workflowResult.rows
    });
    
  } catch (error) {
    console.error('❌ Error checking Bayo status:', error);
    res.status(500).json({
      success: false,
      message: 'Status check failed',
      error: error.message
    });
  }
});

// Create admin_verification_details table
router.post('/create-admin-verification-table', async (req, res) => {
  try {
    console.log('🔍 Creating admin_verification_details table...');
    
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      }
    });
    
    // Check if table already exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'admin_verification_details'
      );
    `);
    
    if (tableCheck.rows[0].exists) {
      await pool.end();
      return res.status(200).json({
        success: true,
        message: 'admin_verification_details table already exists'
      });
    }
    
    console.log('🔄 Creating admin_verification_details table...');
    
    // Create the table
    await pool.query(`
      CREATE TABLE admin_verification_details (
        id SERIAL PRIMARY KEY,
        verification_submission_id INTEGER NOT NULL,
        admin_id INTEGER NOT NULL,
        marketer_id INTEGER NOT NULL,
        
        -- Location verification
        marketer_address TEXT NOT NULL,
        landmark_description TEXT,
        location_photo_url TEXT,
        
        -- Admin and Marketer together
        admin_marketer_photo_url TEXT,
        
        -- Additional verification details
        verification_notes TEXT,
        admin_verification_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        
        -- Document uploads
        additional_documents JSONB,
        
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    console.log('✅ Created admin_verification_details table');
    
    // Add foreign key constraints
    console.log('🔄 Adding foreign key constraints...');
    
    try {
      await pool.query(`
        ALTER TABLE admin_verification_details 
        ADD CONSTRAINT fk_admin_verification_submission 
        FOREIGN KEY (verification_submission_id) REFERENCES verification_submissions(id) ON DELETE CASCADE;
      `);
      console.log('✅ Added verification_submission_id foreign key');
    } catch (error) {
      if (error.code !== '42710') { // Constraint already exists
        console.log('⚠️ Could not add verification_submission_id foreign key:', error.message);
      }
    }
    
    try {
      await pool.query(`
        ALTER TABLE admin_verification_details 
        ADD CONSTRAINT fk_admin_verification_admin 
        FOREIGN KEY (admin_id) REFERENCES users(id);
      `);
      console.log('✅ Added admin_id foreign key');
    } catch (error) {
      if (error.code !== '42710') { // Constraint already exists
        console.log('⚠️ Could not add admin_id foreign key:', error.message);
      }
    }
    
    try {
      await pool.query(`
        ALTER TABLE admin_verification_details 
        ADD CONSTRAINT fk_admin_verification_marketer 
        FOREIGN KEY (marketer_id) REFERENCES users(id);
      `);
      console.log('✅ Added marketer_id foreign key');
    } catch (error) {
      if (error.code !== '42710') { // Constraint already exists
        console.log('⚠️ Could not add marketer_id foreign key:', error.message);
      }
    }
    
    // Create indexes
    console.log('🔄 Creating indexes...');
    
    try {
      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_admin_verification_submission 
        ON admin_verification_details(verification_submission_id);
      `);
      console.log('✅ Created verification_submission_id index');
    } catch (error) {
      console.log('⚠️ Could not create verification_submission_id index:', error.message);
    }
    
    try {
      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_admin_verification_admin 
        ON admin_verification_details(admin_id);
      `);
      console.log('✅ Created admin_id index');
    } catch (error) {
      console.log('⚠️ Could not create admin_id index:', error.message);
    }
    
    try {
      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_admin_verification_marketer 
        ON admin_verification_details(marketer_id);
      `);
      console.log('✅ Created marketer_id index');
    } catch (error) {
      console.log('⚠️ Could not create marketer_id index:', error.message);
    }
    
    await pool.end();
    
    res.status(200).json({
      success: true,
      message: 'admin_verification_details table created successfully!',
      changes: {
        tableCreated: 'admin_verification_details',
        foreignKeys: [
          'fk_admin_verification_submission',
          'fk_admin_verification_admin', 
          'fk_admin_verification_marketer'
        ],
        indexes: [
          'idx_admin_verification_submission',
          'idx_admin_verification_admin',
          'idx_admin_verification_marketer'
        ]
      }
    });
    
  } catch (error) {
    console.error('❌ Error creating admin_verification_details table:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create admin_verification_details table.', 
      error: error.message 
    });
  }
});

// Simple admin verification table creation
router.post('/create-admin-table-simple', async (req, res) => {
  try {
    console.log('🔍 Creating admin_verification_details table directly...');
    
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      }
    });
    
    // Check if table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'admin_verification_details'
      );
    `);
    
    if (tableCheck.rows[0].exists) {
      await pool.end();
      return res.status(200).json({
        success: true,
        message: 'admin_verification_details table already exists'
      });
    }
    
    console.log('🔄 Creating admin_verification_details table...');
    
    // Create the table with minimal structure first
    await pool.query(`
      CREATE TABLE admin_verification_details (
        id SERIAL PRIMARY KEY,
        verification_submission_id INTEGER NOT NULL,
        admin_id INTEGER NOT NULL,
        marketer_id INTEGER NOT NULL,
        marketer_address TEXT NOT NULL,
        landmark_description TEXT,
        location_photo_url TEXT,
        admin_marketer_photo_url TEXT,
        verification_notes TEXT,
        admin_verification_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        additional_documents JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    console.log('✅ Created admin_verification_details table');
    
    await pool.end();
    
    res.status(200).json({
      success: true,
      message: 'admin_verification_details table created successfully!'
    });
    
  } catch (error) {
    console.error('❌ Error creating admin_verification_details table:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create admin_verification_details table.', 
      error: error.message 
    });
  }
});

module.exports = router;