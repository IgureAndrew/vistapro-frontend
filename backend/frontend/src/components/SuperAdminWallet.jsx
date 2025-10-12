// src/components/SuperAdminWallet.jsx
import React, { useEffect, useState, useRef } from 'react';
import { Wallet, ArrowUpCircle, Clock, User, Package, Calendar, TrendingUp, Eye, EyeOff, ChevronDown, ChevronUp } from 'lucide-react';
import walletApi from '../api/walletApi';
import api from '../api/index';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';

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

  // 4) commission transactions
  const [commissionTransactions, setCommissionTransactions] = useState([]);
  const [commissionSummary, setCommissionSummary] = useState({});
  const [showTransactions, setShowTransactions] = useState(false);
  
  // 5) UI state
  const [showDetailedBreakdown, setShowDetailedBreakdown] = useState(false);
  const [showTeamWallets, setShowTeamWallets] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // 6) breakdown data
  const [breakdown, setBreakdown] = useState(null);

  // 7) withdrawal form state
  const [amount, setAmount] = useState('');
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  // Load all data
  useEffect(() => {
    const loadAll = async () => {
      try {
        const [walletRes, commRes] = await Promise.all([
          walletApi.get('/'),
          api.get('/super-admin/commission-transactions')
        ]);

        // Set wallet data
        if (walletRes.data.breakdown) {
          const { breakdown } = walletRes.data;
          setBreakdown(breakdown);
          setOwnWallet({ 
            total_balance: breakdown.combined.total,
            available_balance: breakdown.combined.available,
          });
        } else {
          setOwnWallet(walletRes.data.wallet);
        }

        // Set commission data
        if (commRes.data.success) {
          setCommissionTransactions(commRes.data.transactions);
          setCommissionSummary(commRes.data.summary);
        }

        // Set withdrawals
        setWithdrawals(walletRes.data.withdrawals || []);

        // Check if withdrawal is locked
        const now = new Date();
        const month = now.getMonth();
        const year = now.getFullYear();
        const thisMonth = (walletRes.data.withdrawals || []).find(w => {
          const d = new Date(w.requested_at);
          return d.getFullYear() === year && d.getMonth() === month;
        });
        setIsLocked(!!thisMonth);
        if (thisMonth) {
          setNextAllowedDate(new Date(year, month + 1, 1));
        }

      } catch (err) {
        console.error('Error loading wallet data:', err);
        setError('Failed to load wallet data');
      } finally {
        setLoading(false);
      }
    };

    loadAll();
  }, []);

  const handleWithdraw = async (e) => {
    e.preventDefault();
    if (!amount || !accountName || !accountNumber || !bankName) {
      alert('All fields are required');
      return;
    }
    if (isLocked) {
      alert(`Next withdrawal available on ${nextAllowedDate?.toLocaleDateString()}`);
      return;
    }

    setSubmitting(true);
    try {
      await walletApi.post('/withdraw', {
        amount: Number(amount),
        account_name: accountName,
        account_number: accountNumber,
        bank_name: bankName
      });
      alert('Withdrawal request submitted');
      setAmount('');
      setAccountName('');
      setAccountNumber('');
      setBankName('');
      // Reload data
      window.location.reload();
    } catch (err) {
      alert(err.response?.data?.message || 'Withdrawal failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p className="p-6 text-muted-foreground">Loading…</p>;
  if (error) return <p className="p-6 text-red-600">{error}</p>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
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
                <p className="text-2xl font-bold text-gray-900">₦{ownWallet.total_balance.toLocaleString()}</p>
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
                <p className="text-2xl font-bold text-gray-900">₦{ownWallet.available_balance.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">This Month's Orders</p>
                <p className="text-2xl font-bold text-gray-900">{commissionSummary.total_orders || 0}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Package className="w-6 h-6 text-purple-600" />
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
              Commission History
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
                  {commissionTransactions.slice(0, 5).map((transaction, index) => (
                    <div key={transaction.id || index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-full">
                          <TrendingUp className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Commission Earned</p>
                          <p className="text-xs text-gray-500">{transaction.marketer_name} → {transaction.admin_name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">₦{transaction.amount.toLocaleString()}</p>
                        <p className="text-xs text-gray-500">{new Date(transaction.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                  {commissionTransactions.length === 0 && (
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
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Commission Summary</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Commission</span>
                    <span className="font-medium">₦{commissionSummary.total_commission?.toLocaleString() || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Orders</span>
                    <span className="font-medium">{commissionSummary.total_orders || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Active Marketers</span>
                    <span className="font-medium">{commissionSummary.total_marketers || 0}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Team Overview</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Team Members</span>
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

          {/* Commission History Tab */}
          <TabsContent value="transactions" className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Commission History</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Marketer</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Admin</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Device</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Commission</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {commissionTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                          <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                          <p>No commission transactions found</p>
                        </td>
                      </tr>
                    ) : commissionTransactions.map((transaction, index) => (
                      <tr key={transaction.id || index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(transaction.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {transaction.marketer_name} ({transaction.marketer_uid})
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {transaction.admin_name} ({transaction.admin_uid})
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {transaction.device_name} ({transaction.device_type})
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ₦{transaction.sold_amount?.toLocaleString() || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                          ₦{transaction.amount.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          {/* Team Management Tab */}
          <TabsContent value="team" className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Team Performance</h3>
                  <button
                    onClick={() => setShowTeamWallets(!showTeamWallets)}
                    className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    {showTeamWallets ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    {showTeamWallets ? 'Hide Details' : 'Show Details'}
                  </button>
                </div>
              </div>
              <div className="p-6">
                <div className="text-center py-8 text-gray-500">
                  <User className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>Team management features will be displayed here</p>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Withdrawals Tab */}
          <TabsContent value="withdraw" className="space-y-6">
            {/* Withdrawal Form */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Withdraw Funds</h3>
              {isLocked && (
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
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      min="1"
                      max={ownWallet.available_balance}
                      required
                      disabled={isLocked}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Available: ₦{ownWallet.available_balance.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Account Name</label>
                    <input
                      type="text"
                      placeholder="Account Name"
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                      disabled={isLocked}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Account Number</label>
                    <input
                      type="text"
                      placeholder="Account Number"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                      disabled={isLocked}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Bank Name</label>
                    <input
                      type="text"
                      placeholder="Bank Name"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                      disabled={isLocked}
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={submitting || isLocked}
                  className={`w-full py-3 px-4 rounded-lg font-medium ${
                    (submitting || isLocked)
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
                      {withdrawals.slice(0, 10).map((withdrawal, index) => (
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