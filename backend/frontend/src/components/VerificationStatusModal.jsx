import React, { useState, useEffect } from "react";
import Modal from "./Modal";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { format } from "date-fns";
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  FileText, 
  Camera, 
  Eye,
  Calendar,
  AlertCircle
} from "lucide-react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

const VerificationStatusModal = ({ isOpen, onClose, submissionId }) => {
  const [statusData, setStatusData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && submissionId) {
      fetchVerificationStatus();
    }
  }, [isOpen, submissionId]);

  const fetchVerificationStatus = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${API_URL}/api/verification/status/${submissionId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      setStatusData(response.data.submission);
    } catch (err) {
      console.error("Error fetching verification status:", err);
      setError("Failed to load verification status");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'pending_admin_review': return 'bg-yellow-100 text-yellow-800';
      case 'pending_superadmin_review': return 'bg-blue-100 text-blue-800';
      case 'pending_masteradmin_approval': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved': return <CheckCircle2 className="w-4 h-4" />;
      case 'rejected': return <XCircle2 className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getStepIcon = (completed, isCurrent) => {
    if (completed) {
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    } else if (isCurrent) {
      return <Clock className="w-5 h-5 text-amber-500" />;
    } else {
      return <div className="w-5 h-5 rounded-full border-2 border-gray-300" />;
    }
  };

  if (loading) {
    return (
      <Modal isOpen={isOpen} onClose={onClose}>
        <div className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
            <span className="ml-2">Loading verification status...</span>
          </div>
        </div>
      </Modal>
    );
  }

  if (error) {
    return (
      <Modal isOpen={isOpen} onClose={onClose}>
        <div className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center p-8 text-red-500">
            <AlertCircle className="w-6 h-6 mr-2" />
            <span>{error}</span>
          </div>
        </div>
      </Modal>
    );
  }

  if (!statusData) {
    return null;
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-amber-500 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Verification Status & Progress
          </h2>
          <p className="text-gray-600 mt-2">
            Complete verification workflow status for {statusData.marketer.name}
          </p>
        </div>

        <div className="space-y-6">
          {/* Status Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Current Status</span>
                <Badge className={getStatusColor(statusData.status)}>
                  {getStatusIcon(statusData.status)}
                  <span className="ml-1">{statusData.currentStage}</span>
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Progress</span>
                    <span>{statusData.progressPercentage}%</span>
                  </div>
                  <Progress value={statusData.progressPercentage} className="h-2" />
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Created:</span>
                    <span className="ml-2">
                      {format(new Date(statusData.createdAt), 'MMM dd, yyyy HH:mm')}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Last Updated:</span>
                    <span className="ml-2">
                      {format(new Date(statusData.updatedAt), 'MMM dd, yyyy HH:mm')}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Progress Steps */}
          <Card>
            <CardHeader>
              <CardTitle>Verification Steps</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {statusData.progressSteps.map((step, index) => {
                  const isCurrent = !step.completed && 
                    (index === 0 || statusData.progressSteps[index - 1].completed);
                  
                  return (
                    <div key={index} className="flex items-center space-x-3">
                      {getStepIcon(step.completed, isCurrent)}
                      <span className={`flex-1 ${step.completed ? 'text-green-700' : isCurrent ? 'text-amber-700' : 'text-gray-500'}`}>
                        {step.name}
                      </span>
                      {step.completed && (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Marketer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Marketer Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-500" />
                    <span className="font-medium">{statusData.marketer.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">{statusData.marketer.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">{statusData.marketer.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">{statusData.marketer.location}</span>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="text-sm">
                    <span className="font-medium">Forms Submitted:</span>
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center gap-2">
                        {statusData.marketer.formsSubmitted.biodata ? 
                          <CheckCircle className="w-4 h-4 text-green-500" /> : 
                          <XCircle className="w-4 h-4 text-red-500" />
                        }
                        <span>Biodata Form</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {statusData.marketer.formsSubmitted.guarantor ? 
                          <CheckCircle className="w-4 h-4 text-green-500" /> : 
                          <XCircle className="w-4 h-4 text-red-500" />
                        }
                        <span>Guarantor Form</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {statusData.marketer.formsSubmitted.commitment ? 
                          <CheckCircle className="w-4 h-4 text-green-500" /> : 
                          <XCircle className="w-4 h-4 text-red-500" />
                        }
                        <span>Commitment Form</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Admin Verification Details */}
          {statusData.admin.reviewedAt && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Admin Verification
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm font-medium">Reviewed by:</span>
                      <p className="text-sm text-gray-600">{statusData.admin.name}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium">Reviewed at:</span>
                      <p className="text-sm text-gray-600">
                        {format(new Date(statusData.admin.reviewedAt), 'MMM dd, yyyy HH:mm')}
                      </p>
                    </div>
                  </div>
                  
                  {statusData.admin.verificationNotes && (
                    <div>
                      <span className="text-sm font-medium">Verification Notes:</span>
                      <p className="text-sm text-gray-600 mt-1">{statusData.admin.verificationNotes}</p>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {statusData.admin.locationPhoto && (
                      <div>
                        <span className="text-sm font-medium">Location Photo:</span>
                        <div className="mt-2">
                          <img 
                            src={statusData.admin.locationPhoto} 
                            alt="Location verification" 
                            className="w-full h-32 object-cover rounded border"
                          />
                        </div>
                      </div>
                    )}
                    
                    {statusData.admin.adminMarketerPhoto && (
                      <div>
                        <span className="text-sm font-medium">Admin & Marketer Photo:</span>
                        <div className="mt-2">
                          <img 
                            src={statusData.admin.adminMarketerPhoto} 
                            alt="Admin and marketer verification" 
                            className="w-full h-32 object-cover rounded border"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Workflow Logs */}
          {statusData.workflowLogs && statusData.workflowLogs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Activity Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {statusData.workflowLogs.map((log, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded">
                      <div className="flex-shrink-0">
                        <div className="w-2 h-2 bg-amber-500 rounded-full mt-2"></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{log.action}</span>
                          <span className="text-xs text-gray-500">
                            {format(new Date(log.timestamp), 'MMM dd, HH:mm')}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          by {log.performedBy} ({log.role})
                        </p>
                        {log.details && (
                          <p className="text-xs text-gray-500 mt-1">{log.details}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Rejection Details */}
          {statusData.rejection.reason && (
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <XCircle className="w-5 h-5" />
                  Rejection Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm font-medium">Reason:</span>
                    <p className="text-sm text-gray-600">{statusData.rejection.reason}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium">Rejected by:</span>
                    <p className="text-sm text-gray-600">{statusData.rejection.rejectedBy}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium">Rejected at:</span>
                    <p className="text-sm text-gray-600">
                      {format(new Date(statusData.rejection.rejectedAt), 'MMM dd, yyyy HH:mm')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex justify-end space-x-2 mt-6">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default VerificationStatusModal;
