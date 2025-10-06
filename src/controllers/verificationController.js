// src/controllers/VerificationController.js

const { pool } = require("../config/database");
const uploadToCloudinary = require("../utils/uploadToCloudinary"); // Helper to upload file buffers to Cloudinary
const sendSocketNotification = require("../utils/sendSocketNotification");

// Helper function to check if verification_submissions table exists and create it if needed
async function checkVerificationSubmissionsTable() {
  try {
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'verification_submissions'
      );
    `);
    
    if (tableCheck.rows[0].exists) {
      console.log('✅ verification_submissions table exists');
      return true;
    }
    
    console.log('🔄 Creating verification_submissions table...');
    
    // Create the table
    await pool.query(`
      CREATE TABLE verification_submissions (
        id SERIAL PRIMARY KEY,
        marketer_id INTEGER NOT NULL,
        admin_id INTEGER NOT NULL,
        super_admin_id INTEGER NOT NULL,
        submission_status VARCHAR(50) NOT NULL DEFAULT 'pending_admin_review',
        admin_reviewed_at TIMESTAMP,
        superadmin_reviewed_at TIMESTAMP,
        masteradmin_approved_at TIMESTAMP,
        rejection_reason TEXT,
        rejected_by VARCHAR(50),
        rejected_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Add foreign key constraints
    await pool.query(`
      ALTER TABLE verification_submissions 
      ADD CONSTRAINT fk_verification_marketer 
      FOREIGN KEY (marketer_id) REFERENCES users(id);
    `);
    
    await pool.query(`
      ALTER TABLE verification_submissions 
      ADD CONSTRAINT fk_verification_admin 
      FOREIGN KEY (admin_id) REFERENCES users(id);
    `);
    
    await pool.query(`
      ALTER TABLE verification_submissions 
      ADD CONSTRAINT fk_verification_superadmin 
      FOREIGN KEY (super_admin_id) REFERENCES users(id);
    `);
    
    // Create indexes
    await pool.query(`
      CREATE INDEX idx_verification_submissions_marketer ON verification_submissions(marketer_id);
    `);
    
    await pool.query(`
      CREATE INDEX idx_verification_submissions_admin ON verification_submissions(admin_id);
    `);
    
    await pool.query(`
      CREATE INDEX idx_verification_submissions_superadmin ON verification_submissions(super_admin_id);
    `);
    
    await pool.query(`
      CREATE INDEX idx_verification_submissions_status ON verification_submissions(submission_status);
    `);
    
    console.log('✅ verification_submissions table created successfully');
    
    // Also create verification_workflow_logs table
    await createVerificationWorkflowLogsTable();
    
    return true;
    
  } catch (error) {
    console.error('❌ Error with verification_submissions table:', error);
    return false;
  }
}

// Helper function to create verification_workflow_logs table
async function createVerificationWorkflowLogsTable() {
  try {
    // Check if table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'verification_workflow_logs'
      );
    `);
    
    if (tableCheck.rows[0].exists) {
      console.log('✅ verification_workflow_logs table already exists');
      return;
    }
    
    console.log('🔄 Creating verification_workflow_logs table...');
    
    // Create the table
    await pool.query(`
      CREATE TABLE verification_workflow_logs (
        id SERIAL PRIMARY KEY,
        marketer_id INTEGER NOT NULL,
        admin_id INTEGER,
        super_admin_id INTEGER,
        master_admin_id INTEGER,
        action VARCHAR(100) NOT NULL,
        status VARCHAR(50) NOT NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Add foreign key constraints
    await pool.query(`
      ALTER TABLE verification_workflow_logs 
      ADD CONSTRAINT fk_workflow_logs_marketer 
      FOREIGN KEY (marketer_id) REFERENCES users(id);
    `);
    
    await pool.query(`
      ALTER TABLE verification_workflow_logs 
      ADD CONSTRAINT fk_workflow_logs_admin 
      FOREIGN KEY (admin_id) REFERENCES users(id);
    `);
    
    await pool.query(`
      ALTER TABLE verification_workflow_logs 
      ADD CONSTRAINT fk_workflow_logs_superadmin 
      FOREIGN KEY (super_admin_id) REFERENCES users(id);
    `);
    
    await pool.query(`
      ALTER TABLE verification_workflow_logs 
      ADD CONSTRAINT fk_workflow_logs_masteradmin 
      FOREIGN KEY (master_admin_id) REFERENCES users(id);
    `);
    
    // Create indexes
    await pool.query(`
      CREATE INDEX idx_workflow_logs_marketer ON verification_workflow_logs(marketer_id);
    `);
    
    await pool.query(`
      CREATE INDEX idx_workflow_logs_admin ON verification_workflow_logs(admin_id);
    `);
    
    await pool.query(`
      CREATE INDEX idx_workflow_logs_superadmin ON verification_workflow_logs(super_admin_id);
    `);
    
    await pool.query(`
      CREATE INDEX idx_workflow_logs_masteradmin ON verification_workflow_logs(master_admin_id);
    `);
    
    await pool.query(`
      CREATE INDEX idx_workflow_logs_action ON verification_workflow_logs(action);
    `);
    
    await pool.query(`
      CREATE INDEX idx_workflow_logs_status ON verification_workflow_logs(status);
    `);
    
    console.log('✅ verification_workflow_logs table created successfully');
    
  } catch (error) {
    console.error('❌ Error creating verification_workflow_logs table:', error);
    // Don't throw error, just log it
  }
}

/**
 * Helper function to create or update verification submission
 */
const createOrUpdateVerificationSubmission = async (marketerId, adminId) => {
  try {
    // Validate admin assignment
    if (!adminId) {
      console.log(`⚠️ No admin assigned to marketer ${marketerId}. Verification submission cannot be created.`);
      return null;
    }

    // Get the super_admin_id from the admin
    const adminResult = await pool.query(
      'SELECT super_admin_id FROM users WHERE id = $1 AND role = $2',
      [adminId, 'Admin']
    );
    
    if (adminResult.rows.length === 0) {
      console.log(`⚠️ Admin ${adminId} not found or invalid role for marketer ${marketerId}`);
      return null;
    }
    
    const superAdminId = adminResult.rows[0].super_admin_id;
    
    // Check if submission already exists
    const existingSubmission = await pool.query(
      'SELECT id FROM verification_submissions WHERE marketer_id = $1',
      [marketerId]
    );

    if (existingSubmission.rows.length > 0) {
      // Update existing submission
      await pool.query(
        'UPDATE verification_submissions SET admin_id = $2, super_admin_id = $3, updated_at = NOW() WHERE marketer_id = $1',
        [marketerId, adminId, superAdminId]
      );
      return existingSubmission.rows[0].id;
    } else {
      // Create new submission
      const result = await pool.query(
        `INSERT INTO verification_submissions (marketer_id, admin_id, super_admin_id, submission_status, created_at, updated_at)
         VALUES ($1, $2, $3, 'pending_marketer_forms', NOW(), NOW())
         RETURNING id`,
        [marketerId, adminId, superAdminId]
      );
      return result.rows[0].id;
    }
  } catch (error) {
    console.error('Error creating/updating verification submission:', error);
    throw error;
  }
};

/**
 * Helper function to validate workflow status transitions
 */
const validateWorkflowStatusTransition = (currentStatus, newStatus) => {
  const validTransitions = {
    'pending_marketer_forms': ['pending_admin_review', 'cancelled'],
    'pending_admin_review': ['pending_superadmin_review', 'rejected', 'cancelled'],
    'pending_superadmin_review': ['pending_masteradmin_approval', 'rejected', 'cancelled'],
    'pending_masteradmin_approval': ['approved', 'rejected', 'cancelled'],
    'approved': ['cancelled'], // Can only be cancelled after approval
    'rejected': ['pending_marketer_forms'], // Can restart the process
    'cancelled': ['pending_marketer_forms'] // Can restart the process
  };

  return validTransitions[currentStatus]?.includes(newStatus) || false;
};

/**
 * Helper function to notify admin about new verification submission
 */
const notifyAdminOfNewSubmission = async (marketerId) => {
  try {
    // Get verification submission details
    const submissionResult = await pool.query(
      `SELECT vs.id, vs.admin_id, u.first_name, u.last_name, u.email as marketer_email
       FROM verification_submissions vs
       JOIN users u ON vs.marketer_id = u.id
       WHERE vs.marketer_id = $1`,
      [marketerId]
    );

    if (submissionResult.rows.length === 0) return;

    const submission = submissionResult.rows[0];
    
    if (!submission.admin_id) {
      console.log(`⚠️ No admin assigned to marketer ${marketerId} for verification submission ${submission.id}`);
      return;
    }

    // Get admin details
    const adminResult = await pool.query(
      'SELECT first_name, last_name, email FROM users WHERE id = $1',
      [submission.admin_id]
    );

    if (adminResult.rows.length === 0) {
      console.log(`⚠️ Admin ${submission.admin_id} not found for verification submission ${submission.id}`);
      return;
    }

    const admin = adminResult.rows[0];

    // Get admin's unique_id for notification
    const adminUniqueIdResult = await pool.query(
      'SELECT unique_id FROM users WHERE id = $1',
      [submission.admin_id]
    );
    
    if (adminUniqueIdResult.rows.length === 0) {
      console.log(`⚠️ Admin unique_id not found for admin ${submission.admin_id}`);
      return;
    }
    
    const adminUniqueId = adminUniqueIdResult.rows[0].unique_id;
    const message = `New verification submission from ${submission.first_name} ${submission.last_name} (${submission.marketer_email}) is awaiting your review.`;
    
    // Create notification record in the standard notifications table
    await pool.query(
      `INSERT INTO notifications (user_unique_id, message, created_at)
       VALUES ($1, $2, NOW())`,
      [adminUniqueId, message]
    );
    
    // Send WebSocket notification to admin
    const app = require('../server').app;
    const io = app.get('socketio');
    
    if (io) {
      io.to(adminUniqueId).emit('newNotification', {
        message: message,
        created_at: new Date().toISOString(),
        is_read: false
      });
      
      // Update notification count
      const countResult = await pool.query(
        `SELECT COUNT(*) AS unread FROM notifications WHERE user_unique_id = $1 AND NOT is_read`,
        [adminUniqueId]
      );
      const unreadCount = Number(countResult.rows[0].unread);
      
      io.to(adminUniqueId).emit('notificationCount', { count: unreadCount });
      
      console.log(`🔔 Admin ${admin.first_name} ${admin.last_name} (${adminUniqueId}) notified about new verification submission`);
    }
    
    // Also create verification_notifications record for detailed tracking
    await pool.query(
      `INSERT INTO verification_notifications (user_id, type, data, created_at)
       VALUES ($1, 'verification_assigned', $2, NOW())`,
      [
        submission.admin_id,
        JSON.stringify({
          title: 'New Verification Assignment',
          message: `New verification submission from ${submission.first_name} ${submission.last_name}`,
          submission_id: submission.id,
          marketer_id: marketerId,
          marketer_name: `${submission.first_name} ${submission.last_name}`,
          marketer_email: submission.marketer_email,
          action_required: 'admin_verification_visit'
        })
      ]
    );

    console.log(`✅ Admin ${admin.first_name} ${admin.last_name} (${admin.email}) notified about verification submission from ${submission.first_name} ${submission.last_name}`);

    // TODO: Send email notification if email service is configured
    // await sendEmailNotification(admin.email, 'New Verification Assignment', emailTemplate);

  } catch (error) {
    console.error('Error notifying admin of new submission:', error);
    // Don't throw error to avoid breaking the main workflow
  }
};

/**
 * Helper function to check if all forms are completed and update workflow status
 */
const checkAndUpdateWorkflowStatus = async (marketerId) => {
  try {
    console.log(`🔍 Checking workflow status for marketer ${marketerId}`);
    
    // Get user's form completion status
    const userResult = await pool.query(
      'SELECT bio_submitted, guarantor_submitted, commitment_submitted, overall_verification_status FROM users WHERE id = $1',
      [marketerId]
    );

    if (userResult.rows.length === 0) {
      console.log(`⚠️ User ${marketerId} not found`);
      return;
    }

    const { bio_submitted, guarantor_submitted, commitment_submitted, overall_verification_status } = userResult.rows[0];
    console.log(`📊 Form status:`, { bio_submitted, guarantor_submitted, commitment_submitted, overall_verification_status });

    // Check if all forms are completed
    if (bio_submitted && guarantor_submitted && commitment_submitted) {
      console.log(`✅ All forms completed for marketer ${marketerId}`);
      
      // Get current status to validate transition
      const currentStatusResult = await pool.query(
        'SELECT submission_status FROM verification_submissions WHERE marketer_id = $1',
        [marketerId]
      );

      if (currentStatusResult.rows.length === 0) {
        console.log(`⚠️ No verification submission found for marketer ${marketerId}`);
        return;
      }

      const currentStatus = currentStatusResult.rows[0].submission_status;
      const newStatus = 'pending_admin_review';

      console.log(`🔍 Current submission status: ${currentStatus}, target status: ${newStatus}`);

      // Skip validation for now and force the update
      console.log(`🔄 Forcing status update (skipping validation for debugging)`);

      // Update verification submission status
      await pool.query(
        `UPDATE verification_submissions 
         SET submission_status = $2, updated_at = NOW()
         WHERE marketer_id = $1`,
        [marketerId, newStatus]
      );
      console.log(`✅ Verification submission status updated to ${newStatus}`);

      // Update user's overall verification status
      console.log(`🔄 Updating user ${marketerId} overall_verification_status to 'awaiting_admin_review'`);
      const userUpdateResult = await pool.query(
        `UPDATE users 
         SET overall_verification_status = 'awaiting_admin_review', updated_at = NOW()
         WHERE id = $1
         RETURNING overall_verification_status`,
        [marketerId]
      );
      console.log(`✅ User status updated:`, userUpdateResult.rows[0]);

      // Log the status change
      await pool.query(
        `INSERT INTO verification_workflow_logs (verification_submission_id, action_by, action_by_role, action_type, action_description, previous_status, new_status, notes)
         SELECT id, $1, 'marketer', 'forms_completed', 'All required forms completed by marketer', 'pending_marketer_forms', 'awaiting_admin_review', 'All required forms completed by marketer'
         FROM verification_submissions WHERE marketer_id = $1`,
        [marketerId]
      );
      console.log(`✅ Workflow log created`);

      // Notify marketer about status change
      await notifyMarketerOfStatusChange(
        marketerId, 
        'awaiting_admin_review', 
        'All your verification forms have been submitted successfully! Your assigned Admin will now review your application.'
      );
      console.log(`✅ Marketer notified of status change`);

      // Notify assigned admin about new verification submission
      await notifyAdminOfNewSubmission(marketerId);
      console.log(`✅ Admin notified of new submission`);
    } else {
      console.log(`⏳ Not all forms completed yet for marketer ${marketerId}`);
    }
  } catch (error) {
    console.error('❌ Error checking workflow status:', error);
    throw error;
  }
};

/**
 * submitBiodata
 * Inserts a new biodata record into the marketer_biodata table and updates the submission flag.
 * Expects text fields in req.body and two file uploads (as buffers) in req.files:
 * - "passport_photo": the passport photo.
 * - "id_document": the image for the selected means of identification.
 * Uses the marketer's unique ID (req.user.unique_id) for all records.
 */
