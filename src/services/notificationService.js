// src/services/notificationService.js
const { Pool } = require('pg');
const nodemailer = require('nodemailer');

class NotificationService {
  constructor() {
    this.pool = new Pool({
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
    });

    // Email transporter setup
    this.emailTransporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }

  // Send verification status update notification
  async sendVerificationStatusUpdate(userId, status, userRole) {
    try {
      // Get user details
      const userQuery = `
        SELECT u.unique_id, u.first_name, u.last_name, u.email, u.role,
               u.admin_id, u.super_admin_id
        FROM users u
        WHERE u.id = $1
      `;
      const userResult = await this.pool.query(userQuery, [userId]);
      
      if (userResult.rows.length === 0) {
        throw new Error('User not found');
      }

      const user = userResult.rows[0];
      const notificationData = {
        userId: user.unique_id,
        userRole: user.role,
        status: status,
        timestamp: new Date(),
        message: this.getVerificationMessage(status, user.role)
      };

      // Store notification in database
      await this.storeNotification(user.unique_id, 'verification_status_update', notificationData);

      // Send real-time notification via socket
      this.sendSocketNotification('verification_status_update', notificationData);

      // Send email notification for important status changes
      if (this.shouldSendEmail(status)) {
        await this.sendEmailNotification(user, status);
      }

      return { success: true, data: notificationData };
    } catch (error) {
      console.error('Error sending verification status update:', error);
      throw error;
    }
  }

  // Send verification reminder
  async sendVerificationReminder(marketerId, reminderType) {
    try {
      const userQuery = `
        SELECT u.unique_id, u.first_name, u.last_name, u.email, u.role,
               u.admin_id, u.super_admin_id
        FROM users u
        WHERE u.id = $1
      `;
      const userResult = await this.pool.query(userQuery, [marketerId]);
      
      if (userResult.rows.length === 0) {
        throw new Error('User not found');
      }

      const user = userResult.rows[0];
      const reminderData = {
        marketerId: user.unique_id,
        type: reminderType,
        timestamp: new Date(),
        message: this.getReminderMessage(reminderType)
      };

      // Store notification
      await this.storeNotification(user.unique_id, 'verification_reminder', reminderData);

      // Send real-time notification
      this.sendSocketNotification('verification_reminder', reminderData);

      // Send email reminder
      await this.sendEmailReminder(user, reminderType);

      return { success: true, data: reminderData };
    } catch (error) {
      console.error('Error sending verification reminder:', error);
      throw error;
    }
  }

  // Send verification approved notification
  async sendVerificationApproved(marketerId) {
    try {
      const userQuery = `
        SELECT u.unique_id, u.first_name, u.last_name, u.email, u.role
        FROM users u
        WHERE u.id = $1
      `;
      const userResult = await this.pool.query(userQuery, [marketerId]);
      
      if (userResult.rows.length === 0) {
        throw new Error('User not found');
      }

      const user = userResult.rows[0];
      const approvalData = {
        marketerId: user.unique_id,
        timestamp: new Date(),
        message: 'Your verification has been approved! You can now access all features.'
      };

      // Store notification
      await this.storeNotification(user.unique_id, 'verification_approved', approvalData);

      // Send real-time notification
      this.sendSocketNotification('verification_approved', approvalData);

      // Send congratulatory email
      await this.sendApprovalEmail(user);

      return { success: true, data: approvalData };
    } catch (error) {
      console.error('Error sending verification approved notification:', error);
      throw error;
    }
  }

  // Store notification in database
  async storeNotification(userId, type, data) {
    try {
      const query = `
        INSERT INTO verification_notifications (user_id, type, data, created_at)
        VALUES ($1, $2, $3, $4)
        RETURNING id
      `;
      const result = await this.pool.query(query, [
        userId,
        type,
        JSON.stringify(data),
        new Date()
      ]);
      return result.rows[0];
    } catch (error) {
      console.error('Error storing notification:', error);
      throw error;
    }
  }

  // Send socket notification
  sendSocketNotification(event, data) {
    // This would be implemented with your socket.io instance
    // For now, we'll just log it
    console.log(`Socket notification: ${event}`, data);
  }

  // Send email notification
  async sendEmailNotification(user, status) {
    try {
      const subject = this.getEmailSubject(status);
      const html = this.getEmailTemplate(user, status);

      await this.emailTransporter.sendMail({
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: subject,
        html: html
      });

      console.log(`Email sent to ${user.email} for status: ${status}`);
    } catch (error) {
      console.error('Error sending email notification:', error);
      throw error;
    }
  }

