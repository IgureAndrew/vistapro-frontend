import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'              // ← must include: @tailwind base; @tailwind components; @tailwind utilities;
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from "./contexts/AuthContext"
import { ThemeProvider } from "./components/theme-provider"

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider attribute="class">    {/* ← wrap here */}
          <App />
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
)
