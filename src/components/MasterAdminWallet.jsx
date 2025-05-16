// src/components/MasterAdminWallet.jsx

import React, { useEffect, useState } from 'react'
import { Wallet, CreditCard, RefreshCw, ChevronDown } from 'lucide-react'
import walletApi from '../api/walletApi'  // baseURL = VITE_API_URL + '/api/wallets'

const TABS = [
  { key: 'marketers',   label: "Marketers' Wallets",   endpoint: '/master-admin/marketers'  },
  { key: 'admins',      label: "Admins' Wallets",      endpoint: '/master-admin/admins'      },
  { key: 'superadmins', label: "SuperAdmins' Wallets", endpoint: '/master-admin/superadmins' }
]

export default function MasterAdminWallet() {
  // ── Summary & Pending ────────────────────────────────────────
  const [wallets,  setWallets]  = useState([])
  const [pending,  setPending]  = useState([])

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

  // ── loadAll: summary (marketers) + pending requests ───────────
  const loadAll = async () => {
    setLoading(true)
    setError(null)
    try {
      const [mkRes, reqRes] = await Promise.all([
        walletApi.get('/master-admin/marketers'),
        walletApi.get('/master-admin/requests'),
      ])
      setWallets( mkRes.data.wallets   || [] )
      setPending( reqRes.data.requests || [] )
    } catch (e) {
      console.error(e)
      setError('Failed to load wallets or requests')
    } finally {
      setLoading(false)
    }
  }

  // ── loadTab: whichever tab is active ──────────────────────────
  const loadTab = async key => {
    setTabLoading(true)
    setTabError(null)
    try {
      const tab = TABS.find(t => t.key === key)
      if (!tab) throw new Error('Unknown tab '+key)
      const res = await walletApi.get(tab.endpoint)
      setTabData(d => ({ ...d, [key]: res.data.wallets || [] }))
    } catch (e) {
      console.error(e)
      setTabError(`Failed to load ${tab.label}`)
    } finally {
      setTabLoading(false)
    }
  }

  // ── fetchHistory: full withdrawal history ────────────────────
  const fetchHistory = async (params) => {
    setHistLoading(true)
    setHistError(null)
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
  }, [activeTab])

  // ── Approve / Reject ─────────────────────────────────────────
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

  // ── loading / error UI ───────────────────────────────────────
  if (loading) return <div className="p-6">Loading…</div>
  if (error)   return <div className="p-6 text-red-600">{error}</div>

  // ── compute summary cards ────────────────────────────────────
  const total     = wallets.reduce((sum, w) => sum + Number(w.total_balance||0), 0)
  const available = wallets.reduce((sum, w) => sum + Number(w.available_balance||0), 0)
  const withheld  = wallets.reduce((sum, w) => sum + Number(w.withheld_balance||0), 0)
  const pendSum   = pending
    .filter(r => r.status==='pending')
    .reduce((sum, r) => sum + Number(r.net_amount||0), 0)

  const summaryCards = [
    { title:'Total Balance',   value: total,     icon:<Wallet    className="w-6 h-6"/> },
    { title:'Available',       value: available, icon:<CreditCard className="w-6 h-6"/> },
    { title:'Withheld',        value: withheld,  icon:<CreditCard className="w-6 h-6"/> },
    { title:'Pending Cashout', value: pendSum,   icon:<RefreshCw  className="w-6 h-6"/> },
  ]

  return (
    <div className="p-6 space-y-8">
      {/* Pending Cashouts */}
      <div className="bg-white p-6 rounded-2xl shadow overflow-x-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Pending Cashouts</h2>
          <button onClick={loadAll} className="flex items-center text-sm text-gray-600 hover:text-gray-800">
            Refresh <ChevronDown className="w-4 h-4 ml-1"/>
          </button>
        </div>
        {pending.length===0
          ? <p className="text-gray-500">No pending cashouts.</p>
          : <table className="min-w-full text-sm text-left">
              <thead className="bg-gray-100">
                <tr>
                  {['ID','User','Requested','Fee','Net','Account Name','Account Number','Bank','Date','Actions']
                   .map(h => <th key={h} className="px-4 py-2">{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {pending.map(r => {
                  const req = +r.amount_requested||0
                  const fee = +r.fee||0
                  const net = +r.net_amount||0
                  return (
                    <tr key={r.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-2">{r.id}</td>
                      <td className="px-4 py-2">{r.user_unique_id}</td>
                      <td className="px-4 py-2">₦{req.toLocaleString()}</td>
                      <td className="px-4 py-2">₦{fee.toLocaleString()}</td>
                      <td className="px-4 py-2">₦{net.toLocaleString()}</td>
                      <td className="px-4 py-2">{r.account_name}</td>
                      <td className="px-4 py-2">{r.account_number}</td>
                      <td className="px-4 py-2">{r.bank_name}</td>
                      <td className="px-4 py-2">{new Date(r.requested_at).toLocaleDateString()}</td>
                      <td className="px-4 py-2 space-x-2">
                        <button
                          disabled={actioning}
                          onClick={()=>handleReview(r.id,'approve')}
                          className="px-2 py-1 bg-green-500 text-white rounded"
                        >Approve</button>
                        <button
                          disabled={actioning}
                          onClick={()=>handleReview(r.id,'reject')}
                          className="px-2 py-1 bg-red-500 text-white rounded"
                        >Reject</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
        }
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {summaryCards.map(({title,value,icon})=>(
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
      <div className="bg-white rounded-2xl shadow p-6 overflow-x-auto">
        <div className="border-b mb-4 flex space-x-4">
          {TABS.map(t=>(
            <button
              key={t.key}
              onClick={()=>setActiveTab(t.key)}
              className={`pb-2 ${activeTab===t.key 
                ? 'border-b-2 border-indigo-600 text-indigo-600' 
                : 'text-gray-600 hover:text-gray-800'}`}
            >{t.label}</button>
          ))}
        </div>
        {tabLoading
          ? <p>Loading {TABS.find(t=>t.key===activeTab).label}…</p>
          : tabError
            ? <p className="text-red-600">{tabError}</p>
            : <table className="min-w-full text-sm text-left">
                <thead className="bg-gray-100">
                  <tr>
                    {['Name','User ID','Role','Total','Available','Withheld','Pending Cashout']
                     .map(h=> <th key={h} className="px-4 py-2">{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {(tabData[activeTab]||[]).map(w=>(
                    <tr key={w.user_unique_id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-2">{w.name}</td>
                      <td className="px-4 py-2">{w.user_unique_id}</td>
                      <td className="px-4 py-2 capitalize">{w.role}</td>
                      <td className="px-4 py-2">₦{Number(w.total_balance||0).toLocaleString()}</td>
                      <td className="px-4 py-2">₦{Number(w.available_balance||0).toLocaleString()}</td>
                      <td className="px-4 py-2">₦{Number(w.withheld_balance||0).toLocaleString()}</td>
                      <td className="px-4 py-2">₦{Number(w.pending_cashout||0).toLocaleString()}</td>
                    </tr>
                  ))}
                  {! (tabData[activeTab]||[]).length && (
                    <tr><td colSpan={7} className="p-4 text-center text-gray-500">No data to display.</td></tr>
                  )}
                </tbody>
              </table>
        }
      </div>

      {/* Withdrawal History */}
      <div className="bg-white rounded-2xl shadow p-6 overflow-x-auto">
        <h2 className="text-lg font-semibold mb-4">Withdrawal History</h2>
        <form onSubmit={applyFilters} className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-4">
          <input type="date" name="startDate" value={filters.startDate} onChange={handleDateChange} className="border rounded p-2"/>
          <input type="date" name="endDate"   value={filters.endDate}   onChange={handleDateChange} className="border rounded p-2"/>
          <input type="text" name="name"        value={filters.name}      onChange={handleNameChange} className="border rounded p-2" placeholder="Name"/>
          <select     name="role"        value={filters.role}      onChange={handleRoleChange} className="border rounded p-2">
            <option value="">All Roles</option>
            <option value="Marketer">Marketer</option>
            <option value="Admin">Admin</option>
            <option value="SuperAdmin">SuperAdmin</option>
          </select>
          <button type="submit" className="bg-indigo-600 text-white rounded p-2 hover:bg-indigo-700">Filter</button>
          <button type="button" onClick={clearFilters} className="bg-gray-200 text-gray-700 rounded p-2 hover:bg-gray-300">Clear</button>
        </form>
        {histLoading
          ? <p>Loading history…</p>
          : histError
            ? <p className="text-red-600">{histError}</p>
            : <table className="min-w-full text-sm text-left">
                <thead className="bg-gray-100">
                  <tr>
                    {['Date','Name','Role','Unique ID','Phone','Account Name','Bank','Account #','Requested','Fee','Net','Status']
                     .map(h=> <th key={h} className="px-4 py-2">{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {!history.length
                    ? <tr><td colSpan={12} className="p-4 text-center text-gray-500">No withdrawal history found.</td></tr>
                    : history.map(r=>(
                        <tr key={r.id} className="border-b hover:bg-gray-50">
                          <td className="px-4 py-2">{new Date(r.date).toLocaleDateString()}</td>
                          <td className="px-4 py-2">{r.name}</td>
                          <td className="px-4 py-2 capitalize">{r.role}</td>
                          <td className="px-4 py-2">{r.unique_id}</td>
                          <td className="px-4 py-2">{r.phone}</td>
                          <td className="px-4 py-2">{r.account_name}</td>
                          <td className="px-4 py-2">{r.bank_name}</td>
                          <td className="px-4 py-2">{r.account_number}</td>
                          <td className="px-4 py-2">₦{Number(r.amount||0).toLocaleString()}</td>
                          <td className="px-4 py-2">₦{Number(r.fee||0).toLocaleString()}</td>
                          <td className="px-4 py-2">₦{Number(r.net_amount||0).toLocaleString()}</td>
                          <td className="px-4 py-2 capitalize">{r.status}</td>
                        </tr>
                      ))
                  }
                </tbody>
              </table>
        }
      </div>
    </div>
  )
}
