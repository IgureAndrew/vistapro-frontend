// src/App.jsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

function App() {
  // Force deployment update - Domain accessibility fix
  console.log('VistaPro App loaded successfully - MINIMAL TEST');
  console.log('🔍 App component rendering with Routes - MINIMAL VERSION');
  return (
    <div>
      <h1>VistaPro App is Loading!</h1>
      <Routes>
        <Route path="/" element={<div style={{padding: '20px', fontSize: '24px', color: 'blue'}}>🏠 Home Route Working!</div>} />
        <Route path="/test" element={<div style={{padding: '20px', fontSize: '24px', color: 'green'}}>🚀 Frontend is working! React Router is functional.</div>} />
        <Route path="/test-verify" element={<div style={{padding: '20px', fontSize: '24px', color: 'blue'}}>✅ Test Route Working! Frontend is loading correctly.</div>} />
        <Route path="/verify-email" element={<div style={{padding: '20px', fontSize: '24px', color: 'orange'}}>📧 Email Verification Route Working!</div>} />
        {/* Catch-all route for SPA routing */}
        <Route path="*" element={<div style={{padding: '20px', fontSize: '24px', color: 'red'}}>❌ Route not found: {window.location.pathname}</div>} />
      </Routes>
    </div>
  );
}

export default App;
