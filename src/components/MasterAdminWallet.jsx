// src/components/MasterAdminWallet.jsx
import React, { useEffect, useState } from 'react'
import {
  Wallet,
  CreditCard,
  RefreshCw,
  ChevronDown
} from 'lucide-react'
import walletApi from '../api/walletApi'

const defaultFilters = {
  startDate: '',
  endDate:   '',
  name:      '',
  role:      ''
}

// Define the three tabs and their endpoints
const TABS = [
  { key: 'marketers',  label: "Marketers' Wallets",    endpoint: '/master-admin/wallets' },
  { key: 'admins',     label: "Admins' Wallets",       endpoint: '/master-admin/admin-wallets' },
  { key: 'superadmins',label: "SuperAdmins' Wallets",  endpoint: '/master-admin/super-admin-wallets' }
]

export default function MasterAdminWallet() {
  // ── State ─────────────────────────────────────────────────────
  const [wallets,     setWallets]       = useState([])
  const [pendingReqs, setPendingReqs]   = useState([])
  const [history,     setHistory]       = useState([])
  const [filters,     setFilters]       = useState(defaultFilters)

  const [loading,     setLoading]       = useState(true)
  const [error,       setError]         = useState(null)

  const [activeTab,   setActiveTab]     = useState(TABS[0].key)
  const [tabData,     setTabData]       = useState({})
  const [tabLoading,  setTabLoading]    = useState(true)
  const [tabError,    setTabError]      = useState(null)

  const [histLoading, setHistLoading]   = useState(false)
  const [histError,   setHistError]     = useState(null)

  // ── Data loaders ──────────────────────────────────────────────
  // Load summary and pending cashouts
  const loadAll = async () => {
    setLoading(true)
    try {
      const [wRes, pRes] = await Promise.all([
        walletApi.get('/master-admin/wallets'),
        walletApi.get('/master-admin/requests')
      ])
      setWallets(wRes.data.wallets || [])
      setPendingReqs(pRes.data.requests || [])
    } catch (err) {
      console.error(err)
      setError('Failed to load wallets or requests')
    } finally {
      setLoading(false)
    }
  }

  // Fetch data for the active tab
  const loadTab = async key => {
    const tab = TABS.find(t => t.key === key)
    if (!tab) return
    setTabLoading(true)
    setTabError(null)
    try {
      const res = await walletApi.get(tab.endpoint)
      setTabData(d => ({ ...d, [key]: res.data.wallets || [] }))
    } catch (err) {
      console.error(err)
      setTabError('Failed to load ' + tab.label)
    } finally {
      setTabLoading(false)
    }
  }

  // Fetch withdrawal history
  const fetchHistory = async params => {
    setHistLoading(true)
    setHistError(null)
    try {
      const res = await walletApi.get('/master-admin/withdrawals', {
        params: params ?? filters
      })
      setHistory(res.data.data || [])
    } catch (err) {
      console.error(err)
      setHistError('Failed to load withdrawal history')
    } finally {
      setHistLoading(false)
    }
  }

  // Initial load
  useEffect(() => {
    loadAll()
    loadTab(activeTab)
    fetchHistory()
  }, [])

  // Reload tab when user switches
  useEffect(() => {
    loadTab(activeTab)
  }, [activeTab])

  // ── Handlers ──────────────────────────────────────────────────
  const handleReview = async (id, action) => {
    try {
      await walletApi.patch(`/master-admin/requests/${id}`, { action })
      await loadAll()
      await fetchHistory()
      await loadTab(activeTab)
    } catch (err) {
      console.error(err)
      alert(err.response?.data?.message || 'Failed to update request')
    }
  }

  const handleDateChange = e => {
    const { name, value } = e.target
    const next = { ...filters, [name]: value }
    setFilters(next)
    fetchHistory(next)
  }

  const handleRoleChange = e => {
    const next = { ...filters, role: e.target.value }
    setFilters(next)
    fetchHistory(next)
  }

  const handleNameChange = e => {
    setFilters(f => ({ ...f, name: e.target.value }))
  }

  const applyFilters = e => {
    e.preventDefault()
    fetchHistory()
  }

  const clearFilters = () => {
    setFilters(defaultFilters)
    fetchHistory(defaultFilters)
  }

  // ── Loading/Error States ──────────────────────────────────────
  if (loading) return <div className="p-6">Loading…</div>
  if (error)   return <div className="p-6 text-red-600">{error}</div>

  // ── Summary Cards ─────────────────────────────────────────────
  const total_balance     = wallets.reduce((s, w) => s + Number(w.total_balance), 0)
  const available_balance = wallets.reduce((s, w) => s + Number(w.available_balance), 0)
  const withheld_balance  = wallets.reduce((s, w) => s + Number(w.withheld_balance), 0)
  const pending_cashout   = pendingReqs
    .filter(r => r.status === 'pending')
    .reduce((s, r) => s + ((r.amount_requested - r.fee) || 0), 0)

  const summaryCards = [
    { title: 'Total Balance',   value: total_balance,     icon: <Wallet className="w-6 h-6" /> },
    { title: 'Available',       value: available_balance, icon: <span className="text-indigo-600 text-xl">₦</span> },
    { title: 'Withheld',        value: withheld_balance,  icon: <CreditCard className="w-6 h-6" /> },
    { title: 'Pending Cashout', value: pending_cashout,   icon: <RefreshCw className="w-6 h-6" /> },
  ]

  // ── Render ────────────────────────────────────────────────────
  return (
    <div className="p-6 space-y-8">
      {/* Pending Cashouts */}
      <div className="bg-white rounded-2xl shadow p-6 overflow-x-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Pending Cashouts</h2>
          <button onClick={loadAll} className="flex items-center text-sm text-gray-600 hover:text-gray-800">
            Refresh <ChevronDown className="w-4 h-4 ml-1" />
          </button>
        </div>
        {pendingReqs.length === 0 ? (
          <p className="text-gray-500">No pending cashouts.</p>
        ) : (
          <table className="min-w-full text-sm text-left">
            <thead className="bg-gray-100">
              <tr>
                {[
                  'ID','User','Requested','Fee','Net',
                  'Account Name','Account Number','Bank Name',
                  'Date','Actions'
                ].map(h => <th key={h} className="px-4 py-2">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {pendingReqs.map(r => {
                const net = r.amount_requested - r.fee
                return (
                  <tr key={r.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-2">{r.id}</td>
                    <td className="px-4 py-2">{r.user_unique_id}</td>
                    <td className="px-4 py-2">₦{r.amount_requested.toLocaleString()}</td>
                    <td className="px-4 py-2">₦{r.fee.toLocaleString()}</td>
                    <td className="px-4 py-2">₦{net.toLocaleString()}</td>
                    <td className="px-4 py-2">{r.account_name}</td>
                    <td className="px-4 py-2">{r.account_number}</td>
                    <td className="px-4 py-2">{r.bank_name}</td>
                    <td className="px-4 py-2">{new Date(r.requested_at).toLocaleDateString()}</td>
                    <td className="px-4 py-2 space-x-2">
                      <button onClick={() => handleReview(r.id, 'approve')} className="px-2 py-1 bg-green-500 text-white rounded">Approve</button>
                      <button onClick={() => handleReview(r.id, 'reject')}  className="px-2 py-1 bg-red-500 text-white rounded">Reject</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {summaryCards.map(({ title, value, icon }) => (
          <div key={title} className="bg-white rounded-2xl shadow p-6 flex items-center">
            <div className="p-3 bg-indigo-50 rounded-full text-indigo-600 mr-4">{icon}</div>
            <div>
              <p className="text-sm text-gray-500">{title}</p>
              <p className="text-2xl font-semibold">₦{value.toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabbed Wallets */}
      <div className="bg-white rounded-2xl shadow p-6">
  <div className="border-b mb-4 flex space-x-4">
    {TABS.map(t => (
      <button
        key={t.key}
        onClick={() => setActiveTab(t.key)}
        className={`pb-2 ${activeTab===t.key
          ? 'border-b-2 border-indigo-600 text-indigo-600'
          : 'text-gray-600 hover:text-gray-800'}`}
      >
        {t.label}
      </button>
    ))}
  </div>

  {tabLoading ? (
    <p>Loading {TABS.find(t=>t.key===activeTab).label}…</p>
  ) : tabError ? (
    <p className="text-red-600">{tabError}</p>
  ) : (
    <table className="min-w-full text-sm text-left">
      <thead className="bg-gray-100">
        <tr>
          {[
            'Name','User ID','Role',
            'Total','Available','Withheld','Pending Cashout'
          ].map(h => (
            <th key={h} className="px-4 py-2">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {(tabData[activeTab]||[]).map(w => (
          <tr key={w.user_unique_id} className="border-b hover:bg-gray-50">
            <td className="px-4 py-2">{w.name}</td>
            <td className="px-4 py-2">{w.user_unique_id}</td>
            <td className="px-4 py-2 capitalize">{w.role}</td>
            <td className="px-4 py-2">₦{w.total_balance.toLocaleString()}</td>
            <td className="px-4 py-2">₦{w.available_balance.toLocaleString()}</td>
            <td className="px-4 py-2">₦{w.withheld_balance.toLocaleString()}</td>
            <td className="px-4 py-2">₦{w.pending_cashout.toLocaleString()}</td>
          </tr>
        ))}
        {!((tabData[activeTab]||[]).length) && (
          <tr>
            <td colSpan={7} className="p-4 text-center text-gray-500">
              No data to display.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  )}
</div>

      {/* Withdrawal History */}
      <div className="bg-white rounded-2xl shadow p-6 overflow-x-auto">
        <h2 className="text-lg font-semibold mb-4">Withdrawal History</h2>
        <form onSubmit={applyFilters} className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-4">
          <input
            type="date" name="startDate" value={filters.startDate}
            onChange={handleDateChange}
            className="border rounded p-2"
          />
          <input
            type="date" name="endDate" value={filters.endDate}
            onChange={handleDateChange}
            className="border rounded p-2"
          />
          <input
            type="text" name="name" placeholder="Name"
            value={filters.name} onChange={handleNameChange}
            className="border rounded p-2"
          />
          <select
            name="role" value={filters.role} onChange={handleRoleChange}
            className="border rounded p-2"
          >
            <option value="">All Roles</option>
            <option value="Marketer">Marketer</option>
            <option value="Admin">Admin</option>
            <option value="SuperAdmin">SuperAdmin</option>
          </select>
          <button
            type="submit"
            className="bg-indigo-600 text-white rounded p-2 hover:bg-indigo-700"
          >
            Filter
          </button>
          <button
            type="button" onClick={clearFilters}
            className="bg-gray-200 text-gray-700 rounded p-2 hover:bg-gray-300"
          >
            Clear
          </button>
        </form>

        {histLoading ? (
          <p>Loading history…</p>
        ) : histError ? (
          <p className="text-red-600">{histError}</p>
        ) : (
          <table className="min-w-full text-sm text-left">
            <thead className="bg-gray-100">
              <tr>
                {[
                  'Date','Name','Role','Unique ID','Phone',
                  'Account Name','Bank','Account #',
                  'Requested','Fee','Net','Status'
                ].map(h => <th key={h} className="px-4 py-2">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr>
                  <td colSpan={12} className="p-4 text-center text-gray-500">
                    No withdrawal history found.
                  </td>
                </tr>
              ) : history.map(r => (
                <tr key={r.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-2">{new Date(r.date).toLocaleDateString()}</td>
                  <td className="px-4 py-2">{r.name}</td>
                  <td className="px-4 py-2 capitalize">{r.role}</td>
                  <td className="px-4 py-2">{r.unique_id}</td>
                  <td className="px-4 py-2">{r.phone}</td>
                  <td className="px-4 py-2">{r.account_name}</td>
                  <td className="px-4 py-2">{r.bank_name}</td>
                  <td className="px-4 py-2">{r.account_number}</td>
                  <td className="px-4 py-2">₦{Number(r.amount).toLocaleString()}</td>
                  <td className="px-4 py-2">₦{Number(r.fee).toLocaleString()}</td>
                  <td className="px-4 py-2">₦{Number(r.net_amount).toLocaleString()}</td>
                  <td className="px-4 py-2 capitalize">{r.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
