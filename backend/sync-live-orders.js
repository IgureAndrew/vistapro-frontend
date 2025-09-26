const { Pool } = require('pg');

// Live production database connection
const livePool = new Pool({
  connectionString: 'postgresql://vistapro_user:CHtvHVOsBXyVft3LZBnhqSHIFjTSHGem@dpg-d0stpo15pdvs7392u0j0-a.oregon-postgres.render.com/vistapro_qotw',
  ssl: { rejectUnauthorized: false }
});

// Local database connection
const localPool = new Pool({
  host: 'localhost',
  port: 5433,
  database: 'vistapro_dev',
  user: 'vistapro_user',
  password: 'vistapro_password'
});

async function syncLiveOrders() {
  try {
    console.log('🔍 Connecting to LIVE production database...');
    await livePool.query('SELECT NOW()');
    console.log('✅ Connected to live database successfully!');
    
    console.log('🔍 Connecting to LOCAL database...');
    await localPool.query('SELECT NOW()');
    console.log('✅ Connected to local database successfully!');
    
    // Get all orders from live database
    console.log('\n📊 Fetching orders from live database...');
    const liveOrdersQuery = `
      SELECT 
        o.id,
        o.marketer_id,
        o.sold_amount,
        o.customer_name,
        o.customer_phone,
        o.customer_address,
        o.bnpl_platform,
        o.sale_date,
        o.status,
        o.earnings,
        o.confirmed_at,
        o.earnings_per_device,
        o.confirmed_by,
        o.stock_update_id,
        o.product_id,
        o.number_of_devices,
        o.commission_paid,
        o.created_at,
        o.updated_at,
        m.first_name || ' ' || m.last_name AS marketer_name,
        m.unique_id AS marketer_unique_id,
        p.device_name,
        p.device_model,
        p.device_type
      FROM orders o
      LEFT JOIN users m ON m.id = o.marketer_id
      LEFT JOIN products p ON p.id = o.product_id
      ORDER BY o.sale_date DESC
    `;
    
    const { rows: liveOrders } = await livePool.query(liveOrdersQuery);
    console.log(`📈 Found ${liveOrders.length} orders in live database`);
    
    // Show sample of live orders
    console.log('\n📋 Sample of live orders:');
    console.table(liveOrders.slice(0, 5));
    
    // Clear local orders table
    console.log('\n🧹 Clearing local orders table...');
    await localPool.query('DELETE FROM orders');
    console.log('✅ Local orders table cleared');
    
    // Insert live orders into local database
    console.log('\n📥 Inserting live orders into local database...');
    
    for (const order of liveOrders) {
      const insertQuery = `
        INSERT INTO orders (
          id, marketer_id, sold_amount, customer_name, customer_phone, 
          customer_address, bnpl_platform, sale_date, status, earnings,
          confirmed_at, earnings_per_device, confirmed_by, stock_update_id,
          product_id, number_of_devices, commission_paid, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      `;
      
      await localPool.query(insertQuery, [
        order.id,
        order.marketer_id,
        order.sold_amount,
        order.customer_name,
        order.customer_phone,
        order.customer_address,
        order.bnpl_platform,
        order.sale_date,
        order.status,
        order.earnings,
        order.confirmed_at,
        order.earnings_per_device,
        order.confirmed_by,
        order.stock_update_id,
        order.product_id,
        order.number_of_devices,
        order.commission_paid,
        order.created_at,
        order.updated_at
      ]);
    }
    
    console.log(`✅ Successfully synced ${liveOrders.length} orders to local database`);
    
    // Verify the sync
    console.log('\n🔍 Verifying sync...');
    const localCount = await localPool.query('SELECT COUNT(*) as count FROM orders');
    console.log(`📊 Local database now has ${localCount.rows[0].count} orders`);
    
    // Show sample of synced orders
    const sampleQuery = `
      SELECT 
        o.id, o.customer_name, o.sold_amount, o.status, o.sale_date,
        m.first_name || ' ' || m.last_name AS marketer_name,
        p.device_name, p.device_model
      FROM orders o
      LEFT JOIN users m ON m.id = o.marketer_id
      LEFT JOIN products p ON p.id = o.product_id
      ORDER BY o.sale_date DESC
      LIMIT 5
    `;
    const { rows: sampleOrders } = await localPool.query(sampleQuery);
    console.log('\n📋 Sample of synced orders in local database:');
    console.table(sampleOrders);
    
  } catch (error) {
    console.error('❌ Error syncing orders:', error.message);
  } finally {
    await livePool.end();
    await localPool.end();
  }
}

syncLiveOrders();
