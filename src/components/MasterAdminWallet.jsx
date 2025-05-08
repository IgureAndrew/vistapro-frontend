// src/components/MasterAdminWallet.jsx
import React, { useEffect, useState } from 'react';
import {
  Wallet,
  CreditCard,
  RefreshCw,
  ChevronDown
} from 'lucide-react';
import walletApi from '../api/walletApi';

export default function MasterAdminWallet() {
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    let mounted = true;
    ;(async function load() {
      try {
        const { data } = await walletApi.get('/master-admin/wallets');
        if (!mounted) return;
        setWallets(data.wallets || []);
      } catch (err) {
        console.error(err);
        if (mounted) setError('Failed to load wallets');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false };
  }, []);

  if (loading) {
    return <div className="p-6">Loading wallets…</div>;
  }
  if (error) {
    return <div className="p-6 text-red-600">{error}</div>;
  }
  if (!wallets.length) {
    return <div className="p-6 text-gray-600">No wallets available.</div>;
  }

  // aggregate totals
  const total_balance     = wallets.reduce((sum, w) => sum + w.total_balance, 0);
  const available_balance = wallets.reduce((sum, w) => sum + w.available_balance, 0);
  const withheld_balance  = wallets.reduce((sum, w) => sum + w.withheld_balance, 0);
  // if your wallets table has pending_cashout, include it here:
  const pending_cashout   = wallets.reduce((sum, w) => sum + (w.pending_cashout || 0), 0);

  const summaryCards = [
    {
      title: 'Total Balance',
      value: total_balance,
      icon: <Wallet className="w-6 h-6" />
    },
    {
      title: 'Available',
      value: available_balance,
      icon: (
        <span className="w-6 h-6 flex items-center justify-center text-indigo-600 text-xl">
          ₦
        </span>
      )
    },
    {
      title: 'Withheld',
      value: withheld_balance,
      icon: <CreditCard className="w-6 h-6" />
    },
    {
      title: 'Pending Cashout',
      value: pending_cashout,
      icon: <RefreshCw className="w-6 h-6" />
    },
  ];

  return (
    <div className="p-6 space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {summaryCards.map(({ title, value, icon }) => (
          <div key={title} className="bg-white rounded-2xl shadow p-6 flex items-center">
            <div className="p-3 bg-indigo-50 rounded-full text-indigo-600 mr-4">
              {icon}
            </div>
            <div>
              <p className="text-sm text-gray-500">{title}</p>
              <p className="text-2xl font-semibold">₦{value.toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Wallets Table */}
      <div className="bg-white rounded-2xl shadow p-6 overflow-x-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">All Marketers’ Wallets</h2>
          <button className="flex items-center text-sm text-gray-600 hover:text-gray-800">
            Refresh <ChevronDown className="w-4 h-4 ml-1" />
          </button>
        </div>
        <table className="min-w-full text-sm text-left">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2">User ID</th>
              <th className="px-4 py-2">Total</th>
              <th className="px-4 py-2">Available</th>
              <th className="px-4 py-2">Withheld</th>
              <th className="px-4 py-2">Pending Cashout</th>
            </tr>
          </thead>
          <tbody>
            {wallets.map(w => (
              <tr key={w.user_unique_id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="px-4 py-2">{w.user_unique_id}</td>
                <td className="px-4 py-2">₦{w.total_balance.toLocaleString()}</td>
                <td className="px-4 py-2">₦{w.available_balance.toLocaleString()}</td>
                <td className="px-4 py-2">₦{w.withheld_balance.toLocaleString()}</td>
                <td className="px-4 py-2">₦{(w.pending_cashout||0).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
