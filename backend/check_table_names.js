// check_table_names.js
// Check what tables exist in the database

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://vistapro_user:CHtvHVOsBXyVft3LZBnhqSHIFjTSHGem@dpg-d0stpo15pdvs7392u0j0-a.oregon-postgres.render.com/vistapro_qotw',
  ssl: { rejectUnauthorized: false }
});

async function checkTableNames() {
  try {
    console.log('🔍 Checking database tables...\n');
    
    const query = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE '%marketer%' OR table_name LIKE '%bio%' OR table_name LIKE '%guarantor%' OR table_name LIKE '%commitment%'
      ORDER BY table_name;
    `;
    
    const result = await pool.query(query);
    
    console.log(`📋 Found ${result.rows.length} relevant table(s):\n`);
    result.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });
    
  } catch (error) {
    console.error('❌ Error checking tables:', error);
  } finally {
    await pool.end();
  }
}

checkTableNames();

