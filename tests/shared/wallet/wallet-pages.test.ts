import { describe, expect, it } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

function read(path: string) {
  return readFileSync(join(process.cwd(), path), 'utf8')
}

describe('wallet pages', () => {
  it('adds the three wallet route pages as standard read-only table pages', () => {
    const pages = [
      'src/views/Main/wallet/transactions/index.vue',
      'src/views/Main/wallet/users/index.vue',
      'src/views/Main/wallet/ledger/index.vue',
    ]

    for (const page of pages) {
      expect(existsSync(join(process.cwd(), page))).toBe(true)
      const source = read(page)
      expect(source).toContain("import { Search } from '@/components/Search'")
      expect(source).toContain("import { AppTable }")
      expect(source).toContain('useTable<')
      expect(source).toContain('useI18n')
      expect(source).not.toContain('<el-table')
      expect(source).not.toContain(' as any')
    }
  })

  it('keeps wallet visible labels in zh-CN and en-US locale files', () => {
    const zh = read('src/i18n/locales/zh-CN.ts')
    const en = read('src/i18n/locales/en-US.ts')

    for (const key of ['wallet_center', 'wallet_transaction', 'wallet_manage', 'wallet_user', 'wallet_ledger']) {
      expect(zh).toContain(key)
      expect(en).toContain(key)
    }
    for (const key of ['summary', 'balance', 'totalRecharge', 'totalConsume', 'fundsDetail', 'userWallet', 'ledger']) {
      expect(zh).toContain(key)
      expect(en).toContain(key)
    }
  })
})
