// check_verification_workflow.js
// Check verification workflow status for today's submissions

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://vistapro_user:CHtvHVOsBXyVft3LZBnhqSHIFjTSHGem@dpg-d0stpo15pdvs7392u0j0-a.oregon-postgres.render.com/vistapro_qotw',
  ssl: { rejectUnauthorized: false }
});

async function checkVerificationWorkflow() {
  try {
    console.log('🔍 Checking verification workflow for today\'s submissions...\n');
    
    // Query for today's verifications with workflow details
    const query = `
      SELECT 
        vs.id,
        vs.marketer_id,
        vs.admin_id,
        vs.super_admin_id,
        vs.submission_status,
        vs.created_at,
        vs.admin_reviewed_at,
        vs.superadmin_reviewed_at,
        vs.masteradmin_approved_at,
        vs.rejection_reason,
        vs.rejected_by,
        vs.rejected_at,
        u.unique_id,
        u.first_name,
        u.last_name,
        u.email,
        u.role,
        admin.first_name as admin_first_name,
        admin.last_name as admin_last_name,
        admin.email as admin_email,
        superadmin.first_name as superadmin_first_name,
        superadmin.last_name as superadmin_last_name,
        superadmin.email as superadmin_email
      FROM verification_submissions vs
      LEFT JOIN users u ON vs.marketer_id = u.id
      LEFT JOIN users admin ON vs.admin_id = admin.id
      LEFT JOIN users superadmin ON vs.super_admin_id = superadmin.id
      WHERE DATE(vs.created_at) = CURRENT_DATE
      ORDER BY vs.created_at DESC;
    `;
    
    const result = await pool.query(query);
    
    console.log(`\n📊 Found ${result.rows.length} submission(s) today:\n`);
    
    if (result.rows.length === 0) {
      console.log('❌ No submissions found for today.');
      return;
    }
    
    result.rows.forEach((row, index) => {
      console.log(`\n${'='.repeat(80)}`);
      console.log(`SUBMISSION ${index + 1}: ${row.first_name} ${row.last_name} (${row.unique_id})`);
      console.log(`${'='.repeat(80)}`);
      
      console.log(`\n👤 MARKETER INFO:`);
      console.log(`   Name: ${row.first_name} ${row.last_name}`);
      console.log(`   Unique ID: ${row.unique_id}`);
      console.log(`   Email: ${row.email}`);
      console.log(`   Role: ${row.role}`);
      
      console.log(`\n📋 SUBMISSION INFO:`);
      console.log(`   Submission ID: ${row.id}`);
      console.log(`   Status: ${row.submission_status}`);
      console.log(`   Created: ${row.created_at}`);
      
      console.log(`\n👥 ASSIGNED TO:`);
      console.log(`   Admin: ${row.admin_first_name || 'N/A'} ${row.admin_last_name || ''} (${row.admin_email || 'N/A'})`);
      console.log(`   SuperAdmin: ${row.superadmin_first_name || 'N/A'} ${row.superadmin_last_name || ''} (${row.superadmin_email || 'N/A'})`);
      
      console.log(`\n✅ VERIFICATION STATUS:`);
      
      if (row.admin_reviewed_at) {
        console.log(`   ✓ Admin Reviewed: YES (${row.admin_reviewed_at})`);
      } else {
        console.log(`   ✗ Admin Reviewed: NO`);
      }
      
      if (row.superadmin_reviewed_at) {
        console.log(`   ✓ SuperAdmin Reviewed: YES (${row.superadmin_reviewed_at})`);
      } else {
        console.log(`   ✗ SuperAdmin Reviewed: NO`);
      }
      
      if (row.masteradmin_approved_at) {
        console.log(`   ✓ MasterAdmin Approved: YES (${row.masteradmin_approved_at})`);
      } else {
        console.log(`   ✗ MasterAdmin Approved: NO`);
      }
      
      if (row.rejection_reason) {
        console.log(`\n❌ REJECTED:`);
        console.log(`   Reason: ${row.rejection_reason}`);
        console.log(`   Rejected By: ${row.rejected_by}`);
        console.log(`   Rejected At: ${row.rejected_at}`);
      }
      
      // Determine workflow stage
      console.log(`\n📊 WORKFLOW STAGE:`);
      if (row.submission_status === 'pending_marketer_forms') {
        console.log(`   → Waiting for marketer to complete forms (Biodata, Guarantor, Commitment)`);
      } else if (row.submission_status === 'pending_admin_review') {
        console.log(`   → Waiting for Admin review`);
      } else if (row.submission_status === 'pending_superadmin_review') {
        console.log(`   → Waiting for SuperAdmin review`);
      } else if (row.submission_status === 'pending_masteradmin_approval') {
        console.log(`   → Waiting for MasterAdmin approval`);
      } else if (row.submission_status === 'approved') {
        console.log(`   → APPROVED by MasterAdmin`);
      } else if (row.submission_status === 'rejected') {
        console.log(`   → REJECTED`);
      }
    });
    
    // Summary statistics
    console.log(`\n\n${'='.repeat(80)}`);
    console.log(`📊 SUMMARY STATISTICS`);
    console.log(`${'='.repeat(80)}\n`);
    
    const stats = {
      total: result.rows.length,
      pending_forms: 0,
      pending_admin: 0,
      pending_superadmin: 0,
      pending_masteradmin: 0,
      approved: 0,
      rejected: 0,
      admin_reviewed: 0,
      superadmin_reviewed: 0,
      masteradmin_approved: 0
    };
    
    result.rows.forEach(row => {
      if (row.submission_status === 'pending_marketer_forms') stats.pending_forms++;
      if (row.submission_status === 'pending_admin_review') stats.pending_admin++;
      if (row.submission_status === 'pending_superadmin_review') stats.pending_superadmin++;
      if (row.submission_status === 'pending_masteradmin_approval') stats.pending_masteradmin++;
      if (row.submission_status === 'approved') stats.approved++;
      if (row.submission_status === 'rejected') stats.rejected++;
      if (row.admin_reviewed_at) stats.admin_reviewed++;
      if (row.superadmin_reviewed_at) stats.superadmin_reviewed++;
      if (row.masteradmin_approved_at) stats.masteradmin_approved++;
    });
    
    console.log(`Total Submissions: ${stats.total}`);
    console.log(`\nStatus Breakdown:`);
    console.log(`   - Pending Marketer Forms: ${stats.pending_forms}`);
    console.log(`   - Pending Admin Review: ${stats.pending_admin}`);
    console.log(`   - Pending SuperAdmin Review: ${stats.pending_superadmin}`);
    console.log(`   - Pending MasterAdmin Approval: ${stats.pending_masteradmin}`);
    console.log(`   - Approved: ${stats.approved}`);
    console.log(`   - Rejected: ${stats.rejected}`);
    
    console.log(`\nVerification Progress:`);
    console.log(`   - Admin Reviewed: ${stats.admin_reviewed}/${stats.total} (${Math.round(stats.admin_reviewed/stats.total*100)}%)`);
    console.log(`   - SuperAdmin Reviewed: ${stats.superadmin_reviewed}/${stats.total} (${Math.round(stats.superadmin_reviewed/stats.total*100)}%)`);
    console.log(`   - MasterAdmin Approved: ${stats.masteradmin_approved}/${stats.total} (${Math.round(stats.masteradmin_approved/stats.total*100)}%)`);
    
    // Check if any are ready for MasterAdmin
    const readyForMasterAdmin = result.rows.filter(row => 
      row.submission_status === 'pending_masteradmin_approval' || 
      row.submission_status === 'approved'
    );
    
    if (readyForMasterAdmin.length > 0) {
      console.log(`\n\n🎯 READY FOR MASTERADMIN REVIEW: ${readyForMasterAdmin.length}`);
      readyForMasterAdmin.forEach((row, index) => {
        console.log(`   ${index + 1}. ${row.first_name} ${row.last_name} (${row.unique_id})`);
      });
    } else {
      console.log(`\n\n⚠️  No submissions are currently ready for MasterAdmin review.`);
    }
    
    console.log(`\n\n✅ Check complete!`);
    
  } catch (error) {
    console.error('❌ Error checking verification workflow:', error);
  } finally {
    await pool.end();
  }
}

checkVerificationWorkflow();

