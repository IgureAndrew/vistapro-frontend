// src/components/TargetManagement.jsx
// Component for managing targets with Master Admin control

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Modal from "./Modal";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash2, Target, Users, TrendingUp, Calendar, CheckSquare, Square, Settings } from 'lucide-react';
import { targetManagementApiService } from '@/api/targetManagementApi';
import { assignmentApiService } from '@/api/assignmentApi';
import { useToast } from "./ui/use-toast";
import TargetScaleConfiguration from './TargetScaleConfiguration';
import { getAvailablePercentages, getOrdersCountForPercentage } from '@/api/percentageMappingApi';

const TargetManagement = () => {
  const { showSuccess, showError } = useToast();
  const [targets, setTargets] = useState([]);
  const [targetTypes, setTargetTypes] = useState([]);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [availableLocations, setAvailableLocations] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [filters, setFilters] = useState({
    userRole: '',
    periodType: '',
    targetType: '',
    location: '',
    bnplPlatform: ''
  });
  const [availablePercentages, setAvailablePercentages] = useState([]);
  const [calculatedTargetValue, setCalculatedTargetValue] = useState('');
  
  // Enhanced target creation state
  const [creationMode, setCreationMode] = useState('single'); // 'single' or 'bulk'
  const [userFilters, setUserFilters] = useState({
    role: '',
    location: ''
  });
  const [selectedUsers, setSelectedUsers] = useState([]);

  // BNPL platform options
  const bnplPlatforms = [
    { value: 'WATU', label: 'WATU' },
    { value: 'EASYBUY', label: 'EASYBUY' },
    { value: 'PALMPAY', label: 'PALMPAY' },
    { value: 'CREDLOCK', label: 'CREDLOCK' }
  ];

  // Form state for creating/editing targets
  const [formData, setFormData] = useState({
    userId: '',
    targetTypeId: '',
    targetValue: '',
    targetPercentage: '',
    periodType: '',
    periodStart: '',
    periodEnd: '',
    bnplPlatform: '',
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, [filters]);

  useEffect(() => {
    loadFilteredUsers();
  }, [userFilters]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [targetsRes, targetTypesRes, statsRes] = await Promise.all([
        targetManagementApiService.getAllTargets(filters),
        targetManagementApiService.getTargetTypes(),
        targetManagementApiService.getTargetStats()
      ]);

      setTargets(targetsRes.data.data || []);
      setTargetTypes(targetTypesRes.data.data || []);
      setStats(statsRes.data.data || {});

      // Load all users for location extraction
      const usersRes = await targetManagementApiService.getUsersForTargetCreation();
      setUsers(usersRes.data.data || []);
      
      // Extract unique locations for filtering
      const locations = [...new Set(usersRes.data.data?.map(user => user.location).filter(Boolean) || [])];
      setAvailableLocations(locations);
    } catch (error) {
      console.error('Error loading data:', error);
      showError('Failed to load target data');
    } finally {
      setLoading(false);
    }
  };

  // Load filtered users based on role and location
  const loadFilteredUsers = async () => {
    try {
      const response = await targetManagementApiService.getUsersForTargetCreation(
        userFilters.role || null,
        userFilters.location || null
      );
      setFilteredUsers(response.data.data || []);
    } catch (error) {
      console.error('Error loading filtered users:', error);
      showError('Failed to load users');
    }
  };

  const handleCreateTarget = async (e) => {
    e.preventDefault();
    try {
      if (creationMode === 'single') {
      await targetManagementApiService.createTarget(formData);
        showSuccess('Target created successfully');
      } else {
        // Bulk creation
        const targetsToCreate = selectedUsers.map(userId => ({
          ...formData,
          userId: userId
        }));
        
        await targetManagementApiService.bulkCreateTargets({ targets: targetsToCreate });
        showSuccess(`${targetsToCreate.length} targets created successfully`);
      }
      
      setCreateDialogOpen(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error creating target:', error);
      showError('Failed to create target');
    }
  };

  const handleUpdateTarget = async (e) => {
    e.preventDefault();
    try {
      await targetManagementApiService.updateTarget(selectedTarget.id, formData);
      showSuccess('Target updated successfully');
      setEditDialogOpen(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error updating target:', error);
      showError('Failed to update target');
    }
  };

  const handleDeleteTarget = async (targetId) => {
    if (window.confirm('Are you sure you want to deactivate this target?')) {
      try {
        await targetManagementApiService.deactivateTarget(targetId);
        showSuccess('Target deactivated successfully');
        loadData();
      } catch (error) {
        console.error('Error deactivating target:', error);
        showError('Failed to deactivate target');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      userId: '',
      targetTypeId: '',
      targetValue: '',
      targetPercentage: '',
      periodType: '',
      periodStart: '',
      periodEnd: '',
      notes: ''
    });
    setSelectedTarget(null);
    setSelectedUsers([]);
    setUserFilters({ role: '', location: '' });
    setCreationMode('single');
    setAvailablePercentages([]);
    setCalculatedTargetValue('');
  };

  const openEditDialog = (target) => {
    setSelectedTarget(target);
    setFormData({
      userId: target.user_id,
      targetTypeId: target.target_type_id,
      targetValue: target.target_value,
      periodType: target.period_type,
      periodStart: target.period_start,
      periodEnd: target.period_end,
      bnplPlatform: target.bnpl_platform || '',
      notes: target.notes || ''
    });
    setEditDialogOpen(true);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Load available percentages for a target type
  const loadAvailablePercentages = async (targetTypeId, bnplPlatform = null, location = null) => {
    if (!targetTypeId) {
      setAvailablePercentages([]);
      return;
    }

    try {
      const targetType = targetTypes.find(type => type.id === parseInt(targetTypeId));
      if (!targetType) return;

      const response = await getAvailablePercentages(targetType.name, bnplPlatform, location);
      setAvailablePercentages(response.data.percentages || []);
    } catch (error) {
      console.error('Error loading available percentages:', error);
      setAvailablePercentages([]);
    }
  };

  // Calculate target value from percentage
  const calculateTargetValue = async (percentage, targetTypeId, bnplPlatform = null, location = null) => {
    if (!percentage || !targetTypeId) {
      setCalculatedTargetValue('');
      return;
    }

    try {
      const targetType = targetTypes.find(type => type.id === parseInt(targetTypeId));
      if (!targetType) return;

      const response = await getOrdersCountForPercentage(percentage, targetType.name, bnplPlatform, location);
      setCalculatedTargetValue(response.data.ordersCount);
    } catch (error) {
      console.error('Error calculating target value:', error);
      setCalculatedTargetValue('');
    }
  };

  const getPeriodTypeColor = (periodType) => {
    const colors = {
      daily: 'bg-blue-100 text-blue-800',
      weekly: 'bg-green-100 text-green-800',
      monthly: 'bg-yellow-100 text-yellow-800',
      quarterly: 'bg-purple-100 text-purple-800',
      yearly: 'bg-red-100 text-red-800'
    };
    return colors[periodType] || 'bg-gray-100 text-gray-800';
  };

  // Helper functions for user selection
  const handleUserSelect = (userId) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    const currentUsers = filteredUsers.length > 0 ? filteredUsers : users;
    if (selectedUsers.length === currentUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(currentUsers.map(user => user.unique_id));
    }
  };

  // Handle user filter changes
  const handleUserFilterChange = (field, value) => {
    setUserFilters(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading target data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Target Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage performance targets for all users across different periods
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Target
        </Button>
        <Modal isOpen={createDialogOpen} onClose={() => setCreateDialogOpen(false)} size="xl">
          <div>
            <h2 className="text-xl font-semibold mb-4">Create New Target</h2>
            
            {/* Mode Selection */}
            <div className="mb-6">
              <Label className="text-base font-medium">Creation Mode</Label>
              <div className="flex space-x-4 mt-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="single"
                    checked={creationMode === 'single'}
                    onChange={(e) => setCreationMode(e.target.value)}
                    className="mr-2"
                  />
                  Single Target
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="bulk"
                    checked={creationMode === 'bulk'}
                    onChange={(e) => setCreationMode(e.target.value)}
                    className="mr-2"
                  />
                  Bulk Targets
                </label>
              </div>
            </div>

            <form onSubmit={handleCreateTarget} className="space-y-4">
              {/* User Selection */}
              <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="roleFilter">Filter by Role</Label>
                    <select 
                      value={userFilters.role} 
                      onChange={(e) => handleUserFilterChange('role', e.target.value)}
                      className="select-soft h-11 w-full"
                    >
                      <option value="">All Roles</option>
                      <option value="Marketer">Marketer</option>
                      <option value="Admin">Admin</option>
                      <option value="SuperAdmin">SuperAdmin</option>
                      <option value="Dealer">Dealer</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="locationFilter">Filter by Location</Label>
                    <select 
                      value={userFilters.location} 
                      onChange={(e) => handleUserFilterChange('location', e.target.value)}
                      className="select-soft h-11 w-full"
                    >
                      <option value="">All Locations</option>
                      {availableLocations.map((location) => (
                        <option key={location} value={location}>
                          {location}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* User Selection */}
                {creationMode === 'single' ? (
                  <div>
                    <Label htmlFor="userId">Select User</Label>
                  <select 
                    value={formData.userId} 
                    onChange={(e) => setFormData({...formData, userId: e.target.value})}
                    className="select-soft h-11 w-full"
                      required
                  >
                    <option value="">Select user</option>
                      {filteredUsers.length > 0 ? filteredUsers.map((user) => (
                        <option key={user.unique_id} value={user.unique_id}>
                          {user.first_name} {user.last_name} ({user.role} - {user.location})
                        </option>
                      )) : users.map((user) => (
                      <option key={user.unique_id} value={user.unique_id}>
                          {user.first_name} {user.last_name} ({user.role} - {user.location})
                      </option>
                    ))}
                  </select>
                </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <Label className="text-base font-medium">Select Users</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleSelectAll}
                      >
                        {selectedUsers.length === (filteredUsers.length > 0 ? filteredUsers.length : users.length) ? 'Deselect All' : 'Select All'}
                      </Button>
                    </div>
                    <div className="max-h-48 overflow-y-auto border rounded-lg p-3 space-y-2">
                      {(filteredUsers.length > 0 ? filteredUsers : users).map((user) => (
                        <label key={user.unique_id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded">
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(user.unique_id)}
                            onChange={() => handleUserSelect(user.unique_id)}
                            className="rounded"
                          />
                          <div className="flex-1">
                            <div className="font-medium">{user.first_name} {user.last_name}</div>
                            <div className="text-sm text-gray-500">{user.role} - {user.location}</div>
                          </div>
                        </label>
                      ))}
                      {(filteredUsers.length === 0 && users.length === 0) && (
                        <div className="text-center py-4 text-gray-500">
                          No users found
                        </div>
                      )}
                    </div>
                    {selectedUsers.length > 0 && (
                      <div className="mt-2 text-sm text-gray-600">
                        {selectedUsers.length} user(s) selected
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Target Configuration */}
              <div className="border-t pt-4">
                <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="targetTypeId">Target Type</Label>
                  <select 
                    value={formData.targetTypeId} 
                    onChange={async (e) => {
                      const selectedType = targetTypes.find(type => type.id === parseInt(e.target.value));
                      setFormData({
                        ...formData, 
                        targetTypeId: e.target.value,
                        bnplPlatform: selectedType?.supports_bnpl ? formData.bnplPlatform : '',
                        targetPercentage: '',
                        targetValue: ''
                      });
                      setCalculatedTargetValue('');
                      
                      // Load available percentages for this target type
                      await loadAvailablePercentages(e.target.value, formData.bnplPlatform, null);
                    }}
                    className="select-soft h-11 w-full"
                      required
                  >
                    <option value="">Select target type</option>
                      {targetTypes && targetTypes.length > 0 ? targetTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name} ({type.metric_unit})
                      </option>
                      )) : (
                        <option value="" disabled>No target types available</option>
                      )}
                  </select>
                </div>
                
                {/* Percentage Selection */}
                {availablePercentages.length > 0 && (
                  <div>
                    <Label htmlFor="targetPercentage">Target Percentage</Label>
                    <select 
                      value={formData.targetPercentage} 
                      onChange={async (e) => {
                        setFormData({...formData, targetPercentage: e.target.value});
                        
                        // Calculate target value from percentage
                        if (e.target.value) {
                          await calculateTargetValue(e.target.value, formData.targetTypeId, formData.bnplPlatform, null);
                          setFormData(prev => ({
                            ...prev, 
                            targetValue: calculatedTargetValue,
                            targetPercentage: e.target.value
                          }));
                        } else {
                          setCalculatedTargetValue('');
                          setFormData(prev => ({...prev, targetValue: '', targetPercentage: ''}));
                        }
                      }}
                      className="select-soft h-11 w-full"
                    >
                      <option value="">Select percentage</option>
                      {availablePercentages.map((percentage) => (
                        <option key={percentage} value={percentage}>
                          {percentage}%
                        </option>
                      ))}
                    </select>
                    
                    {/* Instructions */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-2">
                      <div className="flex items-start space-x-2">
                        <div className="text-blue-600 mt-0.5">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="text-sm text-blue-800">
                          <p className="font-medium mb-1">How to Use Percentage Targets:</p>
                          <ul className="list-disc list-inside space-y-1 text-xs">
                            <li><strong>10-30%:</strong> Beginner level - Good for new users</li>
                            <li><strong>40-60%:</strong> Intermediate level - Standard performance</li>
                            <li><strong>70-80%:</strong> Advanced level - High performers</li>
                            <li><strong>90-100%:</strong> Expert level - Top performers</li>
                          </ul>
                          <p className="text-xs mt-2 text-blue-600">
                            The system will automatically calculate the exact target value based on your percentage selection.
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {calculatedTargetValue && (
                      <p className="text-sm text-green-600 mt-2 font-medium">
                        ✅ {formData.targetPercentage}% = {calculatedTargetValue.toLocaleString()} {targetTypes.find(t => t.id === parseInt(formData.targetTypeId))?.metric_unit || 'units'}
                      </p>
                    )}
                  </div>
                )}
                
                <div>
                  <Label htmlFor="targetValue">
                    Target Value {calculatedTargetValue && <span className="text-green-600">(Calculated from {formData.targetPercentage}%)</span>}
                  </Label>
                  <Input
                    id="targetValue"
                    type="number"
                    value={formData.targetValue}
                    onChange={(e) => setFormData({...formData, targetValue: e.target.value, targetPercentage: ''})}
                    className={calculatedTargetValue ? 'bg-green-50 border-green-300' : ''}
                    placeholder={calculatedTargetValue ? 'Calculated from percentage' : 'Enter target value or select percentage'}
                    required
                  />
                  {calculatedTargetValue && (
                    <p className="text-xs text-green-600 mt-1">
                      This value is automatically calculated from the selected percentage
                    </p>
                  )}
                </div>
                </div>
                
                {/* BNPL Platform Selection - Only show for sales targets */}
                {(() => {
                  const selectedType = targetTypes.find(type => type.id === parseInt(formData.targetTypeId));
                  return selectedType?.supports_bnpl ? (
                    <div className="mt-4">
                      <Label htmlFor="bnplPlatform">BNPL Platform</Label>
                      <select 
                        value={formData.bnplPlatform} 
                        onChange={(e) => setFormData({...formData, bnplPlatform: e.target.value})}
                        className="select-soft h-11 w-full"
                        required
                      >
                        <option value="">Select BNPL platform</option>
                        {bnplPlatforms.map((platform) => (
                          <option key={platform.value} value={platform.value}>
                            {platform.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : null;
                })()}
                
                <div className="grid grid-cols-3 gap-4 mt-4">
                <div>
                  <Label htmlFor="periodType">Period Type</Label>
                  <select 
                    value={formData.periodType} 
                    onChange={(e) => setFormData({...formData, periodType: e.target.value})}
                    className="select-soft h-11 w-full"
                      required
                  >
                    <option value="">Select period</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="periodStart">Period Start</Label>
                  <Input
                    id="periodStart"
                    type="date"
                    value={formData.periodStart}
                    onChange={(e) => setFormData({...formData, periodStart: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="periodEnd">Period End</Label>
                  <Input
                    id="periodEnd"
                    type="date"
                    value={formData.periodEnd}
                    onChange={(e) => setFormData({...formData, periodEnd: e.target.value})}
                    required
                  />
                </div>
              </div>
                <div className="mt-4">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Input
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  placeholder="Add any notes about this target..."
                />
              </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={creationMode === 'bulk' && selectedUsers.length === 0}
                >
                  {creationMode === 'single' ? 'Create Target' : `Create ${selectedUsers.length} Targets`}
                </Button>
              </div>
            </form>
          </div>
        </Modal>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Users with Targets</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.users_with_targets || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Targets</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_targets || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Weekly Targets</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.weekly_targets || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Targets</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.monthly_targets || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <Label htmlFor="userRole">User Role</Label>
              <select 
                value={filters.userRole} 
                onChange={(e) => setFilters({...filters, userRole: e.target.value})}
                className="select-soft h-11 w-full"
              >
                <option value="">All roles</option>
                <option value="Marketer">Marketer</option>
                <option value="Admin">Admin</option>
                <option value="SuperAdmin">SuperAdmin</option>
              </select>
            </div>
            <div>
              <Label htmlFor="periodType">Period Type</Label>
              <select 
                value={filters.periodType} 
                onChange={(e) => setFilters({...filters, periodType: e.target.value})}
                className="select-soft h-11 w-full"
              >
                <option value="">All periods</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
            <div>
              <Label htmlFor="targetType">Target Type</Label>
              <select 
                value={filters.targetType} 
                onChange={(e) => setFilters({...filters, targetType: e.target.value})}
                className="select-soft h-11 w-full"
              >
                <option value="">All types</option>
                {targetTypes && targetTypes.length > 0 ? targetTypes.map((type) => (
                  <option key={type.name} value={type.name}>
                    {type.name}
                  </option>
                )) : (
                  <option value="" disabled>No types available</option>
                )}
              </select>
            </div>
            <div>
              <Label htmlFor="location">Location</Label>
              <select 
                value={filters.location} 
                onChange={(e) => setFilters({...filters, location: e.target.value})}
                className="select-soft h-11 w-full"
              >
                <option value="">All locations</option>
                {availableLocations.map((location) => (
                  <option key={location} value={location}>
                    {location}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="bnplPlatform">BNPL Platform</Label>
              <select 
                value={filters.bnplPlatform} 
                onChange={(e) => setFilters({...filters, bnplPlatform: e.target.value})}
                className="select-soft h-11 w-full"
              >
                <option value="">All platforms</option>
                {bnplPlatforms.map((platform) => (
                  <option key={platform.value} value={platform.value}>
                    {platform.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Targets Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Targets</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Target Type</TableHead>
                <TableHead>Target Value</TableHead>
                <TableHead>BNPL Platform</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Date Range</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {targets && targets.length > 0 ? targets.map((target) => (
                <TableRow key={target.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{target.user_name}</div>
                      <div className="text-sm text-muted-foreground">{target.user_role}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{target.target_type_name}</div>
                      <div className="text-sm text-muted-foreground">{target.metric_unit}</div>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {target.target_value.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {target.bnpl_platform ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {target.bnpl_platform}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={getPeriodTypeColor(target.period_type)}>
                      {target.period_type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {formatDate(target.period_start)} - {formatDate(target.period_end)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={target.is_active ? "default" : "secondary"}>
                      {target.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditDialog(target)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteTarget(target.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No targets found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Modal isOpen={editDialogOpen} onClose={() => setEditDialogOpen(false)} size="lg">
        <div>
          <h2 className="text-xl font-semibold mb-4">Edit Target</h2>
          <form onSubmit={handleUpdateTarget} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-targetValue">Target Value</Label>
                <Input
                  id="edit-targetValue"
                  type="number"
                  value={formData.targetValue}
                  onChange={(e) => setFormData({...formData, targetValue: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-periodType">Period Type</Label>
                <select 
                  value={formData.periodType} 
                  onChange={(e) => setFormData({...formData, periodType: e.target.value})}
                  className="select-soft h-11 w-full"
                >
                  <option value="">Select period</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-periodStart">Period Start</Label>
                <Input
                  id="edit-periodStart"
                  type="date"
                  value={formData.periodStart}
                  onChange={(e) => setFormData({...formData, periodStart: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-periodEnd">Period End</Label>
                <Input
                  id="edit-periodEnd"
                  type="date"
                  value={formData.periodEnd}
                  onChange={(e) => setFormData({...formData, periodEnd: e.target.value})}
                  required
                />
              </div>
            </div>
            
            {/* BNPL Platform field - only show for sales targets */}
            {selectedTarget && targetTypes.find(tt => tt.id === selectedTarget.target_type_id)?.supports_bnpl && (
              <div>
                <Label htmlFor="edit-bnplPlatform">BNPL Platform</Label>
                <select 
                  value={formData.bnplPlatform || ''} 
                  onChange={(e) => setFormData({...formData, bnplPlatform: e.target.value})}
                  className="select-soft h-11 w-full"
                >
                  <option value="">Select BNPL platform</option>
                  {bnplPlatforms.map(platform => (
                    <option key={platform} value={platform}>{platform}</option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <Label htmlFor="edit-notes">Notes (Optional)</Label>
              <Input
                id="edit-notes"
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="Add any notes about this target..."
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Update Target</Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Target Scale Configuration Section */}
      <div className="mt-8">
        <TargetScaleConfiguration />
      </div>
    </div>
  );
};

export default TargetManagement;
