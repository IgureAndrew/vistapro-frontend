// src/controllers/adminController.js
const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');
const { createUser } = require('../models/userModel');
const { logAudit } = require('../utils/auditLogger');

const getAccount = async (req, res) => {
  try {
    const userId = req.user.id; // From JWT token
    
    // Get user account details
    const userQuery = `
      SELECT 
        id, unique_id, email, phone, first_name, last_name, profile_image, gender,
        role, location, created_at, updated_at
      FROM users 
      WHERE id = $1 AND role = 'Admin'
    `;
    
    const result = await pool.query(userQuery, [userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Admin account not found' 
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
        createdAt: account.created_at,
        updatedAt: account.updated_at
      }
    });
    
  } catch (error) {
    console.error('Error fetching Admin account:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch account details',
      error: error.message 
    });
  }
};

const updateAccount = async (req, res) => {
  try {
    const userId = req.user.id; // From JWT token
    const { email, phone, displayName, profile_image } = req.body;
    
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
      WHERE email = $1 AND id != $2 AND role = 'Admin'
    `;
    const emailCheck = await pool.query(emailCheckQuery, [email, userId]);
    
    if (emailCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Email is already taken by another Admin'
      });
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
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $6 AND role = 'Admin'
      RETURNING id, unique_id, email, phone, first_name, last_name, profile_image, role, location, updated_at
    `;
    
    const result = await pool.query(updateQuery, [email, phone, firstName, lastName, profile_image, userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Admin account not found'
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
        updatedAt: updatedAccount.updated_at
      }
    });
    
  } catch (error) {
    console.error('Error updating Admin account:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update account',
      error: error.message
    });
  }
};

const updateAdminAccountSettings = async (req, res, next) => {
  try {
    const adminId = req.user.id;
    const { displayName, email, phone, oldPassword, newPassword } = req.body;
    let updateClauses = [];
    let values = [];
    let paramIndex = 1;
    
    if (newPassword) {
      if (!oldPassword) {
        return res.status(400).json({ message: "Old password is required to change password." });
      }
      const currentRes = await pool.query("SELECT password FROM users WHERE id = $1", [adminId]);
      if (!currentRes.rowCount) {
        return res.status(404).json({ message: "User not found." });
      }
      const isMatch = await bcrypt.compare(oldPassword, currentRes.rows[0].password);
      if (!isMatch) {
        return res.status(400).json({ message: "Old password is incorrect." });
      }
      const hashedNew = await bcrypt.hash(newPassword, 10);
      updateClauses.push(`password = $${paramIndex}`);
      values.push(hashedNew);
      paramIndex++;
    }
    
    if (displayName) {
      updateClauses.push(`first_name = $${paramIndex}`);
      values.push(displayName);
      paramIndex++;
    }
    if (email) {
      updateClauses.push(`email = $${paramIndex}`);
      values.push(email);
      paramIndex++;
    }
    if (phone) {
      updateClauses.push(`phone = $${paramIndex}`);
      values.push(phone);
      paramIndex++;
    }
    if (req.file) {
      updateClauses.push(`profile_image = $${paramIndex}`);
      values.push(req.file.path);
      paramIndex++;
    }
    
    if (updateClauses.length === 0) {
      return res.status(400).json({ message: "No fields provided for update." });
    }
    
    updateClauses.push("updated_at = NOW()");
    const query = `
      UPDATE users
      SET ${updateClauses.join(", ")}
      WHERE id = $${paramIndex}
      RETURNING id, unique_id, first_name, email, phone, profile_image, updated_at
    `;
    values.push(adminId);
    
    const result = await pool.query(query, values);
    if (result.rowCount === 0) {
      return res.status(404).json({ message: "User not found." });
    }
    
    return res.status(200).json({
      message: "Admin account settings updated successfully.",
      user: result.rows[0],
    });
  } catch (error) {
    console.error("Error updating Admin account settings:", error);
    next(error);
  }
};

