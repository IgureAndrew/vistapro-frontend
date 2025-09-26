// Simple check of the hierarchy
const { Pool } = require('pg');

const pool = new Pool({
  user: 'vistapro_user',
  password: 'vistapro_password',
  host: 'localhost',
  port: 5433,
  database: 'vistapro_dev',
  ssl: false
});

async function checkHierarchy() {
  try {
    console.log('🔍 Checking hierarchy...');
    
    // Check if leo smith is assigned to Andrei
    const result = await pool.query(`
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
    
    console.log(`leo smith → Andrei assignments: ${result.rows.length}`);
    result.rows.forEach(row => {
      console.log(`  - ${row.marketer_name} → ${row.assigned_to_name} [${row.assignment_type}]`);
    });
    
    // Check all assignments for leo smith
    const leoAll = await pool.query(`
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
    
    console.log(`\nAll leo smith assignments: ${leoAll.rows.length}`);
    leoAll.rows.forEach(row => {
      console.log(`  - ${row.marketer_name} → ${row.assigned_to_name} [${row.assignment_type}]`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

checkHierarchy();
