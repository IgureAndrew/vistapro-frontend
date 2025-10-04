const { Pool } = require('pg');

// Use production database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false
});

async function debugProductionEnum() {
  try {
    console.log('🔍 Checking production stock_update_status enum values...');
    
    // Check enum values
    const enumValues = await pool.query(`
      SELECT enumlabel 
      FROM pg_enum 
      WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'stock_update_status')
      ORDER BY enumsortorder
    `);
    
    console.log('📋 Production stock_update_status enum values:');
    enumValues.rows.forEach(row => {
      console.log(`  - ${row.enumlabel}`);
    });
    
    // Check if pending_order exists
    const hasPendingOrder = enumValues.rows.some(row => row.enumlabel === 'pending_order');
    console.log(`\n🔍 pending_order enum value exists: ${hasPendingOrder}`);
    
    // Test the query that's failing
    console.log('\n🧪 Testing the failing query with a sample marketer...');
    
    // First, get a sample marketer ID
    const marketerResult = await pool.query('SELECT id FROM users WHERE role = \'Marketer\' LIMIT 1');
    if (marketerResult.rows.length === 0) {
      console.log('❌ No marketers found in database');
      return;
    }
    
    const marketerId = marketerResult.rows[0].id;
    console.log(`📋 Testing with marketer ID: ${marketerId}`);
    
    const testQuery = `
      (
        SELECT 
          'stock_pickup' as type,
          'Picked up ' || p.device_name || ' ' || p.device_model || ' (' || su.quantity || ' units)' as description,
          su.pickup_date as timestamp,
          su.status,
          p.device_name,
          p.device_model,
          su.quantity,
          su.id as reference_id,
          'pickup' as category
        FROM stock_updates su
        JOIN products p ON su.product_id = p.id
        WHERE su.marketer_id = $1
        LIMIT 1
      )
    `;
    
    const result = await pool.query(testQuery, [marketerId]);
    console.log('✅ Query executed successfully');
    console.log('📊 Result:', JSON.stringify(result.rows, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('📋 Full error:', error);
  } finally {
    await pool.end();
  }
}

debugProductionEnum();
