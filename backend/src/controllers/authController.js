require('dotenv').config();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');
const { 
  generateVerificationToken, 
  sendVerificationEmail, 
  sendPasswordResetEmail 
} = require('../services/emailService');

// Notification function for MasterAdmin
const notifyMasterAdminNewMarketer = async (marketer) => {
  try {
    // Get all MasterAdmin users
    const masterAdmins = await pool.query('SELECT id, unique_id FROM users WHERE role = $1', ['MasterAdmin']);
    
    // Send socket notification to each MasterAdmin
    for (const masterAdmin of masterAdmins.rows) {
      // This would typically use your socket.io implementation
      // For now, we'll log it and you can implement the actual socket notification
      console.log(`🔔 NOTIFICATION for MasterAdmin ${masterAdmin.unique_id}: New marketer registered - ${marketer.first_name} ${marketer.last_name} (${marketer.email})`);
      
      // TODO: Implement actual socket notification
      // await sendSocketNotification(masterAdmin.unique_id, {
      //   type: 'new_marketer_registration',
      //   message: `New marketer registered: ${marketer.first_name} ${marketer.last_name} (${marketer.email})`,
      //   marketerId: marketer.id,
      //   marketerName: `${marketer.first_name} ${marketer.last_name}`,
      //   marketerEmail: marketer.email
      // });
    }
  } catch (error) {
    console.error('Error notifying MasterAdmin:', error);
    throw error;
  }
};

/**
 * loginUser - Handles user login, returns token and full user profile including verification flags.
 */
