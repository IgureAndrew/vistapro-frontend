const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function createTestMarketer() {
  try {
    console.log('🔧 Creating test marketer account...');
    
    const email = 'leo@gmail.com';
    const password = 'password123';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Check if user already exists
    const existingUser = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      console.log('❌ User already exists with email:', email);
      console.log('User details:', existingUser.rows[0]);
      return;
    }
    
    // Create new marketer
    const result = await pool.query(`
      INSERT INTO users (
        unique_id, email, password, first_name, last_name, role, 
        email_verified, is_active, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW()
      ) RETURNING *
    `, [
      'MK' + Date.now().toString().slice(-6), // Generate unique ID
      email,
      hashedPassword,
      'Leo',
      'Test',
      'Marketer',
      true, // Email verified
      true  // Active
    ]);
    
    console.log('✅ Test marketer created successfully!');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('Role: Marketer');
    console.log('Unique ID:', result.rows[0].unique_id);
    
  } catch (error) {
    console.error('❌ Error creating test marketer:', error.message);
  } finally {
    await pool.end();
  }
}

createTestMarketer();
