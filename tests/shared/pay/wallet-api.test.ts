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

    expect(source).toContain("import request, { legacyRequest } from '@/lib/http'")
    expect(source).toContain("import { ADMIN_API_PREFIX } from '@/lib/http/api-prefix'")
    expect(source).toContain('request.get<WalletPageInitResponse>(`${ADMIN_API_PREFIX}/wallets/page-init`)')
    expect(source).toContain('request.get<PaginatedResponse<WalletListItem>>(`${ADMIN_API_PREFIX}/wallets`')
    expect(source).toContain('request.get<PaginatedResponse<WalletTransactionItem>>(`${ADMIN_API_PREFIX}/wallet-transactions`')
    const legacyReadPrefix = '/api/admin/' + 'UserWallet/'
    expect(source).not.toContain(`${legacyReadPrefix}init`)
    expect(source).not.toContain(`${legacyReadPrefix}list`)
    expect(source).not.toContain(`${legacyReadPrefix}transactions`)
  })

  it('keeps wallet adjustment as the only explicit legacy adapter', () => {
    const source = readFrontendSource('src/api/pay/wallet.ts')

    expect(source).toContain('export const LegacyWalletAdjustmentApi')
    expect(source).toContain("legacyRequest.post<void>('/api/admin/UserWallet/adjust'")
    expect(source.match(/legacyRequest/g)?.length).toBe(2)
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
