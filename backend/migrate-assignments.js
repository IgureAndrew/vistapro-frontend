const { pool } = require('./src/config/database');

async function migrateAssignments() {
  try {
    console.log('🔄 Migrating assignment data from user_assignments to users table...');
    
    // Get all active assignments
    const { rows: assignments } = await pool.query(`
      SELECT 
        ua.marketer_id,
        ua.assigned_to_id,
        ua.assignment_type,
        m.id as marketer_internal_id,
        a.id as assignee_internal_id
      FROM user_assignments ua
      JOIN users m ON m.unique_id = ua.marketer_id
      JOIN users a ON a.unique_id = ua.assigned_to_id
      WHERE ua.is_active = true
    `);
    
    console.log(`📊 Found ${assignments.length} active assignments to migrate`);
    
    let migrated = 0;
    let errors = 0;
    
    for (const assignment of assignments) {
      try {
        if (assignment.assignment_type === 'admin') {
          // Marketer assigned to Admin
          await pool.query(`
            UPDATE users 
            SET admin_id = $1, updated_at = NOW()
            WHERE id = $2
          `, [assignment.assignee_internal_id, assignment.marketer_internal_id]);
          
          console.log(`✅ Migrated: ${assignment.marketer_id} → Admin ${assignment.assigned_to_id}`);
        } else if (assignment.assignment_type === 'superadmin') {
          // Admin assigned to SuperAdmin
          await pool.query(`
            UPDATE users 
            SET super_admin_id = $1, updated_at = NOW()
            WHERE id = $2
          `, [assignment.assignee_internal_id, assignment.marketer_internal_id]);
          
          console.log(`✅ Migrated: ${assignment.marketer_id} → SuperAdmin ${assignment.assigned_to_id}`);
        }
        
        migrated++;
      } catch (error) {
        console.error(`❌ Error migrating ${assignment.marketer_id}:`, error.message);
        errors++;
      }
    }
    
    console.log(`\n📈 Migration Summary:`);
    console.log(`  ✅ Successfully migrated: ${migrated} assignments`);
    console.log(`  ❌ Errors: ${errors} assignments`);
    
    // Verify the migration
    const { rows: adminAssignments } = await pool.query(`
      SELECT COUNT(*) as count FROM users WHERE admin_id IS NOT NULL
    `);
    
    const { rows: superAdminAssignments } = await pool.query(`
      SELECT COUNT(*) as count FROM users WHERE super_admin_id IS NOT NULL
    `);
    
    console.log(`\n📊 Verification:`);
    console.log(`  - Users with admin_id: ${adminAssignments[0].count}`);
    console.log(`  - Users with super_admin_id: ${superAdminAssignments[0].count}`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await pool.end();
  }
}

migrateAssignments().catch(console.error);
