import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  define: {
    'import.meta.env.VITE_API_URL': JSON.stringify('https://vistapro-backend.onrender.com')
  },
  server: {
    proxy: {
      '/api/uploads': {
        target: 'https://vistapro-backend.onrender.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/uploads/, '/uploads')
      }
    }
  }
})
