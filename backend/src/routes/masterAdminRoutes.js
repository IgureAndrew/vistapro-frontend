// src/routes/masterAdminRoutes.js

const express = require('express');
const router = express.Router();
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');

const { verifyToken } = require('../middlewares/authMiddleware');
const { verifyRole  } = require('../middlewares/roleMiddleware');
const pool            = require('../config/database').pool;

const {
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
  getAllAssignments,
  listAdminsBySuperAdmin,
  getTotalUsers,
  getStats,
  getRecentActivity,
  getAllDealers,
  assignMarketerToAdmin,
  getUnassignedMarketers,
  getAssignmentStats,
  getAllLocations,
  getHierarchicalAssignments
} = require('../controllers/masterAdminController');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename:    (req, file, cb) => cb(null, Date.now() + '-' + file.originalname),
});

// Multer handlers
const uploadImage = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }
});

const uploadPDF = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'registrationCertificate') {
      if (file.mimetype === 'application/pdf') {
        return cb(null, true);
      }
      return cb(new Error('Only PDF files allowed for registration certificate'), false);
    }
    cb(null, true);
  }
});

// --- Public ---
router.post('/register', registerMasterAdmin);

// --- Profile (MasterAdmin only) ---
router.put(
  '/profile',
  verifyToken,
  verifyRole(['MasterAdmin']),
  uploadImage.single('profile_image'),
  updateProfile
);
router.get(
  '/profile',
  verifyToken,
  verifyRole(['MasterAdmin']),
  async (req, res) => {
    try {
      const userId = req.user.id;
      const query = `
        SELECT id, unique_id, first_name, last_name, email, phone, gender, profile_image, role, location
        FROM users
        WHERE id = $1
      `;
      const { rows } = await pool.query(query, [userId]);
      
      if (rows.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      const user = rows[0];
      res.status(200).json({ user });
    } catch (error) {
      console.error('Error fetching MasterAdmin profile:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

// --- Account Settings Extensions (MasterAdmin only) ---
// Get login history
router.get('/profile/login-history', verifyToken, verifyRole(['MasterAdmin']), async (req, res) => {
  try {
    // For now, return mock data. In a real scenario, this would query a login_history table.
    const mockHistory = [
      { device: 'Chrome on Windows', location: 'Lagos, Nigeria', created_at: new Date(Date.now() - 3600000) },
      { device: 'Firefox on Linux', location: 'Abuja, Nigeria', created_at: new Date(Date.now() - 86400000) },
      { device: 'Mobile App (Android)', location: 'Lagos, Nigeria', created_at: new Date(Date.now() - 172800000) },
    ];
    res.json({ success: true, history: mockHistory });
  } catch (error) {
    console.error('Error fetching login history:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch login history' });
  }
});

// Toggle OTP
router.patch('/profile/otp-toggle', verifyToken, verifyRole(['MasterAdmin']), async (req, res) => {
  try {
    const userId = req.user.id;
    const { enable } = req.body; // boolean
    
    if (typeof enable !== 'boolean') {
      return res.status(400).json({ success: false, message: 'Invalid value for enable' });
    }

    await pool.query(
      'UPDATE users SET otp_enabled = $1, updated_at = NOW() WHERE id = $2',
      [enable, userId]
    );
    res.json({ success: true, message: `OTP ${enable ? 'enabled' : 'disabled'} successfully` });
  } catch (error) {
    console.error('Error toggling OTP:', error);
    res.status(500).json({ success: false, message: 'Failed to toggle OTP' });
  }
});

// Get preferences
router.get('/profile/preferences', verifyToken, verifyRole(['MasterAdmin']), async (req, res) => {
  try {
    // For now, return mock data. In a real scenario, this would query a user_preferences table.
    const mockPreferences = {
      theme: 'light',
      language: 'en',
      timezone: 'Africa/Lagos'
    };
    res.json({ success: true, preferences: mockPreferences });
  } catch (error) {
    console.error('Error fetching preferences:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch preferences' });
  }
});

// Update preferences
router.patch('/profile/preferences', verifyToken, verifyRole(['MasterAdmin']), async (req, res) => {
  try {
    const userId = req.user.id;
    const { theme, language, timezone } = req.body;
    // In a real scenario, this would update a user_preferences table.
    // For now, we'll just acknowledge the update.
    res.json({ success: true, message: 'Preferences updated successfully' });
  } catch (error) {
    console.error('Error updating preferences:', error);
    res.status(500).json({ success: false, message: 'Failed to update preferences' });
  }
});

// Get notification preferences
router.get('/profile/notification-preferences', verifyToken, verifyRole(['MasterAdmin']), async (req, res) => {
  try {
    // For now, return mock data. In a real scenario, this would query a user_notification_preferences table.
    const mockNotificationPreferences = {
      emailNotifications: true,
      pushNotifications: false,
      orderUpdates: true,
      securityAlerts: true
    };
    res.json({ success: true, preferences: mockNotificationPreferences });
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch notification preferences' });
  }
});

// Update notification preferences
router.patch('/profile/notification-preferences', verifyToken, verifyRole(['MasterAdmin']), async (req, res) => {
  try {
    const userId = req.user.id;
    const { emailNotifications, pushNotifications, orderUpdates, securityAlerts } = req.body;
    // In a real scenario, this would update a user_notification_preferences table.
    // For now, we'll just acknowledge the update.
    res.json({ success: true, message: 'Notification preferences updated successfully' });
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    res.status(500).json({ success: false, message: 'Failed to update notification preferences' });
  }
});

// --- User Management (MasterAdmin only) ---
router.get(   '/users',         verifyToken, verifyRole(['MasterAdmin']), getUsers);
router.post(  '/users',         verifyToken, verifyRole(['MasterAdmin']), uploadPDF.single('registrationCertificate'), addUser);
router.get(   '/users/summary', verifyToken, verifyRole(['MasterAdmin']), getUserSummary);
router.get(   '/users/debug',   verifyToken, verifyRole(['MasterAdmin']), debugUsersTable);

// --- Get users by location (for transfers) ---
router.get('/users/location/:location', verifyToken, verifyRole(['Marketer', 'Admin', 'SuperAdmin', 'MasterAdmin']), async (req, res) => {
  try {
    const { location } = req.params;
    const currentUserId = req.user.id;
    
    // Get users from the same location, excluding current user
    const { rows } = await pool.query(`
      SELECT 
        id,
        unique_id,
        CONCAT(first_name, ' ', last_name) as name,
        role,
        location
      FROM users 
      WHERE location = $1 
        AND id != $2
        AND role IN ('Marketer', 'Admin', 'SuperAdmin')
        AND (deleted IS NULL OR deleted = FALSE)
        AND (locked IS NULL OR locked = FALSE)
      ORDER BY role, first_name, last_name
    `, [location, currentUserId]);
    
    res.json({ users: rows });
  } catch (error) {
    console.error('Error fetching users by location:', error);
    
    let errorMessage = 'Failed to fetch users';
    let errorCode = 'USERS_FETCH_ERROR';
    let statusCode = 500;
    
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      errorMessage = 'Database connection failed. Please try again in a moment.';
      errorCode = 'DATABASE_ERROR';
      statusCode = 503;
    } else if (error.message.includes('timeout')) {
      errorMessage = 'Request timed out. Please try again.';
      errorCode = 'TIMEOUT';
      statusCode = 408;
    } else if (error.message.includes('permission')) {
      errorMessage = 'You do not have permission to view users.';
      errorCode = 'PERMISSION_DENIED';
      statusCode = 403;
    } else if (error.message.includes('invalid input syntax')) {
      errorMessage = 'Invalid location provided. Please check your location.';
      errorCode = 'INVALID_LOCATION';
      statusCode = 400;
    }
    
    res.status(statusCode).json({ 
      message: errorMessage,
      errorCode: errorCode,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Use the numeric `:id` path parameter for update/delete/restore
router.put(   '/users/:id',     verifyToken, verifyRole(['MasterAdmin']), updateUser);
router.delete('/users/:id',     verifyToken, verifyRole(['MasterAdmin']), deleteUser);
router.patch( '/users/:id/restore', verifyToken, verifyRole(['MasterAdmin']), restoreUser);

// Lock / Unlock by numeric ID
router.patch('/users/:id/lock',   verifyToken, verifyRole(['MasterAdmin']), lockUser);
router.patch('/users/:id/unlock', verifyToken, verifyRole(['MasterAdmin']), unlockUser);

// --- Dashboard & Stats ---
router.get('/dashboard-summary', verifyToken, verifyRole(['MasterAdmin']), getDashboardSummary);
router.get('/total-users',      verifyToken, verifyRole(['MasterAdmin']), getTotalUsers);
router.get('/stats',            verifyToken, verifyRole(['MasterAdmin']), getStats);
router.get('/recent-activity',  verifyToken,                               getRecentActivity);

// --- Assignments (MasterAdmin only) ---
router.post('/assign-marketers-to-admin',    verifyToken, verifyRole(['MasterAdmin']), assignMarketersToAdmin);
router.post('/unassign-marketers-from-admin',verifyToken, verifyRole(['MasterAdmin']), unassignMarketersFromAdmin);
router.post('/assign-admins-to-superadmin',  verifyToken, verifyRole(['MasterAdmin']), assignAdminToSuperAdmin);
router.post('/unassign-admins-from-superadmin', verifyToken, verifyRole(['MasterAdmin']), unassignAdminsFromSuperadmin);
router.get( '/assignments',                  verifyToken, verifyRole(['MasterAdmin']), getAllAssignments);

// --- List subsets ---
router.get(
  '/marketers/:adminUniqueId',
  verifyToken,
  verifyRole(['Admin','MasterAdmin']),
  listMarketersByAdmin
);
router.get(
  '/admins/:superAdminUniqueId',
  verifyToken,
  verifyRole(['MasterAdmin']),
  listAdminsBySuperAdmin
);

// --- Dealers for Marketers/Admins ---
router.get(
  '/dealers',
  verifyToken,
  verifyRole(['Marketer','Admin','MasterAdmin']),
  getAllDealers
);

// --- Marketer Assignment Routes ---
router.post(
  '/assign-marketer',
  verifyToken,
  verifyRole(['MasterAdmin']),
  assignMarketerToAdmin
);

router.get(
  '/unassigned-marketers',
  verifyToken,
  verifyRole(['MasterAdmin']),
  getUnassignedMarketers
);

router.get(
  '/assignment-stats',
  verifyToken,
  verifyRole(['MasterAdmin']),
  getAssignmentStats
);

router.get(
  '/locations',
  verifyToken,
  verifyRole(['MasterAdmin']),
  getAllLocations
);

router.get(
  '/hierarchical-assignments',
  verifyToken,
  verifyRole(['MasterAdmin']),
  getHierarchicalAssignments
);

// --- Global error handler ---
router.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Internal Server Error' });
});

module.exports = router;
