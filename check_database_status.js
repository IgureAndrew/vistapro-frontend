const { Pool } = require('pg');
require('dotenv').config();

async function checkDatabaseStatus() {
  let pool;
  
  try {
    console.log('🔍 Checking database status...');
    
    // Create database connection
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: false
    });
    
    // Test connection
    await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful');
    
    // Check if tables exist
    const tablesToCheck = [
      'marketer_guarantor_form',
      'marketer_commitment_form', 
      'admin_verification_details',
      'verification_submissions',
      'marketer_biodata'
    ];
    
    console.log('\n📋 Checking table existence...');
    for (const tableName of tablesToCheck) {
      try {
        const result = await pool.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = $1
          );
        `, [tableName]);
        
        if (result.rows[0].exists) {
          console.log(`✅ Table ${tableName} exists`);
          
          // Check row count
          const countResult = await pool.query(`SELECT COUNT(*) as count FROM ${tableName}`);
          const rowCount = countResult.rows[0].count;
          console.log(`   📊 Row count: ${rowCount}`);
          
          // If table has data, show sample
          if (parseInt(rowCount) > 0) {
            const sampleResult = await pool.query(`SELECT * FROM ${tableName} LIMIT 1`);
            console.log(`   📝 Sample data:`, Object.keys(sampleResult.rows[0]));
          }
        } else {
          console.log(`❌ Table ${tableName} does not exist`);
        }
      } catch (error) {
        console.log(`❌ Error checking table ${tableName}:`, error.message);
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
        u.overall_verification_status
      FROM users u 
      WHERE u.role = 'Marketer' 
      ORDER BY u.created_at DESC 
      LIMIT 3
    `);
    
    console.log(`📊 Found ${marketerResult.rows.length} marketers`);
    
    for (const marketer of marketerResult.rows) {
      console.log(`\n👤 Marketer: ${marketer.first_name} ${marketer.last_name} (${marketer.unique_id})`);
      console.log(`   Bio submitted: ${marketer.bio_submitted}`);
      console.log(`   Guarantor submitted: ${marketer.guarantor_submitted}`);
      console.log(`   Commitment submitted: ${marketer.commitment_submitted}`);
      console.log(`   Overall status: ${marketer.overall_verification_status}`);
      
      // Check if forms actually exist in database
      try {
        const biodataCheck = await pool.query(
          'SELECT COUNT(*) as count FROM marketer_biodata WHERE marketer_unique_id = $1',
          [marketer.unique_id]
        );
        console.log(`   📋 Biodata records: ${biodataCheck.rows[0].count}`);
        
        const guarantorCheck = await pool.query(
          'SELECT COUNT(*) as count FROM marketer_guarantor_form WHERE marketer_id = $1',
          [marketer.id]
        );
        console.log(`   📋 Guarantor records: ${guarantorCheck.rows[0].count}`);
        
        const commitmentCheck = await pool.query(
          'SELECT COUNT(*) as count FROM marketer_commitment_form WHERE marketer_id = $1',
          [marketer.id]
        );
        console.log(`   📋 Commitment records: ${commitmentCheck.rows[0].count}`);
        
        // Show actual form data if it exists
        if (parseInt(guarantorCheck.rows[0].count) > 0) {
          const guarantorData = await pool.query(
            'SELECT * FROM marketer_guarantor_form WHERE marketer_id = $1 ORDER BY created_at DESC LIMIT 1',
            [marketer.id]
          );
          console.log(`   📝 Guarantor data:`, guarantorData.rows[0]);
        }
        
        if (parseInt(commitmentCheck.rows[0].count) > 0) {
          const commitmentData = await pool.query(
            'SELECT * FROM marketer_commitment_form WHERE marketer_id = $1 ORDER BY created_at DESC LIMIT 1',
            [marketer.id]
          );
          console.log(`   📝 Commitment data:`, commitmentData.rows[0]);
        }
        
      } catch (error) {
        console.log(`   ❌ Error checking forms for ${marketer.first_name}:`, error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking database status:', error.message);
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}

// Run the check
checkDatabaseStatus();