module.exports = { updateAdminAccountSettings };

/**
 * registerDealer - Allows an Admin to register a new Dealer account.
 * Expects: name, email, password, phone, and account_number in req.body.
 */
const registerDealer = async (req, res, next) => {
  try {
    const { name, email, password, phone, account_number } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required.' });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create the new Dealer account with role 'Dealer'
    const newDealer = await createUser({
      name,
      email,
      password: hashedPassword,
      role: 'Dealer',
      phone,
      account_number,
    });

    // Optional: Log the action for audit purposes
    await logAudit(req.user.id, 'REGISTER_DEALER', `Admin registered Dealer with email: ${email}`);

    return res.status(201).json({
      message: 'Dealer registered successfully.',
      dealer: newDealer,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * registerMarketer - Allows an Admin to register a new Marketer account.
 * Expects in req.body:
 *  - name, email, password, phone, account_number,
 *  - agreement_signed (boolean) indicating if the marketer's agreement has been signed,
 *  - bank_details (string) for the marketer.
 *
 * If agreement_signed is true, the marketer is automatically marked as verified.
 */
const registerMarketer = async (req, res, next) => {
    try {
      const { name, email, password, phone, account_number, agreement_signed, bank_details } = req.body;
  
      // Validate required fields
      if (!name || !email || !password) {
        return res.status(400).json({ message: 'Name, email, and password are required.' });
      }
  
      // Hash the provided password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
  
      // Determine verification status based on agreement_signed
      const is_verified = agreement_signed === true;
  
      // Create the new Marketer account with role 'Marketer'
      const newMarketer = await createUser({
        name,
        email,
        password: hashedPassword,
        role: 'Marketer',
        phone,
        account_number,
        is_verified,       // Mark as verified if the agreement is signed
        agreement_signed,  // You might want to store the raw value
        bank_details,      // Save bank details provided during registration
      });
  
      // Optional: Log the registration action for audit purposes.
      await logAudit(req.user.id, 'REGISTER_MARKETER', `Admin registered Marketer with email: ${email}. Verified: ${is_verified}`);
  
      return res.status(201).json({
        message: 'Marketer registered successfully. Login details have been sent to the email.',
        marketer: newMarketer,
      });
    } catch (error) {
      next(error);
    }
  };
  
// Get Admin Dashboard Summary
const getDashboardSummary = async (req, res) => {
  try {
    const adminId = req.user.id;
    const adminUniqueId = req.user.unique_id;

    // Get current month and last month for comparison
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    // Personal Performance Queries (Admin users don't have personal sales/orders)
    const personalSalesQuery = `
      SELECT 0 as current_month, 0 as last_month
    `;

    const personalOrdersQuery = `
      SELECT 0 as current_month, 0 as last_month
    `;

    const personalPickupsQuery = `
      SELECT 0 as current_month, 0 as last_month
    `;

    // Team Management Queries
    const assignedMarketersQuery = `
      SELECT COUNT(*) as count
      FROM users 
      WHERE admin_id = $1 AND role = 'Marketer' AND deleted_at IS NULL
    `;

    const teamSalesQuery = `
      SELECT 
        COALESCE(SUM(o.sold_amount), 0) as total_sales,
        COALESCE(SUM(CASE WHEN EXTRACT(MONTH FROM o.created_at) = $2 AND EXTRACT(YEAR FROM o.created_at) = $3 THEN o.sold_amount ELSE 0 END), 0) as current_month,
        COALESCE(SUM(CASE WHEN EXTRACT(MONTH FROM o.created_at) = $4 AND EXTRACT(YEAR FROM o.created_at) = $5 THEN o.sold_amount ELSE 0 END), 0) as last_month
      FROM orders o
      JOIN users u ON o.marketer_id = u.id
      WHERE u.admin_id = $1 AND u.role = 'Marketer' AND o.status = 'released_confirmed'
    `;

    const teamOrdersQuery = `
      SELECT 
        COUNT(*) as total_orders,
        COUNT(CASE WHEN EXTRACT(MONTH FROM o.created_at) = $2 AND EXTRACT(YEAR FROM o.created_at) = $3 THEN 1 END) as current_month,
        COUNT(CASE WHEN EXTRACT(MONTH FROM o.created_at) = $4 AND EXTRACT(YEAR FROM o.created_at) = $5 THEN 1 END) as last_month
      FROM orders o
      JOIN users u ON o.marketer_id = u.id
      WHERE u.admin_id = $1 AND u.role = 'Marketer' AND o.status = 'released_confirmed'
    `;

    const activeMarketersQuery = `
      SELECT COUNT(DISTINCT u.id) as count
      FROM users u
      JOIN orders o ON u.id = o.marketer_id
      WHERE u.admin_id = $1 AND u.role = 'Marketer' 
      AND o.status = 'released_confirmed'
      AND o.created_at >= NOW() - INTERVAL '7 days'
      AND u.deleted_at IS NULL
    `;

    // Operational Status Queries
    const teamPendingOrdersQuery = `
      SELECT COUNT(*) as count
      FROM orders o
      JOIN users u ON o.marketer_id = u.id
      WHERE u.admin_id = $1 AND u.role = 'Marketer' AND o.status = 'pending'
    `;

    const teamStockRequestsQuery = `
      SELECT COUNT(*) as count
      FROM stock_updates su
      JOIN users u ON su.marketer_id = u.id
      WHERE u.admin_id = $1 AND u.role = 'Marketer' 
      AND su.status = 'pending'
    `;

    const teamWithdrawalsQuery = `
      SELECT COUNT(*) as count
      FROM withdrawal_requests wr
      JOIN users u ON wr.user_unique_id = u.unique_id
      WHERE u.admin_id = $1 AND u.role = 'Marketer' 
      AND wr.status = 'pending'
    `;

    // Verification Status Queries (simplified for now)
    const pendingPhysicalVerificationQuery = `
      SELECT COUNT(*) as count
      FROM users u
      WHERE u.admin_id = $1 AND u.role = 'Marketer' 
      AND u.deleted_at IS NULL
      AND u.overall_verification_status IS NULL
    `;

    const completedPhysicalVerificationQuery = `
      SELECT COUNT(*) as count
      FROM users u
      WHERE u.admin_id = $1 AND u.role = 'Marketer' 
      AND u.deleted_at IS NULL
      AND u.overall_verification_status = 'approved'
    `;

    const awaitingSuperAdminReviewQuery = `
      SELECT COUNT(*) as count
      FROM users u
      WHERE u.admin_id = $1 AND u.role = 'Marketer' 
      AND u.deleted_at IS NULL
      AND u.overall_verification_status = 'pending'
    `;

    // Execute all queries
    const [
      personalSalesResult,
      personalOrdersResult,
      personalPickupsResult,
      assignedMarketersResult,
      teamSalesResult,
      teamOrdersResult,
      activeMarketersResult,
      teamPendingOrdersResult,
      teamStockRequestsResult,
      teamWithdrawalsResult,
      pendingPhysicalVerificationResult,
      completedPhysicalVerificationResult,
      awaitingSuperAdminReviewResult
    ] = await Promise.all([
      pool.query(personalSalesQuery),
      pool.query(personalOrdersQuery),
      pool.query(personalPickupsQuery),
      pool.query(assignedMarketersQuery, [adminId]),
      pool.query(teamSalesQuery, [adminId, currentMonth + 1, currentYear, lastMonth + 1, lastMonthYear]),
      pool.query(teamOrdersQuery, [adminId, currentMonth + 1, currentYear, lastMonth + 1, lastMonthYear]),
      pool.query(activeMarketersQuery, [adminId]),
      pool.query(teamPendingOrdersQuery, [adminId]),
      pool.query(teamStockRequestsQuery, [adminId]),
      pool.query(teamWithdrawalsQuery, [adminId]),
      pool.query(pendingPhysicalVerificationQuery, [adminId]),
      pool.query(completedPhysicalVerificationQuery, [adminId]),
      pool.query(awaitingSuperAdminReviewQuery, [adminId])
    ]);

    // Calculate percentage changes
    const calculatePercentageChange = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    const personalSales = personalSalesResult.rows[0];
    const personalOrders = personalOrdersResult.rows[0];
    const personalPickups = personalPickupsResult.rows[0];
    const teamSales = teamSalesResult.rows[0];
    const teamOrders = teamOrdersResult.rows[0];

    // Calculate personal commission (assuming 40% of sales)
    const personalCommission = Math.round(personalSales.current_month * 0.4);

    res.json({
      success: true,
      // Personal Performance
      personalSales: personalSales.current_month,
      personalOrders: personalOrders.current_month,
      personalPickups: personalPickups.current_month,
      personalCommission: personalCommission,
      
      // Team Management
      assignedMarketers: assignedMarketersResult.rows[0].count,
      teamSales: teamSales.total_sales || teamSales.current_month,
      teamOrders: teamOrders.total_orders || teamOrders.current_month,
      activeMarketers: activeMarketersResult.rows[0].count,
      
      // Operational Status
      teamPendingOrders: teamPendingOrdersResult.rows[0].count,
      teamStockRequests: teamStockRequestsResult.rows[0].count,
      teamWithdrawals: teamWithdrawalsResult.rows[0].count,
      
      // Verification Status
      pendingPhysicalVerification: pendingPhysicalVerificationResult.rows[0].count,
      completedPhysicalVerification: completedPhysicalVerificationResult.rows[0].count,
      awaitingSuperAdminReview: awaitingSuperAdminReviewResult.rows[0].count,
      
      // Percentage changes
      personalSalesChange: calculatePercentageChange(personalSales.current_month, personalSales.last_month),
      personalOrdersChange: calculatePercentageChange(personalOrders.current_month, personalOrders.last_month),
      personalPickupsChange: calculatePercentageChange(personalPickups.current_month, personalPickups.last_month),
      teamSalesChange: calculatePercentageChange(teamSales.current_month, teamSales.last_month),
      teamOrdersChange: calculatePercentageChange(teamOrders.current_month, teamOrders.last_month),
    });

  } catch (error) {
    console.error('Error fetching Admin dashboard summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard summary'
    });
  }
};

// Get Admin Wallet Summary
const getWalletSummary = async (req, res) => {
  try {
    const adminId = req.user.id;
    
    // Get admin's unique_id first
    const adminResult = await pool.query('SELECT unique_id FROM users WHERE id = $1', [adminId]);
    if (adminResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }
    
    const adminUniqueId = adminResult.rows[0].unique_id;
    
    // Get wallet data using existing wallet service
    const { getDetailedWallet } = require('../services/walletService');
    const walletData = await getDetailedWallet(adminUniqueId);
    
    res.json({
      success: true,
      ...walletData
    });

  } catch (error) {
    console.error('Error fetching Admin wallet summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch wallet summary'
    });
  }
};

// Get Admin Recent Activities
const getRecentActivities = async (req, res) => {
  try {
    const adminId = req.user.id;
    const limit = req.query.limit || 10;

    // Get recent activities for Admin (team activities only)
    const activitiesQuery = `
      (
        SELECT 
          'team_order' as type,
          u.first_name || ' ' || u.last_name || ' placed order #' || o.id as description,
          o.created_at as timestamp,
          o.sold_amount as amount,
          'team' as category
        FROM orders o
        JOIN users u ON o.marketer_id = u.id
        WHERE u.admin_id = $1 AND u.role = 'Marketer'
        
        UNION ALL
        
        SELECT 
          'team_pickup' as type,
          u.first_name || ' ' || u.last_name || ' picked up stock worth ₦' || (su.quantity * p.selling_price) as description,
          su.updated_at as timestamp,
          (su.quantity * p.selling_price) as amount,
          'team' as category
        FROM stock_updates su
        JOIN products p ON su.product_id = p.id
        JOIN users u ON su.marketer_id = u.id
        WHERE u.admin_id = $1 AND u.role = 'Marketer'
      )
      ORDER BY timestamp DESC
      LIMIT $2
    `;

    const result = await pool.query(activitiesQuery, [adminId, limit]);
    
    const activities = result.rows.map(row => ({
      id: Math.random().toString(36).substr(2, 9), // Generate simple ID
      type: row.type,
      description: row.description,
      timestamp: row.timestamp,
      amount: row.amount,
      category: row.category
    }));

    res.json({
      success: true,
      activities
    });

  } catch (error) {
    console.error('Error fetching Admin recent activities:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recent activities'
    });
  }
};

/**
 * Get verification submissions for Admin
 * Shows all submitted verification forms from assigned marketers
 */
const getVerificationSubmissions = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { page = 1, limit = 10, status = 'all' } = req.query;
    const offset = (page - 1) * limit;

    // Build status filter
    let statusFilter = '';
    if (status !== 'all') {
      statusFilter = `AND u.overall_verification_status = '${status}'`;
    }

    // Get submissions with form completion status (simplified)
    const submissionsQuery = `
      SELECT 
        u.id as marketerId,
        u.unique_id as marketerUniqueId,
        u.first_name || ' ' || u.last_name as marketerName,
        u.email as marketerEmail,
        u.phone as marketerPhone,
        u.created_at as marketerCreatedAt,
        u.overall_verification_status as status,
        u.created_at as submitted_at,
        u.updated_at,
        u.overall_verification_status as physical_verification_status,
        u.overall_verification_status as phone_verification_status,
        u.overall_verification_status as masteradmin_approval_status,
        -- Calculate completion percentage (simplified)
        CASE 
          WHEN u.overall_verification_status = 'approved' THEN 100
          WHEN u.overall_verification_status = 'pending' THEN 50
          ELSE 0
        END as completion_percentage,
        -- Form submission status
        CASE 
          WHEN u.overall_verification_status = 'approved' THEN 'completed'
          WHEN u.overall_verification_status = 'pending' THEN 'partial'
          ELSE 'not_started'
        END as form_status
      FROM users u
      WHERE u.admin_id = $1 
        AND u.role = 'Marketer'
        AND u.deleted_at IS NULL
        ${statusFilter}
      ORDER BY u.created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const countQuery = `
      SELECT COUNT(*) as total
      FROM users u
      WHERE u.admin_id = $1 
        AND u.role = 'Marketer'
        AND u.deleted_at IS NULL
        ${statusFilter}
    `;

    const [submissionsResult, countResult] = await Promise.all([
      pool.query(submissionsQuery, [adminId, limit, offset]),
      pool.query(countQuery, [adminId])
    ]);

    const submissions = submissionsResult.rows.map(row => ({
      id: row.marketerId,
      marketerId: row.marketerUniqueId,
      marketerName: row.marketerName,
      marketerEmail: row.marketerEmail,
      marketerPhone: row.marketerPhone,
      status: row.status || 'submitted',
      submittedAt: row.submitted_at || row.marketerCreatedAt,
      updatedAt: row.updated_at,
      physicalVerificationStatus: row.physical_verification_status,
      phoneVerificationStatus: row.phone_verification_status,
      masteradminApprovalStatus: row.masteradmin_approval_status,
      completionPercentage: row.completion_percentage,
      formStatus: row.form_status,
      // Mock data for demonstration - in real implementation, fetch actual form data
      biodata: {
        fullName: row.marketerName,
        email: row.marketerEmail,
        phone: row.marketerPhone,
        address: 'Sample Address',
        dateOfBirth: '1990-01-01',
        nationalId: '123456789'
      },
      guarantor: {
        guarantorName: 'John Doe',
        guarantorPhone: '+1234567890',
        guarantorAddress: 'Guarantor Address',
        guarantorRelationship: 'Friend',
        guarantorOccupation: 'Engineer',
        guarantorEmployer: 'Tech Corp'
      },
      commitment: {
        salesTarget: 100000,
        commitmentPeriod: 12,
        expectedStartDate: '2025-02-01',
        previousExperience: '2 years in sales',
        motivation: 'Career growth and financial stability'
      },
      documents: [
        { name: 'National ID', type: 'PDF', url: '#' },
        { name: 'Employment Letter', type: 'PDF', url: '#' },
        { name: 'Bank Statement', type: 'PDF', url: '#' }
      ]
    }));

    const total = parseInt(countResult.rows[0].total);

    res.status(200).json({
      success: true,
      data: {
        submissions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Error fetching verification submissions:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch verification submissions',
      error: error.message 
    });
  }
};

// Get assigned marketers for this admin
const getAssignedMarketers = async (req, res) => {
  try {
    const adminId = req.user.id;
    
    const query = `
      SELECT 
        u.id, u.unique_id, u.first_name, u.last_name, u.email, u.location,
        COALESCE(u.overall_verification_status, 'pending') as status,
        u.created_at, u.locked
      FROM users u
      WHERE u.admin_id = $1 AND u.role = 'Marketer' AND u.deleted_at IS NULL
      ORDER BY u.created_at DESC
    `;
    
    const result = await pool.query(query, [adminId]);
    
    res.status(200).json({
      success: true,
      marketers: result.rows
    });
    
  } catch (error) {
    console.error('Error fetching assigned marketers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch assigned marketers'
    });
  }
};

// Get assignment statistics for this admin
const getAssignmentStats = async (req, res) => {
  try {
    const adminId = req.user.id;
    
    // Total assigned marketers
    const totalMarketersResult = await pool.query(
      "SELECT COUNT(*) as total FROM users WHERE admin_id = $1 AND role = 'Marketer' AND deleted_at IS NULL",
      [adminId]
    );
    
    // Active marketers (with recent orders)
    const activeMarketersResult = await pool.query(`
      SELECT COUNT(DISTINCT u.id) as total
      FROM users u
      JOIN orders o ON u.id = o.marketer_id
      WHERE u.admin_id = $1 AND u.role = 'Marketer' 
      AND o.status = 'released_confirmed'
      AND o.created_at >= NOW() - INTERVAL '7 days'
      AND u.deleted_at IS NULL
    `, [adminId]);
    
    // Pending verification
    const pendingVerificationResult = await pool.query(
      "SELECT COUNT(*) as total FROM users WHERE admin_id = $1 AND role = 'Marketer' AND overall_verification_status IS NULL AND deleted_at IS NULL",
      [adminId]
    );
    
    // Completed verification
    const completedVerificationResult = await pool.query(
      "SELECT COUNT(*) as total FROM users WHERE admin_id = $1 AND role = 'Marketer' AND overall_verification_status = 'approved' AND deleted_at IS NULL",
      [adminId]
    );
    
    res.status(200).json({
      success: true,
      stats: {
        totalMarketers: parseInt(totalMarketersResult.rows[0].total),
        activeMarketers: parseInt(activeMarketersResult.rows[0].total),
        pendingVerification: parseInt(pendingVerificationResult.rows[0].total),
        completedVerification: parseInt(completedVerificationResult.rows[0].total)
      }
    });
    
  } catch (error) {
    console.error('Error fetching assignment stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch assignment statistics'
    });
  }
};

module.exports = {
  getAccount,
  updateAccount,
  updateAdminAccountSettings,
  registerDealer,
  registerMarketer,
  getDashboardSummary,
  getWalletSummary,
  getRecentActivities,
  getVerificationSubmissions,
  getAssignedMarketers,
  getAssignmentStats,
};
