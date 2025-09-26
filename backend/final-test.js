// Final test to see what's happening
const { Pool } = require('pg');

const pool = new Pool({
  user: 'vistapro_user',
  password: 'vistapro_password',
  host: 'localhost',
  port: 5433,
  database: 'vistapro_dev',
  ssl: false
});

async function finalTest() {
  try {
    console.log('Testing...');
    
    // Get Andu Eagle's ID
    const andu = await pool.query('SELECT id FROM users WHERE unique_id = $1', ['SM000005']);
    console.log('Andu ID:', andu.rows[0].id);
    
    // Test the exact query from the controller
    const result = await pool.query(`
      SELECT 
        o.id,
        o.status,
        o.sold_amount,
        m.unique_id AS marketer_unique_id,
        m.first_name || ' ' || m.last_name AS marketer_name,
        admin.unique_id AS admin_unique_id,
        admin.first_name || ' ' || admin.last_name AS admin_name
      FROM users m
      JOIN orders o ON o.marketer_id = m.id
      LEFT JOIN users admin ON admin.id = m.admin_id
      WHERE m.role = 'Marketer'
        AND (
          m.super_admin_id = $1
          OR
          (m.admin_id IS NOT NULL AND admin.super_admin_id = $1)
        )
      ORDER BY o.created_at DESC
      LIMIT 5
    `, [andu.rows[0].id]);
    
    console.log('Results:', result.rows.length);
    result.rows.forEach(row => {
      console.log(`${row.marketer_name} -> ${row.admin_name || 'None'}`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

finalTest();
