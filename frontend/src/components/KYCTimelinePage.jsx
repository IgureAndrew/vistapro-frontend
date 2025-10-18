// frontend/src/components/KYCTimelinePage.jsx
// KYC Timeline Page - Real-time tracking of marketer verification progress

import React, { useState, useEffect } from 'react';
import {
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Download,
  FileText,
  Search,
  Filter,
  TrendingUp,
  TrendingDown,
  Activity,
  User,
  Calendar,
  Mail
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { format, formatDistance } from 'date-fns';
import { getAllKYCTimelines, getKYCTimelineById } from '../api/kycTimelineApi';

const KYCTimelinePage = ({ isDarkMode }) => {
  const [timelines, setTimelines] = useState([]);
  const [filteredTimelines, setFilteredTimelines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [bottleneckFilter, setBottleneckFilter] = useState('all');
  const [selectedTimeline, setSelectedTimeline] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    inProgress: 0,
    completed: 0,
    stuck: 0,
    averageTime: 0
  });

  useEffect(() => {
    fetchTimelines();
    // Refresh every 30 seconds for real-time updates
    const interval = setInterval(fetchTimelines, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    applyFilters();
    calculateStats();
  }, [searchTerm, statusFilter, bottleneckFilter, timelines]);

  const fetchTimelines = async () => {
    try {
      setLoading(true);
      const response = await getAllKYCTimelines();
      if (response.success) {
        setTimelines(response.data || []);
        setError(null);
      }
    } catch (err) {
      console.error('Error fetching timelines:', err);
      setError('Failed to load KYC timelines');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = timelines;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(timeline =>
        timeline.marketer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        timeline.marketer.unique_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        timeline.marketer.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(timeline => {
        if (statusFilter === 'completed') {
          return timeline.progress_percentage === 100;
        } else if (statusFilter === 'in_progress') {
          return timeline.progress_percentage > 0 && timeline.progress_percentage < 100;
        } else if (statusFilter === 'pending') {
          return timeline.progress_percentage === 0;
        }
        return true;
      });
    }

    // Bottleneck filter
    if (bottleneckFilter !== 'all') {
      if (bottleneckFilter === 'stuck') {
        filtered = filtered.filter(timeline => timeline.is_stuck);
      } else if (bottleneckFilter === 'no_bottleneck') {
        filtered = filtered.filter(timeline => !timeline.is_stuck);
      }
    }

    setFilteredTimelines(filtered);
  };

  const calculateStats = () => {
    const total = timelines.length;
    const inProgress = timelines.filter(t => t.progress_percentage > 0 && t.progress_percentage < 100).length;
    const completed = timelines.filter(t => t.progress_percentage === 100).length;
    const stuck = timelines.filter(t => t.is_stuck).length;
    
    // Calculate average time
    const completedTimelines = timelines.filter(t => t.progress_percentage === 100);
    const avgTime = completedTimelines.length > 0
      ? completedTimelines.reduce((sum, t) => sum + t.total_time_elapsed_ms, 0) / completedTimelines.length
      : 0;

    setStats({
      total,
      inProgress,
      completed,
      stuck,
      averageTime: avgTime
    });
  };

  const formatTime = (ms) => {
    if (!ms) return 'N/A';
    
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m`;
    return `${seconds}s`;
  };

  const getStatusBadge = (timeline) => {
    if (timeline.is_stuck) {
      return (
        <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
          <AlertCircle className="w-3 h-3 mr-1" />
          Stuck
        </Badge>
      );
    }
    
    if (timeline.progress_percentage === 100) {
      return (
        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
          <CheckCircle className="w-3 h-3 mr-1" />
          Completed
        </Badge>
      );
    }
    
    if (timeline.progress_percentage > 0) {
      return (
        <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
          <Activity className="w-3 h-3 mr-1" />
          In Progress
        </Badge>
      );
    }
    
    return (
      <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
        <Clock className="w-3 h-3 mr-1" />
        Pending
      </Badge>
    );
  };

  const getProgressBarColor = (percentage) => {
    if (percentage === 100) return 'bg-green-500';
    if (percentage >= 50) return 'bg-blue-500';
    if (percentage >= 25) return 'bg-yellow-500';
    return 'bg-gray-400';
  };

  const handleExportCSV = async () => {
    try {
      // Simple CSV export
      const headers = ['Marketer', 'Unique ID', 'Email', 'Status', 'Progress', 'Total Time', 'Bottleneck'];
      const rows = filteredTimelines.map(t => [
        t.marketer.name,
        t.marketer.unique_id,
        t.marketer.email,
        t.current_status,
        `${t.progress_percentage}%`,
        formatTime(t.total_time_elapsed_ms),
        t.is_stuck ? t.bottleneck_stage : 'None'
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `kyc-timeline-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      link.remove();
    } catch (err) {
      console.error('Error exporting CSV:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Activity className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600 dark:text-gray-400">Loading KYC timelines...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-600" />
          <p className="text-red-600">{error}</p>
          <Button onClick={fetchTimelines} className="mt-4">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">KYC Timeline</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Real-time tracking of marketer verification progress
          </p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={handleExportCSV} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={fetchTimelines} variant="outline">
            <Activity className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Submissions</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">In Progress</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.inProgress}</p>
              </div>
              <Activity className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.completed}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Stuck</p>
                <p className="text-2xl font-bold text-red-600">{stats.stuck}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Avg. Time</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatTime(stats.averageTime)}</p>
              </div>
              <Clock className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search by name, ID, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="all">All Statuses</option>
                <option value="completed">Completed</option>
                <option value="in_progress">In Progress</option>
                <option value="pending">Pending</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Bottleneck
              </label>
              <select
                value={bottleneckFilter}
                onChange={(e) => setBottleneckFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="all">All</option>
                <option value="stuck">Stuck Only</option>
                <option value="no_bottleneck">No Bottleneck</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Marketer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Progress
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Time Elapsed
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Current Stage
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredTimelines.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center">
                      <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                      <p className="text-gray-600 dark:text-gray-400">No timelines found</p>
                    </td>
                  </tr>
                ) : (
                  filteredTimelines.map((timeline) => (
                    <tr key={timeline.submission_id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                              <User className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {timeline.marketer.name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {timeline.marketer.unique_id}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {timeline.marketer.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(timeline)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="w-full">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {timeline.progress_percentage}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${getProgressBarColor(timeline.progress_percentage)}`}
                              style={{ width: `${timeline.progress_percentage}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {formatTime(timeline.total_time_elapsed_ms)}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {format(new Date(timeline.created_at), 'MMM dd, yyyy')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {timeline.current_status}
                        </div>
                        {timeline.is_stuck && timeline.bottleneck_stage && (
                          <div className="text-sm text-red-600 dark:text-red-400">
                            ⚠️ Stuck in {timeline.bottleneck_stage}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Button
                          onClick={async () => {
                            try {
                              // Fetch full timeline data with form details
                              const response = await getKYCTimelineById(timeline.submission_id);
                              if (response.success) {
                                setSelectedTimeline(response.data);
                                setShowDetailModal(true);
                              }
                            } catch (error) {
                              console.error('Error fetching timeline details:', error);
                              // Fallback to using existing timeline data
                              setSelectedTimeline(timeline);
                              setShowDetailModal(true);
                            }
                          }}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                          size="sm"
                        >
                          <FileText className="w-4 h-4 mr-1" />
                          View Details
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Detail Modal */}
      {showDetailModal && selectedTimeline && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Timeline Details - {selectedTimeline.marketer.name}
                </h2>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Marketer Info */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Marketer Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Name</label>
                    <p className="text-gray-900 dark:text-white">{selectedTimeline.marketer.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Unique ID</label>
                    <p className="text-gray-900 dark:text-white">{selectedTimeline.marketer.unique_id}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</label>
                    <p className="text-gray-900 dark:text-white">{selectedTimeline.marketer.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</label>
                    <p className="text-gray-900 dark:text-white">{selectedTimeline.current_status}</p>
                  </div>
                </div>
              </div>

              {/* Timeline Stages */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Timeline Stages</h3>
                <div className="space-y-4">
                  {Object.entries(selectedTimeline.stages).map(([stageName, stage]) => (
                    <div key={stageName} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-900 dark:text-white capitalize">
                          {stageName.replace('_', ' ')}
                        </h4>
                        {stage.status === 'completed' && (
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Completed
                          </Badge>
                        )}
                        {stage.status === 'in_progress' && (
                          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            <Activity className="w-3 h-3 mr-1" />
                            In Progress
                          </Badge>
                        )}
                        {stage.status === 'pending' && (
                          <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
                            <Clock className="w-3 h-3 mr-1" />
                            Pending
                          </Badge>
                        )}
                      </div>
                      
                      {/* Forms Detail - Show individual form status and data */}
                      {stageName === 'forms' && stage.forms_detail && (
                        <div className="mt-3 mb-3 space-y-3">
                          <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Forms Submitted:</div>
                          
                          {/* Biodata Form */}
                          <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-gray-900 dark:text-white">Biodata Form</span>
                              <span className={`text-sm ${stage.forms_detail.biodata.status === 'completed' ? 'text-green-600' : 'text-gray-400'}`}>
                                {stage.forms_detail.biodata.status === 'completed' ? '✓ Completed' : '○ Pending'}
                              </span>
                            </div>
                            {stage.forms_detail.biodata.status === 'completed' && (
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                Submitted: {stage.forms_detail.biodata.submitted_at ? format(new Date(stage.forms_detail.biodata.submitted_at), 'MMM dd, yyyy HH:mm') : 'N/A'}
                              </div>
                            )}
                          </div>
                          
                          {/* Guarantor Form */}
                          <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-gray-900 dark:text-white">Guarantor Form</span>
                              <span className={`text-sm ${stage.forms_detail.guarantor.status === 'completed' ? 'text-green-600' : 'text-gray-400'}`}>
                                {stage.forms_detail.guarantor.status === 'completed' ? '✓ Completed' : '○ Pending'}
                              </span>
                            </div>
                            {stage.forms_detail.guarantor.status === 'completed' && (
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                Submitted: {stage.forms_detail.guarantor.submitted_at ? format(new Date(stage.forms_detail.guarantor.submitted_at), 'MMM dd, yyyy HH:mm') : 'N/A'}
                              </div>
                            )}
                          </div>
                          
                          {/* Commitment Form */}
                          <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-gray-900 dark:text-white">Commitment Form</span>
                              <span className={`text-sm ${stage.forms_detail.commitment.status === 'completed' ? 'text-green-600' : 'text-gray-400'}`}>
                                {stage.forms_detail.commitment.status === 'completed' ? '✓ Completed' : '○ Pending'}
                              </span>
                            </div>
                            {stage.forms_detail.commitment.status === 'completed' && (
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                Submitted: {stage.forms_detail.commitment.submitted_at ? format(new Date(stage.forms_detail.commitment.submitted_at), 'MMM dd, yyyy HH:mm') : 'N/A'}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {stage.completed_at && (
                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                          Completed: {format(new Date(stage.completed_at), 'MMM dd, yyyy HH:mm')}
                        </div>
                      )}
                      {stage.time_elapsed_ms && (
                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                          Time Elapsed: {formatTime(stage.time_elapsed_ms)}
                        </div>
                      )}
                      {stage.reviewed_by && (
                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                          Reviewed By: {stage.reviewed_by}
                        </div>
                      )}
                      {stage.result && (
                        <div className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                          Result: <span className={stage.result === 'approved' ? 'text-green-600' : 'text-red-600'}>
                            {stage.result.toUpperCase()}
                          </span>
                        </div>
                      )}
                      {stage.rejection_reason && (
                        <div className="text-sm text-red-600 dark:text-red-400 mb-1">
                          Rejection Reason: {stage.rejection_reason}
                        </div>
                      )}
                      {stage.notes && (
                        <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-700 rounded">
                          <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes:</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">{stage.notes}</div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Form Data Details */}
              {selectedTimeline.stages.forms?.forms && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Form Details</h3>
                  <div className="space-y-4">
                    {/* Biodata Details */}
                    {selectedTimeline.stages.forms.forms.biodata?.data && (
                      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                          <FileText className="w-4 h-4 mr-2" />
                          Biodata Form
                        </h4>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          {Object.entries(selectedTimeline.stages.forms.forms.biodata.data).map(([key, value]) => {
                            // Skip only ID and timestamp fields
                            if (['id', 'marketer_unique_id', 'created_at', 'updated_at'].includes(key)) return null;
                            
                            return (
                              <div key={key} className={['passport_photo', 'id_document'].includes(key) ? 'col-span-2' : ''}>
                                <label className="text-gray-500 dark:text-gray-400 capitalize">
                                  {key.replace(/_/g, ' ')}:
                                </label>
                                {['passport_photo', 'id_document'].includes(key) && value ? (
                                  <div className="mt-1">
                                    <img 
                                      src={value} 
                                      alt={key.replace(/_/g, ' ')} 
                                      className="max-w-full h-auto rounded border border-gray-300 dark:border-gray-600"
                                      style={{ maxHeight: '200px' }}
                                    />
                                    <a 
                                      href={value} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-blue-600 dark:text-blue-400 text-xs mt-1 block"
                                    >
                                      Open in new tab
                                    </a>
                                  </div>
                                ) : (
                                  <p className="text-gray-900 dark:text-white font-medium break-words">
                                    {value || 'N/A'}
                                  </p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    
                    {/* Guarantor Details */}
                    {selectedTimeline.stages.forms.forms.guarantor?.data && (
                      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                          <FileText className="w-4 h-4 mr-2" />
                          Guarantor Form
                        </h4>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          {Object.entries(selectedTimeline.stages.forms.forms.guarantor.data).map(([key, value]) => {
                            // Skip only ID and timestamp fields
                            if (['id', 'marketer_id', 'created_at', 'updated_at'].includes(key)) return null;
                            
                            return (
                              <div key={key} className={['identification_file', 'signature'].includes(key) ? 'col-span-2' : ''}>
                                <label className="text-gray-500 dark:text-gray-400 capitalize">
                                  {key.replace(/_/g, ' ')}:
                                </label>
                                {['identification_file', 'signature'].includes(key) && value ? (
                                  <div className="mt-1">
                                    <img 
                                      src={value} 
                                      alt={key.replace(/_/g, ' ')} 
                                      className="max-w-full h-auto rounded border border-gray-300 dark:border-gray-600"
                                      style={{ maxHeight: '200px' }}
                                    />
                                    <a 
                                      href={value} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-blue-600 dark:text-blue-400 text-xs mt-1 block"
                                    >
                                      Open in new tab
                                    </a>
                                  </div>
                                ) : (
                                  <p className="text-gray-900 dark:text-white font-medium break-words">
                                    {value || 'N/A'}
                                  </p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    
                    {/* Commitment Details */}
                    {selectedTimeline.stages.forms.forms.commitment?.data && (
                      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                          <FileText className="w-4 h-4 mr-2" />
                          Commitment Form
                        </h4>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          {Object.entries(selectedTimeline.stages.forms.forms.commitment.data).map(([key, value]) => {
                            // Skip only ID and timestamp fields
                            if (['id', 'marketer_id', 'created_at', 'updated_at'].includes(key)) return null;
                            
                            return (
                              <div key={key}>
                                <label className="text-gray-500 dark:text-gray-400 capitalize">
                                  {key.replace(/_/g, ' ')}:
                                </label>
                                <p className="text-gray-900 dark:text-white font-medium break-words">
                                  {value || 'N/A'}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Summary */}
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Summary</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Progress</label>
                    <p className="text-gray-900 dark:text-white">{selectedTimeline.progress_percentage}%</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Time</label>
                    <p className="text-gray-900 dark:text-white">{formatTime(selectedTimeline.total_time_elapsed_ms)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Created</label>
                    <p className="text-gray-900 dark:text-white">{format(new Date(selectedTimeline.created_at), 'MMM dd, yyyy HH:mm')}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Last Updated</label>
                    <p className="text-gray-900 dark:text-white">{format(new Date(selectedTimeline.updated_at), 'MMM dd, yyyy HH:mm')}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end">
              <Button onClick={() => setShowDetailModal(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KYCTimelinePage;

