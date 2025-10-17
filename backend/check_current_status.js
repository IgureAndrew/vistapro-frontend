// check_current_status.js
// Check current status of all submissions

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://vistapro_user:CHtvHVOsBXyVft3LZBnhqSHIFjTSHGem@dpg-d0stpo15pdvs7392u0j0-a.oregon-postgres.render.com/vistapro_qotw',
  ssl: { rejectUnauthorized: false }
});

async function checkCurrentStatus() {
  try {
    console.log('🔍 Checking current status of all submissions...\n');
    
    const query = `
      SELECT 
        vs.id,
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
    
    const result = await pool.query(query);
    
    console.log(`📊 Found ${result.rows.length} submission(s) today:\n`);
    
    const statusCounts = {};
    
    result.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.first_name} ${row.last_name} (${row.unique_id})`);
      console.log(`   Status: ${row.submission_status}`);
      console.log(`   Created: ${row.created_at.toLocaleString()}`);
      console.log('');
      
      // Count by status
      statusCounts[row.submission_status] = (statusCounts[row.submission_status] || 0) + 1;
    });
    
    console.log(`\n${'='.repeat(80)}`);
    console.log(`📊 STATUS BREAKDOWN`);
    console.log(`${'='.repeat(80)}\n`);
    
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`${status}: ${count}`);
    });
    
    console.log(`\n\n📌 WHERE THEY SHOULD APPEAR:\n`);
    console.log(`pending_marketer_forms → Marketer Dashboard (waiting for forms)`);
    console.log(`pending_admin_review → Admin Dashboard (waiting for admin review)`);
    console.log(`pending_superadmin_review → SuperAdmin Dashboard (waiting for superadmin review)`);
    console.log(`pending_masteradmin_approval → MasterAdmin Dashboard (waiting for masteradmin approval)`);
    console.log(`approved → History (already approved)`);
    console.log(`rejected → History (rejected)`);
    
  } catch (error) {
    console.error('❌ Error checking status:', error);
  } finally {
    await pool.end();
  }
}

checkCurrentStatus();

