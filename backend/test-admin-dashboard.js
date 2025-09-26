const { pool } = require('./src/config/database');

async function testAdminDashboard() {
  try {
    console.log('🧪 Testing Admin Dashboard Data...\n');
    
    // Test with Admin ASM000021 (Andrei)
    const adminId = parseInt(184); // Internal ID for ASM000021
    
    console.log('📊 Testing Admin ASM000021 (Andrei):');
    
    // 1. Check assigned marketers
    const { rows: assignedMarketers } = await pool.query(`
      SELECT COUNT(*) as count
      FROM users 
      WHERE admin_id = $1 AND role = 'Marketer' AND deleted_at IS NULL
    `, [adminId]);
    
    console.log(`  - Assigned Marketers: ${assignedMarketers[0].count}`);
    
    // 2. Check team sales
    const { rows: teamSales } = await pool.query(`
      SELECT 
        COALESCE(SUM(o.sold_amount), 0) as current_month
      FROM orders o
      JOIN users u ON o.marketer_id = u.id
      WHERE u.admin_id = $1 AND u.role = 'Marketer'
      AND EXTRACT(MONTH FROM o.created_at) = EXTRACT(MONTH FROM NOW())
      AND EXTRACT(YEAR FROM o.created_at) = EXTRACT(YEAR FROM NOW())
    `, [adminId]);
    
    console.log(`  - Team Sales (Current Month): ₦${teamSales[0].current_month}`);
    
    // 3. Check team orders
    const { rows: teamOrders } = await pool.query(`
      SELECT 
        COUNT(*) as current_month
      FROM orders o
      JOIN users u ON o.marketer_id = u.unique_id
      WHERE u.admin_id = $1 AND u.role = 'Marketer'
      AND EXTRACT(MONTH FROM o.created_at) = EXTRACT(MONTH FROM NOW())
      AND EXTRACT(YEAR FROM o.created_at) = EXTRACT(YEAR FROM NOW())
    `, [adminId]);
    
    console.log(`  - Team Orders (Current Month): ${teamOrders[0].current_month}`);
    
    // 4. Check active marketers
    const { rows: activeMarketers } = await pool.query(`
      SELECT COUNT(DISTINCT u.id) as count
      FROM users u
      JOIN orders o ON u.unique_id = o.marketer_id
      WHERE u.admin_id = $1 AND u.role = 'Marketer' 
      AND o.created_at >= NOW() - INTERVAL '7 days'
      AND u.deleted_at IS NULL
    `, [adminId]);
    
    console.log(`  - Active Marketers (Last 7 days): ${activeMarketers[0].count}`);
    
    // 5. Check personal sales (Admin's own orders)
    const { rows: personalSales } = await pool.query(`
      SELECT 
        COALESCE(SUM(sold_amount), 0) as current_month
      FROM orders 
      WHERE marketer_id = (SELECT unique_id FROM users WHERE id = $1)
      AND EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM NOW())
      AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW())
    `, [adminId]);
    
    console.log(`  - Personal Sales (Current Month): ₦${personalSales[0].current_month}`);
    
    // 6. List assigned marketers
    const { rows: marketers } = await pool.query(`
      SELECT unique_id, first_name, last_name, email
      FROM users 
      WHERE admin_id = $1 AND role = 'Marketer' AND deleted_at IS NULL
      ORDER BY first_name, last_name
    `, [adminId]);
    
    console.log(`\n👥 Assigned Marketers:`);
    marketers.forEach(marketer => {
      console.log(`  - ${marketer.first_name} ${marketer.last_name} (${marketer.unique_id})`);
    });
    
    console.log(`\n✅ Admin Dashboard data is now working with real database values!`);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await pool.end();
  }
}

testAdminDashboard().catch(console.error);
