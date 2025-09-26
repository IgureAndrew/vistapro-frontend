const { pool } = require('./src/config/database');

async function testUploadProcess() {
  console.log('🔍 Testing verification upload process...');
  
  const client = await pool.connect();
  
  try {
    const submissionId = 1;
    const adminId = 184;
    const verificationNotes = 'Test verification notes';
    
    console.log('1. Testing submission check query...');
    const submissionCheck = await client.query(
      `SELECT vs.*, u.first_name, u.last_name, u.location as marketer_location
       FROM verification_submissions vs
       JOIN users u ON vs.marketer_id = u.id
       WHERE vs.id = $1 AND vs.admin_id = $2`,
      [submissionId, adminId]
    );
    
    if (submissionCheck.rows.length === 0) {
      console.log('❌ Submission not found or admin mismatch');
      return;
    }
    
    const submission = submissionCheck.rows[0];
    console.log('✅ Submission found:', {
      id: submission.id,
      marketerId: submission.marketer_id,
      adminId: submission.admin_id,
      status: submission.submission_status,
      marketerLocation: submission.marketer_location
    });
    
    console.log('2. Testing admin verification details insert...');
    const insertOrUpdateQuery = `
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
      ON CONFLICT (verification_submission_id) 
      DO UPDATE SET
        marketer_address = EXCLUDED.marketer_address,
        landmark_description = EXCLUDED.landmark_description,
        location_photo_url = EXCLUDED.location_photo_url,
        admin_marketer_photo_url = EXCLUDED.admin_marketer_photo_url,
        verification_notes = EXCLUDED.verification_notes,
        admin_verification_date = NOW(),
        additional_documents = EXCLUDED.additional_documents,
        updated_at = NOW()
      RETURNING *
    `;
    
    const insertValues = [
      submissionId,
      adminId,
      submission.marketer_id,
      submission.marketer_location || 'Not provided',
      'Test landmark description',
      'test-location.jpg',
      'test-admin-marketer.jpg',
      verificationNotes,
      null // additional_documents
    ];
    
    const updateResult = await client.query(insertOrUpdateQuery, insertValues);
    console.log('✅ Admin verification details inserted/updated:', updateResult.rows[0]);
    
    console.log('3. Testing status update...');
    const statusUpdateQuery = `
      UPDATE verification_submissions 
      SET 
        submission_status = 'pending_superadmin_review',
        admin_reviewed_at = NOW(),
        updated_at = NOW()
      WHERE id = $1
    `;
    
    await client.query(statusUpdateQuery, [submissionId]);
    console.log('✅ Status updated successfully');
    
    console.log('4. Testing workflow log insert...');
    const workflowLogDetails = {
      verification_notes: verificationNotes,
      photos_uploaded: {
        location: 1,
        admin_marketer: 1,
        landmarks: 1
      }
    };
    
    await client.query(
      `INSERT INTO verification_workflow_logs 
       (verification_submission_id, action_by, action_by_role, action_type, action_description, previous_status, new_status, notes, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
      [
        submissionId,
        adminId,
        'Admin',
        'review',
        'Admin uploaded verification details and photos',
        submission.submission_status,
        'pending_superadmin_review',
        JSON.stringify(workflowLogDetails)
      ]
    );
    console.log('✅ Workflow log inserted successfully');
    
    console.log('🎉 All tests passed! The upload process should work.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

testUploadProcess();
