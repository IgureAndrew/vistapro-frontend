const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');
const { pool } = require('../config/database');
const { createUser } = require('../models/userModel');
const { generateUniqueID } = require('../utils/uniqueId');
const logActivity = require('../utils/logActivity');

// Version marker for deployment - enum values fixed
console.log('🚀 Backend Version 2.2 - Stock pickup enum values fixed');

// Notification function for marketer assignment
const notifyMarketerAssignment = async (marketerId, adminId) => {
  try {
    // Get marketer details
    const marketerResult = await pool.query('SELECT first_name, last_name, email FROM users WHERE id = $1', [marketerId]);
    const adminResult = await pool.query('SELECT first_name, last_name FROM users WHERE id = $1', [adminId]);
    
    if (marketerResult.rows.length > 0 && adminResult.rows.length > 0) {
      const marketer = marketerResult.rows[0];
      const admin = adminResult.rows[0];
      
      console.log(`🔔 NOTIFICATION for Marketer ${marketerId}: You have been assigned to Admin ${admin.first_name} ${admin.last_name}. Your account is locked until verification is complete. Please fill out the verification forms.`);
      
      // TODO: Implement actual socket notification
      // await sendSocketNotification(marketerId, {
      //   type: 'marketer_assigned',
      //   message: `You have been assigned to Admin ${admin.first_name} ${admin.last_name}. You can now start verification.`,
      //   adminName: `${admin.first_name} ${admin.last_name}`
      // });
    }
  } catch (error) {
    console.error('Error notifying marketer assignment:', error);
    throw error;
  }
};

// Notification function for admin when marketer is assigned
const notifyAdminAssignment = async (adminId, marketerId) => {
  try {
    // Get admin and marketer details
    const adminResult = await pool.query('SELECT first_name, last_name, email FROM users WHERE id = $1', [adminId]);
    const marketerResult = await pool.query('SELECT first_name, last_name, email FROM users WHERE id = $1', [marketerId]);
    
    if (adminResult.rows.length > 0 && marketerResult.rows.length > 0) {
      const admin = adminResult.rows[0];
      const marketer = marketerResult.rows[0];
      
      console.log(`🔔 NOTIFICATION for Admin ${adminId}: New marketer ${marketer.first_name} ${marketer.last_name} has been assigned to you.`);
      
      // TODO: Implement actual socket notification and database notification
      // await sendSocketNotification(adminId, {
      //   type: 'marketer_assigned_to_admin',
      //   message: `New marketer ${marketer.first_name} ${marketer.last_name} has been assigned to you.`,
      //   marketerName: `${marketer.first_name} ${marketer.last_name}`,
      //   marketerId: marketerId
      // });
      
      // Store notification in database for persistence
      // await pool.query(`
      //   INSERT INTO notifications (user_id, type, title, message, data, created_at)
      //   VALUES ($1, $2, $3, $4, $5, NOW())
      // `, [
      //   adminId,
      //   'marketer_assigned',
      //   'New Marketer Assigned',
      //   `New marketer ${marketer.first_name} ${marketer.last_name} has been assigned to you.`,
      //   JSON.stringify({ marketerId, marketerName: `${marketer.first_name} ${marketer.last_name}` })
      // ]);
    }
  } catch (error) {
    console.error('Error notifying admin assignment:', error);
    throw error;
  }
};

// Updated password regex: Minimum 12 characters, at least one letter, one digit, and one special character.
const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{12,}$/;

/**
 * registerMasterAdmin - Registers a new Master Admin using a secret key.
 */
const registerMasterAdmin = async (req, res, next) => {
  try {
    const { secretKey, first_name, last_name, gender, email, password } = req.body;
    if (secretKey !== process.env.MASTER_ADMIN_SECRET_KEY) {
      return res.status(403).json({ message: 'Invalid secret key.' });
    }
    if (!first_name || !last_name || !gender || !email || !password) {
      return res.status(400).json({ message: 'All required fields must be provided.' });
    }
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        message: 'Password must be at least 12 characters with letters, numbers, and special characters.'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const unique_id = await generateUniqueID('MasterAdmin');
    const newUser = await createUser({
      unique_id,
      first_name,
      last_name,
      gender,
      email,
      password: hashedPassword,
      role: 'MasterAdmin',
      bank_name: null,
      account_number: null,
      account_name: null,
      location: null,
      business_name: null,
      business_address: null,
      business_account_name: null,
      business_account_number: null,
      registration_certificate_url: null
    });

    await logActivity(
      req.user.id,
      `${req.user.first_name} ${req.user.last_name}`,
      'Register Master Admin',
      'MasterAdmin',
      newUser.unique_id
    );

    return res.status(201).json({
      message: 'Master Admin registered successfully.',
      user: newUser
    });
  } catch (error) {
    next(error);
  }
};

/**
 * registerSuperAdmin - Registers a new Super Admin.
 */
const registerSuperAdmin = async (req, res, next) => {
  try {
    const {
      first_name, last_name, gender,
      email, password, bank_name,
      account_number, account_name, location
    } = req.body;

    if (
      !first_name || !last_name || !gender ||
      !email || !password ||
      !bank_name || !account_number || !account_name || !location
    ) {
      return res.status(400).json({ message: 'All required fields must be provided.' });
    }
    if (!/^\d{10}$/.test(account_number)) {
      return res.status(400).json({ message: 'Account number must be exactly 10 digits.' });
    }
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        message: 'Password must be at least 12 characters with letters, numbers, and special characters.'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const unique_id = await generateUniqueID('SuperAdmin');
    const newSuperAdmin = await createUser({
      unique_id,
      first_name,
      last_name,
      gender,
      email,
      password: hashedPassword,
      bank_name,
      account_number,
      account_name,
      location,
      role: 'SuperAdmin',
      business_name: null,
      business_address: null,
      business_account_name: null,
      business_account_number: null,
      registration_certificate_url: null
    });

    await logActivity(
      req.user.id,
      `${req.user.first_name} ${req.user.last_name}`,
      'Register Super Admin',
      'SuperAdmin',
      newSuperAdmin.unique_id
    );

    return res.status(201).json({
      message: 'Super Admin registered successfully. Login details have been sent to the email.',
      superAdmin: newSuperAdmin
    });
  } catch (error) {
    next(error);
  }
};

/**
 * updateProfile - Updates the Master Admin profile, including the phone field.
 */
