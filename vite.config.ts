import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

// https://vitejs.dev/config/
export default defineConfig({
  // Electron laedt über file:// -> relativer Basis-Pfad. Web nutzt '/'.
  base: process.env.VITE_ELECTRON ? './' : process.env.VITE_BASE || '/',
  define: {
    __IS_ELECTRON__: JSON.stringify(Boolean(process.env.VITE_ELECTRON)),
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    chunkSizeWarningLimit: 700,
  },
})
