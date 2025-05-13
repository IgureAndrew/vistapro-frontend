// src/components/Wallet.jsx
import React, { useEffect, useState } from 'react'
import { CopyIcon } from 'lucide-react'
import walletApi from '../api/walletApi'

export default function Wallet() {
  // your balances + bank info
  const [wallet, setWallet] = useState({
    total_balance:     0,
    available_balance: 0,
    withheld_balance:  0,
    account_name:      '',
    account_number:    '',
    bank_name:         '',
  })

  // your recent transactions
  const [transactions, setTransactions] = useState([])

  // your withdrawal history
  const [withdrawals, setWithdrawals] = useState([])

  // form fields
  const [form, setForm] = useState({
    amount:         '',
    account_name:   '',
    account_number: '',
    bank_name:      ''
  })

  // error banner
  const [error, setError] = useState('')

  // loading flags
  const [loading, setLoading] = useState({
    wallet:      true,
    withdrawals: true,
  })

  // — 1) load wallet + transactions + prefill form
  const loadWallet = async () => {
    setLoading(l => ({ ...l, wallet: true }))
    try {
      const resp   = await walletApi.get('/')
      const payload = resp.data
      const w       = payload.wallet ?? payload

      setWallet({
        total_balance:     w.total_balance   ?? 0,
        available_balance: w.available_balance ?? 0,
        withheld_balance:  w.withheld_balance  ?? 0,
        account_name:      w.account_name    ?? '',
        account_number:    w.account_number  ?? '',
        bank_name:         w.bank_name       ?? ''
      })

      setTransactions(payload.transactions ?? [])

      // prefill banking fields
      setForm(f => ({
        ...f,
        account_name:   w.account_name    ?? '',
        account_number: w.account_number  ?? '',
        bank_name:      w.bank_name       ?? ''
      }))
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(l => ({ ...l, wallet: false }))
    }
  }

  // — 2) load withdrawal history
  const loadWithdrawals = async () => {
    setLoading(l => ({ ...l, withdrawals: true }))
    try {
      const { data } = await walletApi.get('/withdrawals')
      setWithdrawals(data.requests ?? [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(l => ({ ...l, withdrawals: false }))
    }
  }

  useEffect(() => {
    loadWallet()
    loadWithdrawals()
  }, [])

  // your max withdrawal = available − fee
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
      // clear the amount only
      setForm(f => ({ ...f, amount: '' }))
      await loadWallet()
      await loadWithdrawals()
    } catch (err) {
      setError(err.response?.data?.message || 'Withdrawal failed')
    }
  }

  if (loading.wallet) {
    return <div className="p-6 text-center">Loading wallet…</div>
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50">

      {/* ── BALANCES ──────────────────────────────────── */}
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

      {/* ── WITHDRAWAL FORM ───────────────────────────── */}
      <form onSubmit={handleSubmit} className="bg-white p-4 rounded shadow space-y-3">
        <h3 className="text-lg font-semibold">Request Withdrawal</h3>
        <p className="text-sm text-gray-600">
         You may withdraw up to <strong>₦{maxWithdraw.toLocaleString()}</strong><br/>
         <span className="text-red-500 text-xs">₦100 fee applies</span>
       </p>
        {/* live breakdown */}
      {form.amount && Number(form.amount) > 0 && (
        <div className="text-sm text-gray-700">
          <em>
            Gross total:&nbsp;
            ₦{Number(form.amount).toLocaleString()}&nbsp;+&nbsp;₦100&nbsp;=&nbsp;
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

      {/* ── RECENT TRANSACTIONS ────────────────────────── */}
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
                <td className="px-2 py-1">
                  {tx.created_at
                    ? new Date(tx.created_at).toLocaleString()
                    : '–'}
                </td>
                <td className="px-2 py-1">{tx.transaction_type}</td>
                <td
                  className={`px-2 py-1 font-semibold ${
                    tx.amount < 0 ? 'text-red-600' : 'text-green-600'
                  }`}
                >
                  ₦{Math.abs(tx.amount).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── WITHDRAWAL HISTORY ────────────────────────── */}
      <div className="bg-white p-4 rounded shadow overflow-x-auto">
        <h3 className="font-semibold mb-2">Withdrawal History</h3>
        {loading.withdrawals
          ? <div className="text-center text-gray-500">Loading…</div>
          : (
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-2 py-1 text-left">Date</th>
                <th className="px-2 py-1 text-left">Amount + Fee</th>
                 <th className="px-2 py-1 text-left">Total</th>
                 <th className="px-2 py-1 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {withdrawals.map(w => (
                  <tr key={w.id}>
                    <td className="px-2 py-1">
                      {w.requested_at
                        ? new Date(w.requested_at).toLocaleString()
                        : '–'}
                    </td>
                    <td className="px-2 py-1">
                       ₦{w.amount.toLocaleString()} + ₦{w.fee.toLocaleString()}
                     </td>
                      <td className="px-2 py-1 font-semibold">
                        ₦{gross.toLocaleString()}
                      </td>
                    <td className="px-2 py-1">{w.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
      </div>
    </div>
  )
}
