import react from '@vitejs/plugin-react'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'
import { defineConfig } from 'vite'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  build: {
    outDir: '../server/static',
    emptyOutDir: true,
  },
  plugins: [react({
    babel: {
      plugins: [
        [
          '@babel/plugin-proposal-decorators',
          {
            version: '2023-05'
          }
        ]
      ]
    }
  })],
  resolve: {
    alias: {
      '@shared': resolve(__dirname, '../shared/src'),
      '@server': resolve(__dirname, '../server/src'),
      '@web': resolve(__dirname, 'src'),
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
})
