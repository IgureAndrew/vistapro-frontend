const { pool } = require('../config/database');

async function getSuperAdminTeamHierarchy(superAdminId) {
  try {
    // Get the SuperAdmin's assigned admins and their marketers
    const { rows } = await pool.query(`
      SELECT 
        admin.id as admin_id,
        admin.unique_id as admin_unique_id,
        admin.first_name as admin_first_name,
        admin.last_name as admin_last_name,
        admin.email as admin_email,
        admin.phone as admin_phone,
        admin.location as admin_location,
        admin.created_at as admin_created_at,
        COUNT(marketer.id) as marketer_count,
        COUNT(CASE WHEN marketer.location = admin.location THEN 1 END) as same_location_marketers,
        COUNT(CASE WHEN marketer.location != admin.location THEN 1 END) as different_location_marketers
      FROM users admin
      LEFT JOIN users marketer ON marketer.admin_id = admin.id
      WHERE admin.super_admin_id = $1 AND admin.role = 'Admin'
      GROUP BY admin.id, admin.unique_id, admin.first_name, admin.last_name, 
               admin.email, admin.phone, admin.location, admin.created_at
      ORDER BY admin.first_name
    `, [superAdminId]);

    // Get detailed marketer information for each admin
    const adminsWithMarketers = await Promise.all(rows.map(async (admin) => {
      const { rows: marketers } = await pool.query(`
        SELECT 
          m.id,
          m.unique_id,
          m.first_name,
          m.last_name,
          m.email,
          m.phone,
          m.location,
          m.created_at,
          m.bio_submitted,
          m.guarantor_submitted,
          m.commitment_submitted,
          m.overall_verification_status,
          -- Performance metrics (placeholder for now)
          0 as total_sales,
          0 as total_submissions,
          0 as last_activity_days
        FROM users m
        WHERE m.admin_id = $1 AND m.role = 'Marketer'
        ORDER BY m.first_name
      `, [admin.admin_id]);

      return {
        ...admin,
        marketers: marketers
      };
    }));

    return { success: true, data: adminsWithMarketers };
  } catch (error) {
    console.error('Error getting SuperAdmin team hierarchy:', error);
    throw error;
  }
}

async function getSuperAdminTeamStats(superAdminId) {
  try {
    const { rows } = await pool.query(`
      SELECT 
        COUNT(DISTINCT admin.id) as total_admins,
        COUNT(DISTINCT marketer.id) as total_marketers,
        COUNT(DISTINCT admin.location) as admin_locations,
        COUNT(DISTINCT marketer.location) as marketer_locations,
        COUNT(CASE WHEN marketer.bio_submitted = true AND marketer.guarantor_submitted = true AND marketer.commitment_submitted = true THEN 1 END) as completed_submissions,
        COUNT(CASE WHEN marketer.overall_verification_status = 'approved' OR marketer.overall_verification_status = 'complete' THEN 1 END) as approved_marketers,
        COUNT(CASE WHEN marketer.created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as new_marketers_30_days
      FROM users admin
      LEFT JOIN users marketer ON marketer.admin_id = admin.id
      WHERE admin.super_admin_id = $1 AND admin.role = 'Admin'
    `, [superAdminId]);

    return { success: true, data: rows[0] };
  } catch (error) {
    console.error('Error getting SuperAdmin team stats:', error);
    throw error;
  }
}

async function getSuperAdminPerformanceMetrics(superAdminId) {
  try {
    // Get performance metrics for each admin under this SuperAdmin
    const { rows } = await pool.query(`
      SELECT 
        admin.id as admin_id,
        admin.first_name || ' ' || admin.last_name as admin_name,
        admin.unique_id as admin_unique_id,
        admin.location as admin_location,
        COUNT(marketer.id) as total_marketers,
        COUNT(CASE WHEN marketer.bio_submitted = true AND marketer.guarantor_submitted = true AND marketer.commitment_submitted = true THEN 1 END) as completed_submissions,
        COUNT(CASE WHEN marketer.overall_verification_status = 'approved' OR marketer.overall_verification_status = 'complete' THEN 1 END) as approved_marketers,
        ROUND(
          COUNT(CASE WHEN marketer.bio_submitted = true AND marketer.guarantor_submitted = true AND marketer.commitment_submitted = true THEN 1 END) * 100.0 / 
          NULLIF(COUNT(marketer.id), 0), 2
        ) as completion_rate,
        ROUND(
          COUNT(CASE WHEN marketer.overall_verification_status = 'approved' OR marketer.overall_verification_status = 'complete' THEN 1 END) * 100.0 / 
          NULLIF(COUNT(marketer.id), 0), 2
        ) as approval_rate
      FROM users admin
      LEFT JOIN users marketer ON marketer.admin_id = admin.id
      WHERE admin.super_admin_id = $1 AND admin.role = 'Admin'
      GROUP BY admin.id, admin.first_name, admin.last_name, admin.unique_id, admin.location
      ORDER BY completion_rate DESC, approval_rate DESC
    `, [superAdminId]);

    return { success: true, data: rows };
  } catch (error) {
    console.error('Error getting SuperAdmin performance metrics:', error);
    throw error;
  }
}

async function getSuperAdminLocationBreakdown(superAdminId) {
  try {
    const { rows } = await pool.query(`
      SELECT 
        admin.location,
        COUNT(DISTINCT admin.id) as admin_count,
        COUNT(DISTINCT marketer.id) as marketer_count,
        COUNT(CASE WHEN marketer.bio_submitted = true AND marketer.guarantor_submitted = true AND marketer.commitment_submitted = true THEN 1 END) as completed_submissions,
        COUNT(CASE WHEN marketer.overall_verification_status = 'approved' OR marketer.overall_verification_status = 'complete' THEN 1 END) as approved_marketers
      FROM users admin
      LEFT JOIN users marketer ON marketer.admin_id = admin.id
      WHERE admin.super_admin_id = $1 AND admin.role = 'Admin'
      GROUP BY admin.location
      ORDER BY marketer_count DESC
    `, [superAdminId]);

    return { success: true, data: rows };
  } catch (error) {
    console.error('Error getting SuperAdmin location breakdown:', error);
    throw error;
  }
}

module.exports = {
  getSuperAdminTeamHierarchy,
  getSuperAdminTeamStats,
  getSuperAdminPerformanceMetrics,
  getSuperAdminLocationBreakdown
};



