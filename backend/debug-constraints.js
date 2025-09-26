const { pool } = require('./src/config/database');

async function debugConstraints() {
  console.log('🔍 Debugging table constraints...');
  
  try {
    // Check constraints on admin_verification_details
    console.log('1. Checking constraints on admin_verification_details...');
    const constraints = await pool.query(`
      SELECT 
        tc.constraint_name, 
        tc.constraint_type,
        kcu.column_name,
        tc.table_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
      WHERE tc.table_name = 'admin_verification_details'
      ORDER BY tc.constraint_type, tc.constraint_name
    `);
    
    console.log('✅ Constraints found:', constraints.rows.length);
    constraints.rows.forEach(constraint => {
      console.log(`   - ${constraint.constraint_type}: ${constraint.constraint_name} on ${constraint.column_name}`);
    });
    
    // Check indexes on admin_verification_details
    console.log('2. Checking indexes on admin_verification_details...');
    const indexes = await pool.query(`
      SELECT 
        indexname,
        indexdef
      FROM pg_indexes 
      WHERE tablename = 'admin_verification_details'
    `);
    
    console.log('✅ Indexes found:', indexes.rows.length);
    indexes.rows.forEach(index => {
      console.log(`   - ${index.indexname}: ${index.indexdef}`);
    });
    
    // Check if there's a unique constraint on verification_submission_id
    console.log('3. Checking for unique constraint on verification_submission_id...');
    const uniqueCheck = await pool.query(`
      SELECT 
        tc.constraint_name, 
        tc.constraint_type,
        kcu.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
      WHERE tc.table_name = 'admin_verification_details'
        AND tc.constraint_type = 'UNIQUE'
        AND kcu.column_name = 'verification_submission_id'
    `);
    
    if (uniqueCheck.rows.length > 0) {
      console.log('✅ Unique constraint found:', uniqueCheck.rows[0]);
    } else {
      console.log('❌ No unique constraint on verification_submission_id');
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  } finally {
    await pool.end();
  }
}

debugConstraints();
