const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  user: 'vistapro_user',
  password: 'vistapro_pass',
  database: 'vistapro_local',
  port: 5432
});

async function checkDatabaseStructure() {
  try {
    console.log('🔍 Checking database structure...\n');
    
    // Check users table columns
    console.log('📋 USERS TABLE COLUMNS:');
    const usersColumns = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `);
    
    usersColumns.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });
    
    console.log('\n📋 VERIFICATION_SUBMISSIONS TABLE COLUMNS:');
    const submissionsColumns = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'verification_submissions' 
      ORDER BY ordinal_position
    `);
    
    submissionsColumns.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });
    
    console.log('\n👥 USER ASSIGNMENT HIERARCHY:');
    const hierarchy = await pool.query(`
      SELECT 
        u.id,
        u.first_name,
        u.last_name,
        u.role,
        u.super_admin_id,
        u.admin_id,
        sa.first_name as super_admin_name,
        admin.first_name as admin_name
      FROM users u
      LEFT JOIN users sa ON u.super_admin_id = sa.id
      LEFT JOIN users admin ON u.admin_id = admin.id
      WHERE u.role IN ('SuperAdmin', 'Admin', 'Marketer')
      ORDER BY u.role, u.id
    `);
    
    console.log('  ID | Name | Role | SuperAdmin ID | Admin ID | SuperAdmin Name | Admin Name');
    console.log('  ---|------|------|---------------|----------|-----------------|----------');
    hierarchy.rows.forEach(row => {
      console.log(`  ${row.id.toString().padStart(2)} | ${(row.first_name + ' ' + row.last_name).padEnd(10)} | ${row.role.padEnd(10)} | ${(row.super_admin_id || 'NULL').toString().padEnd(13)} | ${(row.admin_id || 'NULL').toString().padEnd(8)} | ${(row.super_admin_name || 'NULL').padEnd(15)} | ${row.admin_name || 'NULL'}`);
    });
    
    console.log('\n📊 VERIFICATION SUBMISSIONS:');
    const submissions = await pool.query(`
      SELECT 
        vs.id,
        vs.marketer_id,
        vs.admin_id,
        vs.superadmin_id,
        vs.masteradmin_id,
        vs.current_status,
        m.first_name as marketer_name,
        a.first_name as admin_name,
        sa.first_name as superadmin_name
      FROM verification_submissions vs
      LEFT JOIN users m ON vs.marketer_id = m.id
      LEFT JOIN users a ON vs.admin_id = a.id
      LEFT JOIN users sa ON vs.superadmin_id = sa.id
      ORDER BY vs.id
    `);
    
    if (submissions.rows.length > 0) {
      console.log('  ID | Marketer | Admin | SuperAdmin | MasterAdmin | Status');
      console.log('  ---|----------|-------|------------|-------------|-------');
      submissions.rows.forEach(row => {
        console.log(`  ${row.id.toString().padStart(2)} | ${(row.marketer_name || 'NULL').padEnd(8)} | ${(row.admin_name || 'NULL').padEnd(5)} | ${(row.superadmin_name || 'NULL').padEnd(10)} | ${(row.masteradmin_id || 'NULL').toString().padEnd(11)} | ${row.current_status}`);
      });
    } else {
      console.log('  No verification submissions found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkDatabaseStructure();
