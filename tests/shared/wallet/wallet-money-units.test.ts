import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { WalletApi } from '@/api/wallet'
import { installApiClientHarness } from '../../helpers/api-client'

const cleanups: Array<() => void> = []
afterEach(() => cleanups.splice(0).forEach((cleanup) => cleanup()))

const readSource = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8')

describe('wallet canonical RMB strings', () => {
  it('returns canonical balance and AI debit strings without numeric conversion', async () => {
    const summary = {
      available_balance: '9007199254740993.12345678',
      balance: '9007199254740993.12345678',
      held_amount: '0',
      total_consume: '0.00000001',
      total_recharge: '9007199254740993.12345679',
    }
    const transaction = {
      account: 'wallet@example.com',
      amount: '0.00000001',
      balance_after: '9007199254740993.12345678',
      balance_before: '9007199254740993.12345679',
      created_at: '2026-07-27T00:00:00Z',
      direction: 'out',
      direction_text: 'Expense',
      id: 5,
      remark: 'Research agent / GPT 5.4',
      source_id: 77,
      source_type: 'ai_generate',
      source_type_text: 'AI Generate',
      transaction_no: 'TX-AI-77',
      user_id: 9,
      username: 'researcher',
    }
    const harness = installApiClientHarness(summary)
    cleanups.push(harness.uninstall)

    await expect(WalletApi.summary()).resolves.toEqual(summary)
    harness.respondWith({
      list: [transaction],
      page: { current_page: 1, page_size: 20, total: 1, total_page: 1 },
    })
    await expect(WalletApi.ledgerList({ current_page: 1, page_size: 20 }))
      .resolves.toMatchObject({ list: [transaction] })
  })

  it('binds wallet views to decimal fields and shows AI Run identity with the backend remark', () => {
    const wallets = readSource('src/views/Main/payment/wallets/index.vue')
    const ledger = readSource('src/views/Main/payment/ledger/index.vue')
    const personal = readSource('src/views/Main/personal/wallet/index.vue')
    const combined = `${wallets}\n${ledger}\n${personal}`

    expect(combined).not.toMatch(/(?:balance|amount|recharge|consume)_(?:cents|text)/)
    expect(combined).not.toMatch(/parseFloat|toFixed|Intl\.NumberFormat/)
    expect(combined).not.toContain("value: 'ai_refund'")
    expect(wallets).toContain('row.balance')
    expect(personal).toContain('summary.value.balance')
    for (const source of [ledger, personal]) {
      expect(source).toContain("row.source_type === 'ai_generate'")
      expect(source).toContain('Run #{{ row.source_id }}')
      expect(source).toContain('{{ row.remark }}')
      expect(source).not.toContain('AiRunApi')
    }
  })
})
