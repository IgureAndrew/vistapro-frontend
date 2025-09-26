// src/components/AdminWallet.jsx

import React, { useEffect, useState } from 'react';
import { Wallet, ArrowLeft, Clock, User, Package, Calendar, TrendingUp, Eye, EyeOff, ChevronDown, ChevronUp, ArrowUpCircle } from 'lucide-react';
import walletApi from '../api/walletApi'; // axios w/ baseURL="/api/wallets"
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';

export default function AdminWallet({ onNavigate }) {
  // 1) own balances with breakdown support
  const [ownWallet, setOwnWallet] = useState({
    total_balance:     0,
    available_balance: 0,
    withheld_balance:  0,
    breakdown: null
  });
  // 2) marketers under you
  const [childWallets, setChildWallets] = useState([]);
  // 3) withdrawal history + next-allowed date
  const [withdrawals,     setWithdrawals]     = useState([]);
  const [nextAllowedDate, setNextAllowedDate] = useState(null);
  // 4) loading & error
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  // 5) UI state for modernized design
  const [activeTab, setActiveTab] = useState('overview');
  const [showDetailedBreakdown, setShowDetailedBreakdown] = useState(false);
  const [showTeamWallets, setShowTeamWallets] = useState(false);

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
          walletApi.get('/'), // Use generic endpoint that returns detailed breakdown for Admin
          walletApi.get('/admin/marketers'),
          walletApi.get('/admin/withdrawals')
        ]);

        if (!mounted) return;

        // Debug logging
        console.log('AdminWallet API Response:', ownRes);
        console.log('Has breakdown:', !!ownRes.breakdown);

        // set own wallet - use detailed breakdown if available
        if (ownRes.breakdown) {
          // Use detailed breakdown for Admin (same as SuperAdmin)
          const { breakdown } = ownRes;
          setOwnWallet({ 
            total_balance: breakdown.combined.total,
            available_balance: breakdown.combined.available,
            withheld_balance: breakdown.combined.withheld,
            breakdown: breakdown
          });
        } else {
          // Fallback to regular wallet data
          const { total_balance, available_balance, withheld_balance } = ownRes.wallet || {};
          setOwnWallet({ total_balance, available_balance, withheld_balance });
        }
        
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
      const { data: ownRes } = await walletApi.get('/');
      const { data: wRes   } = await walletApi.get('/admin/withdrawals');
      
      // Update wallet with breakdown if available
      if (ownRes.breakdown) {
        const { breakdown } = ownRes;
        setOwnWallet({ 
          total_balance: breakdown.combined.total,
          available_balance: breakdown.combined.available,
          withheld_balance: breakdown.combined.withheld,
          breakdown: breakdown
        });
      } else {
        const { total_balance, available_balance, withheld_balance } = ownRes.wallet || {};
        setOwnWallet({ total_balance, available_balance, withheld_balance });
      }
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

  const { total_balance = 0, available_balance = 0, breakdown } = ownWallet;
  const formLocked = nextAllowedDate && new Date() < nextAllowedDate;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Back to Overview Navigation */}
        {onNavigate && (
          <div className="mb-6">
            <button
              onClick={() => onNavigate('overview')}
              className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Overview</span>
            </button>
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Wallet Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage your earnings and team performance</p>
        </div>

        {/* Quick Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Balance</p>
                <p className="text-2xl font-bold text-gray-900">₦{total_balance.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Wallet className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Available Now</p>
                <p className="text-2xl font-bold text-gray-900">₦{available_balance.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Team Members</p>
                <p className="text-2xl font-bold text-gray-900">{childWallets.length}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <User className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Modern Tabbed Interface */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Wallet className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="transactions" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Transactions
            </TabsTrigger>
            <TabsTrigger value="team" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Team Management
            </TabsTrigger>
            <TabsTrigger value="withdraw" className="flex items-center gap-2">
              <ArrowUpCircle className="w-4 h-4" />
              Withdrawals
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
                  <button
                    onClick={() => setActiveTab('transactions')}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    View All
                  </button>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {withdrawals.slice(0, 3).map((withdrawal, index) => (
                    <div key={withdrawal.id || index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-full">
                          <ArrowUpCircle className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Withdrawal Request</p>
                          <p className="text-xs text-gray-500">{new Date(withdrawal.requested_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">₦{Number(withdrawal.amount).toLocaleString()}</p>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          withdrawal.status === 'approved' 
                            ? 'bg-green-100 text-green-800'
                            : withdrawal.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {withdrawal.status}
                        </span>
                      </div>
                    </div>
                  ))}
                  {withdrawals.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>No recent activity</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Wallet Summary</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Balance</span>
                    <span className="font-medium">₦{total_balance.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Available</span>
                    <span className="font-medium text-green-600">₦{available_balance.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Withheld</span>
                    <span className="font-medium text-orange-600">₦{(ownWallet.withheld_balance || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Team Overview</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Marketers</span>
                    <span className="font-medium">{childWallets.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Active This Month</span>
                    <span className="font-medium">{childWallets.filter(w => w.last_commission_date).length}</span>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions" className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Transaction History</h3>
              </div>
              <div className="p-6">
                <div className="text-center py-8 text-gray-500">
                  <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>Transaction history will be displayed here</p>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Team Management Tab */}
          <TabsContent value="team" className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Team Wallets</h3>
                  <button
                    onClick={() => setShowTeamWallets(!showTeamWallets)}
                    className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    {showTeamWallets ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    {showTeamWallets ? 'Hide Details' : 'Show Details'}
                  </button>
                </div>
              </div>
              {showTeamWallets && (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Available</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Withheld</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Commission</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {childWallets.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                            <User className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                            <p>No marketers found</p>
                          </td>
                        </tr>
                      ) : childWallets.map(w => (
                        <tr key={w.user_unique_id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{w.user_unique_id}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₦{w.total_balance.toLocaleString()}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">₦{w.available_balance.toLocaleString()}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-orange-600">₦{w.withheld_balance.toLocaleString()}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
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
              )}
            </div>
          </TabsContent>

          {/* Withdrawals Tab */}
          <TabsContent value="withdraw" className="space-y-6">
            {/* Withdrawal Form */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Withdraw Funds</h3>
              {formLocked && (
                <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-yellow-600" />
                    <div>
                      <p className="text-yellow-800 font-medium">Withdrawal Limit Reached</p>
                      <p className="text-yellow-700 text-sm">
                        You've already requested a withdrawal this month. Next request available on{' '}
                        <strong>{nextAllowedDate?.toLocaleDateString()}</strong>.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              <form onSubmit={handleWithdraw} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                    <input
                      type="number"
                      placeholder="₦ Amount"
                      value={amount}
                      onChange={e => setAmount(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      min="1"
                      max={available_balance}
                      required
                      disabled={formLocked}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Available: ₦{available_balance.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Account Name</label>
                    <input
                      type="text"
                      placeholder="Account Name"
                      value={acctName}
                      onChange={e => setAcctName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                      disabled={formLocked}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Account Number</label>
                    <input
                      type="text"
                      placeholder="Account Number"
                      value={acctNo}
                      onChange={e => setAcctNo(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                      disabled={formLocked}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Bank Name</label>
                    <input
                      type="text"
                      placeholder="Bank Name"
                      value={bankName}
                      onChange={e => setBankName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                      disabled={formLocked}
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={submitting || formLocked}
                  className={`w-full py-3 px-4 rounded-lg font-medium ${
                    (submitting || formLocked)
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                  }`}
                >
                  {submitting ? 'Submitting...' : 'Request Withdrawal'}
                </button>
              </form>
            </div>

            {/* Withdrawal History */}
            {withdrawals.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Withdrawal History</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {withdrawals.slice(0, 5).map((withdrawal, index) => (
                        <tr key={withdrawal.id || index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(withdrawal.requested_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            ₦{Number(withdrawal.amount).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              withdrawal.status === 'approved' 
                                ? 'bg-green-100 text-green-800'
                                : withdrawal.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {withdrawal.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {withdrawal.account_name}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Detailed Breakdown - Collapsible */}
        {breakdown && (
          <div className="mt-8 space-y-6">
            <div className="border-t border-gray-200 pt-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Detailed Breakdown</h3>
                <button
                  onClick={() => setShowDetailedBreakdown(!showDetailedBreakdown)}
                  className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  {showDetailedBreakdown ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  {showDetailedBreakdown ? 'Hide Details' : 'Show Details'}
                </button>
              </div>
              
              {showDetailedBreakdown && (
                <div className="space-y-6">
                  {/* Personal Earnings */}
                  <div>
                    <h4 className="text-md font-medium text-gray-700 mb-3">Personal Earnings (Marketer Protocol)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600">Total Personal</p>
                        <p className="text-xl font-semibold">₦{(breakdown.personal.total || 0).toLocaleString()}</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600">Available</p>
                        <p className="text-xl font-semibold">₦{(breakdown.personal.available || 0).toLocaleString()}</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600">Withheld</p>
                        <p className="text-xl font-semibold">₦{(breakdown.personal.withheld || 0).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>

                  {/* Team Management Earnings */}
                  <div>
                    <h4 className="text-md font-medium text-gray-700 mb-3">Team Management Earnings</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600">Total Team</p>
                        <p className="text-xl font-semibold">₦{(breakdown.team.total || 0).toLocaleString()}</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600">Available</p>
                        <p className="text-xl font-semibold">₦{(breakdown.team.available || 0).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}