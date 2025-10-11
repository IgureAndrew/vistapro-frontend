// src/services/emailService.js
// Email service using Resend API for OTP and notifications

const { Resend } = require('resend');

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Send OTP email to user
 */
async function sendOTPEmail(userEmail, userName, otpCode) {
  try {
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
                <a href="https://www.vistapro.ng/login" style="background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
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

module.exports = {
  sendOTPEmail,
  sendEmailUpdateReminder
};