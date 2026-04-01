import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  build: {
    outDir: './docs',
    rollupOptions: {
      input: {
        parent: resolve(__dirname, 'example/parent.html'),
        child: resolve(__dirname, 'example/child.html')
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].[hash].js',
        assetFileNames: 'assets/[name].[ext]',
        // 移除入口文件的路径前缀
        preserveModules: false,
      }
    },
    sourcemap: false,
    minify: true,
    emptyOutDir: true
  },
  publicDir: '',
  base: './'
})
