// src/controllers/percentageMappingController.js
// Controller for managing target percentage mappings

const percentageMappingService = require('../services/percentageMappingService');
const { logger } = require('../utils/logger');

/**
 * Get all percentage mappings
 */
const getPercentageMappings = async (req, res) => {
  try {
    const { targetType, bnplPlatform, location, isActive } = req.query;
    
    const filters = {};
    if (targetType) filters.targetType = targetType;
    if (bnplPlatform) filters.bnplPlatform = bnplPlatform;
    if (location) filters.location = location;
    if (isActive !== undefined) filters.isActive = isActive === 'true';
    
    const mappings = await percentageMappingService.getPercentageMappings(filters);
    
    res.json({
      success: true,
      data: mappings
    });
  } catch (error) {
    logger.error('Error getting percentage mappings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get percentage mappings',
      error: error.message
    });
  }
};

/**
 * Get percentage mapping by ID
 */
const getPercentageMappingById = async (req, res) => {
  try {
    const { id } = req.params;
    const mapping = await percentageMappingService.getPercentageMappingById(id);
    
    if (!mapping) {
      return res.status(404).json({
        success: false,
        message: 'Percentage mapping not found'
      });
    }
    
    res.json({
      success: true,
      data: mapping
    });
  } catch (error) {
    logger.error('Error getting percentage mapping by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get percentage mapping',
      error: error.message
    });
  }
};

/**
 * Create a new percentage mapping
 */
const createPercentageMapping = async (req, res) => {
  try {
    const mappingData = req.body;
    
    // Validate the mapping data
    const validation = percentageMappingService.validatePercentageMapping(mappingData);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.errors
      });
    }
    
    const mapping = await percentageMappingService.createPercentageMapping(mappingData);
    
    logger.info(`Percentage mapping created: ${mapping.percentage}% = ${mapping.orders_count} ${mapping.target_type}`);
    
    res.status(201).json({
      success: true,
      message: 'Percentage mapping created successfully',
      data: mapping
    });
  } catch (error) {
    logger.error('Error creating percentage mapping:', error);
    
    // Handle unique constraint violation
    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'Percentage mapping already exists for this combination',
        error: 'DUPLICATE_MAPPING'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to create percentage mapping',
      error: error.message
    });
  }
};

/**
 * Update a percentage mapping
 */
const updatePercentageMapping = async (req, res) => {
  try {
    const { id } = req.params;
    const mappingData = req.body;
    
    // Validate the mapping data
    const validation = percentageMappingService.validatePercentageMapping(mappingData);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.errors
      });
    }
    
    const mapping = await percentageMappingService.updatePercentageMapping(id, mappingData);
    
    if (!mapping) {
      return res.status(404).json({
        success: false,
        message: 'Percentage mapping not found'
      });
    }
    
    logger.info(`Percentage mapping updated: ${mapping.percentage}% = ${mapping.orders_count} ${mapping.target_type}`);
    
    res.json({
      success: true,
      message: 'Percentage mapping updated successfully',
      data: mapping
    });
  } catch (error) {
    logger.error('Error updating percentage mapping:', error);
    
    // Handle unique constraint violation
    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'Percentage mapping already exists for this combination',
        error: 'DUPLICATE_MAPPING'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to update percentage mapping',
      error: error.message
    });
  }
};

/**
 * Delete a percentage mapping
 */
const deletePercentageMapping = async (req, res) => {
  try {
    const { id } = req.params;
    const mapping = await percentageMappingService.deletePercentageMapping(id);
    
    if (!mapping) {
      return res.status(404).json({
        success: false,
        message: 'Percentage mapping not found'
      });
    }
    
    logger.info(`Percentage mapping deleted: ${mapping.percentage}% = ${mapping.orders_count} ${mapping.target_type}`);
    
    res.json({
      success: true,
      message: 'Percentage mapping deleted successfully',
      data: mapping
    });
  } catch (error) {
    logger.error('Error deleting percentage mapping:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete percentage mapping',
      error: error.message
    });
  }
};

/**
 * Get orders count for a specific percentage
 */
const getOrdersCountForPercentage = async (req, res) => {
  try {
    const { percentage, targetType, bnplPlatform, location } = req.query;
    
    if (!percentage || !targetType) {
      return res.status(400).json({
        success: false,
        message: 'Percentage and target type are required'
      });
    }
    
    const ordersCount = await percentageMappingService.getOrdersCountForPercentage(
      parseInt(percentage),
      targetType,
      bnplPlatform || null,
      location || null
    );
    
    res.json({
      success: true,
      data: {
        percentage: parseInt(percentage),
        targetType,
        ordersCount,
        bnplPlatform,
        location
      }
    });
  } catch (error) {
    logger.error('Error getting orders count for percentage:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get orders count for percentage',
      error: error.message
    });
  }
};

/**
 * Get available percentages for a target type
 */
const getAvailablePercentages = async (req, res) => {
  try {
    const { targetType, bnplPlatform, location } = req.query;
    
    if (!targetType) {
      return res.status(400).json({
        success: false,
        message: 'Target type is required'
      });
    }
    
    const percentages = await percentageMappingService.getAvailablePercentages(
      targetType,
      bnplPlatform || null,
      location || null
    );
    
    res.json({
      success: true,
      data: {
        targetType,
        percentages,
        bnplPlatform,
        location
      }
    });
  } catch (error) {
    logger.error('Error getting available percentages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get available percentages',
      error: error.message
    });
  }
};

module.exports = {
  getPercentageMappings,
  getPercentageMappingById,
  createPercentageMapping,
  updatePercentageMapping,
  deletePercentageMapping,
  getOrdersCountForPercentage,
  getAvailablePercentages
};
