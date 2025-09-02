import React, { useEffect, useState } from 'react'
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  ShoppingCart, 
  Award, 
  Activity, 
  BarChart3, 
  RefreshCw,
  Target,
  Zap,
  Shield,
  Crown
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import walletApi from '../api/walletApi'

export default function Performance() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Performance data states
  const [marketersPerformance, setMarketersPerformance] = useState([])
  const [adminsPerformance, setAdminsPerformance] = useState([])
  const [superadminsPerformance, setSuperadminsPerformance] = useState([])
  
  // Summary metrics
  const [summaryMetrics, setSummaryMetrics] = useState({
    totalUsers: 0,
    totalRevenue: 0,
    totalSales: 0,
    activeUsers: 0
  })

  // Load performance data
  const loadPerformanceData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Fetch data for all user roles using the existing separate endpoints
      const [marketersRes, adminsRes, superadminsRes] = await Promise.all([
        walletApi.get('/master-admin/marketers'),
        walletApi.get('/master-admin/admins'),
        walletApi.get('/master-admin/superadmins')
      ])

      const marketers = marketersRes.data.wallets || []
      const admins = adminsRes.data.wallets || []
      const superadmins = superadminsRes.data.wallets || []
      
      // Debug: Log what we're getting from the API
      console.log('Marketers data:', marketers)
      console.log('Admins data:', admins)
      console.log('SuperAdmins data:', superadmins)

      // Calculate performance metrics for marketers
      const marketersPerf = marketers.map(marketer => {
        const totalBalance = Number(marketer.total_balance || 0)
        const availableBalance = Number(marketer.available_balance || 0)
        const withheldBalance = Number(marketer.withheld_balance || 0)
        const pendingCashout = Number(marketer.pending_cashout || 0)
        
        // Calculate performance score based on balance and activity
        const performanceScore = Math.min(100, Math.round(
          (availableBalance / Math.max(totalBalance, 1)) * 100
        ))
        
        return {
          ...marketer,
          performanceScore,
          totalBalance,
          availableBalance,
          withheldBalance,
          pendingCashout,
          efficiency: availableBalance > 0 ? 'High' : 'Low',
          status: availableBalance > 10000 ? 'Active' : 'Inactive'
        }
      }).sort((a, b) => b.performanceScore - a.performanceScore)

      // Calculate performance metrics for admins
      const adminsPerf = admins.map(admin => {
        const totalBalance = Number(admin.total_balance || 0)
        const performanceScore = Math.min(100, Math.round(
          (totalBalance / 100000) * 100
        ))
        
        return {
          ...admin,
          performanceScore,
          totalBalance,
          efficiency: totalBalance > 50000 ? 'High' : 'Medium',
          status: totalBalance > 10000 ? 'Active' : 'Inactive'
        }
      }).sort((a, b) => b.performanceScore - a.performanceScore)

      // Calculate performance metrics for superadmins
      const superadminsPerf = superadmins.map(superadmin => {
        const totalBalance = Number(superadmin.total_balance || 0)
        const performanceScore = Math.min(100, Math.round(
          (totalBalance / 200000) * 100
        ))
        
        return {
          ...superadmin,
          performanceScore,
          totalBalance,
          efficiency: totalBalance > 100000 ? 'High' : 'Medium',
          status: totalBalance > 50000 ? 'Active' : 'Inactive'
        }
      }).sort((a, b) => b.performanceScore - a.performanceScore)

      setMarketersPerformance(marketersPerf)
      setAdminsPerformance(adminsPerf)
      setSuperadminsPerformance(superadminsPerf)

      // Calculate summary metrics
      const totalUsers = marketers.length + admins.length + superadmins.length
      const totalRevenue = marketers.reduce((sum, m) => sum + Number(m.total_balance || 0), 0) +
                          admins.reduce((sum, a) => sum + Number(a.total_balance || 0), 0) +
                          superadmins.reduce((sum, s) => sum + Number(s.total_balance || 0), 0)
      
      setSummaryMetrics({
        totalUsers,
        totalRevenue,
        totalSales: marketers.length,
        activeUsers: marketers.filter(m => Number(m.total_balance || 0) > 10000).length
      })

    } catch (err) {
      console.error('Failed to load performance data:', err)
      setError('Failed to fetch performance overview')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPerformanceData()
  }, [])

  const getPerformanceColor = (score) => {
    if (score >= 80) return 'text-green-600 bg-green-100'
    if (score >= 60) return 'text-yellow-600 bg-yellow-100'
    if (score >= 40) return 'text-orange-600 bg-orange-100'
    return 'text-red-600 bg-red-100'
  }

  const getEfficiencyColor = (efficiency) => {
    switch (efficiency) {
      case 'High': return 'text-green-600 bg-green-100'
      case 'Medium': return 'text-yellow-600 bg-yellow-100'
      case 'Low': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg font-medium text-muted-foreground">Loading performance overview...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center text-red-600">
          <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">{error}</p>
          <Button onClick={loadPerformanceData} className="mt-4">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Performance Overview</h1>
        <p className="text-muted-foreground">Monitor and analyze performance metrics across all user roles</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-blue-900 text-lg">
              <Users className="w-5 h-5" />
              Total Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-900">{summaryMetrics.totalUsers}</p>
            <p className="text-sm text-blue-700 mt-1">Across all roles</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-green-900 text-lg">
              <DollarSign className="w-5 h-5" />
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-900">₦{summaryMetrics.totalRevenue.toLocaleString()}</p>
            <p className="text-sm text-green-700 mt-1">Combined balance</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-purple-900 text-lg">
              <ShoppingCart className="w-5 h-5" />
              Active Marketers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-purple-900">{summaryMetrics.activeUsers}</p>
            <p className="text-sm text-purple-700 mt-1">High performing</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-orange-900 text-lg">
              <TrendingUp className="w-5 h-5" />
              Total Sales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-orange-900">{summaryMetrics.totalSales}</p>
            <p className="text-sm text-orange-700 mt-1">Marketers count</p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Tabs */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold">Role Performance Analysis</h3>
          </div>
          <Button variant="outline" size="sm" onClick={loadPerformanceData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        <Tabs defaultValue="marketers" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="marketers" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Marketers ({marketersPerformance.length})
            </TabsTrigger>
            <TabsTrigger value="admins" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Admins ({adminsPerformance.length})
            </TabsTrigger>
            <TabsTrigger value="superadmins" className="flex items-center gap-2">
              <Crown className="w-4 h-4" />
              SuperAdmins ({superadminsPerformance.length})
            </TabsTrigger>
          </TabsList>

          {/* Marketers Performance */}
          <TabsContent value="marketers" className="mt-6">
            {marketersPerformance.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {marketersPerformance.map((marketer, index) => (
                  <Card key={marketer.user_unique_id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-sm font-semibold text-blue-700">
                              {marketer.name?.charAt(0)?.toUpperCase() || 'M'}
                            </span>
                          </div>
                          <div>
                            <CardTitle className="text-base">{marketer.name}</CardTitle>
                            <p className="text-xs text-muted-foreground">{marketer.user_unique_id}</p>
                          </div>
                        </div>
                        {index < 3 && (
                          <Badge className="bg-yellow-100 text-yellow-800">
                            #{index + 1} Top Performer
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Performance Score</span>
                        <Badge className={getPerformanceColor(marketer.performanceScore)}>
                          {marketer.performanceScore}%
                        </Badge>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Total Balance:</span>
                          <span className="font-medium">₦{marketer.totalBalance.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Available:</span>
                          <span className="font-medium text-green-600">₦{marketer.availableBalance.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Withheld:</span>
                          <span className="font-medium text-orange-600">₦{marketer.withheldBalance.toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-2 border-t">
                        <Badge className={getEfficiencyColor(marketer.efficiency)}>
                          {marketer.efficiency} Efficiency
                        </Badge>
                        <Badge variant={marketer.status === 'Active' ? 'default' : 'secondary'}>
                          {marketer.status}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Marketer Users Found</h3>
                <p className="text-gray-500">There are currently no marketer users in the system.</p>
              </div>
            )}
          </TabsContent>

          {/* Admins Performance */}
          <TabsContent value="admins" className="mt-6">
            {adminsPerformance.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {adminsPerformance.map((admin, index) => (
                  <Card key={admin.user_unique_id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                            <span className="text-sm font-semibold text-purple-700">
                              {admin.name?.charAt(0)?.toUpperCase() || 'A'}
                            </span>
                          </div>
                          <div>
                            <CardTitle className="text-base">{admin.name}</CardTitle>
                            <p className="text-xs text-muted-foreground">{admin.user_unique_id}</p>
                          </div>
                        </div>
                        {index < 3 && (
                          <Badge className="bg-purple-100 text-purple-800">
                            #{index + 1} Top Admin
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Performance Score</span>
                        <Badge className={getPerformanceColor(admin.performanceScore)}>
                          {admin.performanceScore}%
                        </Badge>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Total Balance:</span>
                          <span className="font-medium">₦{admin.totalBalance.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Role:</span>
                          <span className="font-medium capitalize">{admin.role}</span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-2 border-t">
                        <Badge className={getEfficiencyColor(admin.efficiency)}>
                          {admin.efficiency} Efficiency
                        </Badge>
                        <Badge variant={admin.status === 'Active' ? 'default' : 'secondary'}>
                          {admin.status}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Shield className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Admin Users Found</h3>
                <p className="text-gray-500">There are currently no admin users in the system.</p>
              </div>
            )}
          </TabsContent>

          {/* SuperAdmins Performance */}
          <TabsContent value="superadmins" className="mt-6">
            {superadminsPerformance.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {superadminsPerformance.map((superadmin, index) => (
                  <Card key={superadmin.user_unique_id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                            <span className="text-sm font-semibold text-red-700">
                              {superadmin.name?.charAt(0)?.toUpperCase() || 'S'}
                            </span>
                          </div>
                          <div>
                            <CardTitle className="text-base">{superadmin.name}</CardTitle>
                            <p className="text-xs text-muted-foreground">{superadmin.user_unique_id}</p>
                          </div>
                        </div>
                        {index < 3 && (
                          <Badge className="bg-red-100 text-red-800">
                            #{index + 1} Top SuperAdmin
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Performance Score</span>
                        <Badge className={getPerformanceColor(superadmin.performanceScore)}>
                          {superadmin.performanceScore}%
                        </Badge>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Total Balance:</span>
                          <span className="font-medium">₦{superadmin.totalBalance.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Role:</span>
                          <span className="font-medium capitalize">{superadmin.role}</span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-2 border-t">
                        <Badge className={getEfficiencyColor(superadmin.efficiency)}>
                          {superadmin.efficiency} Efficiency
                        </Badge>
                        <Badge variant={superadmin.status === 'Active' ? 'default' : 'secondary'}>
                          {superadmin.status}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Crown className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No SuperAdmin Users Found</h3>
                <p className="text-gray-500">There are currently no superadmin users in the system.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Performance Insights */}
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-green-600" />
          <h3 className="text-lg font-semibold">Performance Insights</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-600" />
                Top Performers
              </CardTitle>
              <CardDescription>Users with highest performance scores</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {marketersPerformance.slice(0, 5).map((marketer, index) => (
                  <div key={marketer.user_unique_id} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                    <div className="flex items-center gap-3">
                      <Badge className="bg-yellow-100 text-yellow-800">#{index + 1}</Badge>
                      <span className="font-medium">{marketer.name}</span>
                    </div>
                    <Badge className={getPerformanceColor(marketer.performanceScore)}>
                      {marketer.performanceScore}%
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                Efficiency Analysis
              </CardTitle>
              <CardDescription>Performance distribution by efficiency level</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-2 rounded-lg bg-green-50">
                  <span className="font-medium">High Efficiency</span>
                  <Badge className="bg-green-100 text-green-800">
                    {marketersPerformance.filter(m => m.efficiency === 'High').length} users
                  </Badge>
                </div>
                <div className="flex justify-between items-center p-2 rounded-lg bg-yellow-50">
                  <span className="font-medium">Medium Efficiency</span>
                  <Badge className="bg-yellow-100 text-yellow-800">
                    {marketersPerformance.filter(m => m.efficiency === 'Medium').length} users
                  </Badge>
                </div>
                <div className="flex justify-between items-center p-2 rounded-lg bg-red-50">
                  <span className="font-medium">Low Efficiency</span>
                  <Badge className="bg-red-100 text-red-800">
                    {marketersPerformance.filter(m => m.efficiency === 'Low').length} users
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
