import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

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

  // Use the API base URL from environment variables.
  const API_BASE_URL = import.meta.env.VITE_API_URL;

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
          //data.user should now include bio_submitted, guarantor_submitted, commitment_submitted
           localStorage.setItem("user", JSON.stringify(data.user));
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
        if (data.emailNotVerified) {
          alert("Please verify your email address before logging in. Check your inbox for a verification link.");
        } else {
          alert(data.message || "Login failed");
        }
      }
    } catch (error) {
      console.error("Error logging in:", error);
      alert("Error logging in");
    }
  };

  // Handler for registration submission.
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!isPasswordValid(registerData.password)) {
      alert("Password must be at least 12 alphanumeric characters.");
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
        alert("Registration successful!");
      } else {
        alert(data.message || "Registration failed");
      }
    } catch (error) {
      console.error("Error registering:", error);
      alert("Error registering");
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
        alert("Password reset instructions sent!");
      } else {
        alert(data.message || "Reset failed");
      }
    } catch (error) {
      console.error("Error sending reset instructions:", error);
      alert("Error sending reset instructions");
    }
  };

  // Render the appropriate form based on the current view.
  const renderForm = () => {
    if (view === "login") {
      return (
        <form className="flex flex-col gap-4" onSubmit={handleLoginSubmit}>
          <input
            type="email"
            placeholder="Email"
            className="border border-gray-300 rounded px-4 py-2 text-black"
            value={loginData.email}
            onChange={(e) =>
              setLoginData({ ...loginData, email: e.target.value })
            }
          />
          <div className="relative">
            <input
              type={showLoginPassword ? "text" : "password"}
              placeholder="Password"
              className="border border-gray-300 rounded px-4 py-2 text-black w-full"
              value={loginData.password}
              onChange={(e) =>
                setLoginData({ ...loginData, password: e.target.value })
              }
            />
            <button
              type="button"
              className="absolute right-2 top-2 text-sm text-gray-500"
              onClick={() => setShowLoginPassword(!showLoginPassword)}
            >
              {showLoginPassword ? "Hide" : "Show"}
            </button>
          </div>
          <button
            type="submit"
            className="mt-4 px-4 py-2 rounded font-bold"
            style={{ backgroundColor: blackColor, color: goldColor }}
          >
            Login
          </button>
          <div className="flex justify-between text-sm mt-2">
            <p
              className="cursor-pointer"
              style={{ color: goldColor }}
              onClick={() => setView("forgot")}
            >
              Forgot Password?
            </p>
            <p
              className="cursor-pointer"
              style={{ color: goldColor }}
              onClick={() => setView("register")}
            >
              Register (Master Admin Only)
            </p>
          </div>
        </form>
      );
    } else if (view === "register") {
      const passwordValid = isPasswordValid(registerData.password);
      return (
        <form className="flex flex-col gap-4" onSubmit={handleRegisterSubmit}>
          <p className="text-sm text-red-600">
            Note: Registration is only available for Master Admins.
          </p>
          <input
            type="text"
            placeholder="Secret Key"
            className="border border-gray-300 rounded px-4 py-2 text-black"
            value={registerData.secretKey}
            onChange={(e) =>
              setRegisterData({ ...registerData, secretKey: e.target.value })
            }
          />
          <input
            type="text"
            placeholder="First Name"
            className="border border-gray-300 rounded px-4 py-2 text-black"
            value={registerData.first_name}
            onChange={(e) =>
              setRegisterData({ ...registerData, first_name: e.target.value })
            }
            required
          />
          <input
            type="text"
            placeholder="Last Name"
            className="border border-gray-300 rounded px-4 py-2 text-black"
            value={registerData.last_name}
            onChange={(e) =>
              setRegisterData({ ...registerData, last_name: e.target.value })
            }
            required
          />
          <input
            type="email"
            placeholder="Email"
            className="border border-gray-300 rounded px-4 py-2 text-black"
            value={registerData.email}
            onChange={(e) =>
              setRegisterData({ ...registerData, email: e.target.value })
            }
            required
          />
          <div className="relative">
            <input
              type={showRegisterPassword ? "text" : "password"}
              placeholder="Password (min 12 alphanumeric chars)"
              className="border border-gray-300 rounded px-4 py-2 text-black w-full"
              value={registerData.password}
              onChange={(e) =>
                setRegisterData({ ...registerData, password: e.target.value })
              }
              required
            />
            <button
              type="button"
              className="absolute right-2 top-2 text-sm text-gray-500"
              onClick={() => setShowRegisterPassword(!showRegisterPassword)}
            >
              {showRegisterPassword ? "Hide" : "Show"}
            </button>
          </div>
          {!passwordValid ? (
            <p className="text-red-600 text-sm">
              Password must be at least 12 characters, containing letters and
              numbers.
            </p>
          ) : (
            <p className="text-green-600 text-sm">Password meets criteria!</p>
          )}
          <select
            name="gender"
            value={registerData.gender}
            onChange={(e) =>
              setRegisterData({ ...registerData, gender: e.target.value })
            }
            className="border border-gray-300 rounded px-4 py-2"
            required
          >
            <option value="">Select Gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
          <button
            type="submit"
            className="mt-4 px-4 py-2 rounded font-bold"
            style={{ backgroundColor: blackColor, color: goldColor }}
            disabled={!passwordValid}
          >
            Register
          </button>
          <p
            className="cursor-pointer mt-4 text-sm"
            style={{ color: goldColor }}
            onClick={() => setView("login")}
          >
            Already have an account? Login
          </p>
        </form>
      );
    } else if (view === "forgot") {
      return (
        <form className="flex flex-col gap-4" onSubmit={handleForgotSubmit}>
          <input
            type="email"
            placeholder="Email"
            className="border border-gray-300 rounded px-4 py-2 text-black"
            value={forgotData.email}
            onChange={(e) =>
              setForgotData({ ...forgotData, email: e.target.value })
            }
          />
          <button
            type="submit"
            className="mt-4 px-4 py-2 rounded font-bold"
            style={{ backgroundColor: blackColor, color: goldColor }}
          >
            Send Reset Instructions
          </button>
          <p
            className="cursor-pointer mt-4 text-sm"
            style={{ color: goldColor }}
            onClick={() => setView("login")}
          >
            Back to Login
          </p>
        </form>
      );
    }
  };

  return (
    <div className="min-h-screen bg-white text-black flex flex-col">
      {/* Header with Logo */}
      <header className="p-4 bg-white flex items-center border-b border-gray-200">
        <img
          src="/assets/logo/vistapro logo-01.png"
          alt="VistaPro Logo"
          className="h-16"
        />
      </header>

      {/* Main content area */}
      <div className="flex flex-col md:flex-row flex-1">
        {/* Left Section: Title & Illustration */}
        <div className="flex-1 flex flex-col justify-center items-center p-6 md:p-12 text-center">
          <h1
            className="text-6xl md:text-7xl font-bold mb-4"
            style={{ fontFamily: "Roboto, sans-serif", color: blackColor }}
          >
            Vistapro
          </h1>
          <p className="text-lg text-gray-700 max-w-md mb-8">
            Redefine Success in Phone Distribution.
          </p>
        </div>

        {/* Right Section: Form Card */}
        <div className="flex-1 flex flex-col justify-center items-center p-6 md:p-12">
          <div className="w-full max-w-sm bg-white border border-black shadow-lg p-6 rounded">
            <h2
              className="text-2xl font-semibold mb-6"
              style={{ color: goldColor }}
            >
              {view === "login"
                ? "Login"
                : view === "register"
                ? "Register (Master Admin Only)"
                : "Forgot Password"}
            </h2>
            {renderForm()}
          </div>
        </div>
      </div>
    </div>
  );
}

export default LandingPage;
