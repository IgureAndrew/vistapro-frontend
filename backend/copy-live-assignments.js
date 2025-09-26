// Copy user assignments from live database to local development database
const { Pool } = require('pg');

// Live database connection
const livePool = new Pool({
  connectionString: 'postgresql://vistapro_user:CHtvHVOsBXyVft3LZBnhqSHIFjTSHGem@dpg-d0stpo15pdvs7392u0j0-a.oregon-postgres.render.com/vistapro_qotw',
  ssl: { rejectUnauthorized: false }
});

// Local development database connection
const localPool = new Pool({
  user: 'vistapro_user',
  password: 'vistapro_password',
  host: 'localhost',
  port: 5433,
  database: 'vistapro_dev',
  ssl: false
});

async function copyLiveAssignments() {
  try {
    console.log('🔄 Copying user assignments from live to local...');
    
    // First, let's check what's in the live database
    console.log('📊 Checking live database assignments...');
    const liveAssignments = await livePool.query(`
      SELECT 
        ua.id,
        ua.marketer_id,
        ua.assigned_to_id,
        ua.assignment_type,
        ua.is_active,
        ua.assigned_at,
        ua.assigned_by,
        ua.notes,
        ua.created_at,
        ua.updated_at,
        m.first_name || ' ' || m.last_name as marketer_name,
        a.first_name || ' ' || a.last_name as assigned_to_name
      FROM user_assignments ua
      LEFT JOIN users m ON m.unique_id = ua.marketer_id
      LEFT JOIN users a ON a.unique_id = ua.assigned_to_id
      ORDER BY ua.id
    `);
    
    console.log(`Found ${liveAssignments.rows.length} assignments in live database:`);
    liveAssignments.rows.forEach(row => {
      console.log(`  - ${row.marketer_name} → ${row.assigned_to_name} [${row.assignment_type}]`);
    });
    
    // Check if we have the required users in local database
    console.log('\n🔍 Checking if required users exist in local database...');
    const requiredUsers = ['SM000005', 'ASM000021', 'DSR00093']; // Andu Eagle, Andrei, leo smith
    
    for (const userId of requiredUsers) {
      const userExists = await localPool.query(`
        SELECT unique_id, first_name, last_name, role
        FROM users 
        WHERE unique_id = $1
      `, [userId]);
      
      if (userExists.rows.length === 0) {
        console.log(`❌ User ${userId} not found in local database`);
      } else {
        console.log(`✅ User ${userId}: ${userExists.rows[0].first_name} ${userExists.rows[0].last_name} [${userExists.rows[0].role}]`);
      }
    }
    
    // Clear existing assignments in local database
    console.log('\n🧹 Clearing existing assignments in local database...');
    await localPool.query('DELETE FROM user_assignments');
    console.log('✅ Local assignments cleared');
    
    // Copy assignments from live to local
    console.log('\n📋 Copying assignments from live to local...');
    for (const assignment of liveAssignments.rows) {
      try {
        await localPool.query(`
          INSERT INTO user_assignments (
            id, marketer_id, assigned_to_id, assignment_type, is_active, 
            assigned_at, assigned_by, notes, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `, [
          assignment.id,
          assignment.marketer_id,
          assignment.assigned_to_id,
          assignment.assignment_type,
          assignment.is_active,
          assignment.assigned_at,
          assignment.assigned_by,
          assignment.notes,
          assignment.created_at,
          assignment.updated_at
        ]);
        console.log(`✅ Copied: ${assignment.marketer_name} → ${assignment.assigned_to_name}`);
      } catch (error) {
        console.log(`❌ Failed to copy assignment ${assignment.id}: ${error.message}`);
      }
    }
    
    // Verify the copy
    console.log('\n🔍 Verifying copied assignments...');
    const localAssignments = await localPool.query(`
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
      ORDER BY ua.id
    `);
    
    console.log(`\n📊 Local database now has ${localAssignments.rows.length} assignments:`);
    localAssignments.rows.forEach(row => {
      console.log(`  - ${row.marketer_name} → ${row.assigned_to_name} [${row.assignment_type}]`);
    });
    
    console.log('\n✅ User assignments copied successfully!');
    
  } catch (error) {
    console.error('❌ Error copying assignments:', error);
  } finally {
    await livePool.end();
    await localPool.end();
  }
}

// Instructions for the user
console.log('📝 Before running this script, please update the live database credentials:');
console.log('1. Update the livePool configuration with your production database details');
console.log('2. Make sure you have access to the live database');
console.log('3. Ensure the local database has all required users');
console.log('4. Run: node copy-live-assignments.js');
console.log('');

// Running the copy
copyLiveAssignments();
