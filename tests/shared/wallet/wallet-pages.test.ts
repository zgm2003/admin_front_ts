import { describe, expect, it } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

function read(path: string) {
  return readFileSync(join(process.cwd(), path), 'utf8')
}

describe('wallet pages', () => {
  it('uses the payment wallet pages and retires old left-side wallet pages', () => {
    const activePages = [
      'src/views/Main/payment/ledger/index.vue',
      'src/views/Main/payment/wallets/index.vue',
      'src/views/Main/personal/wallet/index.vue',
      'src/views/Main/profile/wallet/index.vue',
    ]
    const retiredPages = [
      'src/views/Main/wallet/transactions/index.vue',
      'src/views/Main/wallet/users/index.vue',
      'src/views/Main/wallet/ledger/index.vue',
    ]

    for (const page of activePages) {
      expect(existsSync(join(process.cwd(), page))).toBe(true)
    }
    for (const page of retiredPages) {
      expect(existsSync(join(process.cwd(), page))).toBe(false)
    }

    for (const page of activePages.slice(0, 3)) {
      const source = read(page)
      expect(source).toContain("import { Search } from '@/components/Search'")
      expect(source).toContain("import { AppTable }")
      expect(source).toContain('useTable<')
      expect(source).toContain('useI18n')
      expect(source).not.toContain('<el-table')
      expect(source).not.toContain(' as any')
    }

    const ledgerPage = read('src/views/Main/payment/ledger/index.vue')
    const walletsPage = read('src/views/Main/payment/wallets/index.vue')
    const personalWalletPage = read('src/views/Main/personal/wallet/index.vue')

    expect(ledgerPage).toContain('WalletApi.ledgerList')
    expect(ledgerPage).toContain('WalletApi.ledgerPageInit()')
    expect(ledgerPage).not.toContain('WalletApi.ledgerInit()')
    expect(walletsPage).toContain('WalletApi.walletUsersList')
    expect(walletsPage).toContain('WalletApi.walletUsersPageInit()')
    expect(walletsPage).not.toContain('WalletApi.usersInit()')
    expect(personalWalletPage).toContain('WalletApi.transactions')

    const profileWrapper = read('src/views/Main/profile/wallet/index.vue')
    expect(profileWrapper).toContain("import PersonalWallet from '@/views/Main/personal/wallet/index.vue'")
  })

  it('keeps only active wallet/payment labels in locale files', () => {
    const zh = read('src/i18n/locales/zh-CN.ts')
    const en = read('src/i18n/locales/en-US.ts')

    for (const key of ['payment_ledger', 'payment_wallets', 'myWallet']) {
      expect(zh).toContain(key)
      expect(en).toContain(key)
    }
    for (const key of ['summary', 'balance', 'totalRecharge', 'totalConsume', 'userWallet', 'ledger', 'sourceAiGenerate', 'sourceAiRefund']) {
      expect(zh).toContain(key)
      expect(en).toContain(key)
    }
    expect(zh).not.toContain("payment_order: '支付订单'")
    expect(en).not.toContain("payment_order: 'Payment Orders'")
  })
})
