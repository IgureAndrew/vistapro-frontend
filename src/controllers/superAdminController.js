const superAdminService = require('../services/superAdminService');
const { pool } = require('../config/database');
const bcrypt = require('bcrypt');
const { getSuperAdminCommissionTransactions } = require('../services/walletService');

const getSuperAdminTeamHierarchy = async (req, res) => {
  try {
    const superAdminId = req.user.id;
    const result = await superAdminService.getSuperAdminTeamHierarchy(superAdminId);
    res.json(result);
  } catch (error) {
    console.error('Error in getSuperAdminTeamHierarchy controller:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch team hierarchy',
      error: error.message 
    });
  }
};

const getSuperAdminTeamStats = async (req, res) => {
  try {
    const superAdminId = req.user.id;
    const result = await superAdminService.getSuperAdminTeamStats(superAdminId);
    res.json(result);
  } catch (error) {
    console.error('Error in getSuperAdminTeamStats controller:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch team statistics',
      error: error.message 
    });
  }
};

const getSuperAdminPerformanceMetrics = async (req, res) => {
  try {
    const superAdminId = req.user.id;
    const result = await superAdminService.getSuperAdminPerformanceMetrics(superAdminId);
    res.json(result);
  } catch (error) {
    console.error('Error in getSuperAdminPerformanceMetrics controller:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch performance metrics',
      error: error.message 
    });
  }
};

const getSuperAdminLocationBreakdown = async (req, res) => {
  try {
    const superAdminId = req.user.id;
    const result = await superAdminService.getSuperAdminLocationBreakdown(superAdminId);
    res.json(result);
  } catch (error) {
    console.error('Error in getSuperAdminLocationBreakdown controller:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch location breakdown',
      error: error.message 
    });
  }
};

