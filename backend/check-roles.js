const { Pool } = require('pg');

const pool = new Pool({
  user: 'vistapro_user',
  host: 'localhost',
  database: 'vistapro_dev',
  password: 'vistapro_password',
  port: 5433,
});

async function checkRoles() {
  try {
    const result = await pool.query('SELECT unique_id, first_name, last_name, role FROM users WHERE role IN (\'SuperAdmin\', \'MasterAdmin\', \'Admin\') ORDER BY role');
    console.log('📋 User roles in database:');
    result.rows.forEach(user => {
      console.log(`- ${user.first_name} ${user.last_name} (${user.unique_id}): ${user.role}`);
    });
    await pool.end();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkRoles();