const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { email, gender, newPassword, phone, profileImage } = req.body;
    let hashedPassword = null;

    if (newPassword) {
      hashedPassword = await bcrypt.hash(newPassword, 10);
    }

    // Handle image data - convert Base64 to file or use existing file
    let profileImageData = null;
    if (profileImage && profileImage.startsWith('data:image/')) {
      try {
        // Convert Base64 to file
        const base64Data = profileImage.replace(/^data:image\/[a-z]+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        
        // Generate unique filename
        const timestamp = Date.now();
        const fileExtension = profileImage.split(';')[0].split('/')[1];
        const filename = `profile_${userId}_${timestamp}.${fileExtension}`;
        const filepath = path.join(__dirname, '../uploads', filename);
        
        // Ensure uploads directory exists
        const uploadsDir = path.join(__dirname, '../uploads');
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }
        
        // Write file
        fs.writeFileSync(filepath, buffer);
        profileImageData = filename;
        console.log('🖼️ Converted Base64 to file:', filename);
      } catch (error) {
        console.error('❌ Error converting Base64 to file:', error);
        return res.status(400).json({ message: 'Failed to process image' });
      }
    } else if (req.file) {
      // Legacy file upload handling
      profileImageData = req.file.filename;
      console.log('🖼️ Received file upload for user:', userId);
    }

    const query = `
      UPDATE users
      SET email          = COALESCE($1, email),
          gender         = COALESCE($2, gender),
          phone          = COALESCE($3, phone),
          profile_image  = COALESCE($4, profile_image),
          password       = COALESCE($5, password),
          updated_at     = NOW()
      WHERE id = $6
      RETURNING *
    `;
    const values = [email, gender, phone, profileImageData, hashedPassword, userId];
    const { rows } = await pool.query(query, values);

    await logActivity(
      userId,
      `${req.user.first_name} ${req.user.last_name}`,
      'Update Profile',
      'MasterAdmin',
      req.user.unique_id
    );

    return res.status(200).json({
      message: 'Master Admin profile updated successfully.',
      user: rows[0]
    });
  } catch (error) {
    next(error);
  }
};

/**
 * addUser - Allows Master Admin to create a new user.
 */
const addUser = async (req, res, next) => {
  try {
    const { role } = req.body;
    let unique_id;

    switch (role) {
      case 'Dealer':     unique_id = await generateUniqueID('Dealer');     break;
      case 'Admin':      unique_id = await generateUniqueID('Admin');      break;
      case 'Marketer':   unique_id = await generateUniqueID('Marketer');   break;
      case 'SuperAdmin': unique_id = await generateUniqueID('SuperAdmin'); break;
      default:           unique_id = await generateUniqueID('User');
    }

    const saltRounds = 10;
    let hashedPassword, userData = {};

    if (role === 'Dealer') {
      const {
        first_name, last_name, gender,
        email, password,
        registered_business_name,
        registered_business_address, location
      } = req.body;

      if (
        !first_name || !last_name || !gender ||
        !email || !password ||
        !registered_business_name ||
        !registered_business_address || !location
      ) {
        return res.status(400).json({ message: 'All dealer fields are required.' });
      }
      if (!passwordRegex.test(password)) {
        return res.status(400).json({
          message: 'Password must be at least 12 characters with letters, numbers, and special characters.'
        });
      }
      if (!req.file) {
        return res.status(400).json({ message: 'Registration certificate (CAC) is required and must be a PDF.' });
      }
      if (req.file.mimetype !== 'application/pdf') {
        return res.status(400).json({ message: 'Registration certificate must be PDF.' });
      }

      hashedPassword = await bcrypt.hash(password, saltRounds);
      userData = {
        unique_id,
        first_name,
        last_name,
        gender,
        email,
        password: hashedPassword,
        role,
        location,
        business_name: registered_business_name,
        business_address: registered_business_address,
        business_account_name: null,
        business_account_number: null,
        bank_name: null,
        account_number: null,
        account_name: null,
        registration_certificate_url: req.file.path
      };
    } else {
      const {
        first_name, last_name, gender,
        email, password,
        bank_name, account_number,
        account_name, location
      } = req.body;

      if (
        !first_name || !last_name || !gender ||
        !email || !password ||
        !bank_name || !account_number ||
        !account_name || !location
      ) {
        return res.status(400).json({ message: 'All required fields must be provided.' });
      }
      if (!/^\d{10}$/.test(account_number)) {
        return res.status(400).json({ message: 'Account number must be exactly 10 digits.' });
      }
      if (!passwordRegex.test(password)) {
        return res.status(400).json({
          message: 'Password must be at least 12 characters with letters, numbers, and special characters.'
        });
      }

      hashedPassword = await bcrypt.hash(password, saltRounds);
      userData = {
        unique_id,
        first_name,
        last_name,
        gender,
        email,
        password: hashedPassword,
        role,
        location,
        bank_name,
        account_number,
        account_name,
        business_name: null,
        business_address: null,
        business_account_name: null,
        business_account_number: null,
        registration_certificate_url: null
      };
    }

    const newUser = await createUser(userData);

    if (newUser.role === 'Marketer') {
      await pool.query(
        `INSERT INTO wallets (user_unique_id) VALUES ($1)`,
        [newUser.unique_id]
      );
    }

    await logActivity(
      req.user.id,
      `${req.user.first_name} ${req.user.last_name}`,
      'Create User',
      newUser.role,
      newUser.unique_id
    );

    return res.status(201).json({
      message: 'User created successfully',
      user: newUser
    });
  } catch (error) {
    if (error.code === '23505' && error.constraint === 'users_email_key') {
      return res.status(409).json({ message: 'Email already exists' });
    }
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * updateUser - Updates a user specified by :id.
 */
const updateUser = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id, 10);
    const {
      first_name, last_name, email,
      bank_name, account_number,
      role, location, phone, profile_image
    } = req.body;

    const clauses = [];
    const values = [];
    let idx = 1;

    if (first_name)      { clauses.push(`first_name = $${idx}`);      values.push(first_name);      idx++; }
    if (last_name)       { clauses.push(`last_name = $${idx}`);       values.push(last_name);       idx++; }
    if (email)           { clauses.push(`email = $${idx}`);           values.push(email);           idx++; }
    if (bank_name)       { clauses.push(`bank_name = $${idx}`);       values.push(bank_name);       idx++; }
    if (account_number)  { clauses.push(`account_number = $${idx}`);  values.push(account_number);  idx++; }
    if (role)            { clauses.push(`role = $${idx}`);            values.push(role);            idx++; }
    if (location)        { clauses.push(`location = $${idx}`);        values.push(location);        idx++; }
    if (phone)           { clauses.push(`phone = $${idx}`);           values.push(phone);           idx++; }
    if (profile_image)   { clauses.push(`profile_image = $${idx}`);   values.push(profile_image);   idx++; }

    if (clauses.length === 0) {
      return res.status(400).json({ message: 'No fields provided for update.' });
    }

    clauses.push(`updated_at = NOW()`);
    const sql = `
      UPDATE users
         SET ${clauses.join(', ')}
       WHERE id = $${idx}
       RETURNING *
    `;
    values.push(userId);
    const { rowCount, rows } = await pool.query(sql, values);

    if (rowCount === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }

    await logActivity(
      req.user.id,
      `${req.user.first_name} ${req.user.last_name}`,
      'Update User',
      'User',
      rows[0].unique_id
    );

    return res.json({
      message: 'User updated successfully.',
      user: rows[0]
    });
  } catch (error) {
    if (error.code === '23505' && error.constraint === 'users_email_key') {
      return res.status(409).json({ message: 'That email is already in use.' });
    }
    next(error);
  }
};

/**
 * deleteUser - Deletes a user specified by :id with support for both soft and hard delete.
 * Query parameter 'permanent=true' will perform hard delete, otherwise soft delete is used.
 */
