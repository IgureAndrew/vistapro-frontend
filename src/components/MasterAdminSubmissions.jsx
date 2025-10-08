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
  MessageSquare,
  ThumbsUp,
  ThumbsDown
} from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { format } from "date-fns";

const API_URL = import.meta.env.VITE_API_URL;

const MasterAdminSubmissions = ({ onNavigate, isDarkMode }) => {
  // Helper function to safely get form field values
  const getFormField = (form, field) => {
    return form?.[field] || 'N/A';
  };

  // Helper function to safely get nested form field values
  const getNestedFormField = (form, field1, field2) => {
    return form?.[field1]?.[field2] || 'N/A';
  };

  const [submissions, setSubmissions] = useState([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [superAdminFilter, setSuperAdminFilter] = useState("all");
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [approvalAction, setApprovalAction] = useState("approve");
  const [approvalReason, setApprovalReason] = useState("");
  const [processing, setProcessing] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState("success"); // "success" or "error"
  const [activeTab, setActiveTab] = useState("pending"); // "pending" or "history"
  const [historySubmissions, setHistorySubmissions] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [stats, setStats] = useState({
    totalSubmissions: 0,
    pendingApproval: 0,
    approved: 0,
    rejected: 0,
    marketerVerifications: 0,
    adminSuperadminApprovals: 0,
  });

  useEffect(() => {
    fetchSubmissions();
    fetchHistorySubmissions(); // Load history submissions on mount for stats
  }, []);

  useEffect(() => {
    if (activeTab === "history") {
      fetchHistorySubmissions();
    }
  }, [activeTab]);

  useEffect(() => {
    applyFilters();
    calculateStats();
  }, [searchTerm, statusFilter, superAdminFilter, submissions, historySubmissions]);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("No authentication token found. Please log in again.");
        setSubmissions([]);
        setLoading(false);
        return;
      }

      const response = await axios.get(
        `${API_URL}/api/verification/submissions/master`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      // Safely set submissions with fallback
      setSubmissions(response.data?.submissions || []);
      
      // Update stats from response with safe fallbacks
      if (response.data && typeof response.data.marketer_verifications !== 'undefined') {
        setStats(prev => ({
          ...prev,
          marketerVerifications: response.data.marketer_verifications || 0,
          adminSuperadminApprovals: response.data.admin_superadmin_approvals || 0
        }));
      }
      
      setError(null);
    } catch (err) {
      console.error("Error fetching MasterAdmin submissions:", err);
      setError("Failed to load submissions. Please try again.");
      setSubmissions([]);
      setStats(prev => ({
        ...prev,
        marketerVerifications: 0,
        adminSuperadminApprovals: 0
      }));
    } finally {
      setLoading(false);
    }
  };

  // Fetch history submissions
  const fetchHistorySubmissions = async (status = 'all') => {
    try {
      setHistoryLoading(true);
      
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_URL}/api/verification/submissions/master/approved?status=${status}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        setHistorySubmissions(response.data.submissions);
      } else {
        console.error("Failed to fetch history submissions");
      }
    } catch (err) {
      console.error("Error fetching history submissions:", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const calculateStats = () => {
    // Combine pending and history submissions for complete stats
    const allSubmissions = [...submissions, ...historySubmissions];
    
    const totalSubmissions = allSubmissions.length;
    const pendingApproval = submissions.filter(s => 
      s.submission_type === 'marketer_verification' 
        ? (s.submission_status === 'superadmin_verified' || s.submission_status === 'pending_masteradmin_approval')
        : s.overall_verification_status === 'masteradmin_approval_pending'
    ).length;
    const approved = allSubmissions.filter(s => 
      s.submission_type === 'marketer_verification' 
        ? s.submission_status === 'approved'
        : s.overall_verification_status === 'approved'
    ).length;
    const rejected = allSubmissions.filter(s => 
      s.submission_type === 'marketer_verification' 
        ? s.submission_status === 'rejected'
        : s.overall_verification_status === 'rejected'
    ).length;
    
    const marketerVerifications = submissions.filter(s => s.submission_type === 'marketer_verification').length;
    const adminSuperadminApprovals = submissions.filter(s => s.submission_type === 'admin_superadmin_approval').length;
    
    setStats({
      totalSubmissions,
      pendingApproval,
      approved,
      rejected,
      marketerVerifications,
      adminSuperadminApprovals
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
          s.superadmin_first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.superadmin_last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.marketer_email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((s) => s.submission_status === statusFilter);
    }

    if (superAdminFilter !== "all") {
      filtered = filtered.filter((s) => s.super_admin_id && s.super_admin_id === parseInt(superAdminFilter));
    }

    setFilteredSubmissions(filtered);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      superadmin_verified: { color: "bg-green-100 text-green-800", icon: CheckCircle, label: "SuperAdmin Verified" },
      pending_masteradmin_approval: { color: "bg-purple-100 text-purple-800", icon: Clock, label: "Pending Approval" },
      approved: { color: "bg-green-100 text-green-800", icon: ThumbsUp, label: "Approved" },
      rejected: { color: "bg-red-100 text-red-800", icon: ThumbsDown, label: "Rejected" },
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

  const handleApproveReject = async () => {
    if (!selectedSubmission) {
      setAlertMessage("No submission selected.");
      setAlertType("error");
      setShowAlert(true);
      return;
    }

    // For Admin/SuperAdmin approvals, reason is optional
    if (selectedSubmission.submission_type === 'marketer_verification' && !approvalReason.trim()) {
      setAlertMessage(`Please provide a reason for ${approvalAction}.`);
      setAlertType("error");
      setShowAlert(true);
      return;
    }

    setProcessing(true);
    try {
      const token = localStorage.getItem("token");
      
      // Determine endpoint and request body based on submission type
      let endpoint, requestBody;
      
      if (selectedSubmission.submission_type === 'admin_superadmin_approval') {
        endpoint = `${API_URL}/api/verification/admin-superadmin/approve`;
        requestBody = {
          userId: selectedSubmission.user_id,
          action: approvalAction,
          reason: approvalReason.trim() || null
        };
      } else {
        endpoint = `${API_URL}/api/verification/masteradmin/approve/${selectedSubmission.submission_id}`;
        requestBody = {
          action: approvalAction,
          reason: approvalReason
        };
      }

      const response = await axios.post(
        endpoint,
        requestBody,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Show success alert
      const userType = selectedSubmission.submission_type === 'admin_superadmin_approval' 
        ? selectedSubmission.role 
        : 'marketer';
      setAlertMessage(`${userType} ${approvalAction}d successfully!`);
      setAlertType("success");
      setShowAlert(true);
      
      // Close modal and reset form
      setIsReviewModalOpen(false);
      setApprovalReason("");
      setApprovalAction("approve");
      
      // Refresh submissions to show updated status
      await fetchSubmissions();
      
    } catch (err) {
      console.error(`Error ${approvalAction}ing:`, err);
      
      // Show error alert with detailed message
      const errorMessage = err.response?.data?.message || 
                          err.message || 
                          `Failed to ${approvalAction}.`;
      
      setAlertMessage(errorMessage);
      setAlertType("error");
      setShowAlert(true);
    } finally {
      setProcessing(false);
    }
  };

  const handleViewSubmission = (submission) => {
    setSelectedSubmission(submission);
    setIsReviewModalOpen(true);
  };

  const uniqueSuperAdmins = [
    ...new Set(submissions
      .filter((s) => s.super_admin_id && s.superadmin_first_name && s.superadmin_last_name)
      .map((s) => ({ 
      id: s.super_admin_id, 
      name: `${s.superadmin_first_name} ${s.superadmin_last_name}` 
      }))
    ),
  ];

  const LoadingSkeleton = () => (
    <div className="animate-pulse space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="bg-gray-200 h-16 rounded"></div>
      ))}
    </div>
  );

  // Safety check to prevent crashes
  if (!submissions && typeof submissions !== 'object') {
    return (
      <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 dark:bg-gray-900 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">Loading submissions...</div>
        </div>
      </div>
    );
  }

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
          MasterAdmin Submissions
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Review and approve marketer verifications and Admin/SuperAdmin accounts.
        </p>

        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg w-fit">
          <button
            onClick={() => setActiveTab("pending")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === "pending"
                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            Pending Approval
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === "history"
                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            History
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
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
                Pending Approval
              </CardTitle>
              <Clock className="h-4 w-4 text-purple-500 dark:text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.pendingApproval}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white dark:bg-gray-800 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Marketer Verifications
              </CardTitle>
              <Users className="h-4 w-4 text-blue-500 dark:text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.marketerVerifications}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white dark:bg-gray-800 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Admin/SuperAdmin Approvals
              </CardTitle>
              <User className="h-4 w-4 text-orange-500 dark:text-orange-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.adminSuperadminApprovals}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white dark:bg-gray-800 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Approved
              </CardTitle>
              <ThumbsUp className="h-4 w-4 text-green-500 dark:text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.approved}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white dark:bg-gray-800 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Rejected
              </CardTitle>
              <ThumbsDown className="h-4 w-4 text-red-500 dark:text-red-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.rejected}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Input
            type="text"
            placeholder="Search by marketer, admin, or superadmin name..."
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
            <option value="superadmin_verified">SuperAdmin Verified</option>
            <option value="pending_masteradmin_approval">Pending Approval</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <select 
            value={superAdminFilter} 
            onChange={(e) => setSuperAdminFilter(e.target.value)}
            className="w-[180px] bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-700 border rounded-md px-3 py-2"
          >
            <option value="all">All SuperAdmins</option>
            {uniqueSuperAdmins.map((superAdmin) => (
              <option key={superAdmin.id} value={superAdmin.id.toString()}>
                {superAdmin.name}
              </option>
            ))}
          </select>
        </div>

        {/* Submissions Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
          {activeTab === "pending" ? (
            loading ? (
              <LoadingSkeleton />
            ) : error ? (
              <div className="p-6 text-center text-red-500 dark:text-red-400">
                {error}
              </div>
            ) : filteredSubmissions.length === 0 ? (
              <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                No pending submissions found.
              </div>
            ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Admin
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      SuperAdmin
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
                  {filteredSubmissions.map((submission) => {
                    const isMarketerVerification = submission.submission_type === 'marketer_verification';
                    const isAdminSuperadminApproval = submission.submission_type === 'admin_superadmin_approval';
                    
                    return (
                      <tr key={submission.submission_id || submission.user_id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                                <User className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {isMarketerVerification 
                                  ? `${submission.marketer_first_name} ${submission.marketer_last_name}`
                                  : `${submission.first_name} ${submission.last_name}`
                                }
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {isMarketerVerification ? submission.marketer_email : submission.email}
                              </div>
                              {isMarketerVerification && (
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  {submission.marketer_unique_id}
                                </div>
                              )}
                              {isAdminSuperadminApproval && (
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  {submission.user_unique_id}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge 
                            className={
                              isMarketerVerification 
                                ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                                : "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
                            }
                          >
                            {isMarketerVerification ? 'Marketer Verification' : `${submission.role} Approval`}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {isMarketerVerification ? (
                              <>
                                {submission.admin_first_name} {submission.admin_last_name}
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  {submission.admin_unique_id}
                                </div>
                              </>
                            ) : (
                              'N/A'
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {isMarketerVerification ? (
                              <>
                                {submission.superadmin_first_name} {submission.superadmin_last_name}
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  {submission.superadmin_unique_id}
                                </div>
                              </>
                            ) : (
                              'N/A'
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {isMarketerVerification 
                            ? (submission.submission_created_at ? 
                                format(new Date(submission.submission_created_at), 'MMM dd, yyyy') : 
                                'N/A')
                            : (submission.created_at ? 
                                format(new Date(submission.created_at), 'MMM dd, yyyy') : 
                                'N/A')
                          }
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {isMarketerVerification 
                            ? getStatusBadge(submission.submission_status)
                            : getStatusBadge(submission.overall_verification_status)
                          }
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
                            {((isMarketerVerification && 
                               (submission.submission_status === 'superadmin_verified' || submission.submission_status === 'pending_masteradmin_approval')) ||
                              (isAdminSuperadminApproval && submission.overall_verification_status === 'masteradmin_approval_pending')) && (
                              <>
                                <Button
                                  onClick={() => {
                                    setApprovalAction("approve");
                                    handleViewSubmission(submission);
                                  }}
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                  size="sm"
                                >
                                  <ThumbsUp className="w-4 h-4 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  onClick={() => {
                                    setApprovalAction("reject");
                                    handleViewSubmission(submission);
                                  }}
                                  className="bg-red-600 hover:bg-red-700 text-white"
                                  size="sm"
                                >
                                  <ThumbsDown className="w-4 h-4 mr-1" />
                                  Reject
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            )
          ) : (
            // History Tab
            historyLoading ? (
              <LoadingSkeleton />
            ) : historySubmissions.length === 0 ? (
              <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                No history submissions found.
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
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        SuperAdmin
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Date Approved/Rejected
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {historySubmissions.map((submission) => (
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
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(submission.submission_status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {submission.superadmin_first_name} {submission.superadmin_last_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {submission.masteradmin_approved_at 
                            ? format(new Date(submission.masteradmin_approved_at), 'MMM dd, yyyy HH:mm')
                            : submission.rejected_at 
                            ? format(new Date(submission.rejected_at), 'MMM dd, yyyy HH:mm')
                            : 'N/A'
                          }
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Button
                            onClick={() => {
                              setSelectedSubmission(submission);
                              setIsReviewModalOpen(true);
                            }}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                            variant="ghost"
                            size="sm"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View Details
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>

        {/* Review Modal */}
        {isReviewModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-6xl max-h-[80vh] overflow-y-auto w-full">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {selectedSubmission?.submission_type === 'admin_superadmin_approval' 
                    ? `Review ${selectedSubmission.role} Account Approval`
                    : 'Review Complete Verification Package'
                  }
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {selectedSubmission?.submission_type === 'admin_superadmin_approval' 
                    ? `Review ${selectedSubmission.role} account details before making a decision. No forms required.`
                    : 'Review marketer forms, admin verification, and superadmin validation'
                  }
                </p>
              </div>
            {selectedSubmission && (
              <div className="space-y-6">
                {/* User Information */}
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    {selectedSubmission.submission_type === 'admin_superadmin_approval' 
                      ? `${selectedSubmission.role} Information`
                      : 'Marketer Information'
                    }
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Name</label>
                      <p className="text-gray-900 dark:text-white">
                        {selectedSubmission.submission_type === 'admin_superadmin_approval' 
                          ? `${selectedSubmission.first_name} ${selectedSubmission.last_name}`
                          : `${selectedSubmission.marketer_first_name} ${selectedSubmission.marketer_last_name}`
                        }
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</label>
                      <p className="text-gray-900 dark:text-white">
                        {selectedSubmission.submission_type === 'admin_superadmin_approval' 
                          ? selectedSubmission.email
                          : selectedSubmission.marketer_email
                        }
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        {selectedSubmission.submission_type === 'admin_superadmin_approval' ? 'Unique ID' : 'Phone'}
                      </label>
                      <p className="text-gray-900 dark:text-white">
                        {selectedSubmission.submission_type === 'admin_superadmin_approval' 
                          ? selectedSubmission.user_unique_id
                          : selectedSubmission.marketer_phone
                        }
                      </p>
                    </div>
                  </div>
                </div>

                {/* Marketer Biodata Form - Only show for marketer verifications */}
                {selectedSubmission.submission_type === 'marketer_verification' && selectedSubmission.biodata && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                      Marketer Biodata Form
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Full Name</label>
                        <p className="text-gray-900 dark:text-white">{selectedSubmission.biodata?.name || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Phone</label>
                        <p className="text-gray-900 dark:text-white">{selectedSubmission.biodata?.phone || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Address</label>
                        <p className="text-gray-900 dark:text-white">{selectedSubmission.biodata?.address || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Religion</label>
                        <p className="text-gray-900 dark:text-white">{getFormField(selectedSubmission.biodata, 'religion')}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Date of Birth</label>
                        <p className="text-gray-900 dark:text-white">
                          {selectedSubmission.biodata?.date_of_birth ? 
                            format(new Date(selectedSubmission.biodata?.date_of_birth), 'MMM dd, yyyy') : 
                            'N/A'
                          }
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Marital Status</label>
                        <p className="text-gray-900 dark:text-white">{selectedSubmission.biodata?.marital_status}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">State of Origin</label>
                        <p className="text-gray-900 dark:text-white">{selectedSubmission.biodata?.state_of_origin}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">State of Residence</label>
                        <p className="text-gray-900 dark:text-white">{selectedSubmission.biodata?.state_of_residence}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Mother's Maiden Name</label>
                        <p className="text-gray-900 dark:text-white">{selectedSubmission.biodata?.mothers_maiden_name}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">School Attended</label>
                        <p className="text-gray-900 dark:text-white">{selectedSubmission.biodata?.school_attended}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Means of Identification</label>
                        <p className="text-gray-900 dark:text-white">{selectedSubmission.biodata?.means_of_identification}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Last Place of Work</label>
                        <p className="text-gray-900 dark:text-white">{selectedSubmission.biodata?.last_place_of_work}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Job Description</label>
                        <p className="text-gray-900 dark:text-white">{selectedSubmission.biodata?.job_description}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Reason for Quitting</label>
                        <p className="text-gray-900 dark:text-white">{selectedSubmission.biodata?.reason_for_quitting}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Medical Condition</label>
                        <p className="text-gray-900 dark:text-white">{selectedSubmission.biodata?.medical_condition}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Next of Kin Name</label>
                        <p className="text-gray-900 dark:text-white">{selectedSubmission.biodata?.next_of_kin_name}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Next of Kin Phone</label>
                        <p className="text-gray-900 dark:text-white">{selectedSubmission.biodata?.next_of_kin_phone}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Next of Kin Address</label>
                        <p className="text-gray-900 dark:text-white">{selectedSubmission.biodata?.next_of_kin_address}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Next of Kin Relationship</label>
                        <p className="text-gray-900 dark:text-white">{selectedSubmission.biodata?.next_of_kin_relationship}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Bank Name</label>
                        <p className="text-gray-900 dark:text-white">{selectedSubmission.biodata?.bank_name}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Account Name</label>
                        <p className="text-gray-900 dark:text-white">{selectedSubmission.biodata?.account_name}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Account Number</label>
                        <p className="text-gray-900 dark:text-white">{selectedSubmission.biodata?.account_number}</p>
                      </div>
                    </div>
                    {selectedSubmission.biodata?.id_document_url && (
                      <div className="mt-4">
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">ID Document</label>
                        <img
                          src={selectedSubmission.biodata?.id_document_url}
                          alt="ID Document"
                          className="w-full h-48 object-cover rounded-lg mt-2"
                        />
                      </div>
                    )}
                    {selectedSubmission.biodata?.passport_photo_url && (
                      <div className="mt-4">
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Passport Photo</label>
                        <img
                          src={selectedSubmission.biodata?.passport_photo_url}
                          alt="Passport Photo"
                          className="w-full h-48 object-cover rounded-lg mt-2"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Guarantor Employment Form - Only show for marketer verifications */}
                {selectedSubmission.submission_type === 'marketer_verification' && selectedSubmission.guarantor && (
                  <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                      Guarantor Employment Form
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Is Candidate Known</label>
                        <p className="text-gray-900 dark:text-white">
                          {selectedSubmission.guarantor?.is_candidate_known ? 'Yes' : 'No'}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Relationship</label>
                        <p className="text-gray-900 dark:text-white">{selectedSubmission.guarantor?.relationship}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Known Duration</label>
                        <p className="text-gray-900 dark:text-white">{selectedSubmission.guarantor?.known_duration}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Occupation</label>
                        <p className="text-gray-900 dark:text-white">{selectedSubmission.guarantor?.occupation}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Means of Identification</label>
                        <p className="text-gray-900 dark:text-white">{selectedSubmission.guarantor?.means_of_identification}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Guarantor Full Name</label>
                        <p className="text-gray-900 dark:text-white">{selectedSubmission.guarantor?.guarantor_full_name}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Guarantor Home Address</label>
                        <p className="text-gray-900 dark:text-white">{selectedSubmission.guarantor?.guarantor_home_address}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Guarantor Office Address</label>
                        <p className="text-gray-900 dark:text-white">{selectedSubmission.guarantor?.guarantor_office_address}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Guarantor Email</label>
                        <p className="text-gray-900 dark:text-white">{selectedSubmission.guarantor?.guarantor_email}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Guarantor Phone</label>
                        <p className="text-gray-900 dark:text-white">{selectedSubmission.guarantor?.guarantor_phone}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Candidate Name</label>
                        <p className="text-gray-900 dark:text-white">{selectedSubmission.guarantor?.candidate_name}</p>
                      </div>
                    </div>
                    {selectedSubmission.guarantor?.identification_file_url && (
                      <div className="mt-4">
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Identification Document</label>
                        <img
                          src={selectedSubmission.guarantor?.identification_file_url}
                          alt="Identification Document"
                          className="w-full h-48 object-cover rounded-lg mt-2"
                        />
                      </div>
                    )}
                    {selectedSubmission.guarantor?.signature_url && (
                      <div className="mt-4">
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Signature</label>
                        <img
                          src={selectedSubmission.guarantor?.signature_url}
                          alt="Signature"
                          className="w-full h-48 object-cover rounded-lg mt-2"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Direct Sales Commitment Form - Only show for marketer verifications */}
                {selectedSubmission.submission_type === 'marketer_verification' && selectedSubmission.commitment && (
                  <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                      Direct Sales Commitment Form
                    </h3>
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Promise to Accept False Documents</label>
                          <p className="text-gray-900 dark:text-white">
                            {selectedSubmission.commitment?.promise_accept_false_documents ? 'Yes' : 'No'}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Promise Not to Request Unrelated Info</label>
                          <p className="text-gray-900 dark:text-white">
                            {selectedSubmission.commitment?.promise_not_request_unrelated_info ? 'Yes' : 'No'}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Promise Not to Charge Customer Fees</label>
                          <p className="text-gray-900 dark:text-white">
                            {selectedSubmission.commitment?.promise_not_charge_customer_fees ? 'Yes' : 'No'}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Promise Not to Modify Contract Info</label>
                          <p className="text-gray-900 dark:text-white">
                            {selectedSubmission.commitment?.promise_not_modify_contract_info ? 'Yes' : 'No'}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Promise Not to Sell Unapproved Phones</label>
                          <p className="text-gray-900 dark:text-white">
                            {selectedSubmission.commitment?.promise_not_sell_unapproved_phones ? 'Yes' : 'No'}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Promise Not to Make Unofficial Commitment</label>
                          <p className="text-gray-900 dark:text-white">
                            {selectedSubmission.commitment?.promise_not_make_unofficial_commitment ? 'Yes' : 'No'}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Promise Not to Operate Customer Account</label>
                          <p className="text-gray-900 dark:text-white">
                            {selectedSubmission.commitment?.promise_not_operate_customer_account ? 'Yes' : 'No'}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Promise to Accept Fraud Firing</label>
                          <p className="text-gray-900 dark:text-white">
                            {selectedSubmission.commitment?.promise_accept_fraud_firing ? 'Yes' : 'No'}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Promise Not to Share Company Info</label>
                          <p className="text-gray-900 dark:text-white">
                            {selectedSubmission.commitment?.promise_not_share_company_info ? 'Yes' : 'No'}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Promise to Ensure Loan Recovery</label>
                          <p className="text-gray-900 dark:text-white">
                            {selectedSubmission.commitment?.promise_ensure_loan_recovery ? 'Yes' : 'No'}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Promise to Abide by System</label>
                          <p className="text-gray-900 dark:text-white">
                            {selectedSubmission.commitment?.promise_abide_by_system ? 'Yes' : 'No'}
                          </p>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Direct Sales Rep Name</label>
                        <p className="text-gray-900 dark:text-white">{selectedSubmission.commitment?.direct_sales_rep_name}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Date Signed</label>
                        <p className="text-gray-900 dark:text-white">
                          {selectedSubmission.commitment?.date_signed ? 
                            format(new Date(selectedSubmission.commitment?.date_signed), 'MMM dd, yyyy') : 
                            'N/A'
                          }
                        </p>
                      </div>
                    </div>
                    {selectedSubmission.commitment?.direct_sales_rep_signature_url && (
                      <div className="mt-4">
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Signature</label>
                        <img
                          src={selectedSubmission.commitment?.direct_sales_rep_signature_url}
                          alt="Direct Sales Rep Signature"
                          className="w-full h-48 object-cover rounded-lg mt-2"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Admin Verification Details - Only show for marketer verifications */}
                {selectedSubmission.submission_type === 'marketer_verification' && selectedSubmission.admin_verification && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                      Admin Verification Details
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Admin</label>
                        <p className="text-gray-900 dark:text-white">
                          {selectedSubmission.admin_first_name} {selectedSubmission.admin_last_name}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Marketer Address</label>
                        <p className="text-gray-900 dark:text-white">{selectedSubmission.admin_verification?.marketer_address}</p>
                      </div>
                      {selectedSubmission.admin_verification?.landmark_description && (
                        <div>
                          <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Landmark Description</label>
                          <p className="text-gray-900 dark:text-white">{selectedSubmission.admin_verification?.landmark_description}</p>
                        </div>
                      )}
                      {selectedSubmission.admin_verification?.verification_notes && (
                        <div>
                          <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Admin Notes</label>
                          <p className="text-gray-900 dark:text-white">{selectedSubmission.admin_verification?.verification_notes}</p>
                        </div>
                      )}
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Verification Date</label>
                        <p className="text-gray-900 dark:text-white">
                          {selectedSubmission.admin_verification?.admin_verification_date ? 
                            format(new Date(selectedSubmission.admin_verification?.admin_verification_date), 'MMM dd, yyyy HH:mm') : 
                            'N/A'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* SuperAdmin Validation */}
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    SuperAdmin Validation
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">SuperAdmin</label>
                      <p className="text-gray-900 dark:text-white">
                        {selectedSubmission.superadmin_first_name} {selectedSubmission.superadmin_last_name}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Validation Date</label>
                      <p className="text-gray-900 dark:text-white">
                        {selectedSubmission.superadmin_reviewed_at ? 
                          format(new Date(selectedSubmission.superadmin_reviewed_at), 'MMM dd, yyyy HH:mm') : 
                          'Not yet validated'
                        }
                      </p>
                    </div>
                  </div>
                </div>

                {/* Verification Photos */}
                {(selectedSubmission.admin_verification?.location_photo_url || selectedSubmission.admin_verification?.admin_marketer_photo_url) && (
                  <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                      Verification Photos
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedSubmission.admin_verification?.location_photo_url && (
                        <div>
                          <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Location Photo</label>
                          <img
                            src={selectedSubmission.admin_verification?.location_photo_url}
                            alt="Location Photo"
                            className="w-full h-48 object-cover rounded-lg mt-2"
                          />
                        </div>
                      )}
                      {selectedSubmission.admin_verification?.admin_marketer_photo_url && (
                        <div>
                          <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Admin & Marketer Photo</label>
                          <img
                            src={selectedSubmission.admin_verification?.admin_marketer_photo_url}
                            alt="Admin and Marketer Photo"
                            className="w-full h-48 object-cover rounded-lg mt-2"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Approval/Rejection */}
                {((selectedSubmission.submission_type === 'marketer_verification' && 
                   (selectedSubmission.submission_status === 'superadmin_verified' || selectedSubmission.submission_status === 'pending_masteradmin_approval')) ||
                  (selectedSubmission.submission_type === 'admin_superadmin_approval' && 
                   selectedSubmission.overall_verification_status === 'masteradmin_approval_pending')) && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                      {approvalAction === 'approve' 
                        ? (selectedSubmission.submission_type === 'admin_superadmin_approval' 
                           ? `Approve ${selectedSubmission.role} Account` 
                           : 'Approve Verification')
                        : (selectedSubmission.submission_type === 'admin_superadmin_approval' 
                           ? `Reject ${selectedSubmission.role} Account` 
                           : 'Reject Verification')
                      }
                    </h3>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {approvalAction === 'approve' ? 'Approval Reason' : 'Rejection Reason'}
                        {selectedSubmission.submission_type === 'admin_superadmin_approval' && approvalAction === 'approve' && (
                          <span className="text-gray-500 text-xs ml-2">(Optional for Admin/SuperAdmin)</span>
                        )}
                      </label>
                      <textarea
                        value={approvalReason}
                        onChange={(e) => setApprovalReason(e.target.value)}
                        placeholder={approvalAction === 'approve' ? 
                          (selectedSubmission.submission_type === 'admin_superadmin_approval' 
                           ? "Enter reason for approval (optional)..." 
                           : "Enter reason for approval...") : 
                          "Enter reason for rejection..."
                        }
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        rows={4}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
              <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setIsReviewModalOpen(false)}
                  disabled={processing}
                >
                  Close
                </Button>
                {((selectedSubmission?.submission_type === 'marketer_verification' && 
                   (selectedSubmission?.submission_status === 'superadmin_verified' || selectedSubmission?.submission_status === 'pending_masteradmin_approval')) ||
                  (selectedSubmission?.submission_type === 'admin_superadmin_approval' && 
                   selectedSubmission?.overall_verification_status === 'masteradmin_approval_pending')) && (
                  <Button
                    onClick={handleApproveReject}
                    disabled={processing || (selectedSubmission?.submission_type === 'marketer_verification' && !approvalReason.trim())}
                    className={approvalAction === 'approve' ? 
                      "bg-green-600 hover:bg-green-700" : 
                      "bg-red-600 hover:bg-red-700"
                    }
                  >
                    {processing ? "Processing..." : `${approvalAction === 'approve' ? 'Approve' : 'Reject'} ${selectedSubmission?.submission_type === 'admin_superadmin_approval' ? selectedSubmission.role : 'Verification'}`}
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Custom Alert Dialog */}
      {showAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                alertType === 'success' ? 'bg-green-100' : 'bg-red-100'
              }`}>
                {alertType === 'success' ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600" />
                )}
              </div>
              <h3 className={`text-lg font-semibold ${
                alertType === 'success' ? 'text-green-900' : 'text-red-900'
              }`}>
                {alertType === 'success' ? 'Success' : 'Error'}
              </h3>
            </div>
            <p className={`mb-6 ${
              alertType === 'success' ? 'text-green-700' : 'text-red-700'
            }`}>
              {alertMessage}
            </p>
            <div className="flex justify-end">
              <button
                onClick={() => setShowAlert(false)}
                className={`px-4 py-2 rounded-lg transition-colors duration-200 ${
                  alertType === 'success' 
                    ? 'bg-green-600 text-white hover:bg-green-700' 
                    : 'bg-red-600 text-white hover:bg-red-700'
                }`}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MasterAdminSubmissions;
