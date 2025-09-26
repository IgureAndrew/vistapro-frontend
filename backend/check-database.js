// Check database structure and data
const { Pool } = require('pg');

const pool = new Pool({
  user: 'vistapro_user',
  password: 'vistapro_password',
  host: 'localhost',
  port: 5433,
  database: 'vistapro_dev',
  ssl: false
});

async function checkDatabase() {
  try {
    console.log('🔍 Checking database structure...');
    
    // Check if user_assignments table exists
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('📋 Available tables:');
    tablesResult.rows.forEach(row => console.log(`  - ${row.table_name}`));
    
    // Check if user_assignments table exists
    const hasUserAssignments = tablesResult.rows.some(row => row.table_name === 'user_assignments');
    console.log(`\n🔗 user_assignments table exists: ${hasUserAssignments}`);
    
    if (hasUserAssignments) {
      // Check user_assignments data
      const assignmentsResult = await pool.query(`
        SELECT * FROM user_assignments LIMIT 10
      `);
      
      console.log(`\n📊 user_assignments data (${assignmentsResult.rows.length} rows):`);
      assignmentsResult.rows.forEach(row => {
        console.log(`  - Marketer: ${row.marketer_id}, Assigned to: ${row.assigned_to_id}, Type: ${row.assignment_type}, Active: ${row.is_active}`);
      });
    }
    
    // Check users table for SuperAdmin, Admin, and Marketer roles
    const usersResult = await pool.query(`
      SELECT role, COUNT(*) as count 
      FROM users 
      GROUP BY role 
      ORDER BY role
    `);
    
    console.log('\n👥 Users by role:');
    usersResult.rows.forEach(row => {
      console.log(`  - ${row.role}: ${row.count} users`);
    });
    
    // Check orders table
    const ordersResult = await pool.query(`
      SELECT COUNT(*) as count FROM orders
    `);
    
    console.log(`\n📦 Total orders: ${ordersResult.rows[0].count}`);
    
    // Check if there are any orders with marketer_id
    const ordersWithMarketer = await pool.query(`
      SELECT o.id, o.marketer_id, u.unique_id as marketer_unique_id, u.first_name, u.last_name, u.role
      FROM orders o
      LEFT JOIN users u ON u.id = o.marketer_id
      LIMIT 5
    `);
    
    console.log('\n📋 Sample orders with marketer info:');
    ordersWithMarketer.rows.forEach(row => {
      console.log(`  - Order ${row.id}: Marketer ID ${row.marketer_id} (${row.marketer_unique_id}) - ${row.first_name} ${row.last_name} (${row.role})`);
    });
    
  } catch (error) {
    console.error('❌ Error checking database:', error);
  } finally {
    await pool.end();
  }
}

checkDatabase();