const deleteUser = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id, 10);
    const isPermanent = req.query.permanent === 'true';
    const currentUserId = req.user.id;

    // Validate user ID
    if (isNaN(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    // Check if user exists and is not already deleted
    const userCheck = await pool.query(
      `SELECT * FROM users WHERE id = $1 AND deleted = FALSE`,
      [userId]
    );

    if (userCheck.rowCount === 0) {
      return res.status(404).json({ message: 'User not found or already deleted' });
    }

    const userToDelete = userCheck.rows[0];

    // Prevent self-deletion
    if (userId === currentUserId) {
      return res.status(400).json({ message: 'You cannot delete your own account' });
    }

    // Prevent deletion of MasterAdmin accounts
    if (userToDelete.role === 'MasterAdmin') {
      return res.status(403).json({ message: 'MasterAdmin accounts cannot be deleted' });
    }

    let result;
    let deleteType;

    if (isPermanent) {
      // Hard delete with cascade
      try {
        const deleteResult = await pool.query(
      `DELETE FROM users WHERE id = $1 RETURNING *`,
      [userId]
    );

        if (deleteResult.rowCount === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

        result = deleteResult.rows[0];
        deleteType = 'permanent';
      } catch (deleteError) {
        // If hard delete fails due to foreign key constraints, fall back to soft delete
        console.warn('Hard delete failed, falling back to soft delete:', deleteError.message);
        
        const softDeleteResult = await pool.query(
          `UPDATE users SET deleted = TRUE, deleted_at = NOW(), deleted_by = $1 WHERE id = $2 RETURNING *`,
          [currentUserId, userId]
        );

        result = softDeleteResult.rows[0];
        deleteType = 'soft (fallback)';
      }
    } else {
      // Soft delete
      const softDeleteResult = await pool.query(
        `UPDATE users SET deleted = TRUE, deleted_at = NOW(), deleted_by = $1 WHERE id = $2 RETURNING *`,
        [currentUserId, userId]
      );

      result = softDeleteResult.rows[0];
      deleteType = 'soft';
    }

    // Log the activity
    await logActivity(
      currentUserId,
      `${req.user.first_name} ${req.user.last_name}`,
      `Delete User (${deleteType})`,
      'User',
      result.unique_id
    );

    return res.json({
      message: `User ${deleteType} deleted successfully`,
      user: result,
      deleteType: deleteType
    });

  } catch (error) {
    console.error('Delete user error:', error);
    next(error);
  }
};

/**
 * restoreUser - Restores a soft-deleted user specified by :id.
 */
const restoreUser = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id, 10);
    const currentUserId = req.user.id;

    // Validate user ID
    if (isNaN(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    // Check if user exists and is soft-deleted
    const userCheck = await pool.query(
      `SELECT * FROM users WHERE id = $1 AND deleted = TRUE`,
      [userId]
    );

    if (userCheck.rowCount === 0) {
      return res.status(404).json({ message: 'User not found or not deleted' });
    }

    const userToRestore = userCheck.rows[0];

    // Restore the user
    const restoreResult = await pool.query(
      `UPDATE users SET deleted = FALSE, deleted_at = NULL, deleted_by = NULL WHERE id = $1 RETURNING *`,
      [userId]
    );

    const restoredUser = restoreResult.rows[0];

    // Log the activity
    await logActivity(
      currentUserId,
      `${req.user.first_name} ${req.user.last_name}`,
      'Restore User',
      'User',
      restoredUser.unique_id
    );

    return res.json({
      message: 'User restored successfully',
      user: restoredUser
    });

  } catch (error) {
    console.error('Restore user error:', error);
    next(error);
  }
};

/**
 * lockUser - Locks a user account (Master Admin only).
 */
const lockUser = async (req, res, next) => {
  try {
    if (req.user.role !== 'MasterAdmin') {
      return res.status(403).json({ message: 'Only a Master Admin can lock user accounts.' });
    }
    const userId = req.params.id;
    const { rowCount, rows } = await pool.query(
      `UPDATE users SET locked = true WHERE id = $1 RETURNING *`,
      [userId]
    );
    if (rowCount === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }

    await logActivity(
      req.user.id,
      `${req.user.first_name} ${req.user.last_name}`,
      'Lock User',
      'User',
      rows[0].unique_id
    );

    return res.status(200).json({
      message: 'User locked successfully',
      user: rows[0]
    });
  } catch (error) {
    next(error);
  }
};

/**
 * unlockUser - Unlocks a user account (Master Admin only).
 */
const unlockUser = async (req, res, next) => {
  try {
    if (req.user.role !== 'MasterAdmin') {
      return res.status(403).json({ message: 'Only a Master Admin can unlock user accounts.' });
    }
    const userId = req.params.id;
    const { rowCount, rows } = await pool.query(
      `UPDATE users SET locked = false WHERE id = $1 RETURNING *`,
      [userId]
    );
    if (rowCount === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }

    await logActivity(
      req.user.id,
      `${req.user.first_name} ${req.user.last_name}`,
      'Unlock User',
      'User',
      rows[0].unique_id
    );

    return res.status(200).json({
      message: 'User unlocked successfully',
      user: rows[0]
    });
  } catch (error) {
    next(error);
  }
};

/**
 * getUsers - Retrieves users from the database.
 */
