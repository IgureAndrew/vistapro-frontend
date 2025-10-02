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
    'import.meta.env.VITE_API_URL': JSON.stringify('http://localhost:5007')
  },
  server: {
    proxy: {
      '/api/uploads': {
        target: 'http://localhost:5007',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/uploads/, '/uploads')
      }
    }
  }
})
