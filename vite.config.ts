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
    // 产物文件名固定（lib 模式），直接覆盖写入即可，避免依赖清空目录操作
    emptyOutDir: false,
    sourcemap: false,
    minify: false
  },
  resolve: {
    alias: {
      '@giszhc/socket-client': resolve(__dirname, 'src/index.ts')
    }
  }
})
