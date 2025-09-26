const { pool } = require('./src/config/database');

async function checkRealUsers() {
  try {
    console.log('🔍 Checking real users in database...\n');

    const result = await pool.query(`
      SELECT id, email, role, first_name, last_name, phone
      FROM users 
      ORDER BY role, id
    `);

    console.log(`Found ${result.rows.length} users:\n`);
    
    result.rows.forEach(user => {
      console.log(`ID: ${user.id} | Role: ${user.role} | Email: ${user.email}`);
      console.log(`  Name: ${user.first_name || ''} ${user.last_name || ''}`);
      console.log(`  Phone: ${user.phone || 'Not set'}\n`);
    });

  } catch (error) {
    console.error('❌ Error checking users:', error);
  } finally {
    await pool.end();
  }
}

checkRealUsers();
