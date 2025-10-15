// Run enhanced target management migration
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function runEnhancedTargetMigration() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('🚀 Starting Enhanced Target Management Migration...');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, 'migrations', '0025_enhance_target_management_bnpl.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute the migration
    await pool.query(migrationSQL);
    
    console.log('✅ Enhanced Target Management Migration completed successfully!');
    
    // Verify the changes
    console.log('🔍 Verifying changes...');
    
    // Check target_types table structure
    const targetTypesResult = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'target_types' 
      AND column_name IN ('supports_bnpl')
      ORDER BY column_name;
    `);
    
    console.log('📋 Target Types Table Changes:');
    targetTypesResult.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });
    
    // Check targets table structure
    const targetsResult = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'targets' 
      AND column_name IN ('bnpl_platform')
      ORDER BY column_name;
    `);
    
    console.log('📋 Targets Table Changes:');
    targetsResult.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });
    
    // Check target types with supports_bnpl flag
    const targetTypesWithBnpl = await pool.query(`
      SELECT name, description, metric_unit, supports_bnpl
      FROM target_types
      ORDER BY name;
    `);
    
    console.log('📋 Target Types with BNPL Support:');
    targetTypesWithBnpl.rows.forEach(row => {
      console.log(`  - ${row.name}: ${row.supports_bnpl ? '✅ Supports BNPL' : '❌ No BNPL support'}`);
    });
    
    // Check indexes
    const indexesResult = await pool.query(`
      SELECT indexname, indexdef
      FROM pg_indexes 
      WHERE tablename = 'targets' 
      AND indexname LIKE '%bnpl%';
    `);
    
    console.log('📋 BNPL Indexes:');
    indexesResult.rows.forEach(row => {
      console.log(`  - ${row.indexname}`);
    });
    
    console.log('🎉 Migration verification completed!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the migration if this file is executed directly
if (require.main === module) {
  runEnhancedTargetMigration()
    .then(() => {
      console.log('✅ Migration completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { runEnhancedTargetMigration };
