// src/components/TargetScaleConfiguration.jsx
// Component for managing target percentage mappings

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Plus, Edit, Trash2, Filter, Search } from 'lucide-react';
import PercentageMappingModal from './PercentageMappingModal';
import { 
  getPercentageMappings, 
  createPercentageMapping, 
  updatePercentageMapping, 
  deletePercentageMapping 
} from '../api/percentageMappingApi';
import { showSuccess, showError } from '../utils/toast';

const TargetScaleConfiguration = () => {
  const [mappings, setMappings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMapping, setEditingMapping] = useState(null);
  const [targetTypes, setTargetTypes] = useState([]);
  const [bnplPlatforms] = useState(['WATU', 'EASYBUY', 'PALMPAY', 'CREDLOCK']);
  const [availableLocations, setAvailableLocations] = useState([]);
  
  // Filters
  const [filters, setFilters] = useState({
    targetType: '',
    bnplPlatform: '',
    location: '',
    search: ''
  });

  useEffect(() => {
    loadMappings();
    loadTargetTypes();
    loadLocations();
  }, []);

  useEffect(() => {
    loadMappings();
  }, [filters]);

  const loadMappings = async () => {
    try {
      setLoading(true);
      const filterParams = {};
      
      if (filters.targetType) filterParams.targetType = filters.targetType;
      if (filters.bnplPlatform) filterParams.bnplPlatform = filters.bnplPlatform;
      if (filters.location) filterParams.location = filters.location;
      
      const response = await getPercentageMappings(filterParams);
      
      let filteredMappings = response.data || [];
      
      // Client-side search filter
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        filteredMappings = filteredMappings.filter(mapping => 
          mapping.percentage.toString().includes(searchTerm) ||
          mapping.orders_count.toString().includes(searchTerm) ||
          mapping.target_type.toLowerCase().includes(searchTerm) ||
          (mapping.bnpl_platform && mapping.bnpl_platform.toLowerCase().includes(searchTerm)) ||
          (mapping.location && mapping.location.toLowerCase().includes(searchTerm))
        );
      }
      
      setMappings(filteredMappings);
    } catch (error) {
      console.error('Error loading mappings:', error);
      showError('Failed to load percentage mappings');
    } finally {
      setLoading(false);
    }
  };

  const loadTargetTypes = async () => {
    try {
      // This would typically come from the target management API
      // For now, using static data
      setTargetTypes([
        { id: 1, name: 'orders', description: 'Number of orders to complete' },
        { id: 2, name: 'sales', description: 'Sales revenue target' },
        { id: 3, name: 'recruitment', description: 'Number of new marketers recruited' },
        { id: 4, name: 'customers', description: 'Number of new customers' },
        { id: 5, name: 'conversion_rate', description: 'Order conversion rate' }
      ]);
    } catch (error) {
      console.error('Error loading target types:', error);
    }
  };

  const loadLocations = async () => {
    try {
      // This would typically come from a locations API
      // For now, using static data
      setAvailableLocations(['Lagos', 'Abuja', 'Port Harcourt', 'Kano', 'Ibadan']);
    } catch (error) {
      console.error('Error loading locations:', error);
    }
  };

  const handleCreateMapping = async (mappingData) => {
    try {
      const response = await createPercentageMapping(mappingData);
      showSuccess('Percentage mapping created successfully');
      loadMappings();
    } catch (error) {
      console.error('Error creating mapping:', error);
      if (error.response?.data?.error === 'DUPLICATE_MAPPING') {
        showError('A mapping already exists for this combination');
      } else {
        showError('Failed to create percentage mapping');
      }
    }
  };

  const handleUpdateMapping = async (mappingData) => {
    try {
      await updatePercentageMapping(editingMapping.id, mappingData);
      showSuccess('Percentage mapping updated successfully');
      setEditingMapping(null);
      loadMappings();
    } catch (error) {
      console.error('Error updating mapping:', error);
      if (error.response?.data?.error === 'DUPLICATE_MAPPING') {
        showError('A mapping already exists for this combination');
      } else {
        showError('Failed to update percentage mapping');
      }
    }
  };

  const handleDeleteMapping = async (id) => {
    if (!window.confirm('Are you sure you want to delete this percentage mapping?')) {
      return;
    }

    try {
      await deletePercentageMapping(id);
      showSuccess('Percentage mapping deleted successfully');
      loadMappings();
    } catch (error) {
      console.error('Error deleting mapping:', error);
      showError('Failed to delete percentage mapping');
    }
  };

  const handleEditMapping = (mapping) => {
    setEditingMapping(mapping);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingMapping(null);
  };

  const handleSaveMapping = (mappingData) => {
    if (editingMapping) {
      handleUpdateMapping(mappingData);
    } else {
      handleCreateMapping(mappingData);
    }
  };

  const getTargetTypeDescription = (targetType) => {
    const type = targetTypes.find(t => t.name === targetType);
    return type ? type.description : targetType;
  };

  const filteredMappings = mappings.filter(mapping => {
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      return (
        mapping.percentage.toString().includes(searchTerm) ||
        mapping.orders_count.toString().includes(searchTerm) ||
        mapping.target_type.toLowerCase().includes(searchTerm) ||
        (mapping.bnpl_platform && mapping.bnpl_platform.toLowerCase().includes(searchTerm)) ||
        (mapping.location && mapping.location.toLowerCase().includes(searchTerm))
      );
    }
    return true;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Filter className="h-5 w-5" />
          <span>Target Scale Configuration</span>
        </CardTitle>
        <p className="text-sm text-gray-600">
          Configure percentage-to-orders mappings for target setting
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-64">
            <Input
              placeholder="Search mappings..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="h-10"
            />
          </div>
          
          <select
            value={filters.targetType}
            onChange={(e) => setFilters(prev => ({ ...prev, targetType: e.target.value }))}
            className="select-soft h-10 w-48 border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="">All Target Types</option>
            {targetTypes.map((type) => (
              <option key={type.id} value={type.name}>
                {type.name}
              </option>
            ))}
          </select>

          <select
            value={filters.bnplPlatform}
            onChange={(e) => setFilters(prev => ({ ...prev, bnplPlatform: e.target.value }))}
            className="select-soft h-10 w-48 border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="">All Platforms</option>
            {bnplPlatforms.map((platform) => (
              <option key={platform} value={platform}>
                {platform}
              </option>
            ))}
          </select>

          <select
            value={filters.location}
            onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
            className="select-soft h-10 w-48 border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="">All Locations</option>
            {availableLocations.map((location) => (
              <option key={location} value={location}>
                {location}
              </option>
            ))}
          </select>

          <Button
            onClick={() => setModalOpen(true)}
            className="flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Add Mapping</span>
          </Button>
        </div>

        {/* Mappings Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Percentage</TableHead>
                <TableHead>Orders Count</TableHead>
                <TableHead>Target Type</TableHead>
                <TableHead>BNPL Platform</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  </TableCell>
                </TableRow>
              ) : filteredMappings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    No percentage mappings found
                  </TableCell>
                </TableRow>
              ) : (
                filteredMappings.map((mapping) => (
                  <TableRow key={mapping.id}>
                    <TableCell className="font-medium">
                      <Badge variant="outline">{mapping.percentage}%</Badge>
                    </TableCell>
                    <TableCell>{mapping.orders_count.toLocaleString()}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{mapping.target_type}</div>
                        <div className="text-sm text-gray-500">
                          {getTargetTypeDescription(mapping.target_type)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {mapping.bnpl_platform ? (
                        <Badge variant="secondary">{mapping.bnpl_platform}</Badge>
                      ) : (
                        <span className="text-gray-400">All Platforms</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {mapping.location ? (
                        <Badge variant="secondary">{mapping.location}</Badge>
                      ) : (
                        <span className="text-gray-400">All Locations</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={mapping.is_active ? 'default' : 'secondary'}>
                        {mapping.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditMapping(mapping)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteMapping(mapping.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Modal */}
        <PercentageMappingModal
          isOpen={modalOpen}
          onClose={handleCloseModal}
          onSave={handleSaveMapping}
          mapping={editingMapping}
          targetTypes={targetTypes}
          bnplPlatforms={bnplPlatforms}
          availableLocations={availableLocations}
        />
      </CardContent>
    </Card>
  );
};

export default TargetScaleConfiguration;
