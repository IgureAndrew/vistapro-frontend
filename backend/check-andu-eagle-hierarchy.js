// Check for Andu Eagle and the correct hierarchy
const { Pool } = require('pg');

const pool = new Pool({
  user: 'vistapro_user',
  password: 'vistapro_password',
  host: 'localhost',
  port: 5433,
  database: 'vistapro_dev',
  ssl: false
});

async function checkAnduEagleHierarchy() {
  try {
    console.log('🔍 Searching for "Andu Eagle" SuperAdmin...');
    
    // Search for "Andu Eagle" specifically
    const anduEagleResult = await pool.query(`
      SELECT unique_id, first_name, last_name, role, email, username
      FROM users 
      WHERE (first_name ILIKE '%andu%' AND last_name ILIKE '%eagle%') OR
            (first_name ILIKE '%eagle%' AND last_name ILIKE '%andu%')
    `);
    
    console.log(`📊 Found ${anduEagleResult.rows.length} users matching "Andu Eagle":`);
    anduEagleResult.rows.forEach(row => {
      console.log(`  - ${row.first_name} ${row.last_name} (${row.unique_id}) [${row.role}] - ${row.email} - @${row.username}`);
    });
    
    // Search for "Andu" in first name and "Eagle" in last name separately
    const anduResult = await pool.query(`
      SELECT unique_id, first_name, last_name, role, email, username
      FROM users 
      WHERE first_name ILIKE '%andu%'
    `);
    
    console.log(`\n📊 Found ${anduResult.rows.length} users with "Andu" in first name:`);
    anduResult.rows.forEach(row => {
      console.log(`  - ${row.first_name} ${row.last_name} (${row.unique_id}) [${row.role}] - ${row.email} - @${row.username}`);
    });
    
    const eagleResult = await pool.query(`
      SELECT unique_id, first_name, last_name, role, email, username
      FROM users 
      WHERE last_name ILIKE '%eagle%'
    `);
    
    console.log(`\n📊 Found ${eagleResult.rows.length} users with "Eagle" in last name:`);
    eagleResult.rows.forEach(row => {
      console.log(`  - ${row.first_name} ${row.last_name} (${row.unique_id}) [${row.role}] - ${row.email} - @${row.username}`);
    });
    
    // Check the current hierarchy: Andrei → leo smith
    console.log('\n🔗 Checking Andrei → leo smith assignment...');
    const andreiToLeo = await pool.query(`
      SELECT 
        ua.id,
        ua.marketer_id,
        ua.assigned_to_id,
        ua.assignment_type,
        ua.is_active,
        m.first_name || ' ' || m.last_name as marketer_name,
        a.first_name || ' ' || a.last_name as assigned_to_name
      FROM user_assignments ua
      LEFT JOIN users m ON m.unique_id = ua.marketer_id
      LEFT JOIN users a ON a.unique_id = ua.assigned_to_id
      WHERE m.unique_id = 'DSR00093' AND a.unique_id = 'ASM000021'
    `);
    
    console.log(`\n📋 leo smith (DSR00093) → Andrei (ASM000021): ${andreiToLeo.rows.length} assignments`);
    andreiToLeo.rows.forEach(row => {
      console.log(`  - ${row.marketer_name} → ${row.assigned_to_name} [${row.assignment_type}] Active: ${row.is_active}`);
    });
    
    // Check if Andrei is assigned to any SuperAdmin
    console.log('\n🔗 Checking Andrei assignments to SuperAdmins...');
    const andreiToSuperAdmin = await pool.query(`
      SELECT 
        ua.id,
        ua.marketer_id,
        ua.assigned_to_id,
        ua.assignment_type,
        ua.is_active,
        m.first_name || ' ' || m.last_name as marketer_name,
        a.first_name || ' ' || a.last_name as assigned_to_name,
        a.role as assigned_to_role
      FROM user_assignments ua
      LEFT JOIN users m ON m.unique_id = ua.marketer_id
      LEFT JOIN users a ON a.unique_id = ua.assigned_to_id
      WHERE m.unique_id = 'ASM000021' AND a.role = 'SuperAdmin'
    `);
    
    console.log(`\n📋 Andrei (ASM000021) → SuperAdmins: ${andreiToSuperAdmin.rows.length} assignments`);
    andreiToSuperAdmin.rows.forEach(row => {
      console.log(`  - ${row.marketer_name} → ${row.assigned_to_name} [${row.assigned_to_role}] [${row.assignment_type}] Active: ${row.is_active}`);
    });
    
    // Check all SuperAdmins in the system
    console.log('\n👑 All SuperAdmins in the system:');
    const allSuperAdmins = await pool.query(`
      SELECT unique_id, first_name, last_name, role, email, username
      FROM users 
      WHERE role = 'SuperAdmin'
      ORDER BY created_at
    `);
    
    console.log(`Found ${allSuperAdmins.rows.length} SuperAdmins:`);
    allSuperAdmins.rows.forEach(row => {
      console.log(`  - ${row.first_name} ${row.last_name} (${row.unique_id}) [${row.role}] - ${row.email} - @${row.username}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

checkAnduEagleHierarchy();