const getUsers = async (req, res, next) => {
  try {
    const { 
      q, 
      role, 
      status, 
      location, 
      sort = 'id', 
      order = 'desc', 
      page = 1, 
      limit = 20, 
      includeDeleted 
    } = req.query;
    
    let query = 'SELECT * FROM users';
    const values = [];
    const conditions = [];
    let paramCount = 0;

    // Check if deleted column exists and handle accordingly
    const columnCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'deleted'
    `);
    
    const hasDeletedColumn = columnCheck.rows.length > 0;
    
    // Only filter by deleted column if it exists
    if (hasDeletedColumn && includeDeleted !== 'true') {
      conditions.push('(deleted = FALSE OR deleted IS NULL)');
    }

    // Search query (q) - search in name, email, unique_id
    if (q) {
      paramCount++;
      conditions.push(`(
        first_name ILIKE $${paramCount} OR 
        last_name ILIKE $${paramCount} OR 
        email ILIKE $${paramCount} OR 
        unique_id ILIKE $${paramCount}
      )`);
      values.push(`%${q}%`);
    }

    // Role filter
    if (role) {
      paramCount++;
      conditions.push(`role = $${paramCount}`);
      values.push(role);
    }

    // Status filter (locked/unlocked)
    if (status) {
      if (status === 'active') {
        conditions.push('locked = FALSE');
      } else if (status === 'locked') {
        conditions.push('locked = TRUE');
      }
    }

    // Location filter
    if (location) {
      paramCount++;
      conditions.push(`location = $${paramCount}`);
      values.push(location);
    }

    // Build WHERE clause
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    // Sorting
    const validSortFields = ['id', 'first_name', 'last_name', 'email', 'role', 'location', 'created_at'];
    const sortField = validSortFields.includes(sort) ? sort : 'id';
    const sortOrder = order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';
    query += ` ORDER BY ${sortField} ${sortOrder}`;

    // Pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    paramCount++;
    query += ` LIMIT $${paramCount}`;
    values.push(parseInt(limit));
    
    paramCount++;
    query += ` OFFSET $${paramCount}`;
    values.push(offset);

    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) FROM users';
    if (conditions.length > 0) {
      countQuery += ' WHERE ' + conditions.join(' AND ');
    }
    const countValues = values.slice(0, -2); // Remove limit and offset for count query
    
    const [usersResult, countResult] = await Promise.all([
      pool.query(query, values),
      pool.query(countQuery, countValues)
    ]);

    const total = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(total / parseInt(limit));

    return res.status(200).json({ 
      users: usersResult.rows,
      pagination: {
        total,
        page: parseInt(page),
        pages: totalPages,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * getUserSummary - Provides a summary of user activities.
 */
const getUserSummary = async (req, res, next) => {
  try {
    const totalResult = await pool.query('SELECT COUNT(*) FROM users');
    const roleResult = await pool.query('SELECT role, COUNT(*) AS count FROM users GROUP BY role');
    const lockedResult = await pool.query('SELECT COUNT(*) FROM users WHERE locked = true');

    return res.status(200).json({
      totalUsers: parseInt(totalResult.rows[0].count, 10),
      usersByRole: roleResult.rows,
      lockedUsers: parseInt(lockedResult.rows[0].count, 10)
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Debug endpoint to check users table state
 */
const debugUsersTable = async (req, res, next) => {
  try {
    if (req.user.role !== 'MasterAdmin') {
      return res.status(403).json({ message: 'Only MasterAdmin can access debug endpoint' });
    }

    // Check if deleted column exists
    const columnCheck = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name IN ('deleted', 'deleted_at', 'deleted_by')
      ORDER BY column_name
    `);

    // Get total user count
    const totalResult = await pool.query('SELECT COUNT(*) FROM users');
    
    // Get deleted column stats if it exists
    let deletedStats = null;
    if (columnCheck.rows.some(row => row.column_name === 'deleted')) {
      const deletedResult = await pool.query(`
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN deleted = TRUE THEN 1 END) as deleted_true,
          COUNT(CASE WHEN deleted = FALSE THEN 1 END) as deleted_false,
          COUNT(CASE WHEN deleted IS NULL THEN 1 END) as deleted_null
        FROM users
      `);
      deletedStats = deletedResult.rows[0];
    }

    // Get sample users
    const sampleResult = await pool.query(`
      SELECT id, unique_id, first_name, last_name, role, deleted, deleted_at
      FROM users 
      ORDER BY id 
      LIMIT 10
    `);

    return res.status(200).json({
      columns: columnCheck.rows,
      totalUsers: parseInt(totalResult.rows[0].count, 10),
      deletedStats,
      sampleUsers: sampleResult.rows
    });
  } catch (error) {
    next(error);
  }
};

/**
 * getDashboardSummary - Provides a summary of the activities on the dashboard overview with previous period comparisons.
 */
