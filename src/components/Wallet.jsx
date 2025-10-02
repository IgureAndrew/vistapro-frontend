// src/components/Wallet.jsx
import React, { useEffect, useState } from 'react'
import walletApi from '../api/walletApi'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Badge } from './ui/badge'
import { Separator } from './ui/separator'
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs'
import { MetricCard } from './common/MetricCard'
import { SectionHeader } from './common/SectionHeader'
import { 
  Wallet as WalletIcon, 
  TrendingUp, 
  TrendingDown, 
  CreditCard, 
  History, 
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  ArrowUpCircle,
  User,
  Calendar
} from 'lucide-react'

export default function Wallet() {
  const [wallet, setWallet] = useState({
    total_balance: 0,
    available_balance: 0,
    withheld_balance: 0,
    account_name: '',
    account_number: '',
    bank_name: '',
  })
  const [breakdown, setBreakdown] = useState(null) // For SuperAdmin/Admin detailed breakdown
  const [transactions, setTransactions] = useState([])
  const [withdrawals, setWithdrawals] = useState([])
  const [form, setForm] = useState({
    amount: '',
    account_name: '',
    account_number: '',
    bank_name: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [userRole, setUserRole] = useState('')

  // UI state for modernized design
  const [activeTab, setActiveTab] = useState('overview')
  const [showDetailedBreakdown, setShowDetailedBreakdown] = useState(false)

  // Load balances, txns, withdrawals
  const loadAll = async () => {
    setLoading(true)
    try {
      const { data } = await walletApi.get('/')
      
      // Get user role from localStorage
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      setUserRole(user.role || '')
      
      // Debug logging
      console.log('Wallet API Response:', data)
      console.log('User Role:', user.role)
      console.log('Has breakdown:', !!data.breakdown)
      
      // Check if this is detailed wallet data (SuperAdmin/Admin)
      if (data.breakdown) {
        console.log('Using detailed wallet for SuperAdmin/Admin')
        setBreakdown(data.breakdown)
        setWallet(data.wallet)
        setTransactions(data.transactions)
        setWithdrawals(data.withdrawals)
      } else {
        console.log('Using regular wallet for other roles')
        // Regular wallet data (Marketer, Dealer, etc.)
        setWallet(data.wallet)
        setTransactions(data.transactions)
        setWithdrawals(data.withdrawals)
      }
      
      setForm(f => ({
        ...f,
        account_name: data.wallet.account_name,
        account_number: data.wallet.account_number,
        bank_name: data.wallet.bank_name
      }))
    } catch (err) {
      console.error('Wallet API Error:', err)
      setError('Failed to load wallet data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAll()
  }, [])

  const maxWithdraw = Math.max(wallet.available_balance - 100, 0)

  const handleChange = e => {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
  }

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await walletApi.post('/withdraw', {
        amount: Number(form.amount),
        account_name: form.account_name,
        account_number: form.account_number,
        bank_name: form.bank_name
      })
      setForm(f => ({ ...f, amount: '' }))
      await loadAll()
    } catch (err) {
      setError(err.response?.data?.message || 'Withdrawal failed')
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'pending':
      case 'processing':
        return <Clock className="w-4 h-4 text-yellow-600" />
      case 'rejected':
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-600" />
      default:
        return <AlertCircle className="w-4 h-4 text-gray-600" />
    }
  }

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'approved':
        return <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">Completed</Badge>
      case 'pending':
      case 'processing':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>
      case 'rejected':
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading wallet...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full space-y-4 sm:space-y-6">
      {/* Account Summary */}
      <div>
        <SectionHeader title="Account Summary" subtitle="Your wallet balance and available funds" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          <MetricCard
            label="Total Balance"
            value={`₦${wallet.total_balance.toLocaleString()}`}
            description="Your complete wallet balance"
            icon={WalletIcon}
            iconColor="text-blue-600"
            iconBgColor="bg-blue-100"
          />
          <MetricCard
            label="Available Now"
            value={`₦${wallet.available_balance.toLocaleString()}`}
            description="Ready for withdrawal"
            icon={TrendingUp}
            iconColor="text-green-600"
            iconBgColor="bg-green-100"
          />
          <MetricCard
            label="Withheld Balance"
            value={`₦${wallet.withheld_balance.toLocaleString()}`}
            description="Pending clearance"
            icon={Clock}
            iconColor="text-orange-600"
            iconBgColor="bg-orange-100"
          />
        </div>
      </div>

      {/* Wallet Actions */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <WalletIcon className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="transactions" className="flex items-center gap-2">
              <History className="w-4 h-4" />
              Transactions
            </TabsTrigger>
            <TabsTrigger value="withdraw" className="flex items-center gap-2">
              <ArrowUpCircle className="w-4 h-4" />
              Withdrawals
            </TabsTrigger>
          </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
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
                        {getStatusBadge(withdrawal.status)}
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

            {/* Wallet Summary */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Wallet Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Balance</span>
                  <span className="font-medium">₦{wallet.total_balance.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Available</span>
                  <span className="font-medium text-green-600">₦{wallet.available_balance.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Withheld</span>
                  <span className="font-medium text-orange-600">₦{wallet.withheld_balance.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Transaction History</h3>
              </div>
              <div className="p-6">
                {transactions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <History className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No transactions found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {transactions.slice(0, 10).map((transaction, index) => (
                      <div key={transaction.id || index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full ${
                            transaction.type === 'credit' ? 'bg-green-100' : 'bg-red-100'
                          }`}>
                            {transaction.type === 'credit' ? (
                              <ArrowDownLeft className="w-4 h-4 text-green-600" />
                            ) : (
                              <ArrowUpRight className="w-4 h-4 text-red-600" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{transaction.description || 'Transaction'}</p>
                            <p className="text-xs text-gray-500">{new Date(transaction.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-medium ${
                            transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {transaction.type === 'credit' ? '+' : '-'}₦{Number(transaction.amount).toLocaleString()}
                          </p>
                          {getStatusBadge(transaction.status)}
                        </div>
                      </div>
                    ))}
              </div>
            )}
              </div>
            </div>
          </TabsContent>

          {/* Withdrawals Tab */}
        <TabsContent value="withdraw" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
            {/* Withdrawal Form */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Withdraw Funds</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                    <input
                  type="number"
                  name="amount"
                      value={form.amount}
                      onChange={handleChange}
                      placeholder="₦ Amount"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="1"
                  max={maxWithdraw}
                  required
                />
                    <p className="text-xs text-gray-500 mt-1">
                      Available: ₦{maxWithdraw.toLocaleString()}
                    </p>
              </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Account Name</label>
                    <input
                type="text"
                name="account_name"
                value={form.account_name}
                onChange={handleChange}
                placeholder="Account Name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Account Number</label>
                    <input
                type="text"
                name="account_number"
                value={form.account_number}
                onChange={handleChange}
                placeholder="Account Number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Bank Name</label>
                    <input
                  type="text"
                  name="bank_name"
                  value={form.bank_name}
                  onChange={handleChange}
                  placeholder="Bank Name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>
            {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
                <button
              type="submit"
                  disabled={submitting}
                  className={`w-full py-3 px-4 rounded-lg font-medium ${
                    submitting
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
                            {getStatusBadge(withdrawal.status)}
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

      {/* Detailed Breakdown - Collapsible (for SuperAdmin/Admin) */}
      {breakdown && (
        <div className="space-y-4 sm:space-y-6">
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4 sm:pt-6">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Detailed Breakdown</h3>
              <button
                onClick={() => setShowDetailedBreakdown(!showDetailedBreakdown)}
                className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
              >
                {showDetailedBreakdown ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {showDetailedBreakdown ? 'Hide Details' : 'Show Details'}
              </button>
            </div>
            
            {showDetailedBreakdown && (
              <div className="space-y-4 sm:space-y-6">
                {/* Personal Earnings */}
                <div>
                  <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3">Personal Earnings (Marketer Protocol)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Total Personal</p>
                      <p className="text-xl font-semibold text-gray-900 dark:text-white">₦{(breakdown.personal.total || 0).toLocaleString()}</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Available</p>
                      <p className="text-xl font-semibold text-gray-900 dark:text-white">₦{(breakdown.personal.available || 0).toLocaleString()}</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Withheld</p>
                      <p className="text-xl font-semibold text-gray-900 dark:text-white">₦{(breakdown.personal.withheld || 0).toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                {/* Team Management Earnings */}
                <div>
                  <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3">Team Management Earnings</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Total Team</p>
                      <p className="text-xl font-semibold text-gray-900 dark:text-white">₦{(breakdown.team.total || 0).toLocaleString()}</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Available</p>
                      <p className="text-xl font-semibold text-gray-900 dark:text-white">₦{(breakdown.team.available || 0).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}