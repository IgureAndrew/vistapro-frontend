const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false
});

async function testGuarantorData() {
  try {
    console.log('🔍 Testing guarantor form data...');
    
    // Check table structure
    const structureCheck = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'marketer_guarantor_form'
      ORDER BY ordinal_position;
    `);
    
    console.log('📋 Current table structure:');
    structureCheck.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type}`);
    });
    
    // Check if we have any data
    const countCheck = await pool.query(`
      SELECT COUNT(*) as count FROM marketer_guarantor_form;
    `);
    
    console.log('📊 Total guarantor records:', countCheck.rows[0].count);
    
    if (parseInt(countCheck.rows[0].count) > 0) {
      // Get sample data
      const sampleData = await pool.query(`
        SELECT 
          id, marketer_id, is_candidate_well_known, relationship, known_duration, occupation,
          means_of_identification, guarantor_full_name, guarantor_email, guarantor_phone,
          guarantor_home_address, guarantor_office_address, candidate_name,
          created_at
        FROM marketer_guarantor_form 
        ORDER BY created_at DESC 
        LIMIT 3;
      `);
      
      console.log('📋 Sample guarantor data:');
      sampleData.rows.forEach((row, index) => {
        console.log(`  Record ${index + 1}:`, {
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
          candidate_name: row.candidate_name,
          created_at: row.created_at
        });
      });
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
      
      // Check his guarantor form with all fields
      const bayoGuarantor = await pool.query(`
        SELECT 
          id, marketer_id, is_candidate_well_known, relationship, known_duration, occupation,
          means_of_identification, guarantor_full_name, guarantor_email, guarantor_phone,
          guarantor_home_address, guarantor_office_address, candidate_name,
          id_document_url, passport_photo_url, signature_url, created_at
        FROM marketer_guarantor_form 
        WHERE marketer_id = $1;
      `, [bayo.id]);
      
      console.log('📋 Bayo\'s guarantor form records:', bayoGuarantor.rows.length);
      if (bayoGuarantor.rows.length > 0) {
        console.log('📋 Bayo\'s complete guarantor data:', bayoGuarantor.rows[0]);
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

testGuarantorData();
