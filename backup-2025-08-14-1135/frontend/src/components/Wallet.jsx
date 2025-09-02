// src/components/Wallet.jsx
import React, { useEffect, useState } from 'react'
import walletApi from '../api/walletApi'

export default function Wallet() {
  const [wallet, setWallet] = useState({
    total_balance: 0,
    available_balance: 0,
    withheld_balance: 0,
    account_name: '',
    account_number: '',
    bank_name: '',
  })
  const [transactions, setTransactions] = useState([])
  const [withdrawals, setWithdrawals] = useState([])
  const [form, setForm] = useState({
    amount: '',
    account_name: '',
    account_number: '',
    bank_name: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  // Load balances, txns, withdrawals
  const loadAll = async () => {
    setLoading(true)
    try {
      const { data } = await walletApi.get('/')
      setWallet(data.wallet)
      setTransactions(data.transactions)
      setWithdrawals(data.withdrawals)
      setForm(f => ({
        ...f,
        account_name: data.wallet.account_name,
        account_number: data.wallet.account_number,
        bank_name: data.wallet.bank_name
      }))
    } catch {
      setError('Failed to load wallet data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAll()
  }, [])

  const maxWithdraw = Math.max(wallet.available_balance - 100, 0)

  const handleChange = e => {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
  }

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    try {
      await walletApi.post('/withdraw', {
        amount: Number(form.amount),
        account_name: form.account_name,
        account_number: form.account_number,
        bank_name: form.bank_name
      })
      setForm(f => ({ ...f, amount: '' }))
      await loadAll()
    } catch (err) {
      setError(err.response?.data?.message || 'Withdrawal failed')
    }
  }

  if (loading) {
    return <div className="p-6 text-center">Loading wallet…</div>
  }

  return (
    <div className="px-4 py-6 max-w-3xl mx-auto space-y-6">

      {/* Balances */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          ['Total Balance', wallet.total_balance],
          ['Available', wallet.available_balance],
          ['Withheld', wallet.withheld_balance]
        ].map(([label, val]) => (
          <div key={label} className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-500">{label}</p>
            <p className="mt-1 text-2xl font-bold">₦{(val || 0).toLocaleString()}</p>
          </div>
        ))}
      </div>

      {/* Withdrawal Form */}
      <form onSubmit={handleSubmit} className="bg-white p-4 rounded-lg shadow space-y-4">
        <h3 className="text-lg font-semibold">Request Withdrawal</h3>
        <p className="text-sm text-gray-600">
          Up to <strong>₦{maxWithdraw.toLocaleString()}</strong> (₦100 fee)
        </p>

        {/* Gross preview */}
        {form.amount && Number(form.amount) > 0 && (
          <p className="text-sm text-gray-700">
            ₦{Number(form.amount).toLocaleString()} + ₦100 ={' '}
            <strong>₦{(Number(form.amount) + 100).toLocaleString()}</strong>
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            type="number"
            name="amount"
            min="1"
            max={maxWithdraw}
            value={form.amount}
            onChange={handleChange}
            placeholder="Amount ₦"
            required
            className="w-full border rounded px-3 py-2"
          />
          <input
            type="text"
            name="account_name"
            value={form.account_name}
            onChange={handleChange}
            placeholder="Account Name"
            required
            className="w-full border rounded px-3 py-2"
          />
          <input
            type="text"
            name="account_number"
            value={form.account_number}
            onChange={handleChange}
            placeholder="Account Number"
            required
            className="w-full border rounded px-3 py-2"
          />
          <input
            type="text"
            name="bank_name"
            value={form.bank_name}
            onChange={handleChange}
            placeholder="Bank Name"
            required
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <button
          type="submit"
          disabled={!form.amount || form.amount > maxWithdraw}
          className="w-full bg-indigo-600 text-white py-2 rounded disabled:opacity-50"
        >
          Withdraw
        </button>
        {error && <p className="text-red-600 text-sm">{error}</p>}
      </form>

      {/* Recent Transactions */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Recent Transactions</h3>

        {/* Mobile cards */}
        <div className="sm:hidden space-y-3">
          {transactions.length === 0 ? (
            <p className="text-gray-500">No transactions.</p>
          ) : transactions.map(tx => (
            <div key={tx.id} className="bg-white p-3 rounded-lg shadow">
              <p className="text-sm text-gray-600">
                {new Date(tx.created_at).toLocaleString()}
              </p>
              <p className="font-medium">{tx.transaction_type}</p>
              <p className={`mt-1 font-semibold ${tx.amount < 0 ? 'text-red-600' : 'text-green-600'}`}>
                ₦{Math.abs(tx.amount).toLocaleString()}
              </p>
            </div>
          ))}
        </div>

        {/* Table on sm+ */}
        <div className="hidden sm:block bg-white rounded-lg shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 text-gray-600">
              <tr>
                <th className="px-3 py-2 text-left">Date</th>
                <th className="px-3 py-2 text-left">Type</th>
                <th className="px-3 py-2 text-left">Amount</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(tx => (
                <tr key={tx.id} className="border-b">
                  <td className="px-3 py-2">{new Date(tx.created_at).toLocaleString()}</td>
                  <td className="px-3 py-2">{tx.transaction_type}</td>
                  <td className={`px-3 py-2 font-semibold ${tx.amount < 0 ? 'text-red-600' : 'text-green-600'}`}>
                    ₦{Math.abs(tx.amount).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Withdrawal History */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Withdrawal History</h3>

        {/* Mobile cards */}
        <div className="sm:hidden space-y-3">
          {withdrawals.length === 0 ? (
            <p className="text-gray-500">No withdrawals.</p>
          ) : withdrawals.map(w => {
            const gross = w.amount + w.fee
            return (
              <div key={w.id} className="bg-white p-3 rounded-lg shadow">
                <p className="text-sm text-gray-600">
                  {new Date(w.requested_at).toLocaleString()}
                </p>
                <p className="mt-1">
                  ₦{w.amount.toLocaleString()} + ₦{w.fee.toLocaleString()}
                </p>
                <p className="font-semibold">Total ₦{gross.toLocaleString()}</p>
                <p className="mt-1">{w.status}</p>
              </div>
            )
          })}
        </div>

        {/* Table on sm+ */}
        <div className="hidden sm:block bg-white rounded-lg shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 text-gray-600">
              <tr>
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Amt + Fee</th>
                <th className="px-3 py-2">Total</th>
                <th className="px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {withdrawals.map(w => {
                const gross = w.amount + w.fee
                return (
                  <tr key={w.id} className="border-b">
                    <td className="px-3 py-2">{new Date(w.requested_at).toLocaleString()}</td>
                    <td className="px-3 py-2">
                      ₦{w.amount.toLocaleString()} + ₦{w.fee.toLocaleString()}
                    </td>
                    <td className="px-3 py-2">₦{gross.toLocaleString()}</td>
                    <td className="px-3 py-2">{w.status}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
