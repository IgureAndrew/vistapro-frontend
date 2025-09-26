const { Pool } = require('pg');

// Live production database connection
const livePool = new Pool({
  connectionString: 'postgresql://vistapro_user:CHtvHVOsBXyVft3LZBnhqSHIFjTSHGem@dpg-d0stpo15pdvs7392u0j0-a.oregon-postgres.render.com/vistapro_qotw',
  ssl: { rejectUnauthorized: false }
});

async function checkLiveDatabase() {
  try {
    console.log('🔍 Connecting to LIVE production database...');
    
    // Test connection
    await livePool.query('SELECT NOW()');
    console.log('✅ Connected to live database successfully!');
    
    // Check orders table structure
    console.log('\n📋 Checking orders table structure...');
    const structureQuery = `
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'orders' 
      ORDER BY ordinal_position
    `;
    const structure = await livePool.query(structureQuery);
    console.log('Orders table columns:');
    console.table(structure.rows);
    
    // Check recent orders data
    console.log('\n📊 Checking recent orders data...');
    const ordersQuery = `
      SELECT 
        o.id,
        o.bnpl_platform,
        o.number_of_devices,
        o.sold_amount,
        o.sale_date,
        o.status,
        o.customer_name,
        m.first_name || ' ' || m.last_name AS marketer_name,
        m.unique_id AS marketer_unique_id,
        p.device_name,
        p.device_model,
        p.device_type
      FROM orders o
      LEFT JOIN users m ON m.id = o.marketer_id
      LEFT JOIN products p ON p.id = o.product_id
      ORDER BY o.sale_date DESC
      LIMIT 10
    `;
    const orders = await livePool.query(ordersQuery);
    console.log('Recent orders from live database:');
    console.table(orders.rows);
    
    // Check total count
    const countQuery = 'SELECT COUNT(*) as total_orders FROM orders';
    const count = await livePool.query(countQuery);
    console.log(`\n📈 Total orders in live database: ${count.rows[0].total_orders}`);
    
    // Check order status distribution
    const statusQuery = `
      SELECT status, COUNT(*) as count 
      FROM orders 
      GROUP BY status 
      ORDER BY count DESC
    `;
    const status = await livePool.query(statusQuery);
    console.log('\n📊 Order status distribution:');
    console.table(status.rows);
    
  } catch (error) {
    console.error('❌ Error checking live database:', error.message);
  } finally {
    await livePool.end();
  }
}

checkLiveDatabase();
