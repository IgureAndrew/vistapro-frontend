// src/components/AdminWallet.jsx

import React, { useEffect, useState } from 'react';
import { Wallet } from 'lucide-react';
import walletApi from '../api/walletApi'; // axios w/ baseURL="/api/wallets"

export default function AdminWallet() {
  const [ownWallet,    setOwnWallet]    = useState({
    total_balance:     0,
    available_balance: 0,
  });
  const [childWallets, setChildWallets] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);

  // withdrawal form state
  const [amount,       setAmount]       = useState('');
  const [acctName,     setAcctName]     = useState('');
  const [acctNo,       setAcctNo]       = useState('');
  const [bankName,     setBankName]     = useState('');
  const [submitting,   setSubmitting]   = useState(false);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        // A) fetch admin’s own wallet
        const { data: ownRes } = await walletApi.get('/admin/my');
        // B) fetch your marketers’ wallets
        const { data: subRes } = await walletApi.get('/admin/marketers');

        if (!mounted) return;
        setOwnWallet(ownRes.wallet || {});
        setChildWallets(subRes.wallets || []);
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

  // handle withdraw submit
  const handleWithdraw = async e => {
    e.preventDefault();
    if (!amount || !acctName || !acctNo || !bankName) {
      return alert('All fields are required');
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
      // reload balances
      const { data: ownRes } = await walletApi.get('/admin/my');
      setOwnWallet(ownRes.wallet || {});
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

  if (loading) return <p className="p-6">Loading…</p>;
  if (error)   return <p className="p-6 text-red-600">{error}</p>;

  const { total_balance = 0, available_balance = 0 } = ownWallet;

  return (
    <div className="p-6 space-y-8">
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
            className="bg-white p-5 rounded-lg shadow flex items-center gap-4"
          >
            <div className="p-3 bg-indigo-50 rounded-full text-indigo-600">
              {icon}
            </div>
            <div>
              <p className="text-sm text-gray-500">{label}</p>
              <p className="text-2xl font-semibold">
                ₦{value.toLocaleString()}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* 2) WITHDRAWAL FORM */}
      <div className="bg-white p-6 rounded-lg shadow space-y-4">
        <h2 className="text-lg font-semibold">Request Withdrawal</h2>
        <form onSubmit={handleWithdraw} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="number"
            placeholder="₦ Amount"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            className="border rounded p-2 w-full"
            min="1"
            max={available_balance}
            required
          />
          <input
            type="text"
            placeholder="Account Name"
            value={acctName}
            onChange={e => setAcctName(e.target.value)}
            className="border rounded p-2 w-full"
            required
          />
          <input
            type="text"
            placeholder="Account Number"
            value={acctNo}
            onChange={e => setAcctNo(e.target.value)}
            className="border rounded p-2 w-full"
            required
          />
          <input
            type="text"
            placeholder="Bank Name"
            value={bankName}
            onChange={e => setBankName(e.target.value)}
            className="border rounded p-2 w-full"
            required
          />
          <button
            type="submit"
            disabled={submitting}
            className={`col-span-full bg-indigo-600 text-white py-2 rounded ${
              submitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-indigo-700'
            }`}
          >
            {submitting ? 'Submitting…' : 'Submit Withdrawal'}
          </button>
        </form>
      </div>

      {/* 3) MY MARKETERS’ WALLETS */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <h2 className="p-4 text-lg font-semibold">My Marketers’ Wallets</h2>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {['ID','Total','Available','Withheld','Last Commission'].map(hdr => (
                <th key={hdr}
                  className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase"
                >
                  {hdr}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {childWallets.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                  No marketers found.
                </td>
              </tr>
            ) : childWallets.map(w => (
              <tr key={w.user_unique_id} className="hover:bg-gray-50">
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
