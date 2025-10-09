// src/routes/percentageMappingRoutes.js
// Routes for managing target percentage mappings

const express = require('express');
const router = express.Router();
const percentageMappingController = require('../controllers/percentageMappingController');
const { verifyToken } = require('../middlewares/authMiddleware');
const { verifyRole } = require('../middlewares/roleMiddleware');

// Apply authentication to all routes
router.use(verifyToken);

// Apply Master Admin role verification to all routes
router.use(verifyRole(['MasterAdmin']));

// Get all percentage mappings
router.get('/', percentageMappingController.getPercentageMappings);

// Get percentage mapping by ID
router.get('/:id', percentageMappingController.getPercentageMappingById);

// Create a new percentage mapping
router.post('/', percentageMappingController.createPercentageMapping);

// Update a percentage mapping
router.put('/:id', percentageMappingController.updatePercentageMapping);

// Delete a percentage mapping
router.delete('/:id', percentageMappingController.deletePercentageMapping);

// Get orders count for a specific percentage (utility endpoint)
router.get('/utility/orders-count', percentageMappingController.getOrdersCountForPercentage);

// Get available percentages for a target type (utility endpoint)
router.get('/utility/available-percentages', percentageMappingController.getAvailablePercentages);

module.exports = router;
