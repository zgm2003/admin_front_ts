import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  isLocalViewKey,
  resolveViewComponent,
} from '@/router/view-registry'
import { localViewKeys, localViewLoaders } from '@/modules/routing/generated/local-views'

describe('generated view registry', () => {
  it('contains deterministic exact Main index.vue keys and loaders', () => {
    expect(localViewKeys).toContain('payment/config')
    expect(localViewKeys).toContain('system/queueMonitor')
    expect(localViewLoaders['payment/config']).toBeTypeOf('function')
    expect([...localViewKeys]).toEqual([...localViewKeys].sort((left, right) => left.localeCompare(right)))
  })

  it('resolves only exact allowlisted view keys without prefix or suffix fallback', () => {
    expect(isLocalViewKey('payment/config')).toBe(true)
    expect(resolveViewComponent('payment/config')).toBe(localViewLoaders['payment/config'])
    expect(resolveViewComponent('/payment/config')).toBeUndefined()
    expect(resolveViewComponent('unexpected/payment/config')).toBeUndefined()
    expect(resolveViewComponent('system/missing')).toBeUndefined()
  })

  it('does not use an unrestricted runtime glob in the Router', () => {
    const routerSource = readFileSync(resolve('src/router/index.ts'), 'utf8')
    const registrySource = readFileSync(resolve('src/router/view-registry.ts'), 'utf8')

    expect(`${routerSource}\n${registrySource}`).not.toContain('import.meta.glob')
  })
})
