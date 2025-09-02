// src/components/SuperAdminWallet.jsx
import React, { useEffect, useState } from 'react';
import { Wallet, ArrowUpCircle } from 'lucide-react';
import walletApi from '../api/walletApi'; // axios with baseURL="/api/wallets"

export default function SuperAdminWallet() {
  // 1) your own balances
  const [ownWallet, setOwnWallet] = useState({
    total_balance:     0,
    available_balance: 0,
  });

  // 2) subordinate wallets
  const [childWallets, setChildWallets] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);

  // 3) withdrawal history + next‐allowed date
  const [withdrawals,     setWithdrawals]     = useState([]);
  const [nextAllowedDate, setNextAllowedDate] = useState(null);

  // form state
  const [withdrawAmt, setWithdrawAmt] = useState('');
  const [acctName,    setAcctName]    = useState('');
  const [acctNo,      setAcctNo]      = useState('');
  const [bankName,    setBankName]    = useState('');
  const [submitting,  setSubmitting]  = useState(false);

  useEffect(() => {
    let mounted = true;
    async function loadAll() {
      try {
        // A) fetch your balances
        const ownRes = await walletApi.get('/super-admin/my');
        // B) fetch subordinates
        const subRes = await walletApi.get('/super-admin/activities');
        // C) fetch your withdrawals
        const wRes   = await walletApi.get('/super-admin/withdrawals');

        if (!mounted) return;

        // set balances
        const { total_balance, available_balance } = ownRes.data.wallet || {};
        setOwnWallet({ total_balance, available_balance });

        // set subordinates
        setChildWallets(subRes.data.wallets || []);

        // set history & nextAllowedDate
        const hist = wRes.data.withdrawals || [];
        setWithdrawals(hist);

        // find any this‐month request
        const now   = new Date();
        const month = now.getMonth();
        const year  = now.getFullYear();

        const thisMonth = hist.find(r => {
          const d = new Date(r.requested_at);
          return d.getFullYear() === year && d.getMonth() === month;
        });

        if (thisMonth) {
          // first day of next month
          const next = new Date(year, month + 1, 1);
          setNextAllowedDate(next);
        }
      } catch (e) {
        console.error(e);
        if (mounted) setError('Failed to load wallets');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadAll();
    return () => { mounted = false };
  }, []);

  const handleWithdraw = async e => {
    e.preventDefault();
    if (!withdrawAmt || !acctName || !acctNo || !bankName) {
      return alert('All fields are required');
    }
    if (nextAllowedDate && new Date() < nextAllowedDate) {
      return alert(`Next request available on ${nextAllowedDate.toLocaleDateString()}`);
    }
    setSubmitting(true);
    try {
      await walletApi.post('/super-admin/withdraw',{
        amount:         Number(withdrawAmt),
        account_name:   acctName,
        account_number: acctNo,
        bank_name:      bankName
      });
      alert('Withdrawal request submitted');
      // refresh balances & history
      const ownRes = await walletApi.get('/super-admin/my');
      const wRes   = await walletApi.get('/super-admin/withdrawals');
      const { total_balance, available_balance } = ownRes.data.wallet || {};
      setOwnWallet({ total_balance, available_balance });
      setWithdrawals(wRes.data.withdrawals || []);
      // recompute nextAllowedDate
      const now   = new Date();
      const month = now.getMonth();
      const year  = now.getFullYear();
      const thisMonth = wRes.data.withdrawals.find(r => {
        const d = new Date(r.requested_at);
        return d.getFullYear() === year && d.getMonth() === month;
      });
      setNextAllowedDate(thisMonth ? new Date(year, month + 1, 1) : null);
    } catch (e) {
      console.error(e);
      alert(e.response?.data?.message || 'Withdrawal failed');
    } finally {
      setSubmitting(false);
      setWithdrawAmt('');
      setAcctName('');
      setAcctNo('');
      setBankName('');
    }
  };

  if (loading) return <p className="p-6 text-muted-foreground">Loading…</p>;
  if (error)   return <p className="p-6 text-red-600">{error}</p>;

  const { total_balance, available_balance } = ownWallet;
  const isLocked = nextAllowedDate && new Date() < nextAllowedDate;

  return (
    <div className="p-6 space-y-8 bg-background text-foreground">
      {/* Your Balances */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
        {[{
          label: 'Total Balance',
          value: total_balance,
          icon:  <Wallet className="w-6 h-6 text-indigo-600" />
        },{
          label: 'Available',
          value: available_balance,
          icon:  <span className="text-indigo-600 text-xl">₦</span>
        }].map(({ label, value, icon }) => (
          <div key={label}
            className="bg-card border border-border p-5 rounded-lg shadow flex items-center gap-4">
            <div className="p-3 bg-muted rounded-full">{icon}</div>
            <div>
              <p className="text-sm text-muted-foreground">{label}</p>
              <p className="text-2xl font-semibold">₦{value.toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Withdrawal Form */}
      <div className="bg-card border border-border p-6 rounded-lg shadow space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <ArrowUpCircle /> Withdraw Funds
        </h2>

        {isLocked && (
          <div className="p-4 bg-yellow-100 text-yellow-800 rounded">
            You’ve already requested a withdrawal this month.<br/>
            Next request available on{' '}
            <strong>{nextAllowedDate.toLocaleDateString()}</strong>.
          </div>
        )}

        <form onSubmit={handleWithdraw} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="number"
            placeholder="₦ Amount"
            value={withdrawAmt}
            onChange={e => setWithdrawAmt(e.target.value)}
            className="border border-border bg-background text-foreground rounded p-2 w-full"
            min="1"
            max={available_balance}
            required
            disabled={isLocked}
          />
          <input
            type="text"
            placeholder="Account Name"
            value={acctName}
            onChange={e => setAcctName(e.target.value)}
            className="border border-border bg-background text-foreground rounded p-2 w-full"
            required
            disabled={isLocked}
          />
          <input
            type="text"
            placeholder="Account Number"
            value={acctNo}
            onChange={e => setAcctNo(e.target.value)}
            className="border border-border bg-background text-foreground rounded p-2 w-full"
            required
            disabled={isLocked}
          />
          <input
            type="text"
            placeholder="Bank Name"
            value={bankName}
            onChange={e => setBankName(e.target.value)}
            className="border border-border bg-background text-foreground rounded p-2 w-full"
            required
            disabled={isLocked}
          />
          <button
            type="submit"
            disabled={submitting || isLocked}
            className={`col-span-full bg-primary text-primary-foreground py-2 rounded ${
              (submitting || isLocked)
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:brightness-95'
            }`}
          >
            {submitting ? 'Submitting…' : 'Request Withdrawal'}
          </button>
        </form>
      </div>

      {/* Subordinate Wallets */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <h2 className="p-4 text-lg font-semibold">All Admin & Marketer Wallets</h2>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {['ID','Name','Role','Total','Available','Withheld'].map(hdr => (
                <th
                  key={hdr}
                  className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase"
                >{hdr}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {childWallets.map(w => (
              <tr key={w.user_unique_id}>
                <td className="px-4 py-2 text-sm">{w.user_unique_id}</td>
                <td className="px-4 py-2 text-sm">{w.name}</td>
                <td className="px-4 py-2 text-sm capitalize">{w.role}</td>
                <td className="px-4 py-2 text-sm">
                  ₦{Number(w.total_balance).toLocaleString()}
                </td>
                <td className="px-4 py-2 text-sm">
                  ₦{Number(w.available_balance).toLocaleString()}
                </td>
                <td className="px-4 py-2 text-sm">
                  ₦{Number(w.withheld_balance).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
