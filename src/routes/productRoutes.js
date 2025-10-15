// src/routes/productRoutes.js
const express = require('express');
const router = express.Router();
const { verifyToken }    = require('../middlewares/authMiddleware');
const { verifyRole }     = require('../middlewares/roleMiddleware');
const {
  addProduct,
  getProducts,
  updateProduct,
  deleteProduct,
  listProducts,
  getAllProducts,
  getProductActivityHistory,
  getRecentProductActivities
} = require('../controllers/productController');

// → Allow MasterAdmin **or** Dealer to add
router.post(
  '/',
  verifyToken,
  verifyRole(['MasterAdmin','Dealer']),
  addProduct
);

// → anyone authenticated can list
router.get(
  '/',
  verifyToken,
  getProducts
);

// → Only MasterAdmin can update
router.put(
  '/:id',
  verifyToken,
  verifyRole(['MasterAdmin']),
  updateProduct
);

// → Only MasterAdmin can delete
router.delete(
  '/:id',
  verifyToken,
  verifyRole(['MasterAdmin']),
  deleteProduct
);

// → Get product activity history (MasterAdmin only)
router.get(
  '/activity-history',
  verifyToken,
  verifyRole(['MasterAdmin']),
  getProductActivityHistory
);

// → Get recent product activities (MasterAdmin only)
router.get(
  '/recent-activities',
  verifyToken,
  verifyRole(['MasterAdmin']),
  getRecentProductActivities
);

router.get("/", listProducts);
router.get("/", getAllProducts);

module.exports = router;
