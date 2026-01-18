import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: { 
    open: true,
    // 预热常用文件
    warmup: {
      clientFiles: ['./src/main.ts', './src/router.ts', './src/App.vue'],
    },
  },
  optimizeDeps: {
    // 明确包含需要预构建的依赖
    include: [
      'vue',
      'vue-router',
      'pinia',
      'vue-i18n',
      'element-plus',
      '@element-plus/icons-vue',
      'axios',
      'js-cookie',
      '@iconify/vue',
    ],
  },
  build: {
    // 分包策略
    rollupOptions: {
      output: {
        manualChunks: {
          'vue-vendor': ['vue', 'vue-router', 'pinia', 'vue-i18n'],
          'element-plus': ['element-plus', '@element-plus/icons-vue'],
          'editor': ['@wangeditor/editor-for-vue', '@wangeditor/plugin-md'],
        }
      }
    },
    // 压缩配置
    minify: 'esbuild',
    // chunk 大小警告阈值
    chunkSizeWarningLimit: 1000,
    // CSS 代码分割
    cssCodeSplit: true,
    // 根据环境自动切换 sourcemap：开发环境 true，生产环境 false
    sourcemap: process.env.NODE_ENV !== 'production',
  }
})
