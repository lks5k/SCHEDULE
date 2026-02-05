import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react()
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@config': resolve(__dirname, './src/config'),
      '@utils': resolve(__dirname, './src/utils'),
      '@modules': resolve(__dirname, './src/modules'),
      '@components': resolve(__dirname, './src/components'),
      '@hooks': resolve(__dirname, './src/hooks'),
      '@context': resolve(__dirname, './src/context')
    }
  },
  server: {
    port: 3000,
    open: true,
    hmr: {
      overlay: true
    }
  },
  optimizeDeps: {
    // Evitar eval en dependencias durante desarrollo
    esbuildOptions: {
      target: 'es2020'
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: 'source-map',  // Formato CSP-compatible (no eval)
    minify: 'esbuild',
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-xlsx': ['xlsx']
        }
      }
    }
  },
  esbuild: {
    // Evitar eval en desarrollo
    pure: ['console.log'],
    keepNames: true,
    legalComments: 'none'
  }
});
