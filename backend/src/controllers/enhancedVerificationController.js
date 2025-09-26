const pool = require('../config/database');

/**
 * Enhanced Verification Controller
 * Handles the new verification workflow with physical verification and phone verification
 */

/**
 * Admin Physical Verification
 * Admin uploads location and photos of marketer at their residence
 */
const adminPhysicalVerification = async (req, res, next) => {
  try {
    const adminId = req.user.id;
    const { 
      marketerUniqueId, 
      locationLatitude, 
      locationLongitude, 
      locationAddress, 
      landmarkDescription,
      verificationNotes 
    } = req.body;

    if (!marketerUniqueId) {
      return res.status(400).json({ 
        success: false, 
        message: "Marketer Unique ID is required" 
      });
    }

    // Verify marketer is assigned to this admin
    const marketerQuery = `
      SELECT id, admin_id FROM users 
      WHERE unique_id = $1 AND admin_id = $2 AND role = 'Marketer'
    `;
    const marketerResult = await pool.query(marketerQuery, [marketerUniqueId, adminId]);
    
    if (marketerResult.rowCount === 0) {
      return res.status(404).json({ 
        success: false, 
        message: "Marketer not found or not assigned to you" 
      });
    }

    // Handle file uploads (assuming multer middleware handles this)
    const adminAtLocationPhoto = req.files?.adminAtLocationPhoto?.[0];
    const marketerAtLocationPhoto = req.files?.marketerAtLocationPhoto?.[0];

    if (!adminAtLocationPhoto || !marketerAtLocationPhoto) {
      return res.status(400).json({ 
        success: false, 
        message: "Both admin and marketer photos are required" 
      });
    }

    // Upload photos to Cloudinary (you'll need to implement this)
    // For now, we'll store the file paths
    const adminPhotoUrl = adminAtLocationPhoto.path; // Replace with Cloudinary URL
    const marketerPhotoUrl = marketerAtLocationPhoto.path; // Replace with Cloudinary URL

    // Insert physical verification record
    const insertQuery = `
      INSERT INTO physical_verifications (
        marketer_unique_id, admin_id, location_latitude, location_longitude,
        location_address, landmark_description, admin_at_location_photo_url,
        marketer_at_location_photo_url, verification_notes, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'completed')
      RETURNING *
    `;

    const values = [
      marketerUniqueId, adminId, locationLatitude, locationLongitude,
      locationAddress, landmarkDescription, adminPhotoUrl, marketerPhotoUrl, verificationNotes
    ];

    const result = await pool.query(insertQuery, values);

    // Update marketer's verification status
    await pool.query(`
      UPDATE users 
      SET overall_verification_status = 'admin_physical_verification_completed',
          updated_at = NOW()
      WHERE unique_id = $1
    `, [marketerUniqueId]);

    // Update verification progress
    await pool.query(`
      INSERT INTO verification_progress (marketer_unique_id, current_step, step_status, step_data, completed_at)
      VALUES ($1, 'admin_physical_verification', 'completed', $2, NOW())
      ON CONFLICT (marketer_unique_id, current_step) 
      DO UPDATE SET step_status = 'completed', step_data = $2, completed_at = NOW()
    `, [marketerUniqueId, JSON.stringify({
      location: { latitude: locationLatitude, longitude: locationLongitude, address: locationAddress },
      landmark: landmarkDescription,
      photos: { admin: adminPhotoUrl, marketer: marketerPhotoUrl },
      notes: verificationNotes
    })]);

    // Notify marketer (socket notification will be handled by notification service)
    console.log(`Physical verification completed for marketer: ${marketerUniqueId}`);

    res.status(200).json({
      success: true,
      message: "Physical verification completed successfully",
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error in adminPhysicalVerification:', error);
    next(error);
  }
};

/**
 * SuperAdmin Phone Verification
 * SuperAdmin makes calls to verify information
 */
const superadminPhoneVerification = async (req, res, next) => {
  try {
    const superadminId = req.user.id;
    const { 
      marketerUniqueId, 
      phoneNumber, 
      callDurationSeconds, 
      verificationNotes 
    } = req.body;

    if (!marketerUniqueId) {
      return res.status(400).json({ 
        success: false, 
        message: "Marketer Unique ID is required" 
      });
    }

    // Verify marketer is in SuperAdmin's hierarchy
    const marketerQuery = `
      SELECT u.id, u.admin_id, u.phone
      FROM users u
      LEFT JOIN users admin ON admin.id = u.admin_id
      WHERE u.unique_id = $1 
        AND u.role = 'Marketer'
        AND (u.super_admin_id = $2 OR admin.super_admin_id = $2)
    `;
    const marketerResult = await pool.query(marketerQuery, [marketerUniqueId, superadminId]);
    
    if (marketerResult.rowCount === 0) {
      return res.status(404).json({ 
        success: false, 
        message: "Marketer not found or not in your hierarchy" 
      });
    }

    const marketer = marketerResult.rows[0];

    // Insert phone verification record
    const insertQuery = `
      INSERT INTO phone_verifications (
        marketer_unique_id, superadmin_id, phone_number, 
        call_duration_seconds, verification_notes, status
      ) VALUES ($1, $2, $3, $4, $5, 'completed')
      RETURNING *
    `;

    const values = [
      marketerUniqueId, superadminId, phoneNumber || marketer.phone, 
      callDurationSeconds, verificationNotes
    ];

    const result = await pool.query(insertQuery, values);

    // Update marketer's verification status
    await pool.query(`
      UPDATE users 
      SET overall_verification_status = 'superadmin_phone_verification_completed',
          updated_at = NOW()
      WHERE unique_id = $1
    `, [marketerUniqueId]);

    // Update verification progress
    await pool.query(`
      INSERT INTO verification_progress (marketer_unique_id, current_step, step_status, step_data, completed_at)
      VALUES ($1, 'superadmin_phone_verification', 'completed', $2, NOW())
      ON CONFLICT (marketer_unique_id, current_step) 
      DO UPDATE SET step_status = 'completed', step_data = $2, completed_at = NOW()
    `, [marketerUniqueId, JSON.stringify({
      phoneNumber: phoneNumber || marketer.phone,
      callDuration: callDurationSeconds,
      notes: verificationNotes
    })]);

    // Notify marketer (socket notification will be handled by notification service)
    console.log(`Phone verification completed for marketer: ${marketerUniqueId}`);

    res.status(200).json({
      success: true,
      message: "Phone verification completed successfully",
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error in superadminPhoneVerification:', error);
    next(error);
  }
};

/**
 * Get Verification Progress
 * Returns the current verification status and progress for a marketer
 */
const getVerificationProgress = async (req, res, next) => {
  try {
    const { marketerUniqueId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Verify access based on role
    let accessQuery = '';
    let accessParams = [marketerUniqueId];

    if (userRole === 'Marketer') {
      accessQuery = 'WHERE u.unique_id = $1 AND u.id = $2';
      accessParams.push(userId);
    } else if (userRole === 'Admin') {
      accessQuery = 'WHERE u.unique_id = $1 AND u.admin_id = $2';
      accessParams.push(userId);
    } else if (userRole === 'SuperAdmin') {
      accessQuery = `
        WHERE u.unique_id = $1 
        AND (u.super_admin_id = $2 OR EXISTS (
          SELECT 1 FROM users admin 
          WHERE admin.id = u.admin_id AND admin.super_admin_id = $2
        ))
      `;
      accessParams.push(userId);
    } else if (userRole === 'MasterAdmin') {
      accessQuery = 'WHERE u.unique_id = $1';
    } else {
      return res.status(403).json({ 
        success: false, 
        message: "Access denied" 
      });
    }

    // Get marketer info and verification status
    const marketerQuery = `
      SELECT 
        u.id, u.unique_id, u.first_name, u.last_name, u.email, u.phone,
        u.bio_submitted, u.guarantor_submitted, u.commitment_submitted,
        u.overall_verification_status, u.created_at,
        pv.verification_date as physical_verification_date,
        pv.location_address, pv.landmark_description,
        pv.admin_at_location_photo_url, pv.marketer_at_location_photo_url,
        pv.verification_notes as physical_verification_notes,
        phv.verification_date as phone_verification_date,
        phv.phone_number, phv.call_duration_seconds,
        phv.verification_notes as phone_verification_notes
      FROM users u
      LEFT JOIN physical_verifications pv ON pv.marketer_unique_id = u.unique_id
      LEFT JOIN phone_verifications phv ON phv.marketer_unique_id = u.unique_id
      ${accessQuery}
    `;

    const marketerResult = await pool.query(marketerQuery, accessParams);
    
    if (marketerResult.rowCount === 0) {
      return res.status(404).json({ 
        success: false, 
        message: "Marketer not found or access denied" 
      });
    }

    const marketer = marketerResult.rows[0];

    // Get verification progress steps
    const progressQuery = `
      SELECT current_step, step_status, step_data, completed_at
      FROM verification_progress
      WHERE marketer_unique_id = $1
      ORDER BY created_at ASC
    `;

    const progressResult = await pool.query(progressQuery, [marketerUniqueId]);

    // Calculate overall progress
    const totalSteps = 5; // forms, admin_physical, superadmin_phone, masteradmin_approval, approved
    const completedSteps = progressResult.rows.filter(step => step.step_status === 'completed').length;
    const progressPercentage = Math.round((completedSteps / totalSteps) * 100);

    res.status(200).json({
      success: true,
      data: {
        marketer: {
          id: marketer.id,
          unique_id: marketer.unique_id,
          name: `${marketer.first_name} ${marketer.last_name}`,
          email: marketer.email,
          phone: marketer.phone,
          forms: {
            biodata: marketer.bio_submitted,
            guarantor: marketer.guarantor_submitted,
            commitment: marketer.commitment_submitted
          },
          verification_status: marketer.overall_verification_status,
          created_at: marketer.created_at
        },
        physical_verification: marketer.physical_verification_date ? {
          date: marketer.physical_verification_date,
          location: {
            address: marketer.location_address,
            landmark: marketer.landmark_description
          },
          photos: {
            admin: marketer.admin_at_location_photo_url,
            marketer: marketer.marketer_at_location_photo_url
          },
          notes: marketer.physical_verification_notes
        } : null,
        phone_verification: marketer.phone_verification_date ? {
          date: marketer.phone_verification_date,
          phone_number: marketer.phone_number,
          call_duration: marketer.call_duration_seconds,
          notes: marketer.phone_verification_notes
        } : null,
        progress: {
          percentage: progressPercentage,
          steps: progressResult.rows
        }
      }
    });

  } catch (error) {
    console.error('Error in getVerificationProgress:', error);
    next(error);
  }
};

/**
 * Send Verification Reminder
 * Sends reminders for incomplete verification steps
 */
const sendVerificationReminder = async (req, res, next) => {
  try {
    const { marketerUniqueId, reminderType, message } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Verify access
    let accessQuery = '';
    let accessParams = [marketerUniqueId];

    if (userRole === 'Admin') {
      accessQuery = 'WHERE u.unique_id = $1 AND u.admin_id = $2';
      accessParams.push(userId);
    } else if (userRole === 'SuperAdmin') {
      accessQuery = `
        WHERE u.unique_id = $1 
        AND (u.super_admin_id = $2 OR EXISTS (
          SELECT 1 FROM users admin 
          WHERE admin.id = u.admin_id AND admin.super_admin_id = $2
        ))
      `;
      accessParams.push(userId);
    } else if (userRole === 'MasterAdmin') {
      accessQuery = 'WHERE u.unique_id = $1';
    } else {
      return res.status(403).json({ 
        success: false, 
        message: "Access denied" 
      });
    }

    const marketerQuery = `
      SELECT id, first_name, last_name, email, phone
      FROM users u
      ${accessQuery}
    `;

    const marketerResult = await pool.query(marketerQuery, accessParams);
    
    if (marketerResult.rowCount === 0) {
      return res.status(404).json({ 
        success: false, 
        message: "Marketer not found or access denied" 
      });
    }

    const marketer = marketerResult.rows[0];

    // Insert reminder record
    const insertQuery = `
      INSERT INTO verification_reminders (marketer_unique_id, reminder_type, reminder_message, status)
      VALUES ($1, $2, $3, 'sent')
      RETURNING *
    `;

    const result = await pool.query(insertQuery, [marketerUniqueId, reminderType, message]);

    // Send reminder (socket notification will be handled by notification service)
    console.log(`Reminder sent to marketer: ${marketerUniqueId}`);

    res.status(200).json({
      success: true,
      message: "Reminder sent successfully",
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error in sendVerificationReminder:', error);
    next(error);
  }
};

module.exports = {
  adminPhysicalVerification,
  superadminPhoneVerification,
  getVerificationProgress,
  sendVerificationReminder
};
