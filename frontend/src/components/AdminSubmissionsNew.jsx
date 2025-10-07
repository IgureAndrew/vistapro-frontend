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
  Upload,
  Camera,
  Send,
  XCircle
} from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { format } from "date-fns";
import ViewSubmissionModal from "./ViewSubmissionModal";
import AdminVerificationUploadModal from "./AdminVerificationUploadModal";
import VerificationStatusModal from "./VerificationStatusModal";

const API_URL = import.meta.env.VITE_API_URL;

const AdminSubmissionsNew = ({ onNavigate, isDarkMode }) => {
  const [submissions, setSubmissions] = useState([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [uploadData, setUploadData] = useState({
    marketerAddress: "",
    landmarkDescription: "",
    verificationNotes: ""
  });
  const [uploadFiles, setUploadFiles] = useState({
    locationPhotos: null,
    adminMarketerPhotos: null,
    landmarkPhotos: null
  });
  const [uploading, setUploading] = useState(false);
  const [stats, setStats] = useState({
    totalSubmissions: 0,
    pendingReview: 0,
    adminVerified: 0,
    sentToSuperAdmin: 0,
  });

  useEffect(() => {
    fetchSubmissions();
  }, []);

  useEffect(() => {
    applyFilters();
    calculateStats();
  }, [searchTerm, statusFilter, submissions]);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${API_URL}/api/verification/submissions/admin`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      console.log('🔍 AdminSubmissionsNew API response:', response.data);
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
      setError(null);
    } catch (err) {
      console.error("Error fetching Admin submissions:", err);
      setError("Failed to load submissions.");
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    const totalSubmissions = submissions.length;
    const pendingReview = submissions.filter(s => s.submission_status === 'pending_admin_review').length;
    const adminVerified = submissions.filter(s => s.submission_status === 'admin_verified').length;
    const sentToSuperAdmin = submissions.filter(s => s.submission_status === 'pending_superadmin_review').length;
    
    setStats({
      totalSubmissions,
      pendingReview,
      adminVerified,
      sentToSuperAdmin
    });
  };

  const applyFilters = () => {
    let filtered = submissions;

    if (searchTerm) {
      filtered = filtered.filter(
        (s) =>
          s.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.phone?.includes(searchTerm)
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((s) => s.submission_status === statusFilter);
    }

    setFilteredSubmissions(filtered);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending_admin_review: { color: "bg-yellow-100 text-yellow-800", icon: Clock, label: "Pending Review" },
      admin_verified: { color: "bg-blue-100 text-blue-800", icon: CheckCircle, label: "Admin Verified" },
      pending_superadmin_review: { color: "bg-purple-100 text-purple-800", icon: Send, label: "Sent to SuperAdmin" },
      superadmin_verified: { color: "bg-green-100 text-green-800", icon: CheckCircle, label: "SuperAdmin Verified" },
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

  const handleUploadVerification = (submission) => {
    setSelectedSubmission(submission);
    setUploadData({
      marketerAddress: submission.marketer_address || "",
      landmarkDescription: submission.landmark_description || "",
      verificationNotes: submission.verification_notes || ""
    });
    setIsUploadModalOpen(true);
  };

  const handleSendToSuperAdmin = async (submission) => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${API_URL}/api/verification/admin/send-to-superadmin/${submission.submission_id}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      alert("Submission sent to SuperAdmin successfully!");
      fetchSubmissions(); // Refresh the submissions list
    } catch (error) {
      console.error("Error sending to SuperAdmin:", error);
      alert("Failed to send submission to SuperAdmin.");
    }
  };

  const handleResetForTesting = async (submission) => {
    if (!confirm(`Are you sure you want to reset the status for ${submission.first_name} ${submission.last_name}? This will allow you to test the upload and verify process again.`)) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${API_URL}/api/verification/admin/reset-status/${submission.submission_id}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      alert("Submission status reset successfully! You can now test the upload and verify process again.");
      fetchSubmissions(); // Refresh the submissions list
    } catch (error) {
      console.error("Error resetting submission status:", error);
      alert("Failed to reset submission status.");
    }
  };

  const handleFileChange = (field, file) => {
    setUploadFiles(prev => ({
      ...prev,
      [field]: file
    }));
  };

  const handleUploadSubmit = async () => {
    if (!selectedSubmission) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('marketerAddress', uploadData.marketerAddress);
      formData.append('landmarkDescription', uploadData.landmarkDescription);
      formData.append('verificationNotes', uploadData.verificationNotes);

      if (uploadFiles.locationPhotos) {
        formData.append('locationPhotos', uploadFiles.locationPhotos);
      }
      if (uploadFiles.adminMarketerPhotos) {
        formData.append('adminMarketerPhotos', uploadFiles.adminMarketerPhotos);
      }
      if (uploadFiles.landmarkPhotos) {
        formData.append('landmarkPhotos', uploadFiles.landmarkPhotos);
      }

      const token = localStorage.getItem("token");
      await axios.post(
        `${API_URL}/api/verification/admin/upload-verification/${selectedSubmission.submission_id}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      alert("Verification details uploaded successfully!");
      setIsUploadModalOpen(false);
      setUploadData({ marketerAddress: "", landmarkDescription: "", verificationNotes: "" });
      setUploadFiles({ locationPhotos: null, adminMarketerPhotos: null, landmarkPhotos: null });
      fetchSubmissions();
    } catch (err) {
      console.error("Error uploading verification details:", err);
      alert("Failed to upload verification details.");
    } finally {
      setUploading(false);
    }
  };


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
          Admin Submissions
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Review and verify marketer submissions from your assigned marketers.
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
                Admin Verified
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-blue-500 dark:text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.adminVerified}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white dark:bg-gray-800 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Sent to SuperAdmin
              </CardTitle>
              <Send className="h-4 w-4 text-purple-500 dark:text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.sentToSuperAdmin}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Input
            type="text"
            placeholder="Search by marketer name or email..."
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
            <option value="pending_admin_review">Pending Review</option>
            <option value="admin_verified">Admin Verified</option>
            <option value="pending_superadmin_review">Sent to SuperAdmin</option>
            <option value="superadmin_verified">SuperAdmin Verified</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
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
                      Forms Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Submission Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Submitted Date
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
                              {submission.first_name} {submission.last_name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {submission.email}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {submission.phone}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col space-y-1">
                          <div className="flex items-center space-x-2">
                            <CheckCircle className={`w-4 h-4 ${submission.biodata_submitted ? 'text-green-500' : 'text-gray-300'}`} />
                            <span className="text-sm text-gray-900 dark:text-white">Biodata</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <CheckCircle className={`w-4 h-4 ${submission.guarantor_submitted ? 'text-green-500' : 'text-gray-300'}`} />
                            <span className="text-sm text-gray-900 dark:text-white">Guarantor</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <CheckCircle className={`w-4 h-4 ${submission.commitment_submitted ? 'text-green-500' : 'text-gray-300'}`} />
                            <span className="text-sm text-gray-900 dark:text-white">Commitment</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(submission.submission_status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {submission.submission_created_at ? 
                          format(new Date(submission.submission_created_at), 'MMM dd, yyyy') : 
                          'N/A'
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          {submission.submission_status === 'pending_admin_review' && submission.all_forms_submitted && (
                            <Button
                              onClick={() => handleUploadVerification(submission)}
                              className="bg-blue-600 hover:bg-blue-700 text-white"
                              size="sm"
                            >
                              <Upload className="w-4 h-4 mr-1" />
                              Upload Verification
                            </Button>
                          )}
                          {submission.submission_status === 'admin_verified' && (
                            <Button
                              onClick={() => handleSendToSuperAdmin(submission)}
                              className="bg-purple-600 hover:bg-purple-700 text-white"
                              size="sm"
                            >
                              <Send className="w-4 h-4 mr-1" />
                              Send to SuperAdmin
                            </Button>
                          )}
                          {submission.submission_status === 'pending_superadmin_review' && (
                            <Button
                              onClick={() => handleResetForTesting(submission)}
                              className="bg-orange-600 hover:bg-orange-700 text-white"
                              size="sm"
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Reset for Testing
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedSubmission(submission);
                              setIsViewModalOpen(true);
                            }}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedSubmission(submission);
                              setIsStatusModalOpen(true);
                            }}
                            className="bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200"
                          >
                            <FileText className="w-4 h-4 mr-1" />
                            Status
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Upload Verification Modal */}
        {isUploadModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Upload Verification Details
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Upload location photos and verification details for {selectedSubmission?.first_name} {selectedSubmission?.last_name}
                </p>
              </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Marketer Address
                </label>
                <textarea
                  value={uploadData.marketerAddress}
                  onChange={(e) => setUploadData(prev => ({ ...prev, marketerAddress: e.target.value }))}
                  placeholder="Enter the marketer's residential address"
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Landmark Description
                </label>
                <textarea
                  value={uploadData.landmarkDescription}
                  onChange={(e) => setUploadData(prev => ({ ...prev, landmarkDescription: e.target.value }))}
                  placeholder="Describe landmarks near the address"
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Location Photo
                </label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange('locationPhoto', e.target.files[0])}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Admin & Marketer Photo
                </label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange('adminMarketerPhoto', e.target.files[0])}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Verification Notes
                </label>
                <textarea
                  value={uploadData.verificationNotes}
                  onChange={(e) => setUploadData(prev => ({ ...prev, verificationNotes: e.target.value }))}
                  placeholder="Additional verification notes"
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  rows={3}
                />
              </div>
            </div>
              <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setIsUploadModalOpen(false)}
                  disabled={uploading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUploadSubmit}
                  disabled={uploading || !uploadData.marketerAddress}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {uploading ? "Uploading..." : "Upload Verification"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* View Submission Modal */}
      <ViewSubmissionModal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedSubmission(null);
        }}
        submission={selectedSubmission}
      />

      {/* Admin Verification Upload Modal */}
      <AdminVerificationUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => {
          setIsUploadModalOpen(false);
          setSelectedSubmission(null);
        }}
        submission={selectedSubmission}
        onSuccess={() => {
          // Refresh submissions after successful upload
          fetchSubmissions();
        }}
      />

      <VerificationStatusModal
        isOpen={isStatusModalOpen}
        onClose={() => {
          setIsStatusModalOpen(false);
          setSelectedSubmission(null);
        }}
        submissionId={selectedSubmission?.submission_id}
      />
    </div>
  );
};

export default AdminSubmissionsNew;
