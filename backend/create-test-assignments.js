// Create test user assignments for hierarchical filtering
const { Pool } = require('pg');

const pool = new Pool({
  user: 'vistapro_user',
  password: 'vistapro_password',
  host: 'localhost',
  port: 5433,
  database: 'vistapro_dev',
  ssl: false
});

async function createTestAssignments() {
  try {
    console.log('🔍 Creating test user assignments...');
    
    // Get some users of each role
    const superAdmins = await pool.query(`
      SELECT unique_id, first_name, last_name 
      FROM users 
      WHERE role = 'SuperAdmin' 
      LIMIT 2
    `);
    
    const admins = await pool.query(`
      SELECT unique_id, first_name, last_name 
      FROM users 
      WHERE role = 'Admin' 
      LIMIT 3
    `);
    
    const marketers = await pool.query(`
      SELECT unique_id, first_name, last_name 
      FROM users 
      WHERE role = 'Marketer' 
      LIMIT 10
    `);
    
    console.log(`📊 Found: ${superAdmins.rows.length} SuperAdmins, ${admins.rows.length} Admins, ${marketers.rows.length} Marketers`);
    
    if (superAdmins.rows.length === 0 || admins.rows.length === 0 || marketers.rows.length === 0) {
      console.log('❌ Not enough users to create assignments');
      return;
    }
    
    // Create assignments: SuperAdmin -> Admin
    console.log('\n🔗 Creating SuperAdmin -> Admin assignments...');
    for (let i = 0; i < Math.min(2, admins.rows.length); i++) {
      const superAdmin = superAdmins.rows[0]; // Use first SuperAdmin
      const admin = admins.rows[i];
      
      await pool.query(`
        INSERT INTO user_assignments (marketer_id, assigned_to_id, assignment_type, is_active, assigned_at)
        VALUES ($1, $2, 'superadmin', true, NOW())
        ON CONFLICT (marketer_id, assignment_type) WHERE is_active = true
        DO NOTHING
      `, [admin.unique_id, superAdmin.unique_id]);
      
      console.log(`  ✅ Assigned Admin ${admin.first_name} ${admin.last_name} (${admin.unique_id}) to SuperAdmin ${superAdmin.first_name} ${superAdmin.last_name} (${superAdmin.unique_id})`);
    }
    
    // Create assignments: Admin -> Marketer
    console.log('\n🔗 Creating Admin -> Marketer assignments...');
    for (let i = 0; i < Math.min(5, marketers.rows.length); i++) {
      const admin = admins.rows[i % admins.rows.length]; // Cycle through admins
      const marketer = marketers.rows[i];
      
      await pool.query(`
        INSERT INTO user_assignments (marketer_id, assigned_to_id, assignment_type, is_active, assigned_at)
        VALUES ($1, $2, 'admin', true, NOW())
        ON CONFLICT (marketer_id, assignment_type) WHERE is_active = true
        DO NOTHING
      `, [marketer.unique_id, admin.unique_id]);
      
      console.log(`  ✅ Assigned Marketer ${marketer.first_name} ${marketer.last_name} (${marketer.unique_id}) to Admin ${admin.first_name} ${admin.last_name} (${admin.unique_id})`);
    }
    
    // Create some direct SuperAdmin -> Marketer assignments
    console.log('\n🔗 Creating direct SuperAdmin -> Marketer assignments...');
    for (let i = 5; i < Math.min(8, marketers.rows.length); i++) {
      const superAdmin = superAdmins.rows[0]; // Use first SuperAdmin
      const marketer = marketers.rows[i];
      
      await pool.query(`
        INSERT INTO user_assignments (marketer_id, assigned_to_id, assignment_type, is_active, assigned_at)
        VALUES ($1, $2, 'superadmin', true, NOW())
        ON CONFLICT (marketer_id, assignment_type) WHERE is_active = true
        DO NOTHING
      `, [marketer.unique_id, superAdmin.unique_id]);
      
      console.log(`  ✅ Directly assigned Marketer ${marketer.first_name} ${marketer.last_name} (${marketer.unique_id}) to SuperAdmin ${superAdmin.first_name} ${superAdmin.last_name} (${superAdmin.unique_id})`);
    }
    
    // Verify assignments
    const assignmentsResult = await pool.query(`
      SELECT 
        ua.marketer_id,
        ua.assigned_to_id,
        ua.assignment_type,
        m.first_name || ' ' || m.last_name as marketer_name,
        a.first_name || ' ' || a.last_name as assigned_to_name
      FROM user_assignments ua
      JOIN users m ON m.unique_id = ua.marketer_id
      JOIN users a ON a.unique_id = ua.assigned_to_id
      WHERE ua.is_active = true
      ORDER BY ua.assignment_type, ua.marketer_id
    `);
    
    console.log(`\n📋 Created ${assignmentsResult.rows.length} assignments:`);
    assignmentsResult.rows.forEach(row => {
      console.log(`  - ${row.marketer_name} (${row.marketer_id}) -> ${row.assigned_to_name} (${row.assigned_to_id}) [${row.assignment_type}]`);
    });
    
  } catch (error) {
    console.error('❌ Error creating assignments:', error);
  } finally {
    await pool.end();
  }
}

createTestAssignments();
