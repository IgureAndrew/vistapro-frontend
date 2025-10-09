// src/components/PercentageMappingModal.jsx
// Modal for adding/editing percentage mappings

import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Plus, Save, X } from 'lucide-react';

const PercentageMappingModal = ({ 
  isOpen, 
  onClose, 
  onSave, 
  mapping = null, 
  targetTypes = [],
  bnplPlatforms = [],
  availableLocations = []
}) => {
  const [formData, setFormData] = useState({
    percentage: '',
    orders_count: '',
    target_type: 'orders',
    bnpl_platform: '',
    location: '',
    is_active: true
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Initialize form data when mapping is provided (edit mode)
  useEffect(() => {
    if (mapping) {
      setFormData({
        percentage: mapping.percentage?.toString() || '',
        orders_count: mapping.orders_count?.toString() || '',
        target_type: mapping.target_type || 'orders',
        bnpl_platform: mapping.bnpl_platform || '',
        location: mapping.location || '',
        is_active: mapping.is_active !== undefined ? mapping.is_active : true
      });
    } else {
      // Reset form for new mapping
      setFormData({
        percentage: '',
        orders_count: '',
        target_type: 'orders',
        bnpl_platform: '',
        location: '',
        is_active: true
      });
    }
    setErrors({});
  }, [mapping, isOpen]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.percentage || formData.percentage < 1 || formData.percentage > 100) {
      newErrors.percentage = 'Percentage must be between 1 and 100';
    }

    if (!formData.orders_count || formData.orders_count < 1) {
      newErrors.orders_count = 'Orders count must be greater than 0';
    }

    if (!formData.target_type) {
      newErrors.target_type = 'Target type is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const mappingData = {
        percentage: parseInt(formData.percentage),
        orders_count: parseInt(formData.orders_count),
        target_type: formData.target_type,
        bnpl_platform: formData.bnpl_platform || null,
        location: formData.location || null,
        is_active: formData.is_active
      };

      await onSave(mappingData);
      onClose();
    } catch (error) {
      console.error('Error saving percentage mapping:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            {mapping ? 'Edit Percentage Mapping' : 'Add Percentage Mapping'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="percentage">Percentage *</Label>
              <Input
                id="percentage"
                type="number"
                min="1"
                max="100"
                value={formData.percentage}
                onChange={(e) => handleInputChange('percentage', e.target.value)}
                placeholder="Enter percentage (1-100)"
                className={errors.percentage ? 'border-red-500' : ''}
                required
              />
              {errors.percentage && (
                <p className="text-sm text-red-500 mt-1">{errors.percentage}</p>
              )}
            </div>

            <div>
              <Label htmlFor="orders_count">Orders Count *</Label>
              <Input
                id="orders_count"
                type="number"
                min="1"
                value={formData.orders_count}
                onChange={(e) => handleInputChange('orders_count', e.target.value)}
                placeholder="Enter orders count"
                className={errors.orders_count ? 'border-red-500' : ''}
                required
              />
              {errors.orders_count && (
                <p className="text-sm text-red-500 mt-1">{errors.orders_count}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="target_type">Target Type *</Label>
            <Select
              value={formData.target_type}
              onValueChange={(value) => handleInputChange('target_type', value)}
            >
              <SelectTrigger className={errors.target_type ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select target type" />
              </SelectTrigger>
              <SelectContent>
                {targetTypes.map((type) => (
                  <SelectItem key={type.id} value={type.name}>
                    {type.name} ({type.description})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.target_type && (
              <p className="text-sm text-red-500 mt-1">{errors.target_type}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="bnpl_platform">BNPL Platform (Optional)</Label>
              <Select
                value={formData.bnpl_platform}
                onValueChange={(value) => handleInputChange('bnpl_platform', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select BNPL platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Platforms</SelectItem>
                  {bnplPlatforms.map((platform) => (
                    <SelectItem key={platform} value={platform}>
                      {platform}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="location">Location (Optional)</Label>
              <Select
                value={formData.location}
                onValueChange={(value) => handleInputChange('location', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Locations</SelectItem>
                  {availableLocations.map((location) => (
                    <SelectItem key={location} value={location}>
                      {location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => handleInputChange('is_active', e.target.checked)}
              className="rounded border-gray-300"
            />
            <Label htmlFor="is_active">Active</Label>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>{mapping ? 'Update' : 'Create'} Mapping</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default PercentageMappingModal;
