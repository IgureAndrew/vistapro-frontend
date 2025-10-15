#!/usr/bin/env node

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Local database connection details
const LOCAL_DB_URL = 'postgresql://vistapro_user:password@localhost:5432/vistapro_db';

// Parse the database URL
const url = new URL(LOCAL_DB_URL);
const DB_HOST = url.hostname;
const DB_PORT = url.port || 5432;
const DB_USER = url.username;
const DB_PASSWORD = url.password;
const DB_NAME = url.pathname.substring(1); // Remove leading slash

// Get backup file from command line argument
const backupFile = process.argv[2];

if (!backupFile) {
  console.error('❌ Please provide a backup file path');
  console.log('Usage: node restore_from_backup.js <backup_file.sql>');
  console.log('Example: node restore_from_backup.js backups/vistapro_backup_2024-01-15T10-30-00.sql');
  process.exit(1);
}

// Check if backup file exists
if (!fs.existsSync(backupFile)) {
  console.error(`❌ Backup file not found: ${backupFile}`);
  process.exit(1);
}

// Handle compressed files
let restoreCommand;
if (backupFile.endsWith('.gz')) {
  console.log('🗜️  Detected compressed backup file');
  restoreCommand = `gunzip -c "${backupFile}" | psql -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME}`;
} else {
  restoreCommand = `psql -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} -f "${backupFile}"`;
}

console.log('🔄 Starting database restore...');
console.log(`📊 Target database: ${DB_NAME}`);
console.log(`🌐 Host: ${DB_HOST}:${DB_PORT}`);
console.log(`👤 User: ${DB_USER}`);
console.log(`📁 Backup file: ${backupFile}`);

// Set PGPASSWORD environment variable
process.env.PGPASSWORD = DB_PASSWORD;

console.log('\n⚠️  WARNING: This will overwrite the existing database!');
console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...');

// Wait 5 seconds before proceeding
setTimeout(() => {
  console.log('\n🚀 Executing restore command...');
  
  exec(restoreCommand, (error, stdout, stderr) => {
    if (error) {
      console.error('❌ Restore failed:', error.message);
      console.error('📋 Error details:', stderr);
      process.exit(1);
    }

    if (stderr) {
      console.log('📋 psql output:', stderr);
    }

    if (stdout) {
      console.log('📋 Restore output:', stdout);
    }

    console.log('✅ Database restore completed successfully!');
    console.log('🎉 Your local database has been updated with production data');
  });
}, 5000);
