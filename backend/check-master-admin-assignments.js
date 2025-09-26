// Check Master Admin user assignments for Andu Eagle
const { Pool } = require('pg');

const pool = new Pool({
  user: 'vistapro_user',
  password: 'vistapro_password',
  host: 'localhost',
  port: 5433,
  database: 'vistapro_dev',
  ssl: false
});

async function checkMasterAdminAssignments() {
  try {
    console.log('🔍 Checking Master Admin user assignments...');
    
    // First, let's see all users with "Andu" in their name
    const anduUsers = await pool.query(`
      SELECT unique_id, first_name, last_name, role, email, username
      FROM users 
      WHERE first_name ILIKE '%andu%' OR last_name ILIKE '%andu%'
      ORDER BY created_at
    `);
    
    console.log(`📊 Users with "Andu" in name (${anduUsers.rows.length}):`);
    anduUsers.rows.forEach(row => {
      console.log(`  - ${row.first_name} ${row.last_name} (${row.unique_id}) [${row.role}] - ${row.email}`);
    });
    
    // Check all SuperAdmins
    const superAdmins = await pool.query(`
      SELECT unique_id, first_name, last_name, role, email, username
      FROM users 
      WHERE role = 'SuperAdmin'
      ORDER BY created_at
    `);
    
    console.log(`\n👑 All SuperAdmins (${superAdmins.rows.length}):`);
    superAdmins.rows.forEach(row => {
      console.log(`  - ${row.first_name} ${row.last_name} (${row.unique_id}) [${row.role}] - ${row.email}`);
    });
    
    // Check all assignments
    const allAssignments = await pool.query(`
      SELECT 
        ua.id,
        ua.marketer_id,
        ua.assigned_to_id,
        ua.assignment_type,
        ua.is_active,
        ua.assigned_at,
        m.first_name || ' ' || m.last_name as marketer_name,
        m.role as marketer_role,
        a.first_name || ' ' || a.last_name as assigned_to_name,
        a.role as assigned_to_role
      FROM user_assignments ua
      LEFT JOIN users m ON m.unique_id = ua.marketer_id
      LEFT JOIN users a ON a.unique_id = ua.assigned_to_id
      ORDER BY ua.assigned_at DESC
    `);
    
    console.log(`\n📋 All user assignments (${allAssignments.rows.length}):`);
    allAssignments.rows.forEach(row => {
      console.log(`  - ID: ${row.id}`);
      console.log(`    Marketer: ${row.marketer_name} (${row.marketer_id}) [${row.marketer_role}]`);
      console.log(`    Assigned to: ${row.assigned_to_name} (${row.assigned_to_id}) [${row.assigned_to_role}]`);
      console.log(`    Type: ${row.assignment_type}, Active: ${row.is_active}`);
      console.log(`    Date: ${row.assigned_at}`);
      console.log('');
    });
    
    // Look for any assignments involving "Andu" or "Eagle"
    const anduAssignments = await pool.query(`
      SELECT 
        ua.id,
        ua.marketer_id,
        ua.assigned_to_id,
        ua.assignment_type,
        ua.is_active,
        m.first_name || ' ' || m.last_name as marketer_name,
        m.role as marketer_role,
        a.first_name || ' ' || a.last_name as assigned_to_name,
        a.role as assigned_to_role
      FROM user_assignments ua
      LEFT JOIN users m ON m.unique_id = ua.marketer_id
      LEFT JOIN users a ON a.unique_id = ua.assigned_to_id
      WHERE 
        (m.first_name ILIKE '%andu%' OR m.last_name ILIKE '%andu%' OR
         m.first_name ILIKE '%eagle%' OR m.last_name ILIKE '%eagle%' OR
         a.first_name ILIKE '%andu%' OR a.last_name ILIKE '%andu%' OR
         a.first_name ILIKE '%eagle%' OR a.last_name ILIKE '%eagle%')
      ORDER BY ua.assigned_at DESC
    `);
    
    console.log(`\n🔍 Assignments involving "Andu" or "Eagle" (${anduAssignments.rows.length}):`);
    anduAssignments.rows.forEach(row => {
      console.log(`  - ID: ${row.id}`);
      console.log(`    Marketer: ${row.marketer_name} (${row.marketer_id}) [${row.marketer_role}]`);
      console.log(`    Assigned to: ${row.assigned_to_name} (${row.assigned_to_id}) [${row.assigned_to_role}]`);
      console.log(`    Type: ${row.assignment_type}, Active: ${row.is_active}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

checkMasterAdminAssignments();
