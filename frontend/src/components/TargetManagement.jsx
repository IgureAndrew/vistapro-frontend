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
import { Plus, Edit, Trash2, Target, Users, TrendingUp, Calendar } from 'lucide-react';
import { targetManagementApiService } from '@/api/targetManagementApi';
import { assignmentApiService } from '@/api/assignmentApi';
import { useToast } from "./ui/use-toast";

const TargetManagement = () => {
  const { toast } = useToast();
  const [targets, setTargets] = useState([]);
  const [targetTypes, setTargetTypes] = useState([]);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [filters, setFilters] = useState({
    userRole: '',
    periodType: '',
    targetType: ''
  });

  // Form state for creating/editing targets
  const [formData, setFormData] = useState({
    userId: '',
    targetTypeId: '',
    targetValue: '',
    periodType: '',
    periodStart: '',
    periodEnd: '',
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [targetsRes, targetTypesRes, statsRes] = await Promise.all([
        targetManagementApiService.getAllTargets(filters),
        targetManagementApiService.getTargetTypes(),
        targetManagementApiService.getTargetStats()
      ]);

      setTargets(targetsRes.data.data);
      setTargetTypes(targetTypesRes.data.data);
      setStats(statsRes.data.data);

      // Load users for the form
      const usersRes = await assignmentApiService.getAvailableAssignees();
      setUsers(usersRes.data.data);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load target data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTarget = async (e) => {
    e.preventDefault();
    try {
      await targetManagementApiService.createTarget(formData);
      toast({
        title: 'Success',
        description: 'Target created successfully'
      });
      setCreateDialogOpen(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error creating target:', error);
      toast({
        title: 'Error',
        description: 'Failed to create target',
        variant: 'destructive'
      });
    }
  };

  const handleUpdateTarget = async (e) => {
    e.preventDefault();
    try {
      await targetManagementApiService.updateTarget(selectedTarget.id, formData);
      toast({
        title: 'Success',
        description: 'Target updated successfully'
      });
      setEditDialogOpen(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error updating target:', error);
      toast({
        title: 'Error',
        description: 'Failed to update target',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteTarget = async (targetId) => {
    if (window.confirm('Are you sure you want to deactivate this target?')) {
      try {
        await targetManagementApiService.deactivateTarget(targetId);
        toast({
          title: 'Success',
          description: 'Target deactivated successfully'
        });
        loadData();
      } catch (error) {
        console.error('Error deactivating target:', error);
        toast({
          title: 'Error',
          description: 'Failed to deactivate target',
          variant: 'destructive'
        });
      }
    }
  };

  const resetForm = () => {
    setFormData({
      userId: '',
      targetTypeId: '',
      targetValue: '',
      periodType: '',
      periodStart: '',
      periodEnd: '',
      notes: ''
    });
    setSelectedTarget(null);
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
      notes: target.notes || ''
    });
    setEditDialogOpen(true);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
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
        <Modal isOpen={createDialogOpen} onClose={() => setCreateDialogOpen(false)}>
          <div className="max-w-2xl">
            <h2 className="text-xl font-semibold mb-4">Create New Target</h2>
            <form onSubmit={handleCreateTarget} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="userId">User</Label>
                  <select 
                    value={formData.userId} 
                    onChange={(e) => setFormData({...formData, userId: e.target.value})}
                    className="select-soft h-11 w-full"
                  >
                    <option value="">Select user</option>
                    {users.map((user) => (
                      <option key={user.unique_id} value={user.unique_id}>
                        {user.first_name} {user.last_name} ({user.role})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="targetTypeId">Target Type</Label>
                  <select 
                    value={formData.targetTypeId} 
                    onChange={(e) => setFormData({...formData, targetTypeId: e.target.value})}
                    className="select-soft h-11 w-full"
                  >
                    <option value="">Select target type</option>
                    {targetTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name} ({type.metric_unit})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="targetValue">Target Value</Label>
                  <Input
                    id="targetValue"
                    type="number"
                    value={formData.targetValue}
                    onChange={(e) => setFormData({...formData, targetValue: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="periodType">Period Type</Label>
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
              <div>
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Input
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  placeholder="Add any notes about this target..."
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create Target</Button>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                {targetTypes.map((type) => (
                  <option key={type.name} value={type.name}>
                    {type.name}
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
                <TableHead>Period</TableHead>
                <TableHead>Date Range</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {targets.map((target) => (
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
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Modal isOpen={editDialogOpen} onClose={() => setEditDialogOpen(false)}>
        <div className="max-w-2xl">
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
    </div>
  );
};

export default TargetManagement;
