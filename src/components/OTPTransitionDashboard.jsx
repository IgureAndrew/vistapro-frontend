import React, { useState, useEffect } from 'react';
import { 
  Users, Mail, CheckCircle, XCircle, Clock, Download, 
  Send, Search, Filter, RefreshCw, AlertTriangle, Shield, TrendingUp 
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import otpTransitionApi from '../api/otpTransitionApi';

const OTPTransitionDashboard = () => {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [filters, setFilters] = useState({
    status: 'all',
    role: 'all',
    search: '',
    page: 1,
    limit: 20
  });
  const [pagination, setPagination] = useState(null);
  const [sending, setSending] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [reminderStats, setReminderStats] = useState(null);
  const [triggeringReminders, setTriggeringReminders] = useState(false);

  const token = localStorage.getItem('token');

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsData, usersData, reminderStatsData] = await Promise.all([
        otpTransitionApi.getTransitionStats(token),
        otpTransitionApi.getTransitionUsers(token, filters),
        fetch(`${import.meta.env.VITE_API_URL || process.env.REACT_APP_API_URL || 'https://vistapro-backend.onrender.com'}/api/reminders/stats`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).then(res => res.json()).catch(() => null)
      ]);

      setStats(statsData.data);
      setUsers(usersData.data.users);
      setPagination(usersData.data.pagination);
      if (reminderStatsData?.success) {
        setReminderStats(reminderStatsData.data);
      }
    } catch (error) {
      console.error('Error loading OTP transition data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerReminders = async () => {
    if (!confirm('This will send grace period reminder emails to all eligible users. Continue?')) {
      return;
    }

    setTriggeringReminders(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || process.env.REACT_APP_API_URL || 'https://vistapro-backend.onrender.com'}/api/reminders/trigger`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (data.success) {
        alert(`Reminders sent successfully!\n\n${JSON.stringify(data.data, null, 2)}`);
        loadData(); // Refresh stats
      } else {
        alert('Failed to send reminders: ' + data.message);
      }
    } catch (error) {
      alert('Error sending reminders: ' + error.message);
    } finally {
      setTriggeringReminders(false);
    }
  };

  const handleSendReminders = async () => {
    if (selectedUsers.length === 0) {
      alert('Please select users to send reminders');
      return;
    }

    setSending(true);
    try {
      const result = await otpTransitionApi.sendBulkReminders(token, selectedUsers, 'grace_period');
      alert(`Successfully sent ${result.data.successCount} reminders`);
      setSelectedUsers([]);
    } catch (error) {
      alert('Failed to send reminders: ' + error.message);
    } finally {
      setSending(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await otpTransitionApi.exportTransitionData(token, {
        status: filters.status !== 'all' ? filters.status : undefined,
        role: filters.role !== 'all' ? filters.role : undefined
      });
    } catch (error) {
      alert('Failed to export data: ' + error.message);
    } finally {
      setExporting(false);
    }
  };

  const handleSelectUser = (userId) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(u => u.id));
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      completed: { label: 'Completed', className: 'bg-green-100 text-green-800' },
      in_grace_period: { label: 'In Grace Period', className: 'bg-yellow-100 text-yellow-800' },
      past_grace_period: { label: 'Past Grace Period', className: 'bg-red-100 text-red-800' },
      verified: { label: 'Verified', className: 'bg-blue-100 text-blue-800' },
      not_verified: { label: 'Not Verified', className: 'bg-gray-100 text-gray-800' }
    };

    const config = statusConfig[status] || statusConfig.not_verified;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">OTP Transition Management</h1>
          <p className="text-gray-600">Track and manage user migration to OTP login</p>
        </div>
        <Button
          onClick={() => loadData()}
          variant="outline"
          size="sm"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Primary Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{stats?.metrics.totalUsers || 0}</div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Email Verified</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{stats?.metrics.verifiedUsers || 0}</div>
                <div className="text-sm text-gray-500">{stats?.metrics.verifiedPercentage}%</div>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">OTP Enabled</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{stats?.metrics.otpEnabledUsers || 0}</div>
                <div className="text-sm text-gray-500">{stats?.metrics.otpEnabledPercentage}%</div>
              </div>
              <Mail className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Fully Migrated</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{stats?.metrics.fullyMigratedUsers || 0}</div>
                <div className="text-sm text-gray-500">{stats?.metrics.transitionCompletePercentage}%</div>
              </div>
              <Shield className="h-8 w-8 text-indigo-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Email Verification Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Pending Verification</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{stats?.metrics.pendingEmailVerifications || 0}</div>
                <div className="text-sm text-gray-500">Need email verification</div>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Pending OTP Adoption</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{stats?.metrics.pendingOTPAdoptions || 0}</div>
                <div className="text-sm text-gray-500">Verified but not migrated</div>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">OTP Adoption Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{stats?.metrics.otpAdoptionRate || 0}%</div>
                <div className="text-sm text-gray-500">Of verified users</div>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Reminders Sent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{stats?.metrics.usersReceivedReminders || 0}</div>
                <div className="text-sm text-gray-500">Users contacted</div>
              </div>
              <Send className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Location-Based Analytics */}
      {stats?.locationBreakdown && stats.locationBreakdown.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Location-Based Verification Analytics</CardTitle>
            <CardDescription>Email verification and OTP adoption rates by location</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Location</th>
                    <th className="text-right p-2">Total Users</th>
                    <th className="text-right p-2">Verified</th>
                    <th className="text-right p-2">OTP Enabled</th>
                    <th className="text-right p-2">Verification Rate</th>
                    <th className="text-right p-2">OTP Adoption Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.locationBreakdown.map((location, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="p-2 font-medium">{location.location}</td>
                      <td className="p-2 text-right">{location.total}</td>
                      <td className="p-2 text-right">{location.verified}</td>
                      <td className="p-2 text-right">{location.otp_enabled}</td>
                      <td className="p-2 text-right">
                        <span className={`px-2 py-1 rounded text-xs ${
                          parseFloat(location.verification_rate) >= 80 ? 'bg-green-100 text-green-800' :
                          parseFloat(location.verification_rate) >= 50 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {location.verification_rate}%
                        </span>
                      </td>
                      <td className="p-2 text-right">
                        <span className={`px-2 py-1 rounded text-xs ${
                          parseFloat(location.otp_adoption_rate) >= 80 ? 'bg-green-100 text-green-800' :
                          parseFloat(location.otp_adoption_rate) >= 50 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {location.otp_adoption_rate}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Verification Funnel Analytics */}
      {stats?.funnelAnalytics && stats.funnelAnalytics.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Verification Funnel Analytics</CardTitle>
            <CardDescription>User progression through the email verification and OTP adoption process</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.funnelAnalytics.map((stage, index) => {
                const percentage = parseFloat(stage.percentage);
                const isLastStage = index === stats.funnelAnalytics.length - 1;
                
                return (
                  <div key={stage.stage} className="flex items-center space-x-4">
                    <div className="w-32 text-sm font-medium">{stage.stage}</div>
                    <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                      <div 
                        className={`h-6 rounded-full transition-all duration-500 ${
                          stage.stage === 'Total Users' ? 'bg-blue-500' :
                          stage.stage === 'Email Verified' ? 'bg-green-500' :
                          stage.stage === 'OTP Enabled' ? 'bg-purple-500' :
                          'bg-indigo-500'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">
                        {stage.count} ({percentage}%)
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>Filter, manage, and send reminders to users</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <Label>Status</Label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="not_verified">Not Verified</option>
                <option value="verified">Verified</option>
                <option value="in_grace_period">In Grace Period</option>
                <option value="otp_enabled">OTP Enabled</option>
                <option value="past_grace_period">Past Grace Period</option>
              </select>
            </div>

            <div>
              <Label>Role</Label>
              <select
                value={filters.role}
                onChange={(e) => setFilters({ ...filters, role: e.target.value, page: 1 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Roles</option>
                <option value="MasterAdmin">MasterAdmin</option>
                <option value="SuperAdmin">SuperAdmin</option>
                <option value="Admin">Admin</option>
                <option value="Marketer">Marketer</option>
                <option value="Dealer">Dealer</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name or email..."
                  className="pl-10"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              onClick={handleSendReminders}
              disabled={selectedUsers.length === 0 || sending}
              size="sm"
            >
              <Send className="h-4 w-4 mr-2" />
              {sending ? 'Sending...' : `Send Reminders (${selectedUsers.length})`}
            </Button>

            <Button
              onClick={handleExport}
              disabled={exporting}
              variant="outline"
              size="sm"
            >
              <Download className="h-4 w-4 mr-2" />
              {exporting ? 'Exporting...' : 'Export CSV'}
            </Button>

            <Button
              onClick={handleTriggerReminders}
              disabled={triggeringReminders}
              variant="outline"
              size="sm"
              className="border-purple-600 text-purple-700 hover:bg-purple-50"
            >
              <Mail className="h-4 w-4 mr-2" />
              {triggeringReminders ? 'Triggering...' : 'Trigger All Reminders'}
            </Button>
          </div>

          {/* Reminder Stats */}
          {reminderStats && (
            <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <h4 className="font-medium text-purple-900 text-sm mb-2">Automated Reminder System</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div>
                  <span className="text-purple-700">Total Sent:</span>
                  <span className="ml-2 font-semibold text-purple-900">{reminderStats.total_reminders_sent || 0}</span>
                </div>
                <div>
                  <span className="text-purple-700">In Window:</span>
                  <span className="ml-2 font-semibold text-purple-900">{reminderStats.users_in_reminder_window || 0}</span>
                </div>
                <div>
                  <span className="text-purple-700">Critical:</span>
                  <span className="ml-2 font-semibold text-red-600">{reminderStats.critical_users || 0}</span>
                </div>
                <div>
                  <span className="text-purple-700">Last Run:</span>
                  <span className="ml-2 font-semibold text-purple-900">
                    {reminderStats.last_reminder_time 
                      ? new Date(reminderStats.last_reminder_time).toLocaleDateString()
                      : 'Never'
                    }
                  </span>
                </div>
              </div>
              <p className="text-xs text-purple-600 mt-2">
                Automated reminders run daily at 9:00 AM. Milestones: 14, 7, 3, and 1 day before grace period ends.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* User List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Users ({pagination?.total || 0})</CardTitle>
            <Button
              onClick={handleSelectAll}
              variant="ghost"
              size="sm"
            >
              {selectedUsers.length === users.length ? 'Deselect All' : 'Select All'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">
                    <input
                      type="checkbox"
                      checked={selectedUsers.length === users.length && users.length > 0}
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th className="text-left p-2">User</th>
                  <th className="text-left p-2">Email</th>
                  <th className="text-left p-2">Role</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Days Remaining</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b hover:bg-gray-50">
                    <td className="p-2">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={() => handleSelectUser(user.id)}
                      />
                    </td>
                    <td className="p-2">
                      <div className="font-medium">{user.first_name} {user.last_name}</div>
                      <div className="text-sm text-gray-500">{user.unique_id}</div>
                    </td>
                    <td className="p-2 text-sm">{user.email}</td>
                    <td className="p-2">
                      <Badge variant="outline">{user.role}</Badge>
                    </td>
                    <td className="p-2">{getStatusBadge(user.transition_status)}</td>
                    <td className="p-2">
                      {user.days_remaining > 0 ? (
                        <span className="text-sm text-yellow-600">{Math.floor(user.days_remaining)} days</span>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-600">
                Page {pagination.page} of {pagination.totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                  disabled={filters.page === 1}
                  variant="outline"
                  size="sm"
                >
                  Previous
                </Button>
                <Button
                  onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                  disabled={filters.page >= pagination.totalPages}
                  variant="outline"
                  size="sm"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OTPTransitionDashboard;
