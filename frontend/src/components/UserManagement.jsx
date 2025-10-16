import React, { useState, useEffect } from 'react';
import { useToast } from '../components/ui/use-toast';
import {
  lockUser,
  unlockUser,
  softDeleteUser,
  hardDeleteUser,
  restoreUser,
  getDeletedUsers,
  getUserActivity,
  checkUserStatus
} from '../api/userManagementApi';
import { useAuth } from '../contexts/AuthContext';

const UserManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [users, setUsers] = useState([]);
  const [deletedUsers, setDeletedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('active'); // 'active' or 'deleted'
  
  // Modal states
  const [lockModal, setLockModal] = useState({ open: false, user: null, reason: '' });
  const [deleteModal, setDeleteModal] = useState({ open: false, user: null, type: null });
  const [restoreModal, setRestoreModal] = useState({ open: false, user: null });
  const [activityModal, setActivityModal] = useState({ open: false, user: null, activity: null });

  // Check if user is MasterAdmin
  const isMasterAdmin = user?.role === 'MasterAdmin';

  useEffect(() => {
    if (isMasterAdmin) {
      loadUsers();
    }
  }, [isMasterAdmin, activeTab]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      if (activeTab === 'deleted') {
        const response = await getDeletedUsers();
        setDeletedUsers(response.data || []);
      } else {
        // Load active users from your existing API
        // This is a placeholder - you'll need to integrate with your existing users API
        setUsers([]);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load users',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLockUser = async () => {
    if (!lockModal.reason.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please provide a reason for locking the account',
        variant: 'destructive',
      });
      return;
    }

    try {
      await lockUser(lockModal.user.id, lockModal.reason);
      toast({
        title: 'Success',
        description: `${lockModal.user.first_name} ${lockModal.user.last_name}'s account has been locked`,
      });
      setLockModal({ open: false, user: null, reason: '' });
      loadUsers();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to lock user account',
        variant: 'destructive',
      });
    }
  };

  const handleUnlockUser = async (userId) => {
    try {
      await unlockUser(userId);
      toast({
        title: 'Success',
        description: 'User account has been unlocked',
      });
      loadUsers();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to unlock user account',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteModal.type) return;

    try {
      if (deleteModal.type === 'soft') {
        await softDeleteUser(deleteModal.user.id);
        toast({
          title: 'Success',
          description: `${deleteModal.user.first_name} ${deleteModal.user.last_name}'s account has been soft deleted. All data is preserved.`,
        });
      } else if (deleteModal.type === 'hard') {
        await hardDeleteUser(deleteModal.user.id);
        toast({
          title: 'Success',
          description: `${deleteModal.user.first_name} ${deleteModal.user.last_name}'s account has been permanently deleted.`,
        });
      }
      setDeleteModal({ open: false, user: null, type: null });
      loadUsers();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete user account',
        variant: 'destructive',
      });
    }
  };

  const handleRestoreUser = async () => {
    try {
      await restoreUser(restoreModal.user.id);
      toast({
        title: 'Success',
        description: `${restoreModal.user.first_name} ${restoreModal.user.last_name}'s account has been restored`,
      });
      setRestoreModal({ open: false, user: null });
      loadUsers();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to restore user account',
        variant: 'destructive',
      });
    }
  };

  const handleViewActivity = async (userId) => {
    try {
      const response = await getUserActivity(userId);
      setActivityModal({ open: true, user: deletedUsers.find(u => u.id === userId), activity: response.data });
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load user activity',
        variant: 'destructive',
      });
    }
  };

  if (!isMasterAdmin) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-semibold">Access Denied</h3>
          <p className="text-red-600">You do not have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-1">Manage user accounts, lock/unlock, and delete users</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('active')}
            className={`${
              activeTab === 'active'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Active Users
          </button>
          <button
            onClick={() => setActiveTab('deleted')}
            className={`${
              activeTab === 'deleted'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Deleted Users
          </button>
        </nav>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : activeTab === 'deleted' ? (
        <DeletedUsersTable
          users={deletedUsers}
          onRestore={(user) => setRestoreModal({ open: true, user })}
          onViewActivity={handleViewActivity}
        />
      ) : (
        <ActiveUsersTable
          users={users}
          onLock={(user) => setLockModal({ open: true, user, reason: '' })}
          onUnlock={handleUnlockUser}
          onDelete={(user, type) => setDeleteModal({ open: true, user, type })}
        />
      )}

      {/* Lock User Modal */}
      {lockModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Lock User Account</h2>
            <p className="text-gray-600 mb-4">
              Locking account for: <strong>{lockModal.user?.first_name} {lockModal.user?.last_name}</strong>
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Locking <span className="text-red-500">*</span>
              </label>
              <textarea
                value={lockModal.reason}
                onChange={(e) => setLockModal({ ...lockModal, reason: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
                placeholder="Enter the reason for locking this account..."
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setLockModal({ open: false, user: null, reason: '' })}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleLockUser}
                className="px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700"
              >
                Lock Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete User Modal */}
      {deleteModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">
              {deleteModal.type === 'hard' ? 'Hard Delete User' : 'Soft Delete User'}
            </h2>
            <p className="text-gray-600 mb-4">
              User: <strong>{deleteModal.user?.first_name} {deleteModal.user?.last_name}</strong>
            </p>
            
            {deleteModal.type === 'hard' ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <h3 className="text-red-800 font-semibold mb-2">⚠️ Permanent Deletion</h3>
                <ul className="text-red-700 text-sm space-y-1">
                  <li>• All user data will be permanently deleted</li>
                  <li>• This action cannot be undone</li>
                  <li>• User will not be able to login</li>
                  <li>• All records will be erased from database</li>
                </ul>
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <h3 className="text-yellow-800 font-semibold mb-2">🔒 Soft Delete (Recommended)</h3>
                <ul className="text-yellow-700 text-sm space-y-1">
                  <li>• User cannot login</li>
                  <li>• All data is preserved</li>
                  <li>• Account can be restored</li>
                  <li>• You can view all user records</li>
                </ul>
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteModal({ open: false, user: null, type: null })}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                className={`px-4 py-2 text-white rounded-md ${
                  deleteModal.type === 'hard'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-yellow-600 hover:bg-yellow-700'
                }`}
              >
                {deleteModal.type === 'hard' ? 'Permanently Delete' : 'Soft Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Restore User Modal */}
      {restoreModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Restore User Account</h2>
            <p className="text-gray-600 mb-4">
              Restore account for: <strong>{restoreModal.user?.first_name} {restoreModal.user?.last_name}</strong>
            </p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <p className="text-green-700 text-sm">
                This will restore the user's access to their account. They will be able to login again.
              </p>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setRestoreModal({ open: false, user: null })}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleRestoreUser}
                className="px-4 py-2 text-white bg-green-600 rounded-md hover:bg-green-700"
              >
                Restore Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Activity Modal */}
      {activityModal.open && activityModal.activity && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              Activity History: {activityModal.user?.first_name} {activityModal.user?.last_name}
            </h2>
            
            {/* Orders */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Orders ({activityModal.activity.orders.length})</h3>
              <div className="space-y-2">
                {activityModal.activity.orders.map(order => (
                  <div key={order.id} className="border rounded p-3">
                    <p className="font-medium">{order.product_name}</p>
                    <p className="text-sm text-gray-600">Qty: {order.quantity} | Amount: ₦{order.total_amount}</p>
                    <p className="text-xs text-gray-500">{new Date(order.created_at).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Messages */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Messages ({activityModal.activity.messages.length})</h3>
              <div className="space-y-2">
                {activityModal.activity.messages.map(msg => (
                  <div key={msg.id} className="border rounded p-3">
                    <p className="text-sm">{msg.message}</p>
                    <p className="text-xs text-gray-500">{new Date(msg.created_at).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Audit Logs */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Audit Logs ({activityModal.activity.auditLogs.length})</h3>
              <div className="space-y-2">
                {activityModal.activity.auditLogs.map(log => (
                  <div key={log.id} className="border rounded p-3">
                    <p className="font-medium">{log.action}</p>
                    <p className="text-sm text-gray-600">{log.reason}</p>
                    <p className="text-xs text-gray-500">{new Date(log.created_at).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setActivityModal({ open: false, user: null, activity: null })}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Active Users Table Component
const ActiveUsersTable = ({ users, onLock, onUnlock, onDelete }) => {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              User
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Role
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {users.length === 0 ? (
            <tr>
              <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                No active users found
              </td>
            </tr>
          ) : (
            users.map((user) => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {user.first_name} {user.last_name}
                      </div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {user.is_locked ? (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                      Locked
                    </span>
                  ) : (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      Active
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  {user.is_locked ? (
                    <button
                      onClick={() => onUnlock(user.id)}
                      className="text-green-600 hover:text-green-900"
                    >
                      Unlock
                    </button>
                  ) : (
                    <button
                      onClick={() => onLock(user)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Lock
                    </button>
                  )}
                  <button
                    onClick={() => onDelete(user, 'soft')}
                    className="text-yellow-600 hover:text-yellow-900"
                  >
                    Soft Delete
                  </button>
                  <button
                    onClick={() => onDelete(user, 'hard')}
                    className="text-red-600 hover:text-red-900"
                  >
                    Hard Delete
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

// Deleted Users Table Component
const DeletedUsersTable = ({ users, onRestore, onViewActivity }) => {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              User
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Role
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Deleted By
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Deleted At
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Records
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {users.length === 0 ? (
            <tr>
              <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                No deleted users found
              </td>
            </tr>
          ) : (
            users.map((user) => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {user.first_name} {user.last_name}
                      </div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.deleted_by_name} {user.deleted_by_last_name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(user.deleted_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  Orders: {user.total_orders} | Messages: {user.total_messages}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <button
                    onClick={() => onViewActivity(user.id)}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    View Activity
                  </button>
                  <button
                    onClick={() => onRestore(user)}
                    className="text-green-600 hover:text-green-900"
                  >
                    Restore
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default UserManagement;

