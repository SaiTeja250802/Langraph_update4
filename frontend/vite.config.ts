import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: [
      'localhost',
      '.localhost',
      '.preview.emergentagent.com',
      'vscode-f6468197-53b3-48d5-9694-f1c7c42c22f2.preview.emergentagent.com'
    ]
  }
})