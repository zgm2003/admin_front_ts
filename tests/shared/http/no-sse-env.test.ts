import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function readFrontendSource(relativePath: string) {
  return readFileSync(resolve(process.cwd(), relativePath), 'utf8')
}

describe('frontend realtime environment boundary', () => {
  it('does not expose VITE_SSE_URL as a supported frontend environment contract', () => {
    const files = [
      '.env.development',
      '.env.production',
      'src/vite-env.d.ts',
    ]

    for (const file of files) {
      expect(readFrontendSource(file), file).not.toContain('VITE_SSE_URL')
    }
  })
})