const getDashboardSummary = async (req, res, next) => {
  try {
    // Get date range parameters (default to last 30 days vs previous 30 days)
    const { period = '30d' } = req.query;
    let daysBack, periodName;
    
    switch (period) {
      case '7d':
        daysBack = 7;
        periodName = 'last 7 days';
        break;
      case '30d':
        daysBack = 30;
        periodName = 'last 30 days';
        break;
      case '90d':
        daysBack = 90;
        periodName = 'last 90 days';
        break;
      default:
        daysBack = 30;
        periodName = 'last 30 days';
    }

    const now = new Date();
    const currentPeriodStart = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000));
    const previousPeriodStart = new Date(now.getTime() - (daysBack * 2 * 24 * 60 * 60 * 1000));
    const previousPeriodEnd = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000));

    // Current period queries
    console.log('🔍 [DEBUG] Starting dashboard summary queries...');
    console.log('🔍 [DEBUG] Database connection string:', process.env.DATABASE_URL ? 'PRODUCTION' : 'LOCAL');
    console.log('🔍 [DEBUG] Version 2.1 - Email verification fix deployed');
    
    const currentQueries = await Promise.all([
      // Total Users (all time)
      pool.query('SELECT COUNT(*) AS total FROM users').then(result => {
        console.log('🔍 [DEBUG] Total users query result:', result.rows[0]);
        return result;
      }),
      
      // Total Users in current period
      pool.query('SELECT COUNT(*) AS total FROM users WHERE created_at >= $1', [currentPeriodStart]),
      
      // Total Orders (all time)
      pool.query('SELECT COUNT(*) AS total FROM orders'),
      
      // Total Orders in current period
      pool.query('SELECT COUNT(*) AS total FROM orders WHERE created_at >= $1', [currentPeriodStart]),
      
      // Pending Orders (all time) - using canceled as pending since there's no pending status
      pool.query("SELECT COUNT(*) AS total FROM orders WHERE status = 'canceled'"),
      
      // Pending Orders in current period
      pool.query("SELECT COUNT(*) AS total FROM orders WHERE status = 'canceled' AND created_at >= $1", [currentPeriodStart]),
      
      // Confirmed Orders (all time)
      pool.query("SELECT COUNT(*) AS total FROM orders WHERE status = 'released_confirmed'"),
      
      // Confirmed Orders in current period
      pool.query("SELECT COUNT(*) AS total FROM orders WHERE status = 'released_confirmed' AND created_at >= $1", [currentPeriodStart]),
      
      // Total Sales (all time)
      pool.query('SELECT COALESCE(SUM(sold_amount), 0) AS total_sales FROM orders'),
      
      // Total Sales in current period
      pool.query('SELECT COALESCE(SUM(sold_amount), 0) AS total_sales FROM orders WHERE created_at >= $1', [currentPeriodStart]),
      
      // Available Products (all time)
      pool.query(`SELECT COUNT(*) AS total FROM products AS p 
                  JOIN inventory_items AS i ON i.product_id = p.id 
                  WHERE i.status = 'available'`),
      
      // Available Products in current period
      pool.query(`SELECT COUNT(*) AS total FROM products AS p 
                  JOIN inventory_items AS i ON i.product_id = p.id 
                  WHERE i.status = 'available' AND p.created_at >= $1`, [currentPeriodStart]),
      
      // Pending Verification (all time)
      pool.query("SELECT COUNT(*) AS total FROM users WHERE overall_verification_status = 'pending'"),
      
      // Pending Verification in current period
      pool.query("SELECT COUNT(*) AS total FROM users WHERE overall_verification_status = 'pending' AND created_at >= $1", [currentPeriodStart]),
      
      // Pickup Stocks (all time) - using 'return_pending' status for items currently in the field
      pool.query("SELECT COUNT(*) AS total FROM stock_updates WHERE status = 'return_pending'"),
      
      // Pickup Stocks in current period
      pool.query("SELECT COUNT(*) AS total FROM stock_updates WHERE status = 'return_pending' AND pickup_date >= $1", [currentPeriodStart])
    ]);

    // Previous period queries
    const previousQueries = await Promise.all([
      // Total Users in previous period
      pool.query('SELECT COUNT(*) AS total FROM users WHERE created_at >= $1 AND created_at < $2', [previousPeriodStart, previousPeriodEnd]),
      
      // Total Orders in previous period
      pool.query('SELECT COUNT(*) AS total FROM orders WHERE created_at >= $1 AND created_at < $2', [previousPeriodStart, previousPeriodEnd]),
      
      // Pending Orders in previous period
      pool.query("SELECT COUNT(*) AS total FROM orders WHERE status = 'canceled' AND created_at >= $1 AND created_at < $2", [previousPeriodStart, previousPeriodEnd]),
      
      // Confirmed Orders in previous period
      pool.query("SELECT COUNT(*) AS total FROM orders WHERE status = 'released_confirmed' AND created_at >= $1 AND created_at < $2", [previousPeriodStart, previousPeriodEnd]),
      
      // Total Sales in previous period
      pool.query('SELECT COALESCE(SUM(sold_amount), 0) AS total_sales FROM orders WHERE created_at >= $1 AND created_at < $2', [previousPeriodStart, previousPeriodEnd]),
      
      // Available Products in previous period
      pool.query(`SELECT COUNT(*) AS total FROM products AS p 
                  JOIN inventory_items AS i ON i.product_id = p.id 
                  WHERE i.status = 'available' AND p.created_at >= $1 AND p.created_at < $2`, [previousPeriodStart, previousPeriodEnd]),
      
      // Pending Verification in previous period
      pool.query("SELECT COUNT(*) AS total FROM users WHERE overall_verification_status = 'pending' AND created_at >= $1 AND created_at < $2", [previousPeriodStart, previousPeriodEnd]),
      
      // Pickup Stocks in previous period
      pool.query("SELECT COUNT(*) AS total FROM stock_updates WHERE status = 'return_pending' AND pickup_date >= $1 AND pickup_date < $2", [previousPeriodStart, previousPeriodEnd])
    ]);

    // Extract results
    const [
      totalUsersAll, totalUsersCurrent,
      totalOrdersAll, totalOrdersCurrent,
      pendingOrdersAll, pendingOrdersCurrent,
      confirmedOrdersAll, confirmedOrdersCurrent,
      totalSalesAll, totalSalesCurrent,
      availableProductsAll, availableProductsCurrent,
      pendingVerificationAll, pendingVerificationCurrent,
      pickupStocksAll, pickupStocksCurrent
    ] = currentQueries;

    const [
      totalUsersPrevious,
      totalOrdersPrevious,
      pendingOrdersPrevious,
      confirmedOrdersPrevious,
      totalSalesPrevious,
      availableProductsPrevious,
      pendingVerificationPrevious,
      pickupStocksPrevious
    ] = previousQueries;

    // Debug logging for response
    const totalUsersValue = parseInt(totalUsersAll.rows[0].total, 10);
    console.log('🔍 [DEBUG] Final totalUsers value being sent to frontend:', totalUsersValue);
    console.log('🔍 [DEBUG] Raw totalUsersAll.rows[0]:', totalUsersAll.rows[0]);

    return res.status(200).json({
      // Current totals (all time)
      totalUsers: totalUsersValue,
      totalOrders: parseInt(totalOrdersAll.rows[0].total, 10),
      totalPendingOrders: parseInt(pendingOrdersAll.rows[0].total, 10),
      totalConfirmedOrders: parseInt(confirmedOrdersAll.rows[0].total, 10),
      pendingVerification: parseInt(pendingVerificationAll.rows[0].total, 10),
      totalSales: parseFloat(totalSalesAll.rows[0].total_sales) || 0,
      totalAvailableProducts: parseInt(availableProductsAll.rows[0].total, 10),
      totalPickupStocks: parseInt(pickupStocksAll.rows[0].total, 10),
      
      // Previous period data for comparisons
      previousTotalUsers: parseInt(totalUsersPrevious.rows[0].total, 10),
      previousPendingOrders: parseInt(pendingOrdersPrevious.rows[0].total, 10),
      previousConfirmedOrders: parseInt(confirmedOrdersPrevious.rows[0].total, 10),
      previousSales: parseFloat(totalSalesPrevious.rows[0].total_sales) || 0,
      previousAvailableProducts: parseInt(availableProductsPrevious.rows[0].total, 10),
      previousPendingVerification: parseInt(pendingVerificationPrevious.rows[0].total, 10),
      previousPickupStocks: parseInt(pickupStocksPrevious.rows[0].total, 10),
      
      // Current period data
      currentPeriodUsers: parseInt(totalUsersCurrent.rows[0].total, 10),
      currentPeriodOrders: parseInt(totalOrdersCurrent.rows[0].total, 10),
      currentPeriodPendingOrders: parseInt(pendingOrdersCurrent.rows[0].total, 10),
      currentPeriodConfirmedOrders: parseInt(confirmedOrdersCurrent.rows[0].total, 10),
      currentPeriodSales: parseFloat(totalSalesCurrent.rows[0].total_sales) || 0,
      currentPeriodAvailableProducts: parseInt(availableProductsCurrent.rows[0].total, 10),
      currentPeriodPendingVerification: parseInt(pendingVerificationCurrent.rows[0].total, 10),
      currentPeriodPickupStocks: parseInt(pickupStocksCurrent.rows[0].total, 10),
      
      // Metadata
      period: periodName,
      periodDays: daysBack,
      activeSessions: 0
    });
  } catch (error) {
    console.error('Dashboard summary error:', error);
    next(error);
  }
};

/**
 * assignMarketersToAdmin - Assigns one or multiple Marketers to an Admin using unique IDs.
 */
const assignMarketersToAdmin = async (req, res, next) => {
  try {
    if (req.user.role !== 'MasterAdmin') {
      return res.status(403).json({ message: 'Only a Master Admin can assign marketers to an Admin.' });
    }
    let { adminUniqueId, marketerUniqueIds } = req.body;
    if (!adminUniqueId || !marketerUniqueIds) {
      return res.status(400).json({ message: 'Both adminUniqueId and marketerUniqueIds are required.' });
    }
    if (!Array.isArray(marketerUniqueIds)) marketerUniqueIds = [marketerUniqueIds];
    if (marketerUniqueIds.length === 0) {
      return res.status(400).json({ message: 'At least one marketer ID must be provided.' });
    }

    const adminCheck = await pool.query(
      "SELECT unique_id FROM users WHERE unique_id = $1 AND role = 'Admin'",
      [adminUniqueId]
    );
    if (adminCheck.rowCount === 0) {
      return res.status(404).json({ message: 'Admin not found.' });
    }

    const marketerCheck = await pool.query(
      "SELECT unique_id FROM users WHERE unique_id = ANY($1::text[]) AND role = 'Marketer'",
      [marketerUniqueIds]
    );
    const validMarketerUniqueIds = marketerCheck.rows.map(r => r.unique_id);
    const invalidIds = marketerUniqueIds.filter(id => !validMarketerUniqueIds.includes(id));
    if (invalidIds.length > 0) {
      return res.status(404).json({ message: `Invalid marketers: ${invalidIds.join(', ')}` });
    }

    const query = `
      UPDATE users
      SET admin_id   = (SELECT id FROM users WHERE unique_id = $1),
          updated_at = NOW()
      WHERE unique_id = ANY($2::text[])
        AND role = 'Marketer'
      RETURNING *
    `;
    const { rows } = await pool.query(query, [adminUniqueId, marketerUniqueIds]);

    await logActivity(
      req.user.id,
      `${req.user.first_name} ${req.user.last_name}`,
      'Assign Marketers to Admin',
      'Marketer',
      marketerUniqueIds.join(',')
    );

    return res.status(200).json({
      message: 'Marketers assigned to Admin successfully.',
      assignedMarketers: rows
    });
  } catch (error) {
    next(error);
  }
};

