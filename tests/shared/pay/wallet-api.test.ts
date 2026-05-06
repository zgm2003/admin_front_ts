import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function readFrontendSource(relativePath: string) {
  return readFileSync(resolve(process.cwd(), relativePath), 'utf8')
}

const forbiddenLooseTypePattern = new RegExp(`\\b${'an'}${'y'}\\b|as ${'an'}${'y'}|Record<string, ${'an'}${'y'}>`)

describe('wallet admin api REST contract', () => {
  it('uses Go REST endpoints for wallet read-only APIs', () => {
    const source = readFrontendSource('src/api/pay/wallet.ts')

    expect(source).toContain("import request from '@/lib/http'")
    expect(source).toContain("import { ADMIN_API_PREFIX } from '@/lib/http/api-prefix'")
    expect(source).toContain('request.get<WalletPageInitResponse>(`${ADMIN_API_PREFIX}/wallets/page-init`)')
    expect(source).toContain('request.get<PaginatedResponse<WalletListItem>>(`${ADMIN_API_PREFIX}/wallets`')
    expect(source).toContain('request.get<PaginatedResponse<WalletTransactionItem>>(`${ADMIN_API_PREFIX}/wallet-transactions`')
    const legacyReadPrefix = '/api/admin/' + 'UserWallet/'
    expect(source).not.toContain(`${legacyReadPrefix}init`)
    expect(source).not.toContain(`${legacyReadPrefix}list`)
    expect(source).not.toContain(`${legacyReadPrefix}transactions`)
  })

  it('uses Go REST endpoint for wallet adjustment writes', () => {
    const source = readFrontendSource('src/api/pay/wallet.ts')

    expect(source).toContain('export interface WalletAdjustmentCreatePayload')
    expect(source).toContain('export interface WalletAdjustmentCreateResponse')
    expect(source).toContain('export const WalletAdjustmentApi')
    expect(source).toContain('request.post<WalletAdjustmentCreateResponse, WalletAdjustmentCreatePayload>(`${ADMIN_API_PREFIX}/wallet-adjustments`')
    expect(source).not.toContain('Legacy' + 'WalletAdjustmentApi')
    expect(source).not.toContain('/api/admin/' + 'UserWallet' + '/adjust')
    expect(source).not.toContain('legacy' + 'Request')
  })

  it('generates a safe idempotency key in the wallet adjustment dialog', () => {
    const source = readFrontendSource('src/views/Main/pay/wallet/components/WalletAdjustDialog.vue')

    expect(source).toContain("import { WalletAdjustmentApi } from '@/api/pay/wallet'")
    expect(source).toContain('globalThis.crypto?.randomUUID')
    expect(source).toContain('idempotency_key: idempotencyKey')
    expect(source).toContain('WalletAdjustmentApi.create')
    expect(source).not.toContain('Legacy' + 'WalletAdjustmentApi')
  })

  it('keeps touched wallet files strict without loose TypeScript types', () => {
    const files = [
      'src/api/pay/wallet.ts',
      'src/views/Main/pay/wallet/index.vue',
      'src/views/Main/pay/wallet/components/WalletTransactionDialog.vue',
      'src/views/Main/pay/wallet/components/WalletAdjustDialog.vue',
      'tests/shared/pay/wallet-api.test.ts',
    ]

    for (const file of files) {
      expect(readFrontendSource(file), file).not.toMatch(forbiddenLooseTypePattern)
    }
  })
})
