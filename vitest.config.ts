import { defineConfig } from 'vitest/config'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    include: ['src/**/__tests__/**/*.test.ts'],
    exclude: ['src/__tests__/type-safety.test.ts', 'src/__tests__/type-check-actual.test.ts', 'src/__tests__/type-safety-verification.test.ts', 'src/views/Main/ai/chat/composables/__tests__/dateUtils.test.ts'],
    environment: 'jsdom',
    globals: true,
    typecheck: {
      tsconfig: './tsconfig.vitest.json',
    },
  },
})