  // Send email reminder
  async sendEmailReminder(user, reminderType) {
    try {
      const subject = 'Verification Reminder - Action Required';
      const html = this.getReminderEmailTemplate(user, reminderType);

      await this.emailTransporter.sendMail({
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: subject,
        html: html
      });

      console.log(`Reminder email sent to ${user.email} for type: ${reminderType}`);
    } catch (error) {
      console.error('Error sending reminder email:', error);
      throw error;
    }
  }

  // Send approval email
  async sendApprovalEmail(user) {
    try {
      const subject = '🎉 Verification Approved - Welcome to Snippsta!';
      const html = this.getApprovalEmailTemplate(user);

      await this.emailTransporter.sendMail({
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: subject,
        html: html
      });

      console.log(`Approval email sent to ${user.email}`);
    } catch (error) {
      console.error('Error sending approval email:', error);
      throw error;
    }
  }

  // Helper methods
  getVerificationMessage(status, userRole) {
    const messages = {
      'physical_verification_pending': 'Physical verification is pending. Please wait for Admin to visit.',
      'physical_verification_completed': 'Physical verification completed. Awaiting phone verification.',
      'phone_verification_pending': 'Phone verification is pending. SuperAdmin will call you soon.',
      'phone_verification_completed': 'Phone verification completed. Awaiting MasterAdmin approval.',
      'masteradmin_approval_pending': 'Awaiting MasterAdmin approval. You will be notified soon.',
      'approved': 'Verification approved! You can now access all features.'
    };
    return messages[status] || 'Verification status updated.';
  }

  getReminderMessage(reminderType) {
    const messages = {
      'form_incomplete': 'Please complete your verification forms to continue.',
      'admin_visit_pending': 'Admin will visit for physical verification soon.',
      'phone_call_pending': 'SuperAdmin will call you for verification soon.'
    };
    return messages[reminderType] || 'Verification reminder.';
  }

  shouldSendEmail(status) {
    const emailStatuses = [
      'physical_verification_completed',
      'phone_verification_completed',
      'approved'
    ];
    return emailStatuses.includes(status);
  }

  getEmailSubject(status) {
    const subjects = {
      'physical_verification_completed': 'Physical Verification Completed',
      'phone_verification_completed': 'Phone Verification Completed',
      'approved': '🎉 Verification Approved - Welcome to Snippsta!'
    };
    return subjects[status] || 'Verification Status Update';
  }

  getEmailTemplate(user, status) {
    const name = `${user.first_name} ${user.last_name}`;
    const message = this.getVerificationMessage(status, user.role);
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Verification Status Update</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Verification Status Update</h1>
          </div>
          <div class="content">
            <h2>Hello ${name}!</h2>
            <p>${message}</p>
            <p>You can check your verification status anytime in your dashboard.</p>
            <a href="${process.env.FRONTEND_URL}/dashboard" class="button">View Dashboard</a>
          </div>
          <div class="footer">
            <p>Best regards,<br>The Snippsta Team</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  getReminderEmailTemplate(user, reminderType) {
    const name = `${user.first_name} ${user.last_name}`;
    const message = this.getReminderMessage(reminderType);
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Verification Reminder</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #f5576c; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Verification Reminder</h1>
          </div>
          <div class="content">
            <h2>Hello ${name}!</h2>
            <p>${message}</p>
            <p>Please complete the required steps to continue with your verification process.</p>
            <a href="${process.env.FRONTEND_URL}/dashboard" class="button">Complete Verification</a>
          </div>
          <div class="footer">
            <p>Best regards,<br>The Snippsta Team</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  getApprovalEmailTemplate(user) {
    const name = `${user.first_name} ${user.last_name}`;
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Verification Approved</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #4facfe; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Verification Approved!</h1>
          </div>
          <div class="content">
            <h2>Congratulations ${name}!</h2>
            <p>Your verification has been successfully approved. You now have full access to all Snippsta features!</p>
            <p>You can start:</p>
            <ul>
              <li>Placing orders</li>
              <li>Managing your inventory</li>
              <li>Tracking your sales</li>
              <li>Accessing your wallet</li>
            </ul>
            <a href="${process.env.FRONTEND_URL}/dashboard" class="button">Get Started</a>
          </div>
          <div class="footer">
            <p>Welcome to the Snippsta family!<br>The Snippsta Team</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

module.exports = new NotificationService();
