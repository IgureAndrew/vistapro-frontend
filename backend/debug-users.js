const { pool } = require('./src/config/database');

async function debugUsers() {
  console.log('🔍 Debugging users and verification submissions...');
  
  try {
    // Check existing users
    console.log('1. Checking existing users...');
    const users = await pool.query('SELECT id, unique_id, first_name, last_name, role FROM users ORDER BY id LIMIT 10');
    console.log('✅ Users found:', users.rows.length);
    users.rows.forEach(user => {
      console.log(`   - ID: ${user.id}, Unique: ${user.unique_id}, Name: ${user.first_name} ${user.last_name}, Role: ${user.role}`);
    });
    
    // Check verification submissions
    console.log('2. Checking verification submissions...');
    const submissions = await pool.query(`
      SELECT vs.*, u.first_name, u.last_name, u.unique_id as marketer_unique_id
      FROM verification_submissions vs
      JOIN users u ON vs.marketer_id = u.id
      ORDER BY vs.id
    `);
    console.log('✅ Verification submissions found:', submissions.rows.length);
    submissions.rows.forEach(sub => {
      console.log(`   - ID: ${sub.id}, Marketer: ${sub.first_name} ${sub.last_name} (${sub.marketer_unique_id}), Status: ${sub.submission_status}, Admin ID: ${sub.admin_id}`);
    });
    
    // Check admin assignments
    console.log('3. Checking admin assignments...');
    const adminAssignments = await pool.query(`
      SELECT u.id, u.unique_id, u.first_name, u.last_name, u.role, u.admin_id
      FROM users u 
      WHERE u.role = 'Marketer' AND u.admin_id IS NOT NULL
      ORDER BY u.admin_id
    `);
    console.log('✅ Marketers with admin assignments:', adminAssignments.rows.length);
    adminAssignments.rows.forEach(marketer => {
      console.log(`   - Marketer: ${marketer.first_name} ${marketer.last_name} (${marketer.unique_id}) -> Admin ID: ${marketer.admin_id}`);
    });
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  } finally {
    await pool.end();
  }
}

debugUsers();
