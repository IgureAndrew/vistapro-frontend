// Debug the orders issue
const { Pool } = require('pg');

const pool = new Pool({
  user: 'vistapro_user',
  password: 'vistapro_password',
  host: 'localhost',
  port: 5433,
  database: 'vistapro_dev',
  ssl: false
});

async function debugOrdersIssue() {
  try {
    console.log('🔍 Debugging orders issue...');
    
    // Check Andu Eagle's ID
    const anduResult = await pool.query(`
      SELECT id, unique_id, first_name, last_name, super_admin_id, admin_id
      FROM users 
      WHERE unique_id = 'SM000005'
    `);
    
    console.log('👑 Andu Eagle:', anduResult.rows[0]);
    const anduId = anduResult.rows[0].id;
    
    // Check Andrei's assignment
    const andreiResult = await pool.query(`
      SELECT id, unique_id, first_name, last_name, super_admin_id, admin_id
      FROM users 
      WHERE unique_id = 'ASM000021'
    `);
    
    console.log('👤 Andrei Igurrr:', andreiResult.rows[0]);
    const andreiId = andreiResult.rows[0].id;
    
    // Check leo smith's assignment
    const leoResult = await pool.query(`
      SELECT id, unique_id, first_name, last_name, super_admin_id, admin_id
      FROM users 
      WHERE unique_id = 'DSR00093'
    `);
    
    console.log('👤 leo smith:', leoResult.rows[0]);
    const leoId = leoResult.rows[0].id;
    
    // Check what orders leo smith has
    const leoOrders = await pool.query(`
      SELECT id, marketer_id, status, sold_amount, sale_date
      FROM orders 
      WHERE marketer_id = $1
      ORDER BY created_at DESC
      LIMIT 5
    `, [leoId]);
    
    console.log(`\n📊 leo smith's orders (${leoOrders.rows.length}):`);
    leoOrders.rows.forEach(order => {
      console.log(`  - Order ${order.id}: Status: ${order.status}, Amount: ${order.sold_amount}, Date: ${order.sale_date}`);
    });
    
    // Check what orders are being returned by the SuperAdmin query
    const superAdminOrders = await pool.query(`
      SELECT 
        o.id,
        o.status,
        o.sold_amount,
        o.sale_date,
        m.unique_id AS marketer_unique_id,
        m.first_name || ' ' || m.last_name AS marketer_name,
        admin.unique_id AS admin_unique_id,
        admin.first_name || ' ' || admin.last_name AS admin_name,
        m.super_admin_id,
        m.admin_id
      FROM users m
      JOIN orders o ON o.marketer_id = m.id
      LEFT JOIN users admin ON admin.id = m.admin_id
      WHERE m.role = 'Marketer'
        AND (
          m.super_admin_id = $1
          OR
          (m.admin_id IS NOT NULL AND admin.super_admin_id = $1)
        )
      ORDER BY o.created_at DESC
      LIMIT 10
    `, [anduId]);
    
    console.log(`\n📊 SuperAdmin query results (${superAdminOrders.rows.length}):`);
    superAdminOrders.rows.forEach(order => {
      console.log(`  - Order ${order.id}: ${order.marketer_name} (${order.marketer_unique_id})`);
      console.log(`    Admin: ${order.admin_name || 'None'} (${order.admin_unique_id || 'None'})`);
      console.log(`    Marketer super_admin_id: ${order.super_admin_id}, admin_id: ${order.admin_id}`);
      console.log(`    Status: ${order.status}, Amount: ${order.sold_amount}`);
      console.log('');
    });
    
    // Check if there are any orders from marketers assigned to Andrei
    const andreiMarketerOrders = await pool.query(`
      SELECT 
        o.id,
        o.status,
        o.sold_amount,
        m.unique_id AS marketer_unique_id,
        m.first_name || ' ' || m.last_name AS marketer_name,
        m.admin_id
      FROM users m
      JOIN orders o ON o.marketer_id = m.id
      WHERE m.role = 'Marketer'
        AND m.admin_id = $1
      ORDER BY o.created_at DESC
      LIMIT 5
    `, [andreiId]);
    
    console.log(`\n📊 Orders from marketers assigned to Andrei (${andreiMarketerOrders.rows.length}):`);
    andreiMarketerOrders.rows.forEach(order => {
      console.log(`  - Order ${order.id}: ${order.marketer_name} (${order.marketer_unique_id})`);
      console.log(`    Status: ${order.status}, Amount: ${order.sold_amount}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

debugOrdersIssue();
