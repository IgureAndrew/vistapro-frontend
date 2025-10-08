const { Pool } = require('pg');

// Check Bayo Lawal's guarantor data in production
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function checkBayoData() {
  try {
    console.log('🔍 Checking Bayo Lawal guarantor data in production...');
    
    // First, find Bayo Lawal's user ID
    const userQuery = `
      SELECT id, unique_id, first_name, last_name, email, role 
      FROM users 
      WHERE first_name ILIKE '%bayo%' OR last_name ILIKE '%lawal%' OR email ILIKE '%bayo%'
      ORDER BY created_at DESC;
    `;
    
    const userResult = await pool.query(userQuery);
    console.log('👤 Found users:', userResult.rows.length);
    
    if (userResult.rows.length > 0) {
      userResult.rows.forEach((user, index) => {
        console.log(`  User ${index + 1}:`, {
          id: user.id,
          unique_id: user.unique_id,
          name: `${user.first_name} ${user.last_name}`,
          email: user.email,
          role: user.role
        });
      });
      
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
          guarantorResult.rows.forEach((record, index) => {
            console.log(`  Record ${index + 1}:`, {
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
            });
          });
        } else {
          console.log('❌ No guarantor data found for this user');
        }
      }
    } else {
      console.log('❌ No users found matching Bayo Lawal');
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
    
    allGuarantorResult.rows.forEach((record, index) => {
      console.log(`  Record ${index + 1}:`, {
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
      });
    });
    
  } catch (error) {
    console.error('❌ Error checking Bayo data:', error);
  } finally {
    await pool.end();
  }
}

checkBayoData();
