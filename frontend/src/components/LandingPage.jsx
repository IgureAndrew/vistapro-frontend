import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { updateUserWithAvatar } from "../utils/avatarUtils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import AlertDialog from "@/components/ui/alert-dialog";
import { Eye, EyeOff, Mail, Lock, Shield, AlertTriangle } from "lucide-react";
import OTPInputModal from "./OTPInputModal";
import GracePeriodAlert from "./GracePeriodAlert";
import GracePeriodBanner from "./GracePeriodBanner";
import OTPTransitionBanner from "./OTPTransitionBanner";
import otpApiService from "../api/otpApi";

// Define our colors
const goldColor = "#C6A768";
const blackColor = "#000";

// Utility function to check if a password meets the criteria:
// - At least 12 characters
// - Contains at least one letter and one digit
function isPasswordValid(password) {
  if (password.length < 12) return false;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  return hasLetter && hasDigit;
}

  // Check email verification status
  const checkEmailVerificationStatus = async (email) => {
    if (!email || !email.includes('@')) return;
    
    setCheckingEmailStatus(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://vistapro-backend.onrender.com'}/api/auth/check-email-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setEmailVerificationStatus(data);
      } else {
        setEmailVerificationStatus({ email_verified: false });
      }
    } catch (error) {
      console.error('Error checking email status:', error);
      setEmailVerificationStatus({ email_verified: false });
    } finally {
      setCheckingEmailStatus(false);
    }
  };

