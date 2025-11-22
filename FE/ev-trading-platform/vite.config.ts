import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Optimize build for production
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false, // Disable source maps in production for smaller builds
    minify: 'esbuild', // Use esbuild (faster, built-in) instead of terser
    // Let Vite handle chunk splitting automatically to avoid circular dependency issues
    // Vite will automatically optimize chunks based on dependencies
    rollupOptions: {
      output: {
        // Simplified chunk splitting to avoid circular dependency issues with MUI
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            // Only split very large, independent packages
            if (id.includes('chart.js') && !id.includes('react-chartjs')) {
              return 'chart-core';
            }
            // Keep everything else together to avoid initialization order issues
            return 'vendor';
          }
        },
      },
    },
    // Chunk size warning limit (1MB)
    chunkSizeWarningLimit: 1000,
  },
  // Optimize dependencies pre-bundling
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
  },
})
