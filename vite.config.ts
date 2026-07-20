import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import { visualizer } from 'rollup-plugin-visualizer'
import { bundleMetadataPlugin } from './scripts/lib/bundle-metadata.mjs'

const fallbackHost = '127.0.0.1'
const isAnalyze = process.env.ANALYZE === 'true'
const projectRoot = fileURLToPath(new URL('.', import.meta.url))

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
    bundleMetadataPlugin(projectRoot),
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
      'linkify-it': fileURLToPath(new URL('./src/lib/markdown/linkify-it-v6-compat.ts', import.meta.url)),
      'linkify-it-v6-source': fileURLToPath(new URL('./node_modules/linkify-it/build/index.mjs', import.meta.url)),
    },
  },
  clearScreen: false,
  server: {
    port: 5173,
    strictPort: true,
    host: fallbackHost,
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
      '@iconify/vue',
      '@element-plus/icons-vue',
    ],
  },
  build: {
    manifest: true,
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
