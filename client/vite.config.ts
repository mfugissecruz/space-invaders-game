import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import { fileURLToPath } from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@':          resolve(__dirname, 'src'),
      '@game/shared': resolve(__dirname, '../packages/shared/src/index.ts')
    }
  },
  server: {
    proxy: {
      '/ws': {
        target: 'ws://localhost:3000',
        ws:     true,
      },
      '/attract': {
        target: 'http://localhost:3000',
      },
      '/health': {
        target: 'http://localhost:3000',
      }
    }
  }
})
