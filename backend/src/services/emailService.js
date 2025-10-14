// src/services/emailService.js
// Email service using Resend API for OTP and notifications

const { Resend } = require('resend');

// Check if Resend API key is configured
if (!process.env.RESEND_API_KEY) {
  console.error('❌ RESEND_API_KEY is not configured in environment variables!');
  console.error('⚠️  OTP email functionality will not work until RESEND_API_KEY is set.');
}

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy_key_for_startup');

/**
 * Send OTP email to user
 */
async function sendOTPEmail(userEmail, userName, otpCode) {
  try {
    // Check if Resend is properly configured
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not configured. Please add it to your environment variables on Render.');
    }

    console.log(`📧 Sending OTP email to ${userEmail} for user ${userName}`);
    
    const { data, error } = await resend.emails.send({
      from: `VistaPro <${process.env.RESEND_FROM_EMAIL || 'noreply@vistapro.ng'}>`,
      to: [userEmail],
      subject: 'Your VistaPro Login Code',
      html: generateOTPEmailHTML(userName, otpCode)
    });

    if (error) {
      console.error('❌ Resend API error:', error);
      throw new Error(`Failed to send OTP email: ${error.message}`);
    }

    console.log('✅ OTP email sent successfully:', data);
    return data;
  } catch (error) {
    console.error('❌ Error sending OTP email:', error);
    throw error;
  }
}

/**
 * Send email update reminder to user
 */
async function sendEmailUpdateReminder(userEmail, userName, daysRemaining) {
  try {
    // Check if Resend is properly configured
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not configured. Please add it to your environment variables on Render.');
    }

    console.log(`📧 Sending email update reminder to ${userEmail}`);
    
    const { data, error } = await resend.emails.send({
      from: `VistaPro <${process.env.RESEND_FROM_EMAIL || 'noreply@vistapro.ng'}>`,
      to: [userEmail],
      subject: `Action Required: Update Your Email (${daysRemaining} days remaining)`,
      html: generateEmailUpdateReminderHTML(userName, daysRemaining)
    });

    if (error) {
      console.error('❌ Resend API error:', error);
      throw new Error(`Failed to send reminder email: ${error.message}`);
    }

    console.log('✅ Email update reminder sent successfully:', data);
    return data;
  } catch (error) {
    console.error('❌ Error sending email update reminder:', error);
    throw error;
  }
}

/**
 * Generate OTP email HTML template
 */
function generateOTPEmailHTML(userName, otpCode) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
    <title>VistaPro Login Code</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