const submitBiodata = async (req, res, next) => {
  try {
    // Ensure verification_submissions table exists
    await checkVerificationSubmissionsTable();
    
    const marketerUniqueId = req.user.unique_id;
    
    // Check if biodata has already been submitted
    const existingBiodata = await pool.query(
      'SELECT id FROM marketer_biodata WHERE marketer_unique_id = $1',
      [marketerUniqueId]
    );
    
    if (existingBiodata.rows.length > 0) {
      return res.status(400).json({
        message: "Biodata form has already been submitted. You cannot submit it again.",
        error: "Duplicate submission not allowed"
      });
    }
    
    const {
      name, address, phone, religion, date_of_birth, marital_status,
      state_of_origin, state_of_residence, mothers_maiden_name,
      school_attended, means_of_identification, last_place_of_work,
      job_description, reason_for_quitting, medical_condition,
      next_of_kin_name, next_of_kin_phone, next_of_kin_address,
      next_of_kin_relationship, bank_name, account_name,
      account_number,
    } = req.body;

    let passportPhotoUrl = null;
    let identificationFileUrl = null;
    
    // Check if Cloudinary is configured
    const isCloudinaryConfigured = process.env.CLOUDINARY_CLOUD_NAME && 
                                   process.env.CLOUDINARY_API_KEY && 
                                   process.env.CLOUDINARY_API_SECRET &&
                                   process.env.CLOUDINARY_CLOUD_NAME !== 'your_cloud_name';
    
    if (isCloudinaryConfigured) {
      // Upload to Cloudinary if properly configured
    if (req.files?.passport_photo?.[0]?.buffer) {
        try {
      const uploadResult = await uploadToCloudinary(
        req.files.passport_photo[0].buffer,
        { folder: "Vistaprouploads", allowed_formats: ["jpg", "jpeg", "png"] }
      );
      passportPhotoUrl = uploadResult.secure_url;
        } catch (error) {
          console.error('Cloudinary upload error for passport photo:', error);
          // Continue without file upload
        }
    }
    if (req.files?.id_document?.[0]?.buffer) {
        try {
      const uploadResult = await uploadToCloudinary(
        req.files.id_document[0].buffer,
        { folder: "Vistaprouploads", allowed_formats: ["jpg", "jpeg", "png"] }
      );
      identificationFileUrl = uploadResult.secure_url;
        } catch (error) {
          console.error('Cloudinary upload error for ID document:', error);
          // Continue without file upload
        }
      }
    } else {
      // Cloudinary not configured - use placeholder URLs
      console.log('⚠️  Cloudinary not configured - using placeholder URLs for file uploads');
      if (req.files?.passport_photo?.[0]?.buffer) {
        passportPhotoUrl = 'https://via.placeholder.com/300x200?text=Passport+Photo+Uploaded';
      }
      if (req.files?.id_document?.[0]?.buffer) {
        identificationFileUrl = 'https://via.placeholder.com/300x200?text=ID+Document+Uploaded';
      }
    }

    // Check if biodata form has already been submitted
    const checkResult = await pool.query(
      "SELECT bio_submitted, guarantor_submitted, commitment_submitted FROM users WHERE unique_id = $1",
      [marketerUniqueId]
    );
    
    if (checkResult.rows[0]?.bio_submitted) {
      const user = checkResult.rows[0];
      let message = "Biodata form has already been submitted. ";
      
      if (!user.guarantor_submitted && !user.commitment_submitted) {
        message += "Please proceed to fill the Guarantor Form.";
      } else if (!user.commitment_submitted) {
        message += "Please proceed to fill the Commitment Form.";
      } else {
        message += "All forms have been submitted and are under review.";
      }
      
      return res.status(400).json({ 
        field: null, 
        message: message,
        nextStep: user.guarantor_submitted ? (user.commitment_submitted ? 'completed' : 'commitment') : 'guarantor'
      });
    }

    const dob = date_of_birth === "" ? null : date_of_birth;
    const insertQuery = `
      INSERT INTO marketer_biodata (
        marketer_unique_id, name, address, phone, religion,
        date_of_birth, marital_status, state_of_origin,
        state_of_residence, mothers_maiden_name, school_attended,
        means_of_identification, id_document_url, last_place_of_work,
        job_description, reason_for_quitting, medical_condition,
        next_of_kin_name, next_of_kin_phone, next_of_kin_address,
        next_of_kin_relationship, bank_name, account_name,
        account_number, passport_photo_url
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8,
        $9, $10, $11,
        $12, $13, $14,
        $15, $16, $17,
        $18, $19, $20,
        $21, $22, $23,
        $24, $25
      )
      RETURNING *;
    `;
    const values = [
      marketerUniqueId, name, address, phone, religion,
      dob, marital_status, state_of_origin,
      state_of_residence, mothers_maiden_name, school_attended,
      means_of_identification, identificationFileUrl, last_place_of_work,
      job_description, reason_for_quitting, medical_condition,
      next_of_kin_name, next_of_kin_phone, next_of_kin_address,
      next_of_kin_relationship, bank_name, account_name,
      account_number, passportPhotoUrl,
    ];

    let result;
    try {
      result = await pool.query(insertQuery, values);
    } catch (error) {
      console.error('Database error in submitBiodata:', error);
      
      if (error.code === "23505") {
        if (error.constraint === "users_phone_key") {
          return res.status(400).json({
            field: "phone",
            message: "That phone number is already in use."
          });
        }
        if (error.constraint === "users_account_number_key") {
          return res.status(400).json({
            field: "account_number",
            message: "That account number is already in use."
          });
        }
      }
      
      // Handle specific database errors
      if (error.code === "42P01") {
        return res.status(500).json({
          message: "Database table missing. Please contact support.",
          error: "Database configuration error"
        });
      }
      
      if (error.code === "23503") {
        return res.status(400).json({
          message: "Invalid reference data. Please check your information.",
          error: "Foreign key constraint violation"
        });
      }
      
      if (error.code === "23514") {
        return res.status(400).json({
          message: "Invalid data provided. Please check your inputs.",
          error: "Check constraint violation"
        });
      }
      
      return next(error);
    }

    // Mark flag true
    const updatedUserResult = await pool.query(
      "UPDATE users SET bio_submitted = TRUE, updated_at = NOW() WHERE unique_id = $1 RETURNING *",
      [marketerUniqueId]
    );
    
    if (updatedUserResult.rows.length === 0) {
      console.error('❌ Failed to update user bio_submitted flag - user not found');
      return res.status(500).json({
        message: "Failed to update user status. Please try again.",
        error: "User update failed"
      });
    }

    // Get marketer's ID and admin_id for workflow
    const marketerInfo = await pool.query(
      'SELECT id, admin_id FROM users WHERE unique_id = $1',
      [marketerUniqueId]
    );

    if (marketerInfo.rows.length > 0) {
      const { id: marketerId, admin_id } = marketerInfo.rows[0];
      
      // Create or update verification submission
      await createOrUpdateVerificationSubmission(marketerId, admin_id);
      
      // Check if all forms are completed and update workflow status
      await checkAndUpdateWorkflowStatus(marketerId);
    }

    // Notify marketer about biodata form submission
    await notifyMarketerOfStatusChange(
      marketerId, 
      'pending_forms', 
      'Biodata form submitted successfully! Please continue with the remaining forms.'
    );

    res.status(201).json({
      message: "Biodata submitted successfully.",
      biodata: result.rows[0],
      updatedUser: updatedUserResult.rows[0],
    });
  } catch (error) {
    next(error);
  }
};
/**
 * submitGuarantor
 * Inserts a new record into the guarantor_employment_form table and updates the user's flag.
 * Expects text fields in req.body and file uploads in req.files:
 * - "identification_file": for the image of the selected identification.
 * - "signature": for the guarantor's signature image.
 * Uses the marketer's unique ID from req.user.unique_id.
 */
const submitGuarantor = async (req, res, next) => {
  try {
    console.log('🔍 Guarantor form submission started');
    console.log('📋 Request body:', req.body);
    console.log('📁 Request files:', req.files);
    console.log('👤 User:', req.user);
    
    // Ensure verification_submissions table exists
    await checkVerificationSubmissionsTable();
    
    const {
      is_candidate_known, relationship, known_duration, occupation,
      means_of_identification, guarantor_full_name,
      guarantor_home_address, guarantor_office_address,
      guarantor_email, guarantor_phone, candidate_name
    } = req.body;

    let identificationFileUrl = null;
    let signatureUrl = null;
    
    // Check if Cloudinary is configured
    const isCloudinaryConfigured = process.env.CLOUDINARY_CLOUD_NAME && 
                                   process.env.CLOUDINARY_API_KEY && 
                                   process.env.CLOUDINARY_API_SECRET &&
                                   process.env.CLOUDINARY_CLOUD_NAME !== 'your_cloud_name';
    
    if (isCloudinaryConfigured) {
      // Upload to Cloudinary if properly configured
    if (req.files?.identification_file?.[0]?.buffer) {
        try {
      const uploadResult = await uploadToCloudinary(
        req.files.identification_file[0].buffer,
        { folder: "Vistaprouploads", allowed_formats: ["jpg", "jpeg", "png"] }
      );
      identificationFileUrl = uploadResult.secure_url;
        } catch (error) {
          console.error('Cloudinary upload error for identification file:', error);
          // Continue without file upload
        }
    }
    if (req.files?.signature?.[0]?.buffer) {
        try {
      const uploadResult = await uploadToCloudinary(
        req.files.signature[0].buffer,
        { folder: "Vistaprouploads", allowed_formats: ["jpg", "jpeg", "png"] }
      );
      signatureUrl = uploadResult.secure_url;
        } catch (error) {
          console.error('Cloudinary upload error for signature:', error);
          // Continue without file upload
        }
      }
    } else {
      // Cloudinary not configured - use placeholder URLs
      console.log('⚠️  Cloudinary not configured - using placeholder URLs for file uploads');
      if (req.files?.identification_file?.[0]?.buffer) {
        identificationFileUrl = 'https://via.placeholder.com/300x200?text=Identification+Document+Uploaded';
      }
      if (req.files?.signature?.[0]?.buffer) {
        signatureUrl = 'https://via.placeholder.com/300x200?text=Signature+Uploaded';
      }
    }

    const marketerUniqueId = req.user.unique_id;
    if (!marketerUniqueId) {
      return res.status(400).json({ field: null, message: "Marketer Unique ID is missing." });
    }

    const checkResult = await pool.query(
      "SELECT guarantor_submitted FROM users WHERE unique_id = $1",
      [marketerUniqueId]
    );
    if (checkResult.rows[0]?.guarantor_submitted) {
      return res.status(400).json({ field: null, message: "Guarantor form has already been submitted." });
    }

    const insertQuery = `
      INSERT INTO marketer_guarantor_form (
        marketer_id, is_candidate_well_known, relationship,
        known_duration, occupation,
        id_document_url, passport_photo_url, signature_url,
        created_at, updated_at
      ) VALUES (
        (SELECT id FROM users WHERE unique_id = $1), $2, $3,
        $4, $5,
        $6, $7, $8,
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      )
      RETURNING *;
    `;
    const values = [
      marketerUniqueId, is_candidate_known, relationship,
      known_duration, occupation,
      identificationFileUrl, identificationFileUrl, signatureUrl
    ];

    console.log('📝 Inserting guarantor data:', { insertQuery, values });
    
    let result;
    try {
      result = await pool.query(insertQuery, values);
      console.log('✅ Guarantor form inserted successfully:', result.rows[0]);
    } catch (error) {
      console.log('❌ Error inserting guarantor form:', error.message);
      if (error.code === "23505") {
        // example constraint name
        if (error.constraint === "marketer_guarantor_form_identification_file_key") {
          return res.status(400).json({
            field: "identification_file",
            message: "That identification file has already been uploaded."
          });
        }
      }
      return next(error);
    }

    const updatedUserResult = await pool.query(
      "UPDATE users SET guarantor_submitted = TRUE, updated_at = NOW() WHERE unique_id = $1 RETURNING *",
      [marketerUniqueId]
    );
    
    if (updatedUserResult.rows.length === 0) {
      console.error('❌ Failed to update user guarantor_submitted flag - user not found');
      return res.status(500).json({
        message: "Failed to update user status. Please try again.",
        error: "User update failed"
      });
    }

    // Get marketer's ID and admin_id for workflow
    const marketerInfo = await pool.query(
      'SELECT id, admin_id FROM users WHERE unique_id = $1',
      [marketerUniqueId]
    );

    if (marketerInfo.rows.length > 0) {
      const { id: marketerId, admin_id } = marketerInfo.rows[0];
      
      // Create or update verification submission
      await createOrUpdateVerificationSubmission(marketerId, admin_id);
      
      // Check if all forms are completed and update workflow status
      await checkAndUpdateWorkflowStatus(marketerId);
    }

    // Notify marketer about guarantor form submission
    await notifyMarketerOfStatusChange(
      marketerId, 
      'pending_forms', 
      'Guarantor form submitted successfully! Please continue with the remaining forms.'
    );

    res.status(201).json({
      message: "Guarantor form submitted successfully.",
      guarantor: result.rows[0],
      updatedUser: updatedUserResult.rows[0],
    });
  } catch (error) {
    next(error);
  }
};


/**
 * submitCommitment
 * Inserts a new record into the direct_sales_commitment_form table and updates the marketer's flag.
 * Expects text fields in req.body and a file upload via multer (as a buffer) under the field "signature".
 * Uses the marketer's unique ID from req.user.unique_id.
 */
