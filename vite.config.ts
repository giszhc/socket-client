import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'socket-client',
      fileName: 'socket-client'
    },
    rollupOptions: {
      external: [],
      output: {
        globals: {}
      }
    },
    sourcemap: false,
    minify: false
  },
  resolve: {
    alias: {
      '@giszhc/socket-client': resolve(__dirname, 'src/index.ts')
    }
  }
})
