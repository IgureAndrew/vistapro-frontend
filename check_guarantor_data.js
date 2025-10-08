const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false
});

async function checkGuarantorData() {
  try {
    console.log('🔍 Checking guarantor form data...');
    
    // Check if table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'marketer_guarantor_form'
      );
    `);
    
    console.log('📋 Table exists:', tableCheck.rows[0].exists);
    
    if (tableCheck.rows[0].exists) {
      // Check table structure
      const structureCheck = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'marketer_guarantor_form'
        ORDER BY ordinal_position;
      `);
      
      console.log('📋 Table structure:');
      structureCheck.rows.forEach(row => {
        console.log(`  - ${row.column_name}: ${row.data_type}`);
      });
      
      // Check if there's any data
      const countCheck = await pool.query(`
        SELECT COUNT(*) as count FROM marketer_guarantor_form;
      `);
      
      console.log('📊 Total records:', countCheck.rows[0].count);
      
      if (parseInt(countCheck.rows[0].count) > 0) {
        // Get sample data
        const sampleData = await pool.query(`
          SELECT * FROM marketer_guarantor_form LIMIT 3;
        `);
        
        console.log('📋 Sample data:');
        sampleData.rows.forEach((row, index) => {
          console.log(`  Record ${index + 1}:`, {
            id: row.id,
            marketer_id: row.marketer_id,
            is_candidate_well_known: row.is_candidate_well_known,
            relationship: row.relationship,
            known_duration: row.known_duration,
            occupation: row.occupation,
            created_at: row.created_at
          });
        });
      }
    }
    
    // Check Bayo Lawal specifically
    console.log('\n🔍 Checking Bayo Lawal specifically...');
    const bayoCheck = await pool.query(`
      SELECT u.id, u.unique_id, u.first_name, u.last_name, u.guarantor_submitted
      FROM users u 
      WHERE u.first_name ILIKE '%bayo%' OR u.last_name ILIKE '%lawal%';
    `);
    
    if (bayoCheck.rows.length > 0) {
      const bayo = bayoCheck.rows[0];
      console.log('👤 Bayo Lawal found:', {
        id: bayo.id,
        unique_id: bayo.unique_id,
        name: `${bayo.first_name} ${bayo.last_name}`,
        guarantor_submitted: bayo.guarantor_submitted
      });
      
      // Check his guarantor form
      const bayoGuarantor = await pool.query(`
        SELECT * FROM marketer_guarantor_form WHERE marketer_id = $1;
      `, [bayo.id]);
      
      console.log('📋 Bayo\'s guarantor form records:', bayoGuarantor.rows.length);
      if (bayoGuarantor.rows.length > 0) {
        console.log('📋 Bayo\'s guarantor data:', bayoGuarantor.rows[0]);
      }
    } else {
      console.log('❌ Bayo Lawal not found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

checkGuarantorData();
