const { pool } = require('./src/config/database');

async function testOrderHistory() {
  try {
    const query = `
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
      LIMIT 5
    `;
    
    const { rows } = await pool.query(query);
    console.log('Order History API Query Result:');
    console.table(rows);
    
    // Check if we have any data
    if (rows.length === 0) {
      console.log('❌ No orders found in the query result');
    } else {
      console.log(`✅ Found ${rows.length} orders`);
      
      // Check for missing data
      rows.forEach((order, index) => {
        console.log(`\nOrder ${index + 1} (ID: ${order.id}):`);
        console.log(`  - Marketer: ${order.marketer_name || 'MISSING'}`);
        console.log(`  - Device: ${order.device_name || 'MISSING'} ${order.device_model || ''}`);
        console.log(`  - Status: ${order.status || 'MISSING'}`);
        console.log(`  - Amount: ${order.sold_amount || 'MISSING'}`);
        console.log(`  - Customer: ${order.customer_name || 'MISSING'}`);
        console.log(`  - BNPL: ${order.bnpl_platform || 'MISSING'}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error testing order history:', error.message);
  } finally {
    await pool.end();
  }
}

testOrderHistory();
