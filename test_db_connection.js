const { Pool } = require('pg');

async function testConnection() {
  let pool;
  
  try {
    console.log('🔍 Testing database connection...');
    
    // Try different connection methods
    const connectionMethods = [
      // Method 1: Direct connection string
      {
        connectionString: process.env.DATABASE_URL,
        ssl: false
      },
      // Method 2: Parse connection string
      {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
      },
      // Method 3: Individual parameters
      {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME || 'vistapro',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || '',
        ssl: false
      }
    ];
    
    for (let i = 0; i < connectionMethods.length; i++) {
      try {
        console.log(`\n🔄 Trying connection method ${i + 1}...`);
        pool = new Pool(connectionMethods[i]);
        
        const result = await pool.query('SELECT NOW()');
        console.log(`✅ Connection method ${i + 1} successful!`);
        console.log(`📅 Database time: ${result.rows[0].now}`);
        
        // Test a simple query
        const tableCheck = await pool.query(`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name IN ('guarantor_employment_form', 'direct_sales_commitment_form', 'marketer_biodata')
          ORDER BY table_name
        `);
        
        console.log(`📋 Found tables:`, tableCheck.rows.map(r => r.table_name));
        
        // Check if we have any data
        if (tableCheck.rows.length > 0) {
          for (const table of tableCheck.rows) {
            const countResult = await pool.query(`SELECT COUNT(*) as count FROM ${table.table_name}`);
            console.log(`📊 ${table.table_name}: ${countResult.rows[0].count} rows`);
          }
        }
        
        break; // If successful, stop trying other methods
        
      } catch (error) {
        console.log(`❌ Connection method ${i + 1} failed:`, error.message);
        if (pool) {
          await pool.end();
          pool = null;
        }
      }
    }
    
  } catch (error) {
    console.error('❌ All connection methods failed:', error.message);
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}

// Run the test
testConnection();
