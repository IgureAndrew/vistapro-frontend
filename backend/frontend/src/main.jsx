import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'              // ← must include: @tailwind base; @tailwind components; @tailwind utilities;
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from "./contexts/AuthContext"
import { ThemeProvider } from "./contexts/ThemeContext"
import { ToastProvider } from "./components/ui/use-toast"

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>    {/* ← Custom Vite-optimized ThemeProvider */}
          <ToastProvider>
            <App />
          </ToastProvider>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
)
