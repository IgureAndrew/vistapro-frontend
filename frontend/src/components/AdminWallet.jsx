// src/components/AdminWallet.jsx

import React, { useEffect, useState } from 'react';
import { Wallet } from 'lucide-react';
import walletApi from '../api/walletApi'; // axios w/ baseURL="/api/wallets"

export default function AdminWallet() {
  // 1) own balances
  const [ownWallet,    setOwnWallet]    = useState({
    total_balance:     0,
    available_balance: 0,
  });
  // 2) marketers under you
  const [childWallets, setChildWallets] = useState([]);
  // 3) withdrawal history + next-allowed date
  const [withdrawals,     setWithdrawals]     = useState([]);
  const [nextAllowedDate, setNextAllowedDate] = useState(null);
  // 4) loading & error
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  // form state
  const [amount,     setAmount]     = useState('');
  const [acctName,   setAcctName]   = useState('');
  const [acctNo,     setAcctNo]     = useState('');
  const [bankName,   setBankName]   = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const [{ data: ownRes }, { data: subRes }, { data: wRes }] = await Promise.all([
          walletApi.get('/admin/my'),
          walletApi.get('/admin/marketers'),
          walletApi.get('/admin/withdrawals')
        ]);

        if (!mounted) return;

        // set own wallet
        setOwnWallet(ownRes.wallet || {});
        // set child wallets
        setChildWallets(subRes.wallets || []);
        // set withdrawals
        const hist = wRes.withdrawals || [];
        setWithdrawals(hist);

        // compute nextAllowedDate if any this-month withdrawal
        const now   = new Date();
        const month = now.getMonth();
        const year  = now.getFullYear();
        const thisMonth = hist.find(r => {
          const d = new Date(r.requested_at);
          return d.getFullYear() === year && d.getMonth() === month;
        });
        if (thisMonth) {
          setNextAllowedDate(new Date(year, month + 1, 1));
        }
      } catch (e) {
        console.error(e);
        if (mounted) setError('Failed to load wallets');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false };
  }, []);

  const handleWithdraw = async e => {
    e.preventDefault();
    if (!amount || !acctName || !acctNo || !bankName) {
      return alert('All fields are required');
    }
    if (nextAllowedDate && new Date() < nextAllowedDate) {
      return alert(`Next withdrawal available on ${nextAllowedDate.toLocaleDateString()}`);
    }
    setSubmitting(true);
    try {
      await walletApi.post('/admin/withdraw', {
        amount:         Number(amount),
        account_name:   acctName,
        account_number: acctNo,
        bank_name:      bankName
      });
      alert('Withdrawal request submitted');

      // reload balances & history
      const { data: ownRes } = await walletApi.get('/admin/my');
      const { data: wRes   } = await walletApi.get('/admin/withdrawals');
      setOwnWallet(ownRes.wallet || {});
      const hist = wRes.withdrawals || [];
      setWithdrawals(hist);

      // recompute nextAllowedDate
      const now   = new Date();
      const month = now.getMonth();
      const year  = now.getFullYear();
      const thisMonth = hist.find(r => {
        const d = new Date(r.requested_at);
        return d.getFullYear() === year && d.getMonth() === month;
      });
      setNextAllowedDate(thisMonth ? new Date(year, month + 1, 1) : null);

    } catch (e) {
      console.error(e);
      alert(e.response?.data?.message || 'Withdrawal failed');
    } finally {
      setSubmitting(false);
      setAmount('');
      setAcctName('');
      setAcctNo('');
      setBankName('');
    }
  };

  if (loading) return <p className="p-6 text-muted-foreground">Loading…</p>;
  if (error)   return <p className="p-6 text-red-600">{error}</p>;

  const { total_balance = 0, available_balance = 0 } = ownWallet;
  const formLocked = nextAllowedDate && new Date() < nextAllowedDate;

  return (
    <div className="p-6 space-y-8 bg-background text-foreground">
      {/* 1) YOUR BALANCE CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {[{
          label: 'Total Balance',
          value: total_balance,
          icon:  <Wallet className="w-6 h-6" />
        },{
          label: 'Available',
          value: available_balance,
          icon:  <span className="text-indigo-600 text-xl">₦</span>
        }].map(({ label, value, icon }) => (
          <div key={label}
            className="bg-card border border-border p-5 rounded-lg shadow flex items-center gap-4"
          >
            <div className="p-3 bg-muted rounded-full text-foreground">
              {icon}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{label}</p>
              <p className="text-2xl font-semibold">
                ₦{value.toLocaleString()}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* 2) WITHDRAWAL FORM */}
      <div className="bg-card border border-border p-6 rounded-lg shadow space-y-4">
        <h2 className="text-lg font-semibold">Request Withdrawal</h2>

        {formLocked && (
          <div className="p-4 bg-yellow-100 text-yellow-800 rounded">
            You’ve already made a withdrawal this month.<br/>
            Next available on <strong>{nextAllowedDate.toLocaleDateString()}</strong>.
          </div>
        )}

        <form onSubmit={handleWithdraw}
              className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="number"
            placeholder="₦ Amount"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            className="border border-border bg-background text-foreground rounded p-2 w-full"
            min="1"
            max={available_balance}
            required
            disabled={formLocked}
          />
          <input
            type="text"
            placeholder="Account Name"
            value={acctName}
            onChange={e => setAcctName(e.target.value)}
            className="border border-border bg-background text-foreground rounded p-2 w-full"
            required
            disabled={formLocked}
          />
          <input
            type="text"
            placeholder="Account Number"
            value={acctNo}
            onChange={e => setAcctNo(e.target.value)}
            className="border border-border bg-background text-foreground rounded p-2 w-full"
            required
            disabled={formLocked}
          />
          <input
            type="text"
            placeholder="Bank Name"
            value={bankName}
            onChange={e => setBankName(e.target.value)}
            className="border border-border bg-background text-foreground rounded p-2 w-full"
            required
            disabled={formLocked}
          />
          <button
            type="submit"
            disabled={submitting || formLocked}
            className={`col-span-full bg-primary text-primary-foreground py-2 rounded ${
              (submitting || formLocked)
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:brightness-95'
            }`}
          >
            {submitting ? 'Submitting…' : 'Submit Withdrawal'}
          </button>
        </form>
      </div>

      {/* 3) MY MARKETERS’ WALLETS */}
      <div className="bg-card border border-border rounded-lg shadow overflow-x-auto">
        <h2 className="p-4 text-lg font-semibold">My Marketers’ Wallets</h2>
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-muted">
            <tr>
              {['ID','Total','Available','Withheld','Last Commission'].map(hdr => (
                <th key={hdr}
                  className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase"
                >
                  {hdr}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {childWallets.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                  No marketers found.
                </td>
              </tr>
            ) : childWallets.map(w => (
              <tr key={w.user_unique_id} className="hover:bg-muted">
                <td className="px-4 py-2 text-sm">{w.user_unique_id}</td>
                <td className="px-4 py-2 text-sm">₦{w.total_balance.toLocaleString()}</td>
                <td className="px-4 py-2 text-sm">₦{w.available_balance.toLocaleString()}</td>
                <td className="px-4 py-2 text-sm">₦{w.withheld_balance.toLocaleString()}</td>
                <td className="px-4 py-2 text-sm">
                  {w.last_commission_date
                    ? new Date(w.last_commission_date).toLocaleDateString()
                    : '—'
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
