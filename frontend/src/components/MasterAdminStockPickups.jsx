import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, Clock, Package, User, Calendar, Search, Filter, RefreshCw, ChevronLeft, ChevronRight, Download, Eye } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import api from '../api'
import { useAlert } from '../hooks/useAlert'
import AlertDialog from './AlertDialog'

const MasterAdminStockPickups = () => {
  const [stockPickups, setStockPickups] = useState([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(null)
  const [now, setNow] = useState(Date.now())
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [itemsPerPage] = useState(10)
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [locationFilter, setLocationFilter] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  
  // User summary popover states
  const [selectedUser, setSelectedUser] = useState(null)
  const [userSummary, setUserSummary] = useState(null)
  const [loadingSummary, setLoadingSummary] = useState(false)
  
  const { alert, showSuccess, showError, hideAlert } = useAlert()

  // Live clock for countdown
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    loadStockPickups()
  }, [currentPage, searchTerm, statusFilter, locationFilter])

  // Reset to first page when filters change
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1)
    }
  }, [searchTerm, statusFilter, locationFilter])

  const loadStockPickups = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage,
        limit: itemsPerPage,
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter && { status: statusFilter }),
        ...(locationFilter && { location: locationFilter })
      })
      
      const response = await api.get(`/stock/?${params}`)
      if (response.data.success) {
        setStockPickups(response.data.data)
        setTotalPages(response.data.pagination.totalPages)
        setTotalItems(response.data.pagination.totalItems)
      }
    } catch (error) {
      console.error('Error loading stock pickups:', error)
      showError('Failed to load stock pickups', 'Error')
    } finally {
      setLoading(false)
    }
  }

  const loadUserSummary = async (userId) => {
    try {
      setLoadingSummary(true)
      const response = await api.get(`/stock/user/${userId}/summary`)
      if (response.data.success) {
        setUserSummary(response.data)
      }
    } catch (error) {
      console.error('Error loading user summary:', error)
      showError('Failed to load user summary', 'Error')
    } finally {
      setLoadingSummary(false)
    }
  }

  const handleUserClick = (userId) => {
    setSelectedUser(userId)
    loadUserSummary(userId)
  }

  const exportUserSummary = () => {
    if (!userSummary) return
    
    const csvContent = [
      ['User', 'Role', 'Location', 'Total Pickups', 'Pending', 'Sold', 'Returned', 'Expired'],
      [
        userSummary.user.name,
        userSummary.user.role,
        userSummary.user.location,
        userSummary.summary.total,
        userSummary.summary.pending,
        userSummary.summary.sold,
        userSummary.summary.returned,
        userSummary.summary.expired
      ]
    ].map(row => row.join(',')).join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${userSummary.user.unique_id}_stock_summary.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage)
  }

  const formatCountdown = (deadline) => {
    const diff = new Date(deadline).getTime() - now
    
    if (diff >= 0) {
      // Still pending - show remaining time (countdown)
      const hrs = Math.floor(diff / 3_600_000)
      const mins = Math.floor((diff % 3_600_000) / 60_000)
      const secs = Math.floor((diff % 60_000) / 1_000)
      
      return {
        type: 'countdown',
        text: `${hrs}h ${mins}m ${secs}s`,
        color: 'text-green-600'
      }
    } else {
      // Expired - show elapsed time (count-up)
      const elapsed = Math.abs(diff)
      const hrs = Math.floor(elapsed / 3_600_000)
      const mins = Math.floor((elapsed % 3_600_000) / 60_000)
      
      return {
        type: 'countup',
        text: `Expired ${hrs}h ${mins}m ago`,
        color: 'text-red-600'
      }
    }
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      'Pending': { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      'Sold': { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      'Returned': { color: 'bg-orange-100 text-orange-800', icon: XCircle },
      'Transferred': { color: 'bg-blue-100 text-blue-800', icon: Package },
      'Expired': { color: 'bg-red-100 text-red-800', icon: XCircle },
      'return_pending': { color: 'bg-orange-100 text-orange-800', icon: Clock },
      'Pending Transfer': { color: 'bg-blue-100 text-blue-800', icon: Clock },
      'Transfer Approved': { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      'Transfer Rejected': { color: 'bg-red-100 text-red-800', icon: XCircle }
    }
    
    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', icon: Package }
    const IconComponent = config.icon
    
    return (
      <Badge className={config.color}>
        <IconComponent className="w-3 h-3 mr-1" />
        {status}
      </Badge>
    )
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString()
  }

  const getRoleFromUniqueId = (uniqueId) => {
    if (uniqueId?.startsWith('DSR')) return 'Marketer'
    if (uniqueId?.startsWith('ASM')) return 'Admin'
    if (uniqueId?.startsWith('RSM')) return 'SuperAdmin'
    return 'Unknown'
  }

  const handleConfirmReturn = async (pickupId) => {
    try {
      setProcessing(pickupId)
      await api.patch(`/stock/${pickupId}/return`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      })
      showSuccess('Return confirmed successfully! Product has been restocked.', 'Return Confirmed')
      loadStockPickups() // Refresh the list
    } catch (error) {
      console.error('Error confirming return:', error)
      showError(error.response?.data?.message || 'Failed to confirm return', 'Error')
    } finally {
      setProcessing(null)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 py-6 md:px-6 lg:px-12 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stock Pickup Management</h1>
          <p className="text-gray-600">Monitor all stock pickups across the system</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={() => setShowFilters(!showFilters)} variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
          <Button onClick={loadStockPickups} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, ID, or device..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="sold">Sold</option>
                <option value="returned">Returned</option>
                <option value="transferred">Transferred</option>
                <option value="expired">Expired</option>
                <option value="return_pending">Pending Return</option>
                <option value="transfer_pending">Pending Transfer</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
              <input
                type="text"
                placeholder="Filter by location..."
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{totalItems}</div>
            <div className="text-sm text-gray-600">Total Pickups</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">
              {stockPickups.filter(p => p.status === 'pending').length}
            </div>
            <div className="text-sm text-gray-600">Pending</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {stockPickups.filter(p => p.status === 'sold').length}
            </div>
            <div className="text-sm text-gray-600">Sold</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">
              {stockPickups.filter(p => p.status === 'return_pending').length}
            </div>
            <div className="text-sm text-gray-600">Pending Return</div>
          </CardContent>
        </Card>
      </div>

      {/* Stock Pickups Table */}
      {stockPickups.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Stock Pickups Found</h3>
            <p className="text-gray-600">
              {searchTerm || statusFilter || locationFilter 
                ? 'Try adjusting your search or filters.' 
                : 'No stock pickups have been created yet.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pickup Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deadline</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Countdown</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {stockPickups.map((pickup) => {
                    const timer = pickup.deadline && !['sold', 'returned', 'transferred'].includes(pickup.status) ? formatCountdown(pickup.deadline) : null
                    
                    return (
                      <tr key={pickup.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Popover>
                            <PopoverTrigger asChild>
                              <button 
                                className="text-left hover:text-blue-600 cursor-pointer"
                                onClick={() => handleUserClick(pickup.marketer_id)}
                              >
                                <div className="text-sm font-medium text-gray-900">
                                  {pickup.first_name} {pickup.last_name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {pickup.marketer_unique_id} ({pickup.user_role}) - {pickup.location}
                                </div>
                              </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-96 p-4">
                              {loadingSummary ? (
                                <div className="text-center py-4">Loading...</div>
                              ) : userSummary ? (
                                <div className="space-y-4">
                                  <div className="border-b pb-2">
                                    <h3 className="font-semibold text-lg">{userSummary.user.name}</h3>
                                    <p className="text-sm text-gray-600">{userSummary.user.unique_id} ({userSummary.user.role})</p>
                                    <p className="text-sm text-gray-600">{userSummary.user.location}</p>
                                    {userSummary.user.hierarchy.admin && (
                                      <p className="text-xs text-gray-500">Admin: {userSummary.user.hierarchy.admin}</p>
                                    )}
                                    {userSummary.user.hierarchy.superadmin && (
                                      <p className="text-xs text-gray-500">SuperAdmin: {userSummary.user.hierarchy.superadmin}</p>
                                    )}
                                  </div>
                                  <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div>Total: {userSummary.summary.total}</div>
                                    <div>Pending: {userSummary.summary.pending}</div>
                                    <div>Sold: {userSummary.summary.sold}</div>
                                    <div>Returned: {userSummary.summary.returned}</div>
                                    <div>Expired: {userSummary.summary.expired}</div>
                                    <div>Return Pending: {userSummary.summary.return_pending}</div>
                                  </div>
                                  <div className="flex space-x-2">
                                    <Button size="sm" onClick={exportUserSummary}>
                                      <Download className="h-4 w-4 mr-1" />
                                      Export
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div className="text-center py-4">Click to load user summary</div>
                              )}
                            </PopoverContent>
                          </Popover>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{pickup.product_name}</div>
                          <div className="text-sm text-gray-500">{pickup.model}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {pickup.quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(pickup.pickup_date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {pickup.deadline ? formatDate(pickup.deadline) : '—'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(pickup.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {timer ? (
                            <span className={timer.color}>{timer.text}</span>
                          ) : (
                            <span className="text-gray-500">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {pickup.status === 'return_pending' && (
                            <Button
                              size="sm"
                              onClick={() => handleConfirmReturn(pickup.id)}
                              disabled={processing === pickup.id}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              {processing === pickup.id ? (
                                <RefreshCw className="w-4 h-4 animate-spin" />
                              ) : (
                                <CheckCircle className="w-4 h-4" />
                              )}
                            </Button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} results
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <span className="text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      <AlertDialog
        open={alert.open}
        type={alert.type}
        title={alert.title}
        message={alert.message}
        confirmText={alert.confirmText}
        cancelText={alert.cancelText}
        onConfirm={alert.onConfirm}
        onCancel={alert.onCancel}
        showCancel={alert.showCancel}
        variant={alert.variant}
      />
    </div>
  )
}

export default MasterAdminStockPickups
