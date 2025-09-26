// Sync local database with live database structure
const { Pool } = require('pg');

const livePool = new Pool({
  connectionString: 'postgresql://vistapro_user:CHtvHVOsBXyVft3LZBnhqSHIFjTSHGem@dpg-d0stpo15pdvs7392u0j0-a.oregon-postgres.render.com/vistapro_qotw',
  ssl: { rejectUnauthorized: false }
});

const localPool = new Pool({
  user: 'vistapro_user',
  password: 'vistapro_password',
  host: 'localhost',
  port: 5433,
  database: 'vistapro_dev',
  ssl: false
});

async function syncLocalWithLive() {
  try {
    console.log('🔄 Syncing local database with live database...');
    
    // Get the key users from live database
    const liveUsers = await livePool.query(`
      SELECT id, unique_id, first_name, last_name, role, email, admin_id, super_admin_id
      FROM users 
      WHERE unique_id IN ('SM000005', 'ASM000021', 'DSR00093')
      ORDER BY unique_id
    `);
    
    console.log('📊 Key users from live database:');
    liveUsers.rows.forEach(row => {
      console.log(`  - ${row.first_name} ${row.last_name} (${row.unique_id}) [${row.role}]`);
      console.log(`    ID: ${row.id}, Admin ID: ${row.admin_id}, Super Admin ID: ${row.super_admin_id}`);
    });
    
    // Update local users with the correct assignment IDs
    for (const user of liveUsers.rows) {
      try {
        // First, get the local user's ID
        const localUser = await localPool.query(`
          SELECT id FROM users WHERE unique_id = $1
        `, [user.unique_id]);
        
        if (localUser.rows.length === 0) {
          console.log(`❌ User ${user.unique_id} not found in local database`);
          continue;
        }
        
        const localUserId = localUser.rows[0].id;
        
        // Update the user with assignment IDs
        await localPool.query(`
          UPDATE users 
          SET admin_id = $1, super_admin_id = $2
          WHERE unique_id = $3
        `, [user.admin_id, user.super_admin_id, user.unique_id]);
        
        console.log(`✅ Updated ${user.first_name} ${user.last_name} assignments`);
        
      } catch (error) {
        console.log(`❌ Failed to update ${user.unique_id}: ${error.message}`);
      }
    }
    
    // Verify the updates
    console.log('\n🔍 Verifying local database updates:');
    const localUsers = await localPool.query(`
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
      WHERE u.unique_id IN ('SM000005', 'ASM000021', 'DSR00093')
      ORDER BY u.unique_id
    `);
    
    localUsers.rows.forEach(row => {
      console.log(`\n  - ${row.user_name} (${row.unique_id}) [${row.role}]`);
      console.log(`    Admin ID: ${row.admin_id} (${row.admin_name || 'None'})`);
      console.log(`    Super Admin ID: ${row.super_admin_id} (${row.superadmin_name || 'None'})`);
    });
    
    console.log('\n✅ Local database synced with live database!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await livePool.end();
    await localPool.end();
  }
}

syncLocalWithLive();
