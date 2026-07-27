import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'

afterEach(() => vi.unstubAllGlobals())

describe('AI paid request identity', () => {
  it('uses randomUUID when Web Crypto provides it', async () => {
    const randomUUID = vi.fn(() => '123e4567-e89b-42d3-a456-426614174000')
    vi.stubGlobal('crypto', { randomUUID, getRandomValues: vi.fn() })
    const { createAiRequestId } = await import('@/api/ai/request-id')

    expect(createAiRequestId()).toBe('123e4567-e89b-42d3-a456-426614174000')
    expect(randomUUID).toHaveBeenCalledOnce()
  })

  it('formats a UUID v4 using getRandomValues when randomUUID is unavailable', async () => {
    const getRandomValues = vi.fn((target: Uint8Array) => {
      target.set([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15])
      return target
    })
    vi.stubGlobal('crypto', { getRandomValues })
    const { createAiRequestId } = await import('@/api/ai/request-id')

    expect(createAiRequestId()).toBe('00010203-0405-4607-8809-0a0b0c0d0e0f')
    expect(getRandomValues).toHaveBeenCalledOnce()
  })

  it('fails visibly without Web Crypto and never falls back to Math.random', async () => {
    vi.stubGlobal('crypto', undefined)
    const { createAiRequestId } = await import('@/api/ai/request-id')

    expect(() => createAiRequestId()).toThrow(/Web Crypto.*request ID/i)
    const source = readFileSync(resolve(process.cwd(), 'src/api/ai/request-id.ts'), 'utf8')
    expect(source).not.toContain('Math.random')
  })
})
