import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { copyFileSync } from 'fs';

// Plugin to copy PWA files to dist after build
const copyPWAFiles = () => ({
  name: 'copy-pwa-files',
  closeBundle() {
    try {
      // Copy service worker
      copyFileSync('public/service-worker.js', 'dist/service-worker.js');
      console.log('✓ Copied service-worker.js to dist/');

      // Copy manifest
      copyFileSync('public/manifest.json', 'dist/manifest.json');
      console.log('✓ Copied manifest.json to dist/');
    } catch (error) {
      console.warn('Warning: Could not copy PWA files:', error.message);
    }
  }
});

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      // Configure cache directory to avoid conflicts with Railway's mounted volumes
      cacheDir: env.VITE_CACHE_DIR || 'node_modules/.vite',
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: {
          '/api/tts': {
            target: 'http://localhost:8000',
            changeOrigin: true,
          }
        }
      },
      plugins: [react(), copyPWAFiles()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        outDir: 'dist',
        sourcemap: false,
        minify: 'esbuild',
        target: 'esnext',
        rollupOptions: {
          output: {
            manualChunks: {
              'react-vendor': ['react', 'react-dom'],
              'genai-vendor': ['@google/genai'],
              'lucide-vendor': ['lucide-react']
            },
            chunkFileNames: 'assets/[name]-[hash].js',
            entryFileNames: 'assets/[name]-[hash].js',
            assetFileNames: 'assets/[name]-[hash].[ext]'
          }
        },
        chunkSizeWarningLimit: 1000,
        cssCodeSplit: true,
        assetsInlineLimit: 4096
      },
      optimizeDeps: {
        include: ['react', 'react-dom', '@google/genai', 'lucide-react']
      }
    };
});
