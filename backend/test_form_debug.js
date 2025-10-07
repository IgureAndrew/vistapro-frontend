const { Pool } = require('pg');
require('dotenv').config();

async function testFormDebug() {
  let pool;
  
  try {
    console.log('🔍 Testing form submission debug...');
    
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
      SELECT id, unique_id, first_name, last_name, email, 
             bio_submitted, guarantor_submitted, commitment_submitted,
             overall_verification_status
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
      
      // Check actual database records
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
      
      // Summary and issues
      console.log('\n📊 SUMMARY:');
      console.log(`   User flags: Bio=${user.bio_submitted}, Guarantor=${user.guarantor_submitted}, Commitment=${user.commitment_submitted}`);
      console.log(`   Database records: Bio=${biodataResult.rows[0].count}, Guarantor=${guarantorResult.rows[0].count}, Commitment=${commitmentResult.rows[0].count}`);
      
      const issues = [];
      if (user.guarantor_submitted && guarantorResult.rows[0].count === '0') {
        issues.push('❌ ISSUE: User flag says guarantor submitted but no database record!');
      }
      if (user.commitment_submitted && commitmentResult.rows[0].count === '0') {
        issues.push('❌ ISSUE: User flag says commitment submitted but no database record!');
      }
      if (user.bio_submitted && biodataResult.rows[0].count === '0') {
        issues.push('❌ ISSUE: User flag says bio submitted but no database record!');
      }
      
      if (issues.length > 0) {
        console.log('\n🚨 ISSUES FOUND:');
        issues.forEach(issue => console.log(`   ${issue}`));
      } else {
        console.log('\n✅ No issues found - flags match database records');
      }
      
      // If there are issues, let's try to fix them
      if (issues.length > 0) {
        console.log('\n🔧 Attempting to fix user flags...');
        
        const correctBioFlag = biodataResult.rows[0].count > 0;
        const correctGuarantorFlag = guarantorResult.rows[0].count > 0;
        const correctCommitmentFlag = commitmentResult.rows[0].count > 0;
        
        console.log(`   Correct flags should be: Bio=${correctBioFlag}, Guarantor=${correctGuarantorFlag}, Commitment=${correctCommitmentFlag}`);
        
        // Update user flags to match database reality
        await pool.query(`
          UPDATE users 
          SET bio_submitted = $1, 
              guarantor_submitted = $2, 
              commitment_submitted = $3,
              updated_at = NOW()
          WHERE id = $4
        `, [correctBioFlag, correctGuarantorFlag, correctCommitmentFlag, user.id]);
        
        console.log('✅ User flags updated to match database reality');
      }
    }
    
  } catch (error) {
    console.error('❌ Error testing form debug:', error.message);
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}

// Run the test
testFormDebug();
