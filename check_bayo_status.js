// check_bayo_status.js
// Check Bayo Lawal's current verification status in the database

require('dotenv').config();
const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function checkBayoStatus() {
  console.log('🔍 Checking Bayo Lawal verification status...');
  
  try {
    // Test connection
    await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful');
    
    // Check Bayo's user record
    const userResult = await pool.query(`
      SELECT 
        id, unique_id, first_name, last_name, email,
        bio_submitted, guarantor_submitted, commitment_submitted, 
        overall_verification_status, created_at, updated_at
      FROM users 
      WHERE unique_id = 'DSR00336' OR email = 'bayolawal@gmail.com'
    `);
    
    if (userResult.rows.length > 0) {
      const user = userResult.rows[0];
      console.log('👤 Bayo Lawal user record:');
      console.log('  ID:', user.id);
      console.log('  Unique ID:', user.unique_id);
      console.log('  Name:', user.first_name, user.last_name);
      console.log('  Email:', user.email);
      console.log('  Bio Submitted:', user.bio_submitted);
      console.log('  Guarantor Submitted:', user.guarantor_submitted);
      console.log('  Commitment Submitted:', user.commitment_submitted);
      console.log('  Overall Verification Status:', user.overall_verification_status);
      console.log('  Updated At:', user.updated_at);
    } else {
      console.log('❌ Bayo Lawal user not found');
    }
    
    // Check form submissions
    console.log('\n📋 Checking form submissions...');
    
    // Check biodata
    const biodataResult = await pool.query(`
      SELECT id, marketer_unique_id, created_at 
      FROM marketer_biodata 
      WHERE marketer_unique_id = 'DSR00336'
    `);
    console.log('  Biodata records:', biodataResult.rows.length);
    
    // Check guarantor
    const guarantorResult = await pool.query(`
      SELECT id, marketer_id, created_at 
      FROM marketer_guarantor_form 
      WHERE marketer_id = (SELECT id FROM users WHERE unique_id = 'DSR00336')
    `);
    console.log('  Guarantor records:', guarantorResult.rows.length);
    
    // Check commitment
    const commitmentResult = await pool.query(`
      SELECT id, marketer_id, created_at 
      FROM marketer_commitment_form 
      WHERE marketer_id = (SELECT id FROM users WHERE unique_id = 'DSR00336')
    `);
    console.log('  Commitment records:', commitmentResult.rows.length);
    
    // Check verification submissions
    const verificationResult = await pool.query(`
      SELECT id, marketer_id, submission_status, created_at 
      FROM verification_submissions 
      WHERE marketer_id = (SELECT id FROM users WHERE unique_id = 'DSR00336')
    `);
    console.log('  Verification submission records:', verificationResult.rows.length);
    
    // Check verification workflow logs
    const workflowResult = await pool.query(`
      SELECT id, marketer_id, action, status, created_at 
      FROM verification_workflow_logs 
      WHERE marketer_id = (SELECT id FROM users WHERE unique_id = 'DSR00336')
      ORDER BY created_at DESC
      LIMIT 5
    `);
    console.log('  Workflow log records:', workflowResult.rows.length);
    if (workflowResult.rows.length > 0) {
      console.log('  Recent workflow logs:');
      workflowResult.rows.forEach(log => {
        console.log(`    - ${log.action}: ${log.status} (${log.created_at})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error checking Bayo status:', error);
  } finally {
    await pool.end();
  }
}

// Run the check
checkBayoStatus();
