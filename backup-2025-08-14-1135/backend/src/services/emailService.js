// src/services/emailService.js
const { Resend } = require('resend');
const crypto = require('crypto');

// Only initialize Resend if API key is provided and not a dummy key
const resend = process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== 'dummy_key_for_local_dev' 
  ? new Resend(process.env.RESEND_API_KEY) 
  : null;

/**
 * Generate a secure verification token
 */
const generateVerificationToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Send email verification
 */
const sendVerificationEmail = async (email, token, firstName = 'User') => {
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Verify Your Email - Vistapro</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #C6A768; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .button { display: inline-block; padding: 12px 24px; background: #C6A768; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to Vistapro!</h1>
        </div>
        <div class="content">
          <h2>Hi ${firstName},</h2>
          <p>Thank you for registering with Vistapro. To complete your registration and access your account, please verify your email address by clicking the button below:</p>
          
          <a href="${verificationUrl}" class="button">Verify Email Address</a>
          
          <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
          <p><a href="${verificationUrl}">${verificationUrl}</a></p>
          
          <p>This verification link will expire in 24 hours for security reasons.</p>
          
          <p>If you didn't create an account with Vistapro, you can safely ignore this email.</p>
        </div>
        <div class="footer">
          <p>&copy; 2024 Vistapro. All rights reserved.</p>
          <p>This email was sent to ${email}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    // If Resend is not available (local development), just log the email
    if (!resend) {
      console.log('📧 [LOCAL DEV] Email verification would be sent to:', email);
      console.log('📧 [LOCAL DEV] Verification URL:', verificationUrl);
      return { id: 'local-dev-email-id' };
    }

    const { data, error } = await resend.emails.send({
      from: 'Vistapro <noreply@vistapro.ng>',
      to: [email],
      subject: 'Verify Your Email - Vistapro',
      html: htmlContent,
    });

    if (error) {
      console.error('Email sending failed:', error);
      throw new Error('Failed to send verification email');
    }

    return data;
  } catch (error) {
    console.error('Email service error:', error);
    throw error;
  }
};

/**
 * Send password reset email
 */
const sendPasswordResetEmail = async (email, token, firstName = 'User') => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Reset Your Password - Vistapro</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #C6A768; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .button { display: inline-block; padding: 12px 24px; background: #C6A768; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Password Reset Request</h1>
        </div>
        <div class="content">
          <h2>Hi ${firstName},</h2>
          <p>We received a request to reset your password for your Vistapro account. Click the button below to create a new password:</p>
          
          <a href="${resetUrl}" class="button">Reset Password</a>
          
          <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
          <p><a href="${resetUrl}">${resetUrl}</a></p>
          
          <p>This password reset link will expire in 1 hour for security reasons.</p>
          
          <p>If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
        </div>
        <div class="footer">
          <p>&copy; 2024 Vistapro. All rights reserved.</p>
          <p>This email was sent to ${email}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    // If Resend is not available (local development), just log the email
    if (!resend) {
      console.log('📧 [LOCAL DEV] Password reset email would be sent to:', email);
      console.log('📧 [LOCAL DEV] Reset URL:', resetUrl);
      return { id: 'local-dev-email-id' };
    }

    const { data, error } = await resend.emails.send({
      from: 'Vistapro <noreply@vistapro.ng>',
      to: [email],
      subject: 'Reset Your Password - Vistapro',
      html: htmlContent,
    });

    if (error) {
      console.error('Password reset email sending failed:', error);
      throw new Error('Failed to send password reset email');
    }

    return data;
  } catch (error) {
    console.error('Email service error:', error);
    throw error;
  }
};

module.exports = {
  generateVerificationToken,
  sendVerificationEmail,
  sendPasswordResetEmail,
};

