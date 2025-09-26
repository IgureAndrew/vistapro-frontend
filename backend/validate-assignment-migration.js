require('dotenv').config();
const { pool } = require('./src/config/database');

async function validateAssignmentMigration() {
  const client = await pool.connect();
  try {
    console.log('🔍 Validating Assignment Migration...\n');
    
    // 1. Check original assignments
    const { rows: originalAssignments } = await client.query(`
      SELECT assignment_type, COUNT(*) as count
      FROM user_assignments 
      WHERE is_active = TRUE
      GROUP BY assignment_type
    `);
    
    console.log('📊 Original Assignments (user_assignments table):');
    originalAssignments.forEach(row => {
      console.log(`  - ${row.assignment_type}: ${row.count} assignments`);
    });
    
    // 2. Check migrated assignments
    const { rows: migratedAdmin } = await client.query(`
      SELECT COUNT(*) as count
      FROM users 
      WHERE admin_id IS NOT NULL AND role = 'Marketer'
    `);
    
    const { rows: migratedSuperAdmin } = await client.query(`
      SELECT COUNT(*) as count
      FROM users 
      WHERE super_admin_id IS NOT NULL AND role = 'Admin'
    `);
    
    console.log('\n📊 Migrated Assignments (users table):');
    console.log(`  - admin: ${migratedAdmin[0].count} assignments`);
    console.log(`  - superadmin: ${migratedSuperAdmin[0].count} assignments`);
    
    // 3. Check backup table
    const { rows: backupCount } = await client.query(`
      SELECT COUNT(*) as count FROM user_assignments_backup
    `);
    console.log(`\n💾 Backup Records: ${backupCount[0].count} assignments backed up`);
    
    // 4. Validate data integrity
    const { rows: validation } = await client.query(`
      SELECT * FROM assignment_migration_validation
    `);
    
    console.log('\n✅ Migration Validation:');
    validation.forEach(row => {
      const status = row.status === 'MATCH' ? '✅' : '❌';
      console.log(`  ${status} ${row.assignment_type}: ${row.original_count} → ${row.migrated_count} (${row.status})`);
    });
    
    // 5. Check for any data loss
    const allValid = validation.every(row => row.status === 'MATCH');
    if (allValid) {
      console.log('\n🎉 Migration Validation: SUCCESS - All data migrated correctly!');
    } else {
      console.log('\n⚠️  Migration Validation: ISSUES DETECTED - Please review the mismatches above.');
    }
    
    // 6. Show sample assignments
    console.log('\n📋 Sample Admin Assignments:');
    const { rows: sampleAdmin } = await client.query(`
      SELECT 
        m.unique_id as marketer_id,
        m.first_name as marketer_name,
        a.unique_id as admin_id,
        a.first_name as admin_name
      FROM users m
      JOIN users a ON m.admin_id = a.id
      WHERE m.role = 'Marketer'
      LIMIT 5
    `);
    
    sampleAdmin.forEach(row => {
      console.log(`  - ${row.marketer_id} (${row.marketer_name}) → ${row.admin_id} (${row.admin_name})`);
    });
    
  } catch (error) {
    console.error('❌ Validation failed:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

validateAssignmentMigration();
