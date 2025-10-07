import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, FileText, Clock, User, AlertCircle, LogOut } from 'lucide-react';
import io from 'socket.io-client';
import ApplicantBiodataForm from './ApplicantBiodataForm';
import ApplicantGuarantorForm from './ApplicantGuarantorForm';
import ApplicantCommitmentForm from './ApplicantCommitmentForm';
import VerificationNotifications from './VerificationNotifications';
import FormStepper from './FormStepper';
import ErrorBoundary from './ErrorBoundary';
import api from '../api/';

const MarketerVerificationDashboard = ({ user: initialUser }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(initialUser);
  const [currentForm, setCurrentForm] = useState(1);
  const [completedForms, setCompletedForms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showProgressAlert, setShowProgressAlert] = useState(false);
  const [progressMessage, setProgressMessage] = useState('');
  const [adminAssignment, setAdminAssignment] = useState(null);
  const [loadingAssignment, setLoadingAssignment] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);

  const forms = [
    { key: 'biodata', label: 'Biodata Form', component: ApplicantBiodataForm },
    { key: 'guarantor', label: 'Guarantor Form', component: ApplicantGuarantorForm },
    { key: 'commitment', label: 'Commitment Form', component: ApplicantCommitmentForm }
  ];

  // Update user state when prop changes
  useEffect(() => {
    if (initialUser) {
      setUser(initialUser);
    } else {
      // If no user data, redirect to login
      localStorage.removeItem('user');
      navigate('/');
    }
  }, [initialUser, navigate]);

  // Logout function
  const handleLogout = async () => {
    try {
      // Call logout API
      await api.post('/auth/logout');
      
      // Clear local storage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Redirect to landing page (which shows login form)
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
      // Even if API call fails, clear local storage and redirect
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/');
    }
  };

  // Show progress notification on page load
  const showProgressNotification = () => {
    if (!user) return;
    
    const status = user.overall_verification_status;
    let message = '';
    
    switch (status) {
      case 'awaiting_admin_review':
        message = 'Welcome back! Your verification is currently under Admin review. Your assigned Admin will review your submitted forms.';
        break;
      case 'awaiting_superadmin_validation':
        message = 'Great news! Your Admin has completed their review. Your verification is now under SuperAdmin validation.';
        break;
      case 'awaiting_masteradmin_approval':
        message = 'Excellent progress! Your verification has passed SuperAdmin validation and is now awaiting final MasterAdmin approval.';
        break;
      case 'approved':
        message = 'Congratulations! Your verification has been approved. You now have full access to your dashboard.';
        break;
      default:
        message = 'Welcome back! Please complete your verification forms to proceed.';
    }
    
    setProgressMessage(message);
    setShowProgressAlert(true);
  };

  // Helper function to determine starting form based on completion status
  const determineStartingForm = (formStatus) => {
    const { biodata, guarantor, commitment } = formStatus.forms;
    
    // Allow any form to be filled independently - no strict order required
    const completed = [];
    if (biodata) completed.push('biodata');
    if (guarantor) completed.push('guarantor');
    if (commitment) completed.push('commitment');
    
    // Start with the first incomplete form, or form 1 if all are complete
    if (!biodata) {
      return { form: 1, completed };
    } else if (!guarantor) {
      return { form: 2, completed };
    } else if (!commitment) {
      return { form: 3, completed };
    } else {
      return { form: 1, completed };
    }
  };

  // Show progress notification on component mount
  useEffect(() => {
    // Show progress notification after a short delay to ensure page is loaded
    const timer = setTimeout(() => {
      showProgressNotification();
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [user?.overall_verification_status]);

  // Check form status on component mount
  useEffect(() => {
    const checkFormStatus = async () => {
      try {
        setIsLoading(true);
        const response = await api.get('/verification/form-status');
        const formStatus = response.data;
        
        console.log('📋 Form status from API:', formStatus);
        
        // Determine starting form and completed forms
        const { form, completed } = determineStartingForm(formStatus);
        
        console.log(`🎯 Starting form: ${form}, Completed: [${completed.join(', ')}]`);
        
        setCurrentForm(form);
        setCompletedForms(completed);
        
      } catch (error) {
        console.error('❌ Error fetching form status:', error);
        // Fallback to starting from form 1 if API fails
        setCurrentForm(1);
        setCompletedForms([]);
      } finally {
        setIsLoading(false);
      }
    };

    checkFormStatus();
  }, []);

  // Fetch admin assignment information
  useEffect(() => {
    const fetchAdminAssignment = async () => {
      if (!user) return;
      
      try {
        setLoadingAssignment(true);
        const response = await api.get('/verification/admin-assignment');
        
        if (response.data.success) {
          setAdminAssignment(response.data);
          console.log('✅ Admin assignment loaded:', response.data);
        }
      } catch (error) {
        console.error('Error fetching admin assignment:', error);
      } finally {
        setLoadingAssignment(false);
      }
    };
    
    fetchAdminAssignment();
  }, [user]);

  // Periodic status check to ensure UI stays in sync
  useEffect(() => {
    if (!user) return;
    
    const checkStatus = async () => {
      try {
        const response = await api.get('/verification/form-status');
        if (response.data.success) {
          const currentStatus = response.data.overall_verification_status;
          if (currentStatus && currentStatus !== user.overall_verification_status) {
            console.log(`🔄 Status mismatch detected: UI=${user.overall_verification_status}, Server=${currentStatus}`);
            const updated = {
              ...user,
              overall_verification_status: currentStatus,
            };
            setUser(updated);
            localStorage.setItem("user", JSON.stringify(updated));
          }
        }
      } catch (error) {
        console.error('Error checking status:', error);
      }
    };
    
    // Check status every 30 seconds
    const interval = setInterval(checkStatus, 30000);
    
    return () => clearInterval(interval);
  }, [user]);

  // Redirect if user is not a marketer or not assigned
  useEffect(() => {
    if (!user || user.role !== 'Marketer' || !user.admin_id) {
      navigate('/');
      return;
    }

    // If user is verified, redirect to full dashboard
    if (user.overall_verification_status === 'approved') {
      navigate('/dashboard/marketer');
      return;
    }

    // Scroll to top when component loads
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [user, navigate]);

  // WebSocket listeners for real-time status updates
  useEffect(() => {
    if (!user?.unique_id) return;

    const socket = io(import.meta.env.VITE_API_URL, { transports: ["websocket"] });
    
    // Register with socket
    socket.emit("register", user.unique_id);
    
    // Connection status handlers
    socket.on("connect", () => {
      console.log('🔗 WebSocket connected');
      setSocketConnected(true);
    });
    
    socket.on("disconnect", () => {
      console.log('🔌 WebSocket disconnected');
      setSocketConnected(false);
    });

    // Listen for verification status changes
    socket.on("verificationStatusChanged", (data) => {
      console.log('🔔 Received verification status change:', data);
      if (data.marketerUniqueId === user.unique_id) {
        setIsUpdating(true);
        
        const updated = {
          ...user,
          overall_verification_status: data.newStatus,
        };
        setUser(updated);
        localStorage.setItem("user", JSON.stringify(updated));
        console.log(`🔄 Verification status updated to: ${data.newStatus}`);
        
        // Show notification to user
        setProgressMessage(data.message);
        setShowProgressAlert(true);
        
        // Clear updating state after a short delay
        setTimeout(() => setIsUpdating(false), 2000);
      }
    });

    // Listen for verification approval
    socket.on("verificationApproved", (data) => {
      console.log('🎉 Received verification approval:', data);
      if (data.marketerUniqueId === user.unique_id) {
        const updated = {
          ...user,
          overall_verification_status: "approved",
        };
        setUser(updated);
        localStorage.setItem("user", JSON.stringify(updated));
        console.log(`✅ Verification approved!`);
        
        // Show success notification
        setSuccessMessage(data.message || 'Your verification has been approved!');
        setShowSuccessNotification(true);
      }
    });

    return () => {
      socket.off("verificationStatusChanged");
      socket.off("verificationApproved");
      socket.disconnect();
    };
  }, [user?.unique_id]);

  const handleFormComplete = async (formKey) => {
    setCompletedForms(prev => [...prev, formKey]);
    
    // Show success notification
    const formName = forms.find(f => f.key === formKey)?.label || 'Form';
    setSuccessMessage(`${formName} submitted successfully!`);
    setShowSuccessNotification(true);
    
    // Hide success notification after 3 seconds
    setTimeout(() => {
      setShowSuccessNotification(false);
    }, 3000);
    
    // Show success feedback before progression
    setTimeout(async () => {
      // Scroll to top of page
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      // Refresh form status to get latest data
      try {
        const response = await api.get('/verification/form-status');
        const formStatus = response.data;
        const { form, completed } = determineStartingForm(formStatus);
        
        console.log('🔄 Form completed, refreshing status:', { form, completed });
        
        setCurrentForm(form);
        setCompletedForms(completed);
        
        // If all forms are completed, reload the page to show completion status
        if (completed.length === forms.length) {
          setTimeout(() => {
            window.location.reload();
          }, 2000); // Give user time to see completion
        }
      } catch (error) {
        console.error('❌ Error refreshing form status:', error);
        // Fallback to manual progression
        if (currentForm < forms.length) {
          setCurrentForm(currentForm + 1);
        } else {
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        }
      }
    }, 1500); // 1.5 second delay for success feedback
  };

  const handleStepClick = (stepIndex, stepKey) => {
    // Allow navigation to any form - no restrictions
    // Scroll to top when navigating between forms
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setCurrentForm(stepIndex + 1);
  };

  if (!user) {
    console.log('🔍 MarketerVerificationDashboard: No user data');
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading verification dashboard...</p>
        </div>
      </div>
    );
  }

  console.log('🔍 MarketerVerificationDashboard: User data:', {
    role: user.role,
    admin_id: user.admin_id,
    verificationStatus: user.overall_verification_status
  });

  if (user.role !== 'Marketer' || !user.admin_id) {
    console.log('❌ MarketerVerificationDashboard: User not eligible - role:', user.role, 'admin_id:', user.admin_id);
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Account Not Ready</h2>
          <p className="text-gray-600 mb-4">
            {user.role !== 'Marketer' ? 'Your account role is not set as Marketer.' : 'Your account is not assigned to an Admin yet.'}
          </p>
          <p className="text-sm text-gray-500">
            Please contact your administrator for assistance.
          </p>
        </div>
      </div>
    );
  }

  // Show loading state while checking form status
  if (isLoading) {
    console.log('🔍 MarketerVerificationDashboard: Loading form status...');
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your verification progress...</p>
        </div>
      </div>
    );
  }

  console.log('✅ MarketerVerificationDashboard: Rendering verification dashboard');

  const getVerificationStatus = () => {
    if (!user) {
      return { status: 'pending', message: 'Loading...', color: 'yellow' };
    }
    
    if (user.overall_verification_status === 'approved') {
      return { status: 'approved', message: 'Verification Complete', color: 'green' };
    } else if (user.overall_verification_status === 'awaiting_masteradmin_approval') {
      return { status: 'pending', message: 'Awaiting Final Approval', color: 'yellow' };
    } else if (user.overall_verification_status === 'awaiting_superadmin_validation') {
      return { status: 'pending', message: 'Under Review', color: 'yellow' };
    } else if (user.overall_verification_status === 'awaiting_admin_review') {
      return { status: 'pending', message: 'Awaiting Admin Review', color: 'yellow' };
    } else {
      return { status: 'pending', message: 'Verification Required', color: 'yellow' };
    }
  };

  // Get current verification stage for progress tracker
  const getCurrentStage = () => {
    if (!user) return 1;
    
    console.log('🔍 getCurrentStage debug:', {
      overall_verification_status: user.overall_verification_status,
      user: user
    });
    
    switch (user.overall_verification_status) {
      case 'awaiting_admin_review':
        console.log('✅ Status is awaiting_admin_review, returning stage 2');
        return 2; // Admin Review
      case 'awaiting_superadmin_validation':
        console.log('✅ Status is awaiting_superadmin_validation, returning stage 3');
        return 3; // SuperAdmin Validation
      case 'awaiting_masteradmin_approval':
        console.log('✅ Status is awaiting_masteradmin_approval, returning stage 4');
        return 4; // MasterAdmin Approval
      case 'approved':
        console.log('✅ Status is approved, returning stage 5');
        return 5; // All completed
      default:
        console.log('⚠️ Status is default case:', user.overall_verification_status, 'returning stage 1');
        return 1; // Forms Submitted
    }
  };

  // Get status display information
  const getStatusDisplay = () => {
    if (!user) return { title: 'Loading...', description: 'Please wait...' };
    
    switch (user.overall_verification_status) {
      case 'awaiting_admin_review':
        return {
          title: 'Under Admin Review',
          description: 'Your assigned Admin will review your forms and upload verification details. You will be notified when your verification progresses to the next stage.'
        };
      case 'awaiting_superadmin_validation':
        return {
          title: 'Under SuperAdmin Review',
          description: 'Your Admin has reviewed your forms and sent them to SuperAdmin for validation. You will be notified when your verification progresses to the next stage.'
        };
      case 'awaiting_masteradmin_approval':
        return {
          title: 'Under MasterAdmin Review',
          description: 'Your verification has been validated by SuperAdmin and is now under MasterAdmin review for final approval.'
        };
      case 'approved':
        return {
          title: 'Verification Complete',
          description: 'Congratulations! Your verification has been approved and your dashboard is now unlocked.'
        };
      default:
        return {
          title: 'Under Admin Review',
          description: 'Your assigned Admin will review your forms and upload verification details. You will be notified when your verification progresses to the next stage.'
        };
    }
  };

  const verificationStatus = getVerificationStatus();

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        <style jsx>{`
          @keyframes slide-in {
            from {
              transform: translateX(100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
          .animate-slide-in {
            animation: slide-in 0.3s ease-out;
          }
        `}</style>
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-orange-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">V</span>
                </div>
              </div>
              <div className="ml-3">
                <h1 className="text-xl font-semibold text-gray-900">Vistapro</h1>
                <p className="text-sm text-gray-500">Marketer Verification</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Verification Notifications */}
              <VerificationNotifications 
                userRole="marketer"
                userId={user?.id}
                onNotificationClick={(notification) => {
                  console.log('Verification notification clicked:', notification);
                  // Handle notification click if needed
                }}
              />
              
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {user.first_name} {user.last_name}
                </p>
                <p className="text-xs text-gray-500">ID: {user.unique_id}</p>
              </div>
              <div className="h-8 w-8 bg-gray-300 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-gray-600" />
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Success Notification */}
      {showSuccessNotification && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-3 animate-slide-in">
          <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <span className="font-medium">{successMessage}</span>
        </div>
      )}

      {/* Progress Alert Dialog */}
      {showProgressAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/30">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Verification Progress</h3>
            </div>
            <p className="text-gray-600 mb-6">{progressMessage}</p>
            <div className="flex justify-end">
              <button
                onClick={() => setShowProgressAlert(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
                verificationStatus.color === 'green' ? 'bg-green-100' : 'bg-yellow-100'
              }`}>
                {verificationStatus.color === 'green' ? (
                  <CheckCircle className="h-6 w-6 text-green-600" />
                ) : (
                  <Clock className="h-6 w-6 text-yellow-600" />
                )}
              </div>
              <div className="ml-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  {verificationStatus.message}
                </h2>
                <p className="text-sm text-gray-500">
                  Complete the verification process to access your full dashboard
                </p>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-sm text-gray-500">Assigned to Admin</div>
              <div className="text-sm font-medium text-gray-900">
                {user.admin_name || (user.admin_id ? `Admin #${user.admin_id}` : 'Not Assigned')}
              </div>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Verification Progress</h3>
          
          <div className="space-y-4">
            {/* Step 1: Forms */}
            <div className="flex items-center">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                completedForms.length === forms.length 
                  ? 'bg-green-100' : 'bg-gray-100'
              }`}>
                <FileText className={`h-4 w-4 ${
                  completedForms.length === forms.length 
                    ? 'text-green-600' : 'text-gray-400'
                }`} />
              </div>
              <div className="ml-4">
                <p className={`text-sm font-medium ${
                  completedForms.length === forms.length 
                    ? 'text-green-900' : 'text-gray-700'
                }`}>
                  Complete KYC Forms ({completedForms.length}/{forms.length})
                </p>
                <p className="text-xs text-gray-500">
                  Biodata, Guarantor, and Commitment forms
                </p>
              </div>
            </div>

            {/* Step 2: Admin Review */}
            <div className="flex items-center">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                user.overall_verification_status === 'awaiting_admin_review'
                  ? 'bg-blue-100' 
                  : user.overall_verification_status === 'awaiting_superadmin_validation' || 
                    user.overall_verification_status === 'awaiting_masteradmin_approval' ||
                    user.overall_verification_status === 'approved'
                  ? 'bg-green-100' 
                  : 'bg-gray-100'
              }`}>
                <User className={`h-4 w-4 ${
                  user.overall_verification_status === 'awaiting_admin_review'
                    ? 'text-blue-600'
                    : user.overall_verification_status === 'awaiting_superadmin_validation' || 
                      user.overall_verification_status === 'awaiting_masteradmin_approval' ||
                      user.overall_verification_status === 'approved'
                    ? 'text-green-600' 
                    : 'text-gray-400'
                }`} />
              </div>
              <div className="ml-4">
                <p className={`text-sm font-medium ${
                  user.overall_verification_status === 'awaiting_admin_review'
                    ? 'text-blue-900'
                    : user.overall_verification_status === 'awaiting_superadmin_validation' || 
                      user.overall_verification_status === 'awaiting_masteradmin_approval' ||
                      user.overall_verification_status === 'approved'
                    ? 'text-green-900' 
                    : 'text-gray-700'
                }`}>
                  Admin Review
                </p>
                <p className="text-xs text-gray-500">
                  Your assigned Admin will review your forms
                </p>
              </div>
            </div>

            {/* Step 3: SuperAdmin Validation */}
            <div className="flex items-center">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                user.overall_verification_status === 'awaiting_superadmin_validation' || 
                user.overall_verification_status === 'awaiting_masteradmin_approval' ||
                user.overall_verification_status === 'approved'
                  ? user.overall_verification_status === 'awaiting_superadmin_validation'
                    ? 'bg-blue-100' : 'bg-green-100'
                  : 'bg-gray-100'
              }`}>
                <User className={`h-4 w-4 ${
                  user.overall_verification_status === 'awaiting_superadmin_validation' || 
                  user.overall_verification_status === 'awaiting_masteradmin_approval' ||
                  user.overall_verification_status === 'approved'
                    ? user.overall_verification_status === 'awaiting_superadmin_validation'
                      ? 'text-blue-600' : 'text-green-600'
                    : 'text-gray-400'
                }`} />
              </div>
              <div className="ml-4">
                <p className={`text-sm font-medium ${
                  user.overall_verification_status === 'awaiting_superadmin_validation' || 
                  user.overall_verification_status === 'awaiting_masteradmin_approval' ||
                  user.overall_verification_status === 'approved'
                    ? user.overall_verification_status === 'awaiting_superadmin_validation'
                      ? 'text-blue-900' : 'text-green-900'
                    : 'text-gray-700'
                }`}>
                  SuperAdmin Validation
                </p>
                <p className="text-xs text-gray-500">
                  SuperAdmin will validate your verification
                </p>
              </div>
            </div>

            {/* Step 4: MasterAdmin Approval */}
            <div className="flex items-center">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                user.overall_verification_status === 'awaiting_masteradmin_approval' ||
                user.overall_verification_status === 'approved'
                  ? user.overall_verification_status === 'awaiting_masteradmin_approval'
                    ? 'bg-blue-100' : 'bg-green-100'
                  : 'bg-gray-100'
              }`}>
                <CheckCircle className={`h-4 w-4 ${
                  user.overall_verification_status === 'awaiting_masteradmin_approval' ||
                  user.overall_verification_status === 'approved'
                    ? user.overall_verification_status === 'awaiting_masteradmin_approval'
                      ? 'text-blue-600' : 'text-green-600'
                    : 'text-gray-400'
                }`} />
              </div>
              <div className="ml-4">
                <p className={`text-sm font-medium ${
                  user.overall_verification_status === 'awaiting_masteradmin_approval' ||
                  user.overall_verification_status === 'approved'
                    ? user.overall_verification_status === 'awaiting_masteradmin_approval'
                      ? 'text-blue-900' : 'text-green-900'
                    : 'text-gray-700'
                }`}>
                  MasterAdmin Approval
                </p>
                <p className="text-xs text-gray-500">
                  MasterAdmin final approval
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* All Forms Completed - Show Completion Screen */}
        {completedForms.length === forms.length && verificationStatus.status === 'pending' && (
          <div className="bg-white rounded-lg shadow-md p-8 mb-8">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                All Forms Submitted Successfully!
              </h3>
              
              <p className="text-lg text-gray-600 mb-6">
                Your verification forms have been submitted and are now under review.
              </p>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                <div className="flex items-center justify-center mb-4">
                  <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <h4 className="text-lg font-semibold text-blue-900 mb-2">
                  Status: {getStatusDisplay().title}
                </h4>
                <p className="text-blue-700 text-sm">
                  {getStatusDisplay().description}
                </p>
              </div>
              
              <div className="space-y-4 relative">
                {/* Real-time update indicator */}
                {isUpdating && (
                  <div className="absolute -top-2 -right-2 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full flex items-center space-x-1 z-10">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    <span>Updating...</span>
                  </div>
                )}
                
                {/* Connection status indicator */}
                <div className="absolute -top-2 -left-2 flex items-center space-x-1">
                  <div className={`w-2 h-2 rounded-full ${socketConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className="text-xs text-gray-500">
                    {socketConnected ? 'Live' : 'Offline'}
                  </span>
                </div>
                
                <div className="flex items-center justify-center space-x-8 text-sm text-gray-600">
                  
                  {/* Step 1: Forms Submitted - Always completed if user is in verification dashboard */}
                  <div className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs mr-2 ${
                      getCurrentStage() >= 1 ? 'bg-green-500' : 'bg-gray-300'
                    }`}>
                      1
                    </div>
                    <span>Forms Submitted</span>
                  </div>
                  
                  {/* Step 2: Admin Review */}
                  <div className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs mr-2 ${
                      getCurrentStage() === 2 ? 'bg-blue-500' : 
                      getCurrentStage() > 2 ? 'bg-green-500' : 'bg-gray-300'
                    }`}>
                      2
                    </div>
                    <span>Admin Review</span>
                    {/* Debug info */}
                    <span className="text-xs text-gray-400 ml-2">
                      (stage: {getCurrentStage()}, status: {user?.overall_verification_status})
                    </span>
                  </div>
                  
                  {/* Step 3: SuperAdmin Validation */}
                  <div className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs mr-2 ${
                      getCurrentStage() === 3 ? 'bg-blue-500' : 
                      getCurrentStage() > 3 ? 'bg-green-500' : 'bg-gray-300'
                    }`}>
                      3
                    </div>
                    <span>SuperAdmin Validation</span>
                  </div>
                  
                  {/* Step 4: MasterAdmin Approval */}
                  <div className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs mr-2 ${
                      getCurrentStage() === 4 ? 'bg-blue-500' : 
                      getCurrentStage() > 4 ? 'bg-green-500' : 'bg-gray-300'
                    }`}>
                      4
                    </div>
                    <span>MasterAdmin Approval</span>
                  </div>
                </div>
              </div>
              
              {/* Admin Assignment Information */}
              {adminAssignment && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h5 className="text-sm font-semibold text-gray-700 mb-3">Verification Team</h5>
                  <div className="space-y-3">
                    {/* Admin Information */}
                    {adminAssignment.admin ? (
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            Admin: {adminAssignment.admin.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {adminAssignment.admin.email} • {adminAssignment.admin.location}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-gray-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">
                            Admin: Not assigned
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {/* SuperAdmin Information */}
                    {adminAssignment.superadmin ? (
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            SuperAdmin: {adminAssignment.superadmin.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {adminAssignment.superadmin.email} • {adminAssignment.superadmin.location}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-gray-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">
                            SuperAdmin: Not assigned
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Form Stepper - Only show if not all forms completed */}
        {completedForms.length < forms.length && verificationStatus.status === 'pending' && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Complete Verification Forms</h3>
            
            {/* Form Stepper */}
            <FormStepper
              steps={forms}
              activeIndex={currentForm - 1}
              completed={forms.map(form => completedForms.includes(form.key))}
              onStepClick={handleStepClick}
            />
            
            {/* Progress Summary */}
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Current Progress:</span>
                <span className="font-medium text-gray-900">
                  {completedForms.length} of {forms.length} forms completed
                </span>
              </div>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-orange-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(completedForms.length / forms.length) * 100}%` }}
                ></div>
              </div>
            </div>
            
            {/* Current Form */}
            <div className="mt-8">
              {forms.map((form, index) => {
                const FormComponent = form.component;
                return (
                  <div key={form.key} className={index + 1 === currentForm ? 'block' : 'hidden'}>
                    <div className="mb-4">
                      <h4 className="text-md font-medium text-gray-900">{form.label}</h4>
                      <p className="text-sm text-gray-500">
                        Step {index + 1} of {forms.length} - Complete this form to proceed
                      </p>
                    </div>
                    <FormComponent onSuccess={() => handleFormComplete(form.key)} />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Success Message */}
        {verificationStatus.status === 'approved' && (
          <div className="bg-green-50 shadow-md rounded-lg p-6">
            <div className="flex items-center">
              <CheckCircle className="h-6 w-6 text-green-600 mr-3" />
              <div>
                <h3 className="text-lg font-semibold text-green-900">
                  Verification Complete!
                </h3>
                <p className="text-sm text-green-700 mt-1">
                  Your account has been verified. You now have access to your full dashboard.
                </p>
                <button
                  onClick={() => navigate('/dashboard/marketer')}
                  className="mt-3 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors text-sm font-medium"
                >
                  Go to Dashboard
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
    </ErrorBoundary>
  );
};

export default MarketerVerificationDashboard;
