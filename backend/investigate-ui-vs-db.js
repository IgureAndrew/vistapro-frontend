// Investigate the disconnect between UI and database
const { Pool } = require('pg');

const pool = new Pool({
  user: 'vistapro_user',
  password: 'vistapro_password',
  host: 'localhost',
  port: 5433,
  database: 'vistapro_dev',
  ssl: false
});

async function investigateDisconnect() {
  try {
    console.log('🔍 Investigating UI vs Database disconnect...');
    
    // Check if there are multiple assignment tables or different data sources
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE '%assign%'
      ORDER BY table_name
    `);
    
    console.log('📊 Tables with "assign" in name:');
    tables.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
    // Check the structure of user_assignments table
    const tableStructure = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'user_assignments'
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 user_assignments table structure:');
    tableStructure.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });
    
    // Check if there are any assignments for Andu Eagle (SM000005)
    const anduAssignments = await pool.query(`
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
      WHERE ua.assigned_to_id = 'SM000005' OR ua.marketer_id = 'SM000005'
    `);
    
    console.log(`\n🔍 Assignments involving Andu Eagle (SM000005): ${anduAssignments.rows.length}`);
    anduAssignments.rows.forEach(row => {
      console.log(`  - ${row.marketer_name} → ${row.assigned_to_name} [${row.assignment_type}]`);
    });
    
    // Check if there are any assignments for leo smith (DSR00093)
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
      WHERE ua.marketer_id = 'DSR00093' OR ua.assigned_to_id = 'DSR00093'
    `);
    
    console.log(`\n🔍 Assignments involving leo smith (DSR00093): ${leoAssignments.rows.length}`);
    leoAssignments.rows.forEach(row => {
      console.log(`  - ${row.marketer_name} → ${row.assigned_to_name} [${row.assignment_type}]`);
    });
    
    // Check if there's a different assignment system or if the UI is using cached data
    const allUsers = await pool.query(`
      SELECT unique_id, first_name, last_name, role, email
      FROM users 
      WHERE unique_id IN ('SM000005', 'ASM000021', 'DSR00093')
      ORDER BY unique_id
    `);
    
    console.log('\n👥 The three key users:');
    allUsers.rows.forEach(row => {
      console.log(`  - ${row.first_name} ${row.last_name} (${row.unique_id}) [${row.role}] - ${row.email}`);
    });
    
    // Check if there are any other assignment-related tables
    const allTables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('\n📊 All tables in database:');
    allTables.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

investigateDisconnect();