function LandingPage() {
  // Define which form to show: "login", "register", or "forgot"
  const [view, setView] = useState("login");
  const navigate = useNavigate();

  // Form state for each view.
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [registerData, setRegisterData] = useState({
    secretKey: "",
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    gender: "",
  });
  const [forgotData, setForgotData] = useState({ email: "" });

  // For toggling password visibility in the register and login forms.
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  
  // For OTP-only mode
  const [emailVerificationStatus, setEmailVerificationStatus] = useState(null);
  const [checkingEmailStatus, setCheckingEmailStatus] = useState(false);
  const [otpSuccess, setOtpSuccess] = useState(false);

  // Alert dialog state
  const [alertDialog, setAlertDialog] = useState({
    open: false,
    type: "info",
    title: "",
    message: "",
    confirmText: "OK",
    onConfirm: null
  });

  // OTP and Grace Period state
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [showGracePeriodAlert, setShowGracePeriodAlert] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState(null);
  const [gracePeriodData, setGracePeriodData] = useState(null);
  const [loginMethod, setLoginMethod] = useState("password"); // "password" or "otp"
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [transitionBannerDismissed, setTransitionBannerDismissed] = useState(false);
  const [loading, setLoading] = useState(false);

  // Use the API base URL from environment variables.
  const API_BASE_URL = import.meta.env.VITE_API_URL;

  // Helper function to show alert dialog
  const showAlert = (type, title, message, confirmText = "OK", onConfirm = null) => {
    setAlertDialog({
      open: true,
      type,
      title,
      message,
      confirmText,
      onConfirm: onConfirm || (() => setAlertDialog(prev => ({ ...prev, open: false })))
    });
  };

  // Check grace period status on component mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
      setIsLoggedIn(true);
      checkGracePeriodStatus();
    } else {
      setIsLoggedIn(false);
    }
  }, []);

  // Check grace period status
  const checkGracePeriodStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('No token found, skipping grace period check');
        return;
      }
      
      const response = await otpApiService.getGracePeriodStatus(token);
      if (response.data.success) {
        setGracePeriodData(response.data.data);
        if (response.data.data.isInGracePeriod && response.data.data.emailUpdateRequired) {
          setShowGracePeriodAlert(true);
        }
        
        // If grace period has ended, force OTP login
        if (!response.data.data.isInGracePeriod) {
          setLoginMethod("otp");
        }
      }
    } catch (error) {
      console.error('Error checking grace period status:', error);
    }
  };

  // Handle OTP login
  const handleOTPLogin = async () => {
    // Prevent multiple clicks
    if (otpLoading) {
      console.log('🚫 OTP request already in progress, ignoring click');
      return;
    }

    if (!loginData.email) {
      showAlert("error", "Email Required", "Please enter your email address to receive the OTP code.");
      return;
    }

    console.log('📧 Sending OTP request...', { email: loginData.email });
    setOtpLoading(true);
    setOtpError(null);

    try {
      await otpApiService.sendOTP(loginData.email);
      console.log('✅ OTP sent successfully, showing modal');
      setOtpSuccess(true);
      setOtpError(null);
      setShowOTPModal(true);
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setOtpSuccess(false);
      }, 5000);
    } catch (error) {
      console.error('❌ Failed to send OTP:', error);
      setOtpError(error.response?.data?.message || "Failed to send OTP. Please try again.");
      setOtpSuccess(false);
    } finally {
      setOtpLoading(false);
    }
  };

  // Verify OTP
  const handleVerifyOTP = async (otpCode) => {
    console.log('🔍 LandingPage: Starting OTP verification...', { email: loginData.email, otpCode });
    setOtpLoading(true);
    setOtpError(null);

    try {
      const response = await otpApiService.verifyOTP(loginData.email, otpCode);
      console.log('🔍 LandingPage: OTP verification response received:', response);
      console.log('🔍 LandingPage: Response type:', typeof response);
      console.log('🔍 LandingPage: Response keys:', Object.keys(response || {}));
      
      if (response && response.success === true) {
        console.log('✅ LandingPage: OTP verification successful!');
        localStorage.setItem("token", response.token);
        const updatedUserData = updateUserWithAvatar(response.user);
        localStorage.setItem("user", JSON.stringify(updatedUserData));
        
        console.log('✅ LandingPage: User data stored, closing modal and redirecting...');
        
        // Close OTP modal
        setShowOTPModal(false);
        
        // Redirect based on role
        redirectToDashboard(response.user.role);
      } else {
        console.log('❌ LandingPage: OTP verification failed - response.success is not true');
        console.log('❌ LandingPage: response.success value:', response?.success);
        setOtpError(response?.message || "Invalid OTP code. Please try again.");
      }
    } catch (error) {
      console.error('❌ LandingPage: OTP verification error caught:', error);
      console.error('❌ LandingPage: Error message:', error.message);
      console.error('❌ LandingPage: Error response:', error.response);
      setOtpError(error.message || "Invalid OTP code. Please try again.");
    } finally {
      setOtpLoading(false);
    }
  };

  // Resend OTP
  const handleResendOTP = async () => {
    setOtpLoading(true);
    setOtpError(null);

    try {
      await otpApiService.sendOTP(loginData.email);
      setOtpError(null);
    } catch (error) {
      setOtpError(error.response?.data?.message || "Failed to resend OTP. Please try again.");
    } finally {
      setOtpLoading(false);
    }
  };

  // Update email address
  const handleUpdateEmail = async (newEmail) => {
    setOtpLoading(true);

    try {
      await otpApiService.updateEmail(newEmail);
      setGracePeriodData(prev => ({
        ...prev,
        emailUpdateRequired: false
      }));
      setShowGracePeriodAlert(false);
      showAlert("success", "Email Updated", "Your email address has been updated successfully.");
    } catch (error) {
      throw error; // Let the GracePeriodAlert handle the error display
    } finally {
      setOtpLoading(false);
    }
  };

  // Handle banner dismiss
  const handleBannerDismiss = () => {
    setBannerDismissed(true);
  };

  // Handle transition banner dismiss
  const handleTransitionBannerDismiss = () => {
    setTransitionBannerDismissed(true);
  };

  // Redirect to dashboard based on role
  const redirectToDashboard = (role) => {
    switch (role) {
          case "SuperAdmin":
            navigate("/dashboard/superadmin");
            break;
          case "MasterAdmin":
            navigate("/dashboard/masteradmin");
            break;
          case "Admin":
            navigate("/dashboard/admin");
            break;
          case "Dealer":
            navigate("/dashboard/dealer");
            break;
          case "Marketer":
            navigate("/dashboard/marketer");
            break;
          default:
        navigate("/dashboard");
    }
  };

  // Handler for login submission.
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginData),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("token", data.token);
        // Update user data with avatar URL if profile_image exists
        const updatedUserData = updateUserWithAvatar(data.user);
        localStorage.setItem("user", JSON.stringify(updatedUserData));
        
        // Check grace period status after successful login
        await checkGracePeriodStatus();
        
        // Redirect based on the user's role.
        redirectToDashboard(data.user.role);
      } else {
        if (data.requiresOTP) {
          showAlert("warning", "Password Login Disabled", "Password login has been disabled. Please use OTP login with your verified email address.");
          setLoginMethod("otp");
        } else if (data.requiresAssignment) {
          showAlert("warning", "Account Pending Assignment", "Your account is pending Admin assignment. Please wait for assignment.");
        } else if (data.accountLocked) {
          showAlert("error", "Account Locked", "Your account is locked. Please contact your assigned Admin.");
        } else {
          showAlert("error", "Login Failed", data.message || "Login failed");
        }
      }
    } catch (error) {
      console.error("Error logging in:", error);
      showAlert("error", "Error", "Error logging in");
    } finally {
      setLoading(false);
    }
  };

  // Handler for registration submission.
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!isPasswordValid(registerData.password)) {
      showAlert("error", "Invalid Password", "Password must be at least 12 alphanumeric characters.");
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/api/master-admin/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registerData),
      });
      const data = await res.json();
      if (res.ok) {
        if (data.requiresAssignment) {
          showAlert("success", "Registration Successful", "Your account is pending Admin assignment. You will be notified when assigned.");
        } else {
          showAlert("success", "Registration Successful", "Please check your email to verify your account.");
        }
        setView("login");
        setRegisterData({
          secretKey: "",
          first_name: "",
          last_name: "",
          email: "",
          password: "",
          gender: "",
        });
      } else {
        showAlert("error", "Registration Failed", data.message || "Registration failed");
      }
    } catch (error) {
      console.error("Error registering:", error);
      showAlert("error", "Error", "Error registering");
    }
  };

  // Handler for forgot password submission.
  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(forgotData),
      });
      const data = await res.json();
      if (res.ok) {
        showAlert("success", "Reset Instructions Sent", "Password reset instructions sent to your email!");
        setView("login");
        setForgotData({ email: "" });
      } else {
        showAlert("error", "Failed to Send", data.message || "Failed to send reset instructions");
      }
    } catch (error) {
      console.error("Error sending reset instructions:", error);
      showAlert("error", "Error", "Error sending reset instructions");
    }
  };

  // Render the appropriate form based on the current view.
  const renderForm = () => {
    if (view === "login") {
      return (
        <form className="space-y-4" onSubmit={handleLoginSubmit}>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-foreground">
              Email
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                className="pl-10 border-border focus:ring-ring"
                value={loginData.email}
                onChange={(e) => {
                  setLoginData({ ...loginData, email: e.target.value });
                  // Check email verification status when email changes
                  const email = e.target.value;
                  if (email && email.includes('@')) {
                    checkEmailVerificationStatus(email);
                  } else {
                    setEmailVerificationStatus(null);
                  }
                }}
                required
              />
            </div>
          </div>
          
          {/* Login Method Toggle - Hide for verified users */}
          {!emailVerificationStatus?.email_verified && (
            <div className="flex space-x-2 mb-4">
              <Button
                type="button"
                variant={loginMethod === "password" ? "default" : "outline"}
                size="sm"
                className="flex-1"
                onClick={() => setLoginMethod("password")}
                disabled={gracePeriodData && !gracePeriodData.isInGracePeriod}
              >
                <Lock className="h-4 w-4 mr-2" />
                Password
                {gracePeriodData && !gracePeriodData.isInGracePeriod && (
                  <span className="ml-1 text-xs">(Disabled)</span>
                )}
              </Button>
              <Button
                type="button"
                variant={loginMethod === "otp" ? "default" : "outline"}
                size="sm"
                className="flex-1"
                onClick={() => setLoginMethod("otp")}
              >
                <Shield className="h-4 w-4 mr-2" />
                OTP Code
                {gracePeriodData && !gracePeriodData.isInGracePeriod && (
                  <span className="ml-1 text-xs">(Required)</span>
                )}
              </Button>
            </div>
          )}

          {/* OTP-Only Notice for Verified Users */}
          {emailVerificationStatus?.email_verified && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4 text-green-500" />
                <p className="text-sm text-green-800">
                  <strong>Email verified!</strong> You can now use OTP login with your verified email address.
                </p>
              </div>
            </div>
          )}
          
          {/* Grace Period Active Notice */}
          {gracePeriodData && gracePeriodData.isInGracePeriod && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-yellow-500" />
                <div className="text-sm text-yellow-800">
                  <p><strong>Grace Period Active:</strong> You have {gracePeriodData.daysRemaining} days left to verify your email.</p>
                  <p className="text-xs mt-1">After this period, password login will be disabled and OTP login will be required.</p>
                </div>
              </div>
            </div>
          )}

          {/* Grace Period Ended Notice */}
          {gracePeriodData && !gracePeriodData.isInGracePeriod && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <p className="text-sm text-red-800">
                  <strong>Password login has been disabled.</strong> Please use OTP login with your verified email address.
                </p>
              </div>
            </div>
          )}

          {/* Password Field (only show for password method and unverified users) */}
          {loginMethod === "password" && !emailVerificationStatus?.email_verified && (
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium text-foreground">
              Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type={showLoginPassword ? "text" : "password"}
                placeholder="Enter your password"
                className="pl-10 pr-10 border-border focus:ring-ring"
                value={loginData.password}
                onChange={(e) =>
                  setLoginData({ ...loginData, password: e.target.value })
                }
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowLoginPassword(!showLoginPassword)}
              >
                {showLoginPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
            
            {/* Forgot Password Link - Only show for unverified users */}
            {!emailVerificationStatus?.email_verified && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => navigate('/reset-password')}
                  className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
            )}
          </div>
          )}

          {/* OTP Info (show for OTP method or verified users) */}
          {(loginMethod === "otp" || emailVerificationStatus?.email_verified) && (
            <div className="space-y-2">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center space-x-2 mb-2">
                  <Shield className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium text-blue-900">
                    {emailVerificationStatus?.email_verified ? 'Email Verified - OTP Login Required' : 'Secure OTP Login'}
                  </span>
                </div>
                <p className="text-xs text-blue-800">
                  {emailVerificationStatus?.email_verified 
                    ? 'Your email is verified. Please use OTP login for enhanced security.'
                    : 'Enter your email above and click "Send OTP" to receive a 6-digit verification code.'
                  }
                </p>
            </div>
          </div>
          )}

          {/* Submit Buttons */}
          {(loginMethod === "password" && !emailVerificationStatus?.email_verified) ? (
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:brightness-95 text-primary-foreground font-medium py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </Button>
          ) : (
            <Button
              type="button"
              onClick={handleOTPLogin}
              disabled={otpLoading || !loginData.email}
              className="w-full bg-primary hover:brightness-95 text-primary-foreground font-medium py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {otpLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sending OTP...
                </>
              ) : (
                emailVerificationStatus?.email_verified ? "Send OTP Code" : "Send OTP Code"
              )}
          </Button>
          )}

          {/* Success Display */}
          {otpSuccess && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <div>
                  <p className="text-green-800 text-sm font-medium">OTP Sent Successfully!</p>
                  <p className="text-green-600 text-xs">Check your email for the 6-digit code. It expires in 10 minutes.</p>
                </div>
              </div>
            </div>
          )}

          {/* Error Display */}
          {otpError && (loginMethod === "otp" || emailVerificationStatus?.email_verified) && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <XCircle className="h-4 w-4 text-red-500" />
                <p className="text-red-600 text-sm">{otpError}</p>
              </div>
            </div>
          )}

          {/* General Error Display */}
          {alertDialog.open && alertDialog.type === "error" && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <XCircle className="h-4 w-4 text-red-500" />
                <div>
                  <p className="text-red-800 text-sm font-medium">{alertDialog.title}</p>
                  <p className="text-red-600 text-xs">{alertDialog.message}</p>
                </div>
              </div>
            </div>
          )}

          {/* Helpful Tips */}
          {!emailVerificationStatus?.email_verified && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
              <div className="flex items-start space-x-2">
                <div className="flex-shrink-0 mt-0.5">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                </div>
                <div className="text-xs text-gray-700">
                  <p className="font-medium mb-1">💡 Quick Tips:</p>
                  <ul className="space-y-1 text-xs">
                    <li>• Verify your email to use secure OTP login</li>
                    <li>• Check your spam folder for verification emails</li>
                    <li>• OTP codes expire after 10 minutes</li>
                    <li>• Contact support if you need help</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          <div className="text-center space-y-2">
            <Button
              type="button"
              variant="link"
              className="text-sm text-muted-foreground hover:text-foreground p-0 h-auto"
              onClick={() => navigate('/reset-password')}
            >
              Forgot your password?
            </Button>
            <div className="text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Button
                type="button"
                variant="link"
                className="p-0 h-auto text-sm font-medium"
                style={{ color: goldColor }}
                onClick={() => setView("register")}
              >
                Register (Master Admin Only)
              </Button>
            </div>
          </div>
        </form>
      );
    } else if (view === "register") {
      const passwordValid = isPasswordValid(registerData.password);
      
      return (
        <form className="space-y-4" onSubmit={handleRegisterSubmit}>
          <div className="space-y-2">
            <Label htmlFor="secretKey" className="text-sm font-medium text-gray-700">
              Secret Key
            </Label>
            <Input
              id="secretKey"
              type="text"
              placeholder="Enter secret key"
              className="border-gray-300 focus:border-gray-900 focus:ring-gray-900"
              value={registerData.secretKey}
              onChange={(e) =>
                setRegisterData({ ...registerData, secretKey: e.target.value })
              }
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">
                First Name
              </Label>
              <Input
                id="firstName"
                type="text"
                placeholder="First name"
                className="border-gray-300 focus:border-gray-900 focus:ring-gray-900"
                value={registerData.first_name}
                onChange={(e) =>
                  setRegisterData({ ...registerData, first_name: e.target.value })
                }
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">
                Last Name
              </Label>
              <Input
                id="lastName"
                type="text"
                placeholder="Last name"
                className="border-gray-300 focus:border-gray-900 focus:ring-gray-900"
                value={registerData.last_name}
                onChange={(e) =>
                  setRegisterData({ ...registerData, last_name: e.target.value })
                }
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="registerEmail" className="text-sm font-medium text-gray-700">
              Email
            </Label>
            <Input
              id="registerEmail"
              type="email"
              placeholder="Enter your email"
              className="border-gray-300 focus:border-gray-900 focus:ring-gray-900"
              value={registerData.email}
              onChange={(e) =>
                setRegisterData({ ...registerData, email: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="registerPassword" className="text-sm font-medium text-gray-700">
              Password
            </Label>
            <div className="relative">
              <Input
                id="registerPassword"
                type={showRegisterPassword ? "text" : "password"}
                placeholder="Min 12 alphanumeric characters"
                className="pr-10 border-gray-300 focus:border-gray-900 focus:ring-gray-900"
                value={registerData.password}
                onChange={(e) =>
                  setRegisterData({ ...registerData, password: e.target.value })
                }
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowRegisterPassword(!showRegisterPassword)}
              >
                {showRegisterPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </Button>
            </div>
            {!passwordValid ? (
              <p className="text-red-600 text-xs">
                Password must be at least 12 characters, containing letters and numbers.
              </p>
            ) : (
              <p className="text-green-600 text-xs">✓ Password meets criteria!</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="gender" className="text-sm font-medium text-gray-700">
              Gender
            </Label>
            <select
              id="gender"
              name="gender"
              value={registerData.gender}
              onChange={(e) =>
                setRegisterData({ ...registerData, gender: e.target.value })
              }
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:border-gray-900 focus:ring-gray-900"
              required
            >
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>

          <Button
            type="submit"
            className="w-full bg-black hover:bg-gray-800 text-white font-medium py-2.5"
            disabled={!passwordValid}
          >
            Create Account
          </Button>

          <div className="text-center">
            <Button
              type="button"
              variant="link"
              className="text-sm text-gray-600 hover:text-gray-900 p-0 h-auto"
              onClick={() => setView("login")}
            >
              Already have an account? Sign in
            </Button>
          </div>
        </form>
      );
    } else if (view === "forgot") {
      return (
        <form className="space-y-4" onSubmit={handleForgotSubmit}>
          <div className="space-y-2">
            <Label htmlFor="forgotEmail" className="text-sm font-medium text-gray-700">
              Email
            </Label>
            <Input
              id="forgotEmail"
              type="email"
              placeholder="Enter your email"
              className="border-gray-300 focus:border-gray-900 focus:ring-gray-900"
              value={forgotData.email}
              onChange={(e) =>
                setForgotData({ ...forgotData, email: e.target.value })
              }
              required
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-black hover:bg-gray-800 text-white font-medium py-2.5"
          >
            Send Reset Instructions
          </Button>

          <div className="text-center">
            <Button
              type="button"
              variant="link"
              className="text-sm text-gray-600 hover:text-gray-900 p-0 h-auto"
              onClick={() => setView("login")}
            >
              Back to Sign In
            </Button>
          </div>
        </form>
      );
    }
  };

  return (
    <div className="min-h-screen bg-white font-['Geist',sans-serif]">
      {/* OTP Transition Banner - Shows for all users */}
      {!transitionBannerDismissed && (
        <OTPTransitionBanner onDismiss={handleTransitionBannerDismiss} />
      )}
      
      {/* Grace Period Countdown Banner - Shows only for logged-in users */}
      {isLoggedIn && (
        <GracePeriodBanner
          gracePeriodData={gracePeriodData}
          onUpdateEmail={() => setShowGracePeriodAlert(true)}
          onDismiss={handleBannerDismiss}
          isLoggedIn={isLoggedIn}
        />
      )}

      {/* Main content area */}
      <div className="flex flex-col lg:flex-row min-h-screen">
        {/* Left Section: Title, Tagline & Image */}
        <div className="flex-1 flex flex-col justify-center items-center p-8 lg:p-16 text-center">
          <div className="max-w-2xl space-y-8">
            {/* Smartphone illustration above the title */}
            <div className="mb-8">
              <div className="w-full max-w-md mx-auto">
                <img
                  src="/assets/illustrations/smartphone-people.png"
                  alt="People using smartphones - Business Management"
                  className="w-full h-auto"
                />
              </div>
            </div>
            
            <div className="space-y-4">
              <h1 className="text-6xl lg:text-7xl font-bold text-black leading-tight">
                Vistapro
              </h1>
              <p className="text-xl lg:text-2xl text-gray-700 max-w-lg mx-auto leading-relaxed">
                Redefine Success in Phone Distribution.
              </p>
            </div>
          </div>
        </div>

        {/* Right Section: Form Card */}
        <div className="flex-1 flex flex-col justify-center items-center p-8 lg:p-16 bg-gray-50">
          <Card className="w-full max-w-md border-0 shadow-xl">
            <CardHeader className="space-y-1 pb-6">
              <CardDescription className="text-center text-gray-600">
                {view === "login"
                  ? "Enter your credentials to access your account"
                  : view === "register"
                  ? "Master Admin registration only"
                  : "Enter your email to receive reset instructions"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {renderForm()}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Alert Dialog */}
      <AlertDialog
        open={alertDialog.open}
        type={alertDialog.type}
        title={alertDialog.title}
        message={alertDialog.message}
        confirmText={alertDialog.confirmText}
        onConfirm={alertDialog.onConfirm}
        onCancel={() => setAlertDialog(prev => ({ ...prev, open: false }))}
        showCancel={false}
      />

      {/* OTP Input Modal */}
      <OTPInputModal
        isOpen={showOTPModal}
        onClose={() => {
          setShowOTPModal(false);
          setOtpError(null);
        }}
        email={loginData.email}
        onVerifyOTP={handleVerifyOTP}
        onResendOTP={handleResendOTP}
        isLoading={otpLoading}
        error={otpError}
        onBackToPassword={() => {
          setShowOTPModal(false);
          setLoginMethod("password");
          setOtpError(null);
        }}
      />

      {/* Grace Period Alert */}
      <GracePeriodAlert
        isOpen={showGracePeriodAlert}
        onClose={() => setShowGracePeriodAlert(false)}
        daysRemaining={gracePeriodData?.daysRemaining || 0}
        currentEmail={gracePeriodData?.currentEmail || ''}
        onUpdateEmail={handleUpdateEmail}
        isLoading={otpLoading}
        error={otpError}
      />
    </div>
  );
}

export default LandingPage;
