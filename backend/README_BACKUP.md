# Vistapro Production Database Backup

This directory contains scripts to backup and restore the production PostgreSQL database from Render.com.

## Prerequisites

1. **Node.js** - Install from [nodejs.org](https://nodejs.org/)
2. **PostgreSQL Client Tools** - Install PostgreSQL client tools to get `pg_dump` and `psql`
   - Windows: Download from [postgresql.org](https://www.postgresql.org/download/windows/)
   - macOS: `brew install postgresql`
   - Linux: `sudo apt-get install postgresql-client`

## Files

- `backup_production_db.js` - Main backup script
- `restore_from_backup.js` - Restore script for local development
- `backup_script.bat` - Windows batch file for easy execution
- `README_BACKUP.md` - This documentation

## Usage

### 1. Backup Production Database

#### Option A: Using the batch file (Windows)
```bash
# Double-click backup_script.bat or run:
backup_script.bat
```

#### Option B: Using Node.js directly
```bash
node backup_production_db.js
```

### 2. Restore to Local Database

```bash
# Restore from uncompressed backup
node restore_from_backup.js backups/vistapro_backup_2024-01-15T10-30-00.sql

# Restore from compressed backup
node restore_from_backup.js backups/vistapro_backup_2024-01-15T10-30-00.sql.gz
```

## What the Backup Script Does

1. **Connects** to the production database on Render.com
2. **Creates** a full database dump using `pg_dump`
3. **Saves** the backup to `backups/` directory with timestamp
4. **Compresses** the backup using gzip
5. **Cleans up** old backups (keeps last 7 days)
6. **Reports** file sizes and compression ratios

## Backup File Format

- **Uncompressed**: `vistapro_backup_YYYY-MM-DDTHH-MM-SS.sql`
- **Compressed**: `vistapro_backup_YYYY-MM-DDTHH-MM-SS.sql.gz`

## Safety Features

- **Automatic cleanup** of backups older than 7 days
- **Compression** to save disk space
- **Error handling** with detailed error messages
- **File size reporting** for monitoring
- **5-second warning** before restore operations

## Database Connection Details

### Production (Render.com)
- **Host**: dpg-d0stpo15pdvs7392u0j0-a.oregon-postgres.render.com
- **Port**: 5432
- **Database**: vistapro_qotw
- **User**: vistapro_user

### Local Development
- **Host**: localhost
- **Port**: 5432
- **Database**: vistapro_db
- **User**: vistapro_user

## Troubleshooting

### Common Issues

1. **"pg_dump not found"**
   - Install PostgreSQL client tools
   - Add PostgreSQL bin directory to PATH

2. **"Connection refused"**
   - Check internet connection
   - Verify production database is running
   - Check firewall settings

3. **"Permission denied"**
   - Ensure you have write permissions in the backup directory
   - Run as administrator if needed

4. **"Database does not exist"**
   - Create the local database first: `createdb vistapro_db`
   - Check database name in restore script

### Manual Commands

If the scripts don't work, you can run the commands manually:

```bash
# Backup
pg_dump -h dpg-d0stpo15pdvs7392u0j0-a.oregon-postgres.render.com -p 5432 -U vistapro_user -d vistapro_qotw > backup.sql

# Restore
psql -h localhost -p 5432 -U vistapro_user -d vistapro_db -f backup.sql
```

## Security Notes

- **Never commit** backup files to version control
- **Encrypt** backups if storing long-term
- **Use secure connections** (SSL) in production
- **Rotate credentials** regularly
- **Limit access** to backup files

## Automation

To automate backups, you can:

1. **Windows Task Scheduler**: Schedule `backup_script.bat` to run daily
2. **Cron (Linux/macOS)**: Add to crontab for daily execution
3. **GitHub Actions**: Create a workflow for automated backups
4. **Cloud Functions**: Use AWS Lambda or Google Cloud Functions

Example cron job (daily at 2 AM):
```bash
0 2 * * * cd /path/to/vistapro && node backup_production_db.js
```
