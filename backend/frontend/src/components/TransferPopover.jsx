import React, { useState, useEffect, useRef } from 'react';
import api from '../api';
import { useAlert } from '../hooks/useAlert';

const TransferPopover = ({ 
  isOpen, 
  onClose, 
  stockId, 
  onTransferSuccess,
  currentUserLocation 
}) => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [transferReason, setTransferReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const popoverRef = useRef(null);
  const { showSuccess, showError } = useAlert();

  // Load users from same location
  useEffect(() => {
    if (isOpen) {
      loadUsers();
    }
  }, [isOpen, currentUserLocation]);

  // Filter users based on search term
  useEffect(() => {
    if (searchTerm.trim()) {
      const filtered = users.filter(user => 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.unique_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.role.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [searchTerm, users]);

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      
      if (!currentUserLocation) {
        showError('User location not found', 'Error');
        return;
      }
      
      const response = await api.get(`/master-admin/users/location/${currentUserLocation}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      // Filter to only include Marketers, Admins, and SuperAdmins
      const eligibleUsers = response.data.users.filter(user => 
        ['Marketer', 'Admin', 'SuperAdmin'].includes(user.role)
      );
      
      setUsers(eligibleUsers);
      setFilteredUsers(eligibleUsers);
    } catch (error) {
      console.error('Error loading users:', error);
      showError('Failed to load users', 'Error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserSelect = (user) => {
    setSelectedUser(user);
  };

  const handleTransfer = async () => {
    if (!selectedUser) {
      showError('Please select a user to transfer to', 'Selection Required');
      return;
    }

    if (!transferReason.trim()) {
      showError('Please provide a reason for the transfer', 'Reason Required');
      return;
    }

    try {
      setIsSubmitting(true);
      await api.post(`/stock/${stockId}/transfer`, {
        targetIdentifier: selectedUser.unique_id,
        reason: transferReason.trim()
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      showSuccess('Transfer request submitted successfully!');
      onTransferSuccess();
      onClose();
    } catch (error) {
      console.error('Transfer error:', error);
      showError(
        error.response?.data?.message || 'Transfer request failed', 
        'Transfer Failed'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedUser(null);
    setTransferReason('');
    setSearchTerm('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div 
        ref={popoverRef}
        className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] sm:max-h-[85vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Transfer Stock</h3>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 space-y-3 sm:space-y-4 flex-1 overflow-y-auto">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Users
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search by name, ID, or role..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* User Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select User
            </label>
            <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-lg">
              {isLoading ? (
                <div className="p-4 text-center text-gray-500">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2">Loading users...</p>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  {searchTerm ? 'No users found matching your search' : 'No users available'}
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {filteredUsers.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => handleUserSelect(user)}
                      className={`w-full p-2 text-left hover:bg-gray-50 transition-colors ${
                        selectedUser?.id === user.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{user.name}</p>
                          <p className="text-xs text-gray-600 font-mono">{user.unique_id}</p>
                        </div>
                        <div className="flex items-center space-x-2 ml-2">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            user.role === 'SuperAdmin' ? 'bg-purple-100 text-purple-800' :
                            user.role === 'Admin' ? 'bg-blue-100 text-blue-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {user.role}
                          </span>
                          <span className="text-xs text-gray-500">{user.location}</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Selected User Summary */}
          {selectedUser && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <h4 className="text-sm font-medium text-blue-900 mb-1">Selected User:</h4>
              <p className="text-sm text-blue-800">
                <strong>{selectedUser.name}</strong> ({selectedUser.unique_id}) - {selectedUser.role}
              </p>
              <p className="text-xs text-blue-600">{selectedUser.location}</p>
            </div>
          )}

          {/* Transfer Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Transfer Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              value={transferReason}
              onChange={(e) => setTransferReason(e.target.value)}
              placeholder="Please provide a reason for this transfer..."
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gray-50 border-t border-gray-200 flex gap-2 sm:gap-3">
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-2 text-gray-700 bg-white border-2 border-[#f59e0b] rounded-lg hover:bg-gray-50 transition-colors"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            onClick={handleTransfer}
            disabled={!selectedUser || !transferReason.trim() || isSubmitting}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center border-2 border-[#f59e0b]"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Submitting...
              </>
            ) : (
              'Submit Transfer'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransferPopover;
