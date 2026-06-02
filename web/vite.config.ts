import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  build: {
    outDir: '../server/static',
    emptyOutDir: true,
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@shared': resolve(__dirname, '../shared/src'),
      '@server': resolve(__dirname, '../server/src'),
    },
  },
  server: {
    allowedHosts: true,
    host: true,
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5173',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://localhost:5173',
        changeOrigin: true,
        ws: true,
      }
    },
  },
});
