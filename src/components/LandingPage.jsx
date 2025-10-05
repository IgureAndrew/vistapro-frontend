import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { updateUserWithAvatar } from "../utils/avatarUtils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import AlertDialog from "@/components/ui/alert-dialog";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";

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

  // Alert dialog state
  const [alertDialog, setAlertDialog] = useState({
    open: false,
    type: "info",
    title: "",
    message: "",
    confirmText: "OK",
    onConfirm: null
  });

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

  // Handler for login submission.
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
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
        // Redirect based on the user's role.
        switch (data.user.role) {
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
            navigate("/");
            break;
        }
      } else {
        if (data.requiresAssignment) {
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
                onChange={(e) =>
                  setLoginData({ ...loginData, email: e.target.value })
                }
                required
              />
            </div>
          </div>
          
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
          </div>

          <Button
            type="submit"
            className="w-full bg-primary hover:brightness-95 text-primary-foreground font-medium py-2.5"
          >
            Sign In
          </Button>

          <div className="text-center space-y-2">
            <Button
              type="button"
              variant="link"
              className="text-sm text-muted-foreground hover:text-foreground p-0 h-auto"
              onClick={() => setView("forgot")}
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
      {/* Header with Logo */}
      <header className="p-6 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto flex items-center">
          <div className="h-16 flex items-center">
            {/* VistaPro Logo */}
            <div className="flex items-center space-x-3">
              <img
                src="/assets/logo/vistapro logo-01.png"
                alt="VistaPro Logo"
                className="h-12 w-auto"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main content area */}
      <div className="flex flex-col lg:flex-row min-h-[calc(100vh-96px)]">
        {/* Left Section: Title, Tagline & Image */}
        <div className="flex-1 flex flex-col justify-center items-center p-8 lg:p-16 text-center">
          <div className="max-w-2xl space-y-8">
            <div className="space-y-4">
              <h1 className="text-6xl lg:text-7xl font-bold text-black leading-tight">
                Vistapro
              </h1>
              <p className="text-xl lg:text-2xl text-gray-700 max-w-lg mx-auto leading-relaxed">
                Redefine Success in Phone Distribution.
              </p>
            </div>
            
            {/* Image below the tagline */}
            <div className="mt-12">
              <div className="w-full max-w-md mx-auto bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg p-8 text-center">
                <div className="text-6xl mb-4">📱</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Phone Distribution</h3>
                <p className="text-gray-600">Streamlined business management for mobile device distribution</p>
              </div>
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
    </div>
  );
}

export default LandingPage;
