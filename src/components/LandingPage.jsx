import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

// Example gold color from your logo.
const goldColor = "#C6A768";

function LandingPage() {
  // Define which form to show (login, register, or forgot password)
  const [view, setView] = useState("login");
  const navigate = useNavigate();

  // Form state for each view.
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [registerData, setRegisterData] = useState({
    secretKey: "", // Registration is only for Master Admins.
    name: "",
    email: "",
    password: "",
    phone: "",
    gender: ""
  });
  const [forgotData, setForgotData] = useState({ email: "" });

  // Use the environment variable for the API base URL.
  // In your Vercel project, set REACT_APP_API_URL to your live backend URL.
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
        // Save token and user details in localStorage.
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));

        // Redirect based on the user's role.
        if (data.user.role === "SuperAdmin") {
          navigate("/dashboard/superadmin");
        } else if (data.user.role === "MasterAdmin") {
          navigate("/dashboard/masteradmin");
        } else if (data.user.role === "Admin") {
          navigate("/dashboard/admin");
        } else if (data.user.role === "Dealer") {
          navigate("/dashboard/dealer");
        } else {
          navigate("/");
        }
      } else {
        alert(data.message || "Login failed");
      }
    } catch (error) {
      console.error(error);
      alert("Error logging in");
    }
  };

  // Handler for registration submission.
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
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
      console.error(error);
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
      console.error(error);
      alert("Error sending reset instructions");
    }
  };

  // Render the appropriate form based on current view.
  const renderForm = () => {
    if (view === "login") {
      return (
        <form className="flex flex-col gap-4" onSubmit={handleLoginSubmit}>
          <input
            type="email"
            placeholder="Email"
            className="border border-gray-600 rounded px-4 py-2 bg-gray-900 text-white placeholder-gray-400"
            value={loginData.email}
            onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
          />
          <input
            type="password"
            placeholder="Password"
            className="border border-gray-600 rounded px-4 py-2 bg-gray-900 text-white placeholder-gray-400"
            value={loginData.password}
            onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
          />
          <button
            type="submit"
            className="mt-4"
            style={{
              backgroundColor: goldColor,
              color: "#000",
              fontWeight: "bold",
              padding: "0.5rem 1rem",
              borderRadius: "0.25rem",
            }}
          >
            Login
          </button>
          <div className="flex items-center justify-between mt-4 text-sm">
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
      return (
        <form className="flex flex-col gap-4" onSubmit={handleRegisterSubmit}>
          <p className="text-sm text-red-600">
            Note: Registration is only available for Master Admins.
          </p>
          <input
            type="text"
            placeholder="Secret Key"
            className="border border-gray-600 rounded px-4 py-2 bg-gray-900 text-white placeholder-gray-400"
            value={registerData.secretKey}
            onChange={(e) => setRegisterData({ ...registerData, secretKey: e.target.value })}
          />
          <input
            type="text"
            placeholder="Name"
            className="border border-gray-600 rounded px-4 py-2 bg-gray-900 text-white placeholder-gray-400"
            value={registerData.name}
            onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
          />
          <input
            type="email"
            placeholder="Email"
            className="border border-gray-600 rounded px-4 py-2 bg-gray-900 text-white placeholder-gray-400"
            value={registerData.email}
            onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
          />
          <input
            type="password"
            placeholder="Password"
            className="border border-gray-600 rounded px-4 py-2 bg-gray-900 text-white placeholder-gray-400"
            value={registerData.password}
            onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
          />
          <input
            type="text"
            placeholder="Phone"
            className="border border-gray-600 rounded px-4 py-2 bg-gray-900 text-white placeholder-gray-400"
            value={registerData.phone}
            onChange={(e) => setRegisterData({ ...registerData, phone: e.target.value })}
          />
          <input
            type="text"
            placeholder="Gender"
            className="border border-gray-600 rounded px-4 py-2 bg-gray-900 text-white placeholder-gray-400"
            value={registerData.gender}
            onChange={(e) => setRegisterData({ ...registerData, gender: e.target.value })}
          />
          <button
            type="submit"
            className="mt-4"
            style={{
              backgroundColor: goldColor,
              color: "#000",
              fontWeight: "bold",
              padding: "0.5rem 1rem",
              borderRadius: "0.25rem",
            }}
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
            className="border border-gray-600 rounded px-4 py-2 bg-gray-900 text-white placeholder-gray-400"
            value={forgotData.email}
            onChange={(e) => setForgotData({ ...forgotData, email: e.target.value })}
          />
          <button
            type="submit"
            className="mt-4"
            style={{
              backgroundColor: goldColor,
              color: "#000",
              fontWeight: "bold",
              padding: "0.5rem 1rem",
              borderRadius: "0.25rem",
            }}
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
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header with Logo */}
      <header className="p-4 bg-black flex items-center">
        <img
          src="/assets/logo/vistapro logo-01.png"
          alt="VistaPro Logo"
          className="h-30"
        />
      </header>

      {/* Main content area */}
      <div className="flex flex-col md:flex-row flex-1">
        {/* Left Section: Title & Illustration */}
        <div className="flex-1 flex flex-col justify-center items-center p-6 md:p-12">
          <h1
            className="text-5xl md:text-7xl font-bold mb-4"
            style={{ fontFamily: "Roboto, sans-serif", color: goldColor }}
          >
            Welcome to VistaPro
          </h1>
          <p className="text-lg text-gray-300 text-center md:text-left max-w-md mb-8">
            Redefine Success in Phone Distribution.
          </p>
        </div>

        {/* Right Section: Form Card */}
        <div className="flex-1 flex flex-col justify-center items-center p-6 md:p-12">
          <div className="w-full max-w-sm bg-gray-800 p-6 rounded shadow-md">
            <h2 className="text-2xl font-semibold mb-6" style={{ color: goldColor }}>
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
