import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    emptyOutDir: true,
  },
  clearScreen: false,
  base: '/help-queue/', // Replace 'help-queue' with your repository name
  // Add this optimizeDeps configuration
  optimizeDeps: {
    force: true // Forces dependency pre-bundling
  },
  // Disable caching during development if issues persist
  server: {
    force: true
  }
})