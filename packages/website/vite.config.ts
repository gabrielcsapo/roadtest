import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'

// Workspace root — two levels up from packages/website
const workspaceRoot = resolve(__dirname, '../..')

export default defineConfig({
  plugins: [react(), tailwindcss()],
  root: __dirname,
  server: {
    port: 4000,
    fs: { allow: [workspaceRoot] },
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
    },
  },
})