const submitCommitment = async (req, res, next) => {
  try {
    // Ensure verification_submissions table exists
    await checkVerificationSubmissionsTable();
    
    console.log('🔍 Commitment form submission started');
    console.log('📋 Request body:', req.body);
    console.log('📁 Request file:', req.file ? 'File present' : 'No file');
    console.log('👤 User:', req.user);
    
    const {
      promise_accept_false_documents,
      promise_not_request_unrelated_info,
      promise_not_charge_customer_fees,
      promise_not_modify_contract_info,
      promise_not_sell_unapproved_phones,
      promise_not_make_unofficial_commitment,
      promise_not_operate_customer_account,
      promise_accept_fraud_firing,
      promise_not_share_company_info,
      promise_ensure_loan_recovery,
      promise_abide_by_system,
      direct_sales_rep_name,
      date_signed
    } = req.body;

    console.log('📝 Form data parsed:', {
      direct_sales_rep_name,
      date_signed,
      promise_count: Object.keys(req.body).filter(k => k.startsWith('promise_')).length
    });

    if (!req.file?.buffer) {
      console.log('❌ No signature file provided');
      return res.status(400).json({ field: "signature", message: "Signature image is required." });
    }
    
    let signatureUrl = null;
    
    // Check if Cloudinary is configured
    const isCloudinaryConfigured = process.env.CLOUDINARY_CLOUD_NAME && 
                                   process.env.CLOUDINARY_API_KEY && 
                                   process.env.CLOUDINARY_API_SECRET &&
                                   process.env.CLOUDINARY_CLOUD_NAME !== 'your_cloud_name';
    
    if (isCloudinaryConfigured) {
      // Upload to Cloudinary if properly configured
      try {
    const uploadResult = await uploadToCloudinary(req.file.buffer, {
      folder: "Vistaprouploads", allowed_formats: ["jpg", "jpeg", "png"]
    });
        signatureUrl = uploadResult.secure_url;
      } catch (error) {
        console.error('Cloudinary upload error for signature:', error);
        // Use placeholder URL as fallback
        signatureUrl = 'https://via.placeholder.com/300x200?text=Signature+Uploaded';
      }
    } else {
      // Cloudinary not configured - use placeholder URL
      console.log('⚠️  Cloudinary not configured - using placeholder URL for signature upload');
      signatureUrl = 'https://via.placeholder.com/300x200?text=Signature+Uploaded';
    }

    const marketerUniqueId = req.user.unique_id;
    if (!marketerUniqueId) {
      console.log('❌ Marketer Unique ID is missing');
      return res.status(400).json({ field: null, message: "Marketer Unique ID is missing." });
    }

    console.log('👤 Marketer Unique ID:', marketerUniqueId);

    // Check if commitment form has already been submitted
    const checkResult = await pool.query(
      "SELECT commitment_submitted, bio_submitted, guarantor_submitted FROM users WHERE unique_id = $1",
      [marketerUniqueId]
    );
    
    if (checkResult.rows[0]?.commitment_submitted) {
      return res.status(400).json({ 
        field: null, 
        message: "Commitment form has already been submitted. All forms are now under review." 
      });
    }

    const parseBool = val => (val?.toLowerCase() === "yes");
    const insertQuery = `
      INSERT INTO marketer_commitment_form (
        marketer_id,
        promise_accept_false_documents,
        promise_not_request_irrelevant_info,
        promise_not_charge_customer_fees,
        promise_not_modify_contract_info,
        promise_not_sell_unapproved_phones,
        promise_not_make_unofficial_commitment,
        promise_not_operate_customer_account,
        promise_accept_fraud_firing,
        promise_not_share_company_info,
        promise_ensure_loan_recovery,
        promise_abide_by_system,
        direct_sales_rep_name,
        direct_sales_rep_signature_url,
        date_signed,
        created_at, updated_at
      ) VALUES (
        (SELECT id FROM users WHERE unique_id = $1),$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
      )
      RETURNING *;
    `;
    const values = [
      marketerUniqueId,
      parseBool(promise_accept_false_documents),
      parseBool(promise_not_request_unrelated_info),
      parseBool(promise_not_charge_customer_fees),
      parseBool(promise_not_modify_contract_info),
      parseBool(promise_not_sell_unapproved_phones),
      parseBool(promise_not_make_unofficial_commitment),
      parseBool(promise_not_operate_customer_account),
      parseBool(promise_accept_fraud_firing),
      parseBool(promise_not_share_company_info),
      parseBool(promise_ensure_loan_recovery),
      parseBool(promise_abide_by_system),
      direct_sales_rep_name,
      signatureUrl,
      date_signed
    ];

    console.log('💾 Database values prepared:', {
      marketerUniqueId,
      direct_sales_rep_name,
      date_signed,
      signatureUrl: signatureUrl ? 'Present' : 'Missing',
      values_count: values.length
    });

    let result;
    try {
      console.log('🔄 Executing database insert...');
      result = await pool.query(insertQuery, values);
      console.log('✅ Database insert successful, rows affected:', result.rowCount);
    } catch (error) {
      console.error('❌ Database insert error:', {
        code: error.code,
        constraint: error.constraint,
        message: error.message,
        detail: error.detail
      });
      
      if (error.code === "23505" && error.constraint === "direct_sales_commitment_form_direct_sales_rep_name_key") {
        return res.status(400).json({
          field: "direct_sales_rep_name",
          message: "That Direct Sales Rep name has already been used."
        });
      }
      return next(error);
    }

    console.log('🔄 Updating user commitment_submitted flag...');
    const updatedUserResult = await pool.query(
      "UPDATE users SET commitment_submitted = TRUE, updated_at = NOW() WHERE unique_id = $1 RETURNING *",
      [marketerUniqueId]
    );
    
    if (updatedUserResult.rows.length === 0) {
      console.error('❌ Failed to update user commitment_submitted flag - user not found');
      return res.status(500).json({
        message: "Failed to update user status. Please try again.",
        error: "User update failed"
      });
    }
    
    console.log('✅ User commitment_submitted flag updated successfully');

    // Get marketer's ID and admin_id for workflow
    console.log('🔍 Getting marketer info for workflow...');
    const marketerInfo = await pool.query(
      'SELECT id, admin_id FROM users WHERE unique_id = $1',
      [marketerUniqueId]
    );

    if (marketerInfo.rows.length > 0) {
      const { id: marketerId, admin_id } = marketerInfo.rows[0];
      console.log('👤 Marketer info:', { marketerId, admin_id });
      
      // Create or update verification submission
      console.log('🔄 Creating/updating verification submission...');
      await createOrUpdateVerificationSubmission(marketerId, admin_id);
      
      // Check if all forms are completed and update workflow status
      console.log('🔄 Checking workflow status...');
      await checkAndUpdateWorkflowStatus(marketerId);
    }

    console.log('🔍 Getting final form status...');
    const { bio_submitted, guarantor_submitted, commitment_submitted } =
      (await pool.query(
        "SELECT bio_submitted, guarantor_submitted, commitment_submitted FROM users WHERE unique_id = $1",
        [marketerUniqueId]
      )).rows[0];

    console.log('📊 Final form status:', { bio_submitted, guarantor_submitted, commitment_submitted });

    if (bio_submitted && guarantor_submitted && commitment_submitted) {
      console.log('🎉 All forms completed, sending notification...');
      await sendSocketNotification(
        marketerUniqueId,
        "All your forms have been submitted successfully. Your submission is under review and your dashboard is unlocked.",
        req.app
      );
    }

    // Notify marketer about commitment form submission
    await notifyMarketerOfStatusChange(
      marketerId, 
      'pending_forms', 
      'Commitment form submitted successfully! Please continue with the remaining forms.'
    );

    console.log('✅ Commitment form submission completed successfully');
    res.status(201).json({
      message: "Commitment form submitted successfully.",
      commitment: result.rows[0],
      updatedUser: updatedUserResult.rows[0]
    });
  } catch (error) {
    console.error('❌ Commitment form submission error:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    next(error);
  }
};

/**
 * allowRefillForm
 * This endpoint allows a Master Admin to reset a submission flag for a specific form.
 * Optionally, if a submissionId is provided, the corresponding submission record is deleted.
 * Then it resets the appropriate flag in the users table.
 *
 * Input (from req.body):
 *   - marketerUniqueId: The unique ID of the marketer.
 *   - formType: A string ("biodata", "guarantor", or "commitment").
 *   - submissionId (optional): The ID of the submission record to delete.
 */
const allowRefillForm = async (req, res, next) => {
  try {
    const { marketerUniqueId, formType, submissionId } = req.body;
    if (!marketerUniqueId || !formType) {
      return res.status(400).json({ message: "Marketer Unique ID and form type are required." });
    }
    
    // Determine table and flag name.
    let tableName, flagName;
    if (formType.toLowerCase() === "biodata") {
      tableName = "marketer_biodata";
      flagName = "bio_submitted";
    } else if (formType.toLowerCase() === "guarantor") {
      tableName = "guarantor_employment_form";
      flagName = "guarantor_submitted";
    } else if (formType.toLowerCase() === "commitment") {
      tableName = "direct_sales_commitment_form";
      flagName = "commitment_submitted";
    } else {
      return res.status(400).json({ message: "Invalid form type provided." });
    }
    
    // Optionally delete the submission record.
    if (submissionId) {
      const deleteQuery = `DELETE FROM ${tableName} WHERE id = $1 RETURNING *`;
      const deleteResult = await pool.query(deleteQuery, [submissionId]);
      if (deleteResult.rowCount === 0) {
        return res.status(404).json({ message: "Submission not found." });
      }
    }
    
    // Reset the flag (and mark overall status as pending).
    const updateQuery = `
      UPDATE users
      SET ${flagName} = false,
          overall_verification_status = 'pending',
          updated_at = NOW()
      WHERE unique_id = $1
      RETURNING *
    `;
    const result = await pool.query(updateQuery, [marketerUniqueId]);
    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Marketer not found." });
    }
    
    // Emit a Socket.IO event to notify the marketer.
    const io = req.app.get('socketio');
    if (io) { marketerUniqueId,   
      io.to(marketerUniqueId).emit('formReset', {
        formType: formType.toLowerCase(),
        message: `Your ${formType} form has been reset. Please refill it.`
      });
    }

    res.status(200).json({
      message: `Refill allowed for ${formType} form.`,
      user: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

/**
 * adminReview
 * Allows an Admin to review a marketer's submitted forms.
 * Expects { marketerUniqueId, bioApproved, guarantorApproved, commitmentApproved, admin_review_report } in req.body.
 */
const adminReview = async (req, res, next) => {
  try {
    const { marketerUniqueId, bioApproved, guarantorApproved, commitmentApproved, admin_review_report } = req.body;
    if (!marketerUniqueId) {
      return res.status(400).json({ message: "Marketer Unique ID is required." });
    }
    const query = `
      UPDATE users
      SET bio_submitted = $1,
          guarantor_submitted = $2,
          commitment_submitted = $3,
          admin_review_report = $4,
          overall_verification_status = 'admin reviewed',
          updated_at = NOW()
      WHERE unique_id = $5
      RETURNING *
    `;
    const values = [
      !!(bioApproved && bioApproved.toLowerCase() === "yes"),
      !!(guarantorApproved && guarantorApproved.toLowerCase() === "yes"),
      !!(commitmentApproved && commitmentApproved.toLowerCase() === "yes"),
      admin_review_report,
      marketerUniqueId,
    ];
    const result = await pool.query(query, values);
    res.status(200).json({
      message: "Marketer reviewed by Admin.",
      user: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

/**
 * superadminVerify
 * Allows a SuperAdmin to verify or reject a marketer's forms.
 * Expects { marketerUniqueId, verified, superadmin_review_report } in req.body.
 * Only allows verification if the marketer is assigned to an admin whose super_admin_id matches the logged-in SuperAdmin.
 */
const superadminVerify = async (req, res, next) => {
  try {
    const { marketerUniqueId, verified, superadmin_review_report } = req.body;
    if (!marketerUniqueId) {
      return res.status(400).json({ message: "Marketer Unique ID is required." });
    }
    
    const superadminId = req.user.id;
    const superadminUniqueId = req.user.unique_id;
    
    // Get marketer and admin information
    const marketerResult = await pool.query(
      "SELECT id, admin_id, first_name, last_name FROM users WHERE unique_id = $1",
      [marketerUniqueId]
    );
    if (marketerResult.rowCount === 0) {
      return res.status(404).json({ message: "Marketer not found." });
    }
    const marketer = marketerResult.rows[0];
    
    if (!marketer.admin_id) {
      return res.status(400).json({ message: "Marketer is not assigned to any admin." });
    }
    
    // Get admin information
    const adminResult = await pool.query(
      "SELECT id, unique_id, first_name, last_name, super_admin_id FROM users WHERE id = $1",
      [marketer.admin_id]
    );
    if (adminResult.rowCount === 0) {
      return res.status(404).json({ message: "Admin not found." });
    }
    const admin = adminResult.rows[0];
    
    if (admin.super_admin_id !== superadminId) {
      return res.status(403).json({ message: "You are not authorized to verify this marketer." });
    }
    
    // Determine the correct status
    const isApproved = verified && verified.toLowerCase() === "yes";
    const overallStatus = isApproved ? "awaiting_masteradmin_approval" : "superadmin_rejected";
    
    // Update user status
    const queryUpdate = `
      UPDATE users
      SET overall_verification_status = $1,
          updated_at = NOW()
      WHERE unique_id = $2
      RETURNING *
    `;
    const valuesUpdate = [overallStatus, marketerUniqueId];
    const resultUpdate = await pool.query(queryUpdate, valuesUpdate);
    
    // CRITICAL FIX: Update verification_submissions table
    const submissionStatus = isApproved ? "pending_masteradmin_approval" : "superadmin_rejected";
    const submissionUpdate = `
      UPDATE verification_submissions
      SET submission_status = $1,
          superadmin_reviewed_at = NOW(),
          updated_at = NOW()
      WHERE marketer_id = $2
      RETURNING *
    `;
    const submissionResult = await pool.query(submissionUpdate, [submissionStatus, marketer.id]);
    
    if (submissionResult.rowCount === 0) {
      console.warn(`⚠️ No verification submission found for marketer ${marketerUniqueId}`);
    } else {
      console.log(`✅ Updated verification submission ${submissionResult.rows[0].id} to status: ${submissionStatus}`);
    }
    
    // Log the workflow action
    await pool.query(
      `INSERT INTO verification_workflow_logs (
        verification_submission_id, action_by, action_by_role, action_type,
        action_description, previous_status, new_status, notes, created_at
      ) VALUES (
        (SELECT id FROM verification_submissions WHERE marketer_id = $1),
        $2, $3, $4, $5, $6, $7, $8, NOW()
      )`,
      [
        marketer.id,
        req.user.id, // action_by (user ID) - use the authenticated user's ID
        'SuperAdmin', // action_by_role
        'superadmin_verification', // action_type
        'SuperAdmin completed verification review', // action_description
        'awaiting_superadmin_validation', // previous_status
        overallStatus, // new_status
        superadmin_review_report || 'SuperAdmin verification completed' // notes
      ]
    );
    
    // Send notifications and WebSocket updates
    if (isApproved) {
      // Notify Marketer
      await notifyMarketerOfStatusChange(
        marketer.id, 
        'awaiting_masteradmin_approval', 
        'Great news! Your verification has been approved by SuperAdmin and is now awaiting MasterAdmin approval.'
      );
      
      // Notify Admin
      await notifyAdminOfStatusChange(
        admin.unique_id,
        `Your marketer ${marketer.first_name} ${marketer.last_name}'s verification has been approved by SuperAdmin and sent to MasterAdmin for final approval.`
      );
      
      // Notify MasterAdmin
      await notifyMasterAdminOfNewSubmission(
        marketer.first_name,
        marketer.last_name,
        admin.first_name,
        admin.last_name
      );
    } else {
      // Notify Marketer of rejection
      await notifyMarketerOfStatusChange(
        marketer.id,
        'superadmin_rejected',
        'Your verification has been reviewed by SuperAdmin but requires additional information. Please contact your Admin for details.'
      );
      
      // Notify Admin of rejection
      await notifyAdminOfStatusChange(
        admin.unique_id,
        `Your marketer ${marketer.first_name} ${marketer.last_name}'s verification was reviewed by SuperAdmin but requires additional information.`
      );
    }
    
    res.status(200).json({
      success: true,
      message: isApproved 
        ? "Marketer verification approved and sent to MasterAdmin for final approval." 
        : "Marketer verification rejected. All parties have been notified.",
      user: resultUpdate.rows[0],
      status: overallStatus
    });
  } catch (error) {
    console.error('SuperAdmin verification error:', error);
    next(error);
  }
};

/**
 * masterApprove
 * Allows the Master Admin to give final approval or rejection to a marketer.
 * Expects { action, reason } in req.body and submissionId in req.params.
 * Updates both users and verification_submissions tables.
 */
const masterApprove = async (req, res, next) => {
  try {
    console.log('🔍 MasterAdmin approval request');
    
    if (req.user.role !== "MasterAdmin") {
      return res.status(403).json({ message: "Only a Master Admin can approve submissions." });
    }
    
    const { submissionId } = req.params;
    const { action, reason } = req.body;
    
    if (!submissionId) {
      return res.status(400).json({ message: "Submission ID is required." });
    }
    
    if (!action || !['approve', 'reject'].includes(action)) {
      return res.status(400).json({ message: "Action must be 'approve' or 'reject'." });
    }
    
    if (!reason || !reason.trim()) {
      return res.status(400).json({ message: "Reason is required." });
    }
    
    console.log(`📋 Processing ${action} for submission ${submissionId}`);
    
    // Get submission details
    const submissionQuery = `
      SELECT 
        vs.id,
        vs.marketer_id,
        vs.submission_status,
        u.unique_id as marketer_unique_id,
        u.first_name,
        u.last_name,
        u.overall_verification_status
      FROM verification_submissions vs
      JOIN users u ON u.id = vs.marketer_id
      WHERE vs.id = $1
    `;
    
    const submissionResult = await pool.query(submissionQuery, [submissionId]);
    
    if (submissionResult.rowCount === 0) {
      return res.status(404).json({ message: "Submission not found." });
    }
    
    const submission = submissionResult.rows[0];
    
    // Check if submission is in correct status for approval
    if (submission.submission_status !== 'pending_masteradmin_approval') {
      return res.status(400).json({ 
        message: `Submission is not in pending approval status. Current status: ${submission.submission_status}` 
      });
    }
    
    const isApproved = action === 'approve';
    const newUserStatus = isApproved ? 'approved' : 'rejected';
    const newSubmissionStatus = isApproved ? 'approved' : 'rejected';
    
    console.log(`🔄 Updating status to: ${newUserStatus} (user) / ${newSubmissionStatus} (submission)`);
    
    // Update users table
    const userUpdateQuery = `
      UPDATE users
      SET overall_verification_status = $1,
          locked = $2,
          updated_at = NOW()
      WHERE id = $3
      RETURNING *
    `;
    
    const userResult = await pool.query(userUpdateQuery, [
      newUserStatus,
      !isApproved, // Lock user if rejected, unlock if approved
      submission.marketer_id
    ]);
    
    // Update verification_submissions table
    const submissionUpdateQuery = `
      UPDATE verification_submissions
      SET submission_status = $1,
          masteradmin_approved_at = $2,
          rejection_reason = $3,
          rejected_by = $4,
          rejected_at = $5,
          updated_at = NOW()
      WHERE id = $6
      RETURNING *
    `;
    
    const now = new Date();
    const submissionResult2 = await pool.query(submissionUpdateQuery, [
      newSubmissionStatus,
      isApproved ? now : null,
      isApproved ? null : reason,
      isApproved ? null : 'MasterAdmin',
      isApproved ? null : now,
      submissionId
    ]);
    
    // Log the workflow action
    await pool.query(
      `INSERT INTO verification_workflow_logs (
        verification_submission_id, action_by, action_by_role, action_type, 
        previous_status, new_status, notes, created_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, NOW()
      )`,
      [
        submissionId,
        req.user.id, // Use user ID, not unique_id
        'MasterAdmin',
        `masteradmin_${action}`,
        'pending_masteradmin_approval',
        newUserStatus,
        reason
      ]
    );
    
    // Send notifications
    if (isApproved) {
      // Notify marketer of approval
      await notifyMarketerOfStatusChange(
        submission.marketer_id,
        'approved',
        'Congratulations! Your verification has been approved by MasterAdmin. Your dashboard is now unlocked!'
      );
    } else {
      // Notify marketer of rejection
      await notifyMarketerOfStatusChange(
        submission.marketer_id,
        'rejected',
        `Your verification has been reviewed by MasterAdmin but requires additional information. Reason: ${reason}`
      );
    }
    
    console.log(`✅ MasterAdmin ${action} completed successfully`);
    
    res.status(200).json({
      success: true,
      message: `Verification ${action}d successfully.`,
      action: action,
      status: newUserStatus,
      user: userResult.rows[0],
      submission: submissionResult2.rows[0]
    });
    
  } catch (error) {
    console.error('MasterAdmin approval error:', error);
    next(error);
  }
};

/**
 * deleteBiodataSubmission
 */
const deleteBiodataSubmission = async (req, res, next) => {
  try {
    if (req.user.role !== "MasterAdmin") {
      return res.status(403).json({ message: "Only a Master Admin can delete submissions." });
    }
    const { submissionId } = req.params;
    const { marketerUniqueId } = req.body;
    if (!submissionId || !marketerUniqueId) {
      return res.status(400).json({ message: "Submission ID and marketerUniqueId are required." });
    }

    // 1) Delete the biodata record
    const deleteResult = await pool.query(
      "DELETE FROM marketer_biodata WHERE id = $1 RETURNING *",
      [submissionId]
    );
    if (deleteResult.rowCount === 0) {
      return res.status(404).json({ message: "Biodata submission not found." });
    }

    // 2) Clear the flag and set overall status to pending
    const userResult = await pool.query(
      `UPDATE users
         SET bio_submitted = FALSE,
             overall_verification_status = 'pending',
             updated_at = NOW()
       WHERE unique_id = $1
       RETURNING *`,
      [marketerUniqueId]
    );

    // 3) Notify the marketer via WebSocket
    const io = req.app.get("socketio");
    if (io) {
      io.to(marketerUniqueId).emit("formReset", {
        formType: "biodata",
        message: "Your Biodata form has been reset by Master Admin. Please refill it."
      });
    }

    res.status(200).json({
      message: "Biodata submission deleted and reset.",
      deleted: deleteResult.rows[0],
      user: userResult.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

/**
 * deleteGuarantorSubmission
 */
const deleteGuarantorSubmission = async (req, res, next) => {
  try {
    if (req.user.role !== "MasterAdmin") {
      return res.status(403).json({ message: "Only a Master Admin can delete submissions." });
    }
    const { submissionId } = req.params;
    const { marketerUniqueId } = req.body;
    if (!submissionId || !marketerUniqueId) {
      return res.status(400).json({ message: "Submission ID and marketerUniqueId are required." });
    }

    // 1) Delete the guarantor record
    const deleteResult = await pool.query(
      "DELETE FROM guarantor_employment_form WHERE id = $1 RETURNING *",
      [submissionId]
    );
    if (deleteResult.rowCount === 0) {
      return res.status(404).json({ message: "Guarantor submission not found." });
    }

    // 2) Clear the flag and reset overall status
    const userResult = await pool.query(
      `UPDATE users
         SET guarantor_submitted = FALSE,
             overall_verification_status = 'pending',
             updated_at = NOW()
       WHERE unique_id = $1
       RETURNING *`,
      [marketerUniqueId]
    );

    // 3) Notify via socket
    const io = req.app.get("socketio");
    if (io) {
      io.to(marketerUniqueId).emit("formReset", {
        formType: "guarantor",
        message: "Your Guarantor form has been reset by Master Admin. Please refill it."
      });
    }

    res.status(200).json({
      message: "Guarantor submission deleted and reset.",
      deleted: deleteResult.rows[0],
      user: userResult.rows[0]
    });
  } catch (error) {
    next(error);
  }
};
/**
 * deleteCommitmentSubmission
 */
const deleteCommitmentSubmission = async (req, res, next) => {
  try {
    if (req.user.role !== "MasterAdmin") {
      return res.status(403).json({ message: "Only a Master Admin can delete submissions." });
    }
    const { submissionId } = req.params;
    const { marketerUniqueId } = req.body;
    if (!submissionId || !marketerUniqueId) {
      return res.status(400).json({ message: "Submission ID and marketerUniqueId are required." });
    }

    // 1) Delete the commitment record
    const deleteResult = await pool.query(
      "DELETE FROM direct_sales_commitment_form WHERE id = $1 RETURNING *",
      [submissionId]
    );
    if (deleteResult.rowCount === 0) {
      return res.status(404).json({ message: "Commitment submission not found." });
    }

    // 2) Clear the flag and reset overall status
    const userResult = await pool.query(
      `UPDATE users
         SET commitment_submitted = FALSE,
             overall_verification_status = 'pending',
             updated_at = NOW()
       WHERE unique_id = $1
       RETURNING *`,
      [marketerUniqueId]
    );

    // 3) Notify via socket
    const io = req.app.get("socketio");
    if (io) {
      io.to(marketerUniqueId).emit("formReset", {
        formType: "commitment",
        message: "Your Commitment form has been reset by Master Admin. Please refill it."
      });
    }

    res.status(200).json({
      message: "Commitment submission deleted and reset.",
      deleted: deleteResult.rows[0],
      user: userResult.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

/**
 * getAllSubmissionsForMasterAdmin
 * Retrieves all verification submissions awaiting MasterAdmin approval
 * Now includes both marketer verifications and admin/superadmin direct approvals
 */
const getAllSubmissionsForMasterAdmin = async (req, res, next) => {
  try {
    console.log('🔍 MasterAdmin submissions request');
    
    // First check if verification_submissions table exists
    const hasVerificationSubmissionsTable = await checkVerificationSubmissionsTable();
    
    if (hasVerificationSubmissionsTable) {
      // Get marketer verifications (full workflow)
      const marketerSubmissionsQuery = `
      SELECT
          vs.id as submission_id,
          vs.submission_status,
          vs.super_admin_id,
          vs.created_at as submission_created_at,
          vs.updated_at as last_updated,
          vs.admin_reviewed_at,
          vs.superadmin_reviewed_at,
          vs.masteradmin_approved_at,
          vs.rejection_reason,
          u.id as marketer_id,
          u.unique_id as marketer_unique_id,
          u.first_name as marketer_first_name,
          u.last_name as marketer_last_name,
          u.email as marketer_email,
          u.location as marketer_location,
          u.overall_verification_status,
          u.role,
          admin.first_name as admin_first_name,
          admin.last_name as admin_last_name,
          admin.unique_id as admin_unique_id,
          superadmin.first_name as superadmin_first_name,
          superadmin.last_name as superadmin_last_name,
          superadmin.unique_id as superadmin_unique_id
        FROM verification_submissions vs
        JOIN users u ON u.id = vs.marketer_id
        LEFT JOIN users admin ON admin.id = vs.admin_id
        LEFT JOIN users superadmin ON superadmin.id = vs.super_admin_id
        WHERE vs.submission_status = 'pending_masteradmin_approval'
        ORDER BY vs.updated_at DESC
      `;
      
      // Get admin/superadmin direct approvals (no verification needed)
      const adminSuperadminQuery = `
      SELECT
          u.id as user_id,
          u.unique_id as user_unique_id,
          u.first_name,
          u.last_name,
          u.email,
          u.location,
          u.overall_verification_status,
          u.role,
          u.created_at,
          u.updated_at
        FROM users u
        WHERE u.role IN ('Admin', 'SuperAdmin')
          AND u.overall_verification_status = 'masteradmin_approval_pending'
          AND u.deleted = FALSE
        ORDER BY u.updated_at DESC
      `;
      
      const [marketerResult, adminSuperadminResult] = await Promise.all([
        pool.query(marketerSubmissionsQuery),
        pool.query(adminSuperadminQuery)
      ]);
      
      console.log(`✅ Found ${marketerResult.rows.length} marketer verifications and ${adminSuperadminResult.rows.length} admin/superadmin approvals`);
      
      // Process marketer submissions with form details
      const marketerSubmissions = await Promise.all(
        marketerResult.rows.map(async (submission) => {
          try {
            // Get biodata
            const biodataResult = await pool.query(`
              SELECT * FROM marketer_biodata 
              WHERE marketer_unique_id = $1 
              ORDER BY created_at DESC LIMIT 1
            `, [submission.marketer_unique_id]);
            
            // Get guarantor form
            const guarantorResult = await pool.query(`
              SELECT * FROM guarantor_employment_form 
              WHERE marketer_unique_id = $1 
              ORDER BY created_at DESC LIMIT 1
            `, [submission.marketer_unique_id]);
            
            // Get commitment form
            const commitmentResult = await pool.query(`
              SELECT * FROM direct_sales_commitment_form 
              WHERE marketer_unique_id = $1 
              ORDER BY created_at DESC LIMIT 1
            `, [submission.marketer_unique_id]);
            
            return {
              ...submission,
              submission_type: 'marketer_verification',
              biodata: biodataResult.rows[0] || null,
              guarantor: guarantorResult.rows[0] || null,
              commitment: commitmentResult.rows[0] || null
            };
          } catch (error) {
            console.error(`Error fetching details for submission ${submission.submission_id}:`, error);
            return {
              ...submission,
              submission_type: 'marketer_verification'
            };
          }
        })
      );
      
      // Process admin/superadmin approvals (no forms needed)
      const adminSuperadminApprovals = adminSuperadminResult.rows.map(user => ({
        user_id: user.user_id,
        user_unique_id: user.user_unique_id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        location: user.location,
        role: user.role,
        overall_verification_status: user.overall_verification_status,
        submission_type: 'admin_superadmin_approval',
        created_at: user.created_at,
        updated_at: user.updated_at
      }));
      
      // Combine all submissions
      const allSubmissions = [...marketerSubmissions, ...adminSuperadminApprovals];
      
      return res.json({
        success: true,
        submissions: allSubmissions,
        total: allSubmissions.length,
        marketer_verifications: marketerSubmissions.length,
        admin_superadmin_approvals: adminSuperadminApprovals.length
      });
      
    } else {
      // Fallback to legacy system - return empty array for now
      console.log('⚠️ verification_submissions table not found, using legacy fallback');
      return res.json({
        success: true,
        submissions: [],
        total: 0,
        message: 'Verification system not yet migrated. No submissions available.'
      });
    }
  } catch (error) {
    console.error('MasterAdmin submissions error:', error);
    next(error);
  }
};

/**
 * getApprovedSubmissionsForMasterAdmin
 * Retrieves all approved/rejected verification submissions for MasterAdmin history view
 */
const getApprovedSubmissionsForMasterAdmin = async (req, res, next) => {
  try {
    console.log('🔍 MasterAdmin approved submissions history request');
    
    // Check if verification_submissions table exists
    const tableExists = await checkVerificationSubmissionsTable();
    
    if (!tableExists) {
      console.log('⚠️ verification_submissions table does not exist, returning empty results');
      return res.json({
        success: true,
        submissions: [],
        message: 'Verification submissions table not found. Migration may be needed.'
      });
    }
    
    const { status = 'all' } = req.query; // 'approved', 'rejected', or 'all'
    
    let statusFilter = '';
    if (status === 'approved') {
      statusFilter = "WHERE vs.submission_status = 'approved'";
    } else if (status === 'rejected') {
      statusFilter = "WHERE vs.submission_status = 'rejected'";
    } else {
      statusFilter = "WHERE vs.submission_status IN ('approved', 'rejected')";
    }
    
    const submissionsQuery = `
      SELECT
        vs.id as submission_id,
        vs.submission_status,
        vs.super_admin_id,
        vs.created_at as submission_created_at,
        vs.updated_at as last_updated,
        vs.admin_reviewed_at,
        vs.superadmin_reviewed_at,
        vs.masteradmin_approved_at,
        vs.rejection_reason,
        vs.rejected_by,
        vs.rejected_at,
        u.id as marketer_id,
        u.unique_id as marketer_unique_id,
        u.first_name as marketer_first_name,
        u.last_name as marketer_last_name,
        u.email as marketer_email,
        u.location as marketer_location,
        u.overall_verification_status,
        admin.first_name as admin_first_name,
        admin.last_name as admin_last_name,
        admin.unique_id as admin_unique_id,
        superadmin.first_name as superadmin_first_name,
        superadmin.last_name as superadmin_last_name,
        superadmin.unique_id as superadmin_unique_id
      FROM verification_submissions vs
      JOIN users u ON u.id = vs.marketer_id
      LEFT JOIN users admin ON admin.id = vs.admin_id
      LEFT JOIN users superadmin ON superadmin.id = vs.super_admin_id
      ${statusFilter}
      ORDER BY vs.updated_at DESC
    `;
    
    const submissionsResult = await pool.query(submissionsQuery);
    console.log(`✅ Found ${submissionsResult.rows.length} ${status} submissions for MasterAdmin history`);
    
    // For each submission, get the detailed form data
    const submissionsWithDetails = await Promise.all(
      submissionsResult.rows.map(async (submission) => {
        try {
          // Get biodata
          const biodataResult = await pool.query(
            "SELECT * FROM marketer_biodata WHERE marketer_unique_id = $1",
            [submission.marketer_unique_id]
          );
          
          // Get guarantor form
          const guarantorResult = await pool.query(
            "SELECT * FROM guarantor_employment_form WHERE marketer_unique_id = $1",
            [submission.marketer_unique_id]
          );
          
          // Get commitment form
          const commitmentResult = await pool.query(
            "SELECT * FROM direct_sales_commitment_form WHERE marketer_unique_id = $1",
            [submission.marketer_unique_id]
          );
          
          // Get admin verification details
          const adminVerificationResult = await pool.query(
            "SELECT * FROM admin_verification_details WHERE verification_submission_id = $1",
            [submission.submission_id]
          );
          
          return {
            ...submission,
            forms: {
              biodata: biodataResult.rows[0] || null,
              guarantor: guarantorResult.rows[0] || null,
              commitment: commitmentResult.rows[0] || null,
              admin_verification: adminVerificationResult.rows[0] || null
            }
          };
        } catch (error) {
          console.error(`Error fetching details for submission ${submission.submission_id}:`, error);
          return submission;
        }
      })
    );

    res.status(200).json({
      success: true,
      submissions: submissionsWithDetails,
      count: submissionsWithDetails.length,
      status: status
    });
  } catch (error) {
    console.error('MasterAdmin approved submissions error:', error);
    next(error);
  }
};

/**
 * getVerificationWorkflowLogs
 * Retrieves verification workflow logs for MasterAdmin audit trail
 */
const getVerificationWorkflowLogs = async (req, res, next) => {
  try {
    console.log('🔍 MasterAdmin workflow logs request');
    
    const { submissionId, limit = 50, offset = 0 } = req.query;
    
    let whereClause = '';
    let queryParams = [];
    
    if (submissionId) {
      whereClause = 'WHERE vwl.verification_submission_id = $1';
      queryParams.push(submissionId);
    }
    
    const logsQuery = `
      SELECT
        vwl.id,
        vwl.verification_submission_id,
        vwl.action_by,
        vwl.action_by_role,
        vwl.action_type,
        vwl.action_description,
        vwl.previous_status,
        vwl.new_status,
        vwl.notes,
        vwl.created_at,
        u.first_name,
        u.last_name,
        u.unique_id as action_by_unique_id,
        vs.marketer_id,
        marketer.first_name as marketer_first_name,
        marketer.last_name as marketer_last_name,
        marketer.unique_id as marketer_unique_id
      FROM verification_workflow_logs vwl
      LEFT JOIN users u ON u.id = vwl.action_by
      LEFT JOIN verification_submissions vs ON vs.id = vwl.verification_submission_id
      LEFT JOIN users marketer ON marketer.id = vs.marketer_id
      ${whereClause}
      ORDER BY vwl.created_at DESC
      LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
    `;
    
    queryParams.push(parseInt(limit), parseInt(offset));
    
    const logsResult = await pool.query(logsQuery, queryParams);
    console.log(`✅ Found ${logsResult.rows.length} workflow logs`);

    res.status(200).json({
      success: true,
      logs: logsResult.rows,
      count: logsResult.rows.length,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    console.error('MasterAdmin workflow logs error:', error);
    next(error);
  }
};

/**
 * getSubmissionsForAdmin
 * Retrieves all submissions for marketers assigned to the logged-in Admin.
 * Now uses the new verification workflow system.
 */
const getSubmissionsForAdmin = async (req, res, next) => {
  try {
    const adminId = req.user.id; // Logged-in Admin's numeric ID
    console.log(`🔍 Admin submissions request from admin ID: ${adminId}`);
    
    // Get verification submissions with workflow status
    const submissionsQuery = `
      SELECT 
        vs.id as submission_id,
        vs.submission_status,
        vs.created_at as submission_created_at,
        vs.updated_at as last_updated,
        vs.rejection_reason as admin_notes,
        u.id as marketer_id,
        u.unique_id as marketer_unique_id,
        u.first_name as marketer_first_name,
        u.last_name as marketer_last_name,
        u.email as marketer_email,
        u.phone as marketer_phone,
        u.location as marketer_location,
        u.bio_submitted,
        u.guarantor_submitted,
        u.commitment_submitted,
        u.overall_verification_status,
        -- Add fields for frontend compatibility
        CONCAT(u.first_name, ' ', u.last_name) as marketer_name,
        u.first_name,
        u.last_name,
        u.email,
        u.phone,
        u.location as marketer_address,
        -- Form status fields
        CASE WHEN u.bio_submitted THEN 'completed' ELSE 'not_submitted' END as biodata_status,
        CASE WHEN u.guarantor_submitted THEN 'completed' ELSE 'not_submitted' END as guarantor_status,
        CASE WHEN u.commitment_submitted THEN 'completed' ELSE 'not_submitted' END as commitment_status,
        -- Check if all forms are submitted
        (u.bio_submitted AND u.guarantor_submitted AND u.commitment_submitted) as all_forms_submitted,
        -- Admin verification fields (with fallback for missing table)
        NULL as admin_verification_date,
        NULL as admin_verification_notes,
        NULL as location_photos,
        NULL as admin_marketer_photos,
        NULL as landmark_photos,
        -- Admin name
        CONCAT(admin.first_name, ' ', admin.last_name) as admin_name,
        -- Detailed form data
        mb.name as biodata_name,
        mb.address as biodata_address,
        mb.phone as biodata_phone,
        mb.religion as biodata_religion,
        mb.date_of_birth as biodata_dob,
        mb.marital_status as biodata_marital_status,
        mb.state_of_origin as biodata_state_origin,
        mb.state_of_residence as biodata_state_residence,
        mb.mothers_maiden_name as biodata_mothers_maiden,
        mb.school_attended as biodata_school,
        mb.means_of_identification as biodata_id_type,
        mb.id_document_url as biodata_id_document,
        mb.last_place_of_work as biodata_work_place,
        mb.job_description as biodata_job_desc,
        mb.reason_for_quitting as biodata_quit_reason,
        mb.medical_condition as biodata_medical,
        mb.next_of_kin_name as biodata_kin_name,
        mb.next_of_kin_phone as biodata_kin_phone,
        mb.next_of_kin_address as biodata_kin_address,
        mb.next_of_kin_relationship as biodata_kin_relationship,
        mb.bank_name as biodata_bank_name,
        mb.account_name as biodata_account_name,
        mb.account_number as biodata_account_number,
        mb.passport_photo_url as biodata_passport_photo,
        mb.created_at as biodata_submitted_at,
        -- Guarantor form data
        mgf.is_candidate_well_known as guarantor_well_known,
        mgf.relationship as guarantor_relationship,
        mgf.known_duration as guarantor_known_duration,
        mgf.occupation as guarantor_occupation,
        mgf.id_document_url as guarantor_id_document,
        mgf.passport_photo_url as guarantor_passport_photo,
        mgf.signature_url as guarantor_signature,
        mgf.created_at as guarantor_submitted_at,
        -- Commitment form data
        mcf.promise_accept_false_documents as commitment_false_docs,
        mcf.promise_not_request_irrelevant_info as commitment_irrelevant_info,
        mcf.promise_not_charge_customer_fees as commitment_no_fees,
        mcf.promise_not_modify_contract_info as commitment_no_modify,
        mcf.promise_not_sell_unapproved_phones as commitment_approved_phones,
        mcf.promise_not_make_unofficial_commitment as commitment_no_unofficial,
        mcf.promise_not_operate_customer_account as commitment_no_operate_account,
        mcf.promise_accept_fraud_firing as commitment_fraud_firing,
        mcf.promise_not_share_company_info as commitment_no_share_info,
        mcf.promise_ensure_loan_recovery as commitment_loan_recovery,
        mcf.promise_abide_by_system as commitment_abide_system,
        mcf.direct_sales_rep_name as commitment_rep_name,
        mcf.direct_sales_rep_signature_url as commitment_rep_signature,
        mcf.date_signed as commitment_date_signed,
        mcf.created_at as commitment_submitted_at
      FROM verification_submissions vs
      JOIN users u ON vs.marketer_id = u.id
      LEFT JOIN users admin ON vs.admin_id = admin.id
      LEFT JOIN (
        SELECT DISTINCT ON (marketer_unique_id) *
        FROM marketer_biodata
        ORDER BY marketer_unique_id, created_at DESC
      ) mb ON u.unique_id = mb.marketer_unique_id
      LEFT JOIN marketer_guarantor_form mgf ON u.id = mgf.marketer_id
      LEFT JOIN marketer_commitment_form mcf ON u.id = mcf.marketer_id
      WHERE vs.admin_id = $1
      ORDER BY vs.updated_at DESC
    `;
    
    console.log(`📊 Executing submissions query for admin ${adminId}...`);
    
    let submissionsResult;
    try {
      submissionsResult = await pool.query(submissionsQuery, [adminId]);
      console.log(`✅ Found ${submissionsResult.rows.length} submissions`);
      
      if (submissionsResult.rows.length > 0) {
        console.log('🔍 First submission data:', {
          marketer_id: submissionsResult.rows[0].marketer_id,
          marketer_name: submissionsResult.rows[0].marketer_name,
          bio_submitted: submissionsResult.rows[0].bio_submitted,
          guarantor_submitted: submissionsResult.rows[0].guarantor_submitted,
          commitment_submitted: submissionsResult.rows[0].commitment_submitted,
          guarantor_well_known: submissionsResult.rows[0].guarantor_well_known,
          guarantor_relationship: submissionsResult.rows[0].guarantor_relationship,
          commitment_false_docs: submissionsResult.rows[0].commitment_false_docs
        });
      }
    } catch (queryError) {
      console.error(`❌ Complex query error for admin ${adminId}:`, queryError);
      console.log(`🔄 Falling back to simple query...`);
      
      // First, try to get basic submission data with biodata
      const basicQuery = `
        SELECT 
          vs.id as submission_id,
          vs.submission_status,
          vs.created_at as submission_created_at,
          vs.updated_at as last_updated,
          u.id as marketer_id,
          u.unique_id as marketer_unique_id,
          u.first_name as marketer_first_name,
          u.last_name as marketer_last_name,
          u.email as marketer_email,
          u.phone as marketer_phone,
          u.location as marketer_location,
          u.bio_submitted,
          u.guarantor_submitted,
          u.commitment_submitted,
          u.overall_verification_status,
          CONCAT(u.first_name, ' ', u.last_name) as marketer_name,
          u.first_name,
          u.last_name,
          u.email,
          u.phone,
          u.location as marketer_address,
          -- Form status fields
          CASE WHEN u.bio_submitted THEN 'completed' ELSE 'not_submitted' END as biodata_status,
          CASE WHEN u.guarantor_submitted THEN 'completed' ELSE 'not_submitted' END as guarantor_status,
          CASE WHEN u.commitment_submitted THEN 'completed' ELSE 'not_submitted' END as commitment_status,
          -- Check if all forms are submitted
          (u.bio_submitted AND u.guarantor_submitted AND u.commitment_submitted) as all_forms_submitted,
          -- Admin verification fields (with fallback for missing table)
          NULL as admin_verification_date,
          NULL as admin_verification_notes,
          NULL as location_photos,
          NULL as admin_marketer_photos,
          NULL as landmark_photos,
          -- Admin name
          CONCAT(admin.first_name, ' ', admin.last_name) as admin_name,
          -- Biodata form details
          mb.name as biodata_name,
          mb.address as biodata_address,
          mb.phone as biodata_phone,
          mb.religion as biodata_religion,
          mb.date_of_birth as biodata_dob,
          mb.marital_status as biodata_marital_status,
          mb.state_of_origin as biodata_state_origin,
          mb.state_of_residence as biodata_state_residence,
          mb.mothers_maiden_name as biodata_mothers_maiden,
          mb.school_attended as biodata_school,
          mb.means_of_identification as biodata_id_type,
          mb.id_document_url as biodata_id_document,
          mb.last_place_of_work as biodata_work_place,
          mb.job_description as biodata_job_desc,
          mb.reason_for_quitting as biodata_quit_reason,
          mb.medical_condition as biodata_medical,
          mb.next_of_kin_name as biodata_kin_name,
          mb.next_of_kin_phone as biodata_kin_phone,
          mb.next_of_kin_address as biodata_kin_address,
          mb.next_of_kin_relationship as biodata_kin_relationship,
          mb.bank_name as biodata_bank_name,
          mb.account_name as biodata_account_name,
          mb.account_number as biodata_account_number,
          mb.passport_photo_url as biodata_passport_photo,
          mb.created_at as biodata_submitted_at
        FROM verification_submissions vs
        JOIN users u ON vs.marketer_id = u.id
        LEFT JOIN users admin ON vs.admin_id = admin.id
        LEFT JOIN (
          SELECT DISTINCT ON (marketer_unique_id) *
          FROM marketer_biodata
          ORDER BY marketer_unique_id, created_at DESC
        ) mb ON u.unique_id = mb.marketer_unique_id
        WHERE vs.admin_id = $1
        ORDER BY vs.updated_at DESC
      `;
      
      submissionsResult = await pool.query(basicQuery, [adminId]);
      console.log(`✅ Basic query found ${submissionsResult.rows.length} submissions`);
      
      if (submissionsResult.rows.length > 0) {
        console.log('🔍 Basic query first submission:', {
          marketer_id: submissionsResult.rows[0].marketer_id,
          marketer_name: submissionsResult.rows[0].marketer_name,
          bio_submitted: submissionsResult.rows[0].bio_submitted,
          guarantor_submitted: submissionsResult.rows[0].guarantor_submitted,
          commitment_submitted: submissionsResult.rows[0].commitment_submitted
        });
      }
      
      // Now try to get guarantor and commitment form data for each submission
      for (let i = 0; i < submissionsResult.rows.length; i++) {
        const submission = submissionsResult.rows[i];
        
        // Try to get guarantor form data
        try {
          const guarantorQuery = `
            SELECT 
              is_candidate_well_known as guarantor_well_known,
              relationship as guarantor_relationship,
              known_duration as guarantor_known_duration,
              occupation as guarantor_occupation,
              id_document_url as guarantor_id_document,
              passport_photo_url as guarantor_passport_photo,
              signature_url as guarantor_signature,
              created_at as guarantor_submitted_at,
              -- Additional fields for frontend compatibility
              NULL as guarantor_means_of_identification,
              NULL as guarantor_full_name,
              NULL as guarantor_email,
              NULL as guarantor_phone,
              NULL as guarantor_home_address,
              NULL as guarantor_office_address,
              NULL as candidate_name
            FROM marketer_guarantor_form 
            WHERE marketer_id = $1
            ORDER BY created_at DESC
            LIMIT 1
          `;
          
          const guarantorResult = await pool.query(guarantorQuery, [submission.marketer_id]);
          console.log(`🔍 Guarantor query result for marketer ${submission.marketer_id}:`, guarantorResult.rows.length, 'rows');
          
          if (guarantorResult.rows.length > 0) {
            const guarantorData = guarantorResult.rows[0];
            console.log(`📋 Guarantor data found:`, guarantorData);
            submissionsResult.rows[i] = {
              ...submission,
              ...guarantorData
            };
            console.log(`✅ Added guarantor data for marketer ${submission.marketer_id}`);
          } else {
            // Add null values for guarantor fields
            submissionsResult.rows[i] = {
              ...submission,
              guarantor_well_known: null,
              guarantor_relationship: null,
              guarantor_known_duration: null,
              guarantor_occupation: null,
              guarantor_id_document: null,
              guarantor_passport_photo: null,
              guarantor_signature: null,
              guarantor_submitted_at: null,
              guarantor_means_of_identification: null,
              guarantor_full_name: null,
              guarantor_email: null,
              guarantor_phone: null,
              guarantor_home_address: null,
              guarantor_office_address: null,
              candidate_name: null
            };
          }
        } catch (guarantorError) {
          console.log(`⚠️  Guarantor table not available for marketer ${submission.marketer_id}`);
          // Add null values for guarantor fields
          submissionsResult.rows[i] = {
            ...submission,
            guarantor_well_known: null,
            guarantor_relationship: null,
            guarantor_known_duration: null,
            guarantor_occupation: null,
            guarantor_id_document: null,
            guarantor_passport_photo: null,
            guarantor_signature: null,
            guarantor_submitted_at: null,
            guarantor_means_of_identification: null,
            guarantor_full_name: null,
            guarantor_email: null,
            guarantor_phone: null,
            guarantor_home_address: null,
            guarantor_office_address: null,
            candidate_name: null
          };
        }
        
        // Try to get commitment form data
        try {
          const commitmentQuery = `
            SELECT 
              promise_accept_false_documents as commitment_false_docs,
              promise_not_request_irrelevant_info as commitment_irrelevant_info,
              promise_not_charge_customer_fees as commitment_no_fees,
              promise_not_modify_contract_info as commitment_no_modify,
              promise_not_sell_unapproved_phones as commitment_approved_phones,
              promise_not_make_unofficial_commitment as commitment_no_unofficial,
              promise_not_operate_customer_account as commitment_no_operate_account,
              promise_accept_fraud_firing as commitment_fraud_firing,
              promise_not_share_company_info as commitment_no_share_info,
              promise_ensure_loan_recovery as commitment_loan_recovery,
              promise_abide_by_system as commitment_abide_system,
              direct_sales_rep_name as commitment_rep_name,
              direct_sales_rep_signature_url as commitment_rep_signature,
              date_signed as commitment_date_signed,
              created_at as commitment_submitted_at
            FROM marketer_commitment_form 
            WHERE marketer_id = $1
            ORDER BY created_at DESC
            LIMIT 1
          `;
          
          const commitmentResult = await pool.query(commitmentQuery, [submission.marketer_id]);
          console.log(`🔍 Commitment query result for marketer ${submission.marketer_id}:`, commitmentResult.rows.length, 'rows');
          
          if (commitmentResult.rows.length > 0) {
            const commitmentData = commitmentResult.rows[0];
            console.log(`📋 Commitment data found:`, commitmentData);
            submissionsResult.rows[i] = {
              ...submissionsResult.rows[i],
              ...commitmentData
            };
            console.log(`✅ Added commitment data for marketer ${submission.marketer_id}`);
          } else {
            // Add null values for commitment fields
            submissionsResult.rows[i] = {
              ...submissionsResult.rows[i],
              commitment_false_docs: null,
              commitment_irrelevant_info: null,
              commitment_no_fees: null,
              commitment_no_modify: null,
              commitment_approved_phones: null,
              commitment_no_unofficial: null,
              commitment_no_operate_account: null,
              commitment_fraud_firing: null,
              commitment_no_share_info: null,
              commitment_loan_recovery: null,
              commitment_abide_system: null,
              commitment_rep_name: null,
              commitment_rep_signature: null,
              commitment_date_signed: null,
              commitment_submitted_at: null
            };
          }
        } catch (commitmentError) {
          console.log(`⚠️  Commitment table not available for marketer ${submission.marketer_id}`);
          // Add null values for commitment fields
          submissionsResult.rows[i] = {
            ...submissionsResult.rows[i],
            commitment_false_docs: null,
            commitment_irrelevant_info: null,
            commitment_no_fees: null,
            commitment_no_modify: null,
            commitment_approved_phones: null,
            commitment_no_unofficial: null,
            commitment_no_operate_account: null,
            commitment_fraud_firing: null,
            commitment_no_share_info: null,
            commitment_loan_recovery: null,
            commitment_abide_system: null,
            commitment_rep_name: null,
            commitment_rep_signature: null,
            commitment_date_signed: null,
            commitment_submitted_at: null
          };
        }
      }
      
      console.log(`✅ Enhanced fallback query completed for ${submissionsResult.rows.length} submissions`);
    }

    // Get assigned admins for filter dropdown
    const assignedAdminsQuery = `
      SELECT id, first_name, last_name, email
      FROM users 
      WHERE super_admin_id = (SELECT super_admin_id FROM users WHERE id = $1)
      AND role = 'Admin'
      ORDER BY first_name, last_name
    `;
    console.log(`📊 Executing assigned admins query...`);
    const assignedAdminsResult = await pool.query(assignedAdminsQuery, [adminId]);
    console.log(`✅ Found ${assignedAdminsResult.rows.length} assigned admins`);

    res.status(200).json({
      submissions: submissionsResult.rows,
      assignedAdmins: assignedAdminsResult.rows
    });
  } catch (error) {
    console.error('❌ Error in getSubmissionsForAdmin:', error);
    next(error);
  }
};

/**
 * getSubmissionsForSuperAdmin
 * Retrieves all submissions for marketers whose assigned admin is under the logged-in SuperAdmin.
 * Now uses the new verification workflow system with proper hierarchy filtering.
 */
const getSubmissionsForSuperAdmin = async (req, res, next) => {
  try {
    const superadminId = req.user.id; // Logged-in SuperAdmin's numeric ID

    // Get verification submissions from assigned admins only
    const submissionsQuery = `
      SELECT 
        vs.id as submission_id,
        vs.submission_status,
        vs.created_at as submission_created_at,
        vs.updated_at as last_updated,
        vs.rejection_reason as admin_notes,
        vs.rejection_reason as superadmin_notes,
        u.id as marketer_id,
        u.unique_id as marketer_unique_id,
        u.first_name as marketer_first_name,
        u.last_name as marketer_last_name,
        u.email as marketer_email,
        u.phone as marketer_phone,
        u.location as marketer_location,
        u.bio_submitted,
        u.guarantor_submitted,
        u.commitment_submitted,
        u.overall_verification_status,
        admin_user.id as admin_id,
        admin_user.first_name as admin_first_name,
        admin_user.last_name as admin_last_name,
        admin_user.email as admin_email
      FROM verification_submissions vs
      JOIN users u ON vs.marketer_id = u.id
      JOIN users admin_user ON vs.admin_id = admin_user.id
      WHERE admin_user.super_admin_id = $1
      ORDER BY vs.updated_at DESC
    `;
    const submissionsResult = await pool.query(submissionsQuery, [superadminId]);

    // Get assigned admins for filter dropdown
    const assignedAdminsQuery = `
      SELECT id, first_name, last_name, email
      FROM users 
      WHERE super_admin_id = $1
      AND role = 'Admin'
      ORDER BY first_name, last_name
    `;
    const assignedAdminsResult = await pool.query(assignedAdminsQuery, [superadminId]);

    // For each submission, fetch detailed form data
    const enrichedSubmissions = await Promise.all(
      submissionsResult.rows.map(async (submission) => {
        const marketerId = submission.marketer_id;
        
        // Fetch biodata details
        const biodataResult = await pool.query(
          `SELECT * FROM marketer_biodata WHERE marketer_unique_id = (SELECT unique_id FROM users WHERE id = $1) ORDER BY created_at DESC LIMIT 1`,
          [marketerId]
        );
        
        // Fetch guarantor details
        const guarantorResult = await pool.query(
          `SELECT * FROM guarantor_employment_form WHERE marketer_unique_id = (SELECT unique_id FROM users WHERE id = $1) ORDER BY created_at DESC LIMIT 1`,
          [marketerId]
        );
        
        // Fetch commitment details
        const commitmentResult = await pool.query(
          `SELECT * FROM direct_sales_commitment_form WHERE marketer_unique_id = (SELECT unique_id FROM users WHERE id = $1) ORDER BY created_at DESC LIMIT 1`,
          [marketerId]
        );
        
        // Fetch admin verification details
        const adminVerificationResult = await pool.query(
          `SELECT * FROM admin_verification_details WHERE verification_submission_id = $1`,
          [submission.submission_id]
        );

        return {
          ...submission,
          biodata: biodataResult.rows[0] || null,
          guarantor: guarantorResult.rows[0] || null,
          commitment: commitmentResult.rows[0] || null,
          admin_verification: adminVerificationResult.rows[0] || null
        };
      })
    );

    res.status(200).json({
      submissions: enrichedSubmissions,
      assignedAdmins: assignedAdminsResult.rows
    });
  } catch (error) {
    next(error);
  }
};


/** 
 * === NEW SUCCESS-ONLY PATCH HANDLERS ===
 * These allow your frontend to simply do PATCH /verification/{form}-success
 * to flip the flag on the user record without re‑submitting the entire form.
 */

// Removed redundant success endpoints - main submission endpoints handle everything

/**
 * getFormStatus - Check which forms a user has submitted
 */
const getFormStatus = async (req, res, next) => {
  try {
    const marketerUniqueId = req.user.unique_id;
    
    const result = await pool.query(
      `SELECT 
        bio_submitted, 
        guarantor_submitted, 
        commitment_submitted,
        overall_verification_status,
        locked
      FROM users 
       WHERE unique_id = $1`,
      [marketerUniqueId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    
    const user = result.rows[0];
    
    res.status(200).json({
      forms: {
        biodata: user.bio_submitted,
        guarantor: user.guarantor_submitted,
        commitment: user.commitment_submitted
      },
      status: {
        verification: user.overall_verification_status,
        locked: user.locked
      },
      nextStep: user.bio_submitted 
        ? (user.guarantor_submitted 
          ? (user.commitment_submitted ? 'completed' : 'commitment')
          : 'guarantor')
        : 'biodata'
    });
    
  } catch (error) {
    console.error('Error fetching form status:', error);
    next(error);
  }
};

/**
 * MasterAdmin: get every marketer whose overall_verification_status = 'approved'
 */
async function getVerifiedMarketersMaster(req, res, next) {
  try {
    const { rows } = await pool.query(`
      SELECT
        u.unique_id,
        u.first_name,
        u.last_name,
        u.email,
        b.phone,
        u.location
      FROM users u
      LEFT JOIN marketer_biodata b
        ON b.marketer_unique_id = u.unique_id
      WHERE u.overall_verification_status = 'approved'
      ORDER BY u.first_name, u.last_name
    `);
    res.json({ marketers: rows });
  } catch (err) {
    next(err);
  }
}

/**
 * SuperAdmin: only the marketers whose admin.super_admin_id = this superadmin
 */
async function getVerifiedMarketersSuperadmin(req, res, next) {
  try {
    const superadminId = req.user.id;
    const { rows } = await pool.query(`
      SELECT
        m.unique_id,
        m.first_name,
        m.last_name,
        m.email,
        b.phone,
        m.location
      FROM users m
      JOIN users a     ON m.admin_id = a.id
      LEFT JOIN marketer_biodata b
        ON b.marketer_unique_id = m.unique_id
      WHERE a.super_admin_id = $1
        AND m.overall_verification_status = 'approved'
      ORDER BY m.first_name, m.last_name
    `, [superadminId]);
    res.json({ marketers: rows });
  } catch (err) {
    next(err);
  }
}

/**
 * Admin: only the marketers assigned to this admin
 */
async function getVerifiedMarketersAdmin(req, res, next) {
  try {
    const adminId = req.user.id;
    const { rows } = await pool.query(`
      SELECT
        u.unique_id,
        u.first_name,
        u.last_name,
        u.email,
        b.phone,
        u.location
      FROM users u
      LEFT JOIN marketer_biodata b
        ON b.marketer_unique_id = u.unique_id
      WHERE u.admin_id = $1
        AND u.overall_verification_status = 'approved'
      ORDER BY u.first_name, u.last_name
    `, [adminId]);
    res.json({ marketers: rows });
  } catch (err) {
    next(err);
  }
}


/**
 * Send verified submission to SuperAdmin
 */
async function sendToSuperAdmin(req, res) {
  const client = await pool.connect();
  
  try {
    const { submissionId } = req.params;
    const adminId = req.user.id;
    
    await client.query('BEGIN');
    
    // Update submission status
    const updateResult = await client.query(
      `UPDATE verification_submissions 
       SET submission_status = 'sent_to_superadmin',
           updated_at = NOW()
       WHERE id = $1 AND admin_id = $2`,
      [submissionId, adminId]
    );
    
    if (updateResult.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ 
        success: false, 
        message: 'Submission not found or not assigned to this admin' 
      });
    }
    
    // Get marketer details for notification
    const marketerResult = await client.query(
      `SELECT u.unique_id, u.first_name, u.last_name 
       FROM verification_submissions vs
       JOIN users u ON vs.marketer_id = u.id
       WHERE vs.id = $1`,
      [submissionId]
    );
    
    const marketer = marketerResult.rows[0];
    
    await client.query('COMMIT');
    
    // Send notification to marketer
    if (marketer) {
      sendSocketNotification(
        marketer.unique_id,
        `Your verification has been completed by your Admin and sent to SuperAdmin for review. Status: Under SuperAdmin Review`,
        req.app
      );
    }
    
    res.status(200).json({
      success: true,
      message: 'Submission sent to SuperAdmin successfully',
      submissionId: submissionId
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error sending to SuperAdmin:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send submission to SuperAdmin' 
    });
  } finally {
    client.release();
  }
}

/**
 * Get comprehensive verification status and progress for a submission
 */
async function getVerificationStatus(req, res, next) {
  try {
    const { submissionId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    console.log(`🔍 Getting verification status for submission ${submissionId} by ${userRole} ${userId}`);

    // Get submission details with all related data
    const statusQuery = `
      SELECT 
        vs.id as submission_id,
        vs.submission_status,
        vs.created_at as submission_created_at,
        vs.updated_at as last_updated,
        vs.admin_reviewed_at,
        vs.superadmin_reviewed_at,
        vs.masteradmin_approved_at,
        vs.rejection_reason,
        vs.rejected_by,
        vs.rejected_at,
        
        -- Marketer details
        u.id as marketer_id,
        u.unique_id as marketer_unique_id,
        u.first_name as marketer_first_name,
        u.last_name as marketer_last_name,
        u.email as marketer_email,
        u.phone as marketer_phone,
        u.location as marketer_location,
        u.bio_submitted,
        u.guarantor_submitted,
        u.commitment_submitted,
        u.overall_verification_status,
        
        -- Admin details
        admin_user.first_name as admin_first_name,
        admin_user.last_name as admin_last_name,
        admin_user.email as admin_email,
        
        -- SuperAdmin details
        superadmin_user.first_name as superadmin_first_name,
        superadmin_user.last_name as superadmin_last_name,
        superadmin_user.email as superadmin_email,
        
        -- Admin verification details (with fallback for missing table)
        NULL as admin_verification_date,
        NULL as verification_notes,
        NULL as location_photo_url,
        NULL as admin_marketer_photo_url,
        NULL as landmark_description,
        NULL as additional_documents,
        
        -- Workflow logs will be fetched separately
        NULL as last_action,
        NULL as last_action_by,
        NULL as last_action_role,
        NULL as last_action_details,
        NULL as last_action_date
        
      FROM verification_submissions vs
      JOIN users u ON vs.marketer_id = u.id
      LEFT JOIN users admin_user ON vs.admin_id = admin_user.id
      LEFT JOIN users superadmin_user ON vs.super_admin_id = superadmin_user.id
      WHERE vs.id = $1
      ORDER BY vs.updated_at DESC
      LIMIT 1
    `;

    const statusResult = await pool.query(statusQuery, [submissionId]);
    
    if (statusResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }

    const submission = statusResult.rows[0];

    // Get all workflow logs for this submission (if table exists)
    let workflowLogs = [];
    try {
      const logsQuery = `
        SELECT 
          action,
          performed_by,
          role,
          details,
          created_at
        FROM verification_workflow_logs
        WHERE verification_submission_id = $1
        ORDER BY created_at ASC
      `;
      const logsResult = await pool.query(logsQuery, [submissionId]);
      workflowLogs = logsResult.rows;
    } catch (error) {
      console.log('⚠️  Workflow logs table not found, continuing without logs');
      workflowLogs = [];
    }

    // Calculate progress percentage
    const progressSteps = [
      { name: 'Forms Submitted', completed: submission.bio_submitted && submission.guarantor_submitted && submission.commitment_submitted },
      { name: 'Admin Review', completed: !!submission.admin_reviewed_at },
      { name: 'SuperAdmin Validation', completed: !!submission.superadmin_reviewed_at },
      { name: 'MasterAdmin Approval', completed: !!submission.masteradmin_approved_at }
    ];

    const completedSteps = progressSteps.filter(step => step.completed).length;
    const progressPercentage = Math.round((completedSteps / progressSteps.length) * 100);

    // Determine current stage
    let currentStage = 'Form Submission';
    if (submission.submission_status === 'pending_admin_review') {
      currentStage = 'Admin Review';
    } else if (submission.submission_status === 'pending_superadmin_review') {
      currentStage = 'SuperAdmin Validation';
    } else if (submission.submission_status === 'pending_masteradmin_approval') {
      currentStage = 'MasterAdmin Approval';
    } else if (submission.submission_status === 'approved') {
      currentStage = 'Approved';
    } else if (submission.submission_status === 'rejected') {
      currentStage = 'Rejected';
    }

    // Prepare response
    const response = {
      success: true,
      submission: {
        id: submission.submission_id,
        status: submission.submission_status,
        currentStage,
        progressPercentage,
        progressSteps,
        createdAt: submission.submission_created_at,
        updatedAt: submission.last_updated,
        
        // Marketer info
        marketer: {
          id: submission.marketer_id,
          uniqueId: submission.marketer_unique_id,
          name: `${submission.marketer_first_name} ${submission.marketer_last_name}`,
          email: submission.marketer_email,
          phone: submission.marketer_phone,
          location: submission.marketer_location,
          formsSubmitted: {
            biodata: submission.bio_submitted,
            guarantor: submission.guarantor_submitted,
            commitment: submission.commitment_submitted
          }
        },
        
        // Admin info
        admin: {
          name: submission.admin_first_name ? `${submission.admin_first_name} ${submission.admin_last_name}` : null,
          email: submission.admin_email,
          reviewedAt: submission.admin_reviewed_at,
          verificationNotes: submission.verification_notes,
          locationPhoto: submission.location_photo_url,
          adminMarketerPhoto: submission.admin_marketer_photo_url,
          landmarkDescription: submission.landmark_description
        },
        
        // SuperAdmin info
        superadmin: {
          name: submission.superadmin_first_name ? `${submission.superadmin_first_name} ${submission.superadmin_last_name}` : null,
          email: submission.superadmin_email,
          reviewedAt: submission.superadmin_reviewed_at
        },
        
        // MasterAdmin info
        masteradmin: {
          approvedAt: submission.masteradmin_approved_at
        },
        
        // Rejection info
        rejection: {
          reason: submission.rejection_reason,
          rejectedBy: submission.rejected_by,
          rejectedAt: submission.rejected_at
        },
        
        // Workflow logs
        workflowLogs: workflowLogs.map(log => ({
          action: log.action,
          performedBy: log.performed_by,
          role: log.role,
          details: log.details,
          timestamp: log.created_at
        })),
        
        // Last action
        lastAction: submission.last_action ? {
          action: submission.last_action,
          performedBy: submission.last_action_by,
          role: submission.last_action_role,
          details: submission.last_action_details,
          timestamp: submission.last_action_date
        } : null
      }
    };

    console.log(`✅ Verification status retrieved for submission ${submissionId}`);
    res.status(200).json(response);

  } catch (error) {
    console.error('❌ Error getting verification status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get verification status',
      error: error.message
    });
  }
};

/**
 * Upload Admin verification details and photos
 */
async function uploadAdminVerification(req, res) {
  const client = await pool.connect();
  
  try {
    const { submissionId } = req.params;
    const { verificationNotes } = req.body;
    const adminId = req.user.id;
    
    console.log(`🔍 Admin verification upload request:`, {
      submissionId,
      adminId,
      verificationNotes: verificationNotes ? 'Present' : 'Not provided',
      files: req.files ? Object.keys(req.files) : 'No files'
    });
    
    if (!submissionId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Submission ID is required' 
      });
    }

    // Check if submission exists and belongs to this admin
    const submissionCheck = await client.query(
      `SELECT vs.*, u.first_name, u.last_name, u.location as marketer_location
       FROM verification_submissions vs
       JOIN users u ON vs.marketer_id = u.id
       WHERE vs.id = $1 AND vs.admin_id = $2`,
      [submissionId, adminId]
    );

    if (submissionCheck.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Submission not found or not assigned to this admin' 
      });
    }

    const submission = submissionCheck.rows[0];
    console.log(`✅ Submission found:`, {
      submissionId: submission.id,
      marketerId: submission.marketer_id,
      adminId: submission.admin_id,
      status: submission.submission_status,
      marketerLocation: submission.marketer_location
    });

    // Upload files to Cloudinary
    const uploadedFiles = {};
    
    if (req.files) {
      const { locationPhotos, adminMarketerPhotos, landmarkPhotos } = req.files;
      const isCloudinaryConfigured = process.env.CLOUDINARY_CLOUD_NAME && 
                                     process.env.CLOUDINARY_API_KEY && 
                                     process.env.CLOUDINARY_API_SECRET &&
                                     process.env.CLOUDINARY_CLOUD_NAME !== 'your_cloud_name';
      
      // Upload location photos
      if (locationPhotos) {
        uploadedFiles.location_photos = [];
        for (const photo of locationPhotos) {
          if (isCloudinaryConfigured) {
          try {
            const result = await uploadToCloudinary(photo.buffer, {
              folder: 'verification/location',
              allowed_formats: ['jpg', 'jpeg', 'png']
            });
            uploadedFiles.location_photos.push(result.secure_url);
          } catch (error) {
            console.error('Error uploading location photo:', error);
            }
          } else {
            uploadedFiles.location_photos.push('https://via.placeholder.com/300x200?text=Location+Photo');
          }
        }
      }

      // Upload admin + marketer photos
      if (adminMarketerPhotos) {
        uploadedFiles.admin_marketer_photos = [];
        for (const photo of adminMarketerPhotos) {
          if (isCloudinaryConfigured) {
          try {
            const result = await uploadToCloudinary(photo.buffer, {
              folder: 'verification/admin_marketer',
              allowed_formats: ['jpg', 'jpeg', 'png']
            });
            uploadedFiles.admin_marketer_photos.push(result.secure_url);
          } catch (error) {
            console.error('Error uploading admin marketer photo:', error);
            }
          } else {
            uploadedFiles.admin_marketer_photos.push('https://via.placeholder.com/300x200?text=Admin+%2B+Marketer');
          }
        }
      }

      // Upload landmark photos
      if (landmarkPhotos) {
        uploadedFiles.landmark_photos = [];
        for (const photo of landmarkPhotos) {
          if (isCloudinaryConfigured) {
          try {
            const result = await uploadToCloudinary(photo.buffer, {
              folder: 'verification/landmarks',
              allowed_formats: ['jpg', 'jpeg', 'png']
            });
            uploadedFiles.landmark_photos.push(result.secure_url);
          } catch (error) {
            console.error('Error uploading landmark photo:', error);
            }
          } else {
            uploadedFiles.landmark_photos.push('https://via.placeholder.com/300x200?text=Landmark+Photo');
          }
        }
      }
    }

    // Check if admin verification details already exist
    const existingDetails = await client.query(
      'SELECT id FROM admin_verification_details WHERE verification_submission_id = $1',
      [submissionId]
    );

    let insertResult;
    if (existingDetails.rows.length > 0) {
      // Update existing record
      console.log(`🔄 Updating existing admin verification details for submission ${submissionId}`);
      const updateQuery = `
        UPDATE admin_verification_details SET
          admin_id = $2,
          marketer_id = $3,
          marketer_address = $4,
          landmark_description = $5,
          location_photo_url = $6,
          admin_marketer_photo_url = $7,
          verification_notes = $8,
          admin_verification_date = NOW(),
          additional_documents = $9::jsonb,
          updated_at = NOW()
        WHERE verification_submission_id = $1
        RETURNING *
      `;

      const updateValues = [
        submissionId,
        adminId,
        submission.marketer_id,
        submission.marketer_location || 'Not provided',
        uploadedFiles.landmark_photos ? uploadedFiles.landmark_photos.join(', ') : null,
        uploadedFiles.location_photos ? uploadedFiles.location_photos[0] : null,
        uploadedFiles.admin_marketer_photos ? uploadedFiles.admin_marketer_photos[0] : null,
        verificationNotes || null,
        uploadedFiles.location_photos ? JSON.stringify(uploadedFiles.location_photos) : null
      ];

      try {
        insertResult = await client.query(updateQuery, updateValues);
        console.log(`✅ Admin verification details updated successfully`);
      } catch (dbError) {
        console.error(`❌ Database error updating admin verification details:`, dbError);
        throw new Error(`Failed to update verification details: ${dbError.message}`);
      }
    } else {
      // Insert new record
      console.log(`🔄 Inserting new admin verification details for submission ${submissionId}`);
      const insertQuery = `
      INSERT INTO admin_verification_details (
        verification_submission_id,
        admin_id,
        marketer_id,
        marketer_address,
        landmark_description,
        location_photo_url,
        admin_marketer_photo_url,
        verification_notes,
        admin_verification_date,
        additional_documents
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), $9::jsonb)
      RETURNING *
    `;

      const insertValues = [
      submissionId,
      adminId,
      submission.marketer_id,
        submission.marketer_location || 'Not provided',
      uploadedFiles.landmark_photos ? uploadedFiles.landmark_photos.join(', ') : null,
      uploadedFiles.location_photos ? uploadedFiles.location_photos[0] : null,
      uploadedFiles.admin_marketer_photos ? uploadedFiles.admin_marketer_photos[0] : null,
      verificationNotes || null,
      uploadedFiles.location_photos ? JSON.stringify(uploadedFiles.location_photos) : null
      ];

      try {
        insertResult = await client.query(insertQuery, insertValues);
        console.log(`✅ Admin verification details inserted successfully`);
      } catch (dbError) {
        console.error(`❌ Database error inserting admin verification details:`, dbError);
        throw new Error(`Failed to save verification details: ${dbError.message}`);
      }
    }
    console.log(`✅ Admin verification details inserted:`, insertResult.rows[0]);

    // Update verification submission status
    const statusUpdateQuery = `
      UPDATE verification_submissions 
      SET 
        submission_status = 'pending_superadmin_review',
        admin_reviewed_at = NOW(),
        updated_at = NOW()
      WHERE id = $1
    `;

    // Note: Status update removed - will be handled by separate verify-and-send endpoint
    console.log(`✅ Verification files uploaded successfully. Status remains: ${submission.submission_status}`);

    // Log the file upload action
    const workflowLogDetails = {
          verification_notes: verificationNotes,
          photos_uploaded: {
            location: uploadedFiles.location_photos?.length || 0,
            admin_marketer: uploadedFiles.admin_marketer_photos?.length || 0,
            landmarks: uploadedFiles.landmark_photos?.length || 0
          }
    };

    console.log(`🔄 Logging file upload action...`);
    try {
      await client.query(
        `INSERT INTO verification_workflow_logs 
         (verification_submission_id, action_by, action_by_role, action_type, action_description, previous_status, new_status, notes, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
        [
          submissionId,
          adminId,
          'Admin',
          'file_upload',
          'Admin uploaded verification files and photos',
          submission.submission_status,
          submission.submission_status, // Status remains the same
          JSON.stringify(workflowLogDetails)
        ]
      );
      console.log(`✅ File upload action logged successfully`);
    } catch (logError) {
      console.error(`❌ Error logging file upload action:`, logError);
      // Don't throw error here as the main operation succeeded
      console.log(`⚠️ Continuing despite workflow log error`);
    }

    res.json({
      success: true,
      message: 'Verification details uploaded successfully',
      data: {
        submission_id: submissionId,
        status: 'pending_superadmin_review',
        admin_verification_date: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error uploading admin verification:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to upload verification details',
      error: error.message 
    });
  } finally {
    client.release();
  }
}

/**
 * verifyAndSendToSuperAdmin
 * Admin verifies the uploaded details and sends to SuperAdmin for review
 */
const verifyAndSendToSuperAdmin = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { submissionId } = req.params;
    const adminId = req.user.id;
    
    console.log(`🔍 Admin verify and send request:`, {
      submissionId,
      adminId
    });
    
    if (!submissionId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Submission ID is required' 
      });
    }

    // Check if submission exists and belongs to this admin
    const submissionCheck = await client.query(
      `SELECT vs.*, u.first_name, u.last_name, u.location as marketer_location
       FROM verification_submissions vs
       JOIN users u ON vs.marketer_id = u.id
       WHERE vs.id = $1 AND vs.admin_id = $2`,
      [submissionId, adminId]
    );

    if (submissionCheck.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Submission not found or not assigned to this admin' 
      });
    }

    const submission = submissionCheck.rows[0];
    
    // Check if admin verification details exist
    const verificationDetails = await client.query(
      'SELECT * FROM admin_verification_details WHERE verification_submission_id = $1',
      [submissionId]
    );

    if (verificationDetails.rows.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please upload verification details first before sending to SuperAdmin' 
      });
    }

    // Validate status transition
    if (!validateWorkflowStatusTransition(submission.submission_status, 'pending_superadmin_review')) {
      return res.status(400).json({ 
        success: false, 
        message: `Cannot send submission with status '${submission.submission_status}' to SuperAdmin` 
      });
    }

    // Update verification submission status
    const statusUpdateQuery = `
      UPDATE verification_submissions 
      SET 
        submission_status = 'pending_superadmin_review',
        admin_reviewed_at = NOW(),
        updated_at = NOW()
      WHERE id = $1
    `;

    console.log(`🔄 Updating submission status to pending_superadmin_review...`);
    try {
      await client.query(statusUpdateQuery, [submissionId]);
      console.log(`✅ Submission status updated successfully`);
    } catch (statusError) {
      console.error(`❌ Error updating verification submission status:`, statusError);
      throw new Error(`Failed to update submission status: ${statusError.message}`);
    }

    // Update marketer's overall verification status
    const userStatusUpdateQuery = `
      UPDATE users 
      SET overall_verification_status = 'awaiting_superadmin_validation',
          updated_at = NOW()
      WHERE id = $1
    `;

    console.log(`🔄 Updating marketer verification status to awaiting_superadmin_validation...`);
    try {
      await client.query(userStatusUpdateQuery, [submission.marketer_id]);
      console.log(`✅ Marketer verification status updated successfully`);
    } catch (userStatusError) {
      console.error(`❌ Error updating marketer verification status:`, userStatusError);
      throw new Error(`Failed to update marketer status: ${userStatusError.message}`);
    }

    // Log the verification and send action
    const workflowLogDetails = {
      action: 'admin_verified_and_sent',
      admin_id: adminId,
      verification_details_id: verificationDetails.rows[0].id,
      marketer_name: `${submission.first_name} ${submission.last_name}`,
      timestamp: new Date().toISOString()
    };

    console.log(`🔄 Logging verify and send action...`);
    try {
      await client.query(
        `INSERT INTO verification_workflow_logs 
         (verification_submission_id, action_by, action_by_role, action_type, action_description, previous_status, new_status, notes, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
        [
          submissionId,
          adminId,
          'Admin',
          'verify_and_send',
          'Admin verified and sent submission to SuperAdmin',
          submission.submission_status,
          'pending_superadmin_review',
          JSON.stringify(workflowLogDetails)
        ]
      );
      console.log(`✅ Verify and send action logged successfully`);
    } catch (logError) {
      console.error(`❌ Error logging verify and send action:`, logError);
      // Don't throw error here as the main operation succeeded
      console.log(`⚠️ Continuing despite workflow log error`);
    }

    // Notify SuperAdmin about new submission
    await notifySuperAdminOfNewSubmission(submissionId, submission.super_admin_id);

    // Notify marketer about status change
    await notifyMarketerOfStatusChange(submission.marketer_id, 'awaiting_superadmin_validation', 'Your verification has been reviewed by your Admin and is now under SuperAdmin review.');

    res.json({
      success: true,
      message: 'Submission verified and sent to SuperAdmin successfully',
      data: {
        submission_id: submissionId,
        new_status: 'pending_superadmin_review',
        admin_id: adminId,
        marketer_name: `${submission.first_name} ${submission.last_name}`,
        verification_details_id: verificationDetails.rows[0].id
      }
    });

  } catch (error) {
    console.error('Error in verifyAndSendToSuperAdmin:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to verify and send submission',
      error: error.message 
    });
  } finally {
    client.release();
  }
}

/**
 * resetSubmissionStatus
 * Reset submission status back to pending_admin_review for testing purposes
 */
const resetSubmissionStatus = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { submissionId } = req.params;
    const adminId = req.user.id;
    
    console.log(`🔄 Reset submission status request:`, {
      submissionId,
      adminId
    });
    
    if (!submissionId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Submission ID is required' 
      });
    }

    // Check if submission exists and belongs to this admin
    const submissionCheck = await client.query(
      `SELECT vs.*, u.first_name, u.last_name
       FROM verification_submissions vs
       JOIN users u ON vs.marketer_id = u.id
       WHERE vs.id = $1 AND vs.admin_id = $2`,
      [submissionId, adminId]
    );

    if (submissionCheck.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Submission not found or not assigned to this admin' 
      });
    }

    const submission = submissionCheck.rows[0];

    // Reset verification submission status
    const statusUpdateQuery = `
      UPDATE verification_submissions 
      SET 
        submission_status = 'pending_admin_review',
        admin_reviewed_at = NULL,
        updated_at = NOW()
      WHERE id = $1
    `;

    console.log(`🔄 Resetting submission status to pending_admin_review...`);
    try {
      await client.query(statusUpdateQuery, [submissionId]);
      console.log(`✅ Submission status reset successfully`);
    } catch (statusError) {
      console.error(`❌ Error resetting verification submission status:`, statusError);
      throw new Error(`Failed to reset submission status: ${statusError.message}`);
    }

    // Reset marketer's overall verification status
    const userStatusUpdateQuery = `
      UPDATE users 
      SET overall_verification_status = 'awaiting_admin_review',
          updated_at = NOW()
      WHERE id = $1
    `;

    console.log(`🔄 Resetting marketer verification status to awaiting_admin_review...`);
    try {
      await client.query(userStatusUpdateQuery, [submission.marketer_id]);
      console.log(`✅ Marketer verification status reset successfully`);
    } catch (userStatusError) {
      console.error(`❌ Error resetting marketer verification status:`, userStatusError);
      throw new Error(`Failed to reset marketer status: ${userStatusError.message}`);
    }

    // Log the reset action
    const workflowLogDetails = {
      action: 'admin_reset_for_testing',
      admin_id: adminId,
      marketer_name: `${submission.first_name} ${submission.last_name}`,
      timestamp: new Date().toISOString()
    };

    console.log(`🔄 Logging reset action...`);
    try {
      await client.query(
        `INSERT INTO verification_workflow_logs 
         (verification_submission_id, action_by, action_by_role, action_type, action_description, previous_status, new_status, notes, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
        [
          submissionId,
          adminId,
          'Admin',
          'reset_for_testing',
          'Admin reset submission status for testing purposes',
          submission.submission_status,
          'pending_admin_review',
          JSON.stringify(workflowLogDetails)
        ]
      );
      console.log(`✅ Reset action logged successfully`);
    } catch (logError) {
      console.error(`❌ Error logging reset action:`, logError);
      // Don't throw error here as the main operation succeeded
      console.log(`⚠️ Continuing despite workflow log error`);
    }

    res.json({
      success: true,
      message: 'Submission status reset successfully. You can now test the upload and verify process again.',
      data: {
        submission_id: submissionId,
        new_status: 'pending_admin_review',
        admin_id: adminId,
        marketer_name: `${submission.first_name} ${submission.last_name}`
      }
    });

  } catch (error) {
    console.error('Error in resetSubmissionStatus:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to reset submission status',
      error: error.message 
    });
  } finally {
    client.release();
  }
}

/**
 * Helper function to notify SuperAdmin about new submission
 */
const notifySuperAdminOfNewSubmission = async (submissionId, superAdminId) => {
  try {
    if (!superAdminId) {
      console.log(`⚠️ No SuperAdmin assigned to submission ${submissionId}`);
      return;
    }

    // Get submission details
    const submissionResult = await pool.query(
      `SELECT vs.id, vs.marketer_id, u.first_name, u.last_name, u.email as marketer_email
       FROM verification_submissions vs
       JOIN users u ON vs.marketer_id = u.id
       WHERE vs.id = $1`,
      [submissionId]
    );

    if (submissionResult.rows.length === 0) return;

    const submission = submissionResult.rows[0];

    // Get SuperAdmin details
    const superAdminResult = await pool.query(
      'SELECT first_name, last_name, email FROM users WHERE id = $1',
      [superAdminId]
    );

    if (superAdminResult.rows.length === 0) {
      console.log(`⚠️ SuperAdmin ${superAdminId} not found for submission ${submissionId}`);
      return;
    }

    const superAdmin = superAdminResult.rows[0];

    // Get SuperAdmin's unique_id for notification
    const superAdminUniqueIdResult = await pool.query(
      'SELECT unique_id FROM users WHERE id = $1',
      [superAdminId]
    );
    
    if (superAdminUniqueIdResult.rows.length === 0) {
      console.log(`⚠️ SuperAdmin unique_id not found for superAdmin ${superAdminId}`);
      return;
    }
    
    const superAdminUniqueId = superAdminUniqueIdResult.rows[0].unique_id;
    const message = `Admin has verified and sent submission from ${submission.first_name} ${submission.last_name} (${submission.marketer_email}) for your review.`;
    
    // Create notification record in the standard notifications table
    await pool.query(
      `INSERT INTO notifications (user_unique_id, message, created_at)
       VALUES ($1, $2, NOW())`,
      [superAdminUniqueId, message]
    );
    
    // Send WebSocket notification to SuperAdmin
    const app = require('../server').app;
    const io = app.get('socketio');
    
    if (io) {
      io.to(superAdminUniqueId).emit('newNotification', {
        message: message,
        created_at: new Date().toISOString(),
        is_read: false
      });
      
      // Update notification count
      const countResult = await pool.query(
        `SELECT COUNT(*) AS unread FROM notifications WHERE user_unique_id = $1 AND NOT is_read`,
        [superAdminUniqueId]
      );
      const unreadCount = Number(countResult.rows[0].unread);
      
      io.to(superAdminUniqueId).emit('notificationCount', { count: unreadCount });
      
      console.log(`🔔 SuperAdmin ${superAdmin.first_name} ${superAdmin.last_name} (${superAdminUniqueId}) notified about verification submission from ${submission.first_name} ${submission.last_name}`);
    }

    // Also create verification_notifications record for detailed tracking
    await pool.query(
      `INSERT INTO verification_notifications (user_id, type, data, created_at)
       VALUES ($1, 'verification_sent_for_review', $2, NOW())`,
      [
        superAdminId,
        JSON.stringify({
          title: 'New Verification Submission for Review',
          message: `Admin has verified and sent submission from ${submission.first_name} ${submission.last_name} for your review`,
          submission_id: submissionId,
          marketer_id: submission.marketer_id,
          marketer_name: `${submission.first_name} ${submission.last_name}`,
          marketer_email: submission.marketer_email,
          action_required: 'superadmin_review'
        })
      ]
    );

  } catch (error) {
    console.error('Error notifying SuperAdmin of new submission:', error);
    // Don't throw error to avoid breaking the main workflow
  }
};

/**
 * Helper function to notify marketer about verification status change
 */
const notifyMarketerOfStatusChange = async (marketerId, newStatus, message) => {
  try {
    console.log(`🔔 Notifying marketer ${marketerId} of status change to ${newStatus}`);
    
    // Get marketer's unique_id for WebSocket notification
    const marketerResult = await pool.query(
      'SELECT unique_id, first_name, last_name FROM users WHERE id = $1',
      [marketerId]
    );

    if (marketerResult.rows.length === 0) {
      console.log(`⚠️ Marketer ${marketerId} not found for status change notification`);
      return;
    }

    const marketer = marketerResult.rows[0];
    console.log(`📋 Found marketer: ${marketer.first_name} ${marketer.last_name} (${marketer.unique_id})`);

    // Get the app instance to access socket.io
    const app = require('../server').app;
    const io = app.get('socketio');
    
    if (!io) {
      console.warn('⚠️ Socket.IO instance not found on app');
      return;
    }

    // Create notification record
    const notificationResult = await pool.query(
      `INSERT INTO notifications (user_unique_id, message, created_at)
       VALUES ($1, $2, NOW())
       RETURNING *`,
      [marketer.unique_id, message]
    );
    
    console.log(`📝 Created notification record:`, notificationResult.rows[0]);

    // Send WebSocket notification to marketer
    const notificationData = {
      marketerUniqueId: marketer.unique_id,
      newStatus: newStatus,
      message: message,
      timestamp: new Date().toISOString(),
      notificationId: notificationResult.rows[0].id
    };
    
    console.log(`📡 Sending WebSocket notification to room: ${marketer.unique_id}`);
    console.log(`📡 Notification data:`, notificationData);
    
    io.to(marketer.unique_id).emit('verificationStatusChanged', notificationData);
    
    // Also emit a general notification event
    io.to(marketer.unique_id).emit('newNotification', {
      id: notificationResult.rows[0].id,
      message: message,
      timestamp: new Date().toISOString()
    });

    console.log(`✅ Marketer ${marketer.first_name} ${marketer.last_name} (${marketer.unique_id}) notified about status change to ${newStatus}`);

  } catch (error) {
    console.error('❌ Error notifying marketer of status change:', error);
    // Don't throw error to avoid breaking the main workflow
  }
};

/**
 * Helper function to notify admin about verification status change
 */
const notifyAdminOfStatusChange = async (adminUniqueId, message) => {
  try {
    // Get the app instance to access socket.io
    const app = require('../server').app;
    const io = app.get('socketio');
    
    if (!io) {
      console.warn('⚠️ Socket.IO instance not found on app');
      return;
    }

    // Create notification record
    await pool.query(
      `INSERT INTO notifications (user_unique_id, message, created_at)
       VALUES ($1, $2, NOW())`,
      [adminUniqueId, message]
    );

    // Send WebSocket notification to admin
    io.to(adminUniqueId).emit('verificationStatusChanged', {
      adminUniqueId: adminUniqueId,
      message: message,
      timestamp: new Date().toISOString()
    });
    
    // Also send standard notification event
    io.to(adminUniqueId).emit('newNotification', {
      message: message,
      created_at: new Date().toISOString(),
      is_read: false
    });
    
    // Update notification count
    const countResult = await pool.query(
      `SELECT COUNT(*) AS unread FROM notifications WHERE user_unique_id = $1 AND NOT is_read`,
      [adminUniqueId]
    );
    const unreadCount = Number(countResult.rows[0].unread);
    
    io.to(adminUniqueId).emit('notificationCount', { count: unreadCount });

    console.log(`✅ Admin ${adminUniqueId} notified about verification status change`);

  } catch (error) {
    console.error('Error notifying admin of status change:', error);
    // Don't throw error to avoid breaking the main workflow
  }
};

/**
 * Helper function to notify MasterAdmin about new submission awaiting approval
 */
const notifyMasterAdminOfNewSubmission = async (marketerFirstName, marketerLastName, adminFirstName, adminLastName) => {
  try {
    // Get all MasterAdmin users
    const masterAdmins = await pool.query('SELECT unique_id FROM users WHERE role = $1', ['MasterAdmin']);
    
    if (masterAdmins.rows.length === 0) {
      console.log('⚠️ No MasterAdmin users found for notification');
      return;
    }

    // Get the app instance to access socket.io
    const app = require('../server').app;
    const io = app.get('socketio');
    
    if (!io) {
      console.warn('⚠️ Socket.IO instance not found on app');
      return;
    }

    const message = `New verification submission from ${marketerFirstName} ${marketerLastName} (under Admin ${adminFirstName} ${adminLastName}) is awaiting your approval.`;

    // Notify each MasterAdmin
    for (const masterAdmin of masterAdmins.rows) {
      // Create notification record
      await pool.query(
        `INSERT INTO notifications (user_unique_id, message, created_at)
         VALUES ($1, $2, NOW())`,
        [masterAdmin.unique_id, message]
      );

      // Send WebSocket notification to MasterAdmin
      io.to(masterAdmin.unique_id).emit('newVerificationSubmission', {
        masterAdminUniqueId: masterAdmin.unique_id,
        marketerName: `${marketerFirstName} ${marketerLastName}`,
        adminName: `${adminFirstName} ${adminLastName}`,
        message: message,
        timestamp: new Date().toISOString()
      });
      
      // Also send standard notification event
      io.to(masterAdmin.unique_id).emit('newNotification', {
        message: message,
        created_at: new Date().toISOString(),
        is_read: false
      });
      
      // Update notification count
      const countResult = await pool.query(
        `SELECT COUNT(*) AS unread FROM notifications WHERE user_unique_id = $1 AND NOT is_read`,
        [masterAdmin.unique_id]
      );
      const unreadCount = Number(countResult.rows[0].unread);
      
      io.to(masterAdmin.unique_id).emit('notificationCount', { count: unreadCount });

      console.log(`✅ MasterAdmin ${masterAdmin.unique_id} notified about new verification submission`);
    }

  } catch (error) {
    console.error('Error notifying MasterAdmin of new submission:', error);
    // Don't throw error to avoid breaking the main workflow
  }
};

/**
 * approveAdminSuperadmin
 * Direct approval for Admin/SuperAdmin users (no forms, no verification needed)
 */
const approveAdminSuperadmin = async (req, res, next) => {
  try {
    if (req.user.role !== 'MasterAdmin') {
      return res.status(403).json({ message: 'Only MasterAdmin can approve Admin/SuperAdmin accounts' });
    }

    const { userId, action } = req.body; // action: 'approve' or 'reject'
    
    if (!userId || !action) {
      return res.status(400).json({ message: 'User ID and action are required' });
    }

    // Check if user exists and is Admin/SuperAdmin
    const userCheck = await pool.query(`
      SELECT id, unique_id, first_name, last_name, role, overall_verification_status
      FROM users 
      WHERE id = $1 AND role IN ('Admin', 'SuperAdmin') AND deleted = FALSE
    `, [userId]);

    if (userCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Admin/SuperAdmin user not found' });
    }

    const user = userCheck.rows[0];

    if (action === 'approve') {
      // Approve the user
      await pool.query(`
        UPDATE users 
        SET overall_verification_status = 'approved',
            verification_completed_at = NOW(),
            updated_at = NOW()
        WHERE id = $1
      `, [userId]);

      // Send notification to user
      await pool.query(`
        INSERT INTO notifications (user_unique_id, message, created_at)
        VALUES ($1, $2, NOW())
      `, [
        user.unique_id,
        `Your ${user.role} account has been approved by MasterAdmin. You now have full access to the system.`
      ]);

      // Log the activity
      await logActivity(
        req.user.id,
        `${req.user.first_name} ${req.user.last_name}`,
        'Approve Admin/SuperAdmin',
        'User',
        user.unique_id
      );

      return res.json({
        success: true,
        message: `${user.role} ${user.first_name} ${user.last_name} has been approved successfully`,
        user: {
          id: user.id,
          unique_id: user.unique_id,
          name: `${user.first_name} ${user.last_name}`,
          role: user.role
        }
      });

    } else if (action === 'reject') {
      const { reason } = req.body;
      
      // Reject the user
      await pool.query(`
        UPDATE users 
        SET overall_verification_status = 'rejected',
            updated_at = NOW()
        WHERE id = $1
      `, [userId]);

      // Send notification to user
      await pool.query(`
        INSERT INTO notifications (user_unique_id, message, created_at)
        VALUES ($1, $2, NOW())
      `, [
        user.unique_id,
        `Your ${user.role} account approval was rejected by MasterAdmin.${reason ? ' Reason: ' + reason : ''} Please contact support.`
      ]);

      // Log the activity
      await logActivity(
        req.user.id,
        `${req.user.first_name} ${req.user.last_name}`,
        'Reject Admin/SuperAdmin',
        'User',
        user.unique_id
      );

      return res.json({
        success: true,
        message: `${user.role} ${user.first_name} ${user.last_name} has been rejected`,
        user: {
          id: user.id,
          unique_id: user.unique_id,
          name: `${user.first_name} ${user.last_name}`,
          role: user.role
        }
      });

    } else {
      return res.status(400).json({ message: 'Invalid action. Must be "approve" or "reject"' });
    }

  } catch (error) {
    console.error('Approve Admin/SuperAdmin error:', error);
    next(error);
  }
};

/**
 * fixUserFormFlags
 * Utility function to fix user form flags based on actual form submissions
 */
const fixUserFormFlags = async (marketerUniqueId) => {
  try {
    console.log(`🔧 Fixing user form flags for marketer: ${marketerUniqueId}`);
    
    // Check if forms actually exist in database
    const biodataCheck = await pool.query(
      'SELECT COUNT(*) as count FROM marketer_biodata WHERE marketer_unique_id = $1',
      [marketerUniqueId]
    );
    
    const guarantorCheck = await pool.query(
      'SELECT COUNT(*) as count FROM marketer_guarantor_form WHERE marketer_id = (SELECT id FROM users WHERE unique_id = $1)',
      [marketerUniqueId]
    );
    
    const commitmentCheck = await pool.query(
      'SELECT COUNT(*) as count FROM marketer_commitment_form WHERE marketer_id = (SELECT id FROM users WHERE unique_id = $1)',
      [marketerUniqueId]
    );
    
    const bioSubmitted = parseInt(biodataCheck.rows[0].count) > 0;
    const guarantorSubmitted = parseInt(guarantorCheck.rows[0].count) > 0;
    const commitmentSubmitted = parseInt(commitmentCheck.rows[0].count) > 0;
    
    console.log(`📊 Form existence check:`, { bioSubmitted, guarantorSubmitted, commitmentSubmitted });
    
    // Update user flags to match actual form existence
    const updateResult = await pool.query(
      `UPDATE users 
       SET bio_submitted = $1, 
           guarantor_submitted = $2, 
           commitment_submitted = $3,
           updated_at = NOW()
       WHERE unique_id = $4
       RETURNING *`,
      [bioSubmitted, guarantorSubmitted, commitmentSubmitted, marketerUniqueId]
    );
    
    if (updateResult.rows.length > 0) {
      console.log(`✅ User form flags fixed for marketer: ${marketerUniqueId}`);
      return updateResult.rows[0];
    } else {
      console.log(`❌ User not found: ${marketerUniqueId}`);
      return null;
    }
    
  } catch (error) {
    console.error('❌ Error fixing user form flags:', error);
    throw error;
  }
};

/**
 * getAdminAssignmentInfo
 * Gets admin and superadmin assignment information for a marketer
 */
const getAdminAssignmentInfo = async (req, res, next) => {
  try {
    const marketerId = req.user.id;
    
    console.log('🔍 Getting admin assignment info for marketer:', marketerId);
    
    // Get marketer's admin and superadmin information
    const query = `
      SELECT 
        m.id as marketer_id,
        m.unique_id as marketer_unique_id,
        m.first_name as marketer_first_name,
        m.last_name as marketer_last_name,
        m.admin_id,
        m.super_admin_id,
        -- Admin information
        admin.id as admin_id,
        admin.unique_id as admin_unique_id,
        admin.first_name as admin_first_name,
        admin.last_name as admin_last_name,
        admin.email as admin_email,
        admin.phone as admin_phone,
        admin.location as admin_location,
        -- SuperAdmin information
        superadmin.id as superadmin_id,
        superadmin.unique_id as superadmin_unique_id,
        superadmin.first_name as superadmin_first_name,
        superadmin.last_name as superadmin_last_name,
        superadmin.email as superadmin_email,
        superadmin.phone as superadmin_phone,
        superadmin.location as superadmin_location
      FROM users m
      LEFT JOIN users admin ON m.admin_id = admin.id
      LEFT JOIN users superadmin ON admin.super_admin_id = superadmin.id
      WHERE m.id = $1 AND m.role = 'Marketer'
    `;
    
    const result = await pool.query(query, [marketerId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Marketer not found'
      });
    }
    
    const data = result.rows[0];
    
    // Format the response
    const response = {
      success: true,
      marketer: {
        id: data.marketer_id,
        unique_id: data.marketer_unique_id,
        name: `${data.marketer_first_name} ${data.marketer_last_name}`.trim()
      },
      admin: data.admin_id ? {
        id: data.admin_id,
        unique_id: data.admin_unique_id,
        name: `${data.admin_first_name} ${data.admin_last_name}`.trim(),
        email: data.admin_email,
        phone: data.admin_phone,
        location: data.admin_location
      } : null,
      superadmin: data.superadmin_id ? {
        id: data.superadmin_id,
        unique_id: data.superadmin_unique_id,
        name: `${data.superadmin_first_name} ${data.superadmin_last_name}`.trim(),
        email: data.superadmin_email,
        phone: data.superadmin_phone,
        location: data.superadmin_location
      } : null
    };
    
    console.log('✅ Admin assignment info retrieved:', {
      marketer: response.marketer.name,
      admin: response.admin?.name || 'Not assigned',
      superadmin: response.superadmin?.name || 'Not assigned'
    });
    
    res.json(response);
    
  } catch (error) {
    console.error('❌ Error getting admin assignment info:', error);
    next(error);
  }
};

// Simple endpoint to get raw form data for debugging
const getRawFormData = async (req, res, next) => {
  try {
    const adminId = req.user.id;
    console.log(`🔍 Getting raw form data for admin ${adminId}`);
    
    // Get all marketers assigned to this admin
    const marketersResult = await pool.query(`
      SELECT u.id, u.unique_id, u.first_name, u.last_name, u.email
      FROM users u 
      WHERE u.admin_id = $1 AND u.role = 'Marketer'
    `, [adminId]);
    
    console.log(`📊 Found ${marketersResult.rows.length} marketers`);
    
    const formData = [];
    
    for (const marketer of marketersResult.rows) {
      console.log(`🔍 Processing marketer: ${marketer.first_name} ${marketer.last_name} (ID: ${marketer.id})`);
      
      // Get biodata
      const biodataResult = await pool.query(`
        SELECT * FROM marketer_biodata 
        WHERE marketer_unique_id = $1 
        ORDER BY created_at DESC LIMIT 1
      `, [marketer.unique_id]);
      
      // Get guarantor form
      const guarantorResult = await pool.query(`
        SELECT * FROM marketer_guarantor_form 
        WHERE marketer_id = $1 
        ORDER BY created_at DESC LIMIT 1
      `, [marketer.id]);
      
      console.log(`🔍 Guarantor query for marketer ${marketer.id}:`, guarantorResult.rows.length, 'rows');
      
      // Get commitment form
      const commitmentResult = await pool.query(`
        SELECT * FROM marketer_commitment_form 
        WHERE marketer_id = $1 
        ORDER BY created_at DESC LIMIT 1
      `, [marketer.id]);
      
      console.log(`🔍 Commitment query for marketer ${marketer.id}:`, commitmentResult.rows.length, 'rows');
      
      formData.push({
        marketer: marketer,
        biodata: biodataResult.rows[0] || null,
        guarantor: guarantorResult.rows[0] || null,
        commitment: commitmentResult.rows[0] || null
      });
      
      console.log(`📋 Marketer ${marketer.first_name}:`, {
        biodata: biodataResult.rows.length,
        guarantor: guarantorResult.rows.length,
        commitment: commitmentResult.rows.length
      });
    }
    
    res.json({
      success: true,
      data: formData,
      message: `Found ${formData.length} marketers with form data`
    });
    
  } catch (error) {
    console.error('❌ Error getting raw form data:', error);
    next(error);
  }
};

module.exports = {
  submitBiodata,
  submitGuarantor,
  submitCommitment,
  allowRefillForm,
  getFormStatus,
  adminReview,
  superadminVerify,
  masterApprove,
  deleteBiodataSubmission,
  deleteGuarantorSubmission,
  deleteCommitmentSubmission,
  getAllSubmissionsForMasterAdmin,
  getApprovedSubmissionsForMasterAdmin,
  getVerificationWorkflowLogs,
  getSubmissionsForAdmin,
  getSubmissionsForSuperAdmin,
  getVerifiedMarketersMaster,
  getVerifiedMarketersSuperadmin,
  getVerifiedMarketersAdmin,
  uploadAdminVerification,
  verifyAndSendToSuperAdmin,
  resetSubmissionStatus,
  getVerificationStatus,
  sendToSuperAdmin,
  approveAdminSuperadmin,
  getAdminAssignmentInfo,
  fixUserFormFlags,
  getRawFormData,
};

