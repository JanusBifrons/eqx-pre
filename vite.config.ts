import { defineConfig } from 'vite'
import { resolve } from 'path'
import { fileURLToPath, URL } from 'node:url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

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
            // Mock React for Zustand compatibility
            'react': resolve(__dirname, 'src/utils/react-mock.js'),
            'react-dom': resolve(__dirname, 'src/utils/react-dom-mock.js')
        },
    }, esbuild: {
        target: 'es2019',
        supported: {
            'logical-assignment': false
        }
    }, optimizeDeps: {
        include: ['zustand'],
        exclude: ['react', 'react-dom']
    }, define: {
        global: 'globalThis',
        'process.env.NODE_ENV': JSON.stringify('development')
    },
    server: {
        port: 3000,
        open: true,
    }, build: {
        outDir: 'dist',
        sourcemap: true,
        target: 'es2019'
    },
})
