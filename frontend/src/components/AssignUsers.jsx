import React, { useState, useEffect } from 'react';
import { Users, Building2, UserPlus, UserMinus, UserCheck, UserX, Shield, Crown, Search, RefreshCw, Plus, AlertTriangle, CheckCircle, XCircle, History, TrendingUp, Settings } from 'lucide-react';
import { assignmentService, locationService, userService } from '../services/assignmentService';
import { useToast } from './ui/use-toast';

function AssignUsers() {
  const { showSuccess, showError, showWarning, showInfo } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [users, setUsers] = useState([]);
  const [locations, setLocations] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [showAssignmentForm, setShowAssignmentForm] = useState(false);
  const [assignmentFormData, setAssignmentFormData] = useState({
    assignmentType: '',
    selectedUsers: [],
    supervisorId: '',
    locationId: ''
  });

  const [stats, setStats] = useState({
    totalUsers: 0,
    assignedUsers: 0,
    unassignedUsers: 0,
    superAdmins: 0,
    admins: 0,
    marketers: 0
  });

  const tabs = [
    { key: 'overview', label: 'Hierarchy Overview', icon: Building2 },
    { key: 'assign', label: 'Quick Assign', icon: UserPlus },
    { key: 'manage', label: 'Manage Assignments', icon: Settings },
    { key: 'unassigned', label: 'Unassigned Users', icon: UserX },
    { key: 'history', label: 'Assignment History', icon: History },
    { key: 'analytics', label: 'Analytics', icon: TrendingUp }
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersData, locationsData, assignmentsData] = await Promise.all([
        userService.getAllUsers().catch(() => ({ data: [] })),
        locationService.getAllLocations().catch(() => ({ data: [] })),
        assignmentService.getAllAssignments().catch(() => ({ data: [] }))
      ]);

      const usersList = usersData.data || [];
      const locationsList = locationsData.data || [];
      const assignmentsList = assignmentsData.data || [];

      setUsers(usersList);
      setLocations(locationsList);
      setAssignments(assignmentsList);

      // Calculate statistics
      const assignedUserIds = new Set();
      
      // Handle the new assignment structure from backend
      if (assignmentsList.assignedMarketers) {
        assignmentsList.assignedMarketers.forEach(marketer => {
          assignedUserIds.add(marketer.marketer_unique_id);
        });
      }
      if (assignmentsList.assignedAdmins) {
        assignmentsList.assignedAdmins.forEach(admin => {
          assignedUserIds.add(admin.admin_unique_id);
        });
      }

      setStats({
        totalUsers: usersList.length,
        assignedUsers: assignedUserIds.size,
        unassignedUsers: usersList.filter(u => !assignedUserIds.has(u.unique_id) && u.role !== 'MasterAdmin').length,
        superAdmins: usersList.filter(u => u.role === 'SuperAdmin').length,
        admins: usersList.filter(u => u.role === 'Admin').length,
        marketers: usersList.filter(u => u.role === 'Marketer').length
      });

    } catch (error) {
      console.error('Error loading data:', error);
      showError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Get users by role (excluding already assigned users)
  const getUsersByRole = (role) => {
    return users.filter(user => {
      if (user.role !== role) return false;
      
      // Check if user is already assigned
      if (role === 'Admin') {
        return !assignments.assignedAdmins?.some(a => a.admin_unique_id === user.unique_id);
      } else if (role === 'Marketer') {
        return !assignments.assignedMarketers?.some(a => a.marketer_unique_id === user.unique_id);
      } else if (role === 'SuperAdmin') {
        // For SuperAdmin, we don't filter out assigned ones since they can supervise multiple admins
        return true;
      }
      
      return true;
    });
  };

  // Get available supervisors (users who can supervise others)
  const getAvailableSupervisors = (role) => {
    if (role === 'admin-to-superadmin') {
      // For SuperAdmin supervisors, return all SuperAdmins
      return users.filter(user => user.role === 'SuperAdmin');
    } else if (role === 'marketer-to-admin') {
      // For Admin supervisors, return unassigned Admins
      return users.filter(user => 
        user.role === 'Admin' && 
        !assignments.assignedAdmins?.some(a => a.admin_unique_id === user.unique_id)
      );
    }
    return [];
  };

  const getFilteredUsers = () => {
    let filtered = users;
    
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (selectedLocation) {
      // Filter by location if needed
      filtered = filtered.filter(user => {
        // Check if user is assigned and has the selected location
        if (user.role === 'Marketer') {
          const assignment = assignments.assignedMarketers?.find(a => 
            a.marketer_unique_id === user.unique_id
          );
          return assignment && assignment.location === selectedLocation;
        } else if (user.role === 'Admin') {
          const assignment = assignments.assignedAdmins?.find(a => 
            a.admin_unique_id === user.unique_id
          );
          return assignment && assignment.location === selectedLocation;
        }
        return false;
      });
    }
    
    return filtered;
  };

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    
    if (!assignmentFormData.selectedUsers.length) {
      showError('Please select at least one user to assign');
      return;
    }
    
    if (!assignmentFormData.supervisorId) {
      showError('Please select a supervisor');
      return;
    }
    
    setLoading(true);
    
    try {
      if (assignmentFormData.assignmentType === 'admin-to-superadmin') {
        await assignmentService.assignAdminToSuperAdmin({
          adminUniqueIds: assignmentFormData.selectedUsers,
          superAdminUniqueId: assignmentFormData.supervisorId
        });
      } else if (assignmentFormData.assignmentType === 'marketer-to-admin') {
        await assignmentService.assignMarketersToAdmin({
          marketerUniqueIds: assignmentFormData.selectedUsers,
          adminUniqueId: assignmentFormData.supervisorId
        });
      }
      
      showSuccess(`Successfully assigned ${assignmentFormData.selectedUsers.length} user(s)!`);
      setShowAssignmentForm(false);
      setAssignmentFormData({
        assignmentType: '',
        selectedUsers: [],
        supervisorId: '',
        locationId: ''
      });
      loadData();
    } catch (error) {
      console.error('Error creating assignment:', error);
      showError('Failed to create assignment: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUnassignAll = async () => {
    if (!confirm('⚠️ WARNING: This will unassign ALL users from their current assignments!\n\nThis action cannot be undone and will clear the entire hierarchy.\n\nAre you sure you want to continue?')) {
      return;
    }
    
    setLoading(true);
    try {
      await assignmentService.unassignAllUsers();
      showSuccess('All users have been unassigned successfully');
      loadData();
    } catch (error) {
      console.error('Error unassigning all users:', error);
      showError('Failed to unassign all users: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const renderOverview = () => (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <UserCheck className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Assigned</p>
              <p className="text-2xl font-bold text-gray-900">{stats.assignedUsers}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <UserX className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Unassigned</p>
              <p className="text-2xl font-bold text-gray-900">{stats.unassignedUsers}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Building2 className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Locations</p>
              <p className="text-2xl font-bold text-gray-900">{locations.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-medium">Organizational Hierarchy</h3>
          <p className="text-sm text-gray-600">Current structure showing reporting relationships</p>
        </div>
        <div className="p-6">
          <div className="text-center py-8 text-gray-500">
            <Building2 className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>Hierarchy visualization coming soon...</p>
            <p className="text-sm">Use the "Quick Assign" tab to create assignments.</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderQuickAssign = () => (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold">Quick Assignment</h2>
          <p className="text-sm text-gray-600">Create new assignments in just a few steps</p>
        </div>
        <button
          onClick={() => setShowAssignmentForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>New Assignment</span>
        </button>
      </div>

      {showAssignmentForm && (
        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-medium mb-4">Create New Assignment</h3>
          <form onSubmit={handleCreateAssignment} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setAssignmentFormData({
                  ...assignmentFormData,
                  assignmentType: 'admin-to-superadmin',
                  selectedUsers: [],
                  supervisorId: ''
                })}
                className={`p-4 border-2 rounded-lg text-left transition-colors ${
                  assignmentFormData.assignmentType === 'admin-to-superadmin'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Shield className="h-6 w-6 text-blue-600" />
                  <div>
                    <h4 className="font-medium">Assign Admin to SuperAdmin</h4>
                    <p className="text-sm text-gray-600">Promote Admins to report to SuperAdmin</p>
                  </div>
                </div>
              </button>
              
              <button
                type="button"
                onClick={() => setAssignmentFormData({
                  ...assignmentFormData,
                  assignmentType: 'marketer-to-admin',
                  selectedUsers: [],
                  supervisorId: ''
                })}
                className={`p-4 border-2 rounded-lg text-left transition-colors ${
                  assignmentFormData.assignmentType === 'marketer-to-admin'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Users className="h-6 w-6 text-green-600" />
                  <div>
                    <h4 className="font-medium">Assign Marketer to Admin</h4>
                    <p className="text-sm text-gray-600">Assign Marketers to report to Admin</p>
                  </div>
                </div>
              </button>
            </div>

            {assignmentFormData.assignmentType && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select {assignmentFormData.assignmentType === 'admin-to-superadmin' ? 'Admin(s)' : 'Marketer(s)'}
                  </label>
                  <select
                    multiple
                    value={assignmentFormData.selectedUsers}
                    onChange={(e) => {
                      const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
                      setAssignmentFormData({...assignmentFormData, selectedUsers: selectedOptions});
                    }}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 min-h-[100px]"
                    required
                  >
                    {(() => {
                      const role = assignmentFormData.assignmentType === 'admin-to-superadmin' ? 'Admin' : 'Marketer';
                      return getUsersByRole(role).map(user => (
                        <option key={user.unique_id} value={user.unique_id}>
                          {user.first_name} {user.last_name} - {user.email}
                        </option>
                      ));
                    })()}
                  </select>
                  <p className="text-xs text-gray-600 mt-1">
                    Hold Ctrl (or Cmd on Mac) to select multiple users
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select {assignmentFormData.assignmentType === 'admin-to-superadmin' ? 'SuperAdmin' : 'Admin'}
                  </label>
                  <select
                    value={assignmentFormData.supervisorId}
                    onChange={(e) => setAssignmentFormData({...assignmentFormData, supervisorId: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    required
                  >
                    <option value="">Select Supervisor</option>
                    {getAvailableSupervisors(assignmentFormData.assignmentType).map(user => (
                      <option key={user.unique_id} value={user.unique_id}>
                        {user.first_name} {user.last_name} - {user.email}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location (Optional)</label>
                  <select
                    value={assignmentFormData.locationId}
                    onChange={(e) => setAssignmentFormData({...assignmentFormData, locationId: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="">No specific location</option>
                    {locations.map(location => (
                      <option key={location.unique_id} value={location.unique_id}>
                        {location.name} - {location.city}, {location.state}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAssignmentForm(false)}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? 'Creating...' : 'Create Assignment'}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium mb-4 flex items-center">
            <UserPlus className="h-5 w-5 mr-2 text-blue-600" />
            Quick Assignments
          </h3>
          <div className="space-y-3">
            <button
              onClick={() => {
                setAssignmentFormData({
                  assignmentType: 'admin-to-superadmin',
                  selectedUsers: [],
                  supervisorId: '',
                  locationId: ''
                });
                setShowAssignmentForm(true);
              }}
              className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <Shield className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium">Assign Admin to SuperAdmin</p>
                  <p className="text-sm text-gray-600">Promote Admins in the hierarchy</p>
                </div>
              </div>
            </button>
            
            <button
              onClick={() => {
                setAssignmentFormData({
                  assignmentType: 'marketer-to-admin',
                  selectedUsers: [],
                  supervisorId: '',
                  locationId: ''
                });
                setShowAssignmentForm(true);
              }}
              className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <Users className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium">Assign Marketer to Admin</p>
                  <p className="text-sm text-gray-600">Assign Marketers to Admins</p>
                </div>
              </div>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium mb-4 flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2 text-red-600" />
            Bulk Operations
          </h3>
          <div className="space-y-3">
            <button
              onClick={handleUnassignAll}
              disabled={loading}
              className="w-full text-left p-3 border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              <div className="flex items-center space-x-3">
                <UserMinus className="h-5 w-5 text-red-600" />
                <div>
                  <p className="font-medium text-red-700">Unassign All Users</p>
                  <p className="text-sm text-red-600">Clear entire hierarchy</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderManageAssignments = () => {
    const filteredUsers = getFilteredUsers();
    
    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold">Manage Assignments</h2>
            <p className="text-sm text-gray-600">View and modify current assignments</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={loadData}
              disabled={loading}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              title="Refresh data"
            >
              <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search Users</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Location</label>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Locations</option>
                {locations.map(location => (
                  <option key={location.unique_id} value={location.unique_id}>
                    {location.name} - {location.city}, {location.state}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedLocation('');
                }}
                className="w-full px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-medium">Users ({filteredUsers.length})</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {filteredUsers.map(user => {
              let isAssigned = false;
              if (user.role === 'Marketer') {
                isAssigned = assignments.assignedMarketers?.some(a => 
                  a.marketer_unique_id === user.unique_id
                ) || false;
              } else if (user.role === 'Admin') {
                isAssigned = assignments.assignedAdmins?.some(a => 
                  a.admin_unique_id === user.unique_id
                ) || false;
              }
              
              return (
                <div key={user.unique_id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        {user.role === 'SuperAdmin' && <Crown className="h-5 w-5 text-yellow-600" />}
                        {user.role === 'Admin' && <Shield className="h-5 w-5 text-blue-600" />}
                        {user.role === 'Marketer' && <Users className="h-5 w-5 text-green-600" />}
                        {user.role === 'MasterAdmin' && <Crown className="h-5 w-5 text-purple-600" />}
                      </div>
                      
                      <div>
                        <div className="font-medium">{user.first_name} {user.last_name}</div>
                        <div className="text-sm text-gray-600">{user.email}</div>
                        <div className="text-xs text-gray-500">{user.role}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      {isAssigned ? (
                        <div className="flex items-center space-x-2 text-green-600">
                          <CheckCircle className="h-4 w-4" />
                          <span className="text-sm">Assigned</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2 text-red-600">
                          <XCircle className="h-4 w-4" />
                          <span className="text-sm">Unassigned</span>
                        </div>
                      )}
                      
                      {isAssigned && (
                        <button
                          onClick={() => {
                            showInfo('Individual unassignment feature coming soon');
                          }}
                          className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                          title="Unassign user"
                        >
                          <UserMinus className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderUnassignedUsers = () => {
    const unassigned = users.filter(user => {
      let isAssigned = false;
      if (user.role === 'Marketer') {
        isAssigned = assignments.assignedMarketers?.some(a => 
          a.marketer_unique_id === user.unique_id
        ) || false;
      } else if (user.role === 'Admin') {
        isAssigned = assignments.assignedAdmins?.some(a => 
          a.admin_unique_id === user.unique_id
        ) || false;
      }
      return !isAssigned && user.role !== 'MasterAdmin';
    });
    
    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold">Unassigned Users</h2>
            <p className="text-sm text-gray-600">{unassigned.length} users without assignments</p>
          </div>
          <button
            onClick={() => {
              setActiveTab('assign');
              setShowAssignmentForm(true);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <UserPlus className="h-4 w-4" />
            <span>Assign Users</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {unassigned.map(user => (
            <div key={user.unique_id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center space-x-3 mb-3">
                {user.role === 'SuperAdmin' && <Crown className="h-5 w-5 text-yellow-600" />}
                {user.role === 'Admin' && <Shield className="h-5 w-5 text-blue-600" />}
                {user.role === 'Marketer' && <Users className="h-5 w-5 text-green-600" />}
                <div>
                  <div className="font-medium">{user.first_name} {user.last_name}</div>
                  <div className="text-sm text-gray-600">{user.role}</div>
                </div>
              </div>
              <div className="text-sm text-gray-500 mb-3">{user.email}</div>
              <button
                onClick={() => {
                  setActiveTab('assign');
                  setAssignmentFormData({
                    assignmentType: user.role === 'Admin' ? 'admin-to-superadmin' : 'marketer-to-admin',
                    selectedUsers: [user.unique_id],
                    supervisorId: '',
                    locationId: ''
                  });
                  setShowAssignmentForm(true);
                }}
                className="w-full bg-blue-50 text-blue-700 px-3 py-2 rounded-md hover:bg-blue-100 transition-colors text-sm"
              >
                Assign User
              </button>
            </div>
          ))}
          
          {unassigned.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-500">
              <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500" />
              <p className="text-lg font-medium">All users are assigned!</p>
              <p className="text-sm">Great job managing your hierarchy.</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderAssignmentHistory = () => (
    <div className="p-6">
      <div className="text-center py-12 text-gray-500">
        <History className="h-12 w-12 mx-auto mb-3 text-gray-400" />
        <p className="text-lg font-medium">Assignment History</p>
        <p className="text-sm">Track changes and modifications to your hierarchy</p>
        <p className="text-xs mt-2">This feature is coming soon!</p>
      </div>
    </div>
  );

  const renderAnalytics = () => (
    <div className="p-6">
      <div className="text-center py-12 text-gray-500">
        <TrendingUp className="h-12 w-12 mx-auto mb-3 text-gray-400" />
        <p className="text-lg font-medium">Analytics Dashboard</p>
        <p className="text-sm">View performance metrics and insights</p>
        <p className="text-xs mt-2">This feature is coming soon!</p>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'assign':
        return renderQuickAssign();
      case 'manage':
        return renderManageAssignments();
      case 'unassigned':
        return renderUnassignedUsers();
      case 'history':
        return renderAssignmentHistory();
      case 'analytics':
        return renderAnalytics();
      default:
        return renderOverview();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">User Assignment Management</h1>
          <p className="mt-2 text-gray-600">
            Manage your organizational hierarchy with an intuitive and powerful interface
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
                      activeTab === tab.key
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}

export default AssignUsers;
