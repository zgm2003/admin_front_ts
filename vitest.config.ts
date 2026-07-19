import { defineConfig } from 'vitest/config'
import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    host: '127.0.0.1',
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    maxWorkers: 4,
    coverage: {
      provider: 'v8',
      include: [
        'src/app/**/*.{ts,vue}',
        'src/modules/**/*.{ts,vue}',
      ],
      exclude: [
        'src/modules/**/generated/**',
      ],
      thresholds: {
        statements: 80,
        branches: 80,
        'src/app/**': { statements: 80, branches: 80 },
        'src/modules/auth/**': { statements: 80, branches: 80 },
        'src/modules/http/**': { statements: 80, branches: 80 },
        'src/modules/routing/**': { statements: 80, branches: 80 },
        'src/modules/realtime/**': { statements: 80, branches: 80 },
        'src/modules/resource-query/**': { statements: 80, branches: 80 },
        'src/modules/persistence/**': { statements: 80, branches: 80 },
      },
    },
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          environment: 'node',
          include: ['tests/**/*.test.ts'],
          exclude: [
            'tests/component/**/*.test.ts',
            'tests/integration/**/*.test.ts',
          ],
        },
      },
      {
        extends: true,
        test: {
          name: 'component',
          environment: 'happy-dom',
          setupFiles: ['tests/setup/dom.ts'],
          include: ['tests/component/**/*.test.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'integration',
          environment: 'node',
          include: ['tests/integration/**/*.test.ts'],
        },
      },
    ],
  },
})
