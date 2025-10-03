// src/components/MasterAdminWallet.jsx

import React, { useEffect, useState } from 'react'
import { Wallet, CreditCard, RefreshCw, ChevronDown, Users, TrendingUp, AlertCircle, CheckCircle, XCircle, Clock, History, Eye, EyeOff, ChevronUp, ArrowUpCircle, Package, User, Calendar } from 'lucide-react'
import walletApi from '../api/walletApi'  // baseURL = VITE_API_URL + '/api/wallets'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Input } from './ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Separator } from './ui/separator'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from './ui/pagination'
import UserSummaryPopover from './UserSummaryPopover'
import AlertDialog, { Alert } from './ui/alert-dialog'

const TABS = [
  { key: 'marketers',   label: "Marketers' Wallets",   endpoint: '/master-admin/marketers'  },
  { key: 'admins',      label: "Admins' Wallets",      endpoint: '/master-admin/admins'      },
  { key: 'superadmins', label: "SuperAdmins' Wallets", endpoint: '/master-admin/superadmins' }
]

export default function MasterAdminWallet() {
  // ── Access Code Protection ────────────────────────────────────
  const [unlocked, setUnlocked] = useState(false)
  const [accessCode, setAccessCode] = useState('')
  const [unlockError, setUnlockError] = useState(null)
  const [unlockLoading, setUnlockLoading] = useState(false)

  // ── Summary & Pending ────────────────────────────────────────
  const [wallets,  setWallets]  = useState([])
  const [pending,  setPending]  = useState([])
  const [feeStats, setFeeStats] = useState({ daily: 0, weekly: 0, monthly: 0, yearly: 0 })
  const [feeHistory, setFeeHistory] = useState([])
  const [feeHistoryLoading, setFeeHistoryLoading] = useState(false)
  const [balanceBreakdown, setBalanceBreakdown] = useState({
    marketers: { total: 0, available: 0, withheld: 0, count: 0 },
    admins: { total: 0, available: 0, withheld: 0, count: 0 },
    superadmins: { total: 0, available: 0, withheld: 0, count: 0 }
  })

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

  // ── Alert Dialog States ────────────────────────────────────────
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    type: 'info',
    title: '',
    message: '',
    variant: 'default',
    onConfirm: () => {},
  })
  const [successAlert, setSuccessAlert] = useState(null)
  const [errorAlert, setErrorAlert] = useState(null)

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
  const itemsPerPage = 5  // Changed to 5 for pending cashouts
  const withheldItemsPerPage = 10

  // ── Search/Filter states ────────────────────────────────────
  const [withheldSearchTerm, setWithheldSearchTerm] = useState('')
  const [pendingSearchTerm, setPendingSearchTerm] = useState('')
  const [historySearchTerm, setHistorySearchTerm] = useState('')

  // ── Access Code Handler ────────────────────────────────────────
  const handleUnlock = async (e) => {
    e.preventDefault()
    setUnlockError(null)
    setUnlockLoading(true)
    try {
      await walletApi.post('/master-admin/unlock', { code: accessCode })
      setUnlocked(true)
    } catch (err) {
      if (err.response?.status === 401) {
        setUnlockError('Incorrect access code.')
      } else {
        setUnlockError('Server error. Please try again.')
      }
    } finally {
      setUnlockLoading(false)
    }
  }

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

      // Backend summary returns totals, not per-user wallets. Create a synthetic row
      // so existing UI that reduces over wallets still works.
      const s = summaryRes.data || {}
      setWallets([{ 
        total_balance: Number(s.totalBalance || 0),
        available_balance: Number(s.availableBalance || 0),
        withheld_balance: Number(s.withheldBalance || 0)
      }])

      // Parse breakdown by role
      const breakdown = (s.breakdown || []).reduce((acc, item) => {
        const key = item.role.toLowerCase() + 's'
        acc[key] = {
          total: Number(item.totalBalance || 0),
          available: Number(item.availableBalance || 0),
          withheld: Number(item.withheldBalance || 0),
          count: Number(item.userCount || 0)
        }
        return acc
      }, {
        marketers: { total: 0, available: 0, withheld: 0, count: 0 },
        admins: { total: 0, available: 0, withheld: 0, count: 0 },
        superadmins: { total: 0, available: 0, withheld: 0, count: 0 }
      })
      setBalanceBreakdown(breakdown)

      // Pending endpoint returns { pending: [{ amount, status, createdAt, user_unique_id }]}.
      // Map to include net_amount for legacy render and keep original fields.
      const pendingItems = (pendingRes.data?.pending || []).map(p => ({
        ...p,
        net_amount: Number(p.amount || 0)
      }))
      setPending(pendingItems)

      // Withheld releases endpoint returns { withheld: [...] }
      setWithheldReqs(withheldRes.data?.withheld || [])

      // Release history endpoint returns { releases: [...] }
      setReleaseHistory(releaseRes.data?.releases || [])

      // Fee stats are not part of summary; keep defaults for now
      setFeeStats({ daily: 0, weekly: 0, monthly: Number(s.monthlyEarnings || 0), yearly: 0 })
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
      // Backend returns { fees: [...] }
      setFeeHistory(response.data.fees || [])
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
      // Backend returns { withdrawals: [...] }
      setHistory(response.data.withdrawals || [])
    } catch (e) {
      console.error('Error loading withdrawal history:', e)
      setHistError('Failed to load withdrawal history')
    } finally {
      setHistLoading(false)
    }
  }

  // ── handlers for approve/reject ──────────────────────────────
  const handleRelease = async (requestId, action) => {
    if (actioning) return
    setActioning(true)
    setConfirmDialog({ ...confirmDialog, open: false })
    try {
      await walletApi.patch(`/master-admin/requests/${requestId}`, { action })
      setSuccessAlert(`Withdrawal ${action}d successfully!`)
      setTimeout(() => setSuccessAlert(null), 3000)
      loadAll()
    } catch (e) {
      console.error(`Error ${action}ing withdrawal:`, e)
      setErrorAlert(e.response?.data?.message || e.message)
      setTimeout(() => setErrorAlert(null), 5000)
    } finally {
      setActioning(false)
    }
  }

  // ── handlers for withheld releases ────────────────────────────
  const handleApproveWithheldRelease = async (userUniqueId) => {
    setConfirmDialog({ ...confirmDialog, open: false })
    try {
      const response = await walletApi.patch(`/master-admin/marketers/${userUniqueId}/withheld/approve`);
      console.log('Withheld release approved:', response.data);
      setSuccessAlert('Withheld amount released successfully!')
      setTimeout(() => setSuccessAlert(null), 3000)
      loadAll();
    } catch (error) {
      console.error('Error approving withheld release:', error);
      setErrorAlert(error.response?.data?.message || error.message)
      setTimeout(() => setErrorAlert(null), 5000)
    }
  };

  const handleRejectWithheldRelease = async (userUniqueId) => {
    setConfirmDialog({ ...confirmDialog, open: false })
    try {
      const response = await walletApi.patch(`/master-admin/marketers/${userUniqueId}/withheld/reject`);
      console.log('Withheld release rejected:', response.data);
      setSuccessAlert('Withheld amount rejected successfully!')
      setTimeout(() => setSuccessAlert(null), 3000)
      loadAll();
    } catch (error) {
      console.error('Error rejecting withheld release:', error);
      setErrorAlert(error.response?.data?.message || error.message)
      setTimeout(() => setErrorAlert(null), 5000)
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
        setSuccessAlert(`Opening full profile for ${userData.name} (${userData.unique_id})`)
        setTimeout(() => setSuccessAlert(null), 3000)
        break;
      case 'send_message':
        console.log('Send message to:', userData);
        const contactInfo = userData.phone ? `Phone: ${userData.phone}` : 'No phone number available';
        setConfirmDialog({
          open: true,
          type: 'info',
          title: `Send Message to ${userData.name}`,
          message: `${contactInfo}\n\nNote: Messaging functionality will be implemented in a future update.`,
          variant: 'default',
          confirmText: 'OK',
          showCancel: false,
          onConfirm: () => setConfirmDialog({ ...confirmDialog, open: false }),
          onCancel: () => setConfirmDialog({ ...confirmDialog, open: false }),
        });
        break;
      case 'approve_withdrawal':
        console.log('Approve withdrawal for:', userData);
        setConfirmDialog({
          open: true,
          type: 'success',
          title: 'Approve Withdrawal',
          message: `Approve withdrawal for ${userData.name}?`,
          variant: 'success',
          confirmText: 'Approve',
          onConfirm: () => handleRelease(userData.requestId || userData.id, 'approve'),
          onCancel: () => setConfirmDialog({ ...confirmDialog, open: false }),
        });
        break;
      case 'reject_withdrawal':
        console.log('Reject withdrawal for:', userData);
        setConfirmDialog({
          open: true,
          type: 'warning',
          title: 'Reject Withdrawal',
          message: `Reject withdrawal for ${userData.name}?`,
          variant: 'destructive',
          confirmText: 'Reject',
          onConfirm: () => handleRelease(userData.requestId || userData.id, 'reject'),
          onCancel: () => setConfirmDialog({ ...confirmDialog, open: false }),
        });
        break;
      case 'approve_withheld':
        console.log('Approve withheld release for:', userData);
        setConfirmDialog({
          open: true,
          type: 'success',
          title: 'Release Withheld Amount',
          message: `Release withheld amount of ${userData.amount ? `₦${Number(userData.amount).toLocaleString()}` : 'amount'} for ${userData.userUniqueId}?`,
          variant: 'success',
          confirmText: 'Release',
          onConfirm: () => handleApproveWithheldRelease(userData.userUniqueId),
          onCancel: () => setConfirmDialog({ ...confirmDialog, open: false }),
        });
        break;
      case 'reject_withheld':
        console.log('Reject withheld release for:', userData);
        setConfirmDialog({
          open: true,
          type: 'warning',
          title: 'Reject Withheld Release',
          message: `Reject withheld amount of ${userData.amount ? `₦${Number(userData.amount).toLocaleString()}` : 'amount'} for ${userData.userUniqueId}?`,
          variant: 'destructive',
          confirmText: 'Reject',
          onConfirm: () => handleRejectWithheldRelease(userData.userUniqueId),
          onCancel: () => setConfirmDialog({ ...confirmDialog, open: false }),
        });
        break;
      case 'withheld_releases':
        console.log('Manage withheld releases for:', userData);
        setSuccessAlert(`Opening withheld releases management for ${userData.name} (${userData.unique_id})`)
        setTimeout(() => setSuccessAlert(null), 3000)
        break;
      case 'withdrawal_requests':
        console.log('Manage withdrawal requests for:', userData);
        setSuccessAlert(`Opening withdrawal requests management for ${userData.name} (${userData.unique_id})`)
        setTimeout(() => setSuccessAlert(null), 3000)
        break;
      default:
        console.log('Unknown action:', action, userData);
    }
  }

  // ── Effects ──────────────────────────────────────────────────
  useEffect(() => { 
    if (unlocked) {
      loadAll()
      loadFeeHistory()
      fetchHistory(filters)
    }
  }, [unlocked])
  
  useEffect(() => { 
    if (activeTab !== 'overview' && unlocked) {
      loadTabData(activeTab)
    }
  }, [activeTab, unlocked])

  // ── Access Code Screen ────────────────────────────────────────
  if (!unlocked) {
    return (
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="min-h-[60vh] flex items-center justify-center">
            <div className="max-w-md w-full">
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                    <Wallet className="w-8 h-8 text-blue-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Master Admin Wallet</h2>
                  <p className="text-gray-600">Enter access code to continue</p>
                </div>
                
                <form onSubmit={handleUnlock} className="space-y-4">
                  <div>
                    <label htmlFor="accessCode" className="block text-sm font-medium text-gray-700 mb-2">
                      Access Code
                    </label>
                    <Input
                      id="accessCode"
                      type="password"
                      value={accessCode}
                      onChange={(e) => setAccessCode(e.target.value)}
                      placeholder="Enter access code"
                      className="w-full"
                      disabled={unlockLoading}
                      autoFocus
                    />
                  </div>
                  
                  {unlockError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-800">{unlockError}</p>
                    </div>
                  )}
                  
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={unlockLoading || !accessCode.trim()}
                  >
                    {unlockLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Unlock Wallet
                      </>
                    )}
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Total Balance with Breakdown - Full Width */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 md:col-span-3">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-full flex-shrink-0">
                  <Wallet className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Balance</p>
                  <p className="text-3xl font-bold text-gray-900">₦{total.toLocaleString()}</p>
                </div>
              </div>
            </div>
            
            <div className="pt-6 border-t border-gray-200">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-4">Breakdown by Role</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-100">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <User className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-0.5">Marketers</p>
                      <p className="text-sm font-bold text-gray-900">₦{(balanceBreakdown.marketers.total / 1000000).toFixed(1)}M</p>
                      <p className="text-xs text-gray-500">{balanceBreakdown.marketers.count} users</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Users className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-0.5">Admins</p>
                      <p className="text-sm font-bold text-gray-900">₦{(balanceBreakdown.admins.total / 1000000).toFixed(1)}M</p>
                      <p className="text-xs text-gray-500">{balanceBreakdown.admins.count} users</p>
                    </div>
                  </div>
      </div>

                <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg border border-purple-100">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Package className="w-5 h-5 text-purple-600" />
                    </div>
            <div>
                      <p className="text-xs text-gray-600 mb-0.5">SuperAdmins</p>
                      <p className="text-sm font-bold text-gray-900">₦{(balanceBreakdown.superadmins.total / 1000000).toFixed(1)}M</p>
                      <p className="text-xs text-gray-500">{balanceBreakdown.superadmins.count} users</p>
            </div>
          </div>
                </div>
              </div>
            </div>
        </div>
        
          {/* Available */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 rounded-full">
                <TrendingUp className="w-6 h-6 text-green-600" />
          </div>
          </div>
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Available</p>
              <p className="text-2xl font-bold text-gray-900">
                ₦{available.toLocaleString()}
              </p>
          </div>
      </div>

          {/* Withheld */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-orange-100 rounded-full">
                <AlertCircle className="w-6 h-6 text-orange-600" />
              </div>
            </div>
                <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Withheld</p>
              <p className="text-2xl font-bold text-gray-900">
                ₦{withheld.toLocaleString()}
              </p>
                </div>
              </div>

          {/* Pending */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-yellow-100 rounded-full">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Pending</p>
              <p className="text-2xl font-bold text-gray-900">
                ₦{pendSum.toLocaleString()}
              </p>
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
            {/* Pending Cashout Requests - Enhanced */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Pending Cashout Requests ({pending.filter(p => 
                      p.status === 'pending' &&
                      (p.user_name.toLowerCase().includes(pendingSearchTerm.toLowerCase()) ||
                       p.user_unique_id.toLowerCase().includes(pendingSearchTerm.toLowerCase()))
                    ).length} total)
                  </h3>
                  <Input
                    placeholder="Search by name or ID..."
                    value={pendingSearchTerm}
                    onChange={(e) => {
                      setPendingSearchTerm(e.target.value)
                      setPendingPage(1) // Reset to first page on search
                    }}
                    className="max-w-xs"
                  />
                </div>
              </div>
              <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="font-semibold">User</TableHead>
                      <TableHead className="font-semibold">Bank Details</TableHead>
                      <TableHead className="font-semibold">Amount</TableHead>
                      <TableHead className="font-semibold">Date</TableHead>
                      <TableHead className="font-semibold text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                     <TableBody>
                    {pending.filter(p => 
                      p.status === 'pending' &&
                      (p.user_name.toLowerCase().includes(pendingSearchTerm.toLowerCase()) ||
                       p.user_unique_id.toLowerCase().includes(pendingSearchTerm.toLowerCase()))
                    ).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-12 text-gray-500">
                          <Clock className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                          <p className="text-lg font-medium text-gray-700">
                            {pendingSearchTerm ? 'No results found' : 'No pending cashout requests'}
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            {pendingSearchTerm ? 'Try a different search term' : 'All withdrawal requests have been processed'}
                          </p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      pending
                        .filter(p => 
                          p.status === 'pending' &&
                          (p.user_name.toLowerCase().includes(pendingSearchTerm.toLowerCase()) ||
                           p.user_unique_id.toLowerCase().includes(pendingSearchTerm.toLowerCase()))
                        )
                        .slice((pendingPage - 1) * itemsPerPage, pendingPage * itemsPerPage)
                        .map((item) => (
                          <TableRow key={item.id} className="hover:bg-gray-50 transition-colors border-b border-gray-100">
                            <TableCell className="py-6">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                  <User className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                              <UserSummaryPopover
                                    userUniqueId={item.user_unique_id}
                                    userName={item.user_name}
                                onAction={(action, data) => handlePopoverAction(action, data)}
                              >
                                    <span className="text-base font-medium text-gray-900 hover:text-blue-600 cursor-pointer hover:underline block">
                                      {item.user_name}
                                </span>
                              </UserSummaryPopover>
                                  <span className="text-xs text-gray-500 font-mono block">{item.user_unique_id}</span>
                                  {item.user_location && (
                                    <span className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                      <Calendar className="w-3 h-3" />
                                      {item.user_location}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="py-6">
                              <div className="space-y-1">
                                <div className="text-sm font-medium text-gray-900">
                                  {item.account_name || 'N/A'}
                                </div>
                                <div className="text-xs text-gray-600 font-mono">
                                  {item.account_number || 'N/A'}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {item.bank_name || 'N/A'}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="py-6">
                              <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg font-bold text-sm">
                                <TrendingUp className="w-4 h-4" />
                                ₦{Number(item.net_amount).toLocaleString()}
                              </span>
                            </TableCell>
                            <TableCell className="py-6 text-sm text-gray-600">
                              {new Date(item.requested_at).toLocaleDateString('en-NG', { 
                                day: '2-digit', 
                                month: 'short', 
                                year: 'numeric' 
                              })}
                            </TableCell>
                            <TableCell className="py-6 text-right">
                              <div className="flex gap-2 justify-end">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                                  onClick={() => {
                                    setConfirmDialog({
                                      open: true,
                                      type: 'warning',
                                      title: 'Reject Withdrawal',
                                      message: `Reject withdrawal of ₦${Number(item.net_amount).toLocaleString()} for ${item.user_name}?`,
                                      variant: 'destructive',
                                      confirmText: 'Reject',
                                      onConfirm: () => handleRelease(item.id, 'reject'),
                                      onCancel: () => setConfirmDialog({ ...confirmDialog, open: false }),
                                    })
                                  }}
                          disabled={actioning}
                                >
                                  <XCircle className="w-4 h-4 mr-1" />
                                  Reject
                                </Button>
                                <Button 
                                  size="sm" 
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                  onClick={() => {
                                    setConfirmDialog({
                                      open: true,
                                      type: 'success',
                                      title: 'Approve Withdrawal',
                                      message: `Approve withdrawal of ₦${Number(item.net_amount).toLocaleString()} for ${item.user_name}?`,
                                      variant: 'success',
                                      confirmText: 'Approve',
                                      onConfirm: () => handleRelease(item.id, 'approve'),
                                      onCancel: () => setConfirmDialog({ ...confirmDialog, open: false }),
                                    })
                                  }}
                                  disabled={actioning}
                                >
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Approve
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                    )}
                    </TableBody>
                  </Table>
              </div>
              {/* Pagination for Pending Cashouts - Simplified */}
              {pending.filter(p => 
                p.status === 'pending' &&
                (p.user_name.toLowerCase().includes(pendingSearchTerm.toLowerCase()) ||
                 p.user_unique_id.toLowerCase().includes(pendingSearchTerm.toLowerCase()))
              ).length > itemsPerPage && (
                <div className="px-6 py-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <Button
                      variant="outline"
                      size="sm"
                             onClick={() => setPendingPage(prev => Math.max(1, prev - 1))}
                             disabled={pendingPage === 1}
                      className="flex items-center gap-2"
                    >
                      <ChevronDown className="w-4 h-4 rotate-90" />
                      Previous
                    </Button>
                    
                    <span className="text-sm text-gray-600 font-medium">
                      Page {pendingPage} of {Math.ceil(pending.filter(p => 
                        p.status === 'pending' &&
                        (p.user_name.toLowerCase().includes(pendingSearchTerm.toLowerCase()) ||
                         p.user_unique_id.toLowerCase().includes(pendingSearchTerm.toLowerCase()))
                      ).length / itemsPerPage)}
                           </span>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPendingPage(prev => Math.min(Math.ceil(pending.filter(p => 
                        p.status === 'pending' &&
                        (p.user_name.toLowerCase().includes(pendingSearchTerm.toLowerCase()) ||
                         p.user_unique_id.toLowerCase().includes(pendingSearchTerm.toLowerCase()))
                      ).length / itemsPerPage), prev + 1))}
                      disabled={pendingPage === Math.ceil(pending.filter(p => 
                        p.status === 'pending' &&
                        (p.user_name.toLowerCase().includes(pendingSearchTerm.toLowerCase()) ||
                         p.user_unique_id.toLowerCase().includes(pendingSearchTerm.toLowerCase()))
                      ).length / itemsPerPage)}
                      className="flex items-center gap-2"
                    >
                      Next
                      <ChevronDown className="w-4 h-4 -rotate-90" />
                    </Button>
                   </div>
               </div>
             )}
      </div>

            {/* Pending Withheld Releases - Enhanced */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Pending Withheld Releases ({withheldReqs.filter(item => 
                      item.name.toLowerCase().includes(withheldSearchTerm.toLowerCase()) ||
                      item.userUniqueId.toLowerCase().includes(withheldSearchTerm.toLowerCase())
                    ).length} total)
                  </h3>
                  <Input
                    placeholder="Search by name or ID..."
                    value={withheldSearchTerm}
                    onChange={(e) => {
                      setWithheldSearchTerm(e.target.value)
                      setWithheldPage(1) // Reset to first page on search
                    }}
                    className="max-w-xs"
                  />
                </div>
              </div>
              <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="font-semibold">User</TableHead>
                      <TableHead className="font-semibold">Amount</TableHead>
                      <TableHead className="font-semibold text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                     <TableBody>
                    {withheldReqs.filter(item => 
                      item.name.toLowerCase().includes(withheldSearchTerm.toLowerCase()) ||
                      item.userUniqueId.toLowerCase().includes(withheldSearchTerm.toLowerCase())
                    ).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-12 text-gray-500">
                          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                          <p className="text-lg font-medium text-gray-700">
                            {withheldSearchTerm ? 'No results found' : 'No pending withheld releases'}
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            {withheldSearchTerm ? 'Try a different search term' : 'All withheld amounts have been processed'}
                          </p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      withheldReqs
                        .filter(item => 
                          item.name.toLowerCase().includes(withheldSearchTerm.toLowerCase()) ||
                          item.userUniqueId.toLowerCase().includes(withheldSearchTerm.toLowerCase())
                        )
                        .slice((withheldPage - 1) * withheldItemsPerPage, withheldPage * withheldItemsPerPage)
                        .map((item) => (
                          <TableRow key={item.userUniqueId} className="hover:bg-gray-50 transition-colors border-b border-gray-100">
                            <TableCell className="py-6">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                  <User className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                            <UserSummaryPopover
                                    userUniqueId={item.userUniqueId}
                                    userName={item.name}
                              onAction={(action, data) => handlePopoverAction(action, data)}
                            >
                                    <span className="text-base font-medium text-gray-900 hover:text-blue-600 cursor-pointer hover:underline block">
                                      {item.name}
                              </span>
                            </UserSummaryPopover>
                                  <span className="text-xs text-gray-500 font-mono block">{item.userUniqueId}</span>
                                  {item.location && (
                                    <span className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                      <Calendar className="w-3 h-3" />
                                      {item.location}
                                    </span>
                                  )}
                                </div>
                              </div>
                          </TableCell>
                            <TableCell className="py-6">
                              <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-orange-100 text-orange-700 rounded-lg font-bold text-sm">
                                <AlertCircle className="w-4 h-4" />
                                ₦{Number(item.amount).toLocaleString()}
                              </span>
                          </TableCell>
                            <TableCell className="py-6 text-right">
                            <div className="flex gap-2 justify-end">
                              <Button 
                                size="sm" 
                                  variant="outline"
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                                  onClick={() => {
                                    setConfirmDialog({
                                      open: true,
                                      type: 'warning',
                                      title: 'Reject Withheld Release',
                                      message: `Reject withheld amount of ₦${Number(item.amount).toLocaleString()} for ${item.name}?`,
                                      variant: 'destructive',
                                      confirmText: 'Reject',
                                      onConfirm: () => handleRejectWithheldRelease(item.userUniqueId),
                                      onCancel: () => setConfirmDialog({ ...confirmDialog, open: false }),
                                    })
                                  }}
                                >
                                  <XCircle className="w-4 h-4 mr-1" />
                                  Reject
                              </Button>
                              <Button 
                                size="sm" 
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                  onClick={() => {
                                    setConfirmDialog({
                                      open: true,
                                      type: 'success',
                                      title: 'Release Withheld Amount',
                                      message: `Release withheld amount of ₦${Number(item.amount).toLocaleString()} for ${item.name}?`,
                                      variant: 'success',
                                      confirmText: 'Release',
                                      onConfirm: () => handleApproveWithheldRelease(item.userUniqueId),
                                      onCancel: () => setConfirmDialog({ ...confirmDialog, open: false }),
                                    })
                                  }}
                                >
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Approve
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                        ))
                    )}
                    </TableBody>
                  </Table>
              </div>
                 
                 {/* Pagination */}
              {withheldReqs.filter(item => 
                item.name.toLowerCase().includes(withheldSearchTerm.toLowerCase()) ||
                item.userUniqueId.toLowerCase().includes(withheldSearchTerm.toLowerCase())
              ).length > withheldItemsPerPage && (
                <div className="px-6 py-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <Button
                      variant="outline"
                      size="sm"
                             onClick={() => setWithheldPage(prev => Math.max(1, prev - 1))}
                             disabled={withheldPage === 1}
                      className="flex items-center gap-2"
                    >
                      <ChevronDown className="w-4 h-4 rotate-90" />
                      Previous
                    </Button>
                    
                    <span className="text-sm text-gray-600 font-medium">
                      Page {withheldPage} of {Math.ceil(withheldReqs.filter(item => 
                        item.name.toLowerCase().includes(withheldSearchTerm.toLowerCase()) ||
                        item.userUniqueId.toLowerCase().includes(withheldSearchTerm.toLowerCase())
                      ).length / withheldItemsPerPage)}
                           </span>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setWithheldPage(prev => Math.min(Math.ceil(withheldReqs.filter(item => 
                        item.name.toLowerCase().includes(withheldSearchTerm.toLowerCase()) ||
                        item.userUniqueId.toLowerCase().includes(withheldSearchTerm.toLowerCase())
                      ).length / withheldItemsPerPage), prev + 1))}
                      disabled={withheldPage === Math.ceil(withheldReqs.filter(item => 
                        item.name.toLowerCase().includes(withheldSearchTerm.toLowerCase()) ||
                        item.userUniqueId.toLowerCase().includes(withheldSearchTerm.toLowerCase())
                      ).length / withheldItemsPerPage)}
                      className="flex items-center gap-2"
                    >
                      Next
                      <ChevronDown className="w-4 h-4 -rotate-90" />
                    </Button>
                   </div>
               </div>
             )}
      </div>

            {/* Release History (Approved & Rejected) - Enhanced */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Release History (Approved & Rejected) ({releaseHistory.filter(item =>
                      item.user_name.toLowerCase().includes(historySearchTerm.toLowerCase()) ||
                      item.user_unique_id.toLowerCase().includes(historySearchTerm.toLowerCase())
                    ).length} total)
                  </h3>
                  <Input
                    placeholder="Search by name or ID..."
                    value={historySearchTerm}
                    onChange={(e) => {
                      setHistorySearchTerm(e.target.value)
                      setHistoryPage(1) // Reset to first page on search
                    }}
                    className="max-w-xs"
                  />
          </div>
             </div>
              <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="font-semibold">User</TableHead>
                      <TableHead className="font-semibold">Amount</TableHead>
                      <TableHead className="font-semibold">Status & Reviewer</TableHead>
                      <TableHead className="font-semibold">Date</TableHead>
                      </TableRow>
                    </TableHeader>
                   <TableBody>
                    {releaseHistory.filter(item =>
                      item.user_name.toLowerCase().includes(historySearchTerm.toLowerCase()) ||
                      item.user_unique_id.toLowerCase().includes(historySearchTerm.toLowerCase())
                    ).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-12 text-gray-500">
                          <History className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                          <p className="text-lg font-medium text-gray-700">
                            {historySearchTerm ? 'No results found' : 'No release history available'}
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            {historySearchTerm ? 'Try a different search term' : 'Completed requests will appear here'}
                          </p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      releaseHistory
                        .filter(item =>
                          item.user_name.toLowerCase().includes(historySearchTerm.toLowerCase()) ||
                          item.user_unique_id.toLowerCase().includes(historySearchTerm.toLowerCase())
                        )
                        .slice((historyPage - 1) * 10, historyPage * 10)
                        .map((item) => (
                          <TableRow key={item.id} className="hover:bg-gray-50 transition-colors border-b border-gray-100">
                            <TableCell className="py-6">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                  <User className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                          <UserSummaryPopover
                                    userUniqueId={item.user_unique_id}
                                    userName={item.user_name}
                            onAction={(action, data) => handlePopoverAction(action, data)}
                          >
                                    <span className="text-base font-medium text-gray-900 hover:text-blue-600 cursor-pointer hover:underline block">
                                      {item.user_name}
                            </span>
                          </UserSummaryPopover>
                                  <span className="text-xs text-gray-500 font-mono block">{item.user_unique_id}</span>
                                  {item.user_location && (
                                    <span className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                      <Calendar className="w-3 h-3" />
                                      {item.user_location}
                                    </span>
                                  )}
                                </div>
                              </div>
                        </TableCell>
                            <TableCell className="py-6">
                              <span className="text-base font-bold text-gray-900">
                                ₦{Number(item.amount).toLocaleString()}
                              </span>
                            </TableCell>
                            <TableCell className="py-6">
                              <div className="space-y-1">
                                <Badge 
                                  variant={item.status === 'approved' ? 'default' : 'destructive'}
                                  className="flex items-center gap-1 w-fit"
                                >
                                  {item.status === 'approved' ? (
                                    <>
                                      <CheckCircle className="w-3 h-3" />
                                      Approved
                                    </>
                                  ) : (
                                    <>
                                      <XCircle className="w-3 h-3" />
                                      Rejected
                                    </>
                                  )}
                          </Badge>
                                {item.reviewed_by_name && (
                                  <p className="text-xs text-gray-500">by {item.reviewed_by_name}</p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="py-6 text-sm text-gray-600">
                              {item.decided_at ? new Date(item.decided_at).toLocaleDateString('en-NG', { 
                                day: '2-digit', 
                                month: 'short', 
                                year: 'numeric' 
                              }) : '—'}
                        </TableCell>
                      </TableRow>
                        ))
                    )}
                  </TableBody>
                </Table>
              </div>
              {/* Pagination for Release History - Simplified */}
              {releaseHistory.filter(item =>
                item.user_name.toLowerCase().includes(historySearchTerm.toLowerCase()) ||
                item.user_unique_id.toLowerCase().includes(historySearchTerm.toLowerCase())
              ).length > 10 && (
                <div className="px-6 py-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <Button
                      variant="outline"
                      size="sm"
                           onClick={() => setHistoryPage(prev => Math.max(1, prev - 1))}
                           disabled={historyPage === 1}
                      className="flex items-center gap-2"
                    >
                      <ChevronDown className="w-4 h-4 rotate-90" />
                      Previous
                    </Button>
                    
                    <span className="text-sm text-gray-600 font-medium">
                      Page {historyPage} of {Math.ceil(releaseHistory.filter(item =>
                        item.user_name.toLowerCase().includes(historySearchTerm.toLowerCase()) ||
                        item.user_unique_id.toLowerCase().includes(historySearchTerm.toLowerCase())
                      ).length / 10)}
                         </span>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setHistoryPage(prev => Math.min(Math.ceil(releaseHistory.filter(item =>
                        item.user_name.toLowerCase().includes(historySearchTerm.toLowerCase()) ||
                        item.user_unique_id.toLowerCase().includes(historySearchTerm.toLowerCase())
                      ).length / 10), prev + 1))}
                      disabled={historyPage === Math.ceil(releaseHistory.filter(item =>
                        item.user_name.toLowerCase().includes(historySearchTerm.toLowerCase()) ||
                        item.user_unique_id.toLowerCase().includes(historySearchTerm.toLowerCase())
                      ).length / 10)}
                      className="flex items-center gap-2"
                    >
                      Next
                      <ChevronDown className="w-4 h-4 -rotate-90" />
                    </Button>
                 </div>
      </div>
            )}
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

      {/* Alert Dialog for Confirmations */}
      <AlertDialog
        open={confirmDialog.open}
        type={confirmDialog.type}
        title={confirmDialog.title}
        message={confirmDialog.message}
        variant={confirmDialog.variant}
        confirmText={confirmDialog.confirmText}
        cancelText={confirmDialog.cancelText}
        showCancel={confirmDialog.showCancel !== false}
        onConfirm={confirmDialog.onConfirm}
        onCancel={confirmDialog.onCancel}
      />

      {/* Success Alert */}
      {successAlert && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5">
          <Alert
            type="success"
            title="Success"
            message={successAlert}
            onClose={() => setSuccessAlert(null)}
            className="shadow-lg min-w-[320px]"
          />
                 </div>
               )}

      {/* Error Alert */}
      {errorAlert && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5">
          <Alert
            type="error"
            title="Error"
            message={errorAlert}
            onClose={() => setErrorAlert(null)}
            className="shadow-lg min-w-[320px]"
          />
             </div>
           )}
         </div>
  );
}