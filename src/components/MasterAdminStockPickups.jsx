import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, Clock, Package, User, Calendar, Search, Filter, RefreshCw } from 'lucide-react'
import api from '../api'
import { useAlert } from '../hooks/useAlert'
import AlertDialog from './AlertDialog'

const MasterAdminStockPickups = () => {
  const [stockPickups, setStockPickups] = useState([])
  const [filteredPickups, setFilteredPickups] = useState([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(null)
  const [now, setNow] = useState(Date.now())
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [roleFilter, setRoleFilter] = useState('all')
  const [showFilters, setShowFilters] = useState(false)
  
  const { alert, showSuccess, showError, hideAlert } = useAlert()

  // Live clock for countdown
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    loadStockPickups()
  }, [])

  // Filter pickups when search term or filters change
  useEffect(() => {
    filterPickups()
  }, [stockPickups, searchTerm, statusFilter, roleFilter])

  const loadStockPickups = async () => {
    try {
      setLoading(true)
      const response = await api.get('/stock/')
      if (response.data.data) {
        setStockPickups(response.data.data)
      }
    } catch (error) {
      console.error('Error loading stock pickups:', error)
      showError('Failed to load stock pickups', 'Error')
    } finally {
      setLoading(false)
    }
  }

  const filterPickups = () => {
    let filtered = stockPickups

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(pickup => 
        pickup.marketer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pickup.marketer_unique_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pickup.device_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pickup.device_model?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(pickup => pickup.status === statusFilter)
    }

    // Role filter (we'll need to add role to the API response)
    // For now, we'll filter by user type based on unique_id patterns
    if (roleFilter !== 'all') {
      filtered = filtered.filter(pickup => {
        const uid = pickup.marketer_unique_id || ''
        if (roleFilter === 'marketer') return uid.startsWith('DSR')
        if (roleFilter === 'admin') return uid.startsWith('ASM')
        if (roleFilter === 'superadmin') return uid.startsWith('RSM')
        return true
      })
    }

    setFilteredPickups(filtered)
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
      'Pending Return': { color: 'bg-orange-100 text-orange-800', icon: Clock },
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
                <option value="all">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Sold">Sold</option>
                <option value="Returned">Returned</option>
                <option value="Transferred">Transferred</option>
                <option value="Expired">Expired</option>
                <option value="Pending Return">Pending Return</option>
                <option value="Pending Transfer">Pending Transfer</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">User Role</label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Roles</option>
                <option value="marketer">Marketers</option>
                <option value="admin">Admins</option>
                <option value="superadmin">SuperAdmins</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{stockPickups.length}</div>
            <div className="text-sm text-gray-600">Total Pickups</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">
              {stockPickups.filter(p => p.status === 'Pending').length}
            </div>
            <div className="text-sm text-gray-600">Pending</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {stockPickups.filter(p => p.status === 'Sold').length}
            </div>
            <div className="text-sm text-gray-600">Sold</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">
              {stockPickups.filter(p => p.status === 'Expired').length}
            </div>
            <div className="text-sm text-gray-600">Expired</div>
          </CardContent>
        </Card>
      </div>

      {/* Stock Pickups List */}
      {filteredPickups.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Stock Pickups Found</h3>
            <p className="text-gray-600">
              {searchTerm || statusFilter !== 'all' || roleFilter !== 'all' 
                ? 'Try adjusting your search or filters.' 
                : 'No stock pickups have been created yet.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredPickups.map((pickup) => {
            // Only show timer if status is not completed (sold, returned, transferred)
            const timer = pickup.deadline && !['sold', 'returned', 'transferred'].includes(pickup.status) ? formatCountdown(pickup.deadline) : null
            const role = getRoleFromUniqueId(pickup.marketer_unique_id)
            
            return (
              <Card key={pickup.id} className="border-l-4 border-l-blue-500">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Package className="h-5 w-5 text-gray-500" />
                      <div>
                        <CardTitle className="text-lg">
                          {pickup.device_name} - {pickup.device_model}
                        </CardTitle>
                        <CardDescription>
                          Pickup ID: {pickup.id} | Quantity: {pickup.quantity} | {pickup.dealer_name} ({pickup.dealer_location})
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(pickup.status)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">{pickup.marketer_name}</div>
                        <div className="text-xs text-gray-500">{pickup.marketer_unique_id} ({role})</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <div>
                        <div className="text-sm text-gray-600">Pickup: {formatDate(pickup.pickup_date)}</div>
                        {pickup.deadline && (
                          <div className="text-xs text-gray-500">Deadline: {formatDate(pickup.deadline)}</div>
                        )}
                      </div>
                    </div>
                    {timer && (
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <div className={`text-sm font-medium ${timer.color}`}>
                          {timer.text}
                        </div>
                      </div>
                    )}
                  </div>

                  {pickup.transfer_to_name && (
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-700">
                        <strong>Transfer to:</strong> {pickup.transfer_to_name} ({pickup.transfer_to_uid})
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
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
