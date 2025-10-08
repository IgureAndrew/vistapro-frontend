const { Pool } = require('pg');

// Use local database configuration
const pool = new Pool({
  user: 'vistapro_user',
  password: 'vistapro_password',
  host: 'localhost',
  port: 5433,
  database: 'vistapro_dev',
  ssl: false
});

async function runLocalMigration() {
  try {
    console.log('🔍 Starting local guarantor structure migration...');
    
    // Step 1: Add missing columns
    const columnsToAdd = [
      'means_of_identification TEXT',
      'guarantor_full_name TEXT',
      'guarantor_email TEXT',
      'guarantor_phone TEXT',
      'guarantor_home_address TEXT',
      'guarantor_office_address TEXT',
      'candidate_name TEXT'
    ];
    
    for (const column of columnsToAdd) {
      try {
        await pool.query(`ALTER TABLE marketer_guarantor_form ADD COLUMN IF NOT EXISTS ${column};`);
        console.log(`✅ Added column: ${column.split(' ')[0]}`);
      } catch (error) {
        if (error.code === '42701') {
          console.log(`⏭️ Column already exists: ${column.split(' ')[0]}`);
        } else {
          console.log(`❌ Error adding column ${column.split(' ')[0]}:`, error.message);
        }
      }
    }
    
    // Step 2: Check existing data
    const countResult = await pool.query('SELECT COUNT(*) as count FROM marketer_guarantor_form;');
    console.log('📊 Total guarantor records:', countResult.rows[0].count);
    
    if (parseInt(countResult.rows[0].count) > 0) {
      const dataResult = await pool.query(`
        SELECT 
          id, marketer_id, is_candidate_well_known, relationship, known_duration, occupation,
          means_of_identification, guarantor_full_name, guarantor_email, guarantor_phone,
          guarantor_home_address, guarantor_office_address, candidate_name
        FROM marketer_guarantor_form 
        ORDER BY created_at DESC
        LIMIT 5;
      `);
      
      console.log('📋 Sample guarantor data:');
      dataResult.rows.forEach((row, index) => {
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
          candidate_name: row.candidate_name
        });
      });
    }
    
    console.log('✅ Local migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Local migration error:', error);
  } finally {
    await pool.end();
  }
}

runLocalMigration();
