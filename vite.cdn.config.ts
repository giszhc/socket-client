import { defineConfig } from 'vite'
import { resolve } from 'path'

/**
 * CDN 专用构建配置
 *
 * 产出 dist-cdn/socket-client.min.js（UMD，压缩 + sourcemap），
 * 可直接通过 <script> 标签从 CDN 引入：
 *
 *   <script src="https://cdn.jsdelivr.net/npm/@giszhc/socket-client/dist-cdn/socket-client.min.js"></script>
 *
 * 引入后全局变量为 window.SocketClient（即 SocketClient 类本身）。
 */
export default defineConfig({
  build: {
    outDir: 'dist-cdn',
    // 产物文件名固定（socket-client.min.js + map），直接覆盖写入，无需清空目录
    emptyOutDir: false,
    lib: {
      entry: resolve(__dirname, 'src/cdn.ts'),
      name: 'SocketClient',
      formats: ['umd'],
      fileName: () => 'socket-client.min.js'
    },
    rollupOptions: {
      output: {
        // 模块仅有 default export，让 window.SocketClient 直接指向 SocketClient 类
        exports: 'default'
      }
    },
    sourcemap: true,
    minify: 'esbuild'
  },
  resolve: {
    alias: {
      '@giszhc/socket-client': resolve(__dirname, 'src/index.ts')
    }
  }
})
