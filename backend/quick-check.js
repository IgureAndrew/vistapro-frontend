const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function quickCheck() {
  try {
    // Check marketers
    const marketers = await pool.query("SELECT email, role, first_name, last_name FROM users WHERE role = 'Marketer' LIMIT 5");
    console.log('Marketers in database:');
    marketers.rows.forEach((user, i) => {
      console.log(`${i+1}. ${user.email} (${user.first_name} ${user.last_name})`);
    });
    
    // Check all users
    const allUsers = await pool.query("SELECT email, role FROM users ORDER BY created_at DESC LIMIT 10");
    console.log('\nAll users (latest 10):');
    allUsers.rows.forEach((user, i) => {
      console.log(`${i+1}. ${user.email} - ${user.role}`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

quickCheck();
