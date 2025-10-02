const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Configuration
const PROD_DB_URL = process.env.DATABASE_URL;
const LOCAL_DB_URL = process.env.LOCAL_DATABASE_URL || 'postgresql://localhost:5433/vistapro_dev';
const DB_NAME = 'vistapro_dev';

async function setupLocalDatabase() {
  console.log('🚀 Setting up local database...');
  
  try {
    // Step 1: Connect to local database (already created by Docker)
    console.log('🔧 Connecting to local database...');
    const localPool = new Pool({
      host: 'localhost',
      port: 5433,
      user: 'vistapro_user',
      password: 'vistapro_password',
      database: 'vistapro_dev',
      ssl: false
    });

    // Test connection
    await localPool.query('SELECT 1');
    console.log('✅ Connected to local database successfully');

    // Step 2: Connect to production database to get schema and data
    console.log('📡 Connecting to production database...');
    const prodPool = new Pool({
      connectionString: PROD_DB_URL,
      ssl: { rejectUnauthorized: false }
    });



    // Step 4: Get all tables from production
    console.log('📋 Getting table list from production...');
    const tablesResult = await prodPool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    const tables = tablesResult.rows.map(row => row.table_name);
    console.log(`Found ${tables.length} tables:`, tables);

    // Step 5: Create tables in local database
    console.log('🏗️ Creating tables in local database...');
    for (const table of tables) {
      try {
        // Get table structure
        const structureResult = await prodPool.query(`
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns 
          WHERE table_name = $1 
          ORDER BY ordinal_position
        `, [table]);

        // Create table
        const columns = structureResult.rows.map(col => {
          let def = `${col.column_name} ${col.data_type}`;
          if (col.is_nullable === 'NO') def += ' NOT NULL';
          if (col.column_default) def += ` DEFAULT ${col.column_default}`;
          return def;
        });

        const createTableSQL = `CREATE TABLE IF NOT EXISTS ${table} (${columns.join(', ')})`;
        await localPool.query(createTableSQL);
        console.log(`✅ Created table: ${table}`);
      } catch (error) {
        console.log(`⚠️ Error creating table ${table}:`, error.message);
      }
    }

    // Step 6: Copy data (optional - can be disabled for large datasets)
    const shouldCopyData = process.env.COPY_PRODUCTION_DATA === 'true';
    
    if (shouldCopyData) {
      console.log('📊 Copying data from production...');
      for (const table of tables) {
        try {
          // Get row count first
          const countResult = await prodPool.query(`SELECT COUNT(*) FROM ${table}`);
          const rowCount = parseInt(countResult.rows[0].count);
          
          if (rowCount > 10000) {
            console.log(`⚠️ Table ${table} has ${rowCount} rows - skipping data copy for safety`);
            continue;
          }

          // Copy data
          const dataResult = await prodPool.query(`SELECT * FROM ${table}`);
          if (dataResult.rows.length > 0) {
            const columns = Object.keys(dataResult.rows[0]);
            const values = dataResult.rows.map(row => 
              columns.map(col => {
                const val = row[col];
                return val === null ? 'NULL' : `'${String(val).replace(/'/g, "''")}'`;
              }).join(', ')
            );

            if (values.length > 0) {
              const insertSQL = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${values.map(v => `(${v})`).join(', ')})`;
              await localPool.query(insertSQL);
              console.log(`✅ Copied ${dataResult.rows.length} rows to ${table}`);
            }
          }
        } catch (error) {
          console.log(`⚠️ Error copying data for table ${table}:`, error.message);
        }
      }
    } else {
      console.log('⏭️ Skipping data copy (set COPY_PRODUCTION_DATA=true to enable)');
    }

    // Step 7: Run migrations on local database
    console.log('🔄 Running migrations on local database...');
    try {
      const { exec } = require('child_process');
      exec('npm run migrate', { cwd: process.cwd() }, (error, stdout, stderr) => {
        if (error) {
          console.log('⚠️ Migration error:', error.message);
        } else {
          console.log('✅ Migrations completed');
        }
      });
    } catch (error) {
      console.log('⚠️ Could not run migrations:', error.message);
    }

    await prodPool.end();
    await localPool.end();

    console.log('🎉 Local database setup completed!');
    console.log('📝 Next steps:');
    console.log('1. Set USE_LOCAL_DB=true in your .env file');
    console.log('2. Set COPY_PRODUCTION_DATA=true if you want production data');
    console.log('3. Restart your development server');

  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

// Run the setup
setupLocalDatabase();
