import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { buildViewModuleKey } from '../../src/router/view-registry'

const exists = (path: string) => existsSync(resolve(process.cwd(), path))
const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8')

describe('payment wallet billing redesign contract', () => {
  it('moves visible wallet pages under payment and keeps current-user wallet reachable', () => {
    expect(exists('src/views/Main/payment/ledger/index.vue')).toBe(true)
    expect(exists('src/views/Main/payment/wallets/index.vue')).toBe(true)
    expect(exists('src/views/Main/personal/wallet/index.vue')).toBe(true)
    expect(exists('src/views/Main/profile/wallet/index.vue')).toBe(true)

    expect(exists('src/views/Main/payment/orders/index.vue')).toBe(false)
    expect(exists('src/views/Main/wallet/ledger/index.vue')).toBe(false)
    expect(exists('src/views/Main/wallet/users/index.vue')).toBe(false)
    expect(exists('src/views/Main/wallet/transactions/index.vue')).toBe(false)
  })

  it('keeps migration seeded profile wallet component resolvable by runtime view registry', () => {
    const migration = read('../admin_back_go/database/migrations/20260530_payment_wallet_billing_redesign.sql')

    expect(migration).toContain("'/profile/wallet'")
    expect(migration).toContain("'profile/wallet'")

    const profileWalletModuleKey = buildViewModuleKey('profile/wallet')
    expect(profileWalletModuleKey).toBe('../views/Main/profile/wallet/index.vue')
    expect(exists(profileWalletModuleKey!.replace('../views/Main/', 'src/views/Main/'))).toBe(true)
  })

  it('links the header wallet shortcut to profile wallet and removes manual recharge sync', () => {
    const aside = read('src/views/Layout/components/Aside/index.vue')
    const recharge = read('src/views/Main/payment/recharge/composables/usePaymentRechargePage.ts')
    const rechargeApi = read('src/api/payment/recharges.ts')

    expect(aside).toContain('command="wallet"')
    expect(aside).toContain("router.push({ path: '/profile/wallet' })")
    expect(recharge).not.toContain('.sync(')
    expect(recharge).not.toContain('manualSync')
    expect(rechargeApi).not.toMatch(/\bsync\s*:/)
    expect(rechargeApi).not.toMatch(/\bclose\s*:/)
    expect(rechargeApi).not.toContain('/sync')
    expect(rechargeApi).not.toContain('/close')
    expect(rechargeApi).not.toContain('PaymentRechargeStatusResponse')
  })
})
