import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { readFileSync } from 'fs'

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'))

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/flowcraft/',
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  resolve: {
    alias: { '@': '/src' },
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'flow-vendor': ['@xyflow/react'],
          'export-vendor': ['jspdf', 'pptxgenjs', 'html-to-image', 'jszip', 'file-saver'],
          'icons-vendor': ['lucide-react'],
          'diagram-styles': [
            './src/styles/diagramStyles/index.ts',
            './src/styles/palettes/index.ts',
          ],
        },
      },
    },
  },
})
