// check_today_forms_final.js
// Check if today's marketers have completed their forms

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://vistapro_user:CHtvHVOsBXyVft3LZBnhqSHIFjTSHGem@dpg-d0stpo15pdvs7392u0j0-a.oregon-postgres.render.com/vistapro_qotw',
  ssl: { rejectUnauthorized: false }
});

async function checkTodayForms() {
  try {
    console.log('🔍 Checking TODAY\'s marketer forms completion status...\n');
    
    // Get today's verification submissions
    const verificationQuery = `
      SELECT 
        vs.id,
        vs.marketer_id,
        vs.submission_status,
        vs.created_at,
        u.unique_id,
        u.first_name,
        u.last_name,
        u.email
      FROM verification_submissions vs
      LEFT JOIN users u ON vs.marketer_id = u.id
      WHERE DATE(vs.created_at) = CURRENT_DATE
      ORDER BY vs.created_at DESC;
    `;
    
    const verifications = await pool.query(verificationQuery);
    
    console.log(`📊 Found ${verifications.rows.length} verification submission(s) TODAY\n`);
    
    for (const verification of verifications.rows) {
      console.log(`\n${'='.repeat(80)}`);
      console.log(`MARKETER: ${verification.first_name} ${verification.last_name} (${verification.unique_id})`);
      console.log(`${'='.repeat(80)}`);
      console.log(`Submission ID: ${verification.id}`);
      console.log(`Status: ${verification.submission_status}`);
      console.log(`Email: ${verification.email}`);
      console.log(`Submitted: ${verification.created_at.toLocaleDateString()} ${verification.created_at.toLocaleTimeString()}`);
      
      // Check biodata form using unique_id
      const biodataQuery = `
        SELECT id, created_at, updated_at
        FROM marketer_biodata
        WHERE marketer_unique_id = $1
        ORDER BY created_at DESC
        LIMIT 1;
      `;
      const biodata = await pool.query(biodataQuery, [verification.unique_id]);
      
      // Check guarantor form using unique_id
      const guarantorQuery = `
        SELECT id, created_at, updated_at
        FROM marketer_guarantor_form
        WHERE marketer_unique_id = $1
        ORDER BY created_at DESC
        LIMIT 1;
      `;
      const guarantor = await pool.query(guarantorQuery, [verification.unique_id]);
      
      // Check commitment form using unique_id
      const commitmentQuery = `
        SELECT id, created_at, updated_at
        FROM marketer_commitment_form
        WHERE marketer_unique_id = $1
        ORDER BY created_at DESC
        LIMIT 1;
      `;
      const commitment = await pool.query(commitmentQuery, [verification.unique_id]);
      
      console.log(`\n📋 FORMS COMPLETION STATUS:`);
      
      if (biodata.rows.length > 0) {
        console.log(`   ✅ Biodata Form: COMPLETED`);
        console.log(`      Submitted: ${biodata.rows[0].created_at.toLocaleDateString()} ${biodata.rows[0].created_at.toLocaleTimeString()}`);
      } else {
        console.log(`   ❌ Biodata Form: NOT COMPLETED`);
      }
      
      if (guarantor.rows.length > 0) {
        console.log(`   ✅ Guarantor Form: COMPLETED`);
        console.log(`      Submitted: ${guarantor.rows[0].created_at.toLocaleDateString()} ${guarantor.rows[0].created_at.toLocaleTimeString()}`);
      } else {
        console.log(`   ❌ Guarantor Form: NOT COMPLETED`);
      }
      
      if (commitment.rows.length > 0) {
        console.log(`   ✅ Commitment Form: COMPLETED`);
        console.log(`      Submitted: ${commitment.rows[0].created_at.toLocaleDateString()} ${commitment.rows[0].created_at.toLocaleTimeString()}`);
      } else {
        console.log(`   ❌ Commitment Form: NOT COMPLETED`);
      }
      
      // Calculate completion percentage
      const completedForms = [biodata.rows.length, guarantor.rows.length, commitment.rows.length].filter(x => x > 0).length;
      const completionPercentage = Math.round((completedForms / 3) * 100);
      
      console.log(`\n📊 COMPLETION: ${completedForms}/3 forms (${completionPercentage}%)`);
      
      if (completedForms === 3) {
        console.log(`\n✅ ALL FORMS COMPLETED! Ready for Admin review.`);
      } else if (completedForms > 0) {
        console.log(`\n⚠️  PARTIALLY COMPLETED. Still waiting for ${3 - completedForms} form(s).`);
      } else {
        console.log(`\n❌ NO FORMS COMPLETED YET.`);
      }
    }
    
    // Summary
    console.log(`\n\n${'='.repeat(80)}`);
    console.log(`📊 SUMMARY FOR TODAY`);
    console.log(`${'='.repeat(80)}\n`);
    
    const summary = {
      total: verifications.rows.length,
      all_forms_completed: 0,
      partially_completed: 0,
      no_forms_completed: 0
    };
    
    for (const verification of verifications.rows) {
      const biodata = await pool.query('SELECT id FROM marketer_biodata WHERE marketer_unique_id = $1', [verification.unique_id]);
      const guarantor = await pool.query('SELECT id FROM marketer_guarantor_form WHERE marketer_unique_id = $1', [verification.unique_id]);
      const commitment = await pool.query('SELECT id FROM marketer_commitment_form WHERE marketer_unique_id = $1', [verification.unique_id]);
      
      const completedForms = [biodata.rows.length, guarantor.rows.length, commitment.rows.length].filter(x => x > 0).length;
      
      if (completedForms === 3) {
        summary.all_forms_completed++;
      } else if (completedForms > 0) {
        summary.partially_completed++;
      } else {
        summary.no_forms_completed++;
      }
    }
    
    console.log(`Total Submissions Today: ${summary.total}`);
    console.log(`✅ All Forms Completed: ${summary.all_forms_completed}`);
    console.log(`⚠️  Partially Completed: ${summary.partially_completed}`);
    console.log(`❌ No Forms Completed: ${summary.no_forms_completed}`);
    
    if (summary.all_forms_completed > 0) {
      console.log(`\n🎯 ${summary.all_forms_completed} marketer(s) have completed all forms and are ready for Admin review!`);
    }
    
    console.log(`\n\n✅ Check complete!`);
    
  } catch (error) {
    console.error('❌ Error checking forms completion:', error);
  } finally {
    await pool.end();
  }
}

checkTodayForms();

