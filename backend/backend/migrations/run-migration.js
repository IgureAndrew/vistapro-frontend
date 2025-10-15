const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Database configuration
const pool = new Pool({
  user: process.env.DB_USER || 'vistapro_user',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'vistapro_dev',
  password: process.env.DB_PASSWORD || 'vistapro_password',
  port: process.env.DB_PORT || 5433,
});

async function runMigration() {
  const migrationFile = process.argv[2];
  
  if (!migrationFile) {
    console.error('Usage: node run-migration.js <migration-file.sql>');
    process.exit(1);
  }

  const migrationPath = path.join(__dirname, migrationFile);
  
  if (!fs.existsSync(migrationPath)) {
    console.error(`Migration file not found: ${migrationPath}`);
    process.exit(1);
  }

  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
  
  try {
    console.log(`Running migration: ${migrationFile}`);
    await pool.query(migrationSQL);
    console.log(`✅ Migration completed successfully: ${migrationFile}`);
  } catch (error) {
    console.error(`❌ Migration failed: ${migrationFile}`);
    console.error(error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