<body style="font-family: Arial, sans-serif; background-color: #f9fafb; margin: 0; padding: 20px;">
    <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        
        <!-- Header -->
        <div style="background: #f59e0b; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px; font-weight: bold;">VistaPro</h1>
        </div>
        
        <!-- Content -->
        <div style="padding: 30px;">
            <h2 style="color: #1f2937; margin-bottom: 20px; font-size: 20px;">Your Login Code</h2>
            
            <p style="color: #4b5563; margin-bottom: 20px; line-height: 1.6;">Hi ${userName},</p>
            
            <p style="color: #4b5563; margin-bottom: 20px; line-height: 1.6;">Use the code below to complete your login:</p>
            
            <!-- OTP Code -->
            <div style="background: #f3f4f6; padding: 25px; text-align: center; margin: 25px 0; border-radius: 8px; border: 2px dashed #d1d5db;">
                <span style="font-size: 36px; font-weight: bold; color: #f59e0b; letter-spacing: 8px; font-family: 'Courier New', monospace;">${otpCode}</span>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; margin-bottom: 20px;">
                ⏰ This code will expire in <strong>5 minutes</strong>
            </p>
            
            <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
                <p style="color: #92400e; margin: 0; font-size: 14px;">
                    <strong>Security Tip:</strong> Never share this code with anyone. VistaPro will never ask for your login code.
                </p>
            </div>
            
            <p style="color: #6b7280; font-size: 12px; margin-top: 30px; line-height: 1.5;">
                If you didn't request this code, please ignore this email or contact support if you have concerns about your account security.
            </p>
        </div>
        
        <!-- Footer -->
        <div style="background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 12px; margin: 0;">
                © 2024 VistaPro. All rights reserved.
            </p>
            <p style="color: #9ca3af; font-size: 10px; margin: 5px 0 0 0;">
                This is an automated message. Please do not reply to this email.
            </p>
        </div>
        
      </div>
    </body>
    </html>
  `;
}

/**
 * Generate email update reminder HTML template
 */
function generateEmailUpdateReminderHTML(userName, daysRemaining) {
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Email Update Required - VistaPro</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; background-color: #f9fafb; margin: 0; padding: 20px;">
    <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        
        <!-- Header -->
        <div style="background: #ef4444; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px; font-weight: bold;">⚠️ Action Required</h1>
        </div>
        
        <!-- Content -->
        <div style="padding: 30px;">
            <h2 style="color: #1f2937; margin-bottom: 20px; font-size: 20px;">Email Update Required</h2>
            
            <p style="color: #4b5563; margin-bottom: 20px; line-height: 1.6;">Hi ${userName},</p>
            
            <p style="color: #4b5563; margin-bottom: 20px; line-height: 1.6;">
                To enhance your account security, VistaPro is implementing OTP (One-Time Password) login via email.
            </p>
            
            <div style="background: #fef2f2; border: 1px solid #fecaca; padding: 20px; margin: 20px 0; border-radius: 8px;">
                <h3 style="color: #dc2626; margin: 0 0 10px 0; font-size: 16px;">⏰ Time Remaining: ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}</h3>
                <p style="color: #7f1d1d; margin: 0; font-size: 14px;">
                    You must update your email address within ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} to continue using VistaPro.
                </p>
            </div>
            
            <p style="color: #4b5563; margin-bottom: 20px; line-height: 1.6;">
                <strong>What you need to do:</strong>
            </p>
            
            <ol style="color: #4b5563; margin-bottom: 20px; padding-left: 20px; line-height: 1.6;">
                <li>Log in to your VistaPro account</li>
                <li>Go to your Profile settings</li>
                <li>Update your email address to a valid, active email</li>
                <li>Verify your new email address</li>
            </ol>
            
            <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0;">
                <p style="color: #1e40af; margin: 0; font-size: 14px;">
                    <strong>Why this matters:</strong> OTP login provides an extra layer of security to protect your account from unauthorized access.
                </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="https://vistapro.ng/login" style="background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                    Update Email Now
                </a>
            </div>
            
            <p style="color: #6b7280; font-size: 12px; margin-top: 30px; line-height: 1.5;">
                If you don't update your email within ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}, you may experience login issues. Contact support if you need assistance.
            </p>
        </div>
        
        <!-- Footer -->
        <div style="background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 12px; margin: 0;">
                © 2024 VistaPro. All rights reserved.
            </p>
            <p style="color: #9ca3af; font-size: 10px; margin: 5px 0 0 0;">
                This is an automated message. Please do not reply to this email.
            </p>
        </div>
        
    </div>
</body>
</html>
  `;
}

/**
 * Generate a secure verification token
 */
function generateVerificationToken() {
  const crypto = require('crypto');
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Send email verification email to user
 */
async function sendVerificationEmail(userEmail, userName, verificationToken) {
  try {
    // Check if Resend is properly configured
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not configured. Please add it to your environment variables on Render.');
    }

    console.log(`📧 Sending verification email to ${userEmail} for user ${userName}`);
    
    // Use standalone email verification page for now
    const frontendUrl = process.env.FRONTEND_URL || 'https://vistapro-4xlusoclj-vistapros-projects.vercel.app';
    const verificationUrl = `${frontendUrl}/email-verification-standalone.html?token=${verificationToken}`;
    
    console.log(`🔗 Email verification URL: ${verificationUrl}`);
    console.log(`⚠️  TEMPORARY FIX: Using Vercel default domain due to vistapro.ng accessibility issue`);

    const { data, error } = await resend.emails.send({
      from: `VistaPro <${process.env.RESEND_FROM_EMAIL || 'noreply@vistapro.ng'}>`,
      to: [userEmail],
      subject: 'Verify Your VistaPro Email Address',
      html: generateVerificationEmailHTML(userName, verificationUrl)
    });

    if (error) {
      console.error('❌ Resend API error:', error);
      throw new Error(`Failed to send verification email: ${error.message}`);
    }

    console.log('✅ Verification email sent successfully:', data);
    return data;
  } catch (error) {
    console.error('❌ Error sending verification email:', error);
    throw error;
  }
}

/**
 * Send password reset email to user
 */
async function sendPasswordResetEmail(userEmail, userName, resetToken) {
  try {
    // Check if Resend is properly configured
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not configured. Please add it to your environment variables on Render.');
    }

    console.log(`📧 Sending password reset email to ${userEmail} for user ${userName}`);
    
    const resetUrl = `${process.env.FRONTEND_URL || 'https://vistapro-4xlusoclj-vistapros-projects.vercel.app'}/reset-password?token=${resetToken}`;
    
    const { data, error } = await resend.emails.send({
      from: `VistaPro <${process.env.RESEND_FROM_EMAIL || 'noreply@vistapro.ng'}>`,
      to: [userEmail],
      subject: 'Reset Your VistaPro Password',
      html: generatePasswordResetEmailHTML(userName, resetUrl)
    });

    if (error) {
      console.error('❌ Resend API error:', error);
      throw new Error(`Failed to send password reset email: ${error.message}`);
    }

    console.log('✅ Password reset email sent successfully:', data);
    return data;
  } catch (error) {
    console.error('❌ Error sending password reset email:', error);
    throw error;
  }
}