const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const query = 'SELECT * FROM users WHERE email = $1';
    const { rows } = await pool.query(query, [email]);
    if (rows.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }
    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    // Email verification check removed - all users can login immediately

    // Special access control for Marketers
    if (user.role === 'Marketer') {
      // Check if marketer is assigned to an admin
      if (!user.admin_id) {
        return res.status(403).json({ 
          message: 'Your account is pending Admin assignment. Please wait for assignment.',
          requiresAssignment: true 
        });
      }
      
      // Note: Locked marketers can still login but will see verification page only
      // The frontend will handle showing the verification dashboard for locked accounts
    }

    const token = jwt.sign(
      { id: user.id, unique_id: user.unique_id, role: user.role, first_name: user.first_name, last_name:  user.last_name },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );
    return res.status(200).json({
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        unique_id: user.unique_id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        role: user.role,
        location: user.location,
        profile_image: user.profile_image,
        email_verified: user.email_verified,
        bio_submitted: user.bio_submitted,
        guarantor_submitted: user.guarantor_submitted,
        commitment_submitted: user.commitment_submitted,
        overall_verification_status: user.overall_verification_status,
        locked: user.locked,
        admin_id: user.admin_id
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * registerUser - Handles user registration with email verification
 */
const registerUser = async (req, res, next) => {
  try {
    const { email, password, first_name, last_name, role, ...otherData } = req.body;

    // Check if user already exists
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: 'User with this email already exists.' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate verification token
    const verificationToken = generateVerificationToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create user
    const query = `
      INSERT INTO users (
        unique_id, first_name, last_name, email, password, role,
        email_verification_token, email_verification_expires, email_verification_sent_at,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW(), NOW())
      RETURNING *
    `;
    
    const values = [
      require('uuid').v4(),
      first_name,
      last_name,
      email,
      hashedPassword,
      role,
      verificationToken,
      expiresAt,
      ...Object.values(otherData)
    ];

    const result = await pool.query(query, values);
    const newUser = result.rows[0];

    // Handle marketer-specific registration flow
    if (role === 'Marketer') {
      // Lock the marketer account immediately
      await pool.query('UPDATE users SET locked = true WHERE id = $1', [newUser.id]);
      
      // Send notification to MasterAdmin
      try {
        await notifyMasterAdminNewMarketer(newUser);
      } catch (notificationError) {
        console.error('Failed to notify MasterAdmin:', notificationError);
        // Don't fail registration if notification fails
      }

      return res.status(201).json({
        message: 'Registration successful. Your account is pending Admin assignment. You will be notified when assigned.',
        requiresAssignment: true,
        user: {
          id: newUser.id,
          email: newUser.email,
          role: newUser.role,
          locked: true
        }
      });
    }

    // Send verification email for non-marketer roles
    try {
      await sendVerificationEmail(email, verificationToken, first_name);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Don't fail registration if email fails, but log it
    }

    res.status(201).json({
      message: 'Registration successful. Please check your email to verify your account.',
      user: {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
        email_verified: newUser.email_verified
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * verifyEmail - Verifies user email with token
 */
const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.params;

    // Find user with this token
    const query = `
      SELECT id, email, first_name, email_verification_expires 
      FROM users 
      WHERE email_verification_token = $1 AND email_verified = false
    `;
    const { rows } = await pool.query(query, [token]);

    if (rows.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired verification token.' });
    }

    const user = rows[0];

    // Check if token is expired
    if (new Date() > new Date(user.email_verification_expires)) {
      return res.status(400).json({ message: 'Verification token has expired.' });
    }

    // Mark email as verified
    await pool.query(
      'UPDATE users SET email_verified = true, email_verification_token = NULL, email_verification_expires = NULL, updated_at = NOW() WHERE id = $1',
      [user.id]
    );

    res.json({ 
      message: 'Email verified successfully. You can now log in to your account.',
      email: user.email
    });
  } catch (error) {
    next(error);
  }
};

/**
 * resendVerificationEmail - Resends verification email
 */
const resendVerificationEmail = async (req, res, next) => {
  try {
    const { email } = req.body;

    // Find user
    const { rows } = await pool.query(
      'SELECT id, first_name, email_verified FROM users WHERE email = $1',
      [email]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const user = rows[0];

    if (user.email_verified) {
      return res.status(400).json({ message: 'Email is already verified.' });
    }

    // Generate new verification token
    const verificationToken = generateVerificationToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Update user with new token
    await pool.query(
      'UPDATE users SET email_verification_token = $1, email_verification_expires = $2, email_verification_sent_at = NOW() WHERE id = $3',
      [verificationToken, expiresAt, user.id]
    );

    // Send verification email
    try {
      await sendVerificationEmail(email, verificationToken, user.first_name);
      res.json({ message: 'Verification email sent successfully.' });
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      res.status(500).json({ message: 'Failed to send verification email. Please try again.' });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * forgotPassword - Sends password reset email
 */
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    // Find user
    const { rows } = await pool.query(
      'SELECT id, first_name FROM users WHERE email = $1',
      [email]
    );

    if (rows.length === 0) {
      // Don't reveal if user exists or not
      return res.status(200).json({ message: 'If an account with this email exists, a password reset link has been sent.' });
    }

    const user = rows[0];

    // Generate reset token
    const resetToken = generateVerificationToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store reset token
    await pool.query(
      'UPDATE users SET email_verification_token = $1, email_verification_expires = $2 WHERE id = $3',
      [resetToken, expiresAt, user.id]
    );

    // Send reset email
    try {
      await sendPasswordResetEmail(email, resetToken, user.first_name);
      res.json({ message: 'Password reset email sent successfully.' });
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError);
      res.status(500).json({ message: 'Failed to send password reset email. Please try again.' });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * resetPassword - Resets password with token
 */
const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;

    // Find user with this token
    const { rows } = await pool.query(
      'SELECT id, email_verification_expires FROM users WHERE email_verification_token = $1',
      [token]
    );

    if (rows.length === 0) {
      return res.status(400).json({ message: 'Invalid reset token.' });
    }

    const user = rows[0];

    // Check if token is expired
    if (new Date() > new Date(user.email_verification_expires)) {
      return res.status(400).json({ message: 'Reset token has expired.' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and clear token
    await pool.query(
      'UPDATE users SET password = $1, email_verification_token = NULL, email_verification_expires = NULL, updated_at = NOW() WHERE id = $2',
      [hashedPassword, user.id]
    );

    res.json({ message: 'Password reset successfully. You can now log in with your new password.' });
  } catch (error) {
    next(error);
  }
};

/**
 * getCurrentUser - Returns profile and verification flags of the logged‑in user.
 */
const getCurrentUser = async (req, res, next) => {
  try {
    const { unique_id } = req.user; // injected by your auth middleware
    
    // First check if email_verified column exists
    const columnCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'email_verified'
    `);
    
    const hasEmailVerified = columnCheck.rows.length > 0;
    
    // Build query based on available columns
    let emailVerifiedSelect = hasEmailVerified 
      ? 'COALESCE(u.email_verified, true) as email_verified'
      : 'true as email_verified';
    
    const query = `
      SELECT u.id, u.unique_id, u.first_name, u.last_name, u.email, u.role, u.location, u.profile_image,
             ${emailVerifiedSelect}, u.bio_submitted, u.guarantor_submitted, u.commitment_submitted,
             u.overall_verification_status, u.locked, u.admin_id,
             a.first_name as admin_first_name, a.last_name as admin_last_name
      FROM users u
      LEFT JOIN users a ON u.admin_id = a.id
      WHERE u.unique_id = $1
    `;
    
    const { rows } = await pool.query(query, [unique_id]);
    if (!rows.length) {
      return res.status(404).json({ message: 'User not found.' });
    }
    
    const user = rows[0];
    
    // Add admin name if admin_id exists
    if (user.admin_id && user.admin_first_name && user.admin_last_name) {
      user.admin_name = `${user.admin_first_name} ${user.admin_last_name}`;
    }
    
    // Remove the separate admin name fields
    delete user.admin_first_name;
    delete user.admin_last_name;
    
    return res.json({ user });
  } catch (err) {
    next(err);
  }
};

/**
 * logoutUser - Handles user logout
 */
const logoutUser = async (req, res, next) => {
  try {
    // Since we're using JWT tokens, logout is handled on the client side
    // by removing the token from localStorage/sessionStorage
    // This endpoint is mainly for logging purposes and future enhancements
    
    console.log(`👋 User ${req.user?.unique_id || 'unknown'} logged out`);
    
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  loginUser,
  registerUser,
  verifyEmail,
  resendVerificationEmail,
  forgotPassword,
  resetPassword,
  getCurrentUser,
  logoutUser
};