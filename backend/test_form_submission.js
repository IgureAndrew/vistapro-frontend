const { Pool } = require('pg');
require('dotenv').config();

async function testFormSubmission() {
  let pool;
  
  try {
    console.log('🔍 Testing form submission data...');
    
    // Create database connection
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: false
    });
    
    // Test connection
    await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful');
    
    // Find Bayo Lawal
    console.log('\n👤 Looking for Bayo Lawal...');
    const bayoResult = await pool.query(`
      SELECT id, unique_id, first_name, last_name, email, admin_id, 
             bio_submitted, guarantor_submitted, commitment_submitted,
             overall_verification_status, created_at
      FROM users 
      WHERE LOWER(first_name) LIKE '%bayo%' OR LOWER(last_name) LIKE '%lawal%'
      ORDER BY created_at DESC
    `);
    
    console.log(`📊 Found ${bayoResult.rows.length} users matching Bayo Lawal`);
    
    for (const user of bayoResult.rows) {
      console.log(`\n👤 User: ${user.first_name} ${user.last_name} (${user.email})`);
      console.log(`   ID: ${user.id}, Unique: ${user.unique_id}`);
      console.log(`   Bio submitted: ${user.bio_submitted}`);
      console.log(`   Guarantor submitted: ${user.guarantor_submitted}`);
      console.log(`   Commitment submitted: ${user.commitment_submitted}`);
      console.log(`   Overall status: ${user.overall_verification_status}`);
      
      // Check if forms actually exist in database
      console.log('\n📋 Checking actual form data in database...');
      
      // Check biodata
      const biodataResult = await pool.query(`
        SELECT COUNT(*) as count, MAX(created_at) as latest_submission
        FROM marketer_biodata 
        WHERE marketer_unique_id = $1
      `, [user.unique_id]);
      
      console.log(`   Biodata records: ${biodataResult.rows[0].count}, Latest: ${biodataResult.rows[0].latest_submission}`);
      
      // Check guarantor form
      const guarantorResult = await pool.query(`
        SELECT COUNT(*) as count, MAX(created_at) as latest_submission
        FROM marketer_guarantor_form 
        WHERE marketer_id = $1
      `, [user.id]);
      
      console.log(`   Guarantor records: ${guarantorResult.rows[0].count}, Latest: ${guarantorResult.rows[0].latest_submission}`);
      
      // Check commitment form
      const commitmentResult = await pool.query(`
        SELECT COUNT(*) as count, MAX(created_at) as latest_submission
        FROM marketer_commitment_form 
        WHERE marketer_id = $1
      `, [user.id]);
      
      console.log(`   Commitment records: ${commitmentResult.rows[0].count}, Latest: ${commitmentResult.rows[0].latest_submission}`);
      
      // Check verification submissions
      const vsResult = await pool.query(`
        SELECT COUNT(*) as count, MAX(created_at) as latest_submission
        FROM verification_submissions 
        WHERE marketer_id = $1
      `, [user.id]);
      
      console.log(`   Verification submissions: ${vsResult.rows[0].count}, Latest: ${vsResult.rows[0].latest_submission}`);
      
      // Summary
      console.log('\n📊 SUMMARY:');
      console.log(`   User flags: Bio=${user.bio_submitted}, Guarantor=${user.guarantor_submitted}, Commitment=${user.commitment_submitted}`);
      console.log(`   Database records: Bio=${biodataResult.rows[0].count}, Guarantor=${guarantorResult.rows[0].count}, Commitment=${commitmentResult.rows[0].count}`);
      
      if (user.guarantor_submitted && guarantorResult.rows[0].count === 0) {
        console.log('❌ ISSUE: User flag says guarantor submitted but no database record!');
      }
      if (user.commitment_submitted && commitmentResult.rows[0].count === 0) {
        console.log('❌ ISSUE: User flag says commitment submitted but no database record!');
      }
    }
    
  } catch (error) {
    console.error('❌ Error testing form submission:', error.message);
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}

// Run the test
testFormSubmission();
