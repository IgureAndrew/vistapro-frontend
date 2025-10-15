// src/components/MobileSuperAdminWallet.jsx
import React, { useEffect, useState } from 'react';
import { Wallet, ArrowUpCircle, Clock, User, Package, Calendar, TrendingUp, Eye, EyeOff, ChevronDown, ChevronUp } from 'lucide-react';
import walletApi from '../api/walletApi';
import api from '../api/index';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import MobileCard, { MetricCard, StatusCard } from './MobileCard';
import MobileGrid from './MobileGrid';
import MobileTable from './MobileTable';
import MobileSearch from './MobileSearch';

export default function MobileSuperAdminWallet() {
  // State management
  const [ownWallet, setOwnWallet] = useState({
    total_balance: 0,
    available_balance: 0,
  });
  const [childWallets, setChildWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [withdrawals, setWithdrawals] = useState([]);
  const [nextAllowedDate, setNextAllowedDate] = useState(null);
  const [commissionTransactions, setCommissionTransactions] = useState([]);
  const [commissionSummary, setCommissionSummary] = useState({});
  const [activeTab, setActiveTab] = useState('overview');
  const [breakdown, setBreakdown] = useState(null);
  const [showDetailedBreakdown, setShowDetailedBreakdown] = useState(false);
  const [showTeamWallets, setShowTeamWallets] = useState(false);

  // Withdrawal form state
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
      window.location.reload();
    } catch (err) {
      alert(err.response?.data?.message || 'Withdrawal failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p className="p-6 text-muted-foreground">Loading…</p>;
  if (error) return <p className="p-6 text-red-600">{error}</p>;

  // Table columns for commission transactions
  const transactionColumns = [
    { key: 'created_at', label: 'Date', type: 'date' },
    { key: 'marketer_name', label: 'Marketer' },
    { key: 'admin_name', label: 'Admin' },
    { key: 'device_name', label: 'Device' },
    { key: 'sold_amount', label: 'Amount', type: 'currency' },
    { key: 'amount', label: 'Commission', type: 'currency' }
  ];

  // Table columns for withdrawals
  const withdrawalColumns = [
    { key: 'requested_at', label: 'Date', type: 'date' },
    { key: 'amount', label: 'Amount', type: 'currency' },
    { key: 'status', label: 'Status', type: 'status' },
    { key: 'account_name', label: 'Account' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">Wallet Dashboard</h1>
        <p className="text-gray-600 mt-1">Manage your earnings and team performance</p>
      </div>

      {/* Quick Stats Cards */}
      <MobileGrid columns={{ mobile: 1, tablet: 2, desktop: 3 }} gap={4}>
        <MetricCard
          title="Total Balance"
          value={ownWallet.total_balance}
          icon={Wallet}
          color="blue"
        />
        <MetricCard
          title="Available Now"
          value={ownWallet.available_balance}
          icon={TrendingUp}
          color="green"
        />
        <MetricCard
          title="This Month's Orders"
          value={commissionSummary.total_orders || 0}
          icon={Package}
          color="purple"
        />
      </MobileGrid>

      {/* Mobile Tabbed Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Wallet className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="transactions" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            History
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Recent Activity */}
          <MobileCard
            title="Recent Activity"
            description="Latest commission transactions"
            icon={Activity}
            color="blue"
          >
            <div className="space-y-3">
              {commissionTransactions.slice(0, 3).map((transaction, index) => (
                <div key={transaction.id || index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
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
                <div className="text-center py-4 text-gray-500">
                  <Clock className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No recent activity</p>
                </div>
              )}
            </div>
          </MobileCard>

          {/* Commission Summary */}
          <MobileCard
            title="Commission Summary"
            description="Your earnings breakdown"
            icon={BarChart3}
            color="green"
          >
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
          </MobileCard>

          {/* Team Overview */}
          <MobileCard
            title="Team Overview"
            description="Your team performance"
            icon={Users}
            color="purple"
          >
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
          </MobileCard>
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-6">
          {/* Commission History */}
          <MobileCard
            title="Commission History"
            description="All your commission transactions"
            icon={Clock}
            color="blue"
          >
            <MobileTable
              data={commissionTransactions}
              columns={transactionColumns}
              cardTitle="Transaction"
              emptyMessage="No commission transactions found"
            />
          </MobileCard>

          {/* Withdrawal History */}
          {withdrawals.length > 0 && (
            <MobileCard
              title="Withdrawal History"
              description="Your withdrawal requests"
              icon={ArrowUpCircle}
              color="orange"
            >
              <MobileTable
                data={withdrawals.slice(0, 10)}
                columns={withdrawalColumns}
                cardTitle="Withdrawal"
                emptyMessage="No withdrawal history"
              />
            </MobileCard>
          )}
        </TabsContent>
      </Tabs>

      {/* Withdrawal Form */}
      <MobileCard
        title="Withdraw Funds"
        description="Request a withdrawal from your wallet"
        icon={ArrowUpCircle}
        color="green"
      >
        {isLocked && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-yellow-600" />
              <div>
                <p className="text-yellow-800 font-medium text-sm">Withdrawal Limit Reached</p>
                <p className="text-yellow-700 text-xs">
                  Next request available on {nextAllowedDate?.toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        )}
        
        <form onSubmit={handleWithdraw} className="space-y-4">
          <div className="space-y-4">
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
      </MobileCard>

      {/* Detailed Breakdown - Collapsible */}
      {breakdown && (
        <MobileCard
          title="Detailed Breakdown"
          description="Complete earnings breakdown"
          icon={Eye}
          color="gray"
          actions={[
            {
              icon: showDetailedBreakdown ? EyeOff : Eye,
              onClick: () => setShowDetailedBreakdown(!showDetailedBreakdown)
            }
          ]}
        >
          {showDetailedBreakdown && (
            <div className="space-y-4">
              {/* Personal Earnings */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Personal Earnings</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Personal</span>
                    <span className="font-medium">₦{(breakdown.personal.total || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Available</span>
                    <span className="font-medium">₦{(breakdown.personal.available || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Withheld</span>
                    <span className="font-medium">₦{(breakdown.personal.withheld || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Team Management Earnings */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Team Management Earnings</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Team</span>
                    <span className="font-medium">₦{(breakdown.team.total || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Available</span>
                    <span className="font-medium">₦{(breakdown.team.available || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </MobileCard>
      )}
    </div>
  );
}
