// check_all_forms_structure.js
// Check the structure of all form tables

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://vistapro_user:CHtvHVOsBXyVft3LZBnhqSHIFjTSHGem@dpg-d0stpo15pdvs7392u0j0-a.oregon-postgres.render.com/vistapro_qotw',
  ssl: { rejectUnauthorized: false }
});

async function checkAllFormsStructure() {
  try {
    const tables = ['marketer_biodata', 'marketer_guarantor_form', 'marketer_commitment_form'];
    
    for (const table of tables) {
      console.log(`\n${'='.repeat(80)}`);
      console.log(`Table: ${table}`);
      console.log(`${'='.repeat(80)}\n`);
      
      const query = `
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = '${table}'
        ORDER BY ordinal_position;
      `;
      
      const result = await pool.query(query);
      
      console.log(`Columns:`);
      result.rows.forEach(col => {
        console.log(`   - ${col.column_name} (${col.data_type})`);
      });
      
      // Show sample record
      const sampleQuery = `SELECT * FROM ${table} LIMIT 1;`;
      const sampleResult = await pool.query(sampleQuery);
      
      if (sampleResult.rows.length > 0) {
        console.log(`\nSample record:`);
        Object.entries(sampleResult.rows[0]).forEach(([key, value]) => {
          console.log(`   ${key}: ${value}`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking table structure:', error);
  } finally {
    await pool.end();
  }
}

checkAllFormsStructure();

