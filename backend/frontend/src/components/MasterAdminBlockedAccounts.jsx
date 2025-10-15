import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
// Custom modal components since Dialog is not available
import { AlertTriangle, Unlock, Eye, Calendar, User, Shield } from 'lucide-react'
import api from '../api'
import { useAlert } from '../hooks/useAlert'

// Custom Modal Component
const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
        onClick={onClose}
      />
      <div className="relative w-full max-w-2xl bg-white rounded-lg shadow-xl border border-gray-200 p-6 mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-gray-100 transition-colors"
          >
            <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

const MasterAdminBlockedAccounts = () => {
  const [blockedAccounts, setBlockedAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedUser, setSelectedUser] = useState(null)
  const [violationLogs, setViolationLogs] = useState([])
  const [unlockReason, setUnlockReason] = useState('')
  const [showUnlockDialog, setShowUnlockDialog] = useState(false)
  const [unlocking, setUnlocking] = useState(false)
  const { showSuccess, showError, showConfirmation } = useAlert()

  useEffect(() => {
    fetchBlockedAccounts()
  }, [])

  const fetchBlockedAccounts = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await api.get('/stock/violations/blocked-accounts')
      if (response.data.success) {
        setBlockedAccounts(response.data.blockedAccounts)
      } else {
        setError(response.data.message || 'Failed to fetch blocked accounts')
      }
    } catch (err) {
      console.error('Error fetching blocked accounts:', err)
      setError(err.response?.data?.message || 'Error fetching blocked accounts')
    } finally {
      setLoading(false)
    }
  }

  const fetchViolationLogs = async (userId) => {
    try {
      const response = await api.get(`/stock/violations/user/${userId}/logs`)
      if (response.data.success) {
        setViolationLogs(response.data.violationLogs)
      }
    } catch (err) {
      console.error('Error fetching violation logs:', err)
      showError('Failed to fetch violation logs', 'Error')
    }
  }

  const handleUnlockAccount = async (userId, userName) => {
    if (!unlockReason.trim()) {
      showError('Please provide a reason for unlocking the account', 'Validation Error')
      return
    }

    showConfirmation({
      title: 'Unlock Account',
      message: `Are you sure you want to unlock the account for ${userName}? This will reset their violation count and allow them to use pickup features again.`,
      onConfirm: async () => {
        setUnlocking(true)
        try {
          const response = await api.post(`/stock/violations/unlock/${userId}`, {
            unlockReason: unlockReason.trim()
          })
          
          if (response.data.success) {
            showSuccess(response.data.message, 'Account Unlocked')
            setShowUnlockDialog(false)
            setUnlockReason('')
            setSelectedUser(null)
            fetchBlockedAccounts()
          } else {
            showError(response.data.message || 'Failed to unlock account', 'Error')
          }
        } catch (err) {
          console.error('Error unlocking account:', err)
          showError(err.response?.data?.message || 'Failed to unlock account', 'Error')
        } finally {
          setUnlocking(false)
        }
      }
    })
  }

  const getStatusBadge = (violationCount) => {
    if (violationCount >= 4) {
      return <Badge variant="destructive" className="bg-red-100 text-red-800">Blocked (4+ violations)</Badge>
    } else if (violationCount >= 3) {
      return <Badge variant="destructive" className="bg-orange-100 text-orange-800">Warning (3 violations)</Badge>
    } else {
      return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">{violationCount} violations</Badge>
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString()
  }

  if (loading) {
    return <div className="text-center py-8">Loading blocked accounts...</div>
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">Error: {error}</div>
  }

  return (
    <div className="px-4 py-6 md:px-6 lg:px-12">
      <Card className="bg-white dark:bg-gray-800 shadow-lg rounded-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <Shield className="w-6 h-6 mr-2 text-red-600" />
            Blocked Accounts Management
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Manage accounts that have been blocked due to pickup violations. Only MasterAdmin can unlock accounts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {blockedAccounts.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Shield className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold mb-2">No Blocked Accounts</h3>
              <p>All accounts are currently active and in good standing.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Violations
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Blocked At
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Reason
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {blockedAccounts.map((account) => (
                    <tr key={account.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
                            <User className="w-5 h-5 text-red-600" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {account.first_name} {account.last_name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {account.unique_id}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant="outline" className="bg-blue-100 text-blue-800">
                          {account.role}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(account.pickup_violation_count)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {formatDate(account.blocked_at)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                        {account.blocking_reason}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedUser(account)
                              fetchViolationLogs(account.id)
                            }}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View Logs
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedUser(account)
                              setShowUnlockDialog(true)
                            }}
                            className="text-green-600 hover:text-green-800"
                          >
                            <Unlock className="w-4 h-4 mr-1" />
                            Unlock
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Violation Logs Modal */}
      {selectedUser && (
        <Modal 
          isOpen={!!selectedUser} 
          onClose={() => setSelectedUser(null)}
          title={
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-red-600" />
              Violation Logs for {selectedUser.first_name} {selectedUser.last_name}
            </div>
          }
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Complete history of pickup violations and account actions
            </p>
            {violationLogs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No violation logs found for this user.
              </div>
            ) : (
              violationLogs.map((log) => (
                <Card key={log.id} className="border-l-4 border-l-red-500">
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-start mb-2">
                      <Badge variant="outline" className="bg-red-100 text-red-800">
                        Violation #{log.violation_count}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        {formatDate(log.created_at)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                      {log.violation_message}
                    </p>
                    <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
                      <div>
                        <strong>Type:</strong> {log.violation_type}
                      </div>
                      <div>
                        <strong>Active Stock:</strong> {log.active_stock_count} units
                      </div>
                      <div>
                        <strong>Attempted Pickup:</strong> {log.attempted_pickup_quantity} units
                      </div>
                      {log.resolved_at && (
                        <div>
                          <strong>Resolved:</strong> {formatDate(log.resolved_at)}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </Modal>
      )}

      {/* Unlock Account Modal */}
      <Modal 
        isOpen={showUnlockDialog} 
        onClose={() => {
          setShowUnlockDialog(false)
          setUnlockReason('')
          setSelectedUser(null)
        }}
        title={
          <div className="flex items-center">
            <Unlock className="w-5 h-5 mr-2 text-green-600" />
            Unlock Account
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Provide a reason for unlocking {selectedUser?.first_name} {selectedUser?.last_name}'s account.
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Unlock Reason
            </label>
            <textarea
              value={unlockReason}
              onChange={(e) => setUnlockReason(e.target.value)}
              placeholder="Enter the reason for unlocking this account..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowUnlockDialog(false)
                setUnlockReason('')
                setSelectedUser(null)
              }}
              disabled={unlocking}
            >
              Cancel
            </Button>
            <Button
              onClick={() => handleUnlockAccount(selectedUser.id, `${selectedUser.first_name} ${selectedUser.last_name}`)}
              disabled={unlocking || !unlockReason.trim()}
              className="bg-green-600 hover:bg-green-700"
            >
              {unlocking ? 'Unlocking...' : 'Unlock Account'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default MasterAdminBlockedAccounts
