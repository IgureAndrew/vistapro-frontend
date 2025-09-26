// Quick debug of the issue
const { Pool } = require('pg');

const pool = new Pool({
  user: 'vistapro_user',
  password: 'vistapro_password',
  host: 'localhost',
  port: 5433,
  database: 'vistapro_dev',
  ssl: false
});

async function quickDebug() {
  try {
    console.log('🔍 Quick debug...');
    
    // Check Andu Eagle's ID
    const andu = await pool.query('SELECT id FROM users WHERE unique_id = $1', ['SM000005']);
    const anduId = andu.rows[0].id;
    console.log('Andu Eagle ID:', anduId);
    
    // Check what marketers are being returned
    const result = await pool.query(`
      SELECT 
        m.unique_id,
        m.first_name || ' ' || m.last_name as marketer_name,
        m.super_admin_id,
        m.admin_id,
        admin.first_name || ' ' || admin.last_name as admin_name,
        admin.super_admin_id as admin_super_admin_id
      FROM users m
      LEFT JOIN users admin ON admin.id = m.admin_id
      WHERE m.role = 'Marketer'
        AND (
          m.super_admin_id = $1
          OR
          (m.admin_id IS NOT NULL AND admin.super_admin_id = $1)
        )
      LIMIT 10
    `, [anduId]);
    
    console.log('Marketers found:', result.rows.length);
    result.rows.forEach(row => {
      console.log(`- ${row.marketer_name} (${row.unique_id})`);
      console.log(`  super_admin_id: ${row.super_admin_id}, admin_id: ${row.admin_id}`);
      console.log(`  admin: ${row.admin_name}, admin_super_admin_id: ${row.admin_super_admin_id}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

quickDebug();
