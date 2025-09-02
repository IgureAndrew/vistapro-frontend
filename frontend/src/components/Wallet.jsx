// src/components/Wallet.jsx
import React, { useEffect, useState } from 'react'
import walletApi from '../api/walletApi'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Badge } from './ui/badge'
import { Separator } from './ui/separator'
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
  AlertCircle
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

  // Load balances, txns, withdrawals
  const loadAll = async () => {
    setLoading(true)
    try {
      const { data } = await walletApi.get('/')
      setWallet(data.wallet)
      setTransactions(data.transactions)
      setWithdrawals(data.withdrawals)
      setForm(f => ({
        ...f,
        account_name: data.wallet.account_name,
        account_number: data.wallet.account_number,
        bank_name: data.wallet.bank_name
      }))
    } catch {
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
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Wallet Dashboard</h1>
        <p className="text-muted-foreground">Manage your funds and track transactions</p>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <WalletIcon className="w-5 h-5" />
              Total Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-900">₦{(wallet.total_balance || 0).toLocaleString()}</p>
            <p className="text-sm text-blue-700 mt-1">All funds in your wallet</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-green-900">
              <TrendingUp className="w-5 h-5" />
              Available
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-900">₦{(wallet.available_balance || 0).toLocaleString()}</p>
            <p className="text-sm text-green-700 mt-1">Ready for withdrawal</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-orange-900">
              <Clock className="w-5 h-5" />
              Withheld
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-orange-900">₦{(wallet.withheld_balance || 0).toLocaleString()}</p>
            <p className="text-sm text-orange-700 mt-1">Pending clearance</p>
          </CardContent>
        </Card>
      </div>

      {/* Withdrawal Form */}
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Request Withdrawal
          </CardTitle>
          <CardDescription>
            Withdraw funds to your bank account. Processing fee: ₦100
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Amount Preview */}
            {form.amount && Number(form.amount) > 0 && (
              <div className="bg-muted/50 p-4 rounded-lg border">
                <div className="flex items-center justify-between text-sm">
                  <span>Withdrawal Amount:</span>
                  <span className="font-medium">₦{Number(form.amount).toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-1">
                  <span>Processing Fee:</span>
                  <span className="font-medium">₦100</span>
                </div>
                <Separator className="my-2" />
                <div className="flex items-center justify-between font-semibold">
                  <span>Total Deducted:</span>
                  <span className="text-lg">₦{(Number(form.amount) + 100).toLocaleString()}</span>
                </div>
              </div>
            )}

            {/* Form Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Amount (Max: ₦{maxWithdraw.toLocaleString()})
                </label>
                <Input
                  type="number"
                  name="amount"
                  min="1"
                  max={maxWithdraw}
                  value={form.amount}
                  onChange={handleChange}
                  placeholder="Enter amount"
                  required
                  className="h-12"
                />
              </div>
              
              <Input
                type="text"
                name="account_name"
                value={form.account_name}
                onChange={handleChange}
                placeholder="Account Name"
                required
                className="h-12"
              />
              
              <Input
                type="text"
                name="account_number"
                value={form.account_number}
                onChange={handleChange}
                placeholder="Account Number"
                required
                className="h-12"
              />
              
              <div className="sm:col-span-2">
                <Input
                  type="text"
                  name="bank_name"
                  value={form.bank_name}
                  onChange={handleChange}
                  placeholder="Bank Name"
                  required
                  className="h-12"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={!form.amount || form.amount > maxWithdraw || submitting}
              className="w-full h-12 text-lg"
            >
              {submitting ? 'Processing...' : 'Request Withdrawal'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Pending Actions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Pending Cashouts - Left Side */}
        <Card className="lg:col-start-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Pending Cashouts
            </CardTitle>
            <CardDescription>Approve or reject withdrawal requests</CardDescription>
          </CardHeader>
          <CardContent>
            {withdrawals.filter(w => w.status === 'pending').length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No pending cashouts</p>
              </div>
            ) : (
              <div className="space-y-3">
                {withdrawals.filter(w => w.status === 'pending').slice(0, 5).map(w => {
                  const gross = w.amount + w.fee
                  return (
                    <div key={w.id} className="p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-yellow-600" />
                          <span className="text-sm font-medium">Pending</span>
                        </div>
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">User:</span>
                            <p className="font-medium">DSR{w.id.toString().padStart(5, '0')}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Amount:</span>
                            <p className="font-medium">₦{w.amount.toLocaleString()}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">Fee:</span>
                            <p className="font-medium">₦{w.fee.toLocaleString()}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Net:</span>
                            <p className="font-medium">₦{gross.toLocaleString()}</p>
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          <p><span className="text-muted-foreground">Account:</span> {w.account_name}</p>
                          <p><span className="text-muted-foreground">Bank:</span> {w.bank_name}</p>
                          <p><span className="text-muted-foreground">Date:</span> {new Date(w.requested_at).toLocaleDateString('en-NG')}</p>
                        </div>
                        <div className="flex gap-2 pt-2">
                          <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                            Approve
                          </Button>
                          <Button size="sm" variant="destructive">
                            Reject
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Withheld Releases - Right Side */}
        <Card className="lg:col-start-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Pending Withheld Releases
            </CardTitle>
            <CardDescription>Release withheld funds to users</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No pending withheld releases</p>
              <p className="text-xs mt-1">Withheld funds will appear here when ready for release</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions & Withdrawal History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              Recent Transactions
            </CardTitle>
            <CardDescription>Your latest wallet activities</CardDescription>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No transactions yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {transactions.slice(0, 5).map(tx => (
                  <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${tx.amount < 0 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                        {tx.amount < 0 ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{tx.transaction_type}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(tx.created_at).toLocaleDateString('en-NG', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                    <p className={`font-semibold ${tx.amount < 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {tx.amount < 0 ? '-' : '+'}₦{Math.abs(tx.amount).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Withdrawal History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Withdrawal History
            </CardTitle>
            <CardDescription>Track your withdrawal requests</CardDescription>
          </CardHeader>
          <CardContent>
            {withdrawals.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No withdrawal requests yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {withdrawals.slice(0, 5).map(w => {
                  const gross = w.amount + w.fee
                  return (
                    <div key={w.id} className="p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(w.status)}
                          <span className="text-sm font-medium">{w.status}</span>
                        </div>
                        {getStatusBadge(w.status)}
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm">
                          <span className="text-muted-foreground">Amount:</span> ₦{w.amount.toLocaleString()}
                        </p>
                        <p className="text-sm">
                          <span className="text-muted-foreground">Fee:</span> ₦{w.fee.toLocaleString()}
                        </p>
                        <p className="font-semibold">
                          <span className="text-muted-foreground">Total:</span> ₦{gross.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(w.requested_at).toLocaleDateString('en-NG', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* View All Button */}
      {(transactions.length > 5 || withdrawals.length > 5) && (
        <div className="text-center">
          <Button variant="outline" size="lg">
            View All History
          </Button>
        </div>
      )}
    </div>
  )
}
