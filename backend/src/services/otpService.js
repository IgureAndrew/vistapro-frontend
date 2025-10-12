// src/services/otpService.js
// OTP generation, storage, and verification service

const crypto = require('crypto');
const { pool } = require('../config/database');

/**
 * Generate a secure 6-digit OTP code
 */
function generateOTP() {
  return crypto.randomInt(100000, 999999).toString();
}

/**
 * Store OTP in database with expiration
 */
async function storeOTP(userId, otpCode, expiresInMinutes = 5) {
  try {
    const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);
    
    console.log(`🔄 Storing OTP for user ${userId}, deleting existing unused OTPs...`);
    
    // Delete ALL existing OTPs for this user (both used and unused) to prevent multiple emails
    const deleteResult = await pool.query(`
      DELETE FROM user_otps 
      WHERE user_id = $1
    `, [userId]);
    
    console.log(`🗑️ Deleted ${deleteResult.rowCount} existing OTP records for user ${userId}`);
    
    // Insert new OTP
    const result = await pool.query(`
      INSERT INTO user_otps (user_id, otp_code, expires_at)
      VALUES ($1, $2, $3)
      RETURNING id
    `, [userId, otpCode, expiresAt]);
    
    console.log(`✅ New OTP stored for user ${userId}, expires at ${expiresAt}, ID: ${result.rows[0].id}`);
    return result.rows[0].id;
  } catch (error) {
    console.error('❌ Error storing OTP:', error);
    throw new Error('Failed to store OTP');
  }
}

/**
 * Verify OTP code for a user
 */
async function verifyOTP(userId, otpCode) {
  try {
    console.log(`🔐 Verifying OTP for user ${userId} with code ${otpCode}`);
    
    // First, let's check what OTP records exist for this user
    const debugResult = await pool.query(`
      SELECT 
        id, user_id, otp_code, expires_at, used, used_at, created_at,
        (expires_at > NOW()) as is_not_expired,
        (NOW() - created_at) as age_seconds
      FROM user_otps 
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 5
    `, [userId]);
    
    console.log(`📊 Found ${debugResult.rows.length} OTP records for user ${userId}:`);
    debugResult.rows.forEach((record, index) => {
      console.log(`  ${index + 1}. Code: ${record.otp_code}, Expires: ${record.expires_at}, Used: ${record.used}, Valid: ${record.is_not_expired}`);
    });
    
    const result = await pool.query(`
      SELECT * FROM user_otps 
      WHERE user_id = $1 
        AND otp_code = $2 
        AND expires_at > NOW() 
        AND used = FALSE
      ORDER BY created_at DESC 
      LIMIT 1
    `, [userId, otpCode]);

    console.log(`🔍 Verification query result: ${result.rows.length} matching records found`);

    if (result.rows.length === 0) {
      // Let's check if the OTP exists but is expired or used
      const expiredResult = await pool.query(`
        SELECT 
          otp_code, expires_at, used, created_at,
          (expires_at > NOW()) as is_not_expired
        FROM user_otps 
        WHERE user_id = $1 AND otp_code = $2
        ORDER BY created_at DESC 
        LIMIT 1
      `, [userId, otpCode]);
      
      if (expiredResult.rows.length > 0) {
        const record = expiredResult.rows[0];
        console.log(`⚠️  OTP found but invalid - Expired: ${!record.is_not_expired}, Used: ${record.used}`);
        throw new Error(`Invalid OTP: ${!record.is_not_expired ? 'expired' : 'already used'}`);
      } else {
        console.log(`❌ No OTP found for user ${userId} with code ${otpCode}`);
        throw new Error('Invalid or expired OTP code');
      }
    }

    const otpRecord = result.rows[0];
    console.log(`✅ Valid OTP found: ${otpRecord.otp_code} for user ${userId}`);
    
    // Mark OTP as used
    await pool.query(`
      UPDATE user_otps 
      SET used = TRUE, used_at = NOW() 
      WHERE id = $1
    `, [otpRecord.id]);
    
    console.log(`✅ OTP marked as used`);

    console.log(`✅ OTP verified for user ${userId}`);
    return true;
  } catch (error) {
    console.error('❌ Error verifying OTP:', error);
    throw error;
  }
}

/**
 * Check if user has a valid (unused) OTP
 */
async function hasValidOTP(userId) {
  try {
    const result = await pool.query(`
      SELECT COUNT(*) as count 
      FROM user_otps 
      WHERE user_id = $1 
        AND expires_at > NOW() 
        AND used = FALSE
    `, [userId]);

    return parseInt(result.rows[0].count) > 0;
  } catch (error) {
    console.error('❌ Error checking valid OTP:', error);
    return false;
  }
}

/**
 * Clean up expired OTPs
 */
async function cleanupExpiredOTPs() {
  try {
    const result = await pool.query(`
      DELETE FROM user_otps 
      WHERE expires_at < NOW()
    `);
    
    console.log(`🧹 Cleaned up ${result.rowCount} expired OTPs`);
    return result.rowCount;
  } catch (error) {
    console.error('❌ Error cleaning up expired OTPs:', error);
    return 0;
  }
}

/**
 * Get OTP rate limit info for a user
 */
async function getOTPRateLimit(userId) {
  try {
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    
    const result = await pool.query(`
      SELECT COUNT(*) as attempts
      FROM user_otps 
      WHERE user_id = $1 
        AND created_at > $2
    `, [userId, fifteenMinutesAgo]);

    const attempts = parseInt(result.rows[0].attempts);
    const remaining = Math.max(0, 3 - attempts); // Max 3 attempts per 15 minutes
    
    return {
      attempts,
      remaining,
      canSend: remaining > 0
    };
  } catch (error) {
    console.error('❌ Error checking OTP rate limit:', error);
    return {
      attempts: 0,
      remaining: 3,
      canSend: true
    };
  }
}

module.exports = {
  generateOTP,
  storeOTP,
  verifyOTP,
  hasValidOTP,
  cleanupExpiredOTPs,
  getOTPRateLimit
};
