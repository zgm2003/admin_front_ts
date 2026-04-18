import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import { visualizer } from 'rollup-plugin-visualizer'

const host = process.env.TAURI_DEV_HOST
const fallbackHost = '127.0.0.1'
const isAnalyze = process.env.ANALYZE === 'true'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    AutoImport({
      resolvers: [ElementPlusResolver({ importStyle: false })],
      dts: 'src/types/auto-imports.d.ts',
    }),
    Components({
      resolvers: [ElementPlusResolver({ importStyle: false })],
      dts: 'src/types/components.d.ts',
      globs: ['src/components/*/index.vue'], // 只扫描组件根目录的 index.vue
    }),
    // Bundle 可视化分析（ANALYZE=true npm run build 启用）
    isAnalyze && visualizer({
      open: true,
      filename: 'dist/stats.html',
      gzipSize: true,
      brotliSize: true,
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  // Tauri 需要固定端口
  clearScreen: false,
  server: {
    port: 5173,
    strictPort: true,
    host: host || fallbackHost,
    hmr: host
      ? {
          protocol: 'ws',
          host,
          port: 5174,
        }
      : undefined,
    watch: {
      ignored: ['**/src-tauri/**'],
    },
    open: !process.env.TAURI_ENV_DEBUG,
    // 预热常用文件
    warmup: {
      clientFiles: ['./src/main.ts', './src/router/index.ts', './src/App.vue'],
    },
  },
  optimizeDeps: {
    include: [
      'vue',
      'vue-router',
      'pinia',
      'vue-i18n',
      'axios',
      'js-cookie',
      '@iconify/vue',
      '@element-plus/icons-vue',
    ],
  },
  build: {
    // Rolldown 分包策略
    rolldownOptions: {
      // ali-oss 为可选依赖，未安装时不打包
      external: ['ali-oss'],
      output: {
        codeSplitting: {
          groups: [
            {
              test: /node_modules\/(?:vue|vue-router|pinia|vue-i18n)\//,
              name: 'vue-vendor',
            },
            {
              test: /@wangeditor\//,
              name: 'editor',
            },
            {
              test: /cos-js-sdk/,
              name: 'cos-js-sdk-v5',
            },
            {
              test: /@iconify\//,
              name: 'iconify',
            },
          ],
        },
      },
    },
    // chunk 大小警告阈值
    chunkSizeWarningLimit: 1000,
    // CSS 代码分割
    cssCodeSplit: true,
    // 根据环境自动切换 sourcemap：开发环境 true，生产环境 false
    sourcemap: process.env.NODE_ENV !== 'production',
  }
})
