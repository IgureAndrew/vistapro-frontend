// check_all_verifications.js
// Check all verifications in the pipeline (last 30 days)

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://vistapro_user:CHtvHVOsBXyVft3LZBnhqSHIFjTSHGem@dpg-d0stpo15pdvs7392u0j0-a.oregon-postgres.render.com/vistapro_qotw',
  ssl: { rejectUnauthorized: false }
});

async function checkAllVerifications() {
  try {
    console.log('🔍 Checking ALL verifications in the pipeline (last 30 days)...\n');
    
    // Query for all verifications in the last 30 days
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
      WHERE vs.created_at >= NOW() - INTERVAL '30 days'
      ORDER BY vs.created_at DESC;
    `;
    
    const result = await pool.query(query);
    
    console.log(`\n📊 Found ${result.rows.length} submission(s) in the last 30 days:\n`);
    
    if (result.rows.length === 0) {
      console.log('❌ No submissions found in the last 30 days.');
      return;
    }
    
    // Group by status
    const byStatus = {};
    result.rows.forEach(row => {
      if (!byStatus[row.submission_status]) {
        byStatus[row.submission_status] = [];
      }
      byStatus[row.submission_status].push(row);
    });
    
    // Display by status
    Object.entries(byStatus).forEach(([status, submissions]) => {
      console.log(`\n${'='.repeat(80)}`);
      console.log(`📋 STATUS: ${status.toUpperCase()} (${submissions.length} submission(s))`);
      console.log(`${'='.repeat(80)}\n`);
      
      submissions.forEach((row, index) => {
        console.log(`${index + 1}. ${row.first_name} ${row.last_name} (${row.unique_id})`);
        console.log(`   Email: ${row.email}`);
        console.log(`   Submitted: ${row.created_at.toLocaleDateString()} ${row.created_at.toLocaleTimeString()}`);
        
        // Show workflow progress
        const stages = [];
        if (row.admin_reviewed_at) {
          stages.push(`✓ Admin (${row.admin_reviewed_at.toLocaleDateString()})`);
        } else {
          stages.push('✗ Admin');
        }
        
        if (row.superadmin_reviewed_at) {
          stages.push(`✓ SuperAdmin (${row.superadmin_reviewed_at.toLocaleDateString()})`);
        } else {
          stages.push('✗ SuperAdmin');
        }
        
        if (row.masteradmin_approved_at) {
          stages.push(`✓ MasterAdmin (${row.masteradmin_approved_at.toLocaleDateString()})`);
        } else {
          stages.push('✗ MasterAdmin');
        }
        
        console.log(`   Progress: ${stages.join(' → ')}`);
        
        if (row.rejection_reason) {
          console.log(`   ❌ REJECTED: ${row.rejection_reason} (by ${row.rejected_by})`);
        }
        
        console.log('');
      });
    });
    
    // Summary statistics
    console.log(`\n\n${'='.repeat(80)}`);
    console.log(`📊 OVERALL SUMMARY STATISTICS`);
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
      masteradmin_approved: 0,
      today: 0,
      this_week: 0,
      this_month: 0
    };
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const monthAgo = new Date(today);
    monthAgo.setDate(monthAgo.getDate() - 30);
    
    result.rows.forEach(row => {
      const createdDate = new Date(row.created_at);
      
      if (createdDate >= today) stats.today++;
      if (createdDate >= weekAgo) stats.this_week++;
      if (createdDate >= monthAgo) stats.this_month++;
      
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
    
    console.log(`📅 Time Period: Last 30 Days`);
    console.log(`\n📊 Total Submissions: ${stats.total}`);
    console.log(`   - Today: ${stats.today}`);
    console.log(`   - This Week: ${stats.this_week}`);
    console.log(`   - This Month: ${stats.this_month}`);
    
    console.log(`\n📋 Status Breakdown:`);
    console.log(`   - Pending Marketer Forms: ${stats.pending_forms}`);
    console.log(`   - Pending Admin Review: ${stats.pending_admin}`);
    console.log(`   - Pending SuperAdmin Review: ${stats.pending_superadmin}`);
    console.log(`   - Pending MasterAdmin Approval: ${stats.pending_masteradmin}`);
    console.log(`   - Approved: ${stats.approved}`);
    console.log(`   - Rejected: ${stats.rejected}`);
    
    console.log(`\n✅ Verification Progress:`);
    console.log(`   - Admin Reviewed: ${stats.admin_reviewed}/${stats.total} (${Math.round(stats.admin_reviewed/stats.total*100)}%)`);
    console.log(`   - SuperAdmin Reviewed: ${stats.superadmin_reviewed}/${stats.total} (${Math.round(stats.superadmin_reviewed/stats.total*100)}%)`);
    console.log(`   - MasterAdmin Approved: ${stats.masteradmin_approved}/${stats.total} (${Math.round(stats.masteradmin_approved/stats.total*100)}%)`);
    
    // Bottlenecks
    console.log(`\n⚠️  BOTTLENECKS:`);
    if (stats.pending_forms > 0) {
      console.log(`   - ${stats.pending_forms} marketer(s) haven't completed their forms`);
    }
    if (stats.pending_admin > 0) {
      console.log(`   - ${stats.pending_admin} submission(s) waiting for Admin review`);
    }
    if (stats.pending_superadmin > 0) {
      console.log(`   - ${stats.pending_superadmin} submission(s) waiting for SuperAdmin review`);
    }
    if (stats.pending_masteradmin > 0) {
      console.log(`   - ${stats.pending_masteradmin} submission(s) waiting for MasterAdmin approval`);
    }
    if (stats.pending_forms === 0 && stats.pending_admin === 0 && stats.pending_superadmin === 0 && stats.pending_masteradmin === 0) {
      console.log(`   - No bottlenecks! All submissions are either approved or rejected.`);
    }
    
    // Check if any are ready for MasterAdmin
    const readyForMasterAdmin = result.rows.filter(row => 
      row.submission_status === 'pending_masteradmin_approval' || 
      row.submission_status === 'approved'
    );
    
    if (readyForMasterAdmin.length > 0) {
      console.log(`\n\n🎯 READY FOR MASTERADMIN REVIEW: ${readyForMasterAdmin.length}`);
      readyForMasterAdmin.forEach((row, index) => {
        console.log(`   ${index + 1}. ${row.first_name} ${row.last_name} (${row.unique_id})`);
        console.log(`      Status: ${row.submission_status}`);
        console.log(`      Submitted: ${row.created_at.toLocaleDateString()}`);
        if (row.superadmin_reviewed_at) {
          console.log(`      SuperAdmin Reviewed: ${row.superadmin_reviewed_at.toLocaleDateString()}`);
        }
      });
    } else {
      console.log(`\n\n⚠️  No submissions are currently ready for MasterAdmin review.`);
    }
    
    console.log(`\n\n✅ Check complete!`);
    
  } catch (error) {
    console.error('❌ Error checking verifications:', error);
  } finally {
    await pool.end();
  }
}

checkAllVerifications();

