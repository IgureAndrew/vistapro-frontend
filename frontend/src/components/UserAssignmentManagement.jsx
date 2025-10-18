// src/components/UserAssignmentManagement.jsx
// Component for managing user assignments (marketers to admins/superadmins)

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Modal from "./Modal";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash2, Users, UserCheck, UserX, TrendingUp, Search, MapPin, Filter, ArrowLeft } from 'lucide-react';
import { assignmentApiService } from '@/api/assignmentApi';
import { adminAssignmentApiService } from '@/api/adminAssignmentApi';
import { useToast } from "./ui/use-toast";

const UserAssignmentManagement = ({ isDarkMode = false, onNavigate }) => {
  const { addToast, showSuccess, showError, showWarning } = useToast();
  
  // Get current user role
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [unassignedMarketers, setUnassignedMarketers] = useState([]);
  const [availableAssignees, setAvailableAssignees] = useState([]);
  const [currentAssignments, setCurrentAssignments] = useState({});
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [bulkAssignDialogOpen, setBulkAssignDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [selectedMarketers, setSelectedMarketers] = useState([]);

  // Filter states for Current Assignments
  const [hierarchySearch, setHierarchySearch] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [availableLocations, setAvailableLocations] = useState([]);

  // Form state for creating/editing assignments
  const [formData, setFormData] = useState({
    marketerId: '',
    assignedToId: '',
    assignmentType: '',
    notes: ''
  });

  // Form state for bulk assignment
  const [bulkFormData, setBulkFormData] = useState({
    assignedToId: '',
    assignmentType: '',
    notes: ''
  });

  // Load current user and role
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
      setCurrentUser(user);
      setUserRole(user.role);
    }
  }, []);

  // Load data when user role and currentUser are available
  useEffect(() => {
    if (userRole && currentUser) {
      loadData();
    }
  }, [userRole, currentUser]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Debug authentication
      const token = localStorage.getItem('token');
      console.log('Current token:', token ? 'Present' : 'Missing');
      console.log('Current user:', currentUser);
      
      if (userRole === 'MasterAdmin') {
        // MasterAdmin loads all data
        const [unassignedRes, assigneesRes, statsRes, assignmentsRes, locationsRes] = await Promise.all([
        assignmentApiService.getUnassignedMarketers(),
        assignmentApiService.getAvailableAssignees(),
        assignmentApiService.getAssignmentStats(),
        assignmentApiService.getCurrentAssignments(),
        assignmentApiService.getAllLocations()
      ]);

        console.log('API Responses:', {
          unassignedRes: unassignedRes.data,
          assigneesRes: assigneesRes.data,
          statsRes: statsRes.data,
          assignmentsRes: assignmentsRes.data,
          locationsRes: locationsRes.data
        });
        
        console.log('Unassigned marketers data:', unassignedRes.data?.marketers || unassignedRes.data || []);
        
        setUnassignedMarketers(unassignedRes.data?.marketers || unassignedRes.data || []);
        // Handle both array and object response from getAvailableAssignees
        const assigneesData = assigneesRes.data?.data || assigneesRes.data;
        setAvailableAssignees(Array.isArray(assigneesData) ? assigneesData : []);
        setStats(statsRes.data || {});
        setCurrentAssignments(assignmentsRes.data || {});
        setAvailableLocations(locationsRes.data || []);
      } else if (userRole === 'Admin') {
        // Admin loads only their assigned marketers using Admin API
        console.log('Loading assigned marketers for Admin:', currentUser.unique_id);
        const [assignmentsRes, statsRes] = await Promise.all([
          adminAssignmentApiService.getAssignedMarketers(),
          adminAssignmentApiService.getAssignmentStats()
        ]);
        
        console.log('Admin Assignments API response:', assignmentsRes);
        console.log('Admin Stats API response:', statsRes);
        
        // Handle Admin API response format
        const marketersData = assignmentsRes.data?.marketers || assignmentsRes.data || [];
        const statsData = statsRes.data?.stats || statsRes.data || {};
        
        console.log('Final Admin marketers data:', marketersData);
        console.log('Final Admin stats data:', statsData);
        
        setCurrentAssignments(marketersData);
        setStats(statsData);
        setUnassignedMarketers([]);
        setAvailableAssignees([]);
      } else {
        // SuperAdmin loads only their assigned marketers using MasterAdmin API
        console.log('Loading assigned marketers for SuperAdmin:', currentUser.unique_id);
        const [assignmentsRes, statsRes] = await Promise.all([
          assignmentApiService.getAssignedMarketers(currentUser.unique_id),
          assignmentApiService.getAssignmentStats()
        ]);
        
        console.log('SuperAdmin Assignments API response:', assignmentsRes);
        console.log('SuperAdmin Stats API response:', statsRes);
        
        // Handle SuperAdmin API response format
        const marketersData = assignmentsRes.data?.data || assignmentsRes.data || [];
        const statsData = statsRes.data?.data || statsRes.data || {};
        
        console.log('Final SuperAdmin marketers data:', marketersData);
        console.log('Final SuperAdmin stats data:', statsData);
        
        setCurrentAssignments(marketersData);
        setStats(statsData);
        setUnassignedMarketers([]);
        setAvailableAssignees([]);
      }
    } catch (error) {
      console.error('Error loading assignment data:', error);
      console.error('Error details:', error.response?.data || error.message);
      
      if (error.response?.status === 401) {
        showError("Please log in again to continue", "Authentication Error");
        // Redirect to login
        window.location.href = '/';
      } else {
        showError("Failed to load assignment data", "Error");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAssignMarketer = async (e) => {
    e.preventDefault();
    try {
      // Check if this is an admin-to-superadmin assignment
      if (formData.assignmentType === 'superadmin') {
        // Get the admin's unique_id
        const admin = availableAssignees.find(a => a.unique_id === formData.marketerId);
        const superAdmin = availableAssignees.find(a => a.unique_id === formData.assignedToId);
        
        if (!admin || !superAdmin) {
          showError("Invalid admin or superadmin selected");
          return;
        }
        
        const assignmentData = {
          adminUniqueId: admin.unique_id,
          superAdminUniqueId: superAdmin.unique_id
        };
        
        await adminAssignmentApiService.assignAdminToSuperAdmin(assignmentData);
        showSuccess("Admin assigned to SuperAdmin successfully");
      } else {
        // Regular marketer-to-admin assignment
        const assignmentData = {
          marketerId: formData.marketerId,
          adminId: formData.assignedToId,
          assignmentType: formData.assignmentType,
          notes: formData.notes
        };
        
        await assignmentApiService.assignMarketer(assignmentData);
        showSuccess("Marketer assigned successfully");
      }
      
      setAssignDialogOpen(false);
      setFormData({ marketerId: '', assignedToId: '', assignmentType: '', notes: '' });
      loadData();
    } catch (error) {
      console.error('Error assigning:', error);
      
      // Extract specific error message from API response
      let errorMessage = formData.assignmentType === 'superadmin' 
        ? "Failed to assign admin to superadmin"
        : "Failed to assign marketer";
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      showError(errorMessage);
    }
  };

  const handleBulkAssignMarketers = async (e) => {
    e.preventDefault();
    try {
      await assignmentApiService.bulkAssignMarketers({
        ...bulkFormData,
        marketerIds: selectedMarketers
      });
      showSuccess(`${selectedMarketers.length} marketers assigned successfully`);
      setBulkAssignDialogOpen(false);
      setBulkFormData({ assignedToId: '', assignmentType: '', notes: '' });
      setSelectedMarketers([]);
      loadData();
    } catch (error) {
      console.error('Error bulk assigning marketers:', error);
      showError("Failed to assign marketers");
    }
  };

  const handleUpdateAssignment = async (e) => {
    e.preventDefault();
    try {
      await assignmentApiService.updateAssignment(selectedAssignment.id, formData);
      showSuccess("Assignment updated successfully");
      setEditDialogOpen(false);
      setSelectedAssignment(null);
      setFormData({ marketerId: '', assignedToId: '', assignmentType: '', notes: '' });
      loadData();
    } catch (error) {
      console.error('Error updating assignment:', error);
      showError("Failed to update assignment");
    }
  };

  const handleDeleteAssignment = async (assignmentId) => {
      try {
      await assignmentApiService.deleteAssignment(assignmentId);
        showSuccess("Assignment deleted successfully");
        loadData();
      } catch (error) {
      console.error('Error deleting assignment:', error);
        showError("Failed to delete assignment");
    }
  };

  const handleEditAssignment = (assignment) => {
    setSelectedAssignment(assignment);
    setFormData({
      marketerId: assignment.marketerId,
      assignedToId: assignment.assignedToId,
      assignmentType: assignment.assignmentType,
      notes: assignment.notes || ''
    });
    setEditDialogOpen(true);
  };

  const handleMarketerSelect = (marketerId) => {
    setSelectedMarketers(prev => 
      prev.includes(marketerId) 
        ? prev.filter(id => id !== marketerId)
        : [...prev, marketerId]
    );
  };

  const handleSelectAllMarketers = () => {
    if (selectedMarketers.length === unassignedMarketers.length) {
      setSelectedMarketers([]);
    } else {
      setSelectedMarketers(Array.isArray(unassignedMarketers) ? unassignedMarketers.map(m => m.id) : []);
    }
  };

  const filterAssignments = (assignments) => {
    if (!assignments || typeof assignments !== 'object') return {};
    
    let filtered = { ...assignments };

    if (hierarchySearch) {
      const searchLower = hierarchySearch.toLowerCase();
      filtered = Object.fromEntries(
        Object.entries(filtered).filter(([key, group]) => {
          const superAdmin = group.superAdmin;
          return (
            superAdmin.firstName.toLowerCase().includes(searchLower) ||
            superAdmin.lastName.toLowerCase().includes(searchLower) ||
            superAdmin.email.toLowerCase().includes(searchLower) ||
            Object.values(group.admins).some(adminGroup => 
              adminGroup.admin.firstName.toLowerCase().includes(searchLower) ||
              adminGroup.admin.lastName.toLowerCase().includes(searchLower) ||
              adminGroup.admin.email.toLowerCase().includes(searchLower) ||
              adminGroup.marketers.some(marketer =>
                marketer.firstName.toLowerCase().includes(searchLower) ||
                marketer.lastName.toLowerCase().includes(searchLower) ||
                marketer.email.toLowerCase().includes(searchLower)
              )
            )
          );
        })
      );
    }

    if (selectedLocation) {
      filtered = Object.fromEntries(
        Object.entries(filtered).filter(([key, group]) => {
          const superAdmin = group.superAdmin;
          return superAdmin.location === selectedLocation ||
            Object.values(group.admins).some(adminGroup => 
              adminGroup.admin.location === selectedLocation ||
              adminGroup.marketers.some(marketer => marketer.location === selectedLocation)
            );
        })
      );
    }

    return filtered;
  };

  const getLocationColor = (location) => {
    const colors = {
      'Lagos': 'bg-blue-100 text-blue-800',
      'Abuja': 'bg-green-100 text-green-800',
      'Kano': 'bg-purple-100 text-purple-800',
      'Port Harcourt': 'bg-orange-100 text-orange-800',
      'Ibadan': 'bg-pink-100 text-pink-800',
    };
    return colors[location] || 'bg-gray-100 text-gray-800';
  };

  const getAssignmentTypeColor = (type) => {
    return type === 'admin' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading assignment data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back to Overview Navigation */}
      {onNavigate && (
        <div className="mb-6">
          <button
            onClick={() => onNavigate('overview')}
            className="flex items-center space-x-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Overview</span>
          </button>
        </div>
      )}
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {userRole === 'MasterAdmin' ? 'User Assignment Management' : 'Assigned Marketers'}
          </h1>
          <p className="text-muted-foreground mt-2">
            {userRole === 'MasterAdmin' 
              ? 'Assign marketers to admins and superadmins for performance tracking'
              : 'View marketers assigned to you for performance tracking'
            }
          </p>
        </div>
        {userRole === 'MasterAdmin' && (
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => setAssignDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Assign Marketer
          </Button>
            <Button variant="outline" onClick={() => setBulkAssignDialogOpen(true)}>
            <Users className="h-4 w-4 mr-2" />
            Bulk Assign
          </Button>
                  </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className={`grid grid-cols-1 ${userRole === 'MasterAdmin' ? 'md:grid-cols-4' : 'md:grid-cols-2'} gap-4`}>
        {userRole === 'MasterAdmin' ? (
          <>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Marketers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMarketers || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assigned Marketers</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.assignedMarketers || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unassigned Marketers</CardTitle>
            <UserX className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.unassignedMarketers || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Assignees</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeAssignees || 0}</div>
          </CardContent>
        </Card>
          </>
        ) : (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">My Assigned Marketers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Array.isArray(currentAssignments) ? currentAssignments.length : 0}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Marketers</CardTitle>
                <UserCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Array.isArray(currentAssignments) 
                    ? currentAssignments.filter(m => m.status === 'active').length 
                    : 0
                  }
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Tabs for different views */}
      <Tabs defaultValue={userRole === 'MasterAdmin' ? "unassigned" : "current"} className="space-y-4">
        <TabsList>
          {userRole === 'MasterAdmin' && (
            <>
          <TabsTrigger value="unassigned">Unassigned Marketers</TabsTrigger>
          <TabsTrigger value="assignees">Available Assignees</TabsTrigger>
          <TabsTrigger value="admin-assignments">Admin Assignments</TabsTrigger>
            </>
          )}
          <TabsTrigger value="current">
            {userRole === 'MasterAdmin' ? 'Current Assignments' : 'My Assigned Marketers'}
          </TabsTrigger>
        </TabsList>

        {userRole === 'MasterAdmin' && (
        <TabsContent value="unassigned">
          <Card>
            <CardHeader>
              <CardTitle>Unassigned Marketers</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.isArray(unassignedMarketers) ? unassignedMarketers.map((marketer) => {
                    console.log('Marketer data:', marketer);
                    return (
                      <TableRow key={marketer.id}>
                      <TableCell className="font-medium">
                        {marketer.first_name} {marketer.last_name}
                      </TableCell>
                      <TableCell>{marketer.email}</TableCell>
                      <TableCell>
                          <Badge className={getLocationColor(marketer.location)}>
                            {marketer.location}
                          </Badge>
                      </TableCell>
                        <TableCell>
                          <Badge variant="outline">{marketer.status}</Badge>
                        </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                              setFormData({...formData, marketerId: marketer.id});
                            setAssignDialogOpen(true);
                          }}
                        >
                            <Edit className="h-4 w-4 mr-1" />
                          Assign
                        </Button>
                      </TableCell>
                    </TableRow>
                    );
                  }) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-gray-500">
                        No unassigned marketers found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        )}

        {userRole === 'MasterAdmin' && (
        <TabsContent value="assignees">
          <Card>
            <CardHeader>
              <CardTitle>Available Assignees</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Assigned Count</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {availableAssignees.map((assignee) => (
                    <TableRow key={assignee.unique_id}>
                      <TableCell className="font-medium">
                        {assignee.first_name} {assignee.last_name}
                      </TableCell>
                      <TableCell>{assignee.email}</TableCell>
                      <TableCell>
                        <Badge className={getAssignmentTypeColor(assignee.role.toLowerCase())}>
                          {assignee.role}
                        </Badge>
                      </TableCell>
                      <TableCell>{assignee.assigned_count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        )}

        {userRole === 'MasterAdmin' && (
        <TabsContent value="admin-assignments">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Assign Admins to SuperAdmins</CardTitle>
                <div className="flex gap-2">
                  <Button onClick={() => setAssignDialogOpen(true)} variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Assign Admin
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Unassigned Admins */}
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-3 flex items-center">
                    <UserX className="h-4 w-4 mr-2 text-orange-600" />
                    Unassigned Admins
                  </h3>
                  {availableAssignees.filter(a => a.role === 'Admin' && !a.super_admin_id).length === 0 ? (
                    <p className="text-muted-foreground text-sm">All admins are assigned to superadmins</p>
                  ) : (
                    <div className="space-y-2">
                      {availableAssignees
                        .filter(a => a.role === 'Admin' && !a.super_admin_id)
                        .map((admin) => (
                          <div key={admin.unique_id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded">
                            <div>
                              <p className="font-medium">{admin.first_name} {admin.last_name}</p>
                              <p className="text-sm text-muted-foreground">{admin.email}</p>
                            </div>
                            <Button onClick={() => {
                              setFormData({
                                marketerId: admin.unique_id,
                                assignedToId: '',
                                assignmentType: 'superadmin',
                                notes: ''
                              });
                              setAssignDialogOpen(true);
                            }} size="sm">
                              Assign to SuperAdmin
                            </Button>
                          </div>
                        ))}
                    </div>
                  )}
                </div>

                {/* SuperAdmins with their Admins */}
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-3 flex items-center">
                    <Users className="h-4 w-4 mr-2 text-purple-600" />
                    SuperAdmin Assignments
                  </h3>
                  {availableAssignees.filter(a => a.role === 'SuperAdmin').length === 0 ? (
                    <p className="text-muted-foreground text-sm">No superadmins found</p>
                  ) : (
                    <div className="space-y-4">
                      {availableAssignees
                        .filter(a => a.role === 'SuperAdmin')
                        .map((superAdmin) => {
                          const assignedAdmins = availableAssignees.filter(a => 
                            a.role === 'Admin' && a.super_admin_id === superAdmin.id
                          );
                          return (
                            <div key={superAdmin.id} className="border-l-2 border-purple-200 pl-4">
                              <div className="flex items-center justify-between mb-2">
                                <div>
                                  <p className="font-medium text-purple-900 dark:text-purple-100">
                                    {superAdmin.first_name} {superAdmin.last_name}
                                  </p>
                                  <p className="text-sm text-muted-foreground">{superAdmin.email}</p>
                                </div>
                                <Badge className="bg-purple-100 text-purple-800">SuperAdmin</Badge>
                              </div>
                              {assignedAdmins.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No admins assigned</p>
                              ) : (
                                <div className="ml-4 space-y-2">
                                  {assignedAdmins.map((admin) => (
                                    <div key={admin.id} className="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                                      <div>
                                        <p className="text-sm font-medium">{admin.first_name} {admin.last_name}</p>
                                        <p className="text-xs text-muted-foreground">{admin.email}</p>
                                      </div>
                                      <Button 
                                        onClick={() => {
                                          if (confirm(`Reassign ${admin.first_name} ${admin.last_name} to a different SuperAdmin?`)) {
                                            setFormData({
                                              marketerId: admin.id,
                                              assignedToId: '',
                                              assignmentType: 'superadmin',
                                              notes: ''
                                            });
                                            setAssignDialogOpen(true);
                                          }
                                        }}
                                        variant="outline" 
                                        size="sm"
                                      >
                                        Reassign
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        )}

        <TabsContent value="current">
          <Card>
            <CardHeader>
              <CardTitle>
                {userRole === 'MasterAdmin' ? 'Current Assignment Hierarchy' : 'My Assigned Marketers'}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {userRole === 'MasterAdmin' 
                  ? 'View the complete assignment structure with location-based relationships'
                  : 'View marketers assigned to you for performance tracking'
                }
              </p>
              
              {/* Filter Controls - Only for MasterAdmin */}
              {userRole === 'MasterAdmin' && (
              <div className="flex flex-col sm:flex-row gap-4 mt-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search by name or email..."
                      value={hierarchySearch}
                      onChange={(e) => setHierarchySearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="sm:w-48">
                  <select
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    className="select-soft h-11 w-full"
                  >
                    <option value="">All Locations</option>
                    {Array.isArray(availableLocations) ? availableLocations.map((location) => (
                      <option key={location} value={location}>
                        {location}
                      </option>
                    )) : null}
                  </select>
                </div>
                {(hierarchySearch || selectedLocation) && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setHierarchySearch('');
                      setSelectedLocation('');
                    }}
                    className="sm:w-auto"
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Clear Filters
                  </Button>
                )}
              </div>
              )}
            </CardHeader>
            <CardContent>
              {userRole === 'MasterAdmin' ? (
                // MasterAdmin sees complex hierarchy
                Object.keys(currentAssignments).length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No assignments found</p>
                </div>
              ) : Object.keys(filterAssignments(currentAssignments)).length === 0 ? (
                <div className="text-center py-8">
                  <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No assignments match your current filters</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Try adjusting your search terms or location filter
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.values(filterAssignments(currentAssignments)).filter(group => group && group.superAdmin).map((superAdminGroup) => (
                    <div key={superAdminGroup.superAdmin.id} className="border rounded-lg p-4">
                      {/* SuperAdmin Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 ${String(superAdminGroup.superAdmin.id || '').startsWith('unassigned_') ? 'bg-orange-100' : 'bg-purple-100'} rounded-full flex items-center justify-center`}>
                            <span className={`font-semibold text-sm ${String(superAdminGroup.superAdmin.id || '').startsWith('unassigned_') ? 'text-orange-600' : 'text-purple-600'}`}>
                              {superAdminGroup.superAdmin.firstName[0]}{superAdminGroup.superAdmin.lastName[0]}
                            </span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                              <h3 className="font-semibold text-lg">
                                {superAdminGroup.superAdmin.firstName} {superAdminGroup.superAdmin.lastName}
                              </h3>
                              <Badge className={`${getLocationColor(superAdminGroup.superAdmin.location)} border`}>
                                <MapPin className="h-3 w-3 mr-1" />
                                {superAdminGroup.superAdmin.location}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {String(superAdminGroup.superAdmin.id || '').startsWith('unassigned_') ? 'Unassigned Admins' : `SuperAdmin • ${superAdminGroup.superAdmin.email}`}
                            </p>
                          </div>
                        </div>
                        <Badge className={String(superAdminGroup.superAdmin.id || '').startsWith('unassigned_') ? 'bg-orange-100 text-orange-800' : 'bg-purple-100 text-purple-800'}>
                          {String(superAdminGroup.superAdmin.id || '').startsWith('unassigned_') ? 'Unassigned' : 'SuperAdmin'}
                        </Badge>
                      </div>

                      {/* Admins under this SuperAdmin */}
                      {Object.keys(superAdminGroup.admins).length === 0 ? (
                        <div className="text-center py-4 text-muted-foreground">
                          <p>No admins assigned to this SuperAdmin</p>
                        </div>
                      ) : (
                        <div className="ml-6 space-y-4">
                          {Object.values(superAdminGroup.admins).filter(group => group && group.admin).map((adminGroup) => (
                            <div key={adminGroup.admin.id} className="border-l-2 border-blue-200 pl-4">
                              {/* Admin Header */}
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center space-x-3">
                                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                    <span className="text-blue-600 font-semibold text-xs">
                                      {adminGroup.admin.firstName[0]}{adminGroup.admin.lastName[0]}
                                    </span>
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <h4 className="font-medium">
                                        {adminGroup.admin.firstName} {adminGroup.admin.lastName}
                                      </h4>
                                      <Badge className={`${getLocationColor(adminGroup.admin.location)} border text-xs`}>
                                        <MapPin className="h-2 w-2 mr-1" />
                                        {adminGroup.admin.location}
                                      </Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                      Admin • {adminGroup.admin.email}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Badge className="bg-blue-100 text-blue-800">Admin</Badge>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      const newSuperAdminId = prompt(`Enter new SuperAdmin ID for ${adminGroup.admin.firstName} ${adminGroup.admin.lastName}:`);
                                      if (newSuperAdminId) {
                                          // handleReassignAdmin(adminGroup.admin.id, newSuperAdminId);
                                      }
                                    }}
                                    className="h-6 px-2 text-xs"
                                  >
                                    Reassign
                                  </Button>
                                </div>
                              </div>

                              {/* Marketers under this Admin */}
                              {adminGroup.marketers.length === 0 ? (
                                <div className="text-center py-2 text-muted-foreground text-sm">
                                  <p>No marketers assigned to this admin</p>
                                </div>
                              ) : (
                                <div className="ml-6 space-y-2">
                                  {adminGroup.marketers.filter(marketer => marketer).map((marketer) => (
                                    <div key={marketer.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded">
                                      <div className="flex items-center space-x-3">
                                        <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                                          <span className="text-green-600 font-semibold text-xs">
                                            {marketer.firstName[0]}{marketer.lastName[0]}
                                          </span>
                                        </div>
                                        <div className="flex-1">
                                          <div className="flex items-center gap-2 mb-1">
                                            <p className="text-sm font-medium">
                                              {marketer.firstName} {marketer.lastName}
                                            </p>
                                            <Badge className={`${getLocationColor(marketer.location)} border text-xs`}>
                                              <MapPin className="h-2 w-2 mr-1" />
                                              {marketer.location}
                                            </Badge>
                                          </div>
                                          <p className="text-xs text-muted-foreground">
                                            {marketer.email}
                                          </p>
                                        </div>
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        <Badge className="bg-green-100 text-green-800">Marketer</Badge>
                                        <span className="text-xs text-muted-foreground">
                                          Assigned: {formatDate(marketer.assignedDate)}
                                        </span>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => {
                                            const newAdminId = prompt(`Enter new Admin ID for ${marketer.firstName} ${marketer.lastName}:`);
                                            if (newAdminId) {
                                                // handleReassignMarketer(marketer.id, newAdminId);
                                            }
                                          }}
                                          className="h-6 px-2 text-xs"
                                        >
                                          Reassign
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                )
              ) : (
                // Admin/SuperAdmin sees simple list
                Array.isArray(currentAssignments) && currentAssignments.length > 0 ? (
                  <div className="space-y-4">
                    {currentAssignments.map((marketer) => (
                      <div key={marketer.id || marketer.unique_id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-blue-600 font-semibold text-sm">
                                {marketer.first_name?.[0] || marketer.firstName?.[0]}{marketer.last_name?.[0] || marketer.lastName?.[0]}
                              </span>
                            </div>
                            <div>
                              <h3 className="font-semibold">
                                {marketer.first_name || marketer.firstName} {marketer.last_name || marketer.lastName}
                              </h3>
                              <p className="text-sm text-muted-foreground">{marketer.email}</p>
                              <div className="flex items-center space-x-2 mt-1">
                                <Badge variant="outline">Marketer</Badge>
                                {marketer.location && (
                                  <Badge className="bg-gray-100 text-gray-800 text-xs">
                                    <MapPin className="h-2 w-2 mr-1" />
                                    {marketer.location}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">
                              Assigned: {marketer.assigned_date ? new Date(marketer.assigned_date).toLocaleDateString() : 'N/A'}
                            </p>
                            <Badge className="bg-green-100 text-green-800 mt-1">
                              {marketer.status || 'Active'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No marketers assigned to you</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Contact your MasterAdmin to get marketers assigned
                    </p>
                  </div>
                )
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Assign Marketer/Admin Dialog */}
      <Modal isOpen={assignDialogOpen} onClose={() => setAssignDialogOpen(false)}>
        <div className="max-w-md">
          <h2 className="text-xl font-semibold mb-4">
            {formData.assignmentType === 'superadmin' ? 'Assign Admin to SuperAdmin' : 'Assign Marketer'}
          </h2>
          <form onSubmit={handleAssignMarketer} className="space-y-4">
            {formData.assignmentType !== 'superadmin' && (
              <div>
                <Label htmlFor="marketerId">Marketer</Label>
                <select 
                  value={formData.marketerId} 
                  onChange={(e) => setFormData({...formData, marketerId: e.target.value})}
                  className="select-soft h-11 w-full"
                  required={formData.assignmentType !== 'superadmin'}
                >
                  <option value="">Select a marketer</option>
                  {Array.isArray(unassignedMarketers) ? unassignedMarketers.map((marketer) => (
                    <option key={marketer.id} value={marketer.id}>
                      {marketer.first_name} {marketer.last_name} ({marketer.email})
                    </option>
                  )) : null}
                </select>
              </div>
            )}
            <div>
              <Label htmlFor="assignedToId">
                {formData.assignmentType === 'superadmin' ? 'Assign To (SuperAdmin)' : 'Assign To'}
              </Label>
              <select 
                value={formData.assignedToId} 
                onChange={(e) => setFormData({...formData, assignedToId: e.target.value})}
                className="select-soft h-11 w-full"
                required
              >
                <option value="">Select {formData.assignmentType === 'superadmin' ? 'SuperAdmin' : 'assignee'}</option>
                {formData.assignmentType === 'superadmin' 
                  ? (() => {
                      // Get the admin's location
                      const admin = availableAssignees.find(a => a.unique_id === formData.marketerId);
                      const adminLocation = admin?.location;
                      
                      console.log('🔍 Admin being assigned:', admin);
                      console.log('📍 Admin location:', adminLocation);
                      console.log('👥 All available assignees:', availableAssignees);
                      
                      // Filter SuperAdmins by location
                      const filteredSuperAdmins = availableAssignees.filter(a => 
                        a.role === 'SuperAdmin' && a.location === adminLocation
                      );
                      
                      console.log('✅ Filtered SuperAdmins:', filteredSuperAdmins);
                      
                      if (filteredSuperAdmins.length === 0) {
                        // Check if location field is missing
                        const superAdminsWithoutLocation = availableAssignees.filter(a => a.role === 'SuperAdmin');
                        console.log('⚠️ All SuperAdmins:', superAdminsWithoutLocation);
                        console.log('⚠️ Do they have location field?', superAdminsWithoutLocation.map(sa => ({ name: sa.first_name, hasLocation: 'location' in sa, location: sa.location })));
                        
                        return <option value="" disabled>No SuperAdmins found in {adminLocation || 'same location'}</option>;
                      }
                      
                      return filteredSuperAdmins.map((assignee) => (
                        <option key={assignee.unique_id} value={assignee.unique_id}>
                          {assignee.first_name} {assignee.last_name} ({assignee.email}) - {assignee.location}
                        </option>
                      ));
                    })()
                  : availableAssignees.map((assignee) => (
                      <option key={assignee.unique_id} value={assignee.unique_id}>
                        {assignee.first_name} {assignee.last_name} ({assignee.role})
                      </option>
                    ))
                }
              </select>
            </div>
            {!formData.marketerId && (
              <div>
                <Label htmlFor="assignmentType">Assignment Type</Label>
                <select 
                  value={formData.assignmentType} 
                  onChange={(e) => setFormData({...formData, assignmentType: e.target.value, assignedToId: ''})}
                  className="select-soft h-11 w-full"
                  required
                >
                  <option value="">Select type</option>
                  <option value="admin">Admin</option>
                  <option value="superadmin">SuperAdmin</option>
                </select>
              </div>
            )}
            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                className="textarea-soft h-20 w-full"
                placeholder="Add any notes about this assignment..."
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setAssignDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {formData.assignmentType === 'superadmin' ? 'Assign Admin' : 'Assign Marketer'}
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Bulk Assign Dialog */}
      <Modal isOpen={bulkAssignDialogOpen} onClose={() => setBulkAssignDialogOpen(false)}>
        <div className="max-w-2xl">
          <h2 className="text-xl font-semibold mb-4">Bulk Assign Marketers</h2>
          <form onSubmit={handleBulkAssignMarketers} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="bulk-assignedToId">Assign To</Label>
                <select 
                  value={bulkFormData.assignedToId} 
                  onChange={(e) => setBulkFormData({...bulkFormData, assignedToId: e.target.value})}
                  className="select-soft h-11 w-full"
                  required
                >
                  <option value="">Select assignee</option>
                  {availableAssignees.map((assignee) => (
                    <option key={assignee.unique_id} value={assignee.unique_id}>
                      {assignee.first_name} {assignee.last_name} ({assignee.role})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="bulk-assignmentType">Assignment Type</Label>
                <select 
                  value={bulkFormData.assignmentType} 
                  onChange={(e) => setBulkFormData({...bulkFormData, assignmentType: e.target.value})}
                  className="select-soft h-11 w-full"
                  required
                >
                  <option value="">Select type</option>
                  <option value="admin">Admin</option>
                  <option value="superadmin">SuperAdmin</option>
                </select>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Select Marketers</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAllMarketers}
                >
                  {selectedMarketers.length === unassignedMarketers.length ? 'Deselect All' : 'Select All'}
                </Button>
              </div>
              <div className="max-h-60 overflow-y-auto border rounded p-2">
                {Array.isArray(unassignedMarketers) ? unassignedMarketers.map((marketer) => (
                  <div key={marketer.id} className="flex items-center space-x-2 py-1">
                    <input
                      type="checkbox"
                      id={`marketer-${marketer.id}`}
                      checked={selectedMarketers.includes(marketer.id)}
                      onChange={() => handleMarketerSelect(marketer.id)}
                      className="rounded"
                    />
                    <label htmlFor={`marketer-${marketer.id}`} className="text-sm">
                      {marketer.first_name} {marketer.last_name} ({marketer.email})
                    </label>
                  </div>
                )) : (
                  <div className="text-center text-gray-500 py-4">
                    No unassigned marketers available
                  </div>
                )}
              </div>
            </div>
            <div>
              <Label htmlFor="bulk-notes">Notes (Optional)</Label>
              <textarea
                value={bulkFormData.notes}
                onChange={(e) => setBulkFormData({...bulkFormData, notes: e.target.value})}
                className="textarea-soft h-20 w-full"
                placeholder="Add any notes about this assignment..."
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setBulkAssignDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Assign {selectedMarketers.length} Marketers</Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Edit Assignment Dialog */}
      <Modal isOpen={editDialogOpen} onClose={() => setEditDialogOpen(false)}>
        <div>
          <h2 className="text-xl font-semibold mb-4">Edit Assignment</h2>
          <form onSubmit={handleUpdateAssignment} className="space-y-4">
            <div>
              <Label htmlFor="edit-assignedToId">Assign To</Label>
              <select 
                value={formData.assignedToId} 
                onChange={(e) => setFormData({...formData, assignedToId: e.target.value})}
                className="select-soft h-11 w-full"
                required
              >
                <option value="">Select assignee</option>
                {availableAssignees.map((assignee) => (
                  <option key={assignee.unique_id} value={assignee.unique_id}>
                    {assignee.first_name} {assignee.last_name} ({assignee.role})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="edit-assignmentType">Assignment Type</Label>
              <select 
                value={formData.assignmentType} 
                onChange={(e) => setFormData({...formData, assignmentType: e.target.value})}
                className="select-soft h-11 w-full"
                required
              >
                <option value="">Select type</option>
                <option value="admin">Admin</option>
                <option value="superadmin">SuperAdmin</option>
              </select>
            </div>
            <div>
              <Label htmlFor="edit-notes">Notes (Optional)</Label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                className="textarea-soft h-20 w-full"
                placeholder="Add any notes about this assignment..."
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Update Assignment</Button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
};

export default UserAssignmentManagement;