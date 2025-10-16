import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Search, 
  Filter, 
  Phone, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye, 
  Download,
  Users,
  FileText,
  MapPin,
  Calendar,
  User,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  RefreshCw
} from 'lucide-react';

const SuperAdminSubmissions = ({ onNavigate }) => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [adminFilter, setAdminFilter] = useState('all');
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    total: 0
  });

  // Mock data - replace with actual API calls
  useEffect(() => {
    const mockSubmissions = [
      {
        id: 'SUB001',
        marketerName: 'John Doe',
        marketerPhone: '+234 801 234 5678',
        adminName: 'Admin Sarah',
        adminId: 'ASM000022',
        submissionDate: '2024-01-15',
        status: 'pending',
        location: 'Lagos, Nigeria',
        documents: [
          { type: 'location_photo', url: '/api/placeholder/400/300', name: 'Location Photo 1' },
          { type: 'kyc_form', url: '/api/placeholder/400/600', name: 'KYC Form' },
          { type: 'id_document', url: '/api/placeholder/400/300', name: 'ID Document' }
        ],
        forms: {
          biodata: { completed: true, data: { name: 'John Doe', phone: '+234 801 234 5678' } },
          guarantor: { completed: true, data: { name: 'Jane Smith', relationship: 'Sister' } },
          commitment: { completed: true, data: { amount: '₦50,000', duration: '6 months' } }
        },
        verificationNotes: '',
        priority: 'high'
      },
      {
        id: 'SUB002',
        marketerName: 'Mary Johnson',
        marketerPhone: '+234 802 345 6789',
        adminName: 'Admin Mike',
        adminId: 'ASM000023',
        submissionDate: '2024-01-14',
        status: 'approved',
        location: 'Abuja, Nigeria',
        documents: [
          { type: 'location_photo', url: '/api/placeholder/400/300', name: 'Location Photo 1' },
          { type: 'kyc_form', url: '/api/placeholder/400/600', name: 'KYC Form' }
        ],
        forms: {
          biodata: { completed: true, data: { name: 'Mary Johnson', phone: '+234 802 345 6789' } },
          guarantor: { completed: true, data: { name: 'Peter Johnson', relationship: 'Brother' } },
          commitment: { completed: true, data: { amount: '₦75,000', duration: '12 months' } }
        },
        verificationNotes: 'All documents verified. Location confirmed via call.',
        priority: 'medium'
      },
      {
        id: 'SUB003',
        marketerName: 'David Wilson',
        marketerPhone: '+234 803 456 7890',
        adminName: 'Admin Sarah',
        adminId: 'ASM000022',
        submissionDate: '2024-01-13',
        status: 'rejected',
        location: 'Port Harcourt, Nigeria',
        documents: [
          { type: 'location_photo', url: '/api/placeholder/400/300', name: 'Location Photo 1' },
          { type: 'kyc_form', url: '/api/placeholder/400/600', name: 'KYC Form' }
        ],
        forms: {
          biodata: { completed: true, data: { name: 'David Wilson', phone: '+234 803 456 7890' } },
          guarantor: { completed: false, data: {} },
          commitment: { completed: true, data: { amount: '₦30,000', duration: '3 months' } }
        },
        verificationNotes: 'Incomplete guarantor form. Location verification failed.',
        priority: 'low'
      }
    ];

    setSubmissions(mockSubmissions);
    setStats({
      pending: mockSubmissions.filter(s => s.status === 'pending').length,
      approved: mockSubmissions.filter(s => s.status === 'approved').length,
      rejected: mockSubmissions.filter(s => s.status === 'rejected').length,
      total: mockSubmissions.length
    });
    setLoading(false);
  }, []);

  const filteredSubmissions = submissions.filter(submission => {
    const matchesSearch = submission.marketerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         submission.adminName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || submission.status === statusFilter;
    const matchesAdmin = adminFilter === 'all' || submission.adminId === adminFilter;
    
    return matchesSearch && matchesStatus && matchesAdmin;
  });

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      approved: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      rejected: { color: 'bg-red-100 text-red-800', icon: XCircle }
    };
    
    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', icon: AlertCircle };
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3" />
        {status.toUpperCase()}
      </span>
    );
  };

  const getPriorityBadge = (priority) => {
    const priorityConfig = {
      high: { color: 'bg-red-100 text-red-800', text: 'HIGH' },
      medium: { color: 'bg-yellow-100 text-yellow-800', text: 'MEDIUM' },
      low: { color: 'bg-green-100 text-green-800', text: 'LOW' }
    };
    
    const config = priorityConfig[priority] || { color: 'bg-gray-100 text-gray-800', text: 'NORMAL' };
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const handleApprove = (submissionId) => {
    setSubmissions(prev => prev.map(sub => 
      sub.id === submissionId ? { ...sub, status: 'approved' } : sub
    ));
    setStats(prev => ({
      ...prev,
      pending: prev.pending - 1,
      approved: prev.approved + 1
    }));
  };

  const handleReject = (submissionId) => {
    setSubmissions(prev => prev.map(sub => 
      sub.id === submissionId ? { ...sub, status: 'rejected' } : sub
    ));
    setStats(prev => ({
      ...prev,
      pending: prev.pending - 1,
      rejected: prev.rejected + 1
    }));
  };

  const handleCall = (phoneNumber) => {
    window.open(`tel:${phoneNumber}`, '_self');
  };

  const handleViewDetails = (submission) => {
    setSelectedSubmission(submission);
    setShowDetails(true);
  };

  const uniqueAdmins = [...new Set(submissions.map(s => ({ id: s.adminId, name: s.adminName })))];

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-gray-200 h-20 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Back to Overview Navigation */}
      {onNavigate && (
        <div className="mb-6">
          <button
            onClick={() => onNavigate('overview')}
            className="flex items-center space-x-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Overview</span>
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Verification Submissions</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Review and validate marketer verification forms from your assigned Admins
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="flex items-center">
            <Clock className="w-8 h-8 text-yellow-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending Review</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.pending}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="flex items-center">
            <CheckCircle className="w-8 h-8 text-green-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Approved Today</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.approved}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="flex items-center">
            <XCircle className="w-8 h-8 text-red-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Rejected Today</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.rejected}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="flex items-center">
            <FileText className="w-8 h-8 text-blue-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Submissions</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by marketer or admin name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
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
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Admin
            </label>
            <select
              value={adminFilter}
              onChange={(e) => setAdminFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All Admins</option>
              {uniqueAdmins.map(admin => (
                <option key={admin.id} value={admin.id}>{admin.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Submissions List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Verification Submissions ({filteredSubmissions.length})
          </h3>
        </div>
        
        {filteredSubmissions.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No submissions found</h3>
            <p className="text-gray-600 dark:text-gray-400">
              {searchTerm || statusFilter !== 'all' || adminFilter !== 'all' 
                ? 'No submissions match your current filters.'
                : 'No verification forms have been submitted yet.'
              }
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredSubmissions.map((submission) => (
              <div key={submission.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-2">
                      <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                        {submission.marketerName}
                      </h4>
                      {getStatusBadge(submission.status)}
                      {getPriorityBadge(submission.priority)}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4" />
                        <span>Admin: {submission.adminName}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4" />
                        <span>{submission.location}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(submission.submissionDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleCall(submission.marketerPhone)}
                      className="flex items-center space-x-1 px-3 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
                    >
                      <Phone className="w-4 h-4" />
                      <span>Call</span>
                    </button>
                    
                    <button
                      onClick={() => handleViewDetails(submission)}
                      className="flex items-center space-x-1 px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Review</span>
                    </button>
                    
                    {submission.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleApprove(submission.id)}
                          className="flex items-center space-x-1 px-3 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
                        >
                          <ThumbsUp className="w-4 h-4" />
                          <span>Approve</span>
                        </button>
                        
                        <button
                          onClick={() => handleReject(submission.id)}
                          className="flex items-center space-x-1 px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                        >
                          <ThumbsDown className="w-4 h-4" />
                          <span>Reject</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Submission Details Modal */}
      {showDetails && selectedSubmission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Verification Details - {selectedSubmission.marketerName}
                </h3>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Marketer Information */}
                <div>
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Marketer Information</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Name</label>
                      <p className="text-gray-900 dark:text-white">{selectedSubmission.marketerName}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Phone</label>
                      <p className="text-gray-900 dark:text-white">{selectedSubmission.marketerPhone}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Location</label>
                      <p className="text-gray-900 dark:text-white">{selectedSubmission.location}</p>
                    </div>
                  </div>
                </div>
                
                {/* Admin Information */}
                <div>
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Admin Information</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Admin Name</label>
                      <p className="text-gray-900 dark:text-white">{selectedSubmission.adminName}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Admin ID</label>
                      <p className="text-gray-900 dark:text-white">{selectedSubmission.adminId}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Submission Date</label>
                      <p className="text-gray-900 dark:text-white">
                        {new Date(selectedSubmission.submissionDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Documents */}
              <div className="mt-6">
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Uploaded Documents</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {selectedSubmission.documents.map((doc, index) => (
                    <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <img
                        src={doc.url}
                        alt={doc.name}
                        className="w-full h-32 object-cover rounded mb-2"
                      />
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{doc.name}</p>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Forms Status */}
              <div className="mt-6">
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Forms Status</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">Biodata Form</span>
                      {selectedSubmission.forms.biodata.completed ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500" />
                      )}
                    </div>
                    {selectedSubmission.forms.biodata.completed && (
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        <p>Name: {selectedSubmission.forms.biodata.data.name}</p>
                        <p>Phone: {selectedSubmission.forms.biodata.data.phone}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">Guarantor Form</span>
                      {selectedSubmission.forms.guarantor.completed ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500" />
                      )}
                    </div>
                    {selectedSubmission.forms.guarantor.completed && (
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        <p>Name: {selectedSubmission.forms.guarantor.data.name}</p>
                        <p>Relationship: {selectedSubmission.forms.guarantor.data.relationship}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">Commitment Form</span>
                      {selectedSubmission.forms.commitment.completed ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500" />
                      )}
                    </div>
                    {selectedSubmission.forms.commitment.completed && (
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        <p>Amount: {selectedSubmission.forms.commitment.data.amount}</p>
                        <p>Duration: {selectedSubmission.forms.commitment.data.duration}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Verification Notes */}
              {selectedSubmission.verificationNotes && (
                <div className="mt-6">
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Verification Notes</h4>
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <p className="text-gray-900 dark:text-white">{selectedSubmission.verificationNotes}</p>
                  </div>
                </div>
              )}
              
              {/* Action Buttons */}
              <div className="mt-6 flex justify-end space-x-4">
                <button
                  onClick={() => setShowDetails(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Close
                </button>
                {selectedSubmission.status === 'pending' && (
                  <>
                    <button
                      onClick={() => {
                        handleApprove(selectedSubmission.id);
                        setShowDetails(false);
                      }}
                      className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
                    >
                      Approve Submission
                    </button>
                    <button
                      onClick={() => {
                        handleReject(selectedSubmission.id);
                        setShowDetails(false);
                      }}
                      className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                    >
                      Reject Submission
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminSubmissions;
