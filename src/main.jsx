import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'  // Make sure this line exists
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from "./contexts/AuthContext";

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
    <AuthProvider>
      <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
)
