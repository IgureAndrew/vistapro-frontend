// src/components/Wallet.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { FilterIcon } from 'lucide-react';
import api from '../api/walletApi'; // axios.create({ baseURL: '/api/wallets' })

export default function Wallet() {
  const navigate = useNavigate();

  // state
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [stats, setStats] = useState([]);
  const [range, setRange] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    to: new Date().toISOString().slice(0, 10)
  });
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState({
    wallet: true,
    stats: false,
    withdrawals: true
  });

  // fetch wallet + transactions
  const fetchWallet = async () => {
    try {
      const { data } = await api.get('/');
      setWallet(data.wallet);
      setTransactions(data.transactions);
    } catch (err) {
      if (err.response?.status === 401) navigate('/login');
    } finally {
      setLoading(l => ({ ...l, wallet: false }));
    }
  };

  // fetch withdrawal history
  const fetchWithdrawals = async () => {
    try {
      const { data } = await api.get('/withdrawals');
      setWithdrawals(data.requests);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(l => ({ ...l, withdrawals: false }));
    }
  };

  // fetch stats (commission & withdrawals)
  const fetchStats = async (r = range) => {
    setLoading(l => ({ ...l, stats: true }));
    try {
      const { data } = await api.get(`/stats?from=${r.from}&to=${r.to}`);
      setStats(data); // backend returns array
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(l => ({ ...l, stats: false }));
    }
  };

  // apply preset ranges
  const applyPreset = label => {
    const now = new Date();
    let fromDate;
    switch (label) {
      case '12 months':
        fromDate = new Date(now);
        fromDate.setMonth(now.getMonth() - 12);
        break;
      case '30 days':
        fromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '7 days':
        fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '24 hours':
        fromDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      default:
        fromDate = new Date(range.from);
    }
    const newRange = {
      from: fromDate.toISOString().slice(0, 10),
      to: now.toISOString().slice(0, 10)
    };
    setRange(newRange);
    fetchStats(newRange);
  };

  // combined on-mount
  useEffect(() => {
    fetchWallet();
    fetchWithdrawals();
    fetchStats();
  }, []);

  // submit withdrawal
  const submitWithdrawal = async e => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/withdraw', { amount: Number(amount) });
      setAmount('');
      fetchWallet();
      fetchWithdrawals();
      fetchStats();
    } catch (err) {
      setError(err.response?.data?.message || 'Withdrawal failed.');
    }
  };

  if (loading.wallet) {
    return <div className="p-6 text-center">Loading wallet…</div>;
  }

  // how much they can withdraw (₦100 fee)
  const max = Math.max((wallet.available_balance || 0) - 100, 0);

  // convenience sums
  const totalCommission = stats.reduce((sum, r) => sum + (r.commission || 0), 0);
  const totalWithdrawn = stats.reduce((sum, r) => sum + (r.withdrawals || 0), 0);

  return (
    <div className="p-6 space-y-6 bg-gray-50">

      {/* ─── period filter ───────────────────────────────────────────── */}
      <div className="flex justify-between items-center">
        <div className="space-x-2">
          {['12 months', '30 days', '7 days', '24 hours'].map(label => (
            <button
              key={label}
              onClick={() => applyPreset(label)}
              className="px-3 py-1 bg-white rounded shadow text-sm hover:bg-gray-100"
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex items-center space-x-2">
          <input
            type="date"
            value={range.from}
            onChange={e => setRange(r => ({ ...r, from: e.target.value }))}
            className="border px-2 py-1 rounded"
          />
          <input
            type="date"
            value={range.to}
            onChange={e => setRange(r => ({ ...r, to: e.target.value }))}
            className="border px-2 py-1 rounded"
          />
          <button
            onClick={() => fetchStats()}
            disabled={loading.stats}
            className="p-2 bg-white rounded shadow hover:bg-gray-100 disabled:opacity-50"
          >
            <FilterIcon size={16} />
          </button>
        </div>
      </div>

      {/* ─── top KPIs ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          ['Total Balance', wallet.total_balance],
          ['Available', wallet.available_balance],
          ['Withheld', wallet.withheld_balance]
        ].map(([label, val]) => (
          <div key={label} className="bg-white p-4 rounded shadow">
            <p className="text-sm text-gray-500">{label}</p>
            <p className="text-2xl font-bold">₦{(val || 0).toLocaleString()}</p>
          </div>
        ))}

        {/* pending withdrawals */}
        <div className="bg-white p-4 rounded shadow flex flex-col">
          <p className="text-sm text-gray-500">Pending Requests</p>
          <p className="text-3xl font-bold flex-1">
            {loading.withdrawals ? '-' : withdrawals.filter(w => w.status === 'pending').length}
          </p>
          <button
            onClick={fetchWithdrawals}
            className="mt-2 text-indigo-600 hover:underline self-start"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* ─── mid section: stats + withdrawal form ───────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* stats + line chart */}
        <div className="bg-white p-4 rounded shadow">
          {loading.stats ? (
            <div className="h-32 flex items-center justify-center text-gray-500">Loading stats…</div>
          ) : (
            <>
              <p className="text-gray-500">Commission</p>
              <p className="text-2xl font-bold mb-4">₦{totalCommission.toLocaleString()}</p>

              <p className="text-gray-500">Withdrawals</p>
              <p className="text-2xl font-bold mb-4">₦{totalWithdrawn.toLocaleString()}</p>

              <div className="h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats.map(r => ({ date: r.day, amt: r.commission }))}>
                    <Line type="monotone" dataKey="amt" strokeWidth={2} dot={false}/>
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </div>

        {/* withdrawal form */}
        <form onSubmit={submitWithdrawal} className="bg-white p-4 rounded shadow space-y-3">
          <h3 className="text-lg font-semibold">Request Withdrawal</h3>
          <p className="text-sm text-gray-600">
            You may withdraw up to <strong>₦{max.toLocaleString()}</strong><br/>
            <span className="text-red-500 text-xs">₦100 fee applies</span>
          </p>
          <input
            type="number"
            min="1"
            max={max}
            value={amount}
            onChange={e => setAmount(e.target.value)}
            className="w-full border px-3 py-2 rounded"
            placeholder="₦ amount"
            required
          />
          <button
            type="submit"
            disabled={!amount || amount > max}
            className="w-full bg-indigo-600 text-white py-2 rounded disabled:opacity-50"
          >
            Withdraw
          </button>
          {error && <p className="text-red-600 text-sm">{error}</p>}
        </form>
      </div>

      {/* ─── bottom tables ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* recent transactions */}
        <div className="bg-white p-4 rounded shadow overflow-x-auto">
          <h3 className="font-semibold mb-2">Recent Transactions</h3>
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                {['Date', 'Type', 'Amount'].map(h => (
                  <th key={h} className="px-2 py-1 text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {transactions.map(tx => (
                <tr key={tx.id}>
                  <td className="px-2 py-1">{new Date(tx.created_at).toLocaleString()}</td>
                  <td className="px-2 py-1">{tx.transaction_type}</td>
                  <td className={`px-2 py-1 font-semibold ${tx.amount < 0 ? 'text-red-600' : 'text-green-600'}`}>₦{Math.abs(tx.amount).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* withdrawal history */}
        <div className="bg-white p-4 rounded shadow overflow-x-auto">
          <h3 className="font-semibold mb-2">Withdrawal History</h3>
          {loading.withdrawals ? (
            <div className="text-center text-gray-500">Loading withdrawals…</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  {['Date', 'Requested', 'Fee', 'Total', 'Status'].map(h => (
                    <th key={h} className="px-2 py-1 text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {withdrawals.map(w => (
                  <tr key={w.id}>
                    <td className="px-2 py-1">{new Date(w.requested_at).toLocaleString()}</td>
                    <td className="px-2 py-1">₦{w.amount.toLocaleString()}</td>
                    <td className="px-2 py-1">₦{w.fee.toLocaleString()}</td>
                    <td className="px-2 py-1">₦{(w.amount + w.fee).toLocaleString()}</td>
                    <td className="px-2 py-1">{w.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
