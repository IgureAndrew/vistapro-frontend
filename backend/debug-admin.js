const { pool } = require('./src/config/database');

async function debugAdmin() {
  console.log('🔍 Debugging admin ID 184...');
  
  try {
    // Check if admin ID 184 exists
    console.log('1. Checking if admin ID 184 exists...');
    const admin = await pool.query('SELECT id, unique_id, first_name, last_name, role FROM users WHERE id = 184');
    if (admin.rows.length > 0) {
      console.log('✅ Admin found:', admin.rows[0]);
    } else {
      console.log('❌ Admin ID 184 not found!');
    }
    
    // Check all admins
    console.log('2. Checking all admins...');
    const allAdmins = await pool.query('SELECT id, unique_id, first_name, last_name, role FROM users WHERE role = \'Admin\' ORDER BY id');
    console.log('✅ All admins found:', allAdmins.rows.length);
    allAdmins.rows.forEach(admin => {
      console.log(`   - ID: ${admin.id}, Unique: ${admin.unique_id}, Name: ${admin.first_name} ${admin.last_name}`);
    });
    
    // Check the specific verification submission
    console.log('3. Checking verification submission details...');
    const submission = await pool.query(`
      SELECT vs.*, u.first_name, u.last_name, u.unique_id as marketer_unique_id
      FROM verification_submissions vs
      JOIN users u ON vs.marketer_id = u.id
      WHERE vs.id = 1
    `);
    if (submission.rows.length > 0) {
      console.log('✅ Submission found:', submission.rows[0]);
    } else {
      console.log('❌ Submission not found!');
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  } finally {
    await pool.end();
  }
}

debugAdmin();

