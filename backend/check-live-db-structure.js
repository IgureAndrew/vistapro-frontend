// Check the structure of the live database
const { Pool } = require('pg');

const livePool = new Pool({
  connectionString: 'postgresql://vistapro_user:CHtvHVOsBXyVft3LZBnhqSHIFjTSHGem@dpg-d0stpo15pdvs7392u0j0-a.oregon-postgres.render.com/vistapro_qotw',
  ssl: { rejectUnauthorized: false }
});

async function checkLiveDbStructure() {
  try {
    console.log('🔍 Checking live database structure...');
    
    // Get all tables
    const tables = await livePool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('📊 Tables in live database:');
    tables.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
    // Check if there are any assignment-related tables
    const assignmentTables = await livePool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND (table_name LIKE '%assign%' OR table_name LIKE '%hierarchy%' OR table_name LIKE '%team%')
      ORDER BY table_name
    `);
    
    console.log('\n🔗 Assignment-related tables:');
    assignmentTables.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
    // Check users table structure
    const usersStructure = await livePool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `);
    
    console.log('\n👥 Users table structure:');
    usersStructure.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });
    
    // Check if users have assignment columns
    const assignmentColumns = await livePool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns 
      WHERE table_name = 'users'
      AND (column_name LIKE '%assign%' OR column_name LIKE '%admin%' OR column_name LIKE '%super%')
      ORDER BY column_name
    `);
    
    console.log('\n🔗 Assignment-related columns in users table:');
    assignmentColumns.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type}`);
    });
    
    // Check for Andu Eagle, Andrei, and leo smith in live database
    const keyUsers = await livePool.query(`
      SELECT unique_id, first_name, last_name, role, email
      FROM users 
      WHERE (first_name ILIKE '%andu%' OR last_name ILIKE '%eagle%' OR
             first_name ILIKE '%andrei%' OR last_name ILIKE '%igurrr%' OR
             first_name ILIKE '%leo%' OR last_name ILIKE '%smith%')
      ORDER BY unique_id
    `);
    
    console.log('\n👤 Key users in live database:');
    keyUsers.rows.forEach(row => {
      console.log(`  - ${row.first_name} ${row.last_name} (${row.unique_id}) [${row.role}] - ${row.email}`);
    });
    
    // Check if there are any other tables that might contain assignments
    const allTables = await livePool.query(`
      SELECT table_name, 
             (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
      FROM information_schema.tables t
      WHERE table_schema = 'public' 
      ORDER BY column_count DESC
    `);
    
    console.log('\n📊 All tables with column counts:');
    allTables.rows.forEach(row => {
      console.log(`  - ${row.table_name} (${row.column_count} columns)`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await livePool.end();
  }
}

checkLiveDbStructure();
