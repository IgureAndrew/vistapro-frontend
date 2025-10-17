// src/controllers/kycTrackingController.js
// Controller for KYC tracking and timeline

const pool = require('../config/database');

/**
 * Get KYC timeline for a specific submission
 * GET /api/kyc-tracking/:submissionId/timeline
 */
const getKYCTimeline = async (req, res) => {
  try {
    const { submissionId } = req.params;
    
    // Get submission details
    const submissionQuery = `
      SELECT 
        vs.*,
        u.unique_id,
        u.first_name,
        u.last_name,
        u.email,
        admin.first_name as admin_first_name,
        admin.last_name as admin_last_name,
        superadmin.first_name as superadmin_first_name,
        superadmin.last_name as superadmin_last_name
      FROM verification_submissions vs
      LEFT JOIN users u ON vs.marketer_id = u.id
      LEFT JOIN users admin ON vs.admin_id = admin.id
      LEFT JOIN users superadmin ON vs.super_admin_id = superadmin.id
      WHERE vs.id = $1;
    `;
    
    const submission = await pool.query(submissionQuery, [submissionId]);
    
    if (submission.rows.length === 0) {
      return res.status(404).json({ message: 'Submission not found' });
    }
    
    const sub = submission.rows[0];
    
    // Get form completion details
    const biodataQuery = `
      SELECT id, created_at, updated_at
      FROM marketer_biodata
      WHERE marketer_unique_id = $1
      ORDER BY created_at DESC
      LIMIT 1;
    `;
    const biodata = await pool.query(biodataQuery, [sub.unique_id]);
    
    const guarantorQuery = `
      SELECT id, created_at, updated_at
      FROM marketer_guarantor_form
      WHERE marketer_id = $1
      ORDER BY created_at DESC
      LIMIT 1;
    `;
    const guarantor = await pool.query(guarantorQuery, [sub.marketer_id]);
    
    const commitmentQuery = `
      SELECT id, created_at, updated_at
      FROM marketer_commitment_form
      WHERE marketer_id = $1
      ORDER BY created_at DESC
      LIMIT 1;
    `;
    const commitment = await pool.query(commitmentQuery, [sub.marketer_id]);
    
    // Get audit logs
    const auditLogsQuery = `
      SELECT 
        kal.*,
        u.first_name || ' ' || u.last_name as performed_by_name
      FROM kyc_audit_log kal
      LEFT JOIN users u ON kal.performed_by = u.id
      WHERE kal.submission_id = $1
      ORDER BY kal.created_at ASC;
    `;
    const auditLogs = await pool.query(auditLogsQuery, [submissionId]);
    
    // Build timeline
    const timeline = {
      submission: {
        id: sub.id,
        marketer_id: sub.marketer_id,
        marketer_unique_id: sub.unique_id,
        marketer_name: `${sub.first_name} ${sub.last_name}`,
        marketer_email: sub.email,
        status: sub.submission_status,
        created_at: sub.created_at
      },
      stages: {
        forms: {
          status: 'completed',
          progress: 100,
          started_at: sub.created_at,
          completed_at: sub.forms_completed_at,
          time_taken_hours: sub.forms_completed_at ? 
            (new Date(sub.forms_completed_at) - new Date(sub.created_at)) / (1000 * 60 * 60) : null,
          forms: {
            biodata: {
              status: biodata.rows.length > 0 ? 'completed' : 'pending',
              completed_at: biodata.rows[0]?.created_at || null
            },
            guarantor: {
              status: guarantor.rows.length > 0 ? 'completed' : 'pending',
              completed_at: guarantor.rows[0]?.created_at || null
            },
            commitment: {
              status: commitment.rows.length > 0 ? 'completed' : 'pending',
              completed_at: commitment.rows[0]?.created_at || null
            }
          }
        },
        admin_review: {
          status: sub.admin_reviewed_at ? 'completed' : (sub.forms_completed_at ? 'in_progress' : 'pending'),
          progress: sub.admin_reviewed_at ? 100 : (sub.forms_completed_at ? 50 : 0),
          started_at: sub.forms_completed_at,
          completed_at: sub.admin_reviewed_at,
          time_taken_hours: sub.admin_reviewed_at && sub.forms_completed_at ? 
            (new Date(sub.admin_reviewed_at) - new Date(sub.forms_completed_at)) / (1000 * 60 * 60) : null,
          assigned_to: sub.admin_first_name && sub.admin_last_name ? 
            `${sub.admin_first_name} ${sub.admin_last_name}` : null,
          notes: sub.admin_notes
        },
        superadmin_review: {
          status: sub.superadmin_reviewed_at ? 'completed' : (sub.admin_reviewed_at ? 'in_progress' : 'pending'),
          progress: sub.superadmin_reviewed_at ? 100 : (sub.admin_reviewed_at ? 50 : 0),
          started_at: sub.admin_reviewed_at,
          completed_at: sub.superadmin_reviewed_at,
          time_taken_hours: sub.superadmin_reviewed_at && sub.admin_reviewed_at ? 
            (new Date(sub.superadmin_reviewed_at) - new Date(sub.admin_reviewed_at)) / (1000 * 60 * 60) : null,
          assigned_to: sub.superadmin_first_name && sub.superadmin_last_name ? 
            `${sub.superadmin_first_name} ${sub.superadmin_last_name}` : null,
          notes: sub.superadmin_notes
        },
        masteradmin_approval: {
          status: sub.masteradmin_approved_at ? 'completed' : (sub.superadmin_reviewed_at ? 'in_progress' : 'pending'),
          progress: sub.masteradmin_approved_at ? 100 : (sub.superadmin_reviewed_at ? 50 : 0),
          started_at: sub.superadmin_reviewed_at,
          completed_at: sub.masteradmin_approved_at,
          time_taken_hours: sub.masteradmin_approved_at && sub.superadmin_reviewed_at ? 
            (new Date(sub.masteradmin_approved_at) - new Date(sub.superadmin_reviewed_at)) / (1000 * 60 * 60) : null,
          notes: sub.masteradmin_notes
        }
      },
      audit_logs: auditLogs.rows,
      summary: {
        total_time_hours: sub.masteradmin_approved_at ? 
          (new Date(sub.masteradmin_approved_at) - new Date(sub.created_at)) / (1000 * 60 * 60) : null,
        current_stage: sub.masteradmin_approved_at ? 'approved' : 
          (sub.superadmin_reviewed_at ? 'masteradmin' : 
          (sub.admin_reviewed_at ? 'superadmin' : 
          (sub.forms_completed_at ? 'admin' : 'forms')))
      }
    };
    
    res.json({
      success: true,
      data: timeline
    });
    
  } catch (error) {
    console.error('Error getting KYC timeline:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get KYC timeline',
      error: error.message
    });
  }
};

