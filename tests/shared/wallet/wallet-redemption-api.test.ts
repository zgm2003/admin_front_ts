import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { WalletApi } from '@/api/wallet'
import { installApiClientHarness } from '../../helpers/api-client'

const cleanups: Array<() => void> = []
afterEach(() => cleanups.splice(0).forEach((cleanup) => cleanup()))

describe('wallet redemption API behavior', () => {
  it('sends the full redeem code only in the redemption request body', async () => {
    const harness = installApiClientHarness({
      amount: '10.00',
      replayed: false,
      transaction: {
        amount_cents: 1000,
        amount_text: '10.00',
        balance_after_cents: 2500,
        balance_after_text: '25.00',
        balance_before_cents: 1500,
        balance_before_text: '15.00',
        created_at: '2026-07-25T00:00:00Z',
        direction: 'income',
        direction_text: 'Income',
        source_type: 'redeem_code',
        source_type_text: 'Redeem code',
        transaction_no: 'TX-20260725',
      },
      wallet: {
        balance_cents: 2500,
        balance_text: '25.00',
        total_consume_cents: 0,
        total_consume_text: '0.00',
        total_recharge_cents: 2500,
        total_recharge_text: '25.00',
      },
    })
    cleanups.push(harness.uninstall)

    await WalletApi.redeem({ code: 'FULL-SECRET-CODE' })

    expect(harness.requests).toHaveLength(1)
    const [{ method, path, query, body }] = harness.requests
    expect({ method, path, query, body }).toEqual({
      method: 'POST',
      path: '/api/admin/v1/wallet/redemptions',
      query: undefined,
      body: { code: 'FULL-SECRET-CODE' },
    })
    expect(path).not.toContain('FULL-SECRET-CODE')
    expect(query).toBeUndefined()
  })

  it('binds redemption to its generated operation ID without a handwritten URL', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/api/wallet/index.ts'), 'utf8')

    expect(source).toContain('adminOperations.post_api_admin_v1_wallet_redemptions')
    expect(source).not.toContain('/api/admin/v1/wallet/redemptions')
  })
})
