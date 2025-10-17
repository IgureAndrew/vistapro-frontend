// check_today_verifications.js
// Check for KYC verifications submitted today

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://vistapro_user:CHtvHVOsBXyVft3LZBnhqSHIFjTSHGem@dpg-d0stpo15pdvs7392u0j0-a.oregon-postgres.render.com/vistapro_qotw',
  ssl: { rejectUnauthorized: false }
});

async function checkTodayVerifications() {
  try {
    console.log('🔍 Checking for KYC verifications submitted today...\n');
    
    // First, let's check the structure of verification_submissions table
    console.log('📋 Checking table structure...\n');
    const structureQuery = `
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'verification_submissions'
      ORDER BY ordinal_position;
    `;
    
    const structureResult = await pool.query(structureQuery);
    console.log('Columns in verification_submissions:');
    structureResult.rows.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type})`);
    });
    
    // Query for today's verifications
    const query = `
      SELECT 
        vs.*,
        u.unique_id,
        u.first_name,
        u.last_name,
        u.email as user_email,
        u.role
      FROM verification_submissions vs
      LEFT JOIN users u ON vs.marketer_id = u.id
      WHERE DATE(vs.created_at) = CURRENT_DATE
      ORDER BY vs.created_at DESC;
    `;
    
    const result = await pool.query(query);
    
    console.log('\n\n📊 RESULTS:\n');
    
    if (result.rows.length === 0) {
      console.log('❌ No KYC verifications submitted today.');
      console.log('\n📊 Summary:');
      console.log('   Total submissions today: 0');
    } else {
      console.log(`✅ Found ${result.rows.length} KYC verification(s) submitted today:\n`);
      
      result.rows.forEach((row, index) => {
        console.log(`\n${'='.repeat(60)}`);
        console.log(`${index + 1}. Submission ID: ${row.id}`);
        console.log(`${'='.repeat(60)}`);
        console.log(`   Marketer ID: ${row.marketer_id}`);
        console.log(`   User Unique ID: ${row.unique_id || 'N/A'}`);
        console.log(`   User Name: ${row.first_name || ''} ${row.last_name || ''}`);
        console.log(`   User Email: ${row.user_email || 'N/A'}`);
        console.log(`   User Role: ${row.role || 'N/A'}`);
        console.log(`   Status: ${row.submission_status}`);
        console.log(`   Submitted at: ${row.created_at}`);
        console.log(`   Admin ID: ${row.admin_id || 'N/A'}`);
        console.log(`   Super Admin ID: ${row.super_admin_id || 'N/A'}`);
        if (row.admin_reviewed_at) console.log(`   Admin Reviewed: ${row.admin_reviewed_at}`);
        if (row.superadmin_reviewed_at) console.log(`   SuperAdmin Reviewed: ${row.superadmin_reviewed_at}`);
        if (row.masteradmin_approved_at) console.log(`   MasterAdmin Approved: ${row.masteradmin_approved_at}`);
        if (row.rejection_reason) console.log(`   Rejection Reason: ${row.rejection_reason}`);
      });
      
      console.log('\n\n📊 Summary:');
      console.log(`   Total submissions today: ${result.rows.length}`);
      
      // Count by status
      const statusCounts = {};
      result.rows.forEach(row => {
        statusCounts[row.submission_status] = (statusCounts[row.submission_status] || 0) + 1;
      });
      
      console.log('   Status breakdown:');
      Object.entries(statusCounts).forEach(([status, count]) => {
        console.log(`     - ${status}: ${count}`);
      });
    }
    
    // Also check for biodata submissions today
    console.log('\n\n🔍 Checking for Biodata submissions today...\n');
    
    const biodataQuery = `
      SELECT 
        mbd.*,
        u.unique_id,
        u.first_name,
        u.last_name,
        u.email,
        u.role
      FROM marketer_bio_data mbd
      LEFT JOIN users u ON mbd.user_id = u.id
      WHERE DATE(mbd.created_at) = CURRENT_DATE
      ORDER BY mbd.created_at DESC;
    `;
    
    const biodataResult = await pool.query(biodataQuery);
    
    if (biodataResult.rows.length === 0) {
      console.log('❌ No Biodata submissions today.');
    } else {
      console.log(`✅ Found ${biodataResult.rows.length} Biodata submission(s) today:\n`);
      
      biodataResult.rows.forEach((row, index) => {
        console.log(`\n${index + 1}. ID: ${row.id}`);
        console.log(`   User ID: ${row.user_id}`);
        console.log(`   User Unique ID: ${row.unique_id || 'N/A'}`);
        console.log(`   User Name: ${row.first_name || ''} ${row.last_name || ''}`);
        console.log(`   User Email: ${row.email || 'N/A'}`);
        console.log(`   Name: ${row.name}`);
        console.log(`   Phone: ${row.phone}`);
        console.log(`   Submitted at: ${row.created_at}`);
      });
    }
    
    // Check guarantor submissions today
    console.log('\n\n🔍 Checking for Guarantor submissions today...\n');
    
    const guarantorQuery = `
      SELECT 
        mgf.*,
        u.unique_id,
        u.first_name,
        u.last_name,
        u.email,
        u.role
      FROM marketer_guarantor_form mgf
      LEFT JOIN users u ON mgf.user_id = u.id
      WHERE DATE(mgf.created_at) = CURRENT_DATE
      ORDER BY mgf.created_at DESC;
    `;
    
    const guarantorResult = await pool.query(guarantorQuery);
    
    if (guarantorResult.rows.length === 0) {
      console.log('❌ No Guarantor submissions today.');
    } else {
      console.log(`✅ Found ${guarantorResult.rows.length} Guarantor submission(s) today:\n`);
      
      guarantorResult.rows.forEach((row, index) => {
        console.log(`\n${index + 1}. ID: ${row.id}`);
        console.log(`   User ID: ${row.user_id}`);
        console.log(`   User Unique ID: ${row.unique_id || 'N/A'}`);
        console.log(`   User Name: ${row.first_name || ''} ${row.last_name || ''}`);
        console.log(`   Guarantor Name: ${row.guarantor_name}`);
        console.log(`   Guarantor Phone: ${row.guarantor_phone}`);
        console.log(`   Submitted at: ${row.created_at}`);
      });
    }
    
    // Check commitment form submissions today
    console.log('\n\n🔍 Checking for Commitment Form submissions today...\n');
    
    const commitmentQuery = `
      SELECT 
        mcf.*,
        u.unique_id,
        u.first_name,
        u.last_name,
        u.email,
        u.role
      FROM marketer_commitment_form mcf
      LEFT JOIN users u ON mcf.user_id = u.id
      WHERE DATE(mcf.created_at) = CURRENT_DATE
      ORDER BY mcf.created_at DESC;
    `;
    
    const commitmentResult = await pool.query(commitmentQuery);
    
    if (commitmentResult.rows.length === 0) {
      console.log('❌ No Commitment Form submissions today.');
    } else {
      console.log(`✅ Found ${commitmentResult.rows.length} Commitment Form submission(s) today:\n`);
      
      commitmentResult.rows.forEach((row, index) => {
        console.log(`\n${index + 1}. ID: ${row.id}`);
        console.log(`   User ID: ${row.user_id}`);
        console.log(`   User Unique ID: ${row.unique_id || 'N/A'}`);
        console.log(`   User Name: ${row.first_name || ''} ${row.last_name || ''}`);
        console.log(`   Agreement: ${row.commitment_agreement ? 'Yes' : 'No'}`);
        console.log(`   Submitted at: ${row.created_at}`);
      });
    }
    
    console.log('\n\n✅ Check complete!');
    
  } catch (error) {
    console.error('❌ Error checking verifications:', error);
  } finally {
    await pool.end();
  }
}

checkTodayVerifications();
