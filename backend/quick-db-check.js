// Quick database check
const { Pool } = require('pg');

const pool = new Pool({
  user: 'vistapro_user',
  password: 'vistapro_password',
  host: 'localhost',
  port: 5433,
  database: 'vistapro_dev',
  ssl: false
});

async function quickCheck() {
  try {
    console.log('Starting check...');
    
    // Check for Andu Eagle
    const result = await pool.query(`
      SELECT unique_id, first_name, last_name, role
      FROM users 
      WHERE first_name ILIKE '%andu%' OR last_name ILIKE '%eagle%'
    `);
    
    console.log('Results:', result.rows.length);
    result.rows.forEach(row => {
      console.log(`${row.first_name} ${row.last_name} (${row.unique_id}) [${row.role}]`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

quickCheck();
