const { pool } = require('./src/config/database');

async function testMasterAdminOrders() {
  try {
    console.log('🔍 Testing MasterAdmin order history query...');
    
    // Test the current query from manageOrderController.js
    const currentQuery = `
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
        a.first_name || ' ' || a.last_name AS admin_name,
        a.unique_id AS admin_unique_id,
        p.device_name,
        p.device_model,
        p.device_type,
        ARRAY_AGG(ii.imei ORDER BY ii.id)
          FILTER (WHERE ii.imei IS NOT NULL) AS imeis
      FROM orders o
      JOIN users m ON m.id = o.marketer_id
      LEFT JOIN products p ON p.id = o.product_id
      LEFT JOIN users a ON a.id = m.admin_id
      LEFT JOIN users sa ON sa.id = a.super_admin_id
      LEFT JOIN order_items oi ON oi.order_id = o.id
      LEFT JOIN inventory_items ii ON ii.id = oi.inventory_item_id
      GROUP BY
        o.id, m.first_name, m.last_name, m.unique_id,
        a.first_name, a.last_name, a.unique_id,
        p.device_name, p.device_model, p.device_type,
        o.customer_name, o.bnpl_platform, o.number_of_devices, o.sold_amount, o.sale_date, o.status
      ORDER BY o.sale_date DESC
      LIMIT 10
    `;
    
    const { rows } = await pool.query(currentQuery);
    console.log(`📊 Current query returns ${rows.length} orders`);
    
    if (rows.length > 0) {
      console.log('\n📋 Sample orders from current query:');
      console.table(rows.slice(0, 3));
    }
    
    // Test total orders count
    const countQuery = 'SELECT COUNT(*) as total FROM orders';
    const countResult = await pool.query(countQuery);
    console.log(`\n📈 Total orders in database: ${countResult.rows[0].total}`);
    
    // Test orders with valid marketer_id
    const validMarketerQuery = `
      SELECT COUNT(*) as count 
      FROM orders o 
      JOIN users m ON m.id = o.marketer_id
    `;
    const validMarketerResult = await pool.query(validMarketerQuery);
    console.log(`📊 Orders with valid marketer_id: ${validMarketerResult.rows[0].count}`);
    
    // Test orders without valid marketer_id
    const invalidMarketerQuery = `
      SELECT COUNT(*) as count 
      FROM orders o 
      LEFT JOIN users m ON m.id = o.marketer_id
      WHERE m.id IS NULL
    `;
    const invalidMarketerResult = await pool.query(invalidMarketerQuery);
    console.log(`📊 Orders without valid marketer_id: ${invalidMarketerResult.rows[0].count}`);
    
  } catch (error) {
    console.error('❌ Error testing MasterAdmin orders:', error.message);
  } finally {
    await pool.end();
  }
}

testMasterAdminOrders();
