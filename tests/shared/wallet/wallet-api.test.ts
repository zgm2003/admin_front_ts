import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

function read(path: string) {
  return readFileSync(join(process.cwd(), path), 'utf8')
}

describe('wallet API contract', () => {
  it('uses REST wallet endpoints with typed request calls', () => {
    const source = read('src/api/wallet/index.ts')

    expect(source).toContain('request.get<WalletSummaryResponse>(`${ADMIN_API_PREFIX}/wallet/summary`)')
    expect(source).toContain('request.get<PaginatedResponse<WalletTransactionItem>>(`${ADMIN_API_PREFIX}/wallet/transactions`')
    expect(source).toContain('request.post<WalletConsumeResponse, WalletConsumePayload>(`${ADMIN_API_PREFIX}/wallet/consumptions`, payload)')
    expect(source).toContain('request.get<WalletUsersPageInitResponse>(`${ADMIN_API_PREFIX}/wallet/users/page-init`)')
    expect(source).toContain('request.get<PaginatedResponse<WalletUserItem>>(`${ADMIN_API_PREFIX}/wallet/users`')
    expect(source).toContain('request.get<WalletLedgerPageInitResponse>(`${ADMIN_API_PREFIX}/wallet/ledger/page-init`)')
    expect(source).toContain('request.get<PaginatedResponse<WalletTransactionItem>>(`${ADMIN_API_PREFIX}/wallet/ledger`')
    expect(source).not.toContain('any')
    expect(source).not.toContain('Record<string, any>')
  })
})
