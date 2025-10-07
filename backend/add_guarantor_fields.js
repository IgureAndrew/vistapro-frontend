const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false
});

async function addGuarantorFields() {
  try {
    console.log('🔍 Adding missing guarantor form fields...');
    
    // Check if columns already exist
    const columnCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'marketer_guarantor_form' 
      AND column_name IN ('means_of_identification', 'guarantor_full_name', 'guarantor_email', 'guarantor_phone', 'guarantor_home_address', 'guarantor_office_address', 'candidate_name');
    `);
    
    const existingColumns = columnCheck.rows.map(row => row.column_name);
    console.log('📋 Existing columns:', existingColumns);
    
    // Add missing columns
    const columnsToAdd = [
      { name: 'means_of_identification', type: 'TEXT' },
      { name: 'guarantor_full_name', type: 'TEXT' },
      { name: 'guarantor_email', type: 'TEXT' },
      { name: 'guarantor_phone', type: 'TEXT' },
      { name: 'guarantor_home_address', type: 'TEXT' },
      { name: 'guarantor_office_address', type: 'TEXT' },
      { name: 'candidate_name', type: 'TEXT' }
    ];
    
    for (const column of columnsToAdd) {
      if (!existingColumns.includes(column.name)) {
        console.log(`➕ Adding column: ${column.name}`);
        await pool.query(`ALTER TABLE marketer_guarantor_form ADD COLUMN ${column.name} ${column.type};`);
        console.log(`✅ Added column: ${column.name}`);
      } else {
        console.log(`⏭️ Column already exists: ${column.name}`);
      }
    }
    
    // Check final table structure
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
    
    console.log('✅ Guarantor form fields migration completed!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

addGuarantorFields();
