const { Pool } = require('pg');
require('dotenv').config();

// Check if we're in production (Render) or local development
const isProduction = process.env.NODE_ENV === 'production' || process.env.DATABASE_URL?.includes('render.com');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isProduction ? {
    rejectUnauthorized: false
  } : false
});

async function migrateGuarantorStructure() {
  try {
    console.log('🔍 Starting guarantor structure migration...');
    
    // Step 1: Check current table structure
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
    
    // Step 2: Add missing columns if they don't exist
    const columnsToAdd = [
      { name: 'means_of_identification', type: 'TEXT' },
      { name: 'guarantor_full_name', type: 'TEXT' },
      { name: 'guarantor_email', type: 'TEXT' },
      { name: 'guarantor_phone', type: 'TEXT' },
      { name: 'guarantor_home_address', type: 'TEXT' },
      { name: 'guarantor_office_address', type: 'TEXT' },
      { name: 'candidate_name', type: 'TEXT' }
    ];
    
    const existingColumns = structureCheck.rows.map(row => row.column_name);
    
    for (const column of columnsToAdd) {
      if (!existingColumns.includes(column.name)) {
        console.log(`➕ Adding column: ${column.name}`);
        await pool.query(`ALTER TABLE marketer_guarantor_form ADD COLUMN ${column.name} ${column.type};`);
        console.log(`✅ Added column: ${column.name}`);
      } else {
        console.log(`⏭️ Column already exists: ${column.name}`);
      }
    }
    
    // Step 3: Check if we have any existing data
    const countCheck = await pool.query(`
      SELECT COUNT(*) as count FROM marketer_guarantor_form;
    `);
    
    console.log('📊 Total guarantor records:', countCheck.rows[0].count);
    
    if (parseInt(countCheck.rows[0].count) > 0) {
      // Step 4: Get existing data to see what we have
      const existingData = await pool.query(`
        SELECT 
          id, marketer_id, is_candidate_well_known, relationship, known_duration, occupation,
          means_of_identification, guarantor_full_name, guarantor_email, guarantor_phone,
          guarantor_home_address, guarantor_office_address, candidate_name,
          created_at
        FROM marketer_guarantor_form 
        ORDER BY created_at DESC;
      `);
      
      console.log('📋 Existing guarantor data:');
      existingData.rows.forEach((row, index) => {
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
      
      // Step 5: Check if we need to migrate data from old structure
      // Look for records that have basic data but missing detailed data
      const incompleteRecords = existingData.rows.filter(row => 
        row.relationship && row.occupation && 
        (!row.guarantor_full_name || !row.guarantor_email || !row.guarantor_phone)
      );
      
      if (incompleteRecords.length > 0) {
        console.log(`⚠️ Found ${incompleteRecords.length} records with incomplete data`);
        console.log('📝 These records need data migration or manual completion');
      }
    }
    
    // Step 6: Check final table structure
    const finalStructure = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'marketer_guarantor_form'
      ORDER BY ordinal_position;
    `);
    
    console.log('📋 Final table structure:');
    finalStructure.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type}`);
    });
    
    console.log('✅ Guarantor structure migration completed!');
    
  } catch (error) {
    console.error('❌ Error during migration:', error);
  } finally {
    await pool.end();
  }
}

migrateGuarantorStructure();
