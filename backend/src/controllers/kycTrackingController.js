// src/controllers/kycTrackingController.js
// Controller for KYC tracking and timeline

const { pool } = require('../config/database');

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

/**
 * Get all KYC timelines with detailed tracking information
 * GET /api/kyc-tracking/timelines
 */
const getAllKYCTimelines = async (req, res) => {
  try {
    console.log('🔍 Getting all KYC timelines...');
    
    // Get all submissions with timeline data
    const query = `
      SELECT
        vs.id AS submission_id,
        vs.marketer_id,
        vs.submission_status,
        vs.created_at AS submission_created_at,
        vs.updated_at AS submission_updated_at,
        vs.marketer_biodata_submitted_at,
        vs.marketer_guarantor_submitted_at,
        vs.marketer_commitment_submitted_at,
        vs.admin_review_started_at,
        vs.admin_review_completed_at,
        vs.superadmin_review_started_at,
        vs.superadmin_review_completed_at,
        vs.masteradmin_approval_started_at,
        vs.masteradmin_approved_at,
        vs.rejection_reason,
        vs.rejected_by,
        vs.rejected_at,
        vs.admin_notes,
        vs.superadmin_notes,
        vs.masteradmin_notes,
        u.unique_id AS marketer_unique_id,
        u.first_name AS marketer_first_name,
        u.last_name AS marketer_last_name,
        u.email AS marketer_email,
        admin.first_name AS admin_first_name,
        admin.last_name AS admin_last_name,
        superadmin.first_name AS superadmin_first_name,
        superadmin.last_name AS superadmin_last_name
      FROM verification_submissions vs
      LEFT JOIN users u ON vs.marketer_id = u.id
      LEFT JOIN users admin ON vs.admin_id = admin.id
      LEFT JOIN users superadmin ON vs.super_admin_id = superadmin.id
      ORDER BY vs.created_at DESC
    `;
    
    const result = await pool.query(query);
    
    // Process each submission to calculate timeline metrics
    const timelines = result.rows.map(submission => {
      const now = new Date();
      const stages = {};
      
      // Stage 1: Forms Submission
      if (submission.marketer_biodata_submitted_at && 
          submission.marketer_guarantor_submitted_at && 
          submission.marketer_commitment_submitted_at) {
        const formsCompleted = new Date(Math.max(
          new Date(submission.marketer_biodata_submitted_at),
          new Date(submission.marketer_guarantor_submitted_at),
          new Date(submission.marketer_commitment_submitted_at)
        ));
        
        stages.forms = {
          status: 'completed',
          completed_at: formsCompleted,
          time_elapsed_ms: formsCompleted - new Date(submission.submission_created_at)
        };
      } else {
        stages.forms = {
          status: 'in_progress',
          completed_at: null,
          time_elapsed_ms: null
        };
      }
      
      // Stage 2: Admin Review
      if (submission.admin_review_completed_at) {
        const started = submission.admin_review_started_at 
          ? new Date(submission.admin_review_started_at) 
          : stages.forms.completed_at;
        
        stages.admin_review = {
          status: 'completed',
          started_at: started,
          completed_at: new Date(submission.admin_review_completed_at),
          time_elapsed_ms: new Date(submission.admin_review_completed_at) - started,
          notes: submission.admin_notes,
          reviewed_by: submission.admin_first_name && submission.admin_last_name 
            ? `${submission.admin_first_name} ${submission.admin_last_name}` 
            : null
        };
      } else if (submission.admin_review_started_at) {
        stages.admin_review = {
          status: 'in_progress',
          started_at: new Date(submission.admin_review_started_at),
          completed_at: null,
          time_elapsed_ms: now - new Date(submission.admin_review_started_at),
          notes: submission.admin_notes
        };
      } else if (stages.forms.status === 'completed') {
        stages.admin_review = {
          status: 'pending',
          started_at: null,
          completed_at: null,
          time_elapsed_ms: null
        };
      }
      
      // Stage 3: SuperAdmin Review
      if (submission.superadmin_review_completed_at) {
        const started = submission.superadmin_review_started_at 
          ? new Date(submission.superadmin_review_started_at) 
          : stages.admin_review?.completed_at;
        
        stages.superadmin_review = {
          status: 'completed',
          started_at: started,
          completed_at: new Date(submission.superadmin_review_completed_at),
          time_elapsed_ms: new Date(submission.superadmin_review_completed_at) - started,
          notes: submission.superadmin_notes,
          reviewed_by: submission.superadmin_first_name && submission.superadmin_last_name 
            ? `${submission.superadmin_first_name} ${submission.superadmin_last_name}` 
            : null
        };
      } else if (submission.superadmin_review_started_at) {
        stages.superadmin_review = {
          status: 'in_progress',
          started_at: new Date(submission.superadmin_review_started_at),
          completed_at: null,
          time_elapsed_ms: now - new Date(submission.superadmin_review_started_at),
          notes: submission.superadmin_notes
        };
      } else if (stages.admin_review?.status === 'completed') {
        stages.superadmin_review = {
          status: 'pending',
          started_at: null,
          completed_at: null,
          time_elapsed_ms: null
        };
      }
      
      // Stage 4: MasterAdmin Approval
      if (submission.masteradmin_approved_at) {
        const started = submission.masteradmin_approval_started_at 
          ? new Date(submission.masteradmin_approval_started_at) 
          : stages.superadmin_review?.completed_at;
        
        stages.masteradmin_approval = {
          status: 'completed',
          started_at: started,
          completed_at: new Date(submission.masteradmin_approved_at),
          time_elapsed_ms: new Date(submission.masteradmin_approved_at) - started,
          result: 'approved',
          notes: submission.masteradmin_notes
        };
      } else if (submission.rejected_at) {
        stages.masteradmin_approval = {
          status: 'completed',
          started_at: submission.masteradmin_approval_started_at 
            ? new Date(submission.masteradmin_approval_started_at) 
            : stages.superadmin_review?.completed_at,
          completed_at: new Date(submission.rejected_at),
          time_elapsed_ms: null,
          result: 'rejected',
          rejection_reason: submission.rejection_reason,
          notes: submission.masteradmin_notes
        };
      } else if (submission.masteradmin_approval_started_at) {
        stages.masteradmin_approval = {
          status: 'in_progress',
          started_at: new Date(submission.masteradmin_approval_started_at),
          completed_at: null,
          time_elapsed_ms: now - new Date(submission.masteradmin_approval_started_at),
          notes: submission.masteradmin_notes
        };
      } else if (stages.superadmin_review?.status === 'completed') {
        stages.masteradmin_approval = {
          status: 'pending',
          started_at: null,
          completed_at: null,
          time_elapsed_ms: null
        };
      }
      
      // Calculate total time and progress
      const totalTimeElapsed = now - new Date(submission.submission_created_at);
      
      // Calculate progress based on actual completion
      // Stage 1 (Forms): 25%
      // Stage 2 (Admin Review): 50%
      // Stage 3 (SuperAdmin Review): 75%
      // Stage 4 (MasterAdmin Approval): 100%
      
      let progressPercentage = 0;
      
      if (submission.submission_status === 'approved' || submission.submission_status === 'rejected') {
        progressPercentage = 100; // Fully completed (approved or rejected)
      } else if (stages.masteradmin_approval?.status === 'in_progress') {
        progressPercentage = 75; // At MasterAdmin stage
      } else if (stages.superadmin_review?.status === 'completed') {
        progressPercentage = 75; // Completed SuperAdmin review
      } else if (stages.superadmin_review?.status === 'in_progress') {
        progressPercentage = 75; // In SuperAdmin review
      } else if (stages.admin_review?.status === 'completed') {
        progressPercentage = 50; // Completed Admin review
      } else if (stages.admin_review?.status === 'in_progress') {
        progressPercentage = 50; // In Admin review
      } else if (stages.forms?.status === 'completed') {
        progressPercentage = 25; // Completed forms
      } else if (stages.forms?.status === 'in_progress') {
        progressPercentage = 0; // Forms in progress (not fully submitted)
      } else {
        progressPercentage = 0; // Not started
      }
      
      // Detect bottlenecks
      const isStuck = Object.values(stages).some(stage => {
        if (stage.status === 'in_progress' && stage.time_elapsed_ms) {
          const hoursStuck = stage.time_elapsed_ms / (1000 * 60 * 60);
          return hoursStuck > 24; // Stuck for more than 24 hours
        }
        return false;
      });
      
      const bottleneckStage = Object.entries(stages).find(([name, stage]) => {
        if (stage.status === 'in_progress' && stage.time_elapsed_ms) {
          const hoursStuck = stage.time_elapsed_ms / (1000 * 60 * 60);
          return hoursStuck > 24;
        }
        return false;
      })?.[0];
      
      return {
        submission_id: submission.submission_id,
        marketer: {
          id: submission.marketer_id,
          unique_id: submission.marketer_unique_id,
          name: `${submission.marketer_first_name} ${submission.marketer_last_name}`,
          email: submission.marketer_email
        },
        admin: {
          name: submission.admin_first_name && submission.admin_last_name 
            ? `${submission.admin_first_name} ${submission.admin_last_name}` 
            : null
        },
        superadmin: {
          name: submission.superadmin_first_name && submission.superadmin_last_name 
            ? `${submission.superadmin_first_name} ${submission.superadmin_last_name}` 
            : null
        },
        current_status: submission.submission_status,
        progress_percentage: progressPercentage,
        total_time_elapsed_ms: totalTimeElapsed,
        stages,
        is_stuck: isStuck,
        bottleneck_stage: bottleneckStage,
        created_at: submission.submission_created_at,
        updated_at: submission.submission_updated_at
      };
    });
    
    console.log(`✅ Found ${timelines.length} KYC timelines`);
    
    res.json({
      success: true,
      data: timelines,
      count: timelines.length
    });
    
  } catch (error) {
    console.error('Error getting all KYC timelines:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get KYC timelines',
      error: error.message
    });
  }
};

module.exports = {
  getKYCTimeline,
  getAllKYCTracking,
  logKYCAction,
  getKYCStatistics,
  getAllKYCTimelines
};

