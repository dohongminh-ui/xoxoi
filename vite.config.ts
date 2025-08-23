import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
/// <reference types="vitest" />

// https://vitejs.dev/config/
export default defineConfig({
   plugins: [react()],

   // CSS configuration
   css: {
      modules: {
         // Generate class names in development for easier debugging
         generateScopedName:
            process.env.NODE_ENV === 'development'
               ? '[name]__[local]__[hash:base64:5]'
               : '[hash:base64:8]',
         // Enable CSS modules for .module.css files
         localsConvention: 'camelCaseOnly',
      },
   },

   // Configure development server
   server: {
      port: 3001, // Use different port than Express server (3000)
      proxy: {
         // Proxy Socket.io requests to Express server
         '/socket.io': {
            target: 'http://localhost:3000',
            ws: true,
            changeOrigin: true,
         },
         // Proxy any API requests to Express server
         '/api': {
            target: 'http://localhost:3000',
            changeOrigin: true,
         },
      },
   },

   // Build configuration
   build: {
      outDir: 'dist',
      sourcemap: true,
      // Ensure compatibility with existing assets
      rollupOptions: {
         input: {
            main: './index.html',
         },
      },
   },

   // Public directory for static assets
   publicDir: 'public',

   // Define development environment variables
   define: {
      __DEV__: JSON.stringify(process.env.NODE_ENV === 'development'),
   },

   // Test configuration
   test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/setupTests.ts'],
      css: {
         modules: {
            classNameStrategy: 'non-scoped',
         },
      },
   },
});