/**
 * Get all KYC tracking data (list view)
 * GET /api/kyc-tracking
 */
const getAllKYCTracking = async (req, res) => {
  try {
    const { status, days = 30 } = req.query;
    
    // Build query
    let query = `
      SELECT * FROM kyc_tracking_view
      WHERE submission_created_at >= NOW() - INTERVAL '${days} days'
    `;
    
    const params = [];
    
    if (status) {
      query += ` AND submission_status = $1`;
      params.push(status);
    }
    
    query += ` ORDER BY submission_created_at DESC`;
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
    
  } catch (error) {
    console.error('Error getting KYC tracking data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get KYC tracking data',
      error: error.message
    });
  }
};

/**
 * Log a KYC action
 * POST /api/kyc-tracking/log
 */
const logKYCAction = async (req, res) => {
  try {
    const {
      submission_id,
      marketer_id,
      action_type,
      stage,
      action,
      performed_by,
      performed_by_role,
      notes,
      metadata
    } = req.body;
    
    const result = await pool.query(
      `SELECT log_kyc_action($1, $2, $3, $4, $5, $6, $7, $8, $9) as log_id`,
      [submission_id, marketer_id, action_type, stage, action, performed_by, performed_by_role, notes, metadata || null]
    );
    
    res.json({
      success: true,
      message: 'KYC action logged successfully',
      log_id: result.rows[0].log_id
    });
    
  } catch (error) {
    console.error('Error logging KYC action:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to log KYC action',
      error: error.message
    });
  }
};

/**
 * Get KYC statistics
 * GET /api/kyc-tracking/statistics
 */
const getKYCStatistics = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    
    // Get overall statistics
    const statsQuery = `
      SELECT 
        COUNT(*) as total_submissions,
        COUNT(*) FILTER (WHERE submission_status = 'pending_marketer_forms') as pending_forms,
        COUNT(*) FILTER (WHERE submission_status = 'pending_admin_review') as pending_admin,
        COUNT(*) FILTER (WHERE submission_status = 'pending_superadmin_review') as pending_superadmin,
        COUNT(*) FILTER (WHERE submission_status = 'pending_masteradmin_approval') as pending_masteradmin,
        COUNT(*) FILTER (WHERE submission_status = 'approved') as approved,
        COUNT(*) FILTER (WHERE submission_status = 'rejected') as rejected,
        AVG(forms_stage_hours) as avg_forms_hours,
        AVG(admin_stage_hours) as avg_admin_hours,
        AVG(superadmin_stage_hours) as avg_superadmin_hours,
        AVG(masteradmin_stage_hours) as avg_masteradmin_hours
      FROM kyc_tracking_view
      WHERE submission_created_at >= NOW() - INTERVAL '${days} days';
    `;
    
    const stats = await pool.query(statsQuery);
    
    res.json({
      success: true,
      data: stats.rows[0]
    });
    
  } catch (error) {
    console.error('Error getting KYC statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get KYC statistics',
      error: error.message
    });
  }
};

module.exports = {
  getKYCTimeline,
  getAllKYCTracking,
  logKYCAction,
  getKYCStatistics
};

