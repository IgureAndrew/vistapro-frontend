#!/usr/bin/env node

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Production database connection details
const PRODUCTION_DB_URL = 'postgresql://vistapro_user:CHtvHVOsBXyVft3LZBnhqSHIFjTSHGem@dpg-d0stpo15pdvs7392u0j0-a.oregon-postgres.render.com/vistapro_qotw';

// Parse the database URL
const url = new URL(PRODUCTION_DB_URL);
const DB_HOST = url.hostname;
const DB_PORT = url.port || 5432;
const DB_USER = url.username;
const DB_PASSWORD = url.password;
const DB_NAME = url.pathname.substring(1); // Remove leading slash

// Backup configuration
const BACKUP_DIR = path.join(__dirname, 'backups');
const DATE = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const BACKUP_FILE = path.join(BACKUP_DIR, `vistapro_backup_${DATE}.sql`);
const COMPRESSED_BACKUP_FILE = `${BACKUP_FILE}.gz`;

// Create backup directory if it doesn't exist
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

console.log('🔄 Starting production database backup...');
console.log(`📊 Database: ${DB_NAME}`);
console.log(`🌐 Host: ${DB_HOST}:${DB_PORT}`);
console.log(`👤 User: ${DB_USER}`);
console.log(`📁 Backup file: ${BACKUP_FILE}`);

// Set PGPASSWORD environment variable for pg_dump
process.env.PGPASSWORD = DB_PASSWORD;

// Create the pg_dump command
const pgDumpCommand = `pg_dump -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} --verbose --no-password --format=plain`;

console.log('\n🚀 Executing backup command...');

// Execute the backup and write directly to file
const backupProcess = exec(`${pgDumpCommand} > "${BACKUP_FILE}"`, (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Backup failed:', error.message);
    console.error('📋 Error details:', stderr);
    process.exit(1);
  }

  if (stderr) {
    console.log('📋 pg_dump output:', stderr);
  }
  
  // Check if backup file was created
  if (fs.existsSync(BACKUP_FILE)) {
    console.log(`✅ Backup completed successfully!`);
    console.log(`📁 Backup saved to: ${BACKUP_FILE}`);
    
    // Get file size
    const stats = fs.statSync(BACKUP_FILE);
    const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
    console.log(`📊 Backup size: ${fileSizeInMB} MB`);
  } else {
    console.error('❌ Backup file was not created');
    process.exit(1);
  }
  
  // Compress the backup (Windows compatible)
  console.log('\n🗜️  Compressing backup...');
  const compressCommand = process.platform === 'win32' 
    ? `powershell -Command "Compress-Archive -Path '${BACKUP_FILE}' -DestinationPath '${BACKUP_FILE}.zip' -Force"`
    : `gzip "${BACKUP_FILE}"`;
    
  exec(compressCommand, (compressError, compressStdout, compressStderr) => {
    if (compressError) {
      console.error('⚠️  Compression failed:', compressError.message);
      console.log('📁 Uncompressed backup is still available');
    } else {
      const compressedFile = process.platform === 'win32' ? `${BACKUP_FILE}.zip` : COMPRESSED_BACKUP_FILE;
      console.log(`✅ Backup compressed successfully!`);
      console.log(`📁 Compressed backup: ${compressedFile}`);
      
      // Get compressed file size
      const compressedStats = fs.statSync(compressedFile);
      const compressedSizeInMB = (compressedStats.size / (1024 * 1024)).toFixed(2);
      console.log(`📊 Compressed size: ${compressedSizeInMB} MB`);
      
      // Get original file size for compression ratio
      const originalStats = fs.statSync(BACKUP_FILE);
      const compressionRatio = ((originalStats.size - compressedStats.size) / originalStats.size * 100).toFixed(1);
      console.log(`📈 Compression ratio: ${compressionRatio}%`);
    }
    
    // Clean up old backups (keep last 7 days)
    console.log('\n🧹 Cleaning up old backups...');
    const files = fs.readdirSync(BACKUP_DIR);
    const backupFiles = files.filter(file => 
      file.startsWith('vistapro_backup_') && 
      (file.endsWith('.sql.gz') || file.endsWith('.sql.zip') || file.endsWith('.sql'))
    );
    
    backupFiles.forEach(file => {
      const filePath = path.join(BACKUP_DIR, file);
      const fileStats = fs.statSync(filePath);
      const daysSinceModified = (Date.now() - fileStats.mtime.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysSinceModified > 7) {
        fs.unlinkSync(filePath);
        console.log(`🗑️  Deleted old backup: ${file}`);
      }
    });
    
    console.log('\n🎉 Backup process completed!');
    console.log(`📁 Backup location: ${BACKUP_DIR}`);
  });
});
