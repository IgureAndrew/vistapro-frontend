// Check the actual assignments in the live database
const { Pool } = require('pg');

const livePool = new Pool({
  connectionString: 'postgresql://vistapro_user:CHtvHVOsBXyVft3LZBnhqSHIFjTSHGem@dpg-d0stpo15pdvs7392u0j0-a.oregon-postgres.render.com/vistapro_qotw',
  ssl: { rejectUnauthorized: false }
});

async function checkLiveAssignments() {
  try {
    console.log('🔍 Checking live database assignments...');
    
    // Check the hierarchy using admin_id and super_admin_id columns
    const hierarchy = await livePool.query(`
      SELECT 
        u.unique_id,
        u.first_name || ' ' || u.last_name as user_name,
        u.role,
        u.email,
        u.admin_id,
        u.super_admin_id,
        admin.first_name || ' ' || admin.last_name as admin_name,
        superadmin.first_name || ' ' || superadmin.last_name as superadmin_name
      FROM users u
      LEFT JOIN users admin ON admin.id = u.admin_id
      LEFT JOIN users superadmin ON superadmin.id = u.super_admin_id
      WHERE u.unique_id IN ('SM000005', 'ASM000021', 'DSR00093')
      ORDER BY u.unique_id
    `);
    
    console.log('👥 Key users and their assignments:');
    hierarchy.rows.forEach(row => {
      console.log(`\n  - ${row.user_name} (${row.unique_id}) [${row.role}]`);
      console.log(`    Email: ${row.email}`);
      console.log(`    Admin ID: ${row.admin_id} (${row.admin_name || 'None'})`);
      console.log(`    Super Admin ID: ${row.super_admin_id} (${row.superadmin_name || 'None'})`);
    });
    
    // Check all users with assignments
    const allAssignments = await livePool.query(`
      SELECT 
        u.unique_id,
        u.first_name || ' ' || u.last_name as user_name,
        u.role,
        u.admin_id,
        u.super_admin_id,
        admin.first_name || ' ' || admin.last_name as admin_name,
        superadmin.first_name || ' ' || superadmin.last_name as superadmin_name
      FROM users u
      LEFT JOIN users admin ON admin.id = u.admin_id
      LEFT JOIN users superadmin ON superadmin.id = u.super_admin_id
      WHERE u.admin_id IS NOT NULL OR u.super_admin_id IS NOT NULL
      ORDER BY u.role, u.unique_id
    `);
    
    console.log('\n📊 All users with assignments:');
    allAssignments.rows.forEach(row => {
      console.log(`\n  - ${row.user_name} (${row.unique_id}) [${row.role}]`);
      if (row.admin_id) {
        console.log(`    → Assigned to Admin: ${row.admin_name} (ID: ${row.admin_id})`);
      }
      if (row.super_admin_id) {
        console.log(`    → Assigned to SuperAdmin: ${row.superadmin_name} (ID: ${row.super_admin_id})`);
      }
    });
    
    // Check the complete hierarchy for Andu Eagle
    console.log('\n🔍 Complete hierarchy for Andu Eagle:');
    const anduHierarchy = await livePool.query(`
      WITH RECURSIVE hierarchy AS (
        -- Start with Andu Eagle
        SELECT 
          u.id,
          u.unique_id,
          u.first_name || ' ' || u.last_name as user_name,
          u.role,
          u.admin_id,
          u.super_admin_id,
          0 as level
        FROM users u
        WHERE u.unique_id = 'SM000005'
        
        UNION ALL
        
        -- Get users assigned to the current level
        SELECT 
          u.id,
          u.unique_id,
          u.first_name || ' ' || u.last_name as user_name,
          u.role,
          u.admin_id,
          u.super_admin_id,
          h.level + 1
        FROM users u
        JOIN hierarchy h ON (u.admin_id = h.id OR u.super_admin_id = h.id)
        WHERE h.level < 3
      )
      SELECT * FROM hierarchy ORDER BY level, role, unique_id
    `);
    
    anduHierarchy.rows.forEach(row => {
      const indent = '  '.repeat(row.level);
      console.log(`${indent}- ${row.user_name} (${row.unique_id}) [${row.role}]`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await livePool.end();
  }
}

checkLiveAssignments();
