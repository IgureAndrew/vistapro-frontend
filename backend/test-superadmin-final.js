// Test the SuperAdmin orders endpoint after fixes
const { Pool } = require('pg');

const pool = new Pool({
  user: 'vistapro_user',
  password: 'vistapro_password',
  host: 'localhost',
  port: 5433,
  database: 'vistapro_dev',
  ssl: false
});

async function testSuperAdminFinal() {
  try {
    console.log('🔍 Testing SuperAdmin orders after fixes...');
    
    // Get Andu Eagle's ID
    const anduResult = await pool.query(`
      SELECT id, unique_id, first_name, last_name
      FROM users 
      WHERE unique_id = 'SM000005'
    `);
    
    if (anduResult.rows.length === 0) {
      console.log('❌ Andu Eagle not found');
      return;
    }
    
    const andu = anduResult.rows[0];
    console.log(`✅ Found SuperAdmin: ${andu.first_name} ${andu.last_name} (ID: ${andu.id})`);
    
    // Test the exact query from the controller
    const result = await pool.query(`
      SELECT 
        o.id,
        o.bnpl_platform,
        o.number_of_devices,
        o.sold_amount,
        o.sale_date,
        o.status,
        o.created_at,
        o.updated_at,
        m.unique_id AS marketer_unique_id,
        COALESCE(m.first_name || ' ' || m.last_name, 'Unknown Marketer') AS marketer_name,
        m.email AS marketer_email,
        m.phone AS marketer_phone,
        admin.unique_id AS admin_unique_id,
        COALESCE(admin.first_name || ' ' || admin.last_name, 'Direct Assignment') AS admin_name,
        COALESCE(p.name, 'Unknown Device') AS device_name,
        COALESCE(p.model, 'Unknown Model') AS device_model,
        COALESCE(p.category, 'Unknown Type') AS device_type,
        COALESCE(oi.imeis, ARRAY[]::text[]) AS imeis
      FROM users m
      JOIN orders o ON o.marketer_id = m.id
      LEFT JOIN users admin ON admin.id = m.admin_id
      LEFT JOIN order_items oi ON oi.order_id = o.id
      LEFT JOIN products p ON p.id = o.product_id
      WHERE m.role = 'Marketer'
        AND (
          m.super_admin_id = $1
          OR
          (m.admin_id IS NOT NULL AND admin.super_admin_id = $1)
        )
      ORDER BY o.sale_date DESC
      LIMIT 10
    `, [andu.id]);
    
    console.log(`\n📊 Found ${result.rows.length} orders for SuperAdmin ${andu.first_name} ${andu.last_name}:`);
    
    if (result.rows.length > 0) {
      result.rows.forEach((order, index) => {
        console.log(`\n  ${index + 1}. Order ID: ${order.id}`);
        console.log(`     Marketer: ${order.marketer_name} (${order.marketer_unique_id})`);
        console.log(`     Admin: ${order.admin_name} (${order.admin_unique_id})`);
        console.log(`     Status: ${order.status}`);
        console.log(`     Amount: ₦${order.sold_amount}`);
        console.log(`     Date: ${order.sale_date}`);
      });
    } else {
      console.log('  No orders found');
    }
    
    // Check the hierarchy
    console.log('\n🔍 Checking hierarchy:');
    const hierarchyQuery = `
      SELECT 
        m.unique_id,
        m.first_name || ' ' || m.last_name as marketer_name,
        m.role,
        admin.unique_id as admin_unique_id,
        admin.first_name || ' ' || admin.last_name as admin_name,
        admin.super_admin_id
      FROM users m
      LEFT JOIN users admin ON admin.id = m.admin_id
      WHERE m.role = 'Marketer'
        AND (
          m.super_admin_id = $1
          OR
          (m.admin_id IS NOT NULL AND admin.super_admin_id = $1)
        )
    `;
    
    const hierarchyResult = await pool.query(hierarchyQuery, [andu.id]);
    
    console.log(`\n👥 Marketers under ${andu.first_name} ${andu.last_name}:`);
    hierarchyResult.rows.forEach(row => {
      console.log(`  - ${row.marketer_name} (${row.unique_id}) [${row.role}]`);
      if (row.admin_name) {
        console.log(`    → Assigned to Admin: ${row.admin_name} (${row.admin_unique_id})`);
      } else {
        console.log(`    → Direct assignment to SuperAdmin`);
      }
    });
    
    console.log('\n✅ Test completed!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

testSuperAdminFinal();
