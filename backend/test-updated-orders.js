const { pool } = require('./src/config/database');

async function testUpdatedOrders() {
  try {
    console.log('🔍 Testing updated MasterAdmin order history query...');
    
    // Test the updated query
    const updatedQuery = `
      SELECT
        o.id,
        o.bnpl_platform,
        o.number_of_devices,
        o.sold_amount,
        o.sale_date,
        o.status,
        o.customer_name,
        u.first_name || ' ' || u.last_name AS user_name,
        u.unique_id AS user_unique_id,
        u.role AS user_role,
        a.first_name || ' ' || a.last_name AS admin_name,
        a.unique_id AS admin_unique_id,
        sa.first_name || ' ' || sa.last_name AS super_admin_name,
        sa.unique_id AS super_admin_unique_id,
        p.device_name,
        p.device_model,
        p.device_type,
        ARRAY_AGG(ii.imei ORDER BY ii.id)
          FILTER (WHERE ii.imei IS NOT NULL) AS imeis
      FROM orders o
      JOIN users u ON u.id = o.marketer_id
      LEFT JOIN products p ON p.id = o.product_id
      LEFT JOIN users a ON a.id = u.admin_id
      LEFT JOIN users sa ON sa.id = a.super_admin_id
      LEFT JOIN order_items oi ON oi.order_id = o.id
      LEFT JOIN inventory_items ii ON ii.id = oi.inventory_item_id
      GROUP BY
        o.id, u.first_name, u.last_name, u.unique_id, u.role,
        a.first_name, a.last_name, a.unique_id,
        sa.first_name, sa.last_name, sa.unique_id,
        p.device_name, p.device_model, p.device_type,
        o.customer_name, o.bnpl_platform, o.number_of_devices, o.sold_amount, o.sale_date, o.status
      ORDER BY o.sale_date DESC
      LIMIT 10
    `;
    
    const { rows } = await pool.query(updatedQuery);
    console.log(`📊 Updated query returns ${rows.length} orders`);
    
    if (rows.length > 0) {
      console.log('\n📋 Sample orders from updated query:');
      console.table(rows.slice(0, 5));
      
      // Show role distribution
      const roleCounts = {};
      rows.forEach(order => {
        roleCounts[order.user_role] = (roleCounts[order.user_role] || 0) + 1;
      });
      console.log('\n📊 Role distribution in results:');
      console.table(roleCounts);
    }
    
  } catch (error) {
    console.error('❌ Error testing updated orders:', error.message);
  } finally {
    await pool.end();
  }
}

testUpdatedOrders();