/**
 * assignAdminToSuperAdmin - Assigns one or multiple Admins to a Super Admin using unique IDs.
 */
const assignAdminToSuperAdmin = async (req, res, next) => {
  try {
    if (req.user.role !== 'MasterAdmin') {
      return res.status(403).json({ message: 'Only a Master Admin can assign admins to a Super Admin.' });
    }
    let { superAdminUniqueId, adminUniqueIds } = req.body;
    if (!superAdminUniqueId || !adminUniqueIds) {
      return res.status(400).json({ message: 'Both superAdminUniqueId and adminUniqueIds are required.' });
    }
    if (!Array.isArray(adminUniqueIds)) adminUniqueIds = [adminUniqueIds];
    if (adminUniqueIds.length === 0) {
      return res.status(400).json({ message: 'At least one admin ID must be provided.' });
    }

    const superAdminCheck = await pool.query(
      "SELECT id FROM users WHERE unique_id = $1 AND role = 'SuperAdmin'",
      [superAdminUniqueId]
    );
    if (superAdminCheck.rowCount === 0) {
      return res.status(404).json({ message: 'Super Admin not found.' });
    }

    const adminCheck = await pool.query(
      "SELECT unique_id FROM users WHERE unique_id = ANY($1::text[]) AND role = 'Admin'",
      [adminUniqueIds]
    );
    const validAdminIds = adminCheck.rows.map(r => r.unique_id);
    const invalidIds = adminUniqueIds.filter(id => !validAdminIds.includes(id));
    if (invalidIds.length > 0) {
      return res.status(404).json({ message: `Invalid admins: ${invalidIds.join(', ')}` });
    }

    const query = `
      UPDATE users
      SET super_admin_id = (SELECT id FROM users WHERE unique_id = $1),
          updated_at     = NOW()
      WHERE unique_id = ANY($2::text[])
        AND role = 'Admin'
      RETURNING *
    `;
    const { rows } = await pool.query(query, [superAdminUniqueId, adminUniqueIds]);

    await logActivity(
      req.user.id,
      `${req.user.first_name} ${req.user.last_name}`,
      'Assign Admins to Super Admin',
      'Admin',
      adminUniqueIds.join(',')
    );

    return res.status(200).json({
      message: 'Admins assigned to Super Admin successfully.',
      assignedAdmins: rows
    });
  } catch (error) {
    next(error);
  }
};

/**
 * unassignMarketersFromAdmin - Unassigns one or multiple Marketers from an Admin.
 */
const unassignMarketersFromAdmin = async (req, res, next) => {
  try {
    let { adminUniqueId, marketerUniqueIds } = req.body;
    if (!adminUniqueId || !marketerUniqueIds) {
      return res.status(400).json({ message: 'Both adminUniqueId and marketerUniqueIds are required.' });
    }
    if (!Array.isArray(marketerUniqueIds)) marketerUniqueIds = [marketerUniqueIds];
    if (marketerUniqueIds.length === 0) {
      return res.status(400).json({ message: 'At least one marketer ID must be provided.' });
    }

    const query = `
      UPDATE users
      SET admin_id   = NULL,
          updated_at = NOW()
      WHERE unique_id = ANY($1::text[])
        AND admin_id = (SELECT id FROM users WHERE unique_id = $2)
        AND role = 'Marketer'
      RETURNING *
    `;
    const { rows, rowCount } = await pool.query(query, [marketerUniqueIds, adminUniqueId]);

    if (rowCount === 0) {
      return res.status(404).json({ message: 'Marketer(s) not found or already unassigned.' });
    }

    await logActivity(
      req.user.id,
      `${req.user.first_name} ${req.user.last_name}`,
      'Unassign Marketers from Admin',
      'Marketer',
      marketerUniqueIds.join(',')
    );

    return res.status(200).json({
      message: 'Marketer(s) unassigned successfully.',
      unassignedMarketers: rows
    });
  } catch (error) {
    next(error);
  }
};

/**
 * unassignAdminsFromSuperadmin - Unassigns one or multiple Admins from a Super Admin.
 */
const unassignAdminsFromSuperadmin = async (req, res, next) => {
  try {
    let { superAdminUniqueId, adminUniqueIds } = req.body;
    if (!superAdminUniqueId || !adminUniqueIds) {
      return res.status(400).json({ message: 'Both superAdminUniqueId and adminUniqueIds are required.' });
    }
    if (!Array.isArray(adminUniqueIds)) adminUniqueIds = [adminUniqueIds];
    if (adminUniqueIds.length === 0) {
      return res.status(400).json({ message: 'At least one admin ID must be provided.' });
    }

    const query = `
      UPDATE users
      SET super_admin_id = NULL,
          updated_at     = NOW()
      WHERE unique_id = ANY($1::text[])
        AND super_admin_id = (SELECT id FROM users WHERE unique_id = $2)
        AND role = 'Admin'
      RETURNING *
    `;
    const { rows, rowCount } = await pool.query(query, [adminUniqueIds, superAdminUniqueId]);

    if (rowCount === 0) {
      return res.status(404).json({ message: 'No matching admins found or already unassigned.' });
    }

    await logActivity(
      req.user.id,
      `${req.user.first_name} ${req.user.last_name}`,
      'Unassign Admins from Super Admin',
      'Admin',
      adminUniqueIds.join(',')
    );

    return res.status(200).json({
      message: 'Admins unassigned successfully.',
      unassignedAdmins: rows
    });
  } catch (error) {
    next(error);
  }
};

/**
 * listMarketersByAdmin - Retrieves a list of Marketers assigned to a given Admin.
 */
const listMarketersByAdmin = async (req, res, next) => {
  try {
    const { adminUniqueId } = req.params;
    const adminResult = await pool.query(
      "SELECT id FROM users WHERE unique_id = $1 AND role = 'Admin'",
      [adminUniqueId]
    );
    if (adminResult.rowCount === 0) {
      return res.status(404).json({ message: 'Admin not found.' });
    }
    const adminId = adminResult.rows[0].id;

    const query = `
      SELECT unique_id, first_name, last_name, email, location, admin_id
      FROM users
      WHERE role = 'Marketer' AND admin_id = $1
      ORDER BY first_name, last_name
    `;
    const { rows } = await pool.query(query, [adminId]);
    return res.status(200).json({ assignedMarketers: rows });
  } catch (error) {
    next(error);
  }
};

/**
 * listAdminsBySuperAdmin - Retrieves a list of Admins assigned to a given SuperAdmin.
 */
const listAdminsBySuperAdmin = async (req, res, next) => {
  try {
    const { superAdminUniqueId } = req.params;
    const superAdminResult = await pool.query(
      "SELECT id FROM users WHERE unique_id = $1 AND role = 'SuperAdmin'",
      [superAdminUniqueId]
    );
    if (superAdminResult.rowCount === 0) {
      return res.status(404).json({ message: 'SuperAdmin not found.' });
    }
    const superAdminId = superAdminResult.rows[0].id;

    const query = `
      SELECT unique_id, first_name, last_name, email, location, super_admin_id
      FROM users
      WHERE role = 'Admin' AND super_admin_id = $1
      ORDER BY first_name, last_name
    `;
    const { rows } = await pool.query(query, [superAdminId]);
    return res.status(200).json({ assignedAdmins: rows });
  } catch (error) {
    next(error);
  }
};