const getAccount = async (req, res) => {
  try {
    const userId = req.user.id; // From JWT token
    
    // Get user account details
    const userQuery = `
      SELECT 
        id, unique_id, email, phone, first_name, last_name, profile_image, gender,
        role, location, created_at, updated_at
      FROM users 
      WHERE id = $1 AND role = 'SuperAdmin'
    `;
    
    const result = await pool.query(userQuery, [userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'SuperAdmin account not found' 
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
    console.error('Error fetching SuperAdmin account:', error);
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
    const { email, phone, displayName, gender, newPassword, oldPassword } = req.body;
    
    console.log('📁 File upload info:', {
      hasFile: !!req.file,
      fileInfo: req.file ? {
        filename: req.file.filename,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      } : null,
      bodyProfileImage: req.body.profile_image
    });
    
    // Handle file upload
    const profile_image = req.file ? req.file.filename : req.body.profile_image;
    
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
      WHERE email = $1 AND id != $2 AND role = 'SuperAdmin'
    `;
    const emailCheck = await pool.query(emailCheckQuery, [email, userId]);
    
    if (emailCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Email is already taken by another SuperAdmin'
      });
    }
    
    // Split displayName into first_name and last_name
    const nameParts = displayName.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Handle password update if provided
    let passwordUpdate = '';
    let passwordParams = [];
    let paramIndex = 7; // Start after the basic params

    if (newPassword && oldPassword) {
      // Verify old password first
      const userQuery = `SELECT password FROM users WHERE id = $1`;
      const userResult = await pool.query(userQuery, [userId]);
      
      if (userResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const isOldPasswordValid = await bcrypt.compare(oldPassword, userResult.rows[0].password);
      if (!isOldPasswordValid) {
        return res.status(400).json({
          success: false,
          message: 'Old password is incorrect'
        });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      passwordUpdate = ', password = $' + paramIndex;
      passwordParams = [hashedPassword];
      paramIndex++;
    }

    // Update user account
    const updateQuery = `
      UPDATE users
      SET 
        email = $1,
        phone = $2,
        first_name = $3,
        last_name = $4,
        profile_image = $5,
        gender = $6${passwordUpdate},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramIndex} AND role = 'SuperAdmin'
      RETURNING id, unique_id, email, phone, first_name, last_name, profile_image, gender, role, location, updated_at
    `;
    
    const result = await pool.query(updateQuery, [email, phone, firstName, lastName, profile_image, gender, ...passwordParams, userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'SuperAdmin account not found'
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
        gender: updatedAccount.gender,
        role: updatedAccount.role,
        location: updatedAccount.location,
        updatedAt: updatedAccount.updated_at
      }
    });
    
  } catch (error) {
    console.error('Error updating SuperAdmin account:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update account',
      error: error.message
    });
  }
};

// Get orders from marketers assigned to admins under this SuperAdmin
const getSuperAdminOrders = async (req, res) => {
  try {
    const superAdminId = req.user.id;
    const { status, fromDate, toDate, marketerId, adminId } = req.query;

    console.log('🔍 SuperAdmin Orders Request:', { superAdminId, status, fromDate, toDate, marketerId, adminId });

    // Build the query using direct foreign key relationships
    let query = `
      SELECT 
        o.id,
        o.bnpl_platform,
        o.number_of_devices,
        o.sold_amount,
        o.sale_date,
        o.status,
        o.created_at,
        o.updated_at,
        m.unique_id AS marketer_unique_id,
        COALESCE(m.first_name || ' ' || m.last_name, 'Unknown Marketer') AS marketer_name,
        m.email AS marketer_email,
        m.phone AS marketer_phone,
        admin.unique_id AS admin_unique_id,
        COALESCE(admin.first_name || ' ' || admin.last_name, 'Direct Assignment') AS admin_name,
        COALESCE(p.device_name, 'Unknown Device') AS device_name,
        COALESCE(p.device_model, 'Unknown Model') AS device_model,
        COALESCE(p.device_type, 'Unknown Type') AS device_type,
        ARRAY[]::text[] AS imeis
      FROM users m
      JOIN orders o ON o.marketer_id = m.id
      LEFT JOIN users admin ON admin.id = m.admin_id
      LEFT JOIN order_items oi ON oi.order_id = o.id
      LEFT JOIN products p ON p.id = o.product_id
      WHERE m.role = 'Marketer'
        AND (
          -- Marketers directly assigned to this SuperAdmin
          m.super_admin_id = $1
          OR
          -- Marketers assigned to admins who are assigned to this SuperAdmin
          (m.admin_id IS NOT NULL AND admin.super_admin_id = $1)
        )
    `;

    const queryParams = [superAdminId];
    let paramCount = 1;

    // Add filtering conditions
    if (status) {
      paramCount++;
      query += ` AND o.status = $${paramCount}`;
      queryParams.push(status);
    }

    if (fromDate) {
      paramCount++;
      query += ` AND o.sale_date >= $${paramCount}`;
      queryParams.push(fromDate);
    }

    if (toDate) {
      paramCount++;
      query += ` AND o.sale_date <= $${paramCount}`;
      queryParams.push(toDate);
    }

    if (marketerId) {
      paramCount++;
      query += ` AND m.unique_id = $${paramCount}`;
      queryParams.push(marketerId);
    }

    if (adminId) {
      paramCount++;
      query += ` AND admin.unique_id = $${paramCount}`;
      queryParams.push(adminId);
    }

    query += ` ORDER BY o.sale_date DESC LIMIT 100`;

    console.log('🔍 Executing query with params:', queryParams);
    const { rows } = await pool.query(query, queryParams);

    console.log('📊 Orders found:', rows.length);

    // Calculate statistics
    const stats = {
      totalOrders: rows.length,
      pendingOrders: rows.filter(o => o.status === 'pending').length,
      approvedOrders: rows.filter(o => o.status === 'approved' || o.status === 'released_confirmed').length,
      rejectedOrders: rows.filter(o => o.status === 'rejected' || o.status === 'canceled').length,
      completedOrders: rows.filter(o => o.status === 'completed').length,
      totalRevenue: rows.reduce((sum, o) => sum + parseFloat(o.sold_amount || 0), 0),
      totalDevices: rows.reduce((sum, o) => sum + parseInt(o.number_of_devices || 0), 0)
    };

    res.json({
      success: true,
      orders: rows,
      stats
    });

  } catch (error) {
    console.error('❌ Error fetching SuperAdmin orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders',
      error: error.message
    });
  }
};

const getWalletSummary = async (req, res) => {
  try {
    const superAdminId = req.user.id;
    
    // Get SuperAdmin's unique_id
    const userQuery = `SELECT unique_id FROM users WHERE id = $1`;
    const userResult = await pool.query(userQuery, [superAdminId]);
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'SuperAdmin not found'
      });
    }
    
    const superAdminUniqueId = userResult.rows[0].unique_id;
    
    // Get team wallet summary (all Admins and Marketers in the SuperAdmin's hierarchy)
    const teamWalletQuery = `
      SELECT 
        COALESCE(SUM(w.available_balance), 0) as total_available,
        COALESCE(SUM(w.withheld_balance), 0) as total_withheld,
        COALESCE(SUM(w.available_balance + w.withheld_balance), 0) as total_balance
      FROM wallets w
      JOIN users u ON w.user_unique_id = u.unique_id
      WHERE (
        u.super_admin_id = $1 
        OR 
        (u.admin_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM users admin 
          WHERE admin.id = u.admin_id AND admin.super_admin_id = $1
        ))
      )
    `;
    
    // Get SuperAdmin's personal wallet (if any)
    const personalWalletQuery = `
      SELECT 
        COALESCE(available_balance, 0) as available_balance,
        COALESCE(withheld_balance, 0) as withheld_balance,
        COALESCE(available_balance + withheld_balance, 0) as total_balance
      FROM wallets 
      WHERE user_unique_id = $1
    `;
    
    const [teamWalletResult, personalWalletResult] = await Promise.all([
      pool.query(teamWalletQuery, [superAdminId]),
      pool.query(personalWalletQuery, [superAdminUniqueId])
    ]);
    
    const teamWallet = teamWalletResult.rows[0];
    const personalWallet = personalWalletResult.rows[0];
    
    // Calculate team management earnings (team total - personal)
    const teamManagementAvailable = Math.max(0, parseFloat(teamWallet.total_available) - parseFloat(personalWallet.available_balance));
    const teamManagementWithheld = Math.max(0, parseFloat(teamWallet.total_withheld) - parseFloat(personalWallet.withheld_balance));
    const teamManagementTotal = teamManagementAvailable + teamManagementWithheld;
    
    res.json({
      success: true,
      total_balance: parseFloat(teamWallet.total_balance),
      available_balance: parseFloat(teamWallet.total_available),
      withheld_balance: parseFloat(teamWallet.total_withheld),
      breakdown: {
        personal: {
          available: parseFloat(personalWallet.available_balance),
          withheld: parseFloat(personalWallet.withheld_balance),
          total: parseFloat(personalWallet.total_balance)
        },
        teamManagement: {
          available: teamManagementAvailable,
          withheld: teamManagementWithheld,
          total: teamManagementTotal
        },
        combined: {
          available: parseFloat(teamWallet.total_available),
          withheld: parseFloat(teamWallet.total_withheld),
          total: parseFloat(teamWallet.total_balance)
        }
      }
    });
  } catch (error) {
    console.error('❌ Error fetching SuperAdmin wallet summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch wallet summary',
      error: error.message
    });
  }
};

const getRecentActivities = async (req, res) => {
  try {
    const superAdminId = req.user.id;
    const limit = req.query.limit || 10;
    
    // Get recent activities from assigned users only
    const activitiesQuery = `
      (
        SELECT 
          'order_placed' as type,
          u.first_name || ' ' || u.last_name || ' placed order #' || o.id as description,
          o.created_at as timestamp,
          o.sold_amount as amount,
          'order' as category
        FROM orders o
        JOIN users u ON o.marketer_id = u.id
        WHERE u.super_admin_id = $1 AND o.status = 'confirmed'
        
        UNION ALL
        
        SELECT 
          'stock_pickup' as type,
          u.first_name || ' ' || u.last_name || ' picked up stock worth ₦' || (su.quantity * p.selling_price) as description,
          su.updated_at as timestamp,
          (su.quantity * p.selling_price) as amount,
          'pickup' as category
        FROM stock_updates su
        JOIN products p ON su.product_id = p.id
        JOIN users u ON su.marketer_id = u.id
        WHERE u.super_admin_id = $1 AND su.status = 'completed'
        
        UNION ALL
        
        SELECT 
          'user_registered' as type,
          'New user registered: ' || u.first_name || ' ' || u.last_name as description,
          u.created_at as timestamp,
          0 as amount,
          'user' as category
        FROM users u
        WHERE u.super_admin_id = $1 AND u.role IN ('Admin', 'Marketer')
      )
      ORDER BY timestamp DESC
      LIMIT $2
    `;
    
    const result = await pool.query(activitiesQuery, [superAdminId, limit]);
    
    res.json({
      success: true,
      activities: result.rows
    });
  } catch (error) {
    console.error('❌ Error fetching SuperAdmin recent activities:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recent activities',
      error: error.message
    });
  }
};

const getStats = async (req, res) => {
  try {
    const superAdminId = req.user.id;
    console.log('📊 Fetching SuperAdmin team head stats for ID:', superAdminId);
    
    // Get current month and last month for comparison
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    // Personal Performance Queries (SuperAdmin's own metrics - likely 0)
    const personalSalesQuery = `
      SELECT 0 as current_month, 0 as last_month
    `;

    const personalOrdersQuery = `
      SELECT 0 as current_month, 0 as last_month
    `;

    const personalPickupsQuery = `
      SELECT 0 as current_month, 0 as last_month
    `;

    // Team Management Queries (Assigned Admins + All Marketers under those Admins)
    const assignedAdminsQuery = `
      SELECT COUNT(*) as count
      FROM users 
      WHERE super_admin_id = $1 AND role = 'Admin' AND deleted_at IS NULL
    `;

    const teamSalesQuery = `
      SELECT 
        COALESCE(SUM(o.sold_amount), 0) as total_sales,
        COALESCE(SUM(CASE WHEN EXTRACT(MONTH FROM o.created_at) = $2 AND EXTRACT(YEAR FROM o.created_at) = $3 THEN o.sold_amount ELSE 0 END), 0) as current_month,
        COALESCE(SUM(CASE WHEN EXTRACT(MONTH FROM o.created_at) = $4 AND EXTRACT(YEAR FROM o.created_at) = $5 THEN o.sold_amount ELSE 0 END), 0) as last_month
      FROM orders o
      JOIN users u ON o.marketer_id = u.id
      WHERE (
        u.super_admin_id = $1 
        OR 
        (u.admin_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM users admin 
          WHERE admin.id = u.admin_id AND admin.super_admin_id = $1
        ))
      ) AND u.role = 'Marketer' AND o.status = 'released_confirmed'
    `;

    const teamOrdersQuery = `
      SELECT 
        COUNT(*) as total_orders,
        COUNT(CASE WHEN EXTRACT(MONTH FROM o.created_at) = $2 AND EXTRACT(YEAR FROM o.created_at) = $3 THEN 1 END) as current_month,
        COUNT(CASE WHEN EXTRACT(MONTH FROM o.created_at) = $4 AND EXTRACT(YEAR FROM o.created_at) = $5 THEN 1 END) as last_month
      FROM orders o
      JOIN users u ON o.marketer_id = u.id
      WHERE (
        u.super_admin_id = $1 
        OR 
        (u.admin_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM users admin 
          WHERE admin.id = u.admin_id AND admin.super_admin_id = $1
        ))
      ) AND u.role = 'Marketer' AND o.status = 'released_confirmed'
    `;

    const activeTeamMembersQuery = `
      SELECT COUNT(DISTINCT u.id) as count
      FROM users u
      JOIN orders o ON u.id = o.marketer_id
      WHERE (
        u.super_admin_id = $1 
        OR 
        (u.admin_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM users admin 
          WHERE admin.id = u.admin_id AND admin.super_admin_id = $1
        ))
      ) AND u.role = 'Marketer'
      AND o.status = 'released_confirmed'
      AND o.created_at >= NOW() - INTERVAL '7 days'
      AND u.deleted_at IS NULL
    `;

    // Operational Status Queries
    const teamPendingOrdersQuery = `
      SELECT COUNT(*) as count
      FROM orders o
      JOIN users u ON o.marketer_id = u.id
      WHERE (
        u.super_admin_id = $1 
        OR 
        (u.admin_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM users admin 
          WHERE admin.id = u.admin_id AND admin.super_admin_id = $1
        ))
      ) AND u.role = 'Marketer' AND o.status = 'pending'
    `;

    const teamStockRequestsQuery = `
      SELECT COUNT(*) as count
      FROM stock_updates su
      JOIN users u ON su.marketer_id = u.id
      WHERE (
        u.super_admin_id = $1 
        OR 
        (u.admin_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM users admin 
          WHERE admin.id = u.admin_id AND admin.super_admin_id = $1
        ))
      ) AND u.role = 'Marketer' 
      AND su.status = 'pending'
    `;

    const teamWithdrawalsQuery = `
      SELECT COUNT(*) as count
      FROM withdrawal_requests wr
      JOIN users u ON wr.user_unique_id = u.unique_id
      WHERE (
        u.super_admin_id = $1 
        OR 
        (u.admin_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM users admin 
          WHERE admin.id = u.admin_id AND admin.super_admin_id = $1
        ))
      ) AND u.role = 'Marketer' 
      AND wr.status = 'pending'
    `;

    // Execute all queries
    const [
      personalSalesResult,
      personalOrdersResult,
      personalPickupsResult,
      assignedAdminsResult,
      teamSalesResult,
      teamOrdersResult,
      activeTeamMembersResult,
      teamPendingOrdersResult,
      teamStockRequestsResult,
      teamWithdrawalsResult
    ] = await Promise.all([
      pool.query(personalSalesQuery),
      pool.query(personalOrdersQuery),
      pool.query(personalPickupsQuery),
      pool.query(assignedAdminsQuery, [superAdminId]),
      pool.query(teamSalesQuery, [superAdminId, currentMonth + 1, currentYear, lastMonth + 1, lastMonthYear]),
      pool.query(teamOrdersQuery, [superAdminId, currentMonth + 1, currentYear, lastMonth + 1, lastMonthYear]),
      pool.query(activeTeamMembersQuery, [superAdminId]),
      pool.query(teamPendingOrdersQuery, [superAdminId]),
      pool.query(teamStockRequestsQuery, [superAdminId]),
      pool.query(teamWithdrawalsQuery, [superAdminId])
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
      assignedAdmins: assignedAdminsResult.rows[0].count,
      teamSales: teamSales.total_sales || teamSales.current_month,
      teamOrders: teamOrders.total_orders || teamOrders.current_month,
      activeTeamMembers: activeTeamMembersResult.rows[0].count,
      
      // Operational Status
      teamPendingOrders: teamPendingOrdersResult.rows[0].count,
      teamStockRequests: teamStockRequestsResult.rows[0].count,
      teamWithdrawals: teamWithdrawalsResult.rows[0].count,
      
      // Percentage changes
      personalSalesChange: calculatePercentageChange(personalSales.current_month, personalSales.last_month),
      personalOrdersChange: calculatePercentageChange(personalOrders.current_month, personalOrders.last_month),
      personalPickupsChange: calculatePercentageChange(personalPickups.current_month, personalPickups.last_month),
      teamSalesChange: calculatePercentageChange(teamSales.current_month, teamSales.last_month),
      teamOrdersChange: calculatePercentageChange(teamOrders.current_month, teamOrders.last_month)
    });
    
  } catch (error) {
    console.error('❌ Error fetching SuperAdmin team head stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch stats',
      error: error.message
    });
  }
};

// Get verification submissions from assigned Admins
const getVerificationSubmissions = async (req, res) => {
  try {
    const superAdminId = req.user.id;
    
    // Get submissions from assigned Admins
    const submissionsQuery = `
      SELECT 
        vs.id,
        vs.marketer_id,
        u.full_name as marketer_name,
        u.phone as marketer_phone,
        u.location as marketer_location,
        a.full_name as admin_name,
        a.admin_id,
        vs.submission_date,
        vs.status,
        vs.priority,
        vs.verification_notes,
        vs.created_at,
        vs.updated_at
      FROM verification_submissions vs
      JOIN users u ON vs.marketer_id = u.id
      JOIN users a ON vs.admin_id = a.id
      WHERE a.super_admin_id = $1
      ORDER BY vs.created_at DESC
    `;
    
    const submissionsResult = await pool.query(submissionsQuery, [superAdminId]);
    
    // Get documents for each submission
    const submissionsWithDocs = await Promise.all(
      submissionsResult.rows.map(async (submission) => {
        const docsQuery = `
          SELECT 
            document_type,
            document_url,
            document_name,
            uploaded_at
          FROM verification_documents 
          WHERE submission_id = $1
          ORDER BY uploaded_at DESC
        `;
        
        const docsResult = await pool.query(docsQuery, [submission.id]);
        
        return {
          ...submission,
          documents: docsResult.rows
        };
      })
    );
    
    res.json({
      success: true,
      submissions: submissionsWithDocs
    });
    
  } catch (error) {
    console.error('Error fetching SuperAdmin verification submissions:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching verification submissions',
      error: error.message
    });
  }
};

// Approve verification submission
const approveVerificationSubmission = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const superAdminId = req.user.id;
    
    // Update submission status
    const updateQuery = `
      UPDATE verification_submissions 
      SET status = 'approved', 
          verified_by = $1,
          verified_at = NOW(),
          updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `;
    
    const result = await pool.query(updateQuery, [superAdminId, submissionId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Submission approved successfully',
      submission: result.rows[0]
    });
    
  } catch (error) {
    console.error('Error approving verification submission:', error);
    res.status(500).json({
      success: false,
      message: 'Error approving submission',
      error: error.message
    });
  }
};

// Reject verification submission
const rejectVerificationSubmission = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { reason } = req.body;
    const superAdminId = req.user.id;
    
    // Update submission status
    const updateQuery = `
      UPDATE verification_submissions 
      SET status = 'rejected', 
          verified_by = $1,
          verified_at = NOW(),
          rejection_reason = $2,
          updated_at = NOW()
      WHERE id = $3
      RETURNING *
    `;
    
    const result = await pool.query(updateQuery, [superAdminId, reason, submissionId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Submission rejected successfully',
      submission: result.rows[0]
    });
    
  } catch (error) {
    console.error('Error rejecting verification submission:', error);
    res.status(500).json({
      success: false,
      message: 'Error rejecting submission',
      error: error.message
    });
  }
};

// Get detailed SuperAdmin commission transactions with timestamps and source info
const getCommissionTransactions = async (req, res) => {
  try {
    const superAdminId = req.user.id;
    const limit = parseInt(req.query.limit) || 50;
    
    // Get SuperAdmin's unique_id
    const userQuery = `SELECT unique_id FROM users WHERE id = $1`;
    const userResult = await pool.query(userQuery, [superAdminId]);
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'SuperAdmin not found'
      });
    }
    
    const superAdminUniqueId = userResult.rows[0].unique_id;
    
    // Get detailed commission transactions
    const transactions = await getSuperAdminCommissionTransactions(superAdminUniqueId, limit);
    
    // Calculate summary statistics
    const totalCommission = transactions.reduce((sum, t) => sum + t.amount, 0);
    const totalOrders = new Set(transactions.map(t => t.order_id)).size;
    const totalMarketers = new Set(transactions.map(t => t.marketer_uid)).size;
    
    // Group by date for better visualization
    const transactionsByDate = transactions.reduce((acc, transaction) => {
      const date = transaction.created_at.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(transaction);
      return acc;
    }, {});
    
    res.json({
      success: true,
      transactions,
      summary: {
        total_commission: totalCommission,
        total_orders: totalOrders,
        total_marketers: totalMarketers,
        transaction_count: transactions.length
      },
      transactions_by_date: transactionsByDate
    });
    
  } catch (error) {
    console.error('❌ Error fetching SuperAdmin commission transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch commission transactions',
      error: error.message
    });
  }
};

module.exports = {
  getSuperAdminTeamHierarchy,
  getSuperAdminTeamStats,
  getSuperAdminPerformanceMetrics,
  getSuperAdminLocationBreakdown,
  getAccount,
  updateAccount,
  getSuperAdminOrders,
  getWalletSummary,
  getCommissionTransactions,
  getRecentActivities,
  getStats,
  getVerificationSubmissions,
  approveVerificationSubmission,
  rejectVerificationSubmission
};