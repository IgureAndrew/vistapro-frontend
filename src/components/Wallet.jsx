// src/components/Wallet.jsx
import React, { useEffect, useState } from 'react'
import { CopyIcon } from 'lucide-react'
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
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(true)

  // Load everything in one go
  const loadAll = async () => {
    setLoading(true)
    try {
      const { data } = await walletApi.get('/')
      // data = { wallet, transactions, withdrawals }
      setWallet(data.wallet)
      setTransactions(data.transactions)
      setWithdrawals(data.withdrawals)
      // prefill form bank info
      setForm(f => ({
        ...f,
        account_name:   data.wallet.account_name,
        account_number: data.wallet.account_number,
        bank_name:      data.wallet.bank_name
      }))
    } catch (e) {
      console.error(e)
      setError('Failed to load wallet data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAll()
  }, [])

  // max you can request (available minus fee)
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
    <div className="p-6 space-y-6 bg-gray-50">

      {/* Balances */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          ['Total Balance', wallet.total_balance],
          ['Available',     wallet.available_balance],
          ['Withheld',      wallet.withheld_balance]
        ].map(([label, val]) => (
          <div key={label} className="bg-white p-4 rounded shadow">
            <p className="text-sm text-gray-500">{label}</p>
            <p className="text-2xl font-bold">₦{(val||0).toLocaleString()}</p>
          </div>
        ))}
      </div>

      {/* Withdrawal Form */}
      <form onSubmit={handleSubmit} className="bg-white p-4 rounded shadow space-y-3">
        <h3 className="text-lg font-semibold">Request Withdrawal</h3>
        <p className="text-sm text-gray-600">
          You may withdraw up to <strong>₦{maxWithdraw.toLocaleString()}</strong><br/>
          <span className="text-red-500 text-xs">₦100 fee applies</span>
        </p>

        {/* live gross total */}
        {form.amount && Number(form.amount) > 0 && (
          <div className="text-sm text-gray-700">
            <em>
              Gross total: ₦{Number(form.amount).toLocaleString()} + ₦100 ={' '}
              <strong>₦{(Number(form.amount) + 100).toLocaleString()}</strong>
            </em>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            type="number"
            name="amount"
            min="1"
            max={maxWithdraw}
            value={form.amount}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded"
            placeholder="₦ amount"
            required
          />
          <input
            type="text"
            name="account_name"
            value={form.account_name}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded"
            placeholder="Account Name"
            required
          />
          <input
            type="text"
            name="account_number"
            value={form.account_number}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded"
            placeholder="Account Number"
            required
          />
          <input
            type="text"
            name="bank_name"
            value={form.bank_name}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded"
            placeholder="Bank Name"
            required
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
      <div className="bg-white p-4 rounded shadow overflow-x-auto">
        <h3 className="font-semibold mb-2">Recent Transactions</h3>
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-2 py-1 text-left">Date</th>
              <th className="px-2 py-1 text-left">Type</th>
              <th className="px-2 py-1 text-left">Amount</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map(tx => (
              <tr key={tx.id}>
                <td className="px-2 py-1">{new Date(tx.created_at).toLocaleString()}</td>
                <td className="px-2 py-1">{tx.transaction_type}</td>
                <td className={`px-2 py-1 font-semibold ${tx.amount<0?'text-red-600':'text-green-600'}`}>
                  ₦{Math.abs(tx.amount).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Withdrawal History */}
      <div className="bg-white p-4 rounded shadow overflow-x-auto">
        <h3 className="font-semibold mb-2">Withdrawal History</h3>
        <table className="w-full text-sm">
  <thead className="bg-gray-100">
    <tr>
      <th>Date</th>
      <th>Amount + Fee</th>
      <th>Total</th>
      <th>Status</th>
    </tr>
  </thead>
  <tbody>
    {withdrawals.map(w => {
      const gross = w.amount + w.fee;        // now numeric
      return (
        <tr key={w.id}>
          <td>{new Date(w.requested_at).toLocaleString()}</td>
          <td>₦{w.amount.toLocaleString()} + ₦{w.fee.toLocaleString()}</td>
          <td>₦{gross.toLocaleString()}</td>
          <td>{w.status}</td>
        </tr>
      )
    })}
  </tbody>
</table>
      </div>
    </div>
  )
}
