import { describe, expect, it } from 'vitest'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'

const { default: viteConfig } = await import('../../../vite.config.ts')

describe('vite config', () => {
  it('only warms up client files that exist', () => {
    const clientFiles = viteConfig.server?.warmup?.clientFiles ?? []

    expect(clientFiles.length).toBeGreaterThan(0)

    for (const file of clientFiles) {
      expect(existsSync(resolve(process.cwd(), file))).toBe(true)
    }
  })
})
