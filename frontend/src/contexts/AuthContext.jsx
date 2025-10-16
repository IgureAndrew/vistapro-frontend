import React, { createContext, useState, useEffect, useContext } from "react";
import { updateUserWithAvatar } from "../utils/avatarUtils";

// Create the context
export const AuthContext = createContext();

// Create a provider component
export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);

  // On mount, check localStorage for token and user details
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    if (storedToken) {
      setToken(storedToken);
    }
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // Listen for user updates from profile changes
  useEffect(() => {
    const handleUserUpdate = (event) => {
      const { user: updatedUser } = event.detail;
      setUser(updatedUser);
    };

    window.addEventListener('userUpdated', handleUserUpdate);
    return () => window.removeEventListener('userUpdated', handleUserUpdate);
  }, []);

  // Function to log in a user (store token and user details)
  const login = (token, userData) => {
    // Clear all localStorage data to prevent contamination
    localStorage.clear();
    
    // Update user data with avatar URL if profile_image exists
    const updatedUserData = updateUserWithAvatar(userData);
    
    // Set new user data
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(updatedUserData));
    setToken(token);
    setUser(updatedUserData);
  };

  // Function to log out a user (clear token and user details)
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
