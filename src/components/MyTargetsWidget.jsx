import React, { useEffect, useState } from 'react'
import { Target, TrendingUp, AlertCircle, CheckCircle, Clock } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Progress } from './ui/progress'
import targetPerformanceApiService from '../api/targetPerformanceApi'

export default function MyTargetsWidget() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [targets, setTargets] = useState([])

  const loadMyTargets = async () => {
    setLoading(true)
    setError(null)
    
    try {
      console.log('🎯 Loading my targets...')
      
      const response = await targetPerformanceApiService.getMyTargets()
      
      if (response.data.success) {
        setTargets(response.data.data || [])
        console.log('✅ My targets loaded:', response.data.data.length)
      } else {
        setError(response.data.message || 'Failed to load targets')
      }

    } catch (err) {
      console.error('❌ Failed to load my targets:', err)
      setError('Unable to load your targets. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMyTargets()
  }, [])

  const getStatusIcon = (status) => {
    switch (status) {
      case 'achieved':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'on_track':
        return <TrendingUp className="h-4 w-4 text-blue-600" />
      case 'behind':
        return <AlertCircle className="h-4 w-4 text-red-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'achieved':
        return 'bg-green-100 text-green-800'
      case 'on_track':
        return 'bg-blue-100 text-blue-800'
      case 'behind':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getProgressColor = (progress) => {
    if (progress >= 100) return 'bg-green-500'
    if (progress >= 70) return 'bg-blue-500'
    if (progress >= 50) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="h-5 w-5 mr-2" />
            My Targets
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2 text-sm text-gray-600">Loading targets...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="h-5 w-5 mr-2" />
            My Targets
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-sm text-gray-600">{error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (targets.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="h-5 w-5 mr-2" />
            My Targets
          </CardTitle>
          <CardDescription>Your assigned performance targets</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Targets Assigned</h3>
            <p className="text-gray-600 text-sm">
              You don't have any active targets at the moment. Contact your administrator to set up performance targets.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Target className="h-5 w-5 mr-2" />
          My Targets
        </CardTitle>
        <CardDescription>
          {targets.length} active target{targets.length !== 1 ? 's' : ''} assigned
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {targets.map((target, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(target.status)}
                  <h4 className="font-medium text-gray-900 capitalize">
                    {target.target_type} Target
                  </h4>
                </div>
                <Badge className={getStatusColor(target.status)}>
                  {target.status.replace('_', ' ')}
                </Badge>
              </div>

              <div className="space-y-3">
                {/* Progress Bar */}
                <div>
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Progress</span>
                    <span>{target.progress}%</span>
                  </div>
                  <Progress 
                    value={target.progress} 
                    className="h-2"
                  />
                </div>

                {/* Target Details */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Target Value</p>
                    <p className="font-medium">{target.target_value}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Current</p>
                    <p className="font-medium">{target.actual_value}</p>
                  </div>
                </div>

                {/* Additional Info */}
                <div className="flex justify-between text-xs text-gray-500">
                  <span className="flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    {target.period}
                  </span>
                  {target.bnpl_platform && (
                    <span className="bg-gray-100 px-2 py-1 rounded">
                      {target.bnpl_platform}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-green-600">
                {targets.filter(t => t.status === 'achieved').length}
              </p>
              <p className="text-xs text-gray-600">Achieved</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">
                {targets.filter(t => t.status === 'on_track').length}
              </p>
              <p className="text-xs text-gray-600">On Track</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">
                {targets.filter(t => t.status === 'behind').length}
              </p>
              <p className="text-xs text-gray-600">Behind</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
