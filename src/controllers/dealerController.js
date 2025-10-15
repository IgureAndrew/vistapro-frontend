// src/controllers/dealerController.js
const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');
const uploadToCloudinary = require('../utils/uploadToCloudinary');

/**
 * getAccount - Retrieves current dealer's account info (standardized).
 */
async function getAccount(req, res, next) {
  try {
    const userId = req.user.id; // From JWT token
    
    // Get user account details
    const userQuery = `
      SELECT 
        id, unique_id, email, phone, first_name, last_name, profile_image, gender,
        role, location, business_name, business_address, bank_details, 
        cac_certificate, created_at, updated_at
      FROM users 
      WHERE id = $1 AND role = 'Dealer'
    `;
    
    const result = await pool.query(userQuery, [userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Dealer account not found' 
      });
    }
    
    const account = result.rows[0];
    
    res.json({ 
      success: true, 
      account: {
        id: account.id,
        unique_id: account.unique_id,
        email: account.email,
        phone: account.phone,
        displayName: account.first_name || account.last_name ? `${account.first_name || ''} ${account.last_name || ''}`.trim() : '',
        profile_image: account.profile_image,
        gender: account.gender,
        role: account.role,
        location: account.location,
        business_name: account.business_name,
        business_address: account.business_address,
        bank_details: account.bank_details,
        cac_certificate: account.cac_certificate,
        createdAt: account.created_at,
        updatedAt: account.updated_at
      }
    });
    
  } catch (error) {
    console.error('Error fetching Dealer account:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch account details',
      error: error.message 
    });
  }
}

/**
 * updateAccount - Updates dealer's account info (standardized).
 */
async function updateAccount(req, res, next) {
  try {
    const userId = req.user.id; // From JWT token
    const { email, phone, displayName, profile_image, business_name, business_address, bank_details } = req.body;
    
    // Validate required fields
    if (!email || !phone || !displayName) {
      return res.status(400).json({
        success: false,
        message: 'Email, phone, and display name are required'
      });
    }
    
    // Check if email is already taken by another user
    const emailCheckQuery = `
      SELECT id FROM users 
      WHERE email = $1 AND id != $2 AND role = 'Dealer'
    `;
    const emailCheck = await pool.query(emailCheckQuery, [email, userId]);
    
    if (emailCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Email is already taken by another Dealer'
      });
    }

    // Handle image data - upload to Cloudinary for lasting solution
    let profileImageData = null;
    
    if (req.file) {
      // File upload via multer - upload to Cloudinary
      try {
        console.log('🖼️ Uploading file to Cloudinary for Dealer:', userId);
        console.log('📁 File details:', {
          fieldname: req.file.fieldname,
          originalname: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size,
          bufferLength: req.file.buffer ? req.file.buffer.length : 'undefined'
        });
        
        if (!req.file.buffer) {
          console.error('❌ File buffer is undefined');
          return res.status(400).json({ message: 'File buffer is missing' });
        }
        
        const result = await uploadToCloudinary(req.file.buffer, {
          folder: 'vistapro/profile-images',
          public_id: `profile_${userId}_${Date.now()}`,
          resource_type: 'image',
          transformation: [
            { width: 300, height: 300, crop: 'fill', gravity: 'face' },
            { quality: 'auto' }
          ]
        });
        
        profileImageData = result.secure_url;
        console.log('✅ Profile image uploaded to Cloudinary:', result.secure_url);
      } catch (error) {
        console.error('❌ Error uploading to Cloudinary:', error);
        return res.status(400).json({ message: 'Failed to upload image: ' + error.message });
      }
    } else if (req.body.profile_image && req.body.profile_image.startsWith('data:image/')) {
      // Base64 fallback - upload to Cloudinary
      try {
        console.log('🖼️ Uploading Base64 image to Cloudinary for Dealer:', userId);
        const base64Data = req.body.profile_image.replace(/^data:image\/[a-z]+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        
        const result = await uploadToCloudinary(buffer, {
          folder: 'vistapro/profile-images',
          public_id: `profile_${userId}_${Date.now()}`,
          resource_type: 'image',
          transformation: [
            { width: 300, height: 300, crop: 'fill', gravity: 'face' },
            { quality: 'auto' }
          ]
        });
        
        profileImageData = result.secure_url;
        console.log('✅ Base64 image uploaded to Cloudinary:', result.secure_url);
      } catch (error) {
        console.error('❌ Error uploading Base64 to Cloudinary:', error);
        return res.status(400).json({ message: 'Failed to upload image' });
      }
    }
    
    // Split displayName into first_name and last_name
    const nameParts = displayName.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Update user account
    const updateQuery = `
      UPDATE users 
      SET 
        email = $1,
        phone = $2,
        first_name = $3,
        last_name = $4,
        profile_image = $5,
        business_name = $6,
        business_address = $7,
        bank_details = $8,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $9 AND role = 'Dealer'
      RETURNING id, unique_id, email, phone, first_name, last_name, profile_image, role, location, 
                business_name, business_address, bank_details, updated_at
    `;
    
    const result = await pool.query(updateQuery, [email, phone, firstName, lastName, profileImageData, business_name, business_address, bank_details, userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Dealer account not found'
      });
    }
    
    const updatedAccount = result.rows[0];
    
    res.json({
      success: true,
      message: 'Account updated successfully',
      account: {
        id: updatedAccount.id,
        unique_id: updatedAccount.unique_id,
        email: updatedAccount.email,
        phone: updatedAccount.phone,
        displayName: updatedAccount.first_name || updatedAccount.last_name ? `${updatedAccount.first_name || ''} ${updatedAccount.last_name || ''}`.trim() : '',
        profile_image: updatedAccount.profile_image,
        role: updatedAccount.role,
        location: updatedAccount.location,
        business_name: updatedAccount.business_name,
        business_address: updatedAccount.business_address,
        bank_details: updatedAccount.bank_details,
        updatedAt: updatedAccount.updated_at
      }
    });
    
  } catch (error) {
    console.error('Error updating Dealer account:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update account',
      error: error.message
    });
  }
}

