import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = process.cwd()
const read = (path: string) => readFileSync(resolve(root, path), 'utf8')
const forbiddenLooseTypePattern = /\bany\b|as any|Record<string, any>/
const retiredPaymentSourceTerms = [
  '@/api/' + 'pay',
  'views/Main/' + 'pay',
  'views/Main/' + 'wal' + 'let',
  'Pay' + 'Enum',
  'recharge-' + 'orders',
  'pay-' + 'orders',
  'wal' + 'let',
]

function listSourceFiles(dir: string): string[] {
  const absDir = resolve(root, dir)
  if (!existsSync(absDir)) {
    return []
  }

  return readdirSync(absDir).flatMap((name) => {
    const absPath = resolve(absDir, name)
    const relPath = `${dir}/${name}`
    return statSync(absPath).isDirectory() ? listSourceFiles(relPath) : [relPath]
  })
}

function listPaymentImplementationFiles(): string[] {
  return [
    ...listSourceFiles('src/api/payment'),
    ...listSourceFiles('src/views/Main/payment'),
  ].filter((path) => /\.(ts|vue)$/.test(path))
}

describe('payment views', () => {
  it('keeps route views thin and uses new api clients', () => {
    for (const path of [
      'src/views/Main/payment/channel/index.vue',
      'src/views/Main/payment/order/index.vue',
      'src/views/Main/payment/event/index.vue',
    ]) {
      expect(existsSync(resolve(root, path))).toBe(true)
      const source = read(path)
      expect(source).toContain('<script setup lang="ts">')
      expect(source).not.toContain('@/api/' + 'pay/')
      expect(source).not.toContain('legacy' + 'Request')
    }
  })

  it('removes retired fund and pay views', () => {
    expect(existsSync(resolve(root, 'src/views/Main/' + 'wal' + 'let/index.vue'))).toBe(false)
    expect(existsSync(resolve(root, 'src/views/Main/' + 'pay/order/index.vue'))).toBe(false)
  })

  it('keeps payment implementation free of loose types', () => {
    for (const path of listPaymentImplementationFiles()) {
      expect(read(path), path).not.toMatch(forbiddenLooseTypePattern)
    }
  })

  it('removes active old pay and fund references from source and tests', () => {
    for (const path of [...listSourceFiles('src'), ...listSourceFiles('tests')]) {
      if (!/\.(ts|vue)$/.test(path)) {
        continue
      }

      const source = read(path).replaceAll('payment', '')
      for (const term of retiredPaymentSourceTerms) {
        expect(source, `${path} contains retired payment source term: ${term}`).not.toContain(term)
      }
    }
  })
})