/**
 * getAllAssignments - Retrieves all current assignment relationships.
 */
const getAllAssignments = async (req, res, next) => {
  try {
    const marketersAssignedResult = await pool.query(`
      SELECT 
        u.unique_id AS marketer_unique_id,
        u.admin_id,
        (SELECT unique_id FROM users WHERE id = u.admin_id) AS admin_unique_id,
        u.first_name, u.last_name, u.location
      FROM users u
      WHERE u.role = 'Marketer' AND u.admin_id IS NOT NULL
      ORDER BY u.first_name, u.last_name
    `);

    const adminsAssignedResult = await pool.query(`
      SELECT 
        u.unique_id AS admin_unique_id,
        u.super_admin_id,
        (SELECT unique_id FROM users WHERE id = u.super_admin_id) AS super_admin_unique_id,
        u.first_name, u.last_name, u.location
      FROM users u
      WHERE u.role = 'Admin' AND u.super_admin_id IS NOT NULL
      ORDER BY u.first_name, u.last_name
    `);

    return res.status(200).json({
      assignedMarketers: marketersAssignedResult.rows,
      assignedAdmins: adminsAssignedResult.rows
    });
  } catch (error) {
    next(error);
  }
};

/**
 * getAllDealers - Returns a list of all dealers from the users table.
 */
const getAllDealers = async (req, res, next) => {
  try {
    const { rows } = await pool.query(
          `SELECT id, unique_id, business_name, location
             FROM users
            WHERE role = 'Dealer'`
        );
    return res.json({ dealers: rows });
  } catch (error) {
    next(error);
  }
};

/**
 * getTotalUsers - returns the count of all users.
 */
async function getTotalUsers(req, res, next) {
  try {
    const { rows } = await pool.query(`
      SELECT COUNT(*)::int AS total_users
      FROM users
    `);
    return res.json({ totalUsers: rows[0].total_users });
  } catch (error) {
    next(error);
  }
}

/**
 * getStats - Provides various platform statistics.
 */
async function getStats(req, res, next) {
  try {
    const { rows } = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM users)                             AS "totalUsers",
        (SELECT COUNT(*) FROM orders WHERE status = 'pending')   AS "totalPendingOrders",
        (SELECT COUNT(*) FROM orders WHERE status = 'released_confirmed') AS "totalConfirmedOrders",
        (SELECT COALESCE(SUM(sold_amount),0) FROM orders)         AS "totalSales",
        (SELECT COUNT(*) FROM products AS p
           JOIN inventory_items AS i ON i.product_id = p.id
          WHERE i.status = 'available')                          AS "totalAvailableProducts",
        (SELECT COUNT(*) FROM users WHERE overall_verification_status = 'pending') AS "pendingVerification",
        (SELECT COUNT(*) FROM stock_updates WHERE status = 'pending')             AS "totalPickupStocks"
    `);
    return res.json(rows[0]);
  } catch (error) {
    next(error);
  }
}

/**
 * getRecentActivity - Returns the latest activity log entries for Master Admin.
 * Simplified version that returns clean, basic data without complex formatting.
 */
async function getRecentActivity(req, res, next) {
  try {
    const limit = parseInt(req.query.limit, 10) || 6;
    const offset = parseInt(req.query.offset, 10) || 0;
    const period = req.query.period || 'All Time';
    
    // Build the base WHERE clause for filtering
    let whereClause = 'WHERE 1=1';
    if (period === 'Last 7 Days') {
      whereClause += ` AND al.created_at >= NOW() - INTERVAL '7 days'`;
    } else if (period === 'Last 30 Days') {
      whereClause += ` AND al.created_at >= NOW() - INTERVAL '30 days'`;
    }
    
    // First, get the total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM activity_logs al
      ${whereClause}
    `;
    
    const countResult = await pool.query(countQuery);
    const total = parseInt(countResult.rows[0].total, 10);
    
    // Then, get the paginated results
    const dataQuery = `
      SELECT 
        al.id,
        al.activity_type,
        al.entity_type,
        al.entity_unique_id,
        al.created_at,
        al.actor_name,
        al.actor_id,
        CASE 
          WHEN al.entity_type IN ('User', 'Admin', 'Marketer', 'SuperAdmin', 'Dealer') THEN 
            COALESCE(u.first_name || ' ' || u.last_name, al.entity_unique_id)
          ELSE al.entity_unique_id
        END AS entity_display_name
      FROM activity_logs al
      LEFT JOIN users u ON al.entity_unique_id = u.unique_id
      ${whereClause}
      ORDER BY al.created_at DESC 
      LIMIT $1 OFFSET $2
    `;

    // Execute the data query
    const { rows } = await pool.query(dataQuery, [limit, offset]);

    // Return clean, simple data with pagination info
    const activities = rows.map(activity => ({
      id: activity.id,
      activity_type: activity.activity_type,
      entity_type: activity.entity_type,
      entity_unique_id: activity.entity_unique_id,
      entity_display_name: activity.entity_display_name,
      created_at: activity.created_at,
      actor_name: activity.actor_name,
      actor_id: activity.actor_id
    }));

    return res.json({ 
      activities,
      total,
      page: Math.floor(offset / limit) + 1,
      pages: Math.ceil(total / limit),
      limit,
      offset
    });
  } catch (error) {
    next(error);
  }
}

/**
 * assignMarketerToAdmin - Assigns a marketer to an admin (MasterAdmin only)
 */
