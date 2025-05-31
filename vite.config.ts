import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@/core': resolve(__dirname, 'src/core'),
      '@/systems': resolve(__dirname, 'src/systems'),
      '@/entities': resolve(__dirname, 'src/entities'),
      '@/components': resolve(__dirname, 'src/components'),
      '@/ui': resolve(__dirname, 'src/ui'),
      '@/store': resolve(__dirname, 'src/store'),
      '@/utils': resolve(__dirname, 'src/utils'),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
})
