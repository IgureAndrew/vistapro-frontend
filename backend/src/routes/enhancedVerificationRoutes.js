const express = require('express');
const multer = require('multer');
const { 
  adminPhysicalVerification, 
  superadminPhoneVerification, 
  getVerificationProgress, 
  sendVerificationReminder 
} = require('../controllers/enhancedVerificationController');
const { verifyToken, verifyRole } = require('../middlewares/authMiddleware');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/verification/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + '.' + file.originalname.split('.').pop());
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Admin Physical Verification
router.post(
  '/admin/physical-verification',
  verifyToken,
  verifyRole(['Admin']),
  upload.fields([
    { name: 'adminAtLocationPhoto', maxCount: 1 },
    { name: 'marketerAtLocationPhoto', maxCount: 1 }
  ]),
  adminPhysicalVerification
);

// SuperAdmin Phone Verification
router.post(
  '/superadmin/phone-verification',
  verifyToken,
  verifyRole(['SuperAdmin']),
  superadminPhoneVerification
);

// Get Verification Progress (accessible by all roles with proper authorization)
router.get(
  '/progress/:marketerUniqueId',
  verifyToken,
  verifyRole(['Marketer', 'Admin', 'SuperAdmin', 'MasterAdmin']),
  getVerificationProgress
);

// Send Verification Reminder
router.post(
  '/send-reminder',
  verifyToken,
  verifyRole(['Admin', 'SuperAdmin', 'MasterAdmin']),
  sendVerificationReminder
);

module.exports = router;