const assignMarketerToAdmin = async (req, res, next) => {
  try {
    const { marketerId, adminId } = req.body;
    
    if (!marketerId || !adminId) {
      return res.status(400).json({ message: 'Marketer ID and Admin ID are required.' });
    }

    // Verify marketer exists and is a marketer
    const marketerResult = await pool.query('SELECT id, first_name, last_name, email, role, admin_id FROM users WHERE id = $1', [marketerId]);
    if (marketerResult.rows.length === 0) {
      return res.status(404).json({ message: 'Marketer not found.' });
    }
    
    const marketer = marketerResult.rows[0];
    if (marketer.role !== 'Marketer') {
      return res.status(400).json({ message: 'User is not a marketer.' });
    }

    // Verify admin exists and is an admin
    const adminResult = await pool.query('SELECT id, first_name, last_name, role FROM users WHERE id = $1', [adminId]);
    if (adminResult.rows.length === 0) {
      return res.status(404).json({ message: 'Admin not found.' });
    }
    
    const admin = adminResult.rows[0];
    if (admin.role !== 'Admin') {
      return res.status(400).json({ message: 'User is not an admin.' });
    }

    // Check if marketer is already assigned
    if (marketer.admin_id) {
      return res.status(400).json({ message: 'Marketer is already assigned to an admin.' });
    }

    // Assign marketer to admin but keep account LOCKED until verification complete
    await pool.query(
      'UPDATE users SET admin_id = $1, locked = true, updated_at = NOW() WHERE id = $2',
      [adminId, marketerId]
    );

    // Send notification to marketer
    try {
      await notifyMarketerAssignment(marketerId, adminId);
    } catch (notificationError) {
      console.error('Failed to notify marketer:', notificationError);
      // Don't fail assignment if notification fails
    }

    // Send notification to admin
    try {
      await notifyAdminAssignment(adminId, marketerId);
    } catch (notificationError) {
      console.error('Failed to notify admin:', notificationError);
      // Don't fail assignment if notification fails
    }

    // Log activity
    await logActivity(
      req.user.id,
      'assign_marketer',
      `Assigned marketer ${marketer.first_name} ${marketer.last_name} to admin ${admin.first_name} ${admin.last_name}`,
      { marketerId, adminId, marketerName: `${marketer.first_name} ${marketer.last_name}`, adminName: `${admin.first_name} ${admin.last_name}` }
    );

    res.status(200).json({
      message: 'Marketer assigned successfully.',
      marketer: {
        id: marketer.id,
        name: `${marketer.first_name} ${marketer.last_name}`,
        email: marketer.email
      },
      admin: {
        id: admin.id,
        name: `${admin.first_name} ${admin.last_name}`
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * getUnassignedMarketers - Gets all marketers that are not assigned to any admin
 */
const getUnassignedMarketers = async (req, res, next) => {
  try {
    const query = `
      SELECT id, unique_id, first_name, last_name, email, location, 
             COALESCE(overall_verification_status, 'pending') as status, 
             created_at, locked
      FROM users 
      WHERE role = 'Marketer' AND admin_id IS NULL
      ORDER BY created_at DESC
    `;
    
    const result = await pool.query(query);
    
    res.status(200).json({
      marketers: result.rows
    });
  } catch (error) {
    next(error);
  }
};

/**
 * getAssignmentStats - Gets statistics for user assignments
 */
const getAssignmentStats = async (req, res, next) => {
  try {
    // Get total marketers
    const totalMarketersResult = await pool.query(
      "SELECT COUNT(*) AS total FROM users WHERE role = 'Marketer'"
    );
    
    // Get assigned marketers
    const assignedMarketersResult = await pool.query(
      "SELECT COUNT(*) AS total FROM users WHERE role = 'Marketer' AND admin_id IS NOT NULL"
    );
    
    // Get unassigned marketers
    const unassignedMarketersResult = await pool.query(
      "SELECT COUNT(*) AS total FROM users WHERE role = 'Marketer' AND admin_id IS NULL"
    );
    
    // Get active assignees (admins and superadmins)
    const activeAssigneesResult = await pool.query(
      "SELECT COUNT(*) AS total FROM users WHERE role IN ('Admin', 'SuperAdmin')"
    );
    
    res.status(200).json({
      totalMarketers: parseInt(totalMarketersResult.rows[0].total),
      assignedMarketers: parseInt(assignedMarketersResult.rows[0].total),
      unassignedMarketers: parseInt(unassignedMarketersResult.rows[0].total),
      activeAssignees: parseInt(activeAssigneesResult.rows[0].total)
    });
  } catch (error) {
    next(error);
  }
};

/**
 * getAllLocations - Gets all unique locations from users
 */
const getAllLocations = async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT DISTINCT location 
      FROM users 
      WHERE location IS NOT NULL AND location != ''
      ORDER BY location
    `);
    
    const locations = result.rows.map(row => row.location);
    
    res.status(200).json(locations);
  } catch (error) {
    next(error);
  }
};

/**
 * getHierarchicalAssignments - Gets assignments in hierarchical structure for UI display
 */
const getHierarchicalAssignments = async (req, res, next) => {
  try {
    // Get all superadmins with their assigned admins and marketers
    const result = await pool.query(`
      WITH superadmin_data AS (
        SELECT 
          u.id,
          u.unique_id,
          u.first_name,
          u.last_name,
          u.email,
          u.location
        FROM users u
        WHERE u.role = 'SuperAdmin'
      ),
      admin_data AS (
        SELECT 
          u.id,
          u.unique_id,
          u.first_name,
          u.last_name,
          u.email,
          u.location,
          u.super_admin_id
        FROM users u
        WHERE u.role = 'Admin' AND u.super_admin_id IS NOT NULL
      ),
      marketer_data AS (
        SELECT 
          u.id,
          u.unique_id,
          u.first_name,
          u.last_name,
          u.email,
          u.location,
          u.admin_id
        FROM users u
        WHERE u.role = 'Marketer' AND u.admin_id IS NOT NULL
      )
      SELECT 
        sa.id as superadmin_id,
        sa.unique_id as superadmin_unique_id,
        sa.first_name as superadmin_first_name,
        sa.last_name as superadmin_last_name,
        sa.email as superadmin_email,
        sa.location as superadmin_location,
        a.id as admin_id,
        a.unique_id as admin_unique_id,
        a.first_name as admin_first_name,
        a.last_name as admin_last_name,
        a.email as admin_email,
        a.location as admin_location,
        m.id as marketer_id,
        m.unique_id as marketer_unique_id,
        m.first_name as marketer_first_name,
        m.last_name as marketer_last_name,
        m.email as marketer_email,
        m.location as marketer_location
      FROM superadmin_data sa
      LEFT JOIN admin_data a ON a.super_admin_id = sa.id
      LEFT JOIN marketer_data m ON m.admin_id = a.id
      ORDER BY sa.first_name, a.first_name, m.first_name
    `);

    // Group the data hierarchically
    const hierarchical = {};
    
    result.rows.forEach(row => {
      const superAdminId = row.superadmin_id;
      
      if (!hierarchical[superAdminId]) {
        hierarchical[superAdminId] = {
          superAdmin: {
            id: row.superadmin_id,
            unique_id: row.superadmin_unique_id,
            firstName: row.superadmin_first_name,
            lastName: row.superadmin_last_name,
            email: row.superadmin_email,
            location: row.superadmin_location
          },
          admins: {}
        };
      }
      
      if (row.admin_id && !hierarchical[superAdminId].admins[row.admin_id]) {
        hierarchical[superAdminId].admins[row.admin_id] = {
          admin: {
            id: row.admin_id,
            unique_id: row.admin_unique_id,
            firstName: row.admin_first_name,
            lastName: row.admin_last_name,
            email: row.admin_email,
            location: row.admin_location
          },
          marketers: []
        };
      }
      
      if (row.marketer_id) {
        hierarchical[superAdminId].admins[row.admin_id].marketers.push({
          id: row.marketer_id,
          unique_id: row.marketer_unique_id,
          firstName: row.marketer_first_name,
          lastName: row.marketer_last_name,
          email: row.marketer_email,
          location: row.marketer_location
        });
      }
    });

    res.status(200).json(hierarchical);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerMasterAdmin,
  registerSuperAdmin,
  updateProfile,
  addUser,
  updateUser,
  deleteUser,
  restoreUser,
  lockUser,
  unlockUser,
  getUsers,
  getUserSummary,
  debugUsersTable,
  getDashboardSummary,
  assignMarketersToAdmin,
  assignAdminToSuperAdmin,
  unassignMarketersFromAdmin,
  unassignAdminsFromSuperadmin,
  listMarketersByAdmin,
  listAdminsBySuperAdmin,
  getAllAssignments,
  getAllDealers,
  getTotalUsers,
  getStats,
  getRecentActivity,
  assignMarketerToAdmin,
  getUnassignedMarketers,
  getAssignmentStats,
  getAllLocations,
  getHierarchicalAssignments
};
