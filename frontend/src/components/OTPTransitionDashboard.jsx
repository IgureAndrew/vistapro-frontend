import React, { useState, useEffect } from 'react';
import { 
  Users, Mail, CheckCircle, XCircle, Clock, Download, 
  Send, Search, Filter, RefreshCw, AlertTriangle 
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
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

  const token = localStorage.getItem('token');

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsData, usersData] = await Promise.all([
        otpTransitionApi.getTransitionStats(token),
        otpTransitionApi.getTransitionUsers(token, filters)
      ]);

      setStats(statsData.data);
      setUsers(usersData.data.users);
      setPagination(usersData.data.pagination);
    } catch (error) {
      console.error('Error loading OTP transition data:', error);
    } finally {
      setLoading(false);
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

      {/* Statistics Cards */}
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
            <CardTitle className="text-sm font-medium text-gray-600">In Grace Period</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{stats?.metrics.usersInGracePeriod || 0}</div>
                <div className="text-sm text-gray-500">{stats?.metrics.gracePeriodPercentage}%</div>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

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
              <Select
                value={filters.status}
                onValueChange={(value) => setFilters({ ...filters, status: value, page: 1 })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="not_verified">Not Verified</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="in_grace_period">In Grace Period</SelectItem>
                  <SelectItem value="otp_enabled">OTP Enabled</SelectItem>
                  <SelectItem value="past_grace_period">Past Grace Period</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Role</Label>
              <Select
                value={filters.role}
                onValueChange={(value) => setFilters({ ...filters, role: value, page: 1 })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="SuperAdmin">SuperAdmin</SelectItem>
                  <SelectItem value="Admin">Admin</SelectItem>
                  <SelectItem value="Marketer">Marketer</SelectItem>
                  <SelectItem value="Dealer">Dealer</SelectItem>
                </SelectContent>
              </Select>
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
          </div>
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
