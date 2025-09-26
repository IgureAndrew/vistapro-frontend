// Simple database check
const { Pool } = require('pg');

const pool = new Pool({
  user: 'vistapro_user',
  password: 'vistapro_password',
  host: 'localhost',
  port: 5433,
  database: 'vistapro_dev',
  ssl: false
});

async function simpleCheck() {
  try {
    console.log('Starting database check...');
    
    // Check for Andu Eagle
    const anduResult = await pool.query(`
      SELECT unique_id, first_name, last_name, role
      FROM users 
      WHERE first_name ILIKE '%andu%' OR last_name ILIKE '%eagle%'
    `);
    
    console.log('Andu/Eagle users:', anduResult.rows.length);
    anduResult.rows.forEach(row => {
      console.log(`${row.first_name} ${row.last_name} (${row.unique_id}) [${row.role}]`);
    });
    
    // Check all SuperAdmins
    const superAdmins = await pool.query(`
      SELECT unique_id, first_name, last_name, role
      FROM users 
      WHERE role = 'SuperAdmin'
    `);
    
    console.log('\nSuperAdmins:', superAdmins.rows.length);
    superAdmins.rows.forEach(row => {
      console.log(`${row.first_name} ${row.last_name} (${row.unique_id}) [${row.role}]`);
    });
    
    // Check all assignments
    const assignments = await pool.query(`
      SELECT 
        ua.id,
        ua.marketer_id,
        ua.assigned_to_id,
        ua.assignment_type,
        m.first_name || ' ' || m.last_name as marketer_name,
        a.first_name || ' ' || a.last_name as assigned_to_name
      FROM user_assignments ua
      LEFT JOIN users m ON m.unique_id = ua.marketer_id
      LEFT JOIN users a ON a.unique_id = ua.assigned_to_id
      ORDER BY ua.id
    `);
    
    console.log('\nAll assignments:', assignments.rows.length);
    assignments.rows.forEach(row => {
      console.log(`${row.marketer_name} → ${row.assigned_to_name} [${row.assignment_type}]`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

simpleCheck();
