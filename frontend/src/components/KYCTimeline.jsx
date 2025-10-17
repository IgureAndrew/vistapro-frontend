// src/components/KYCTimeline.jsx
// KYC Timeline component for MasterAdmin

import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, Circle, AlertCircle, User, FileText, Shield, Crown } from 'lucide-react';
import { kycTrackingService } from '../api/kycTrackingApi';

export default function KYCTimeline({ submissionId, onClose }) {
  const [timeline, setTimeline] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadTimeline();
  }, [submissionId]);

  const loadTimeline = async () => {
    try {
      setLoading(true);
      const response = await kycTrackingService.getKYCTimeline(submissionId);
      setTimeline(response.data);
      setError(null);
    } catch (err) {
      console.error('Error loading KYC timeline:', err);
      setError('Failed to load KYC timeline');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (hours) => {
    if (!hours) return 'N/A';
    if (hours < 1) return `${Math.round(hours * 60)} min`;
    if (hours < 24) return `${hours.toFixed(1)} hours`;
    return `${(hours / 24).toFixed(1)} days`;
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString();
  };

  const getStageIcon = (stage) => {
    switch (stage) {
      case 'forms': return <FileText className="w-5 h-5" />;
      case 'admin': return <User className="w-5 h-5" />;
      case 'superadmin': return <Shield className="w-5 h-5" />;
      case 'masteradmin': return <Crown className="w-5 h-5" />;
      default: return <Circle className="w-5 h-5" />;
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      completed: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle, label: 'Completed' },
      in_progress: { bg: 'bg-blue-100', text: 'text-blue-800', icon: Clock, label: 'In Progress' },
      pending: { bg: 'bg-gray-100', text: 'text-gray-800', icon: Circle, label: 'Pending' }
    };
    
    const badge = badges[status] || badges.pending;
    const Icon = badge.icon;
    
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${badge.bg} ${badge.text}`}>
        <Icon className="w-4 h-4" />
        {badge.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading KYC timeline...</p>
        </div>
      </div>
    );
  }

  if (error || !timeline) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-center text-gray-600 mb-4">{error || 'Failed to load timeline'}</p>
          <button
            onClick={onClose}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">KYC Timeline</h2>
              <p className="text-sm text-gray-600 mt-1">
                {timeline.submission.marketer_name} ({timeline.submission.marketer_unique_id})
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Summary */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 mb-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600">Current Stage</p>
                <p className="text-lg font-semibold text-gray-900 capitalize">{timeline.summary.current_stage}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <p className="text-lg font-semibold text-gray-900">{timeline.submission.status}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Time</p>
                <p className="text-lg font-semibold text-gray-900">{formatTime(timeline.summary.total_time_hours)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Submitted</p>
                <p className="text-lg font-semibold text-gray-900">{formatDate(timeline.submission.created_at)}</p>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="space-y-6">
            {/* Forms Stage */}
            <div className="border-l-4 border-blue-500 pl-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    {getStageIcon('forms')}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Forms Stage</h3>
                    <p className="text-sm text-gray-600">Biodata, Guarantor, Commitment</p>
                  </div>
                </div>
                {getStatusBadge(timeline.stages.forms.status)}
              </div>
              
              <div className="ml-12 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Biodata Form</span>
                  <span className="text-gray-900 font-medium">
                    {timeline.stages.forms.forms.biodata.status === 'completed' ? '✓ Completed' : 'Pending'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Guarantor Form</span>
                  <span className="text-gray-900 font-medium">
                    {timeline.stages.forms.forms.guarantor.status === 'completed' ? '✓ Completed' : 'Pending'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Commitment Form</span>
                  <span className="text-gray-900 font-medium">
                    {timeline.stages.forms.forms.commitment.status === 'completed' ? '✓ Completed' : 'Pending'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-200">
                  <span className="text-gray-600">Time Taken</span>
                  <span className="text-gray-900 font-medium">{formatTime(timeline.stages.forms.time_taken_hours)}</span>
                </div>
              </div>
            </div>

            {/* Admin Review Stage */}
            <div className="border-l-4 border-purple-500 pl-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="bg-purple-100 p-2 rounded-lg">
                    {getStageIcon('admin')}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Admin Review</h3>
                    <p className="text-sm text-gray-600">
                      {timeline.stages.admin_review.assigned_to || 'Not assigned'}
                    </p>
                  </div>
                </div>
                {getStatusBadge(timeline.stages.admin_review.status)}
              </div>
              
              <div className="ml-12 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Started</span>
                  <span className="text-gray-900 font-medium">{formatDate(timeline.stages.admin_review.started_at)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Completed</span>
                  <span className="text-gray-900 font-medium">{formatDate(timeline.stages.admin_review.completed_at)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Time Taken</span>
                  <span className="text-gray-900 font-medium">{formatTime(timeline.stages.admin_review.time_taken_hours)}</span>
                </div>
                {timeline.stages.admin_review.notes && (
                  <div className="mt-2 p-2 bg-gray-50 rounded text-sm text-gray-700">
                    {timeline.stages.admin_review.notes}
                  </div>
                )}
              </div>
            </div>

            {/* SuperAdmin Review Stage */}
            <div className="border-l-4 border-orange-500 pl-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="bg-orange-100 p-2 rounded-lg">
                    {getStageIcon('superadmin')}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">SuperAdmin Review</h3>
                    <p className="text-sm text-gray-600">
                      {timeline.stages.superadmin_review.assigned_to || 'Not assigned'}
                    </p>
                  </div>
                </div>
                {getStatusBadge(timeline.stages.superadmin_review.status)}
              </div>
              
              <div className="ml-12 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Started</span>
                  <span className="text-gray-900 font-medium">{formatDate(timeline.stages.superadmin_review.started_at)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Completed</span>
                  <span className="text-gray-900 font-medium">{formatDate(timeline.stages.superadmin_review.completed_at)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Time Taken</span>
                  <span className="text-gray-900 font-medium">{formatTime(timeline.stages.superadmin_review.time_taken_hours)}</span>
                </div>
                {timeline.stages.superadmin_review.notes && (
                  <div className="mt-2 p-2 bg-gray-50 rounded text-sm text-gray-700">
                    {timeline.stages.superadmin_review.notes}
                  </div>
                )}
              </div>
            </div>

            {/* MasterAdmin Approval Stage */}
            <div className="border-l-4 border-green-500 pl-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 p-2 rounded-lg">
                    {getStageIcon('masteradmin')}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">MasterAdmin Approval</h3>
                    <p className="text-sm text-gray-600">Final approval</p>
                  </div>
                </div>
                {getStatusBadge(timeline.stages.masteradmin_approval.status)}
              </div>
              
              <div className="ml-12 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Started</span>
                  <span className="text-gray-900 font-medium">{formatDate(timeline.stages.masteradmin_approval.started_at)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Completed</span>
                  <span className="text-gray-900 font-medium">{formatDate(timeline.stages.masteradmin_approval.completed_at)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Time Taken</span>
                  <span className="text-gray-900 font-medium">{formatTime(timeline.stages.masteradmin_approval.time_taken_hours)}</span>
                </div>
                {timeline.stages.masteradmin_approval.notes && (
                  <div className="mt-2 p-2 bg-gray-50 rounded text-sm text-gray-700">
                    {timeline.stages.masteradmin_approval.notes}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Audit Logs */}
          {timeline.audit_logs && timeline.audit_logs.length > 0 && (
            <div className="mt-8 border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Audit Log</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {timeline.audit_logs.map((log, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{log.action}</p>
                      <p className="text-xs text-gray-600 mt-1">
                        {log.stage} • {log.performed_by_role || 'System'} • {formatDate(log.created_at)}
                      </p>
                      {log.notes && (
                        <p className="text-xs text-gray-700 mt-1">{log.notes}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

