import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

function read(path: string) {
  return readFileSync(join(process.cwd(), path), 'utf8')
}

describe('wallet API contract', () => {
  it('keeps only current-user wallet reads and admin payment wallet reads', () => {
    const source = read('src/api/wallet/index.ts')

    expect(source).toContain('request.get<WalletSummaryResponse>(`${ADMIN_API_PREFIX}/wallet/summary`)')
    expect(source).toContain('request.get<PaginatedResponse<WalletTransactionItem>>(`${ADMIN_API_PREFIX}/wallet/transactions`')
    expect(source).toContain('request.get<WalletUsersPageInitResponse>(`${ADMIN_API_PREFIX}/payment/wallets/page-init`)')
    expect(source).toContain('request.get<PaginatedResponse<WalletUserItem>>(`${ADMIN_API_PREFIX}/payment/wallets`')
    expect(source).toContain('request.get<WalletLedgerPageInitResponse>(`${ADMIN_API_PREFIX}/payment/ledger/page-init`)')
    expect(source).toContain('request.get<PaginatedResponse<WalletTransactionItem>>(`${ADMIN_API_PREFIX}/payment/ledger`')
    expect(source).toContain('const walletUsersPageInit = () => request.get<WalletUsersPageInitResponse>')
    expect(source).toContain('const walletUsersList = (params: WalletUserListParams)')
    expect(source).toContain('const ledgerPageInit = () => request.get<WalletLedgerPageInitResponse>')
    expect(source).toContain('const ledgerList = (params: WalletTransactionListParams)')
    expect(source).toContain('walletUsersPageInit,')
    expect(source).toContain('walletUsersList,')
    expect(source).toContain('ledgerPageInit,')
    expect(source).toContain('ledgerList,')
    expect(source).toContain('usersInit: walletUsersPageInit')
    expect(source).toContain('users: walletUsersList')
    expect(source).toContain('ledgerInit: ledgerPageInit')
    expect(source).toContain('ledger: ledgerList')
    expect(source).toContain("export type WalletSourceType = 'recharge' | 'ai_generate' | 'ai_refund'")
    expect(source).not.toContain('/wallet/consumptions')
    expect(source).not.toContain('/wallet/users')
    expect(source).not.toContain('/wallet/ledger')
    expect(source).not.toContain('WalletConsume')
    expect(source).not.toContain('any')
    expect(source).not.toContain('Record<string, any>')
  })
})
