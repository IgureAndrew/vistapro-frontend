const { Pool } = require('pg');

async function fixLocationColumn() {
  const pool = new Pool({
    host: 'localhost',
    port: 5433,
    user: 'vistapro_user',
    password: 'vistapro_password',
    database: 'vistapro_dev',
    ssl: false
  });

  try {
    console.log('🔧 Fixing location column...');
    
    // Check if location column exists
    const columnCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'location'
    `);
    
    if (columnCheck.rows.length === 0) {
      console.log('➕ Adding location column...');
      await pool.query(`
        ALTER TABLE users 
        ADD COLUMN location VARCHAR(100)
      `);
      console.log('✅ Location column added!');
    } else {
      console.log('✅ Location column already exists');
    }
    
    // Update users with sample locations
    console.log('📍 Updating user locations...');
    
    // Get all users
    const { rows: users } = await pool.query(`
      SELECT id, unique_id, first_name, last_name, role, location 
      FROM users 
      ORDER BY id
    `);
    
    console.log(`Found ${users.length} users`);
    
    // Update users without locations
    const usersWithoutLocation = users.filter(user => !user.location);
    console.log(`${usersWithoutLocation.length} users need location updates`);
    
    if (usersWithoutLocation.length > 0) {
      const locations = ['Lagos', 'Abuja', 'Kano', 'Port Harcourt', 'Oyo'];
      
      for (let i = 0; i < usersWithoutLocation.length; i++) {
        const user = usersWithoutLocation[i];
        const location = locations[i % locations.length];
        
        await pool.query(`
          UPDATE users 
          SET location = $1 
          WHERE id = $2
        `, [location, user.id]);
        
        console.log(`✅ Updated ${user.first_name} ${user.last_name} (${user.role}) to ${location}`);
      }
    }
    
    // Test the API query
    console.log('\n🧪 Testing API query...');
    const testLocation = 'Oyo';
    const testUserId = 232; // Andu Eagle
    
    const { rows: apiTest } = await pool.query(`
      SELECT 
        id,
        unique_id,
        CONCAT(first_name, ' ', last_name) as name,
        role,
        location
      FROM users 
      WHERE location = $1 
        AND id != $2
        AND role IN ('Marketer', 'Admin', 'SuperAdmin')
        AND (deleted IS NULL OR deleted = FALSE)
        AND (locked IS NULL OR locked = FALSE)
      ORDER BY role, first_name, last_name
    `, [testLocation, testUserId]);
    
    console.log(`\n📋 Users in ${testLocation} (excluding user ${testUserId}):`);
    console.table(apiTest);
    
    if (apiTest.length === 0) {
      console.log('❌ Still no users found. Let me check what users exist...');
      
      const allUsers = await pool.query(`
        SELECT id, unique_id, first_name, last_name, role, location, deleted, locked
        FROM users 
        WHERE location = $1
        ORDER BY role, first_name, last_name
      `, [testLocation]);
      
      console.log(`\n👥 All users in ${testLocation}:`);
      console.table(allUsers.rows);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

fixLocationColumn();
