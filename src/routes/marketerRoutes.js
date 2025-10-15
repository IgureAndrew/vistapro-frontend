// src/routes/marketerRoutes.js
const express = require('express');
const router  = express.Router();
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');

const { verifyToken } = require('../middlewares/authMiddleware');
const { verifyRole  } = require('../middlewares/roleMiddleware');

const {
  getAccount,
  updateAccount,
  getAccountSettings,
  updateAccountSettings,
  getPlaceOrderData,
  createOrder,
  getOrderHistory,
  submitBioData,
  submitGuarantorForm,
  submitCommitmentForm,
  listDealersByState,
  listDealerProducts,
  // New stock pickup functions
  getPickupDealers,
  checkPickupEligibility,
  createStockPickup,
  getStockPickups,
  getRecentActivities,
} = require('../controllers/marketerController');

// ensure upload dirs exist
['commitment_forms','guarantor_forms','marketer_documents'].forEach(dir => {
  const full = path.join(__dirname, '../../uploads', dir);
  if (!fs.existsSync(full)) fs.mkdirSync(full, { recursive: true });
});

// Multer storage config - use memory storage for Cloudinary uploads
const memoryStorage = multer.memoryStorage();

// multer storage
const upload = multer({ 
  storage: memoryStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'profile_image') {
      if (file.mimetype.startsWith('image/')) {
        return cb(null, true);
      }
      return cb(new Error('Only image files allowed for profile image'), false);
    }
    cb(null, true);
  }
});

// ─ Account Settings ─────────────────────────────────────────────────────────
// GET /api/marketer/account - Get Marketer account details (standardized)
router.get('/account', verifyToken, verifyRole(['Marketer']), getAccount);

// PATCH /api/marketer/account - Update Marketer account settings (standardized)
router.patch('/account', verifyToken, verifyRole(['Marketer']), upload.single('profile_image'), updateAccount);

// Legacy account settings endpoints
router.get(
  '/account-settings',
  verifyToken, verifyRole(['Marketer']),
  getAccountSettings
);
router.patch(
  '/account-settings',
  verifyToken, verifyRole(['Marketer']),
  upload.single('avatar'),
  updateAccountSettings
);

// ─ Place-Order Flow ─────────────────────────────────────────────────────────
// GET  /api/marketer/orders       → form data (stock vs free)
router.get(
  '/orders',
  verifyToken, verifyRole(['Marketer', 'SuperAdmin', 'Admin']),
  getPlaceOrderData
);
// POST /api/marketer/orders       → create a new order
router.post(
  '/orders',
  verifyToken, verifyRole(['Marketer', 'SuperAdmin', 'Admin']),
  createOrder
);

// ─ Order History ────────────────────────────────────────────────────────────
// GET /api/marketer/orders/history  → marketer's past orders
router.get(
  '/orders/history',
  verifyToken, verifyRole(['Marketer', 'SuperAdmin', 'Admin']),
  getOrderHistory
);

// ─ Bio-Data Form ─────────────────────────────────────────────────────────────
router.post(
  '/bio-data',
  verifyToken, verifyRole(['Marketer']),
  upload.fields([
    { name: 'passport_photo', maxCount: 1 },
    { name: 'id_document',    maxCount: 1 },
  ]),
  submitBioData
);

// ─ Guarantor Form ───────────────────────────────────────────────────────────
router.post(
  '/guarantor-form',
  verifyToken, verifyRole(['Marketer']),
  upload.fields([
    { name: 'id_document',    maxCount: 1 },
    { name: 'passport_photo', maxCount: 1 },
    { name: 'signature',      maxCount: 1 },
  ]),
  submitGuarantorForm
);

// ─ Commitment Form ─────────────────────────────────────────────────────────
router.post(
  '/commitment',
  verifyToken, verifyRole(['Marketer']),
  upload.single('signature'),
  submitCommitmentForm
);

// ─ Dealer lookups ───────────────────────────────────────────────────────────
router.get(
  '/dealers',
  verifyToken, verifyRole(['Marketer']),
  listDealersByState
);
router.get(
  '/dealers/:dealerUniqueId/products',
  verifyToken, verifyRole(['Marketer']),
  listDealerProducts
);

// ─ Stock Pickup Routes ───────────────────────────────────────────────────────
// GET /api/marketer/stock/pickup/dealers - Get dealers for stock pickup
router.get(
  '/stock/pickup/dealers',
  verifyToken, verifyRole(['Marketer']),
  getPickupDealers
);

// GET /api/marketer/stock/pickup/eligibility - Check pickup eligibility
router.get(
  '/stock/pickup/eligibility',
  verifyToken, verifyRole(['Marketer']),
  checkPickupEligibility
);

// POST /api/marketer/stock - Create stock pickup
router.post(
  '/stock',
  verifyToken, verifyRole(['Marketer']),
  createStockPickup
);

// GET /api/marketer/stock - Get marketer's stock pickups
router.get(
  '/stock',
  verifyToken, verifyRole(['Marketer']),
  getStockPickups
);

// GET /api/marketer/recent-activities - Get marketer's recent activities
router.get(
  '/recent-activities',
  verifyToken, verifyRole(['Marketer']),
  getRecentActivities
);

module.exports = router;
