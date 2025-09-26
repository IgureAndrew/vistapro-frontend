// Find the correct SuperAdmin and verify the complete hierarchy
const { Pool } = require('pg');

const pool = new Pool({
  user: 'vistapro_user',
  password: 'vistapro_password',
  host: 'localhost',
  port: 5433,
  database: 'vistapro_dev',
  ssl: false
});

async function findCorrectSuperAdmin() {
  try {
    console.log('🔍 Searching for all possible SuperAdmin variations...');
    
    // Search for users with "andu" in any part of the name
    const anduVariations = await pool.query(`
      SELECT unique_id, first_name, last_name, role, email, created_at
      FROM users 
      WHERE first_name ILIKE '%andu%' OR last_name ILIKE '%andu%' OR
            first_name ILIKE '%and%' OR last_name ILIKE '%and%'
      ORDER BY created_at
    `);
    
    console.log(`📊 Found ${anduVariations.rows.length} users with "and" variations:`);
    anduVariations.rows.forEach(row => {
      console.log(`  - ${row.first_name} ${row.last_name} (${row.unique_id}) [${row.role}] - ${row.email}`);
    });
    
    // Check if there's a user with "andu" as username or email
    const anduExact = await pool.query(`
      SELECT unique_id, first_name, last_name, role, email, username
      FROM users 
      WHERE username ILIKE '%andu%' OR email ILIKE '%andu%'
    `);
    
    console.log(`\n📧 Found ${anduExact.rows.length} users with "andu" in username/email:`);
    anduExact.rows.forEach(row => {
      console.log(`  - ${row.first_name} ${row.last_name} (${row.unique_id}) [${row.role}] - ${row.email} - @${row.username}`);
    });
    
    // Check the current hierarchy: SAMOD → Andrei → leo smith
    console.log('\n🔗 Current hierarchy analysis:');
    
    // Check if leo smith is assigned to Andrei
    const leoToAndrei = await pool.query(`
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
    
    console.log(`\n📋 leo smith (DSR00093) → Andrei (ASM000021): ${leoToAndrei.rows.length} assignments`);
    leoToAndrei.rows.forEach(row => {
      console.log(`  - ${row.marketer_name} → ${row.assigned_to_name} [${row.assignment_type}] Active: ${row.is_active}`);
    });
    
    // Check if Andrei is assigned to SAMOD
    const andreiToSamod = await pool.query(`
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
      WHERE m.unique_id = 'ASM000021' AND a.unique_id = 'DSR00087'
    `);
    
    console.log(`\n📋 Andrei (ASM000021) → SAMOD (DSR00087): ${andreiToSamod.rows.length} assignments`);
    andreiToSamod.rows.forEach(row => {
      console.log(`  - ${row.marketer_name} → ${row.assigned_to_name} [${row.assignment_type}] Active: ${row.is_active}`);
    });
    
    // Check if there's a missing assignment: leo smith → Andrei
    console.log('\n🔍 Checking if leo smith is missing from assignments...');
    const leoAssignments = await pool.query(`
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
      WHERE m.unique_id = 'DSR00093'
    `);
    
    console.log(`\n📋 All assignments for leo smith (DSR00093): ${leoAssignments.rows.length}`);
    leoAssignments.rows.forEach(row => {
      console.log(`  - ${row.marketer_name} → ${row.assigned_to_name} [${row.assignment_type}] Active: ${row.is_active}`);
    });
    
    // Check if SAMOD is actually "Andu" with a different name
    const samodDetails = await pool.query(`
      SELECT unique_id, first_name, last_name, role, email, username, created_at
      FROM users 
      WHERE unique_id = 'DSR00087'
    `);
    
    console.log(`\n👑 SAMOD details (DSR00087):`);
    samodDetails.rows.forEach(row => {
      console.log(`  - Name: ${row.first_name} ${row.last_name}`);
      console.log(`  - Email: ${row.email}`);
      console.log(`  - Username: ${row.username}`);
      console.log(`  - Created: ${row.created_at}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

findCorrectSuperAdmin();
