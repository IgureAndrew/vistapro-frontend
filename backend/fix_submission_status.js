// fix_submission_status.js
// Fix the status for submissions that have completed all forms

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://vistapro_user:CHtvHVOsBXyVft3LZBnhqSHIFjTSHGem@dpg-d0stpo15pdvs7392u0j0-a.oregon-postgres.render.com/vistapro_qotw',
  ssl: { rejectUnauthorized: false }
});

async function fixSubmissionStatus() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Fixing submission status for completed forms...\n');
    
    await client.query('BEGIN');
    
    // Get all submissions
    const submissionsQuery = `
      SELECT 
        vs.id,
        vs.marketer_id,
        vs.submission_status,
        u.unique_id
      FROM verification_submissions vs
      LEFT JOIN users u ON vs.marketer_id = u.id
      WHERE DATE(vs.created_at) = CURRENT_DATE;
    `;
    
    const submissions = await client.query(submissionsQuery);
    
    console.log(`📊 Found ${submissions.rows.length} submission(s) to check\n`);
    
    let fixedCount = 0;
    
    for (const submission of submissions.rows) {
      // Check if all forms are completed
      const biodata = await client.query('SELECT id FROM marketer_biodata WHERE marketer_unique_id = $1', [submission.unique_id]);
      const guarantor = await client.query('SELECT id FROM marketer_guarantor_form WHERE marketer_id = $1', [submission.marketer_id]);
      const commitment = await client.query('SELECT id FROM marketer_commitment_form WHERE marketer_id = $1', [submission.marketer_id]);
      
      const formsCompleted = [biodata.rows.length, guarantor.rows.length, commitment.rows.length].filter(x => x > 0).length;
      
      if (formsCompleted === 3 && submission.submission_status === 'pending_marketer_forms') {
        // Update status to pending_admin_review
        await client.query(
          'UPDATE verification_submissions SET submission_status = $1, updated_at = NOW() WHERE id = $2',
          ['pending_admin_review', submission.id]
        );
        
        console.log(`✅ Fixed submission ${submission.id} (${submission.unique_id}): pending_marketer_forms → pending_admin_review`);
        fixedCount++;
      }
    }
    
    await client.query('COMMIT');
    
    console.log(`\n\n${'='.repeat(80)}`);
    console.log(`📊 SUMMARY`);
    console.log(`${'='.repeat(80)}\n`);
    console.log(`Total submissions checked: ${submissions.rows.length}`);
    console.log(`✅ Fixed: ${fixedCount} submission(s)`);
    
    if (fixedCount > 0) {
      console.log(`\n🎉 Successfully updated ${fixedCount} submission(s) to pending_admin_review!`);
      console.log(`   These submissions should now appear in the Admin dashboard.`);
    } else {
      console.log(`\nℹ️  No submissions needed fixing.`);
    }
    
    console.log(`\n\n✅ Status fix complete!`);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error fixing submission status:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

fixSubmissionStatus();

