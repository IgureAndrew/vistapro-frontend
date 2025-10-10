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
  Crown,
  Filter,
  Calendar,
  MapPin,
  Star
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import walletApi from '../api/walletApi'
import targetApi from '../api/targetApi'
import { performanceApiService } from '../api/performanceApi'
import targetPerformanceApiService from '../api/targetPerformanceApi'

export default function Performance() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Performance data states
  const [marketersPerformance, setMarketersPerformance] = useState([])
  const [adminsPerformance, setAdminsPerformance] = useState([])
  const [superadminsPerformance, setSuperadminsPerformance] = useState([])
  
  // Target-based performance states
  const [targetBasedPerformance, setTargetBasedPerformance] = useState([])
  const [targetBasedStats, setTargetBasedStats] = useState({})
  
  // Filter states for target-based performance
  const [filters, setFilters] = useState({
    period: 'monthly',
    location: 'all',
    targetType: 'all',
    performanceRange: 'all',
    role: null
  })

  // Available filter options
  const [availableLocations, setAvailableLocations] = useState(['All Locations'])
  const [availableTargetTypes, setAvailableTargetTypes] = useState(['All Types'])
  const [availableRoles] = useState(['Marketer', 'Admin', 'SuperAdmin'])
  
  // Summary metrics
  const [summaryMetrics, setSummaryMetrics] = useState({
    totalMarketers: 0,
    totalAdmins: 0,
    totalSuperAdmins: 0,
    totalOrders: 0,
    totalSales: 0
  })

  // Load filter options
  const loadFilterOptions = async () => {
    try {
      // Get locations from target management API
      const locationsResponse = await fetch('/api/target-management/locations', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (locationsResponse.ok) {
        const locationsData = await locationsResponse.json()
        if (locationsData.success) {
          setAvailableLocations(['All Locations', ...locationsData.locations])
        }
      }
      
      // Set target types
      setAvailableTargetTypes(['All Types', 'orders', 'sales', 'recruitment', 'customers'])
      
    } catch (error) {
      console.error('Error loading filter options:', error)
    }
  }

  // Load target-based performance data
  const loadTargetBasedPerformance = async () => {
    try {
      console.log('🚀 Loading target-based performance data with filters:', filters)
      
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 20000)
      })
      
      const [performanceRes, statsRes] = await Promise.race([
        Promise.all([
          targetPerformanceApiService.getAllUsersPerformance(filters),
          targetPerformanceApiService.getPerformanceStats(filters)
        ]),
        timeoutPromise
      ])
      
      const performanceData = performanceRes.data.data || []
      const statsData = statsRes.data.data || {}
      
      console.log('✅ Target-based performance data loaded:', {
        users: performanceData.length,
        stats: statsData
      })

      setTargetBasedPerformance(performanceData)
      setTargetBasedStats(statsData)

    } catch (err) {
      console.error('❌ Failed to load target-based performance data:', err)
      setTargetBasedPerformance([])
      setTargetBasedStats({})
    }
  }

  // Load performance data with timeout handling
  const loadPerformanceData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      console.log('🚀 Loading performance data...')
      
      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 20000) // 20 second timeout
      })
      
      // Race between the API call and timeout
      const performanceRes = await Promise.race([
        performanceApiService.getPerformanceOverview(),
        timeoutPromise
      ])
      
      const performanceData = performanceRes.data.data
      
      const marketers = performanceData.marketers || []
      const admins = performanceData.admins || []
      const superadmins = performanceData.superAdmins || []
      const summary = performanceData.summary || {}
      
      // Debug: Log what we're getting from the API
      console.log('✅ Performance data loaded successfully:', {
        marketers: marketers.length,
        admins: admins.length,
        superadmins: superadmins.length,
        summary
      })

      // Set performance data - new system provides calculated performance
      setMarketersPerformance(marketers)
      setAdminsPerformance(admins)
      setSuperadminsPerformance(superadmins)

      // Set summary metrics from new performance data
      setSummaryMetrics({
        totalMarketers: summary.totalMarketers || 0,
        totalAdmins: summary.totalAdmins || 0,
        totalSuperAdmins: summary.totalSuperAdmins || 0,
        totalOrders: summary.totalOrders || 0,
        totalSales: summary.totalSales || 0
      })

    } catch (err) {
      console.error('❌ Failed to load performance data:', err)
      
      // Handle different types of errors
      if (err.message === 'Request timeout') {
        setError('Performance data is taking too long to load. Please try refreshing the page.')
      } else if (err.response?.status === 408) {
        setError('The server is taking too long to process your request. Please try again.')
      } else if (err.response?.status === 500) {
        setError('Server error occurred while loading performance data. Please try again later.')
      } else {
        setError('Unable to load performance data. Please check your connection and try again.')
      }
      
      // Set fallback data to prevent empty state
      setMarketersPerformance([])
      setAdminsPerformance([])
      setSuperadminsPerformance([])
      setSummaryMetrics({
        totalMarketers: 0,
        totalAdmins: 0,
        totalSuperAdmins: 0,
        totalOrders: 0,
        totalSales: 0
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFilterOptions()
  }, [])

  useEffect(() => {
    loadPerformanceData()
    loadTargetBasedPerformance()
  }, [filters])

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

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }))
  }

  const getTargetPerformanceColor = (score) => {
    if (score >= 90) return 'text-green-600 bg-green-100'
    if (score >= 70) return 'text-blue-600 bg-blue-100'
    if (score >= 50) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  const getTargetPerformanceStatus = (score) => {
    if (score >= 100) return 'Achieved'
    if (score >= 70) return 'On Track'
    if (score >= 50) return 'Progressing'
    return 'Behind Target'
  }

  const getRoleIcon = (role) => {
    switch (role) {
      case 'Marketer': return <Target className="h-4 w-4" />
      case 'Admin': return <Shield className="h-4 w-4" />
      case 'SuperAdmin': return <Crown className="h-4 w-4" />
      default: return <Users className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg font-medium text-muted-foreground">Loading performance data...</p>
          <p className="text-sm text-muted-foreground mt-2">Please wait while we fetch the latest metrics</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-md">
          <div className="text-orange-500 text-6xl mb-4">⚠️</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Performance Data Unavailable</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="space-y-2">
            <Button onClick={loadPerformanceData} variant="outline" className="w-full">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
            <p className="text-sm text-gray-500">
              If the problem persists, please contact support or try again later.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Performance</h1>
        <p className="text-muted-foreground">Monitor and analyze performance metrics across all user roles</p>
        </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-blue-900 text-lg">
              <Users className="w-5 h-5" />
              Total Marketers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-900">{summaryMetrics.totalMarketers}</p>
            <p className="text-sm text-blue-700 mt-1">Registered marketers</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-purple-900 text-lg">
              <Shield className="w-5 h-5" />
              Total Admins
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-purple-900">{summaryMetrics.totalAdmins}</p>
            <p className="text-sm text-purple-700 mt-1">Active admins</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-yellow-900 text-lg">
              <Crown className="w-5 h-5" />
              Total SuperAdmins
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-yellow-900">{summaryMetrics.totalSuperAdmins}</p>
            <p className="text-sm text-yellow-700 mt-1">Active superadmins</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-green-900 text-lg">
              <span className="text-xl font-bold">₦</span>
              Total Sales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-900 break-all">₦{summaryMetrics.totalSales.toLocaleString()}</p>
            <p className="text-sm text-green-700 mt-1">All time sales</p>
          </CardContent>
        </Card>
      </div>

      {/* Additional Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-orange-900 text-lg">
              <ShoppingCart className="w-5 h-5" />
              Total Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-orange-900">{summaryMetrics.totalOrders}</p>
            <p className="text-sm text-orange-700 mt-1">All orders processed</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-indigo-900 text-lg">
              <Activity className="w-5 h-5" />
              System Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-indigo-900">
              {summaryMetrics.totalMarketers + summaryMetrics.totalAdmins + summaryMetrics.totalSuperAdmins}
            </p>
            <p className="text-sm text-indigo-700 mt-1">Total active users</p>
          </CardContent>
        </Card>
          </div>

      {/* Performance Tabs */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="text-lg font-semibold">Role Performance Analysis</h3>
              <p className="text-sm text-muted-foreground">Detailed performance metrics for each user role</p>
          </div>
          </div>
          <Button variant="outline" size="sm" onClick={loadPerformanceData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Data
          </Button>
        </div>

        <Tabs defaultValue="target-based" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="target-based" className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              Target-Based ({targetBasedPerformance.length})
            </TabsTrigger>
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

          {/* Target-Based Performance */}
          <TabsContent value="target-based" className="mt-6">
            <div className="space-y-6">
              {/* Filters */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Filter className="h-5 w-5 mr-2" />
                    Filters
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    {/* Period Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Calendar className="h-4 w-4 inline mr-1" />
                        Time Period
                      </label>
                      <select
                        value={filters.period}
                        onChange={(e) => handleFilterChange('period', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                      >
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="quarterly">Quarterly</option>
                      </select>
                    </div>

                    {/* Location Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <MapPin className="h-4 w-4 inline mr-1" />
                        Location
                      </label>
                      <select
                        value={filters.location}
                        onChange={(e) => handleFilterChange('location', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                      >
                        {availableLocations.map(location => (
                          <option key={location} value={location === 'All Locations' ? 'all' : location}>
                            {location}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Target Type Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Target className="h-4 w-4 inline mr-1" />
                        Target Type
                      </label>
                      <select
                        value={filters.targetType}
                        onChange={(e) => handleFilterChange('targetType', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                      >
                        {availableTargetTypes.map(type => (
                          <option key={type} value={type === 'All Types' ? 'all' : type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Performance Range Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Star className="h-4 w-4 inline mr-1" />
                        Performance Range
                      </label>
                      <select
                        value={filters.performanceRange}
                        onChange={(e) => handleFilterChange('performanceRange', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                      >
                        <option value="all">All Performance</option>
                        <option value="top">Top (90%+)</option>
                        <option value="good">Good (70-89%)</option>
                        <option value="average">Average (50-69%)</option>
                        <option value="below">Below Target (&lt;50%)</option>
                      </select>
                    </div>

                    {/* Role Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Users className="h-4 w-4 inline mr-1" />
                        Role
                      </label>
                      <select
                        value={filters.role || 'all'}
                        onChange={(e) => handleFilterChange('role', e.target.value === 'all' ? null : e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                      >
                        <option value="all">All Roles</option>
                        {availableRoles.map(role => (
                          <option key={role} value={role}>{role}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Target-Based Performance Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Users</p>
                        <p className="text-2xl font-bold text-gray-900">{targetBasedStats.total_users || 0}</p>
                      </div>
                      <Users className="h-8 w-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Average Performance</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {targetBasedStats.average_performance ? Math.round(targetBasedStats.average_performance) : 0}%
                        </p>
                      </div>
                      <BarChart3 className="h-8 w-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Targets Achieved</p>
                        <p className="text-2xl font-bold text-gray-900">{targetBasedStats.achieved_targets || 0}</p>
                      </div>
                      <Award className="h-8 w-8 text-purple-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Top Performers</p>
                        <p className="text-2xl font-bold text-gray-900">{targetBasedStats.top_performers || 0}</p>
                      </div>
                      <Crown className="h-8 w-8 text-yellow-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Target-Based Performance Data */}
              <Card>
                <CardHeader>
                  <CardTitle>Target-Based Performance Results</CardTitle>
                  <CardDescription>
                    Showing {targetBasedPerformance.length} users with target-based performance metrics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {targetBasedPerformance.length === 0 ? (
                    <div className="text-center py-8">
                      <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Performance Data Found</h3>
                      <p className="text-gray-600">No users found matching your filter criteria.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {targetBasedPerformance.map((userData, index) => (
                        <div key={userData.user.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <div className="flex items-center space-x-2">
                                {getRoleIcon(userData.user.role)}
                                <h3 className="text-lg font-semibold text-gray-900">
                                  {userData.user.name}
                                </h3>
                                <Badge variant="outline">{userData.user.role}</Badge>
                              </div>
                              <Badge variant="outline" className="text-gray-600">
                                {userData.user.location}
                              </Badge>
                            </div>
                            <div className="flex items-center space-x-4">
                              <div className="text-right">
                                <p className="text-sm text-gray-600">Overall Performance</p>
                                <p className="text-2xl font-bold text-gray-900">
                                  {Math.round(userData.performance.overall)}%
                                </p>
                              </div>
                              <Badge className={getTargetPerformanceColor(userData.performance.overall)}>
                                {getTargetPerformanceStatus(userData.performance.overall)}
                              </Badge>
                            </div>
                          </div>

                          {/* Target Details */}
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {userData.performance.targets.map((target, targetIndex) => (
                              <div key={targetIndex} className="bg-gray-50 rounded-lg p-3">
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="font-medium text-gray-900 capitalize">
                                    {target.target_type}
                                  </h4>
                                  <Badge variant="outline" className="text-xs">
                                    {target.period}
                                  </Badge>
                                </div>
                                <div className="space-y-1">
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Target:</span>
                                    <span className="font-medium">{target.target_value}</span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Actual:</span>
                                    <span className="font-medium">{target.actual_value}</span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Performance:</span>
                                    <span className={`font-medium ${getTargetPerformanceColor(target.performance).split(' ')[0]}`}>
                                      {Math.round(target.performance)}%
                                    </span>
                                  </div>
                                  {target.bnpl_platform && (
                                    <div className="flex justify-between text-sm">
                                      <span className="text-gray-600">Platform:</span>
                                      <span className="font-medium text-xs">{target.bnpl_platform}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Marketers Performance */}
          <TabsContent value="marketers" className="mt-6">
            {marketersPerformance.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {marketersPerformance.map((marketer, index) => (
                  <Card key={marketer.user_unique_id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-semibold text-blue-700">
                              {marketer.name?.charAt(0)?.toUpperCase() || 'M'}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-base truncate">{marketer.name}</CardTitle>
                            <p className="text-xs text-muted-foreground truncate">{marketer.user_unique_id}</p>
                          </div>
                        </div>
                        {index < 3 && (
                          <Badge className="bg-yellow-500 text-white text-xs px-2 py-1 flex-shrink-0">
                            #{index + 1} Top
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Overall Performance</span>
                        <Badge className={getPerformanceColor(marketer.performance?.overall?.performance || 0)}>
                          {marketer.performance?.overall?.performance || 0}%
                        </Badge>
                      </div>
                      
                      <div className="space-y-2">
                        {/* Display all weekly targets */}
                        {marketer.performance?.weekly?.targets && marketer.performance.weekly.targets.length > 0 ? (
                          marketer.performance.weekly.targets.map((target, idx) => (
                            <div key={`weekly-${idx}`} className="flex justify-between text-sm">
                              <span>Weekly {target.type}{target.bnplPlatform ? ` (${target.bnplPlatform})` : ''}:</span>
                              <span className="font-medium">
                                {target.actual}/{target.target}
                              </span>
                            </div>
                          ))
                        ) : (
                          <div className="flex justify-between text-sm">
                            <span>Weekly Orders:</span>
                            <span className="font-medium">
                              {marketer.performance?.weekly?.orders || 0}/0
                            </span>
                          </div>
                        )}
                        
                        {/* Display all monthly targets */}
                        {marketer.performance?.monthly?.targets && marketer.performance.monthly.targets.length > 0 ? (
                          marketer.performance.monthly.targets.map((target, idx) => (
                            <div key={`monthly-${idx}`} className="flex justify-between text-sm">
                              <span>Monthly {target.type}{target.bnplPlatform ? ` (${target.bnplPlatform})` : ''}:</span>
                              <span className="font-medium">
                                {target.actual}/{target.target}
                              </span>
                            </div>
                          ))
                        ) : (
                          <div className="flex justify-between text-sm">
                            <span>Monthly Orders:</span>
                            <span className="font-medium">
                              {marketer.performance?.monthly?.orders || 0}/0
                            </span>
                          </div>
                        )}
                        
                        <div className="flex justify-between text-sm">
                          <span>Total Sales:</span>
                          <span className="font-medium text-green-600">₦{marketer.performance?.overall?.totalSales?.toLocaleString() || 0}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Success Rate:</span>
                          <span className="font-medium text-blue-600">{marketer.performance?.overall?.successRate || 0}%</span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-2 border-t">
                        <Badge className={getPerformanceColor(marketer.performance?.weekly?.performance || 0)}>
                          Weekly: {marketer.performance?.weekly?.performance || 0}%
                        </Badge>
                        <Badge className={getPerformanceColor(marketer.performance?.monthly?.performance || 0)}>
                          Monthly: {marketer.performance?.monthly?.performance || 0}%
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Marketers Available</h3>
                <p className="text-gray-500">No marketer performance data is currently available. Check back later or contact support if this persists.</p>
              </div>
            )}
          </TabsContent>

          {/* Admins Performance */}
          <TabsContent value="admins" className="mt-6">
            {adminsPerformance.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {adminsPerformance.map((admin, index) => (
                  <Card key={admin.unique_id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-semibold text-purple-700">
                              {admin.name?.charAt(0)?.toUpperCase() || 'A'}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-base truncate">{admin.name}</CardTitle>
                            <p className="text-xs text-muted-foreground truncate">{admin.unique_id}</p>
                          </div>
                        </div>
                        {index < 3 && (
                          <Badge className="bg-purple-500 text-white text-xs px-2 py-1 flex-shrink-0">
                            #{index + 1} Top
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Team Performance</span>
                        <Badge className={getPerformanceColor(admin.performance?.averagePerformance || 0)}>
                          {admin.performance?.averagePerformance || 0}%
                        </Badge>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Team Size:</span>
                          <span className="font-medium">{admin.performance?.teamSize || 0}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Total Orders:</span>
                          <span className="font-medium">{admin.performance?.totalOrders || 0}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Total Sales:</span>
                          <span className="font-medium text-green-600">₦{admin.performance?.totalSales?.toLocaleString() || 0}</span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-2 border-t">
                        <Badge className="bg-blue-100 text-blue-800">
                          {admin.performance?.successRate || 0}% Success
                        </Badge>
                        <Badge variant="default">
                          {admin.performance?.teamSize > 0 ? 'Active' : 'No Team'}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Shield className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Admins Available</h3>
                <p className="text-gray-500">No admin performance data is currently available. Check back later or contact support if this persists.</p>
              </div>
            )}
          </TabsContent>

          {/* SuperAdmins Performance */}
          <TabsContent value="superadmins" className="mt-6">
            {superadminsPerformance.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {superadminsPerformance.map((superadmin, index) => (
                  <Card key={superadmin.unique_id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-semibold text-yellow-700">
                              {superadmin.name?.charAt(0)?.toUpperCase() || 'S'}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-base truncate">{superadmin.name}</CardTitle>
                            <p className="text-xs text-muted-foreground truncate">{superadmin.unique_id}</p>
                          </div>
                        </div>
                        {index < 3 && (
                          <Badge className="bg-yellow-500 text-white text-xs px-2 py-1 flex-shrink-0">
                            #{index + 1} Top
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Team Performance</span>
                        <Badge className={getPerformanceColor(superadmin.performance?.averagePerformance || 0)}>
                          {superadmin.performance?.averagePerformance || 0}%
                        </Badge>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Team Size:</span>
                          <span className="font-medium">{superadmin.performance?.teamSize || 0}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Total Orders:</span>
                          <span className="font-medium">{superadmin.performance?.totalOrders || 0}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Total Sales:</span>
                          <span className="font-medium text-green-600">₦{superadmin.performance?.totalSales?.toLocaleString() || 0}</span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-2 border-t">
                        <Badge className="bg-yellow-100 text-yellow-800">
                          {superadmin.performance?.successRate || 0}% Success
                        </Badge>
                        <Badge variant="default">
                          {superadmin.performance?.teamSize > 0 ? 'Active' : 'No Team'}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
        </div>
      ) : (
              <div className="text-center py-12">
                <Crown className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No SuperAdmins Available</h3>
                <p className="text-gray-500">No superadmin performance data is currently available. Check back later or contact support if this persists.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Performance Insights */}
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-green-600" />
          <h3 className="text-lg font-semibold">Performance Analytics</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-600" />
                Top Performers
              </CardTitle>
              <CardDescription>Users with the highest performance scores and achievements</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {marketersPerformance.slice(0, 5).map((marketer, index) => (
                  <div key={marketer.user_unique_id} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Badge className="bg-yellow-500 text-white text-xs px-2 py-1 flex-shrink-0">#{index + 1}</Badge>
                      <span className="font-medium truncate">{marketer.name}</span>
                    </div>
                    <Badge className={`${getPerformanceColor(marketer.performance?.overall?.performance || 0)} flex-shrink-0`}>
                      {marketer.performance?.overall?.performance || 0}%
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
              <CardDescription>Performance distribution across different efficiency levels</CardDescription>
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
