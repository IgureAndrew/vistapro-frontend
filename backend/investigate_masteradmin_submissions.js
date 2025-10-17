// investigate_masteradmin_submissions.js
// Investigate why submissions aren't showing in MasterAdmin dashboard

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://vistapro_user:CHtvHVOsBXyVft3LZBnhqSHIFjTSHGem@dpg-d0stpo15pdvs7392u0j0-a.oregon-postgres.render.com/vistapro_qotw',
  ssl: { rejectUnauthorized: false }
});

async function investigateSubmissions() {
  try {
    console.log('🔍 Investigating why submissions aren\'t showing in MasterAdmin dashboard...\n');
    
    // Get all submissions with their current status
    const query = `
      SELECT 
        vs.id,
        vs.marketer_id,
        vs.submission_status,
        vs.created_at,
        vs.admin_reviewed_at,
        vs.superadmin_reviewed_at,
        vs.masteradmin_approved_at,
        u.unique_id,
        u.first_name,
        u.last_name,
        u.email
      FROM verification_submissions vs
      LEFT JOIN users u ON vs.marketer_id = u.id
      WHERE DATE(vs.created_at) = CURRENT_DATE
      ORDER BY vs.created_at DESC;
    `;
    
    const result = await pool.query(query);
    
    console.log(`📊 Found ${result.rows.length} submission(s) today:\n`);
    
    for (const row of result.rows) {
      console.log(`\n${'='.repeat(80)}`);
      console.log(`${row.first_name} ${row.last_name} (${row.unique_id})`);
      console.log(`${'='.repeat(80)}`);
      console.log(`Submission ID: ${row.id}`);
      console.log(`Current Status: ${row.submission_status}`);
      console.log(`Created: ${row.created_at.toLocaleDateString()} ${row.created_at.toLocaleTimeString()}`);
      
      // Check if forms are completed
      const biodata = await pool.query('SELECT id FROM marketer_biodata WHERE marketer_unique_id = $1', [row.unique_id]);
      const guarantor = await pool.query('SELECT id FROM marketer_guarantor_form WHERE marketer_id = $1', [row.marketer_id]);
      const commitment = await pool.query('SELECT id FROM marketer_commitment_form WHERE marketer_id = $1', [row.marketer_id]);
      
      const formsCompleted = [biodata.rows.length, guarantor.rows.length, commitment.rows.length].filter(x => x > 0).length;
      console.log(`Forms Completed: ${formsCompleted}/3`);
      
      // Check workflow timestamps
      console.log(`\nWorkflow Status:`);
      console.log(`  Admin Reviewed: ${row.admin_reviewed_at ? row.admin_reviewed_at.toLocaleString() : 'NO'}`);
      console.log(`  SuperAdmin Reviewed: ${row.superadmin_reviewed_at ? row.superadmin_reviewed_at.toLocaleString() : 'NO'}`);
      console.log(`  MasterAdmin Approved: ${row.masteradmin_approved_at ? row.masteradmin_approved_at.toLocaleString() : 'NO'}`);
      
      // Determine what the status SHOULD be
      console.log(`\nExpected Status:`);
      if (formsCompleted < 3) {
        console.log(`  → Should be: pending_marketer_forms (forms not complete)`);
      } else if (!row.admin_reviewed_at) {
        console.log(`  → Should be: pending_admin_review (forms complete, waiting for admin)`);
      } else if (!row.superadmin_reviewed_at) {
        console.log(`  → Should be: pending_superadmin_review (admin done, waiting for superadmin)`);
      } else if (!row.masteradmin_approved_at) {
        console.log(`  → Should be: pending_masteradmin_approval (superadmin done, waiting for masteradmin)`);
      } else {
        console.log(`  → Should be: approved (fully approved)`);
      }
      
      // Check if status matches expected
      let expectedStatus = 'pending_marketer_forms';
      if (formsCompleted === 3 && !row.admin_reviewed_at) {
        expectedStatus = 'pending_admin_review';
      } else if (formsCompleted === 3 && row.admin_reviewed_at && !row.superadmin_reviewed_at) {
        expectedStatus = 'pending_superadmin_review';
      } else if (formsCompleted === 3 && row.admin_reviewed_at && row.superadmin_reviewed_at && !row.masteradmin_approved_at) {
        expectedStatus = 'pending_masteradmin_approval';
      } else if (row.masteradmin_approved_at) {
        expectedStatus = 'approved';
      }
      
      if (row.submission_status !== expectedStatus) {
        console.log(`\n❌ MISMATCH!`);
        console.log(`  Current Status: ${row.submission_status}`);
        console.log(`  Expected Status: ${expectedStatus}`);
        console.log(`  → STATUS NEEDS TO BE UPDATED!`);
      } else {
        console.log(`\n✅ Status is correct!`);
      }
    }
    
    // Summary
    console.log(`\n\n${'='.repeat(80)}`);
    console.log(`📊 SUMMARY`);
    console.log(`${'='.repeat(80)}\n`);
    
    let needsUpdate = 0;
    let readyForMasterAdmin = 0;
    
    for (const row of result.rows) {
      const biodata = await pool.query('SELECT id FROM marketer_biodata WHERE marketer_unique_id = $1', [row.unique_id]);
      const guarantor = await pool.query('SELECT id FROM marketer_guarantor_form WHERE marketer_id = $1', [row.marketer_id]);
      const commitment = await pool.query('SELECT id FROM marketer_commitment_form WHERE marketer_id = $1', [row.marketer_id]);
      
      const formsCompleted = [biodata.rows.length, guarantor.rows.length, commitment.rows.length].filter(x => x > 0).length;
      
      let expectedStatus = 'pending_marketer_forms';
      if (formsCompleted === 3 && !row.admin_reviewed_at) {
        expectedStatus = 'pending_admin_review';
      } else if (formsCompleted === 3 && row.admin_reviewed_at && !row.superadmin_reviewed_at) {
        expectedStatus = 'pending_superadmin_review';
      } else if (formsCompleted === 3 && row.admin_reviewed_at && row.superadmin_reviewed_at && !row.masteradmin_approved_at) {
        expectedStatus = 'pending_masteradmin_approval';
        readyForMasterAdmin++;
      } else if (row.masteradmin_approved_at) {
        expectedStatus = 'approved';
      }
      
      if (row.submission_status !== expectedStatus) {
        needsUpdate++;
      }
    }
    
    console.log(`Total Submissions: ${result.rows.length}`);
    console.log(`❌ Submissions with incorrect status: ${needsUpdate}`);
    console.log(`🎯 Ready for MasterAdmin review: ${readyForMasterAdmin}`);
    
    if (needsUpdate > 0) {
      console.log(`\n⚠️  ${needsUpdate} submission(s) have incorrect status and need to be updated!`);
      console.log(`   This is why they're not showing correctly in the MasterAdmin dashboard.`);
    }
    
    console.log(`\n\n✅ Investigation complete!`);
    
  } catch (error) {
    console.error('❌ Error investigating submissions:', error);
  } finally {
    await pool.end();
  }
}

investigateSubmissions();

