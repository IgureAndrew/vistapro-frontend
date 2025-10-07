// src/components/AdminSubmissions.jsx
import React, { useState, useEffect } from 'react';
import {
  FileText,
  User,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Download,
  Eye,
  CheckCircle,
  Clock,
  AlertCircle,
  Search,
  Filter,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';
import api from '../api';

export default function AdminSubmissions({ onNavigate }) {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Load submissions on component mount
  useEffect(() => {
    loadSubmissions();
  }, []);

  const loadSubmissions = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/verification-submissions');
      console.log('🔍 Admin submissions API response:', response.data);
      console.log('📊 Submissions data:', response.data.submissions);
      
      if (response.data.submissions && response.data.submissions.length > 0) {
        console.log('📋 First submission details:', response.data.submissions[0]);
        console.log('🔍 Guarantor fields:', {
          guarantor_well_known: response.data.submissions[0].guarantor_well_known,
          guarantor_relationship: response.data.submissions[0].guarantor_relationship,
          guarantor_known_duration: response.data.submissions[0].guarantor_known_duration,
          guarantor_occupation: response.data.submissions[0].guarantor_occupation
        });
        console.log('🔍 Commitment fields:', {
          commitment_false_docs: response.data.submissions[0].commitment_false_docs,
          commitment_irrelevant_info: response.data.submissions[0].commitment_irrelevant_info,
          commitment_no_fees: response.data.submissions[0].commitment_no_fees
        });
      }
      
      setSubmissions(response.data.submissions || []);
    } catch (error) {
      console.error('Error loading submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter submissions based on search and status
  const filteredSubmissions = submissions.filter(submission => {
    const matchesSearch = submission.marketerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         submission.marketerEmail.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || submission.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredSubmissions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedSubmissions = filteredSubmissions.slice(startIndex, startIndex + itemsPerPage);

  const handleViewSubmission = (submission) => {
    setSelectedSubmission(submission);
  };

  const handleScheduleVisit = async (submissionId) => {
    try {
      // This would open a modal or navigate to scheduling
      console.log('Schedule visit for submission:', submissionId);
      // Implementation would go here
    } catch (error) {
      console.error('Error scheduling visit:', error);
    }
  };

  const handleDownloadDocuments = async (submissionId) => {
    try {
      // Download all documents for this submission
      console.log('Download documents for submission:', submissionId);
      // Implementation would go here
    } catch (error) {
      console.error('Error downloading documents:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'submitted':
        return 'text-blue-600 bg-blue-100';
      case 'under_review':
        return 'text-yellow-600 bg-yellow-100';
      case 'scheduled':
        return 'text-purple-600 bg-purple-100';
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'rejected':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'submitted':
        return <FileText className="w-4 h-4" />;
      case 'under_review':
        return <Eye className="w-4 h-4" />;
      case 'scheduled':
        return <Calendar className="w-4 h-4" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'rejected':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Verification Submissions</h1>
          <p className="text-gray-600 dark:text-gray-400">Review and manage submitted verification forms</p>
        </div>
        <button
          onClick={() => onNavigate('overview')}
          className="flex items-center space-x-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Overview</span>
        </button>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>
        <div className="sm:w-48">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          >
            <option value="all">All Status</option>
            <option value="submitted">Submitted</option>
            <option value="under_review">Under Review</option>
            <option value="scheduled">Scheduled</option>
            <option value="completed">Completed</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Submissions List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        {paginatedSubmissions.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No submissions found</h3>
            <p className="text-gray-500 dark:text-gray-400">No verification forms have been submitted yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {paginatedSubmissions.map((submission) => (
              <div key={submission.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {submission.marketerName}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{submission.marketerEmail}</p>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Submitted: {new Date(submission.submittedAt).toLocaleDateString()}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          ID: {submission.marketerId}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(submission.status)}`}>
                      {getStatusIcon(submission.status)}
                      <span>{submission.status.replace('_', ' ').toUpperCase()}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleViewSubmission(submission)}
                        className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => handleDownloadDocuments(submission.id)}
                        className="p-2 text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                        title="Download Documents"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      
                      {submission.status === 'submitted' && (
                        <button
                          onClick={() => handleScheduleVisit(submission.id)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                        >
                          Schedule Visit
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Form Progress */}
                <div className="mt-4">
                  <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                    <span>Form Completion</span>
                    <span>{submission.completionPercentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${submission.completionPercentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700 dark:text-gray-300">
            Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredSubmissions.length)} of {filteredSubmissions.length} submissions
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Submission Detail Modal */}
      {selectedSubmission && (
        <SubmissionDetailModal
          submission={selectedSubmission}
          onClose={() => setSelectedSubmission(null)}
          onScheduleVisit={handleScheduleVisit}
        />
      )}
    </div>
  );
}

// Submission Detail Modal Component
function SubmissionDetailModal({ submission, onClose, onScheduleVisit }) {
  const [activeTab, setActiveTab] = useState('biodata');

  const tabs = [
    { id: 'biodata', label: 'Biodata', icon: User },
    { id: 'guarantor', label: 'Guarantor', icon: FileText },
    { id: 'commitment', label: 'Commitment', icon: CheckCircle },
    { id: 'documents', label: 'Documents', icon: Download }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {submission.marketerName} - Verification Details
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">{submission.marketerEmail}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6 max-h-96 overflow-y-auto">
          {activeTab === 'biodata' && (
            <BiodataContent data={submission.biodata} />
          )}
          {activeTab === 'guarantor' && (
            <GuarantorContent data={submission.guarantor} />
          )}
          {activeTab === 'commitment' && (
            <CommitmentContent data={submission.commitment} />
          )}
          {activeTab === 'documents' && (
            <DocumentsContent data={submission.documents} />
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-4 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            Close
          </button>
          {submission.status === 'submitted' && (
            <button
              onClick={() => onScheduleVisit(submission.id)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Schedule Visit
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Content Components
function BiodataContent({ data }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Personal Information</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Full Name</label>
          <p className="text-gray-900 dark:text-white">{data?.fullName || 'N/A'}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Email</label>
          <p className="text-gray-900 dark:text-white">{data?.email || 'N/A'}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Phone</label>
          <p className="text-gray-900 dark:text-white">{data?.phone || 'N/A'}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Address</label>
          <p className="text-gray-900 dark:text-white">{data?.address || 'N/A'}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Date of Birth</label>
          <p className="text-gray-900 dark:text-white">{data?.dateOfBirth || 'N/A'}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-600 dark:text-gray-400">National ID</label>
          <p className="text-gray-900 dark:text-white">{data?.nationalId || 'N/A'}</p>
        </div>
      </div>
    </div>
  );
}

function GuarantorContent({ data }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Guarantor Information</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Guarantor Name</label>
          <p className="text-gray-900 dark:text-white">{data?.guarantorName || 'N/A'}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Phone</label>
          <p className="text-gray-900 dark:text-white">{data?.guarantorPhone || 'N/A'}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Address</label>
          <p className="text-gray-900 dark:text-white">{data?.guarantorAddress || 'N/A'}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Relationship</label>
          <p className="text-gray-900 dark:text-white">{data?.guarantorRelationship || 'N/A'}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Occupation</label>
          <p className="text-gray-900 dark:text-white">{data?.guarantorOccupation || 'N/A'}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Employer</label>
          <p className="text-gray-900 dark:text-white">{data?.guarantorEmployer || 'N/A'}</p>
        </div>
      </div>
    </div>
  );
}

function CommitmentContent({ data }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Sales Commitment</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Sales Target</label>
          <p className="text-gray-900 dark:text-white">₦{data?.salesTarget?.toLocaleString() || 'N/A'}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Commitment Period</label>
          <p className="text-gray-900 dark:text-white">{data?.commitmentPeriod || 'N/A'} months</p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Expected Start Date</label>
          <p className="text-gray-900 dark:text-white">{data?.expectedStartDate || 'N/A'}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Previous Experience</label>
          <p className="text-gray-900 dark:text-white">{data?.previousExperience || 'N/A'}</p>
        </div>
        <div className="md:col-span-2">
          <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Motivation</label>
          <p className="text-gray-900 dark:text-white">{data?.motivation || 'N/A'}</p>
        </div>
      </div>
    </div>
  );
}

function DocumentsContent({ data }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Uploaded Documents</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data?.map((doc, index) => (
          <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{doc.name}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{doc.type}</p>
              </div>
              <button className="p-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>
        )) || <p className="text-gray-500 dark:text-gray-400">No documents uploaded</p>}
      </div>
    </div>
  );
}
