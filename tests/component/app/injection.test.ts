import { createApp } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import { provideAppKernel, useAppKernel } from '@/app/injection'
import type { AppKernel } from '@/app/kernel'

const EmptyRoot = () => null

describe('AppKernel injection', () => {
  it('returns the exact kernel provided by the application root', () => {
    const app = createApp(EmptyRoot)
    const kernel = {} as AppKernel
    provideAppKernel(app, kernel)

    expect(app.runWithContext(() => useAppKernel())).toBe(kernel)
  })

  it('fails closed when the application root omitted the kernel', () => {
    const app = createApp(EmptyRoot)
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => undefined)

    try {
      expect(() => app.runWithContext(() => useAppKernel()))
        .toThrow('Admin AppKernel has not been provided')
    } finally {
      warning.mockRestore()
    }
  })
})
