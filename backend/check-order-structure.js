// Check the order_items table structure
const { Pool } = require('pg');

const pool = new Pool({
  user: 'vistapro_user',
  password: 'vistapro_password',
  host: 'localhost',
  port: 5433,
  database: 'vistapro_dev',
  ssl: false
});

async function checkOrderStructure() {
  try {
    console.log('🔍 Checking order structure...');
    
    // Check order_items table structure
    const orderItemsStructure = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'order_items'
      ORDER BY ordinal_position
    `);
    
    console.log('📋 order_items table structure:');
    orderItemsStructure.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });
    
    // Check orders table structure
    const ordersStructure = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'orders'
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 orders table structure:');
    ordersStructure.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });
    
    // Check if there are any orders
    const ordersCount = await pool.query('SELECT COUNT(*) as count FROM orders');
    console.log(`\n📊 Total orders in database: ${ordersCount.rows[0].count}`);
    
    // Check if there are any order_items
    const orderItemsCount = await pool.query('SELECT COUNT(*) as count FROM order_items');
    console.log(`📊 Total order_items in database: ${orderItemsCount.rows[0].count}`);
    
    // Check sample orders
    const sampleOrders = await pool.query(`
      SELECT id, marketer_id, status, sold_amount, sale_date
      FROM orders 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    
    console.log('\n📋 Sample orders:');
    sampleOrders.rows.forEach(row => {
      console.log(`  - Order ${row.id}: Marketer ${row.marketer_id}, Status: ${row.status}, Amount: ${row.sold_amount}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

checkOrderStructure();
