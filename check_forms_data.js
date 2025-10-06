const { Pool } = require('pg');
require('dotenv').config();

async function checkFormsData() {
  let pool;
  
  try {
    console.log('🔍 Checking forms data in database...');
    
    // Create database connection with different SSL settings
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
    
    // Test connection
    await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful');
    
    // Check if tables exist and have data
    console.log('\n📋 Checking table existence and data...');
    
    const tables = [
      { name: 'marketer_biodata', key: 'marketer_unique_id' },
      { name: 'marketer_guarantor_form', key: 'marketer_id' },
      { name: 'marketer_commitment_form', key: 'marketer_id' },
      { name: 'verification_submissions', key: 'marketer_id' }
    ];
    
    for (const table of tables) {
      try {
        // Check if table exists
        const existsResult = await pool.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = $1
          );
        `, [table.name]);
        
        if (existsResult.rows[0].exists) {
          // Get row count
          const countResult = await pool.query(`SELECT COUNT(*) as count FROM ${table.name}`);
          const rowCount = countResult.rows[0].count;
          console.log(`✅ Table ${table.name} exists with ${rowCount} rows`);
          
          // If table has data, show sample
          if (parseInt(rowCount) > 0) {
            const sampleResult = await pool.query(`SELECT * FROM ${table.name} LIMIT 1`);
            console.log(`📝 Sample data from ${table.name}:`, Object.keys(sampleResult.rows[0]));
          }
        } else {
          console.log(`❌ Table ${table.name} does not exist`);
        }
      } catch (error) {
        console.log(`❌ Error checking table ${table.name}:`, error.message);
      }
    }
    
    // Check specific marketer data
    console.log('\n👤 Checking specific marketer data...');
    const marketerResult = await pool.query(`
      SELECT 
        u.id, 
        u.unique_id, 
        u.first_name, 
        u.last_name,
        u.bio_submitted,
        u.guarantor_submitted,
        u.commitment_submitted,
        u.overall_verification_status,
        u.created_at
      FROM users u 
      WHERE u.role = 'Marketer' 
      ORDER BY u.created_at DESC 
      LIMIT 5
    `);
    
    console.log(`📊 Found ${marketerResult.rows.length} marketers`);
    
    for (const marketer of marketerResult.rows) {
      console.log(`\n👤 Marketer: ${marketer.first_name} ${marketer.last_name}`);
      console.log(`   ID: ${marketer.id}, Unique: ${marketer.unique_id}`);
      console.log(`   Bio submitted: ${marketer.bio_submitted}`);
      console.log(`   Guarantor submitted: ${marketer.guarantor_submitted}`);
      console.log(`   Commitment submitted: ${marketer.commitment_submitted}`);
      console.log(`   Overall status: ${marketer.overall_verification_status}`);
      console.log(`   Created: ${marketer.created_at}`);
      
      // Check if forms actually exist in database
      try {
        // Check biodata
        const biodataResult = await pool.query(
          'SELECT COUNT(*) as count FROM marketer_biodata WHERE marketer_unique_id = $1',
          [marketer.unique_id]
        );
        console.log(`   📋 Biodata records: ${biodataResult.rows[0].count}`);
        
        // Check guarantor form
        const guarantorResult = await pool.query(
          'SELECT COUNT(*) as count FROM marketer_guarantor_form WHERE marketer_id = $1',
          [marketer.id]
        );
        console.log(`   📋 Guarantor records: ${guarantorResult.rows[0].count}`);
        
        // Check commitment form
        const commitmentResult = await pool.query(
          'SELECT COUNT(*) as count FROM marketer_commitment_form WHERE marketer_id = $1',
          [marketer.id]
        );
        console.log(`   📋 Commitment records: ${commitmentResult.rows[0].count}`);
        
        // Check verification submissions
        const vsResult = await pool.query(
          'SELECT COUNT(*) as count FROM verification_submissions WHERE marketer_id = $1',
          [marketer.id]
        );
        console.log(`   📋 Verification submissions: ${vsResult.rows[0].count}`);
        
        // If guarantor form exists, show sample data
        if (parseInt(guarantorResult.rows[0].count) > 0) {
          const guarantorData = await pool.query(
            'SELECT * FROM marketer_guarantor_form WHERE marketer_id = $1 ORDER BY created_at DESC LIMIT 1',
            [marketer.id]
          );
          console.log(`   📝 Guarantor data:`, {
            is_candidate_well_known: guarantorData.rows[0].is_candidate_well_known,
            relationship: guarantorData.rows[0].relationship,
            known_duration: guarantorData.rows[0].known_duration,
            occupation: guarantorData.rows[0].occupation,
            created_at: guarantorData.rows[0].created_at
          });
        }
        
        // If commitment form exists, show sample data
        if (parseInt(commitmentResult.rows[0].count) > 0) {
          const commitmentData = await pool.query(
            'SELECT * FROM marketer_commitment_form WHERE marketer_id = $1 ORDER BY created_at DESC LIMIT 1',
            [marketer.id]
          );
          console.log(`   📝 Commitment data:`, {
            promise_accept_false_documents: commitmentData.rows[0].promise_accept_false_documents,
            promise_not_charge_customer_fees: commitmentData.rows[0].promise_not_charge_customer_fees,
            direct_sales_rep_name: commitmentData.rows[0].direct_sales_rep_name,
            date_signed: commitmentData.rows[0].date_signed,
            created_at: commitmentData.rows[0].created_at
          });
        }
        
      } catch (error) {
        console.log(`   ❌ Error checking forms for ${marketer.first_name}:`, error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking forms data:', error.message);
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}

// Run the check
checkFormsData();
