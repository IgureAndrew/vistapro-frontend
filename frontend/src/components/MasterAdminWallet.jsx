// src/components/MasterAdminWallet.jsx

import React, { useEffect, useState } from 'react'
import { Wallet, CreditCard, RefreshCw, ChevronDown, Users, TrendingUp, AlertCircle, CheckCircle, XCircle, Clock, History } from 'lucide-react'
import walletApi from '../api/walletApi'  // baseURL = VITE_API_URL + '/api/wallets'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Separator } from './ui/separator'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from './ui/pagination'

const TABS = [
  { key: 'marketers',   label: "Marketers' Wallets",   endpoint: '/master-admin/marketers'  },
  { key: 'admins',      label: "Admins' Wallets",      endpoint: '/master-admin/admins'      },
  { key: 'superadmins', label: "SuperAdmins' Wallets", endpoint: '/master-admin/superadmins' }
]

export default function MasterAdminWallet() {
  // ── Summary & Pending ────────────────────────────────────────
  const [wallets,  setWallets]  = useState([])
  const [pending,  setPending]  = useState([])

  // ── Pending Withheld Releases ─────────────────────────────────
  const [withheldReqs, setWithheldReqs]       = useState([])  // “manual” / pending requests
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
  const [activeTab,  setActiveTab] = useState('marketers')
  const [tabData,    setTabData]   = useState({})
  const [tabLoading, setTabLoading]= useState(true)
  const [tabError,   setTabError]  = useState(null)

  // ── Single-click guard for approve/reject ────────────────────
  const [actioning, setActioning] = useState(false)

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
    setError(null)
    setWithheldLoading(true)
    setWithheldError(null)
    setHistoryLoading(true)         // ← NEW: start loading for “history”
    setHistoryError(null)

    try {
      const [mkRes, reqRes, wRes, histRes] = await Promise.all([
        walletApi.get('/master-admin/marketers'),
        walletApi.get('/master-admin/requests'),
        walletApi.get('/master-admin/marketers/withheld'),
        walletApi.get('/master-admin/releases/history')  // ← NEW
      ])

      setWallets( mkRes.data.wallets   || [] )
      setPending( reqRes.data.requests || [] )
      setWithheldReqs(wRes.data.manual || [])         // note: controller returns { manual: [ … ] }
      setReleaseHistory(histRes.data.history || [])   // ← NEW: pull down “history” array
    } catch (e) {
      console.error(e)
      setError('Failed to load wallets or requests')
      setWithheldError('Failed to load withheld releases')
      setHistoryError('Failed to load release history')
    } finally {
      setLoading(false)
      setWithheldLoading(false)
      setHistoryLoading(false)         // ← NEW: done loading history
    }
  }

  // ── loadTab: whichever tab is active ──────────────────────────
  const loadTab = async key => {
    setTabLoading(true)
    setTabError(null)
    try {
      const tab = TABS.find(t => t.key === key)
      if (!tab) throw new Error('Unknown tab ' + key)
      const res = await walletApi.get(tab.endpoint)
      setTabData(d => ({ ...d, [key]: res.data.wallets || [] }))
    } catch (e) {
      console.error(e)
      setTabError(`Failed to load ${TABS.find(t => t.key === key)?.label}`)
    } finally {
      setTabLoading(false)
    }
  }

  // ── fetchHistory: full withdrawal history ────────────────────
  const fetchHistory = async (params) => {
    setHistLoading(true)
    setHistError(null)
    // Reset pagination when fetching new data
    setWithdrawalHistoryPage(1)
    try {
      const res = await walletApi.get('/master-admin/withdrawals', {
        params: params ?? filters
      })
      setHistory(res.data.data || [])
    } catch (e) {
      console.error(e)
      setHistError('Failed to load withdrawal history')
    } finally {
      setHistLoading(false)
    }
  }

  // ── on-mount ──────────────────────────────────────────────────
  useEffect(() => {
    loadAll()
    loadTab(activeTab)
    fetchHistory()
  }, [])

  // ── when tab changes ─────────────────────────────────────────
  useEffect(() => {
    loadTab(activeTab)
    setWalletsPage(1) // Reset pagination when tab changes
  }, [activeTab])

  // ── Approve / Reject cashouts ─────────────────────────────────
  const handleReview = async (id, action) => {
    if (actioning) return
    setActioning(true)
    try {
      await walletApi.patch(`/master-admin/requests/${id}`, { action })
      await loadAll()
      await fetchHistory()
      await loadTab(activeTab)
    } catch (e) {
      console.error(e)
      alert(e.response?.data?.message || 'Failed to update request')
    } finally {
      setActioning(false)
    }
  }

  // ── Approve / Reject withheld releases (pending) ──────────────
  const handleRelease = async (id, action) => {
    if (actioning) return
    setActioning(true)
    try {
      await walletApi.patch(`/master-admin/marketers/${id}/withheld/${action}`, {})  
      // note: we pass action = 'approve' or 'reject' in the URL
      await loadAll()
    } catch (e) {
      console.error(e)
      alert(e.response?.data?.message || 'Failed to update release')
    } finally {
      setActioning(false)
    }
  }

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
  const applyFilters = e => { e.preventDefault(); fetchHistory() }
  const clearFilters = () => {
    const reset = { startDate:'', endDate:'', name:'', role:'' }
    setFilters(reset)
    fetchHistory(reset)
  }

  // ── Pagination helpers ────────────────────────────────────────
  const getPaginatedData = (data, page) => {
    const startIndex = (page - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return data.slice(startIndex, endIndex)
  }

  const getTotalPages = (data) => Math.ceil(data.length / itemsPerPage)

  const resetPagination = () => {
    setPendingPage(1)
    setWithheldPage(1)
    setHistoryPage(1)
    setWalletsPage(1)
    setWithdrawalHistoryPage(1)
  }

  // ── loading / error UI ───────────────────────────────────────
  if (loading) return <div className="p-6 text-muted-foreground">Loading…</div>
  if (error)   return <div className="p-6 text-red-600">{error}</div>

  // ── compute summary values ────────────────────────────────────
  const total     = wallets.reduce((sum, w) => sum + Number(w.total_balance||0), 0)
  const available = wallets.reduce((sum, w) => sum + Number(w.available_balance||0), 0)
  const withheld  = wallets.reduce((sum, w) => sum + Number(w.withheld_balance||0), 0)
  const pendSum   = pending
    .filter(r => r.status==='pending')
    .reduce((sum, r) => sum + Number(r.net_amount||0), 0)

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Wallet Management</h1>
        <p className="text-muted-foreground">Manage pending cashouts and withheld releases</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-blue-900 text-lg">
              <Wallet className="w-5 h-5" />
              Total Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-900">₦{total.toLocaleString()}</p>
            <p className="text-sm text-blue-700 mt-1">Combined wallet balance</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-green-900 text-lg">
              <CreditCard className="w-5 h-5" />
              Available
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-900">₦{available.toLocaleString()}</p>
            <p className="text-sm text-green-700 mt-1">Ready for withdrawal</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-orange-900 text-lg">
              <AlertCircle className="w-5 h-5" />
              Withheld
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-orange-900">₦{withheld.toLocaleString()}</p>
            <p className="text-sm text-orange-700 mt-1">Pending release</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-red-900 text-lg">
              <RefreshCw className="w-5 h-5" />
              Pending Cashout
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-900">₦{pendSum.toLocaleString()}</p>
            <p className="text-sm text-red-700 mt-1">Awaiting approval</p>
          </CardContent>
        </Card>
      </div>

             {/* Pending Actions - Stacked Layout */}
       <div className="space-y-6">
         
                  {/* Pending Cashouts - Top */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="text-lg font-semibold">Pending Cashouts</h3>
                  <p className="text-sm text-muted-foreground">Review and approve withdrawal requests</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={loadAll}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
            <div>
             {pending.length === 0 ? (
               <div className="text-center py-8 text-muted-foreground">
                 <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-50" />
                 <p className="text-lg font-medium">No pending cashouts</p>
                 <p className="text-sm">All withdrawal requests have been processed</p>
               </div>
                           ) : (
                                                   <div className="rounded-lg border border-gray-200 bg-white">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-b border-gray-200 bg-gray-50/50">
                          <TableHead className="h-12 px-4 text-left align-middle font-medium text-gray-700">ID</TableHead>
                          <TableHead className="h-12 px-4 text-left align-middle font-medium text-gray-700">User ID</TableHead>
                          <TableHead className="h-12 px-4 text-left align-middle font-medium text-gray-700">Requested</TableHead>
                          <TableHead className="h-12 px-4 text-left align-middle font-medium text-gray-700">Fee</TableHead>
                          <TableHead className="h-12 px-4 text-left align-middle font-medium text-gray-700">Net Amount</TableHead>
                          <TableHead className="h-12 px-4 text-left align-middle font-medium text-gray-700">Account</TableHead>
                          <TableHead className="h-12 px-4 text-left align-middle font-medium text-gray-700">Bank</TableHead>
                          <TableHead className="h-12 px-4 text-left align-middle font-medium text-gray-700">Date</TableHead>
                          <TableHead className="h-12 px-4 text-right align-middle font-medium text-gray-700">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                     <TableBody>
                       {getPaginatedData(pending, pendingPage).map(r => {
                         const req = +r.amount_requested||0
                         const fee = +r.fee||0
                         const net = +r.net_amount||0
                         return (
                           <TableRow key={r.id} className="border-b border-gray-200 transition-colors hover:bg-gray-50/50">
                            <TableCell className="p-4 align-middle font-medium">#{r.id}</TableCell>
                            <TableCell className="p-4 align-middle font-mono text-sm text-gray-600">{r.user_unique_id}</TableCell>
                            <TableCell className="p-4 align-middle font-semibold">₦{req.toLocaleString()}</TableCell>
                            <TableCell className="p-4 align-middle">₦{fee.toLocaleString()}</TableCell>
                            <TableCell className="p-4 align-middle font-bold text-green-600">₦{net.toLocaleString()}</TableCell>
                            <TableCell className="p-4 align-middle">{r.account_name}</TableCell>
                            <TableCell className="p-4 align-middle">{r.bank_name}</TableCell>
                            <TableCell className="p-4 align-middle text-sm text-gray-600">{new Date(r.requested_at).toLocaleDateString()}</TableCell>
                            <TableCell className="p-4 align-middle text-right">
                              <div className="flex gap-2 justify-end">
                                <Button 
                                  size="sm" 
                                  onClick={()=>handleReview(r.id,'approve')}
                                  disabled={actioning}
                                  className="bg-white text-gray-700 border-gray-300 hover:bg-gray-50 h-8 px-3 data-[state=active]:bg-[#f59e0b] data-[state=active]:text-white data-[state=active]:border-[#f59e0b]"
                                >
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Approve
                                </Button>
                                <Button 
                                  size="sm" 
                                  onClick={()=>handleReview(r.id,'reject')}
                                  disabled={actioning}
                                  className="bg-white text-gray-700 border-gray-300 hover:bg-gray-50 h-8 px-3 data-[state=active]:bg-[#f59e0b] data-[state=active]:text-white data-[state=active]:border-[#f59e0b]"
                                >
                                  <XCircle className="w-3 h-3 mr-1" />
                                  Reject
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                 
                 {/* Pagination */}
                 {pending.length > itemsPerPage && (
                   <div className="mt-4">
                     <Pagination>
                       <PaginationContent>
                         <PaginationItem>
                           <PaginationPrevious 
                             onClick={() => setPendingPage(prev => Math.max(1, prev - 1))}
                             disabled={pendingPage === 1}
                           />
                         </PaginationItem>
                         
                         <PaginationItem>
                           <span className="px-4 py-2 text-sm text-gray-600">
                             Page {pendingPage} of {getTotalPages(pending)}
                           </span>
                         </PaginationItem>
                         
                         <PaginationItem>
                           <PaginationNext 
                             onClick={() => setPendingPage(prev => Math.min(getTotalPages(pending), prev + 1))}
                             disabled={pendingPage === getTotalPages(pending)}
                           />
                         </PaginationItem>
                       </PaginationContent>
                     </Pagination>
                   </div>
                 )}
               </div>
             )}
          </div>

                                   {/* Pending Withheld Releases - Bottom */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-purple-600" />
                <div>
                  <h3 className="text-lg font-semibold">Pending Withheld Releases</h3>
                  <p className="text-sm text-muted-foreground">Release withheld funds to users</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={loadAll}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
            <div>
             {withheldLoading ? (
               <div className="text-center py-8 text-muted-foreground">
                 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3"></div>
                 <p className="text-lg font-medium">Loading releases...</p>
                 <p className="text-sm">Please wait while we fetch the data</p>
               </div>
             ) : withheldError ? (
               <div className="text-center py-8 text-red-600">
                 <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                 <p className="text-lg font-medium">Error loading releases</p>
                 <p className="text-sm">{withheldError}</p>
               </div>
             ) : withheldReqs.length === 0 ? (
               <div className="text-center py-8 text-muted-foreground">
                 <Wallet className="w-12 h-12 mx-auto mb-3 opacity-50" />
                 <p className="text-lg font-medium">No pending releases</p>
                 <p className="text-sm">All withheld funds have been processed</p>
               </div>
                           ) : (
                                                                   <div className="rounded-lg border border-gray-200 bg-white">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-b border-gray-200 bg-gray-50/50">
                          <TableHead className="h-12 px-4 text-left align-middle font-medium text-gray-700">User ID</TableHead>
                          <TableHead className="h-12 px-4 text-left align-middle font-medium text-gray-700">Name</TableHead>
                          <TableHead className="h-12 px-4 text-left align-middle font-medium text-gray-700">Withheld Amount</TableHead>
                          <TableHead className="h-12 px-4 text-left align-middle font-medium text-gray-700">Status</TableHead>
                          <TableHead className="h-12 px-4 text-right align-middle font-medium text-gray-700">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                     <TableBody>
                       {getPaginatedData(withheldReqs, withheldPage).map(r => (
                         <TableRow key={r.user_unique_id} className="border-b border-gray-200 transition-colors hover:bg-gray-50/50">
                          <TableCell className="p-4 align-middle font-mono text-sm text-gray-600">{r.user_unique_id}</TableCell>
                          <TableCell className="p-4 align-middle font-medium">{r.name}</TableCell>
                          <TableCell className="p-4 align-middle font-bold text-purple-600">₦{Number(r.withheld_balance).toLocaleString()}</TableCell>
                          <TableCell className="p-4 align-middle">
                            <Badge variant="secondary" className="bg-purple-100 text-purple-800 hover:bg-purple-100">
                              Ready for Release
                            </Badge>
                          </TableCell>
                          <TableCell className="p-4 align-middle text-right">
                            <div className="flex gap-2 justify-end">
                              <Button 
                                size="sm" 
                                onClick={()=>handleRelease(r.user_unique_id,'approve')}
                                disabled={actioning}
                                className="bg-white text-gray-700 border-gray-300 hover:bg-gray-50 h-8 px-3 data-[state=active]:bg-[#f59e0b] data-[state=active]:text-white data-[state=active]:border-[#f59e0b]"
                              >
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Release
                              </Button>
                              <Button 
                                size="sm" 
                                onClick={()=>handleRelease(r.user_unique_id,'reject')}
                                disabled={actioning}
                                className="bg-white text-gray-700 border-gray-300 hover:bg-gray-50 h-8 px-3 data-[state=active]:bg-[#f59e0b] data-[state=active]:text-white data-[state=active]:border-[#f59e0b]"
                              >
                                <XCircle className="w-3 h-3 mr-1" />
                                Reject
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                 
                 {/* Pagination */}
                 {withheldReqs.length > itemsPerPage && (
                   <div className="mt-4">
                     <Pagination>
                       <PaginationContent>
                         <PaginationItem>
                           <PaginationPrevious 
                             onClick={() => setWithheldPage(prev => Math.max(1, prev - 1))}
                             disabled={withheldPage === 1}
                           />
                         </PaginationItem>
                         
                         <PaginationItem>
                           <span className="px-4 py-2 text-sm text-gray-600">
                             Page {withheldPage} of {getTotalPages(withheldReqs)}
                           </span>
                         </PaginationItem>
                         
                         <PaginationItem>
                           <PaginationNext 
                             onClick={() => setWithheldPage(prev => Math.min(getTotalPages(withheldReqs), prev + 1))}
                             disabled={withheldPage === getTotalPages(withheldReqs)}
                           />
                         </PaginationItem>
                       </PaginationContent>
                     </Pagination>
                   </div>
                 )}
               </div>
             )}
            </div>
          </div>
      </div>

                           {/* Release History */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5" />
            <h3 className="text-lg font-semibold">Release History</h3>
          </div>
          <p className="text-sm text-muted-foreground">Track approved and rejected release requests</p>
          <div>
           {historyLoading ? (
             <div className="text-center py-8 text-muted-foreground">
               <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3"></div>
               <p>Loading release history...</p>
             </div>
           ) : historyError ? (
             <div className="text-center py-8 text-red-600">
               <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
               <p>{historyError}</p>
             </div>
           ) : releaseHistory.length === 0 ? (
             <div className="text-center py-8 text-muted-foreground">
               <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
               <p>No releases have been processed yet</p>
             </div>
                       ) : (
                                                           <div className="rounded-lg border border-gray-200 bg-white">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b border-gray-200 bg-gray-50/50">
                        <TableHead className="h-12 px-4 text-left align-middle font-medium text-gray-700">ID</TableHead>
                        <TableHead className="h-12 px-4 text-left align-middle font-medium text-gray-700">User ID</TableHead>
                        <TableHead className="h-12 px-4 text-left align-middle font-medium text-gray-700">Amount</TableHead>
                        <TableHead className="h-12 px-4 text-left align-middle font-medium text-gray-700">Requested</TableHead>
                        <TableHead className="h-12 px-4 text-left align-middle font-medium text-gray-700">Reviewed</TableHead>
                        <TableHead className="h-12 px-4 text-left align-middle font-medium text-gray-700">Reviewer</TableHead>
                        <TableHead className="h-12 px-4 text-left align-middle font-medium text-gray-700">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                   <TableBody>
                     {getPaginatedData(releaseHistory, historyPage).map(r => (
                       <TableRow key={r.id} className="border-b border-gray-200 transition-colors hover:bg-gray-50/50">
                        <TableCell className="p-4 align-middle font-medium">#{r.id}</TableCell>
                        <TableCell className="p-4 align-middle font-mono text-sm text-gray-600">{r.user_unique_id}</TableCell>
                        <TableCell className="p-4 align-middle font-semibold">₦{Number(r.amount).toLocaleString()}</TableCell>
                        <TableCell className="p-4 align-middle text-sm text-gray-600">{new Date(r.requested_at).toLocaleDateString()}</TableCell>
                        <TableCell className="p-4 align-middle text-sm text-gray-600">{r.reviewed_at ? new Date(r.reviewed_at).toLocaleDateString() : '—'}</TableCell>
                        <TableCell className="p-4 align-middle text-sm text-gray-600">{r.reviewer_uid || '—'}</TableCell>
                        <TableCell className="p-4 align-middle">
                          <Badge variant={r.status === 'approved' ? 'default' : 'destructive'}>
                            {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
               
               {/* Pagination */}
               {releaseHistory.length > itemsPerPage && (
                 <div className="mt-4">
                   <Pagination>
                     <PaginationContent>
                       <PaginationItem>
                         <PaginationPrevious 
                           onClick={() => setHistoryPage(prev => Math.max(1, prev - 1))}
                           disabled={historyPage === 1}
                         />
                       </PaginationItem>
                       
                       <PaginationItem>
                         <span className="px-4 py-2 text-sm text-gray-600">
                           Page {historyPage} of {getTotalPages(releaseHistory)}
                         </span>
                       </PaginationItem>
                       
                                                <PaginationItem>
                           <PaginationNext 
                             onClick={() => setHistoryPage(prev => Math.min(getTotalPages(releaseHistory), prev + 1))}
                             disabled={historyPage === getTotalPages(releaseHistory)}
                           />
                         </PaginationItem>
                     </PaginationContent>
                   </Pagination>
                 </div>
                               )}
              </div>
            )}
           </div>
         </div>
       </div>

       {/* Tabbed Wallets */}
       <div className="space-y-4">
         <div className="flex items-center gap-2">
           <Users className="w-5 h-5" />
           <h3 className="text-lg font-semibold">User Wallets Overview</h3>
         </div>
         <p className="text-sm text-muted-foreground">View wallet balances by user role</p>
         <div>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              {TABS.map(t => (
                <TabsTrigger key={t.key} value={t.key} className="flex items-center gap-2">
                  {t.key === 'marketers' && <Users className="w-4 h-4" />}
                  {t.key === 'admins' && <TrendingUp className="w-4 h-4" />}
                  {t.key === 'superadmins' && <AlertCircle className="w-4 h-4" />}
                  {t.label}
                </TabsTrigger>
              ))}
            </TabsList>
            
            {TABS.map(t => (
              <TabsContent key={t.key} value={t.key} className="mt-6">
                {tabLoading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3"></div>
                    <p>Loading {t.label}...</p>
                  </div>
                ) : tabError ? (
                  <div className="text-center py-8 text-red-600">
                    <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>{tabError}</p>
                  </div>
                ) : (tabData[t.key] || []).length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No {t.label} found</p>
                  </div>
                                 ) : (
                                       <div className="rounded-lg border border-gray-200 bg-white">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-b border-gray-200 bg-gray-50/50">
                            <TableHead className="h-12 px-4 text-left align-middle font-medium text-gray-700">User</TableHead>
                            <TableHead className="h-12 px-4 text-left align-middle font-medium text-gray-700">Role</TableHead>
                            <TableHead className="h-12 px-4 text-left align-middle font-medium text-gray-700">Total Balance</TableHead>
                            <TableHead className="h-12 px-4 text-left align-middle font-medium text-gray-700">Available</TableHead>
                            <TableHead className="h-12 px-4 text-left align-middle font-medium text-gray-700">Withheld</TableHead>
                            <TableHead className="h-12 px-4 text-left align-middle font-medium text-gray-700">Pending</TableHead>
                          </TableRow>
                        </TableHeader>
                       <TableBody>
                         {getPaginatedData(tabData[t.key] || [], walletsPage).map(w => (
                           <TableRow key={w.user_unique_id} className="border-b border-gray-200 transition-colors hover:bg-gray-50/50">
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                                  <span className="text-sm font-semibold text-blue-700">{w.name?.charAt(0)?.toUpperCase() || 'U'}</span>
                                </div>
                                <div>
                                  <p className="font-medium">{w.name}</p>
                                  <p className="text-xs text-muted-foreground">{w.user_unique_id}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="capitalize">{w.role}</Badge>
                            </TableCell>
                            <TableCell className="font-semibold">₦{Number(w.total_balance||0).toLocaleString()}</TableCell>
                            <TableCell className="text-green-600">₦{Number(w.available_balance||0).toLocaleString()}</TableCell>
                            <TableCell className="text-orange-600">₦{Number(w.withheld_balance||0).toLocaleString()}</TableCell>
                            <TableCell className="text-red-600">₦{Number(w.pending_cashout||0).toLocaleString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    
                    {/* Pagination */}
                    {(tabData[t.key] || []).length > itemsPerPage && (
                      <div className="mt-4">
                        <Pagination>
                          <PaginationContent>
                            <PaginationItem>
                              <PaginationPrevious 
                                onClick={() => setWalletsPage(prev => Math.max(1, prev - 1))}
                                disabled={walletsPage === 1}
                              />
                            </PaginationItem>
                            
                            <PaginationItem>
                              <span className="px-4 py-2 text-sm text-gray-600">
                                Page {walletsPage} of {getTotalPages(tabData[t.key] || [])}
                              </span>
                            </PaginationItem>
                            
                            <PaginationItem>
                              <PaginationNext 
                                onClick={() => setWalletsPage(prev => Math.min(getTotalPages(tabData[t.key] || []), prev + 1))}
                                disabled={walletsPage === getTotalPages(tabData[t.key] || [])}
                              />
                            </PaginationItem>
                          </PaginationContent>
                        </Pagination>
                      </div>
                                         )}
                   </div>
                 )}
               </TabsContent>
             ))}
           </Tabs>
         </div>
       </div>

             {/* Withdrawal History */}
       <div className="space-y-4">
         <div className="flex justify-between items-center">
           <div className="flex items-center gap-2">
             <History className="w-5 h-5 text-blue-600" />
             <div>
               <h3 className="text-lg font-semibold">Withdrawal History</h3>
               <p className="text-sm text-muted-foreground">Track all withdrawal requests and their status</p>
             </div>
           </div>
           <Button variant="outline" size="sm" onClick={fetchHistory}>
             <RefreshCw className="w-4 h-4 mr-2" />
             Refresh
           </Button>
         </div>
         
         {/* Filters */}
         <div className="bg-white rounded-lg border border-gray-200 p-4">
           <form onSubmit={applyFilters} className="grid grid-cols-1 md:grid-cols-6 gap-4">
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
               <input 
                 type="date" 
                 name="startDate" 
                 value={filters.startDate} 
                 onChange={handleDateChange} 
                 className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#f59e0b] focus:border-transparent"
               />
             </div>
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
               <input 
                 type="date" 
                 name="endDate"   
                 value={filters.endDate}   
                 onChange={handleDateChange} 
                 className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#f59e0b] focus:border-transparent"
               />
             </div>
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
               <input 
                 type="text" 
                 name="name"        
                 value={filters.name}      
                 onChange={handleNameChange} 
                 placeholder="Search by name"
                 className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#f59e0b] focus:border-transparent"
               />
             </div>
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
               <select     
                 name="role"        
                 value={filters.role}      
                 onChange={handleRoleChange} 
                 className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#f59e0b] focus:border-transparent"
               >
                 <option value="">All Roles</option>
                 <option value="Marketer">Marketer</option>
                 <option value="Admin">Admin</option>
                 <option value="SuperAdmin">SuperAdmin</option>
               </select>
             </div>
             <div className="flex gap-2 items-end">
               <Button type="submit" className="bg-[#f59e0b] text-white hover:bg-[#d97706] px-4 py-2">
                 Filter
               </Button>
               <Button type="button" onClick={clearFilters} variant="outline" className="px-4 py-2">
                 Clear
               </Button>
             </div>
           </form>
         </div>

         {/* Table */}
         <div>
           {histLoading ? (
             <div className="text-center py-8 text-muted-foreground">
               <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3"></div>
               <p className="text-lg font-medium">Loading withdrawal history...</p>
               <p className="text-sm">Please wait while we fetch the data</p>
             </div>
           ) : histError ? (
             <div className="text-center py-8 text-red-600">
               <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
               <p className="text-lg font-medium">Error loading history</p>
               <p className="text-sm">{histError}</p>
             </div>
           ) : history.length === 0 ? (
             <div className="text-center py-8 text-muted-foreground">
               <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
               <p className="text-lg font-medium">No withdrawal history found</p>
               <p className="text-sm">No withdrawal requests match your current filters</p>
             </div>
           ) : (
             <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
               <Table>
                                   <TableHeader>
                    <TableRow className="border-b border-gray-200 bg-gray-50/50">
                      <TableHead className="h-12 px-4 text-left align-middle font-medium text-gray-700">Date</TableHead>
                      <TableHead className="h-12 px-4 text-left align-middle font-medium text-gray-700">User Details</TableHead>
                      <TableHead className="h-12 px-4 text-left align-middle font-medium text-gray-700">Phone</TableHead>
                      <TableHead className="h-12 px-4 text-left align-middle font-medium text-gray-700">Account Name</TableHead>
                      <TableHead className="h-12 px-4 text-left align-middle font-medium text-gray-700">Bank</TableHead>
                      <TableHead className="h-12 px-4 text-left align-middle font-medium text-gray-700">Account #</TableHead>
                      <TableHead className="h-12 px-4 text-left align-middle font-medium text-gray-700">Requested</TableHead>
                      <TableHead className="h-12 px-4 text-left align-middle font-medium text-gray-700">Fee</TableHead>
                      <TableHead className="h-12 px-4 text-left align-middle font-medium text-gray-700">Net</TableHead>
                      <TableHead className="h-12 px-4 text-left align-middle font-medium text-gray-700">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                 <TableBody>
                                       {getPaginatedData(history, withdrawalHistoryPage).map(r => (
                      <TableRow key={r.id} className="border-b border-gray-200 transition-colors hover:bg-gray-50/50">
                        <TableCell className="p-4 align-middle text-sm text-gray-600">{new Date(r.date).toLocaleDateString()}</TableCell>
                        <TableCell className="p-4 align-middle">
                          <div className="space-y-1">
                            <div className="font-medium text-gray-900">{r.name}</div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="capitalize text-xs">{r.role}</Badge>
                              <span className="text-xs text-gray-500 font-mono">{r.unique_id}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="p-4 align-middle text-sm text-gray-600">{r.phone}</TableCell>
                        <TableCell className="p-4 align-middle">{r.account_name}</TableCell>
                        <TableCell className="p-4 align-middle">{r.bank_name}</TableCell>
                        <TableCell className="p-4 align-middle font-mono text-sm text-gray-600">{r.account_number}</TableCell>
                        <TableCell className="p-4 align-middle font-semibold">₦{Number(r.amount||0).toLocaleString()}</TableCell>
                        <TableCell className="p-4 align-middle">₦{Number(r.fee||0).toLocaleString()}</TableCell>
                        <TableCell className="p-4 align-middle font-bold text-green-600">₦{Number(r.net_amount||0).toLocaleString()}</TableCell>
                        <TableCell className="p-4 align-middle">
                          <Badge 
                            variant={r.status === 'approved' ? 'default' : r.status === 'rejected' ? 'destructive' : 'secondary'}
                            className={r.status === 'pending' ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100' : ''}
                          >
                            {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                 </TableBody>
               </Table>
               
               {/* Pagination */}
               {history.length > itemsPerPage && (
                 <div className="mt-4">
                   <Pagination>
                     <PaginationContent>
                       <PaginationItem>
                         <PaginationPrevious 
                           onClick={() => setWithdrawalHistoryPage(prev => Math.max(1, prev - 1))}
                           disabled={withdrawalHistoryPage === 1}
                         />
                       </PaginationItem>
                       
                       <PaginationItem>
                         <span className="px-4 py-2 text-sm text-gray-600">
                           Page {withdrawalHistoryPage} of {getTotalPages(history)}
                         </span>
                       </PaginationItem>
                       
                       <PaginationItem>
                         <PaginationNext 
                           onClick={() => setWithdrawalHistoryPage(prev => Math.min(getTotalPages(history), prev + 1))}
                           disabled={withdrawalHistoryPage === getTotalPages(history)}
                         />
                       </PaginationItem>
                     </PaginationContent>
                   </Pagination>
                 </div>
               )}
             </div>
           )}
         </div>
       </div>
    </div>
  )
}
