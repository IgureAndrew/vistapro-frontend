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
import targetPerformanceApiService from '../api/targetPerformanceApi'

export default function TargetBasedPerformance() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Performance data states
  const [performanceData, setPerformanceData] = useState([])
  const [stats, setStats] = useState({})
  
  // Filter states
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

  // Load performance data with filters
  const loadPerformanceData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      console.log('🚀 Loading target-based performance data with filters:', filters)
      
      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 20000) // 20 second timeout
      })
      
      // Race between the API call and timeout
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

      setPerformanceData(performanceData)
      setStats(statsData)

    } catch (err) {
      console.error('❌ Failed to load target-based performance data:', err)
      
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
      
      // Set fallback data
      setPerformanceData([])
      setStats({})
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFilterOptions()
  }, [])

  useEffect(() => {
    loadPerformanceData()
  }, [filters])

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }))
  }

  const getPerformanceColor = (score) => {
    if (score >= 90) return 'text-green-600 bg-green-100'
    if (score >= 70) return 'text-blue-600 bg-blue-100'
    if (score >= 50) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  const getPerformanceStatus = (score) => {
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
          <p className="text-lg font-medium text-muted-foreground">Loading target-based performance...</p>
          <p className="text-sm text-muted-foreground mt-2">Please wait while we fetch the latest metrics</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Performance Data</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={loadPerformanceData} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Target-Based Performance Analysis</h1>
          <p className="text-gray-600 mt-1">Performance metrics based on actual targets set for users</p>
        </div>
        <Button onClick={loadPerformanceData} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

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

      {/* Performance Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total_users || 0}</p>
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
                  {stats.average_performance ? Math.round(stats.average_performance) : 0}%
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
                <p className="text-2xl font-bold text-gray-900">{stats.achieved_targets || 0}</p>
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
                <p className="text-2xl font-bold text-gray-900">{stats.top_performers || 0}</p>
              </div>
              <Crown className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Data */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Results</CardTitle>
          <CardDescription>
            Showing {performanceData.length} users with target-based performance metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          {performanceData.length === 0 ? (
            <div className="text-center py-8">
              <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Performance Data Found</h3>
              <p className="text-gray-600">No users found matching your filter criteria.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {performanceData.map((userData, index) => (
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
                      <Badge className={getPerformanceColor(userData.performance.overall)}>
                        {getPerformanceStatus(userData.performance.overall)}
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
                            <span className={`font-medium ${getPerformanceColor(target.performance).split(' ')[0]}`}>
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
  )
}

