// src/components/Wallet.jsx
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CopyIcon } from 'lucide-react'
import api from '../api/walletApi'  // axios.create({ baseURL: '/api/wallets' })

export default function Wallet() {
  const navigate = useNavigate()

  // ─── state ──────────────────────────────────────────────────────
  const [wallet, setWallet]             = useState(null)
  const [transactions, setTransactions] = useState([])
  const [withdrawals, setWithdrawals]   = useState([])

  // withdrawal form inputs
  const [amount,      setAmount]      = useState('')
  const [acctName,    setAcctName]    = useState('')
  const [acctNumber,  setAcctNumber]  = useState('')
  const [bankName,    setBankName]    = useState('')
  const [error,       setError]       = useState('')
  const [loading,     setLoading]     = useState({ wallet: true, withdrawals: true })

  // ─── fetch wallet + recent txns ────────────────────────────────
  const fetchWallet = async () => {
    setLoading(l => ({ ...l, wallet: true }))
    try {
      const { data } = await api.get('/')
      setWallet(data.wallet)
      setTransactions(data.transactions)

      // prefill form bank fields if present
      if (data.wallet.account_name) {
        setAcctName(data.wallet.account_name)
        setAcctNumber(data.wallet.account_number)
        setBankName(data.wallet.bank_name)
      }
    } catch (err) {
      if (err.response?.status === 401) navigate('/login')
      else console.error(err)
    } finally {
      setLoading(l => ({ ...l, wallet: false }))
    }
  }

  // ─── fetch withdrawal history ─────────────────────────────────
  const fetchWithdrawals = async () => {
    setLoading(l => ({ ...l, withdrawals: true }))
    try {
      const { data } = await api.get('/withdrawals')
      setWithdrawals(data.requests)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(l => ({ ...l, withdrawals: false }))
    }
  }

  // ─── on-mount ──────────────────────────────────────────────────
  useEffect(() => {
    fetchWallet()
    fetchWithdrawals()
  }, [])

  // ─── copy helper ───────────────────────────────────────────────
  const copyToClipboard = text => {
    navigator.clipboard.writeText(text).catch(() => alert('Copy failed'))
  }

  // ─── submit withdrawal ─────────────────────────────────────────
  const submitWithdrawal = async e => {
    e.preventDefault()
    setError('')
    try {
      await api.post('/withdraw', {
        amount:         Number(amount),
        account_name:   acctName,
        account_number: acctNumber,
        bank_name:      bankName
      })
      setAmount('')
      fetchWallet()
      fetchWithdrawals()
    } catch (err) {
      setError(err.response?.data?.message || 'Withdrawal failed.')
    }
  }

  if (loading.wallet) {
    return <div className="p-6 text-center">Loading wallet…</div>
  }

  const max = Math.max((wallet.available_balance||0) - 100, 0)

  return (
    <div className="p-6 space-y-6 bg-gray-50">

      {/* ─── Balances & pending requests ──────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          ['Total Balance', wallet.total_balance],
          ['Available',     wallet.available_balance],
          ['Withheld',      wallet.withheld_balance],
          ['Pending Requests', withdrawals.filter(w=>w.status==='pending').length]
        ].map(([label,val]) => (
          <div key={label} className="bg-white p-4 rounded shadow">
            <p className="text-sm text-gray-500">{label}</p>
            <p className="text-2xl font-bold">
              {label==='Pending Requests'
                ? val
                : `₦${(val||0).toLocaleString()}`
              }
            </p>
          </div>
        ))}
      </div>

      {/* ─── Stored Bank Details ─────────────────────────────────── */}
      <div className="bg-white p-4 rounded shadow space-y-2">
        <h3 className="font-semibold">Your Bank Details</h3>
        <div className="flex items-center">
          <span className="flex-1">
            Account name: {wallet.account_name || '—'}
          </span>
          {wallet.account_name && (
            <button onClick={()=>copyToClipboard(wallet.account_name)}>
              <CopyIcon size={16}/>
            </button>
          )}
        </div>
        <div className="flex items-center">
          <span className="flex-1">
            Account number: {wallet.account_number||'—'}
          </span>
          {wallet.account_number && (
            <button onClick={()=>copyToClipboard(wallet.account_number)}>
              <CopyIcon size={16}/>
            </button>
          )}
        </div>
        <div className="flex items-center">
          <span className="flex-1">
            Bank name: {wallet.bank_name||'—'}
          </span>
          {wallet.bank_name && (
            <button onClick={()=>copyToClipboard(wallet.bank_name)}>
              <CopyIcon size={16}/>
            </button>
          )}
        </div>
      </div>

      {/* ─── Withdrawal Form ─────────────────────────────────────── */}
      <form onSubmit={submitWithdrawal} className="bg-white p-4 rounded shadow space-y-3">
        <h3 className="text-lg font-semibold">Request Withdrawal</h3>
        <p className="text-sm text-gray-600">
          You may withdraw up to <strong>₦{max.toLocaleString()}</strong><br/>
          <span className="text-red-500 text-xs">₦100 fee applies</span>
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            type="number"
            min="1"
            max={max}
            value={amount}
            onChange={e=>setAmount(e.target.value)}
            className="w-full border px-3 py-2 rounded"
            placeholder="₦ amount"
            required
          />
          <input
            type="text"
            value={acctName}
            onChange={e=>setAcctName(e.target.value)}
            className="w-full border px-3 py-2 rounded"
            placeholder="Account Name"
            required
          />
          <input
            type="text"
            value={acctNumber}
            onChange={e=>setAcctNumber(e.target.value)}
            className="w-full border px-3 py-2 rounded"
            placeholder="Account Number"
            required
          />
          <input
            type="text"
            value={bankName}
            onChange={e=>setBankName(e.target.value)}
            className="w-full border px-3 py-2 rounded"
            placeholder="Bank Name"
            required
          />
        </div>
        <button
          type="submit"
          disabled={!amount || amount>max}
          className="w-full bg-indigo-600 text-white py-2 rounded disabled:opacity-50"
        >
          Withdraw
        </button>
        {error && <p className="text-red-600 text-sm">{error}</p>}
      </form>

      {/* ─── Recent Transactions ─────────────────────────────────── */}
      <div className="bg-white p-4 rounded shadow overflow-x-auto">
        <h3 className="font-semibold mb-2">Recent Transactions</h3>
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              {['Date','Type','Amount'].map(h=>(
                <th key={h} className="px-2 py-1 text-left">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {transactions.map(tx=>(
              <tr key={tx.id}>
                <td className="px-2 py-1">
                  {new Date(tx.created_at).toLocaleString()}
                </td>
                <td className="px-2 py-1">{tx.transaction_type}</td>
                <td className={`px-2 py-1 font-semibold ${
                  tx.amount<0?'text-red-600':'text-green-600'
                }`}>
                  ₦{Math.abs(tx.amount).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ─── Withdrawal History ──────────────────────────────────── */}
      <div className="bg-white p-4 rounded shadow overflow-x-auto">
        <h3 className="font-semibold mb-2">Withdrawal History</h3>
        {loading.withdrawals
          ? <div className="text-center text-gray-500">Loading…</div>
          : (
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  {['Date','Requested','Fee','Total','Status'].map(h=>(
                    <th key={h} className="px-2 py-1 text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {withdrawals.map(w=>(
                  <tr key={w.id}>
                    <td className="px-2 py-1">
                      {new Date(w.requested_at).toLocaleString()}
                    </td>
                    <td className="px-2 py-1">
                      ₦{w.amount.toLocaleString()}
                    </td>
                    <td className="px-2 py-1">
                      ₦{w.fee.toLocaleString()}
                    </td>
                    <td className="px-2 py-1">
                      ₦{(w.amount+w.fee).toLocaleString()}
                    </td>
                    <td className="px-2 py-1">{w.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        }
      </div>
    </div>
  )
}
