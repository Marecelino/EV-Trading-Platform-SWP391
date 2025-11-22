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
    // Optimize chunk splitting for better caching
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Split node_modules into separate chunks
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'react-vendor';
            }
            if (id.includes('@mui') || id.includes('@emotion')) {
              return 'mui-vendor';
            }
            if (id.includes('chart.js') || id.includes('react-chartjs')) {
              return 'chart-vendor';
            }
            // All other node_modules
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
