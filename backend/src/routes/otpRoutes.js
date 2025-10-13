// src/routes/otpRoutes.js
// API routes for OTP authentication system

const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/authMiddleware');
const otpService = require('../services/otpService');
const emailService = require('../services/emailService');
const { pool } = require('../config/database');

/**
 * Send OTP to user's email
 * POST /api/otp/send
 */
router.post('/send', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }
    
    console.log(`📧 Sending OTP to ${email} - Request received at ${new Date().toISOString()}`);
    
    // Find user by email
    const userResult = await pool.query(`
      SELECT id, email, first_name, last_name, otp_enabled, otp_grace_period_end, email_update_required
      FROM users 
      WHERE email = $1
    `, [email]);
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found with this email address'
      });
    }
    
    const user = userResult.rows[0];
    
    // Check rate limit (max 3 OTPs per 15 minutes)
    const rateLimit = await otpService.getOTPRateLimit(user.id);
    if (!rateLimit.canSend) {
      return res.status(429).json({
        success: false,
        message: `Too many OTP requests. Please wait ${15 - Math.floor((Date.now() - new Date().setMinutes(new Date().getMinutes() - 15)) / 60000)} minutes before requesting another OTP.`,
        retryAfter: 900 // 15 minutes in seconds
      });
    }
    
    // Generate and store OTP
    const otpCode = otpService.generateOTP();
    console.log(`🔐 Generated OTP code: ${otpCode} for user ${user.id}`);
    await otpService.storeOTP(user.id, otpCode);
    console.log(`💾 OTP stored successfully for user ${user.id}`);
    
    // Send OTP email
    console.log(`📤 Sending OTP email to ${user.email}`);
    await emailService.sendOTPEmail(
      user.email,
      `${user.first_name} ${user.last_name}`,
      otpCode
    );
    console.log(`✅ OTP email sent successfully to ${user.email}`);
    
    console.log(`✅ OTP sent to user ${user.id} (${user.email})`);
    
    res.json({
      success: true,
      message: 'OTP sent to your email address',
      rateLimit: {
        attempts: rateLimit.attempts,
        remaining: rateLimit.remaining
      }
    });
    
  } catch (error) {
    console.error('❌ Error sending OTP:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send OTP. Please try again later.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Verify OTP and login
 * POST /api/otp/verify
 */
router.post('/verify', async (req, res) => {
  try {
    const { email, otpCode } = req.body;
    
    if (!email || !otpCode) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP code are required'
      });
    }
    
    console.log(`🔐 Verifying OTP for ${email}`);
    
    // Find user by email
    const userResult = await pool.query(`
      SELECT id, unique_id, email, first_name, last_name, role, otp_enabled, otp_grace_period_end, email_update_required
      FROM users 
      WHERE email = $1
    `, [email]);
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found with this email address'
      });
    }
    
    const user = userResult.rows[0];
    
    // Verify OTP
    await otpService.verifyOTP(user.id, otpCode);
    
    // Generate JWT token (using same format as regular login)
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { 
        id: user.id, 
        unique_id: user.unique_id, 
        role: user.role, 
        first_name: user.first_name, 
        last_name: user.last_name 
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    // Update user's OTP enabled status if they're in grace period
    if (user.email_update_required && user.otp_grace_period_end > new Date()) {
      await pool.query(`
        UPDATE users 
        SET otp_enabled = TRUE, email_update_required = FALSE
        WHERE id = $1
      `, [user.id]);
    }
    
    console.log(`✅ OTP verified and user ${user.id} logged in successfully`);
    
    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        profile_image: user.profile_image,
        otpEnabled: true,
        emailVerified: true
      }
    });
    
  } catch (error) {
    console.error('❌ Error verifying OTP:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Invalid or expired OTP code',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Check if user needs to update email (grace period status)
 * GET /api/otp/grace-period-status
 */
router.get('/grace-period-status', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const userResult = await pool.query(`
      SELECT 
        id, email, first_name, last_name, 
        otp_enabled, otp_grace_period_end, email_update_required,
        EXTRACT(EPOCH FROM (otp_grace_period_end - NOW())) as seconds_remaining
      FROM users 
      WHERE id = $1
    `, [userId]);
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const user = userResult.rows[0];
    const now = new Date();
    const gracePeriodEnd = new Date(user.otp_grace_period_end);
    const isInGracePeriod = gracePeriodEnd > now;
    const daysRemaining = isInGracePeriod ? Math.ceil(user.seconds_remaining / (24 * 60 * 60)) : 0;
    
    res.json({
      success: true,
      data: {
        isInGracePeriod,
        daysRemaining,
        emailUpdateRequired: user.email_update_required,
        otpEnabled: user.otp_enabled,
        gracePeriodEnd: user.otp_grace_period_end
      }
    });
    
  } catch (error) {
    console.error('❌ Error checking grace period status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check grace period status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Update user's email address
 * PUT /api/otp/update-email
 */
router.put('/update-email', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { newEmail } = req.body;
    
    if (!newEmail) {
      return res.status(400).json({
        success: false,
        message: 'New email address is required'
      });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }
    
    // Check if email is already taken
    const existingUser = await pool.query(`
      SELECT id FROM users WHERE email = $1 AND id != $2
    `, [newEmail, userId]);
    
    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'This email address is already in use'
      });
    }
    
    // Update user's email
    await pool.query(`
      UPDATE users 
      SET email = $1, email_verified = TRUE, email_update_required = FALSE
      WHERE id = $2
    `, [newEmail, userId]);
    
    console.log(`✅ User ${userId} updated email to ${newEmail}`);
    
    res.json({
      success: true,
      message: 'Email address updated successfully',
      newEmail
    });
    
  } catch (error) {
    console.error('❌ Error updating email:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update email address',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Send email update reminder
 * POST /api/otp/send-reminder
 */
router.post('/send-reminder', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const userResult = await pool.query(`
      SELECT 
        id, email, first_name, last_name, 
        otp_grace_period_end,
        EXTRACT(EPOCH FROM (otp_grace_period_end - NOW())) as seconds_remaining
      FROM users 
      WHERE id = $1
    `, [userId]);
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const user = userResult.rows[0];
    const daysRemaining = Math.ceil(user.seconds_remaining / (24 * 60 * 60));
    
    if (daysRemaining <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Grace period has ended'
      });
    }
    
    // Send reminder email
    await emailService.sendEmailUpdateReminder(
      user.email,
      `${user.first_name} ${user.last_name}`,
      daysRemaining
    );
    
    console.log(`✅ Email update reminder sent to user ${userId}`);
    
    res.json({
      success: true,
      message: 'Email update reminder sent',
      daysRemaining
    });
    
  } catch (error) {
    console.error('❌ Error sending email reminder:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send reminder email',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
