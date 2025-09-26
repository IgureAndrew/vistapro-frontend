import React, { useState, useEffect } from "react";
import axios from "axios";
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
  Send,
  XCircle,
  Users,
  Camera,
  MessageSquare
} from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { format } from "date-fns";

const API_URL = import.meta.env.VITE_API_URL;

const SuperAdminSubmissionsNew = ({ onNavigate, isDarkMode }) => {
  const [submissions, setSubmissions] = useState([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [adminFilter, setAdminFilter] = useState("all");
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [validationNotes, setValidationNotes] = useState("");
  const [validating, setValidating] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [stats, setStats] = useState({
    totalSubmissions: 0,
    pendingReview: 0,
    superadminVerified: 0,
    sentToMasterAdmin: 0,
  });

  useEffect(() => {
    fetchSubmissions();
  }, []);

  useEffect(() => {
    applyFilters();
    calculateStats();
  }, [searchTerm, statusFilter, adminFilter, submissions]);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${API_URL}/api/verification/submissions/superadmin`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setSubmissions(response.data.submissions || []);
      setError(null);
    } catch (err) {
      console.error("Error fetching SuperAdmin submissions:", err);
      setError("Failed to load submissions.");
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    const totalSubmissions = submissions.length;
    const pendingReview = submissions.filter(s => s.submission_status === 'pending_superadmin_review').length;
    const superadminVerified = submissions.filter(s => s.submission_status === 'superadmin_verified').length;
    const sentToMasterAdmin = submissions.filter(s => s.submission_status === 'pending_masteradmin_approval').length;
    
    setStats({
      totalSubmissions,
      pendingReview,
      superadminVerified,
      sentToMasterAdmin
    });
  };

  const applyFilters = () => {
    let filtered = submissions;

    if (searchTerm) {
      filtered = filtered.filter(
        (s) =>
          s.marketer_first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.marketer_last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.admin_first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.admin_last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.marketer_email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((s) => s.submission_status === statusFilter);
    }

    if (adminFilter !== "all") {
      filtered = filtered.filter((s) => s.admin_id === parseInt(adminFilter));
    }

    setFilteredSubmissions(filtered);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending_superadmin_review: { color: "bg-yellow-100 text-yellow-800", icon: Clock, label: "Pending Review" },
      superadmin_verified: { color: "bg-green-100 text-green-800", icon: CheckCircle, label: "Verified" },
      pending_masteradmin_approval: { color: "bg-purple-100 text-purple-800", icon: Send, label: "Sent to MasterAdmin" },
      approved: { color: "bg-green-100 text-green-800", icon: CheckCircle, label: "Approved" },
      rejected: { color: "bg-red-100 text-red-800", icon: XCircle, label: "Rejected" },
    };

    const config = statusConfig[status] || {
      color: "bg-gray-100 text-gray-800",
      icon: AlertCircle,
      label: status?.replace(/_/g, " ").toUpperCase() || "Unknown"
    };
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const handleValidate = async () => {
    if (!selectedSubmission || !validationNotes.trim()) {
      alert("Please provide validation notes.");
      return;
    }

    setValidating(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.patch(
        `${API_URL}/api/verification/superadmin-verify`,
        { 
          marketerUniqueId: selectedSubmission.marketer_unique_id,
          verified: "yes",
          superadmin_review_report: validationNotes
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Show success message with more details
      if (response.data.success) {
        alert(`✅ ${response.data.message}\n\nStatus: ${response.data.status}\n\nAll parties have been notified of this update.`);
        setIsReviewModalOpen(false);
        setValidationNotes("");
        fetchSubmissions();
      } else {
        alert(`❌ Verification failed: ${response.data.message}`);
      }
    } catch (err) {
      console.error("Error validating verification:", err);
      const errorMessage = err.response?.data?.message || "Failed to validate verification.";
      alert(`❌ Error: ${errorMessage}`);
    } finally {
      setValidating(false);
    }
  };

  const handleReject = async () => {
    if (!selectedSubmission || !validationNotes.trim()) {
      alert("Please provide rejection notes.");
      return;
    }

    if (!confirm("Are you sure you want to reject this verification? This will notify the marketer and admin.")) {
      return;
    }

    setRejecting(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.patch(
        `${API_URL}/api/verification/superadmin-verify`,
        { 
          marketerUniqueId: selectedSubmission.marketer_unique_id,
          verified: "no",
          superadmin_review_report: validationNotes
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Show success message with more details
      if (response.data.success) {
        alert(`✅ ${response.data.message}\n\nStatus: ${response.data.status}\n\nAll parties have been notified of this update.`);
        setIsReviewModalOpen(false);
        setValidationNotes("");
        fetchSubmissions();
      } else {
        alert(`❌ Rejection failed: ${response.data.message}`);
      }
    } catch (err) {
      console.error("Error rejecting verification:", err);
      const errorMessage = err.response?.data?.message || "Failed to reject verification.";
      alert(`❌ Error: ${errorMessage}`);
    } finally {
      setRejecting(false);
    }
  };

  const handleViewSubmission = (submission) => {
    setSelectedSubmission(submission);
    setIsReviewModalOpen(true);
  };

  const uniqueAdmins = [
    ...new Set(submissions.map((s) => ({ id: s.admin_id, name: `${s.admin_first_name} ${s.admin_last_name}` }))),
  ];

  const LoadingSkeleton = () => (
    <div className="animate-pulse space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="bg-gray-200 h-16 rounded"></div>
      ))}
    </div>
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {onNavigate && (
        <div className="mb-6">
          <Button
            onClick={() => onNavigate("overview")}
            className="flex items-center space-x-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            variant="ghost"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Overview</span>
          </Button>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          SuperAdmin Submissions
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Review and validate verification packages from your assigned Admins.
        </p>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-white dark:bg-gray-800 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Total Submissions
              </CardTitle>
              <FileText className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.totalSubmissions}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white dark:bg-gray-800 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Pending Review
              </CardTitle>
              <Clock className="h-4 w-4 text-yellow-500 dark:text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.pendingReview}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white dark:bg-gray-800 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Verified
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500 dark:text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.superadminVerified}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white dark:bg-gray-800 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Sent to MasterAdmin
              </CardTitle>
              <Send className="h-4 w-4 text-purple-500 dark:text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.sentToMasterAdmin}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Input
            type="text"
            placeholder="Search by marketer or admin name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-700"
          />
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-[180px] bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-700 border rounded-md px-3 py-2"
          >
            <option value="all">All Statuses</option>
            <option value="pending_superadmin_review">Pending Review</option>
            <option value="superadmin_verified">Verified</option>
            <option value="pending_masteradmin_approval">Sent to MasterAdmin</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <select 
            value={adminFilter} 
            onChange={(e) => setAdminFilter(e.target.value)}
            className="w-[180px] bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-700 border rounded-md px-3 py-2"
          >
            <option value="all">All Admins</option>
            {uniqueAdmins.map((admin) => (
              <option key={admin.id} value={admin.id.toString()}>
                {admin.name}
              </option>
            ))}
          </select>
        </div>

        {/* Submissions Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
          {loading ? (
            <LoadingSkeleton />
          ) : error ? (
            <div className="p-6 text-center text-red-500 dark:text-red-400">
              {error}
            </div>
          ) : filteredSubmissions.length === 0 ? (
            <div className="p-6 text-center text-gray-500 dark:text-gray-400">
              No submissions found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Marketer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Admin
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Submission Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredSubmissions.map((submission) => (
                    <tr key={submission.submission_id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                              <User className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {submission.marketer_first_name} {submission.marketer_last_name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {submission.marketer_email}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {submission.marketer_phone}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {submission.admin_first_name} {submission.admin_last_name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {submission.admin_email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {submission.submission_created_at ? 
                          format(new Date(submission.submission_created_at), 'MMM dd, yyyy') : 
                          'N/A'
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(submission.submission_status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <Button
                            onClick={() => handleViewSubmission(submission)}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                            size="sm"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Review
                          </Button>
                          {submission.submission_status === 'pending_superadmin_review' && (
                            <Button
                              onClick={() => handleViewSubmission(submission)}
                              className="bg-green-600 hover:bg-green-700 text-white"
                              size="sm"
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Validate
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Review Modal */}
        {isReviewModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl max-h-[80vh] overflow-y-auto w-full">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Review Verification Package
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Review marketer forms and admin verification details
                </p>
              </div>
            {selectedSubmission && (
              <div className="space-y-6">
                {/* Marketer Information */}
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    Marketer Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Name</label>
                      <p className="text-gray-900 dark:text-white">
                        {selectedSubmission.marketer_first_name} {selectedSubmission.marketer_last_name}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</label>
                      <p className="text-gray-900 dark:text-white">{selectedSubmission.marketer_email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Phone</label>
                      <p className="text-gray-900 dark:text-white">{selectedSubmission.marketer_phone}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Location</label>
                      <p className="text-gray-900 dark:text-white">{selectedSubmission.marketer_location}</p>
                    </div>
                  </div>
                </div>

                {/* Biodata Form Details */}
                {selectedSubmission.biodata && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                      Biodata Form Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Full Name</label>
                        <p className="text-gray-900 dark:text-white">{selectedSubmission.biodata.name}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Address</label>
                        <p className="text-gray-900 dark:text-white">{selectedSubmission.biodata.address}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Phone</label>
                        <p className="text-gray-900 dark:text-white">{selectedSubmission.biodata.phone}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Religion</label>
                        <p className="text-gray-900 dark:text-white">{selectedSubmission.biodata.religion}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Date of Birth</label>
                        <p className="text-gray-900 dark:text-white">
                          {selectedSubmission.biodata.date_of_birth ? 
                            format(new Date(selectedSubmission.biodata.date_of_birth), 'MMM dd, yyyy') : 
                            'N/A'
                          }
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Marital Status</label>
                        <p className="text-gray-900 dark:text-white">{selectedSubmission.biodata.marital_status}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">State of Origin</label>
                        <p className="text-gray-900 dark:text-white">{selectedSubmission.biodata.state_of_origin}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">State of Residence</label>
                        <p className="text-gray-900 dark:text-white">{selectedSubmission.biodata.state_of_residence}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Mother's Maiden Name</label>
                        <p className="text-gray-900 dark:text-white">{selectedSubmission.biodata.mothers_maiden_name}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">School Attended</label>
                        <p className="text-gray-900 dark:text-white">{selectedSubmission.biodata.school_attended}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Means of Identification</label>
                        <p className="text-gray-900 dark:text-white">{selectedSubmission.biodata.means_of_identification}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Last Place of Work</label>
                        <p className="text-gray-900 dark:text-white">{selectedSubmission.biodata.last_place_of_work}</p>
                      </div>
                    </div>
                    {/* Biodata Documents */}
                    {(selectedSubmission.biodata.passport_photo_url || selectedSubmission.biodata.id_document_url) && (
                      <div className="mt-4">
                        <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-2">Documents</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {selectedSubmission.biodata.passport_photo_url && (
                            <div>
                              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Passport Photo</label>
                              <img
                                src={selectedSubmission.biodata.passport_photo_url}
                                alt="Passport Photo"
                                className="w-full h-48 object-cover rounded-lg mt-2"
                              />
                            </div>
                          )}
                          {selectedSubmission.biodata.id_document_url && (
                            <div>
                              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">ID Document</label>
                              <img
                                src={selectedSubmission.biodata.id_document_url}
                                alt="ID Document"
                                className="w-full h-48 object-cover rounded-lg mt-2"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Guarantor Form Details */}
                {selectedSubmission.guarantor && (
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                      Guarantor Form Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Well Known</label>
                        <p className="text-gray-900 dark:text-white">
                          {selectedSubmission.guarantor.is_candidate_known ? 'Yes' : 'No'}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Relationship</label>
                        <p className="text-gray-900 dark:text-white">{selectedSubmission.guarantor.relationship}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Known Duration (Years)</label>
                        <p className="text-gray-900 dark:text-white">{selectedSubmission.guarantor.known_duration}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Occupation</label>
                        <p className="text-gray-900 dark:text-white">{selectedSubmission.guarantor.occupation}</p>
                      </div>
                    </div>
                    {/* Guarantor Documents */}
                    {(selectedSubmission.guarantor.identification_file_url || selectedSubmission.guarantor.signature_url) && (
                      <div className="mt-4">
                        <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-2">Guarantor Documents</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {selectedSubmission.guarantor.identification_file_url && (
                            <div>
                              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">ID Document</label>
                              <img
                                src={selectedSubmission.guarantor.identification_file_url}
                                alt="Guarantor ID Document"
                                className="w-full h-48 object-cover rounded-lg mt-2"
                              />
                            </div>
                          )}
                          {selectedSubmission.guarantor.signature_url && (
                            <div>
                              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Signature</label>
                              <img
                                src={selectedSubmission.guarantor.signature_url}
                                alt="Guarantor Signature"
                                className="w-full h-48 object-cover rounded-lg mt-2"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Commitment Form Details */}
                {selectedSubmission.commitment && (
                  <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                      Commitment Form Details
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">
                          I promise I will not accept false or forged documents
                        </span>
                        <span className={`text-sm font-medium px-2 py-1 rounded ${
                          selectedSubmission.commitment.promise_accept_false_documents 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' 
                            : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                        }`}>
                          {selectedSubmission.commitment.promise_accept_false_documents ? 'Yes' : 'No'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">
                          I promise I will not request for information unrelated to our business
                        </span>
                        <span className={`text-sm font-medium px-2 py-1 rounded ${
                          selectedSubmission.commitment.promise_not_request_unrelated_info 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' 
                            : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                        }`}>
                          {selectedSubmission.commitment.promise_not_request_unrelated_info ? 'Yes' : 'No'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">
                          I promise I will not charge customer fees
                        </span>
                        <span className={`text-sm font-medium px-2 py-1 rounded ${
                          selectedSubmission.commitment.promise_not_charge_customer_fees 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' 
                            : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                        }`}>
                          {selectedSubmission.commitment.promise_not_charge_customer_fees ? 'Yes' : 'No'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">
                          I promise I will not modify any contract product information
                        </span>
                        <span className={`text-sm font-medium px-2 py-1 rounded ${
                          selectedSubmission.commitment.promise_not_modify_contract_info 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' 
                            : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                        }`}>
                          {selectedSubmission.commitment.promise_not_modify_contract_info ? 'Yes' : 'No'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">
                          I will not sell phones that are not under our company approved phones
                        </span>
                        <span className={`text-sm font-medium px-2 py-1 rounded ${
                          selectedSubmission.commitment.promise_not_sell_unapproved_phones 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' 
                            : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                        }`}>
                          {selectedSubmission.commitment.promise_not_sell_unapproved_phones ? 'Yes' : 'No'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">
                          I promise I will not make any non-official/unreasonable/illegal commitment
                        </span>
                        <span className={`text-sm font-medium px-2 py-1 rounded ${
                          selectedSubmission.commitment.promise_not_make_unofficial_commitment 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' 
                            : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                        }`}>
                          {selectedSubmission.commitment.promise_not_make_unofficial_commitment ? 'Yes' : 'No'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">
                          I promise I will not operate customer's personal account without their permissions
                        </span>
                        <span className={`text-sm font-medium px-2 py-1 rounded ${
                          selectedSubmission.commitment.promise_not_operate_customer_account 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' 
                            : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                        }`}>
                          {selectedSubmission.commitment.promise_not_operate_customer_account ? 'Yes' : 'No'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">
                          I promise if company found me involved in any fraudulent act, the company should fire me
                        </span>
                        <span className={`text-sm font-medium px-2 py-1 rounded ${
                          selectedSubmission.commitment.promise_accept_fraud_firing 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' 
                            : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                        }`}>
                          {selectedSubmission.commitment.promise_accept_fraud_firing ? 'Yes' : 'No'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">
                          I promise I will not share company's information with third party
                        </span>
                        <span className={`text-sm font-medium px-2 py-1 rounded ${
                          selectedSubmission.commitment.promise_not_share_company_info 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' 
                            : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                        }`}>
                          {selectedSubmission.commitment.promise_not_share_company_info ? 'Yes' : 'No'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">
                          I promise I will do my best to ensure the company recover all loan amount from my customers
                        </span>
                        <span className={`text-sm font-medium px-2 py-1 rounded ${
                          selectedSubmission.commitment.promise_ensure_loan_recovery 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' 
                            : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                        }`}>
                          {selectedSubmission.commitment.promise_ensure_loan_recovery ? 'Yes' : 'No'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">
                          I will strictly abide by the above system
                        </span>
                        <span className={`text-sm font-medium px-2 py-1 rounded ${
                          selectedSubmission.commitment.promise_abide_by_system 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' 
                            : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                        }`}>
                          {selectedSubmission.commitment.promise_abide_by_system ? 'Yes' : 'No'}
                        </span>
                      </div>
                    </div>
                    <div className="mt-4">
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Direct Sales Rep Name</label>
                      <p className="text-gray-900 dark:text-white">{selectedSubmission.commitment.direct_sales_rep_name}</p>
                    </div>
                    {/* Commitment Signature */}
                    {selectedSubmission.commitment.direct_sales_rep_signature_url && (
                      <div className="mt-4">
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Direct Sales Rep Signature</label>
                        <img
                          src={selectedSubmission.commitment.direct_sales_rep_signature_url}
                          alt="Direct Sales Rep Signature"
                          className="w-full h-32 object-contain rounded-lg mt-2"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Admin Verification Details */}
                {selectedSubmission.admin_verification && (
                  <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                      Admin Verification Details
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Marketer Address</label>
                        <p className="text-gray-900 dark:text-white">{selectedSubmission.admin_verification.marketer_address}</p>
                      </div>
                      {selectedSubmission.admin_verification.landmark_description && (
                        <div>
                          <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Landmark Description</label>
                          <p className="text-gray-900 dark:text-white">{selectedSubmission.admin_verification.landmark_description}</p>
                        </div>
                      )}
                      {selectedSubmission.admin_verification.verification_notes && (
                        <div>
                          <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Admin Notes</label>
                          <p className="text-gray-900 dark:text-white">{selectedSubmission.admin_verification.verification_notes}</p>
                        </div>
                      )}
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Verification Date</label>
                        <p className="text-gray-900 dark:text-white">
                          {selectedSubmission.admin_verification.admin_verification_date ? 
                            format(new Date(selectedSubmission.admin_verification.admin_verification_date), 'MMM dd, yyyy HH:mm') : 
                            'N/A'
                          }
                        </p>
                      </div>
                    </div>
                    {/* Admin Verification Photos */}
                    {(selectedSubmission.admin_verification.location_photo_url || selectedSubmission.admin_verification.admin_marketer_photo_url) && (
                      <div className="mt-4">
                        <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-2">Verification Photos</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {selectedSubmission.admin_verification.location_photo_url && (
                            <div>
                              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Location Photo</label>
                              <img
                                src={selectedSubmission.admin_verification.location_photo_url}
                                alt="Location Photo"
                                className="w-full h-48 object-cover rounded-lg mt-2"
                              />
                            </div>
                          )}
                          {selectedSubmission.admin_verification.admin_marketer_photo_url && (
                            <div>
                              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Admin & Marketer Photo</label>
                              <img
                                src={selectedSubmission.admin_verification.admin_marketer_photo_url}
                                alt="Admin and Marketer Photo"
                                className="w-full h-48 object-cover rounded-lg mt-2"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Validation Notes */}
                {selectedSubmission.submission_status === 'pending_superadmin_review' && (
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Validation Notes
                    </label>
                    <textarea
                      value={validationNotes}
                      onChange={(e) => setValidationNotes(e.target.value)}
                      placeholder="Enter your validation notes and verification call details..."
                      className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 focus:outline-none transition-colors"
                      rows={4}
                    />
                  </div>
                )}
              </div>
            )}
              <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setIsReviewModalOpen(false)}
                  disabled={validating || rejecting}
                >
                  Close
                </Button>
                {selectedSubmission?.submission_status === 'pending_superadmin_review' && (
                  <>
                    <Button
                      onClick={handleReject}
                      disabled={validating || rejecting || !validationNotes.trim()}
                      variant="destructive"
                      className="bg-red-600 hover:bg-red-700"
                    >
                      {rejecting ? "Rejecting..." : "Reject Verification"}
                    </Button>
                    <Button
                      onClick={handleValidate}
                      disabled={validating || rejecting || !validationNotes.trim()}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {validating ? "Validating..." : "Approve & Send to MasterAdmin"}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SuperAdminSubmissionsNew;
