// Debug the backend API logic to see why it returns 58 instead of 85
require('dotenv').config();
const { Pool } = require('pg');

// Test both local and production database configurations
const localConfig = {
  user: 'vistapro_user',
  password: 'vistapro_password',
  host: 'localhost',
  port: '5433',
  database: 'vistapro_dev',
  ssl: false
};

const productionConfig = {
  connectionString: "postgresql://vistapro_user:CHtvHVOsBXyVft3LZBnhqSHIFjTSHGem@dpg-d0stpo15pdvs7392u0j0-a.oregon-postgres.render.com/vistapro_qotw?sslmode=require",
  ssl: { rejectUnauthorized: false }
};

async function testBothDatabases() {
  console.log('🔍 Testing both database configurations...\n');
  
  // Test local database
  try {
    console.log('1️⃣ Testing LOCAL database...');
    const localPool = new Pool(localConfig);
    const localClient = await localPool.connect();
    
    const localUsers = await localClient.query('SELECT COUNT(*) AS total FROM users');
    console.log(`   📊 Local database users: ${localUsers.rows[0].total}`);
    
    localClient.release();
    await localPool.end();
  } catch (error) {
    console.log(`   ❌ Local database error: ${error.message}`);
  }
  
  // Test production database
  try {
    console.log('\n2️⃣ Testing PRODUCTION database...');
    const prodPool = new Pool(productionConfig);
    const prodClient = await prodPool.connect();
    
    const prodUsers = await prodClient.query('SELECT COUNT(*) AS total FROM users');
    console.log(`   📊 Production database users: ${prodUsers.rows[0].total}`);
    
    // Test the exact query used in the dashboard API
    const dashboardQuery = 'SELECT COUNT(*) AS total FROM users';
    const dashboardResult = await prodClient.query(dashboardQuery);
    console.log(`   📊 Dashboard query result: ${dashboardResult.rows[0].total}`);
    
    prodClient.release();
    await prodPool.end();
  } catch (error) {
    console.log(`   ❌ Production database error: ${error.message}`);
  }
  
  // Test what the backend environment would use
  try {
    console.log('\n3️⃣ Testing BACKEND environment configuration...');
    
    // Simulate production environment
    process.env.NODE_ENV = 'production';
    process.env.DATABASE_URL = "postgresql://vistapro_user:CHtvHVOsBXyVft3LZBnhqSHIFjTSHGem@dpg-d0stpo15pdvs7392u0j0-a.oregon-postgres.render.com/vistapro_qotw?sslmode=require";
    
    // Load the actual database config
    delete require.cache[require.resolve('./src/config/database.js')];
    const { pool } = require('./src/config/database.js');
    
    const client = await pool.connect();
    const users = await client.query('SELECT COUNT(*) AS total FROM users');
    console.log(`   📊 Backend config users: ${users.rows[0].total}`);
    
    client.release();
    await pool.end();
  } catch (error) {
    console.log(`   ❌ Backend config error: ${error.message}`);
  }
}

testBothDatabases();
