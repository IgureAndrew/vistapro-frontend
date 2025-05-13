// src/components/MasterAdminWallet.jsx
import React, { useEffect, useState } from 'react'
import {
  Wallet,
  CreditCard,
  RefreshCw,
  ChevronDown
} from 'lucide-react'
import walletApi from '../api/walletApi'

export default function MasterAdminWallet() {
  // ── state ────────────────────────────────────────────────────
  const [wallets, setWallets]         = useState([])
  const [pendingReqs, setPendingReqs] = useState([])
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState(null)

  // ── data loaders ──────────────────────────────────────────────
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

  useEffect(() => {
    loadAll()
  }, [])

  // ── handle approve / reject ───────────────────────────────────
  const handleReview = async (id, action) => {
    try {
      await walletApi.patch(`/master-admin/requests/${id}`, { action })
      await loadAll()
    } catch (err) {
      console.error(err)
      alert(err.response?.data?.message || 'Failed to update request')
    }
  }

  // ── loading / error states ────────────────────────────────────
  if (loading) return <div className="p-6">Loading…</div>
  if (error)   return <div className="p-6 text-red-600">{error}</div>

  // ── aggregate totals ──────────────────────────────────────────
  const total_balance     = wallets.reduce((sum, w) => sum + Number(w.total_balance), 0)
  const available_balance = wallets.reduce((sum, w) => sum + Number(w.available_balance), 0)
  const withheld_balance  = wallets.reduce((sum, w) => sum + Number(w.withheld_balance), 0)
  // sum of net_amount for all pending requests:
  const pending_cashout = pendingReqs
    .filter(r => r.status === 'pending')
    .reduce((sum, r) => sum + ((r.amount_requested - r.fee) || 0), 0)

  const summaryCards = [
    { title: 'Total Balance',  value: total_balance,     icon: <Wallet className="w-6 h-6" /> },
    { title: 'Available',      value: available_balance, icon: <span className="text-indigo-600 text-xl">₦</span> },
    { title: 'Withheld',       value: withheld_balance,  icon: <CreditCard className="w-6 h-6" /> },
    { title: 'Pending Cashout',value: pending_cashout,   icon: <RefreshCw className="w-6 h-6" /> },
  ]

  return (
    <div className="p-6 space-y-8">

      {/* ── PENDING CASHOUTS ─────────────────────────────────── */}
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
                {['ID','User','Requested','Fee','Net','Date','Actions'].map(h => (
                  <th key={h} className="px-4 py-2">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pendingReqs.map(r => {
                const net = r.net_amount
                return (
                  <tr key={r.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-2">{r.id}</td>
                    <td className="px-4 py-2">{r.user_unique_id}</td>
                    <td className="px-4 py-2">₦{Number(r.amount).toLocaleString()}</td>
                    <td className="px-4 py-2">₦{Number(r.fee).toLocaleString()}</td>
                    <td className="px-4 py-2">₦{Number(net).toLocaleString()}</td>
                    <td className="px-4 py-2">{new Date(r.requested_at).toLocaleDateString()}</td>
                    <td className="px-4 py-2 space-x-2">
                      <button
                        onClick={() => handleReview(r.id, 'approve')}
                        className="px-2 py-1 bg-green-500 text-white rounded"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleReview(r.id, 'reject')}
                        className="px-2 py-1 bg-red-500 text-white rounded"
                      >
                        Reject
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── SUMMARY CARDS ───────────────────────────────────────── */}
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

      {/* ── ALL MARKETERS’ WALLETS ─────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow p-6 overflow-x-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">All Marketers’ Wallets</h2>
          <button onClick={loadAll} className="flex items-center text-sm text-gray-600 hover:text-gray-800">
            Refresh <ChevronDown className="w-4 h-4 ml-1" />
          </button>
        </div>
        <table className="min-w-full text-sm text-left">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2">User ID</th>
              <th className="px-4 py-2">Total</th>
              <th className="px-4 py-2">Available</th>
              <th className="px-4 py-2">Withheld</th>
              <th className="px-4 py-2">Pending Cashout</th>
            </tr>
          </thead>
          <tbody>
            {wallets.map(w => (
              <tr key={w.user_unique_id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-2">{w.user_unique_id}</td>
                <td className="px-4 py-2">
  ₦{w.total_balance.toLocaleString()}
</td>
<td className="px-4 py-2">
  ₦{w.available_balance.toLocaleString()}
</td>
<td className="px-4 py-2">
  ₦{w.withheld_balance.toLocaleString()}
</td>
<td className="px-4 py-2">
  ₦{w.pending_cashout.toLocaleString()}
</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
