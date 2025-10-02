// src/routes/stockupdateRoutes.js
const express          = require('express');
const router           = express.Router();
const { verifyToken }  = require('../middlewares/authMiddleware');
const { verifyRole }   = require('../middlewares/roleMiddleware');
const ctrl             = require('../controllers/stockupdateController');

/** MARKETER, SUPERADMIN, ADMIN **/
// 1) List dealers in your state
router.get(
  '/pickup/dealers',
  verifyToken,
  verifyRole(['Marketer', 'SuperAdmin', 'Admin']),
  ctrl.listStockPickupDealers
);

// 2) List available products for a dealer
router.get(
  '/pickup/dealers/:dealerUniqueId/products',
  verifyToken,
  verifyRole(['Marketer', 'SuperAdmin', 'Admin']),
  ctrl.listStockProductsByDealer
);

// 3) Pick up stock (qty always 1 or up to allowance)
router.post(
  '/',
  verifyToken,
  verifyRole(['Marketer', 'SuperAdmin', 'Admin']),
  ctrl.createStockUpdate
);

// 4) Place an order from a pending pickup
router.post(
  '/order',
  verifyToken,
  verifyRole(['Marketer', 'SuperAdmin', 'Admin']),
  ctrl.placeOrder
);

// 5) Transfer a pending pickup to another marketer
router.post(
  '/:id/transfer',
  verifyToken,
  verifyRole(['Marketer', 'SuperAdmin', 'Admin']),
  ctrl.requestStockTransfer
);

// 6) Request return on a pending pickup
router.patch(
  '/:id/return-request',
  verifyToken,
  verifyRole(['Marketer', 'SuperAdmin', 'Admin']),
  ctrl.requestReturn
);

// 7) Ask for extra‐pickup allowance (up to 3)
router.post(
  '/pickup/request-additional',
  verifyToken,
  verifyRole(['Marketer', 'SuperAdmin', 'Admin']),
  ctrl.requestAdditionalPickup
);

// 8) Check your current pickup allowance (1 or 3)
router.get(
  '/pickup/allowance',
  verifyToken,
  verifyRole(['Marketer', 'SuperAdmin', 'Admin']),
  ctrl.getAllowance
);

// 9) List your own pickups
router.get(
  '/marketer',
  verifyToken,
  verifyRole(['Marketer', 'SuperAdmin', 'Admin']),
  ctrl.getMarketerStockUpdates
);


/** MASTER‐ADMIN‐ONLY **/
// 10) Confirm a return
router.patch(
  '/:id/return',
  verifyToken,
  verifyRole(['MasterAdmin']),
  ctrl.confirmReturn
);

// 11) List all pending extra‐pickup requests
router.get(
  '/pickup/requests',
  verifyToken,
  verifyRole(['MasterAdmin']),
  ctrl.listExtraPickupRequests
);

// 12) Approve or reject an extra‐pickup request
router.patch(
  '/pickup/requests/:id',
  verifyToken,
  verifyRole(['MasterAdmin']),
  ctrl.reviewExtraPickupRequest
);


/** ADMIN‐ONLY **/
// 13) Admin sees pickups under their marketers
router.get(
  '/admin/stock-pickup',
  verifyToken,
  verifyRole(['Admin']),
  ctrl.getStockUpdatesForAdmin
);


/** SUPER‐ADMIN‐ONLY **/
// 14) SuperAdmin sees all pickups in their hierarchy
router.get(
  '/superadmin/stock-updates',
  verifyToken,
  verifyRole(['SuperAdmin']),
  ctrl.listSuperAdminStockUpdates
);


/** ALL STAFF (MasterAdmin, Admin, SuperAdmin) **/
// 15) Global list of all pickups
router.get(
  '/',
  verifyToken,
  verifyRole(['MasterAdmin','Admin','SuperAdmin']),
  ctrl.getStockUpdates
);

/** ENHANCED PICKUP SYSTEM ROUTES **/

// 16) Check additional pickup eligibility
router.get(
  '/pickup/eligibility',
  verifyToken,
  verifyRole(['Marketer', 'SuperAdmin', 'Admin']),
  ctrl.checkAdditionalPickupEligibility
);

// 17) Track pickup completion (sold/returned/transferred)
router.post(
  '/pickup/completion',
  verifyToken,
  verifyRole(['Marketer', 'SuperAdmin', 'Admin']),
  ctrl.trackPickupCompletion
);

// 18) MasterAdmin confirm return/transfer
router.patch(
  '/pickup/confirm',
  verifyToken,
  verifyRole(['MasterAdmin']),
  ctrl.confirmReturnTransfer
);

// 19) Get pending confirmations for MasterAdmin
router.get(
  '/pickup/pending-confirmations',
  verifyToken,
  verifyRole(['MasterAdmin']),
  ctrl.getPendingConfirmations
);

/** VIOLATION SYSTEM ROUTES **/

// 20) MasterAdmin unlock blocked account
router.post(
  '/violations/unlock/:userId',
  verifyToken,
  verifyRole(['MasterAdmin']),
  ctrl.unlockBlockedAccount
);

// 21) Get all blocked accounts for MasterAdmin
router.get(
  '/violations/blocked-accounts',
  verifyToken,
  verifyRole(['MasterAdmin']),
  ctrl.getBlockedAccounts
);

// 22) Get violation logs for a specific user
router.get(
  '/violations/user/:userId/logs',
  verifyToken,
  verifyRole(['MasterAdmin']),
  ctrl.getUserViolationLogs
);

/** ENHANCED STOCK PICKUP MANAGEMENT ROUTES **/

// 23) MasterAdmin confirm order
router.post(
  '/order/confirm',
  verifyToken,
  verifyRole(['MasterAdmin']),
  ctrl.confirmOrder
);

// 24) MasterAdmin confirm return/transfer (new version)
router.post(
  '/return-transfer/confirm',
  verifyToken,
  verifyRole(['MasterAdmin']),
  ctrl.confirmReturnTransferNew
);

// 25) Get pending order confirmations for MasterAdmin
router.get(
  '/order/pending-confirmations',
  verifyToken,
  verifyRole(['MasterAdmin']),
  ctrl.getPendingOrderConfirmations
);

// 26) Get pending return/transfer confirmations for MasterAdmin
router.get(
  '/return-transfer/pending-confirmations',
  verifyToken,
  verifyRole(['MasterAdmin']),
  ctrl.getPendingReturnTransferConfirmations
);

module.exports = router;
