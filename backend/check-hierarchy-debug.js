// Debug the hierarchy and orders
const { Pool } = require('pg');

const pool = new Pool({
  user: 'vistapro_user',
  password: 'vistapro_password',
  host: 'localhost',
  port: 5433,
  database: 'vistapro_dev',
  ssl: false
});

async function debugHierarchy() {
  try {
    console.log('🔍 Debugging hierarchy and orders...');
    
    // Check Andu Eagle's assignments
    const anduResult = await pool.query(`
      SELECT id, unique_id, first_name, last_name, role, admin_id, super_admin_id
      FROM users 
      WHERE unique_id = 'SM000005'
    `);
    
    if (anduResult.rows.length === 0) {
      console.log('❌ Andu Eagle not found');
      return;
    }
    
    const andu = anduResult.rows[0];
    console.log(`\n👤 SuperAdmin: ${andu.first_name} ${andu.last_name} (ID: ${andu.id})`);
    
    // Check admins assigned to Andu
    const adminsResult = await pool.query(`
      SELECT id, unique_id, first_name, last_name, role, admin_id, super_admin_id
      FROM users 
      WHERE super_admin_id = $1 AND role = 'Admin'
    `, [andu.id]);
    
    console.log(`\n👥 Admins assigned to ${andu.first_name}:`);
    adminsResult.rows.forEach(admin => {
      console.log(`  - ${admin.first_name} ${admin.last_name} (${admin.unique_id})`);
    });
    
    // Check marketers assigned to those admins
    if (adminsResult.rows.length > 0) {
      const adminIds = adminsResult.rows.map(a => a.id);
      const marketersResult = await pool.query(`
        SELECT id, unique_id, first_name, last_name, role, admin_id, super_admin_id
        FROM users 
        WHERE admin_id = ANY($1) AND role = 'Marketer'
      `, [adminIds]);
      
      console.log(`\n👨‍💼 Marketers assigned to admins:`);
      marketersResult.rows.forEach(marketer => {
        console.log(`  - ${marketer.first_name} ${marketer.last_name} (${marketer.unique_id})`);
      });
    }
    
    // Check orders for these marketers
    const ordersResult = await pool.query(`
      SELECT 
        o.id,
        o.sold_amount,
        o.status,
        m.unique_id as marketer_unique_id,
        m.first_name || ' ' || m.last_name as marketer_name,
        m.admin_id,
        admin.first_name || ' ' || admin.last_name as admin_name
      FROM users m
      JOIN orders o ON o.marketer_id = m.id
      LEFT JOIN users admin ON admin.id = m.admin_id
      WHERE m.role = 'Marketer'
        AND (
          m.super_admin_id = $1
          OR
          (m.admin_id IS NOT NULL AND admin.super_admin_id = $1)
        )
      ORDER BY o.sale_date DESC
      LIMIT 5
    `, [andu.id]);
    
    console.log(`\n📊 Sample orders (${ordersResult.rows.length} total):`);
    ordersResult.rows.forEach((order, index) => {
      console.log(`  ${index + 1}. ${order.marketer_name} - ₦${order.sold_amount} (${order.status})`);
      console.log(`     Admin: ${order.admin_name || 'No Admin Assigned'}`);
      console.log(`     Admin ID: ${order.admin_id || 'NULL'}`);
    });
    
    // Check total revenue calculation
    const revenueResult = await pool.query(`
      SELECT 
        SUM(o.sold_amount) as total_revenue,
        COUNT(*) as total_orders
      FROM users m
      JOIN orders o ON o.marketer_id = m.id
      LEFT JOIN users admin ON admin.id = m.admin_id
      WHERE m.role = 'Marketer'
        AND (
          m.super_admin_id = $1
          OR
          (m.admin_id IS NOT NULL AND admin.super_admin_id = $1)
        )
    `, [andu.id]);
    
    console.log(`\n💰 Revenue calculation:`);
    console.log(`  Total Revenue: ₦${revenueResult.rows[0].total_revenue || 0}`);
    console.log(`  Total Orders: ${revenueResult.rows[0].total_orders}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

debugHierarchy();
