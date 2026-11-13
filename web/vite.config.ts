import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'

const shared = fileURLToPath(new URL('../shared', import.meta.url))
// In dev the Worker (wrangler dev) answers auth, API and MCP routes.
const worker = 'http://127.0.0.1:8787'

export default defineConfig({
  base: './',
  plugins: [react()],
  resolve: { alias: { '@shared': shared } },
  server: {
    fs: { allow: ['..'] },
    proxy: { '/api': worker, '/authorize': worker, '/connect': worker, '/mcp': worker },
  },
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three', '@react-three/fiber', '@react-three/drei'],
          motion: ['motion', 'gsap', 'lenis'],
        },
      },
    },
  },
})
