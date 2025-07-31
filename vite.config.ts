import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    global: 'window',
    'process.env': {},
    Buffer: ['buffer', 'Buffer'],
  },
  optimizeDeps: {
    include: ['buffer'],
    exclude: ['@zama-fhe/relayer-sdk']
  },
  server: {
    port: 3000,
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp'
    }
  },
  build: {
    target: 'esnext',
    rollupOptions: {
      external: ['events', 'util'],
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ethers: ['ethers']
        }
      }
    }
  },
  resolve: {
    alias: {
      'events': 'events',
      'util': 'util'
    }
  }
}) 