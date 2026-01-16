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
  server: { open: true },
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
  }
})
