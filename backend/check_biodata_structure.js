// check_biodata_structure.js
// Check the structure of marketer_biodata table

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://vistapro_user:CHtvHVOsBXyVft3LZBnhqSHIFjTSHGem@dpg-d0stpo15pdvs7392u0j0-a.oregon-postgres.render.com/vistapro_qotw',
  ssl: { rejectUnauthorized: false }
});

async function checkBiodataStructure() {
  try {
    console.log('🔍 Checking marketer_biodata table structure...\n');
    
    const query = `
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'marketer_biodata'
      ORDER BY ordinal_position;
    `;
    
    const result = await pool.query(query);
    
    console.log(`Columns in marketer_biodata:\n`);
    result.rows.forEach(col => {
      console.log(`   - ${col.column_name} (${col.data_type})`);
    });
    
    // Also check a few sample records
    console.log(`\n\n📋 Sample records from marketer_biodata:\n`);
    const sampleQuery = `SELECT * FROM marketer_biodata LIMIT 3;`;
    const sampleResult = await pool.query(sampleQuery);
    
    if (sampleResult.rows.length > 0) {
      sampleResult.rows.forEach((row, index) => {
        console.log(`\nRecord ${index + 1}:`);
        Object.entries(row).forEach(([key, value]) => {
          console.log(`   ${key}: ${value}`);
        });
      });
    } else {
      console.log('   No records found.');
    }
    
  } catch (error) {
    console.error('❌ Error checking table structure:', error);
  } finally {
    await pool.end();
  }
}

checkBiodataStructure();

