// Check existing user assignments in detail
const { Pool } = require('pg');

const pool = new Pool({
  user: 'vistapro_user',
  password: 'vistapro_password',
  host: 'localhost',
  port: 5433,
  database: 'vistapro_dev',
  ssl: false
});

async function checkExistingAssignments() {
  try {
    console.log('🔍 Checking existing user assignments...');
    
    // Check user_assignments table
    const assignmentsResult = await pool.query(`
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
    
    console.log(`📊 Found ${assignmentsResult.rows.length} assignments:`);
    assignmentsResult.rows.forEach(row => {
      console.log(`  - ID: ${row.id}`);
      console.log(`    Marketer: ${row.marketer_name} (${row.marketer_id}) [${row.marketer_role}]`);
      console.log(`    Assigned to: ${row.assigned_to_name} (${row.assigned_to_id}) [${row.assigned_to_role}]`);
      console.log(`    Type: ${row.assignment_type}, Active: ${row.is_active}`);
      console.log(`    Date: ${row.assigned_at}`);
      console.log('');
    });
    
    // Check for Andrei specifically
    const andreiResult = await pool.query(`
      SELECT unique_id, first_name, last_name, role
      FROM users 
      WHERE first_name ILIKE '%andrei%' OR last_name ILIKE '%andrei%'
    `);
    
    console.log('🔍 Users matching "Andrei":');
    andreiResult.rows.forEach(row => {
      console.log(`  - ${row.first_name} ${row.last_name} (${row.unique_id}) [${row.role}]`);
    });
    
    // Check for users with ASM000021
    const asmResult = await pool.query(`
      SELECT unique_id, first_name, last_name, role
      FROM users 
      WHERE unique_id = 'ASM000021'
    `);
    
    console.log('\n🔍 User with ASM000021:');
    asmResult.rows.forEach(row => {
      console.log(`  - ${row.first_name} ${row.last_name} (${row.unique_id}) [${row.role}]`);
    });
    
    // Check what marketers are assigned to ASM000021
    if (asmResult.rows.length > 0) {
      const marketerAssignments = await pool.query(`
        SELECT 
          ua.marketer_id,
          m.first_name || ' ' || m.last_name as marketer_name,
          m.unique_id as marketer_unique_id,
          m.role as marketer_role
        FROM user_assignments ua
        LEFT JOIN users m ON m.unique_id = ua.marketer_id
        WHERE ua.assigned_to_id = 'ASM000021' 
          AND ua.is_active = true
      `);
      
      console.log(`\n📋 Marketers assigned to ASM000021 (${marketerAssignments.rows.length}):`);
      marketerAssignments.rows.forEach(row => {
        console.log(`  - ${row.marketer_name} (${row.marketer_unique_id}) [${row.marketer_role}]`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error checking assignments:', error);
  } finally {
    await pool.end();
  }
}

checkExistingAssignments();
