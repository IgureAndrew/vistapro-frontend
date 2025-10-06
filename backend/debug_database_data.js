const { Pool } = require('pg');
require('dotenv').config();

async function debugDatabaseData() {
  let pool;
  
  try {
    console.log('🔍 Debugging database data...');
    
    // Create database connection
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: false
    });
    
    // Test connection
    await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful');
    
    // Check if tables exist
    console.log('\n📋 Checking table existence...');
    const tables = ['marketer_guarantor_form', 'marketer_commitment_form', 'marketer_biodata', 'verification_submissions'];
    
    for (const table of tables) {
      try {
        const result = await pool.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = $1
          );
        `, [table]);
        
        if (result.rows[0].exists) {
          const countResult = await pool.query(`SELECT COUNT(*) as count FROM ${table}`);
          console.log(`✅ Table ${table} exists with ${countResult.rows[0].count} rows`);
        } else {
          console.log(`❌ Table ${table} does not exist`);
        }
      } catch (error) {
        console.log(`❌ Error checking table ${table}:`, error.message);
      }
    }
    
    // Check specific marketer data
    console.log('\n👤 Checking marketer data...');
    const marketerResult = await pool.query(`
      SELECT 
        u.id, 
        u.unique_id, 
        u.first_name, 
        u.last_name,
        u.bio_submitted,
        u.guarantor_submitted,
        u.commitment_submitted,
        u.overall_verification_status
      FROM users u 
      WHERE u.role = 'Marketer' 
      ORDER BY u.created_at DESC 
      LIMIT 3
    `);
    
    console.log(`📊 Found ${marketerResult.rows.length} marketers`);
    
    for (const marketer of marketerResult.rows) {
      console.log(`\n👤 Marketer: ${marketer.first_name} ${marketer.last_name} (ID: ${marketer.id}, Unique: ${marketer.unique_id})`);
      console.log(`   Bio submitted: ${marketer.bio_submitted}`);
      console.log(`   Guarantor submitted: ${marketer.guarantor_submitted}`);
      console.log(`   Commitment submitted: ${marketer.commitment_submitted}`);
      console.log(`   Overall status: ${marketer.overall_verification_status}`);
      
      // Check biodata
      try {
        const biodataResult = await pool.query(
          'SELECT * FROM marketer_biodata WHERE marketer_unique_id = $1 ORDER BY created_at DESC LIMIT 1',
          [marketer.unique_id]
        );
        console.log(`   📋 Biodata records: ${biodataResult.rows.length}`);
        if (biodataResult.rows.length > 0) {
          console.log(`   📝 Biodata sample:`, {
            name: biodataResult.rows[0].name,
            address: biodataResult.rows[0].address,
            phone: biodataResult.rows[0].phone
          });
        }
      } catch (error) {
        console.log(`   ❌ Error checking biodata:`, error.message);
      }
      
      // Check guarantor form
      try {
        const guarantorResult = await pool.query(
          'SELECT * FROM marketer_guarantor_form WHERE marketer_id = $1 ORDER BY created_at DESC LIMIT 1',
          [marketer.id]
        );
        console.log(`   📋 Guarantor records: ${guarantorResult.rows.length}`);
        if (guarantorResult.rows.length > 0) {
          console.log(`   📝 Guarantor sample:`, {
            is_candidate_well_known: guarantorResult.rows[0].is_candidate_well_known,
            relationship: guarantorResult.rows[0].relationship,
            known_duration: guarantorResult.rows[0].known_duration,
            occupation: guarantorResult.rows[0].occupation
          });
        }
      } catch (error) {
        console.log(`   ❌ Error checking guarantor:`, error.message);
      }
      
      // Check commitment form
      try {
        const commitmentResult = await pool.query(
          'SELECT * FROM marketer_commitment_form WHERE marketer_id = $1 ORDER BY created_at DESC LIMIT 1',
          [marketer.id]
        );
        console.log(`   📋 Commitment records: ${commitmentResult.rows.length}`);
        if (commitmentResult.rows.length > 0) {
          console.log(`   📝 Commitment sample:`, {
            promise_accept_false_documents: commitmentResult.rows[0].promise_accept_false_documents,
            promise_not_charge_customer_fees: commitmentResult.rows[0].promise_not_charge_customer_fees,
            direct_sales_rep_name: commitmentResult.rows[0].direct_sales_rep_name,
            date_signed: commitmentResult.rows[0].date_signed
          });
        }
      } catch (error) {
        console.log(`   ❌ Error checking commitment:`, error.message);
      }
    }
    
    // Check verification submissions
    console.log('\n📋 Checking verification submissions...');
    try {
      const vsResult = await pool.query(`
        SELECT 
          vs.id,
          vs.submission_status,
          vs.created_at,
          u.first_name,
          u.last_name,
          u.unique_id
        FROM verification_submissions vs
        JOIN users u ON vs.marketer_id = u.id
        ORDER BY vs.created_at DESC
        LIMIT 3
      `);
      
      console.log(`📊 Found ${vsResult.rows.length} verification submissions`);
      for (const vs of vsResult.rows) {
        console.log(`   📝 VS ${vs.id}: ${vs.first_name} ${vs.last_name} (${vs.unique_id}) - Status: ${vs.submission_status}`);
      }
    } catch (error) {
      console.log(`❌ Error checking verification submissions:`, error.message);
    }
    
  } catch (error) {
    console.error('❌ Error debugging database:', error.message);
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}

// Run the debug
debugDatabaseData();
