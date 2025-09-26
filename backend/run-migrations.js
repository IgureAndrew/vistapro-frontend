const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  user: 'vistapro_user',
  host: 'localhost',
  database: 'vistapro_dev',
  password: 'vistapro_password',
  port: 5433,
});

async function runMigrations() {
  try {
    console.log('🚀 Starting database migrations...');
    
    // Get all migration files
    const migrationsDir = path.join(__dirname, 'migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();
    
    console.log(`📋 Found ${migrationFiles.length} migration files`);
    
    // Check if migrations table exists
    const migrationsTableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'migrations'
      );
    `);
    
    if (!migrationsTableExists.rows[0].exists) {
      console.log('📋 Creating migrations table...');
      await pool.query(`
        CREATE TABLE migrations (
          id SERIAL PRIMARY KEY,
          migration_name VARCHAR(255) NOT NULL UNIQUE,
          applied_at TIMESTAMP DEFAULT NOW()
        );
      `);
    }
    
    // Get applied migrations
    const appliedMigrations = await pool.query(`
      SELECT migration_name FROM migrations ORDER BY applied_at
    `);
    
    const appliedMigrationNames = appliedMigrations.rows.map(row => row.migration_name);
    console.log(`📋 Applied migrations: ${appliedMigrationNames.length}`);
    
    // Run pending migrations
    let appliedCount = 0;
    for (const migrationFile of migrationFiles) {
      const migrationName = migrationFile.replace('.sql', '');
      
      if (!appliedMigrationNames.includes(migrationName)) {
        console.log(`🔄 Running migration: ${migrationName}`);
        
        const migrationSQL = fs.readFileSync(
          path.join(migrationsDir, migrationFile), 
          'utf8'
        );
        
        await pool.query(migrationSQL);
        appliedCount++;
        
        console.log(`✅ Migration ${migrationName} applied successfully`);
      } else {
        console.log(`⏭️  Migration ${migrationName} already applied`);
      }
    }
    
    console.log(`🎉 Migration process completed! Applied ${appliedCount} new migrations.`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigrations();
