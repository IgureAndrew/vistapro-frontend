const { Pool } = require('pg');
require('dotenv').config();

async function testBayoForms() {
  let pool;
  
  try {
    console.log('🔍 Testing Bayo Lawal forms...');
    
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
      console.log(`   Admin ID: ${user.admin_id}`);
      console.log(`   Bio submitted: ${user.bio_submitted}`);
      console.log(`   Guarantor submitted: ${user.guarantor_submitted}`);
      console.log(`   Commitment submitted: ${user.commitment_submitted}`);
      console.log(`   Overall status: ${user.overall_verification_status}`);
      console.log(`   Created: ${user.created_at}`);
      
      // Check biodata
      console.log('\n📋 Checking biodata...');
      const biodataResult = await pool.query(`
        SELECT * FROM marketer_biodata 
        WHERE marketer_unique_id = $1 
        ORDER BY created_at DESC LIMIT 1
      `, [user.unique_id]);
      
      if (biodataResult.rows.length > 0) {
        console.log(`✅ Biodata found:`, {
          name: biodataResult.rows[0].name,
          address: biodataResult.rows[0].address,
          phone: biodataResult.rows[0].phone,
          created_at: biodataResult.rows[0].created_at
        });
      } else {
        console.log(`❌ No biodata found`);
      }
      
      // Check guarantor form
      console.log('\n📋 Checking guarantor form...');
      const guarantorResult = await pool.query(`
        SELECT * FROM marketer_guarantor_form 
        WHERE marketer_id = $1 
        ORDER BY created_at DESC LIMIT 1
      `, [user.id]);
      
      if (guarantorResult.rows.length > 0) {
        console.log(`✅ Guarantor form found:`, {
          is_candidate_well_known: guarantorResult.rows[0].is_candidate_well_known,
          relationship: guarantorResult.rows[0].relationship,
          known_duration: guarantorResult.rows[0].known_duration,
          occupation: guarantorResult.rows[0].occupation,
          created_at: guarantorResult.rows[0].created_at
        });
      } else {
        console.log(`❌ No guarantor form found`);
      }
      
      // Check commitment form
      console.log('\n📋 Checking commitment form...');
      const commitmentResult = await pool.query(`
        SELECT * FROM marketer_commitment_form 
        WHERE marketer_id = $1 
        ORDER BY created_at DESC LIMIT 1
      `, [user.id]);
      
      if (commitmentResult.rows.length > 0) {
        console.log(`✅ Commitment form found:`, {
          promise_accept_false_documents: commitmentResult.rows[0].promise_accept_false_documents,
          promise_not_charge_customer_fees: commitmentResult.rows[0].promise_not_charge_customer_fees,
          direct_sales_rep_name: commitmentResult.rows[0].direct_sales_rep_name,
          created_at: commitmentResult.rows[0].created_at
        });
      } else {
        console.log(`❌ No commitment form found`);
      }
      
      // Check verification submissions
      console.log('\n📋 Checking verification submissions...');
      const vsResult = await pool.query(`
        SELECT * FROM verification_submissions 
        WHERE marketer_id = $1 
        ORDER BY created_at DESC LIMIT 1
      `, [user.id]);
      
      if (vsResult.rows.length > 0) {
        console.log(`✅ Verification submission found:`, {
          submission_status: vsResult.rows[0].submission_status,
          admin_id: vsResult.rows[0].admin_id,
          created_at: vsResult.rows[0].created_at
        });
      } else {
        console.log(`❌ No verification submission found`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error testing Bayo forms:', error.message);
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}

// Run the test
testBayoForms();
