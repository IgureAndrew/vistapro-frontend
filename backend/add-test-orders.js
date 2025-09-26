const { Pool } = require('pg');

const pool = new Pool({
  user: 'vistapro_user',
  host: 'localhost',
  database: 'vistapro_dev',
  password: 'vistapro_password',
  port: 5433,
});

async function addTestOrders() {
  try {
    console.log('🔍 Adding test orders for pagination testing...');
    
    // Get leo smith's ID (marketer)
    const marketerResult = await pool.query(
      "SELECT id FROM users WHERE unique_id = 'DSR00093' AND role = 'Marketer'"
    );
    
    if (marketerResult.rows.length === 0) {
      console.log('❌ Marketer leo smith not found');
      return;
    }
    
    const marketerId = marketerResult.rows[0].id;
    console.log(`✅ Found marketer ID: ${marketerId}`);
    
    // Get a product ID
    const productResult = await pool.query(
      "SELECT id FROM products LIMIT 1"
    );
    
    if (productResult.rows.length === 0) {
      console.log('❌ No products found');
      return;
    }
    
    const productId = productResult.rows[0].id;
    console.log(`✅ Found product ID: ${productId}`);
    
    // Add 6 more test orders (total will be 10, perfect for testing 5 per page)
    const testOrders = [
      {
        customer_name: 'John Doe',
        customer_phone: '08012345678',
        customer_address: '123 Main St, Lagos',
        bnpl_platform: 'Test Platform 1',
        number_of_devices: 1,
        sold_amount: 150000,
        sale_date: '2025-09-01',
        status: 'pending',
        product_id: productId
      },
      {
        customer_name: 'Jane Smith',
        customer_phone: '08012345679',
        customer_address: '456 Oak Ave, Abuja',
        bnpl_platform: 'Test Platform 2',
        number_of_devices: 2,
        sold_amount: 300000,
        sale_date: '2025-09-02',
        status: 'approved',
        product_id: productId
      },
      {
        customer_name: 'Bob Johnson',
        customer_phone: '08012345680',
        customer_address: '789 Pine Rd, Port Harcourt',
        bnpl_platform: 'Test Platform 3',
        number_of_devices: 1,
        sold_amount: 180000,
        sale_date: '2025-09-03',
        status: 'rejected',
        product_id: productId
      },
      {
        customer_name: 'Alice Brown',
        customer_phone: '08012345681',
        customer_address: '321 Elm St, Kano',
        bnpl_platform: 'Test Platform 4',
        number_of_devices: 3,
        sold_amount: 450000,
        sale_date: '2025-09-04',
        status: 'completed',
        product_id: productId
      },
      {
        customer_name: 'Charlie Wilson',
        customer_phone: '08012345682',
        customer_address: '654 Maple Dr, Ibadan',
        bnpl_platform: 'Test Platform 5',
        number_of_devices: 1,
        sold_amount: 120000,
        sale_date: '2025-09-05',
        status: 'pending',
        product_id: productId
      },
      {
        customer_name: 'Diana Davis',
        customer_phone: '08012345683',
        customer_address: '987 Cedar Ln, Enugu',
        bnpl_platform: 'Test Platform 6',
        number_of_devices: 2,
        sold_amount: 250000,
        sale_date: '2025-09-06',
        status: 'approved',
        product_id: productId
      }
    ];
    
    for (let i = 0; i < testOrders.length; i++) {
      const order = testOrders[i];
      const result = await pool.query(
        `INSERT INTO orders (marketer_id, customer_name, customer_phone, customer_address, bnpl_platform, number_of_devices, sold_amount, sale_date, status, product_id, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
         RETURNING id`,
        [marketerId, order.customer_name, order.customer_phone, order.customer_address, order.bnpl_platform, order.number_of_devices, order.sold_amount, order.sale_date, order.status, order.product_id]
      );
      
      console.log(`✅ Added order ${i + 1}: ID ${result.rows[0].id} - ${order.bnpl_platform} (${order.status})`);
    }
    
    console.log('🎉 Successfully added 6 test orders!');
    console.log('📊 Total orders should now be 10 (4 original + 6 new)');
    console.log('🔍 This will show 5 orders per page with 2 pages total');
    
  } catch (error) {
    console.error('❌ Error adding test orders:', error);
  } finally {
    await pool.end();
  }
}

addTestOrders();
