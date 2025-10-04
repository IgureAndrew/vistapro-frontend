const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://vistapro_user:vistapro_password@localhost:5433/vistapro_dev',
  ssl: false
});

async function debugStockUpdatesSchema() {
  try {
    console.log('🔍 Checking stock_updates table schema...');
    
    // Check table structure
    const tableInfo = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'stock_updates' 
      ORDER BY ordinal_position
    `);
    
    console.log('📋 stock_updates table columns:');
    tableInfo.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });
    
    // Check if product_id column exists
    const productIdExists = tableInfo.rows.some(row => row.column_name === 'product_id');
    console.log(`\n🔍 product_id column exists: ${productIdExists}`);
    
    // Check if device_id column exists
    const deviceIdExists = tableInfo.rows.some(row => row.column_name === 'device_id');
    console.log(`🔍 device_id column exists: ${deviceIdExists}`);
    
    // Check sample data
    const sampleData = await pool.query('SELECT * FROM stock_updates LIMIT 3');
    console.log('\n📊 Sample stock_updates data:');
    console.log(JSON.stringify(sampleData.rows, null, 2));
    
    // Check products table structure
    const productsInfo = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'products' 
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 products table columns:');
    productsInfo.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

debugStockUpdatesSchema();