/**
 * Generate HTML for verification email
 */
function generateVerificationEmailHTML(userName, verificationUrl) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email - VistaPro</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
        <div style="max-width: 600px; margin: 0 auto; background: white; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
            
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #1f2937 0%, #374151 100%); padding: 30px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">VistaPro</h1>
                <p style="color: #d1d5db; margin: 10px 0 0 0; font-size: 16px;">Verify Your Email Address</p>
        </div>
            
            <!-- Content -->
            <div style="padding: 40px 30px;">
                <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px; font-weight: 600;">
                    Hello ${userName}!
                </h2>
                
                <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 25px 0;">
                    Thank you for registering with VistaPro. To complete your account setup and start using OTP login, please verify your email address by clicking the button below.
                </p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${verificationUrl}" 
                       style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); 
                              color: white; text-decoration: none; padding: 15px 30px; border-radius: 8px; 
                              font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.3);">
                        Verify Email Address
                    </a>
                </div>
                
                <p style="color: #6b7280; font-size: 14px; line-height: 1.5; margin: 25px 0 0 0;">
                    If the button doesn't work, you can copy and paste this link into your browser:
                </p>
                <p style="color: #3b82f6; font-size: 14px; word-break: break-all; margin: 10px 0 0 0;">
                    ${verificationUrl}
                </p>
                
                <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 6px; padding: 15px; margin: 25px 0;">
                    <p style="color: #92400e; font-size: 14px; margin: 0; font-weight: 500;">
                        ⚠️ <strong>Important:</strong> This verification link will expire in 24 hours. Please verify your email soon to avoid any login issues.
                    </p>
                </div>
        </div>
            
            <!-- Footer -->
            <div style="background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                <p style="color: #6b7280; font-size: 12px; margin: 0;">
                    © 2024 VistaPro. All rights reserved.
                </p>
                <p style="color: #9ca3af; font-size: 10px; margin: 5px 0 0 0;">
                    This is an automated message. Please do not reply to this email.
                </p>
        </div>
            
      </div>
    </body>
    </html>
  `;
}

/**
 * Generate HTML for password reset email
 */
function generatePasswordResetEmailHTML(userName, resetUrl) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password - VistaPro</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
        <div style="max-width: 600px; margin: 0 auto; background: white; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
            
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 30px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">VistaPro</h1>
                <p style="color: #fecaca; margin: 10px 0 0 0; font-size: 16px;">Password Reset Request</p>
            </div>
            
            <!-- Content -->
            <div style="padding: 40px 30px;">
                <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px; font-weight: 600;">
                    Hello ${userName}!
                </h2>
                
                <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 25px 0;">
                    We received a request to reset your password for your VistaPro account. Click the button below to create a new password.
                </p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${resetUrl}" 
                       style="display: inline-block; background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); 
                              color: white; text-decoration: none; padding: 15px 30px; border-radius: 8px; 
                              font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(220, 38, 38, 0.3);">
                        Reset Password
                    </a>
                </div>
                
                <p style="color: #6b7280; font-size: 14px; line-height: 1.5; margin: 25px 0 0 0;">
                    If the button doesn't work, you can copy and paste this link into your browser:
                </p>
                <p style="color: #dc2626; font-size: 14px; word-break: break-all; margin: 10px 0 0 0;">
                    ${resetUrl}
                </p>
                
                <div style="background: #fef2f2; border: 1px solid #fca5a5; border-radius: 6px; padding: 15px; margin: 25px 0;">
                    <p style="color: #991b1b; font-size: 14px; margin: 0; font-weight: 500;">
                        🔒 <strong>Security Notice:</strong> This password reset link will expire in 1 hour for your security. If you didn't request this reset, please ignore this email.
                    </p>
                </div>
            </div>
            
            <!-- Footer -->
            <div style="background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                <p style="color: #6b7280; font-size: 12px; margin: 0;">
                    © 2024 VistaPro. All rights reserved.
                </p>
                <p style="color: #9ca3af; font-size: 10px; margin: 5px 0 0 0;">
                    This is an automated message. Please do not reply to this email.
                </p>
            </div>
            
        </div>
    </body>
    </html>
  `;
}

module.exports = {
  sendOTPEmail,
  sendEmailUpdateReminder,
  generateVerificationToken,
  sendVerificationEmail,
  sendPasswordResetEmail
};