/**
 * getAccountSettings - Retrieves current dealer's account info (legacy).
 * Returns business_name, business_address, bank_details, email, phone,
 * location, cac_certificate and profile_image.
 */
async function getAccountSettings(req, res, next) {
  try {
    const dealerUniqueId = req.user.unique_id;
    if (!dealerUniqueId) {
      return res.status(400).json({ message: "Dealer unique ID not available." });
    }

    const { rows } = await pool.query(
      `
      SELECT
        business_name,
        business_address,
        bank_details,
        email,
        phone,
        location,
        cac_certificate,
        profile_image
      FROM users
      WHERE unique_id = $1
      `,
      [dealerUniqueId]
    );

    if (!rows.length) {
      return res.status(404).json({ message: "User not found." });
    }

    res.json({ settings: rows[0] });
  } catch (err) {
    next(err);
  }
}

/**
 * updateAccountSettings - Partially updates dealer’s profile.
 * Fields in req.body:
 *   business_name, business_address, bank_details,
 *   email, phone, location,
 *   newPassword, confirmNewPassword
 *
 * Files via Multer in req.files:
 *   cacCertificate, profileImage
 */
async function updateAccountSettings(req, res, next) {
  try {
    const dealerUniqueId = req.user.unique_id;
    if (!dealerUniqueId) {
      return res.status(400).json({ message: "Dealer unique ID not available." });
    }

    const {
      business_name,
      business_address,
      bank_details,
      email,
      phone,
      location,
      newPassword,
      confirmNewPassword,
    } = req.body;

    let clauses = [];
    let values = [];
    let idx = 1;

    // 1) Handle password change
    if (newPassword) {
      if (!confirmNewPassword || newPassword !== confirmNewPassword) {
        return res.status(400).json({ message: "New password and confirmation do not match." });
      }
      const hash = await bcrypt.hash(newPassword, 10);
      clauses.push(`password = $${idx++}`);
      values.push(hash);
    }

    // 2) Other optional fields
    if (business_name) {
      clauses.push(`business_name = $${idx++}`);
      values.push(business_name);
    }
    if (business_address) {
      clauses.push(`business_address = $${idx++}`);
      values.push(business_address);
    }
    if (bank_details) {
      clauses.push(`bank_details = $${idx++}`);
      values.push(bank_details);
    }
    if (email) {
      clauses.push(`email = $${idx++}`);
      values.push(email);
    }
    if (phone) {
      clauses.push(`phone = $${idx++}`);
      values.push(phone);
    }
    if (location) {
      clauses.push(`location = $${idx++}`);
      values.push(location);
    }

    // 3) File uploads
    if (req.files?.cacCertificate?.[0]) {
      clauses.push(`cac_certificate = $${idx++}`);
      values.push(req.files.cacCertificate[0].path);
    }
    if (req.files?.profileImage?.[0]) {
      clauses.push(`profile_image = $${idx++}`);
      values.push(req.files.profileImage[0].path);
    }

    if (!clauses.length) {
      return res.status(400).json({ message: "No fields provided for update." });
    }

    // 4) Add updated_at and unique_id for WHERE
    clauses.push(`updated_at = NOW()`);
    values.push(dealerUniqueId);

    const query = `
      UPDATE users
         SET ${clauses.join(', ')}
       WHERE unique_id = $${idx}
       RETURNING
         unique_id,
         business_name,
         business_address,
         bank_details,
         email,
         phone,
         location,
         cac_certificate,
         profile_image,
         updated_at
    `;

    const { rows } = await pool.query(query, values);

    if (!rows.length) {
      return res.status(404).json({ message: "User not found." });
    }

    res.json({ message: "Account updated successfully.", dealer: rows[0] });
  } catch (err) {
    next(err);
  }
}

/**
 * uploadInventory - Allows a Dealer to add an inventory item.
 */
async function uploadInventory(req, res, next) {
  try {
    const dealerId = req.user.id;
    const { device_name, device_model, device_imei } = req.body;
    if (!device_name || !device_model) {
      return res.status(400).json({ message: 'Device name and model are required.' });
    }
    const { rows } = await pool.query(
      `
      INSERT INTO dealer_inventory (dealer_id, device_name, device_model, device_imei, uploaded_at)
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING *
      `,
      [dealerId, device_name, device_model, device_imei]
    );
    res.status(201).json({ message: 'Inventory item uploaded successfully.', inventory: rows[0] });
  } catch (error) {
    next(error);
  }
}

/**
 * getOrderHistory - Retrieves the order history for the dealer.
 */
async function getOrderHistory(req, res, next) {
  try {
    const dealerId = req.user.id;
    const { rows } = await pool.query(
      `
      SELECT *
        FROM orders
       WHERE dealer_id = $1
       ORDER BY created_at DESC
      `,
      [dealerId]
    );
    res.json({ message: 'Order history retrieved successfully.', orders: rows });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAccount,
  updateAccount,
  getAccountSettings,
  updateAccountSettings,
  uploadInventory,
  getOrderHistory,
};
