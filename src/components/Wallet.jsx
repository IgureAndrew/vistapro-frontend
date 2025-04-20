// src/components/Wallet.jsx
import React, { useEffect, useState } from 'react';
import api from '../api/walletApi';
import { useNavigate } from 'react-router-dom';

export default function Wallet() {
  const [wallet, setWallet] = useState(null);
  const [txs, setTxs]       = useState([]);
  const [amount, setAmount] = useState('');
  const [error, setError]   = useState('');

  const [bank, setBank]     = useState({ account_name:'', account_number:'', bank_name:'' });
  const [bankMsg, setBankMsg] = useState('');
  const [bankLoading, setBankLoading] = useState(true);
  const [bankSaving, setBankSaving]   = useState(false);

  const [stats, setStats]   = useState([]);
  const [statRange, setStatRange] = useState({
    from: new Date(Date.now() - 30*24*60*60000).toISOString().slice(0,10),
    to:   new Date().toISOString().slice(0,10)
  });
  const [statLoading, setStatLoading] = useState(true);

  const navigate = useNavigate();

  /** Fetch wallet & transactions **/
  const fetchWallet = async () => {
    try {
      const { data } = await api.get('/');
      setWallet(data.wallet);
      setTxs(data.transactions);
    } catch (err) {
      if (err.response?.status === 401) navigate('/login');
    }
  };

  /** Fetch bank details **/
  const fetchBank = async () => {
    try {
      const { data } = await api.get('/bank-details');
      if (data.bank) setBank(data.bank);
    } catch (_) {}
    finally { setBankLoading(false); }
  };

  /** Fetch stats **/
  const fetchStats = async () => {
    setStatLoading(true);
    try {
      const { data } = await api.get(
        `/stats?from=${statRange.from}&to=${statRange.to}`
      );
      setStats(data.stats);
    } catch (_) {
      setStats([]);
    } finally {
      setStatLoading(false);
    }
  };

  useEffect(() => {
    fetchWallet();
    fetchBank();
    fetchStats();
  }, []);

  /** Handle withdrawal **/
  const submitWithdrawal = async e => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/withdraw',{ amount: Number(amount) });
      setAmount('');
      fetchWallet();
      fetchStats(); // update if withdrawal shows in stats
    } catch (err) {
      setError(err.response?.data?.message || 'Withdrawal failed.');
    }
  };

  /** Handle bank form **/
  const handleBankChange = e => {
    setBank(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };
  const saveBank = async e => {
    e.preventDefault();
    setBankSaving(true);
    setBankMsg('');
    try {
      await api.post('/bank-details', bank);
      setBankMsg('Saved successfully');
    } catch (err) {
      setBankMsg(err.response?.data?.message || 'Save failed');
    } finally {
      setBankSaving(false);
    }
  };

  if (!wallet) return <p>Loading wallet…</p>;

  const maxWithdraw = wallet.available_balance - 100;

  return (
    <div className="p-6 space-y-6 bg-gray-50">

      {/* BALANCES & WITHDRAWAL */}
      <h2 className="text-3xl font-bold">My Wallet</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          ['Total Balance', wallet.total_balance],
          ['Available Balance', wallet.available_balance],
          ['Withheld Balance', wallet.withheld_balance]
        ].map(([label, value]) => (
          <div key={label} className="p-4 bg-white rounded shadow">
            <h3 className="text-sm text-gray-500">{label}</h3>
            <p className="text-xl font-semibold">₦{value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      <form onSubmit={submitWithdrawal} className="bg-white p-4 rounded shadow space-y-2">
        <h3 className="text-xl font-semibold">Request Withdrawal</h3>
        <p className="text-sm text-gray-600">
          You can withdraw up to ₦{maxWithdraw.toLocaleString()} (₦100 fee included)
        </p>
        <input
          type="number"
          min="1" max={maxWithdraw}
          value={amount}
          onChange={e=>setAmount(e.target.value)}
          className="border w-32 px-3 py-2 rounded"
          placeholder="₦ amount"
          required
        />
        <button
          type="submit"
          disabled={!amount || amount>maxWithdraw}
          className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 disabled:opacity-50"
        >
          Withdraw
        </button>
        {error && <p className="text-red-600">{error}</p>}
      </form>

      {/* BANK DETAILS */}
      <section className="bg-white p-4 rounded shadow space-y-2">
        <h3 className="text-xl font-semibold">Bank Details</h3>
        {bankLoading
          ? <p>Loading bank info…</p>
          : (
          <form onSubmit={saveBank} className="space-y-4">
            {['account_name','account_number','bank_name'].map(field => (
              <div key={field}>
                <label className="block text-sm text-gray-700">
                  {field.split('_').map(w=>w[0].toUpperCase()+w.slice(1)).join(' ')}
                </label>
                <input
                  name={field}
                  value={bank[field]}
                  onChange={handleBankChange}
                  className="w-full border px-3 py-2 rounded"
                  required
                />
              </div>
            ))}
            <button
              type="submit"
              disabled={bankSaving}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
            >
              {bankSaving ? 'Saving…' : 'Save Bank Details'}
            </button>
            {bankMsg && <p className="text-sm text-green-600">{bankMsg}</p>}
          </form>
        )}
      </section>

      {/* STATS */}
      <section className="bg-white p-4 rounded shadow space-y-4">
        <h3 className="text-xl font-semibold">Commission & Withdrawal Stats</h3>
        <div className="flex space-x-2">
          <input
            type="date"
            value={statRange.from}
            onChange={e=>setStatRange(r=>({...r,from:e.target.value}))}
            className="border px-2 py-1 rounded"
          />
          <input
            type="date"
            value={statRange.to}
            onChange={e=>setStatRange(r=>({...r,to:e.target.value}))}
            className="border px-2 py-1 rounded"
          />
          <button
            onClick={fetchStats}
            className="bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700"
          >
            Refresh
          </button>
        </div>
        {statLoading
          ? <p>Loading stats…</p>
          : stats.length === 0
            ? <p>No data in this period.</p>
            : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {['Date','Commission','Withdrawals'].map(h=>(
                      <th key={h} className="px-4 py-2 text-left text-xs text-gray-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {stats.map(row=>(
                    <tr key={row.day}>
                      <td className="px-4 py-2 text-sm">{row.day}</td>
                      <td className="px-4 py-2 text-sm">₦{(row.commission||0).toLocaleString()}</td>
                      <td className="px-4 py-2 text-sm">₦{(row.withdrawals||0).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </section>

      {/* TRANSACTIONS LIST */}
      <section className="bg-white p-4 rounded shadow">
        <h3 className="text-xl font-semibold mb-2">Recent Transactions</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {['Date','Type','Amount'].map(h=>(
                  <th key={h} className="px-4 py-2 text-left text-xs text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {txs.map(tx=>(
                <tr key={tx.id}>
                  <td className="px-4 py-2 text-sm">{new Date(tx.created_at).toLocaleString()}</td>
                  <td className="px-4 py-2 text-sm">{tx.transaction_type}</td>
                  <td className={`px-4 py-2 text-sm font-medium ${
                    tx.amount<0? 'text-red-600':'text-green-600'
                  }`}>
                    ₦{Math.abs(tx.amount).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
