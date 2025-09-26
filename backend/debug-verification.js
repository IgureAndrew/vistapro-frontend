const { pool } = require('./src/config/database');

async function debugVerificationUpload() {
  console.log('🔍 Debugging verification upload issue...');
  
  try {
    // Test database connection
    console.log('1. Testing database connection...');
    const dbTest = await pool.query('SELECT NOW()');
    console.log('✅ Database connected:', dbTest.rows[0]);
    
    // Check if verification_submissions table exists
    console.log('2. Checking verification_submissions table...');
    const tableCheck = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'verification_submissions'
    `);
    console.log('✅ Table exists:', tableCheck.rows.length > 0);
    
    // Check if admin_verification_details table exists
    console.log('3. Checking admin_verification_details table...');
    const adminTableCheck = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'admin_verification_details'
    `);
    console.log('✅ Admin table exists:', adminTableCheck.rows.length > 0);
    
    // Check if verification_workflow_logs table exists
    console.log('4. Checking verification_workflow_logs table...');
    const workflowTableCheck = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'verification_workflow_logs'
    `);
    console.log('✅ Workflow table exists:', workflowTableCheck.rows.length > 0);
    
    // Check verification_submissions structure
    console.log('5. Checking verification_submissions structure...');
    const structureCheck = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'verification_submissions'
      ORDER BY ordinal_position
    `);
    console.log('✅ Columns:', structureCheck.rows.map(r => `${r.column_name} (${r.data_type})`));
    
    // Check admin_verification_details structure
    console.log('6. Checking admin_verification_details structure...');
    const adminStructureCheck = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'admin_verification_details'
      ORDER BY ordinal_position
    `);
    console.log('✅ Admin columns:', adminStructureCheck.rows.map(r => `${r.column_name} (${r.data_type})`));
    
    // Check verification_workflow_logs structure
    console.log('7. Checking verification_workflow_logs structure...');
    const workflowStructureCheck = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'verification_workflow_logs'
      ORDER BY ordinal_position
    `);
    console.log('✅ Workflow columns:', workflowStructureCheck.rows.map(r => `${r.column_name} (${r.data_type})`));
    
    // Test a simple insert into admin_verification_details
    console.log('8. Testing admin_verification_details insert...');
    try {
      const testInsert = await pool.query(`
        INSERT INTO admin_verification_details (
          verification_submission_id,
          admin_id,
          marketer_id,
          marketer_address,
          landmark_description,
          location_photo_url,
          admin_marketer_photo_url,
          verification_notes,
          admin_verification_date,
          additional_documents
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), $9::jsonb)
        RETURNING id
      `, [1, 1, 1, 'Test Address', 'Test Landmark', 'test.jpg', 'test2.jpg', 'Test notes', null]);
      console.log('✅ Test insert successful:', testInsert.rows[0]);
      
      // Clean up test data
      await pool.query('DELETE FROM admin_verification_details WHERE id = $1', [testInsert.rows[0].id]);
      console.log('✅ Test data cleaned up');
    } catch (insertError) {
      console.log('❌ Test insert failed:', insertError.message);
    }
    
    // Test workflow logs insert
    console.log('9. Testing verification_workflow_logs insert...');
    try {
      const testWorkflowInsert = await pool.query(`
        INSERT INTO verification_workflow_logs (
          verification_submission_id, action_by, action_by_role, action_type, 
          action_description, previous_status, new_status, notes, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
        RETURNING id
      `, [1, 1, 'Admin', 'test', 'Test action', 'pending_admin_review', 'pending_superadmin_review', 'Test notes']);
      console.log('✅ Test workflow insert successful:', testWorkflowInsert.rows[0]);
      
      // Clean up test data
      await pool.query('DELETE FROM verification_workflow_logs WHERE id = $1', [testWorkflowInsert.rows[0].id]);
      console.log('✅ Test workflow data cleaned up');
    } catch (workflowError) {
      console.log('❌ Test workflow insert failed:', workflowError.message);
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  } finally {
    await pool.end();
  }
}

debugVerificationUpload();

