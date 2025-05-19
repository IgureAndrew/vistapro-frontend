// src/components/Wallet.jsx
import React, { useEffect, useState } from 'react'
import walletApi from '../api/walletApi'

export default function Wallet() {
  const [wallet,     setWallet]     = useState({
    total_balance:     0,
    available_balance: 0,
    withheld_balance:  0,
    account_name:      '',
    account_number:    '',
    bank_name:         '',
  })
  const [transactions, setTransactions] = useState([])
  const [withdrawals,  setWithdrawals]  = useState([])
  const [form,         setForm]         = useState({
    amount:         '',
    account_name:   '',
    account_number: '',
    bank_name:      ''
  })
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(true)

  const loadAll = async () => {
    setLoading(true)
    try {
      const { data } = await walletApi.get('/')
      setWallet(data.wallet)
      setTransactions(data.transactions)
      setWithdrawals(data.withdrawals)
      setForm(f => ({
        ...f,
        account_name:   data.wallet.account_name,
        account_number: data.wallet.account_number,
        bank_name:      data.wallet.bank_name
      }))
    } catch {
      setError('Failed to load wallet data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(loadAll, [])

  const fee = 100
  const maxWithdraw = Math.max(wallet.available_balance - fee, 0)

  const handleChange = e => {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
  }

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    try {
      await walletApi.post('/withdraw', {
        amount:         Number(form.amount),
        account_name:   form.account_name,
        account_number: form.account_number,
        bank_name:      form.bank_name
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
    <div className="p-4 max-w-4xl mx-auto space-y-6">
      {/* Balances */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          ['Total Balance', wallet.total_balance],
          ['Available',     wallet.available_balance],
          ['Withheld',      wallet.withheld_balance]
        ].map(([label, val]) => (
          <div key={label} className="bg-white p-4 rounded-lg shadow flex flex-col">
            <span className="text-sm text-gray-500">{label}</span>
            <span className="mt-2 text-2xl font-bold">₦{(val||0).toLocaleString()}</span>
          </div>
        ))}
      </div>

      {/* Withdrawal Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white p-4 rounded-lg shadow grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        <div>
          <label className="block mb-1 font-medium">Amount</label>
          <input
            type="number"
            name="amount"
            min="1"
            max={maxWithdraw}
            value={form.amount}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            placeholder="₦ amount"
            required
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Account Name</label>
          <input
            type="text"
            name="account_name"
            value={form.account_name}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            placeholder="Account Name"
            required
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Account Number</label>
          <input
            type="text"
            name="account_number"
            value={form.account_number}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            placeholder="Account Number"
            required
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Bank Name</label>
          <input
            type="text"
            name="bank_name"
            value={form.bank_name}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            placeholder="Bank Name"
            required
          />
        </div>

        {/* Fee & Gross Preview spans both columns */}
        <div className="md:col-span-2 text-sm text-gray-700">
          You may withdraw up to <strong>₦{maxWithdraw.toLocaleString()}</strong>
          <span className="text-red-500 block">₦{fee.toLocaleString()} fee applies</span>
          {form.amount && Number(form.amount) > 0 && (
            <div className="mt-1 italic">
              Gross total: ₦{Number(form.amount).toLocaleString()} + ₦{fee.toLocaleString()} ={' '}
              <strong>₦{(Number(form.amount) + fee).toLocaleString()}</strong>
            </div>
          )}
        </div>

        {/* Submit spans both */}
        <button
          type="submit"
          disabled={!form.amount || Number(form.amount) > maxWithdraw}
          className="md:col-span-2 w-full py-2 font-semibold text-white rounded bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
        >
          Withdraw
        </button>

        {error && <p className="md:col-span-2 text-red-600">{error}</p>}
      </form>

      {/* Recent Transactions */}
      <div className="bg-white p-4 rounded-lg shadow overflow-x-auto">
        <h3 className="font-semibold mb-2">Recent Transactions</h3>
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-2 py-1 text-left">Date</th>
              <th className="hidden sm:table-cell px-2 py-1 text-left">Type</th>
              <th className="px-2 py-1 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map(tx => (
              <tr key={tx.id} className="hover:bg-gray-50">
                <td className="px-2 py-1">{new Date(tx.created_at).toLocaleString()}</td>
                <td className="hidden sm:table-cell px-2 py-1">{tx.transaction_type}</td>
                <td className={`px-2 py-1 text-right font-semibold ${tx.amount < 0 ? 'text-red-600' : 'text-green-600'}`}>
                  ₦{Math.abs(tx.amount).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Withdrawal History */}
      <div className="bg-white p-4 rounded-lg shadow overflow-x-auto">
        <h3 className="font-semibold mb-2">Withdrawal History</h3>
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-2 py-1 text-left">Date</th>
              <th className="hidden sm:table-cell px-2 py-1 text-right">Amount</th>
              <th className="px-2 py-1 text-right">Fee</th>
              <th className="px-2 py-1 text-right">Total</th>
              <th className="hidden md:table-cell px-2 py-1 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {withdrawals.map(w => {
              const gross = w.amount + w.fee
              return (
                <tr key={w.id} className="hover:bg-gray-50">
                  <td className="px-2 py-1">{new Date(w.requested_at).toLocaleString()}</td>
                  <td className="hidden sm:table-cell px-2 py-1 text-right">₦{w.amount.toLocaleString()}</td>
                  <td className="px-2 py-1 text-right">₦{w.fee.toLocaleString()}</td>
                  <td className="px-2 py-1 text-right">₦{gross.toLocaleString()}</td>
                  <td className="hidden md:table-cell px-2 py-1">{w.status}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
