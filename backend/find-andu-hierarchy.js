// Find the correct Andu user and verify the hierarchy
const { Pool } = require('pg');

const pool = new Pool({
  user: 'vistapro_user',
  password: 'vistapro_password',
  host: 'localhost',
  port: 5433,
  database: 'vistapro_dev',
  ssl: false
});

async function findAnduHierarchy() {
  try {
    console.log('🔍 Searching for "Andu" user...');
    
    // Search for users with "Andu" in name
    const anduResult = await pool.query(`
      SELECT unique_id, first_name, last_name, role, email
      FROM users 
      WHERE first_name ILIKE '%andu%' OR last_name ILIKE '%andu%'
    `);
    
    console.log(`📊 Found ${anduResult.rows.length} users matching "Andu":`);
    anduResult.rows.forEach(row => {
      console.log(`  - ${row.first_name} ${row.last_name} (${row.unique_id}) [${row.role}] - ${row.email}`);
    });
    
    // Search for all SuperAdmins
    const superAdminsResult = await pool.query(`
      SELECT unique_id, first_name, last_name, role, email
      FROM users 
      WHERE role = 'SuperAdmin'
      ORDER BY created_at
    `);
    
    console.log(`\n👑 All SuperAdmins in database (${superAdminsResult.rows.length}):`);
    superAdminsResult.rows.forEach(row => {
      console.log(`  - ${row.first_name} ${row.last_name} (${row.unique_id}) [${row.role}] - ${row.email}`);
    });
    
    // Search for "Andrei" users
    const andreiResult = await pool.query(`
      SELECT unique_id, first_name, last_name, role, email
      FROM users 
      WHERE first_name ILIKE '%andrei%' OR last_name ILIKE '%andrei%'
    `);
    
    console.log(`\n👤 Found ${andreiResult.rows.length} users matching "Andrei":`);
    andreiResult.rows.forEach(row => {
      console.log(`  - ${row.first_name} ${row.last_name} (${row.unique_id}) [${row.role}] - ${row.email}`);
    });
    
    // Search for "leo smith"
    const leoResult = await pool.query(`
      SELECT unique_id, first_name, last_name, role, email
      FROM users 
      WHERE first_name ILIKE '%leo%' AND last_name ILIKE '%smith%'
    `);
    
    console.log(`\n👤 Found ${leoResult.rows.length} users matching "leo smith":`);
    leoResult.rows.forEach(row => {
      console.log(`  - ${row.first_name} ${row.last_name} (${row.unique_id}) [${row.role}] - ${row.email}`);
    });
    
    // Check all assignments involving these users
    console.log('\n🔗 Checking all assignments...');
    const allAssignments = await pool.query(`
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
         m.first_name ILIKE '%andrei%' OR m.last_name ILIKE '%andrei%' OR
         m.first_name ILIKE '%leo%' OR m.last_name ILIKE '%leo%' OR
         a.first_name ILIKE '%andu%' OR a.last_name ILIKE '%andu%' OR
         a.first_name ILIKE '%andrei%' OR a.last_name ILIKE '%andrei%' OR
         a.first_name ILIKE '%leo%' OR a.last_name ILIKE '%leo%')
      ORDER BY ua.assigned_at DESC
    `);
    
    console.log(`\n📋 Relevant assignments (${allAssignments.rows.length}):`);
    allAssignments.rows.forEach(row => {
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

findAnduHierarchy();
