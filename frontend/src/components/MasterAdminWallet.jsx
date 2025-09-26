// src/components/MasterAdminWallet.jsx

import React, { useEffect, useState } from 'react'
import { Wallet, CreditCard, RefreshCw, ChevronDown, Users, TrendingUp, AlertCircle, CheckCircle, XCircle, Clock, History, Eye, EyeOff, ChevronUp, ArrowUpCircle, Package, User, Calendar } from 'lucide-react'
import walletApi from '../api/walletApi'  // baseURL = VITE_API_URL + '/api/wallets'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Separator } from './ui/separator'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from './ui/pagination'
import UserSummaryPopover from './UserSummaryPopover'

const TABS = [
  { key: 'marketers',   label: "Marketers' Wallets",   endpoint: '/master-admin/marketers'  },
  { key: 'admins',      label: "Admins' Wallets",      endpoint: '/master-admin/admins'      },
  { key: 'superadmins', label: "SuperAdmins' Wallets", endpoint: '/master-admin/superadmins' }
]

export default function MasterAdminWallet() {
  // ── Summary & Pending ────────────────────────────────────────
  const [wallets,  setWallets]  = useState([])
  const [pending,  setPending]  = useState([])
  const [feeStats, setFeeStats] = useState({ daily: 0, weekly: 0, monthly: 0, yearly: 0 })
  const [feeHistory, setFeeHistory] = useState([])
  const [feeHistoryLoading, setFeeHistoryLoading] = useState(false)

  // ── Pending Withheld Releases ─────────────────────────────────
  const [withheldReqs, setWithheldReqs]       = useState([])  // "manual" / pending requests
  const [withheldLoading, setWithheldLoading] = useState(true)
  const [withheldError, setWithheldError]     = useState(null)

  // ── RELEASE HISTORY (NEW) ────────────────────────────────────
  const [releaseHistory, setReleaseHistory] = useState([])    // ← NEW: holds approved/rejected
  const [historyLoading, setHistoryLoading] = useState(true)
  const [historyError, setHistoryError]     = useState(null)

  // ── Withdrawal History ───────────────────────────────────────
  const [history,  setHistory]  = useState([])
  const [filters,  setFilters]  = useState({ startDate:'', endDate:'', name:'', role:'' })

  // ── Loading / Error States ───────────────────────────────────
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState(null)

  const [histLoading, setHistLoading] = useState(false)
  const [histError,   setHistError]   = useState(null)

  // ── Tabs ──────────────────────────────────────────────────────
  const [activeTab,  setActiveTab] = useState('overview')
  const [tabData,    setTabData]   = useState({})
  const [tabLoading, setTabLoading]= useState(true)
  const [tabError,   setTabError]  = useState(null)

  // ── Single-click guard for approve/reject ────────────────────
  const [actioning, setActioning] = useState(false)

  // ── UI State for Modernized Design ────────────────────────────
  const [showDetailedBreakdown, setShowDetailedBreakdown] = useState(false)
  const [showFeeHistory, setShowFeeHistory] = useState(false)
  const [showWithheldReleases, setShowWithheldReleases] = useState(false)
  const [showReleaseHistory, setShowReleaseHistory] = useState(false)

  // ── Pagination states ────────────────────────────────────────
  const [pendingPage, setPendingPage] = useState(1)
  const [withheldPage, setWithheldPage] = useState(1)
  const [historyPage, setHistoryPage] = useState(1)
  const [walletsPage, setWalletsPage] = useState(1)
  const [withdrawalHistoryPage, setWithdrawalHistoryPage] = useState(1)
  const itemsPerPage = 10

  // ── loadAll: summary + pending cashouts + withheld releases ────
  const loadAll = async () => {
    setLoading(true)
    try {
      const [summaryRes, pendingRes, withheldRes, releaseRes] = await Promise.all([
        walletApi.get('/master-admin/summary'),
        walletApi.get('/master-admin/pending'),
        walletApi.get('/master-admin/withheld-releases'),
        walletApi.get('/master-admin/release-history')
      ])

      setWallets(summaryRes.data.wallets || [])
      setPending(pendingRes.data.pending || [])
      setWithheldReqs(withheldRes.data.requests || [])
      setReleaseHistory(releaseRes.data.history || [])
      setFeeStats(summaryRes.data.feeStats || { daily: 0, weekly: 0, monthly: 0, yearly: 0 })
    } catch (e) {
      console.error('Error loading MasterAdmin wallet data:', e)
      setError('Failed to load wallet data')
    } finally {
      setLoading(false)
      setWithheldLoading(false)
      setHistoryLoading(false)
    }
  }

  // ── loadFeeHistory: N100 charges with user details ───────────
  const loadFeeHistory = async () => {
    setFeeHistoryLoading(true)
    try {
      const response = await walletApi.get('/master-admin/fee-history')
      setFeeHistory(response.data.feeHistory || [])
    } catch (e) {
      console.error('Error loading fee history:', e)
    } finally {
      setFeeHistoryLoading(false)
    }
  }

  // ── loadTabData: load wallets for specific role ──────────────
  const loadTabData = async (tabKey) => {
    setTabLoading(true)
    setTabError(null)
    try {
      const endpoint = TABS.find(t => t.key === tabKey)?.endpoint
      if (!endpoint) return

      const response = await walletApi.get(endpoint)
      setTabData(prev => ({ ...prev, [tabKey]: response.data }))
    } catch (e) {
      console.error(`Error loading ${tabKey} data:`, e)
      setTabError(`Failed to load ${tabKey} data`)
    } finally {
      setTabLoading(false)
    }
  }

  // ── loadHistory: withdrawal history with filters ──────────────
  const fetchHistory = async (filters) => {
    setHistLoading(true)
    setHistError(null)
    try {
      const params = new URLSearchParams()
      if (filters.startDate) params.append('startDate', filters.startDate)
      if (filters.endDate) params.append('endDate', filters.endDate)
      if (filters.name) params.append('name', filters.name)
      if (filters.role) params.append('role', filters.role)

      const response = await walletApi.get(`/master-admin/withdrawal-history?${params}`)
      setHistory(response.data.history || [])
    } catch (e) {
      console.error('Error loading withdrawal history:', e)
      setHistError('Failed to load withdrawal history')
    } finally {
      setHistLoading(false)
    }
  }

  // ── handlers for approve/reject ──────────────────────────────
  const handleRelease = async (userUniqueId, action) => {
    if (actioning) return
    setActioning(true)
    try {
      await walletApi.patch(`/master-admin/pending/${userUniqueId}/${action}`)
      alert(`Withdrawal ${action}d successfully!`)
      loadAll()
    } catch (e) {
      console.error(`Error ${action}ing withdrawal:`, e)
      alert(`Error: ${e.response?.data?.message || e.message}`)
    } finally {
      setActioning(false)
    }
  }

  // ── handlers for withheld releases ────────────────────────────
  const handleApproveWithheldRelease = async (userUniqueId) => {
    try {
      const response = await walletApi.patch(`/master-admin/marketers/${userUniqueId}/withheld/approve`);
      console.log('Withheld release approved:', response.data);
      alert('Withheld amount released successfully!');
      loadAll();
    } catch (error) {
      console.error('Error approving withheld release:', error);
      alert(`Error: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleRejectWithheldRelease = async (userUniqueId) => {
    try {
      const response = await walletApi.patch(`/master-admin/marketers/${userUniqueId}/withheld/reject`);
      console.log('Withheld release rejected:', response.data);
      alert('Withheld amount rejected successfully!');
      loadAll();
    } catch (error) {
      console.error('Error rejecting withheld release:', error);
      alert(`Error: ${error.response?.data?.message || error.message}`);
    }
  };

  // ── handlers for history filters ────────────────────────────
  const handleDateChange = e => {
    const next = { ...filters, [e.target.name]: e.target.value }
    setFilters(next)
    fetchHistory(next)
  }
  const handleNameChange = e => {
    setFilters(f => ({ ...f, name: e.target.value }))
  }
  const handleRoleChange = e => {
    const next = { ...filters, role: e.target.value }
    setFilters(next)
    fetchHistory(next)
  }

  // ── UserSummaryPopover action handler ────────────────────────
  const handlePopoverAction = (action, userData) => {
    switch (action) {
      case 'view_full':
        console.log('View full profile for:', userData);
        alert(`Opening full profile for ${userData.name} (${userData.unique_id})`);
        break;
      case 'send_message':
        console.log('Send message to:', userData);
        const contactInfo = userData.phone ? `Phone: ${userData.phone}` : 'No phone number available';
        alert(`Send message to ${userData.name} (${userData.unique_id})\n${contactInfo}\n\nNote: Messaging functionality will be implemented in a future update.`);
        break;
      case 'approve_withdrawal':
        console.log('Approve withdrawal for:', userData);
        if (confirm(`Approve withdrawal for ${userData.name}?`)) {
          handleRelease(userData.unique_id, 'approve');
        }
        break;
      case 'reject_withdrawal':
        console.log('Reject withdrawal for:', userData);
        if (confirm(`Reject withdrawal for ${userData.name}?`)) {
          handleRelease(userData.unique_id, 'reject');
        }
        break;
      case 'approve_withheld':
        console.log('Approve withheld release for:', userData);
        if (confirm(`Release withheld amount of ${userData.amount ? `₦${Number(userData.amount).toLocaleString()}` : 'amount'} for ${userData.userUniqueId}?`)) {
          handleApproveWithheldRelease(userData.userUniqueId);
        }
        break;
      case 'reject_withheld':
        console.log('Reject withheld release for:', userData);
        if (confirm(`Reject withheld amount of ${userData.amount ? `₦${Number(userData.amount).toLocaleString()}` : 'amount'} for ${userData.userUniqueId}?`)) {
          handleRejectWithheldRelease(userData.userUniqueId);
        }
        break;
      case 'withheld_releases':
        console.log('Manage withheld releases for:', userData);
        alert(`Opening withheld releases management for ${userData.name} (${userData.unique_id})`);
        break;
      case 'withdrawal_requests':
        console.log('Manage withdrawal requests for:', userData);
        alert(`Opening withdrawal requests management for ${userData.name} (${userData.unique_id})`);
        break;
      default:
        console.log('Unknown action:', action, userData);
    }
  }

  // ── Effects ──────────────────────────────────────────────────
  useEffect(() => { loadAll() }, [])
  useEffect(() => { loadFeeHistory() }, [])
  useEffect(() => { fetchHistory(filters) }, [])
  useEffect(() => { 
    if (activeTab !== 'overview') {
      loadTabData(activeTab)
    }
  }, [activeTab])

  if (loading) return <p className="p-6 text-muted-foreground">Loading…</p>
  if (error)   return <p className="p-6 text-red-600">{error}</p>

  // Calculate summary stats
  const total     = wallets.reduce((sum, w) => sum + Number(w.total_balance||0), 0)
  const available = wallets.reduce((sum, w) => sum + Number(w.available_balance||0), 0)
  const withheld  = wallets.reduce((sum, w) => sum + Number(w.withheld_balance||0), 0)
  const pendSum   = pending
    .filter(r => r.status==='pending')
    .reduce((sum, r) => sum + Number(r.net_amount||0), 0)

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Master Admin Wallet</h1>
          <p className="text-gray-600 mt-2">Manage all user wallets and system fees</p>
        </div>

        {/* Quick Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Balance</p>
                <p className="text-2xl font-bold text-gray-900">₦{total.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Wallet className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Available</p>
                <p className="text-2xl font-bold text-gray-900">₦{available.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Withheld</p>
                <p className="text-2xl font-bold text-gray-900">₦{withheld.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <AlertCircle className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">₦{pendSum.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Modern Tabbed Interface */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-6">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Wallet className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="marketers" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Marketers
            </TabsTrigger>
            <TabsTrigger value="admins" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Admins
            </TabsTrigger>
            <TabsTrigger value="superadmins" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              SuperAdmins
            </TabsTrigger>
            <TabsTrigger value="fees" className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Fees
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {pending.slice(0, 5).map((item, index) => (
                    <div key={item.id || index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-full">
                          <ArrowUpCircle className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Withdrawal Request</p>
                          <p className="text-xs text-gray-500">{item.user_name} ({item.user_unique_id})</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">₦{Number(item.net_amount).toLocaleString()}</p>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          item.status === 'approved' 
                            ? 'bg-green-100 text-green-800'
                            : item.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {item.status}
                        </span>
                      </div>
                    </div>
                  ))}
                  {pending.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>No recent activity</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* System Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">System Overview</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Users</span>
                    <span className="font-medium">{wallets.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Pending Requests</span>
                    <span className="font-medium">{pending.filter(p => p.status === 'pending').length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Withheld Requests</span>
                    <span className="font-medium">{withheldReqs.length}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Fee Collection</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Today</span>
                    <span className="font-medium">₦{feeStats.daily.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">This Month</span>
                    <span className="font-medium">₦{feeStats.monthly.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">This Year</span>
                    <span className="font-medium">₦{feeStats.yearly.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Marketers Tab */}
          <TabsContent value="marketers" className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Marketers' Wallets</h3>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Available</TableHead>
                      <TableHead>Withheld</TableHead>
                      <TableHead>Last Activity</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tabLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          <RefreshCw className="w-6 h-6 mx-auto mb-2 animate-spin" />
                          Loading...
                        </TableCell>
                      </TableRow>
                    ) : (tabData.marketers?.wallets || []).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                          <User className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                          <p>No marketers found</p>
                        </TableCell>
                      </TableRow>
                    ) : (tabData.marketers?.wallets || []).map(w => (
                      <TableRow key={w.user_unique_id} className="hover:bg-gray-50">
                        <TableCell className="font-medium">{w.user_unique_id}</TableCell>
                        <TableCell>{w.user_name}</TableCell>
                        <TableCell>₦{w.total_balance.toLocaleString()}</TableCell>
                        <TableCell className="text-green-600">₦{w.available_balance.toLocaleString()}</TableCell>
                        <TableCell className="text-orange-600">₦{w.withheld_balance.toLocaleString()}</TableCell>
                        <TableCell>
                          {w.last_commission_date
                            ? new Date(w.last_commission_date).toLocaleDateString()
                            : '—'
                          }
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>

          {/* Admins Tab */}
          <TabsContent value="admins" className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Admins' Wallets</h3>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Available</TableHead>
                      <TableHead>Withheld</TableHead>
                      <TableHead>Last Activity</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tabLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          <RefreshCw className="w-6 h-6 mx-auto mb-2 animate-spin" />
                          Loading...
                        </TableCell>
                      </TableRow>
                    ) : (tabData.admins?.wallets || []).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                          <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                          <p>No admins found</p>
                        </TableCell>
                      </TableRow>
                    ) : (tabData.admins?.wallets || []).map(w => (
                      <TableRow key={w.user_unique_id} className="hover:bg-gray-50">
                        <TableCell className="font-medium">{w.user_unique_id}</TableCell>
                        <TableCell>{w.user_name}</TableCell>
                        <TableCell>₦{w.total_balance.toLocaleString()}</TableCell>
                        <TableCell className="text-green-600">₦{w.available_balance.toLocaleString()}</TableCell>
                        <TableCell className="text-orange-600">₦{w.withheld_balance.toLocaleString()}</TableCell>
                        <TableCell>
                          {w.last_commission_date
                            ? new Date(w.last_commission_date).toLocaleDateString()
                            : '—'
                          }
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>

          {/* SuperAdmins Tab */}
          <TabsContent value="superadmins" className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">SuperAdmins' Wallets</h3>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Available</TableHead>
                      <TableHead>Withheld</TableHead>
                      <TableHead>Last Activity</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tabLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          <RefreshCw className="w-6 h-6 mx-auto mb-2 animate-spin" />
                          Loading...
                        </TableCell>
                      </TableRow>
                    ) : (tabData.superadmins?.wallets || []).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                          <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                          <p>No superadmins found</p>
                        </TableCell>
                      </TableRow>
                    ) : (tabData.superadmins?.wallets || []).map(w => (
                      <TableRow key={w.user_unique_id} className="hover:bg-gray-50">
                        <TableCell className="font-medium">{w.user_unique_id}</TableCell>
                        <TableCell>{w.user_name}</TableCell>
                        <TableCell>₦{w.total_balance.toLocaleString()}</TableCell>
                        <TableCell className="text-green-600">₦{w.available_balance.toLocaleString()}</TableCell>
                        <TableCell className="text-orange-600">₦{w.withheld_balance.toLocaleString()}</TableCell>
                        <TableCell>
                          {w.last_commission_date
                            ? new Date(w.last_commission_date).toLocaleDateString()
                            : '—'
                          }
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>

          {/* Fees Tab */}
          <TabsContent value="fees" className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">N100 Charges History</h3>
                  <Button variant="outline" size="sm" onClick={loadFeeHistory} disabled={feeHistoryLoading}>
                    <RefreshCw className={`w-4 h-4 mr-2 ${feeHistoryLoading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>
              </div>
              <div className="p-6">
                {feeHistoryLoading ? (
                  <div className="text-center py-8 text-gray-500">
                    <RefreshCw className="w-8 h-8 mx-auto mb-3 animate-spin" />
                    <p>Loading fee history...</p>
                  </div>
                ) : feeHistory.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <CreditCard className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-lg font-medium">No fee history available</p>
                    <p className="text-sm">Withdrawal fees will appear here once processed</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>User Name</TableHead>
                          <TableHead>User ID</TableHead>
                          <TableHead>Location</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Fee (N100)</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {feeHistory.slice(0, 10).map((withdrawal, index) => (
                          <TableRow key={index} className="hover:bg-gray-50">
                            <TableCell className="text-sm">
                              {new Date(withdrawal.date).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-sm font-medium">
                              <UserSummaryPopover
                                userUniqueId={withdrawal.unique_id}
                                userName={withdrawal.name}
                                userRole={withdrawal.role}
                                onAction={(action, data) => handlePopoverAction(action, data)}
                              >
                                <span className="text-blue-600 hover:text-blue-800 cursor-pointer hover:underline">
                                  {withdrawal.name || 'N/A'}
                                </span>
                              </UserSummaryPopover>
                            </TableCell>
                            <TableCell className="text-sm text-gray-500">
                              <UserSummaryPopover
                                userUniqueId={withdrawal.unique_id}
                                userName={withdrawal.name}
                                userRole={withdrawal.role}
                                onAction={(action, data) => handlePopoverAction(action, data)}
                              >
                                <span className="text-blue-600 hover:text-blue-800 cursor-pointer hover:underline font-mono">
                                  {withdrawal.unique_id || 'N/A'}
                                </span>
                              </UserSummaryPopover>
                            </TableCell>
                            <TableCell className="text-sm">
                              {withdrawal.location || 'N/A'}
                            </TableCell>
                            <TableCell className="text-sm">
                              ₦{withdrawal.amount?.toLocaleString() || '0'}
                            </TableCell>
                            <TableCell className="text-sm font-bold text-purple-900">
                              ₦{withdrawal.fee?.toLocaleString() || '100'}
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant={withdrawal.status === 'approved' ? 'default' : 'secondary'}
                                className="text-xs"
                              >
                                {withdrawal.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}