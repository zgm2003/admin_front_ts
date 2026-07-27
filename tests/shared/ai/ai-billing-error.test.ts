import { describe, expect, it } from 'vitest'
import {
  insufficientBalanceFromApiError,
  insufficientBalanceFromFailedEvent,
} from '@/api/ai/billing-error'
import { renderAiBillingActions } from '@/features/ai-billing/notification'
import { apiErrorFromEnvelope } from '@/modules/http/error'

describe('AI insufficient-balance machine contract', () => {
  it('preserves typed HTTP error data and returns both backend-authored actions', () => {
    const data = { wallet_path: '/profile/wallet', recharge_path: '/payment/recharge' }
    const error = apiErrorFromEnvelope({
      code: 402,
      data,
      msg: 'insufficient balance',
      error: {
        category: 'conflict',
        code: 'ai.billing.insufficient_balance',
        retryable: false,
      },
    }, 402)

    expect(error.data).toEqual(data)
    expect(insufficientBalanceFromApiError(error)).toEqual({
      walletPath: '/profile/wallet',
      rechargePath: '/payment/recharge',
    })
  })

  it('does not classify by message or accept an incomplete path pair', () => {
    const sameMessage = apiErrorFromEnvelope({
      code: 409,
      data: { wallet_path: '/profile/wallet', recharge_path: '/payment/recharge' },
      msg: 'ai.billing.insufficient_balance',
      error: { category: 'conflict', code: 'ai.provider.failed', retryable: false },
    })
    const missingPath = apiErrorFromEnvelope({
      code: 402,
      data: { wallet_path: '/profile/wallet' },
      msg: 'insufficient balance',
      error: { category: 'conflict', code: 'ai.billing.insufficient_balance', retryable: false },
    })
    const undocumentedPath = apiErrorFromEnvelope({
      code: 402,
      data: { wallet_path: '/guessed/wallet', recharge_path: '/guessed/recharge' },
      msg: 'insufficient balance',
      error: { category: 'conflict', code: 'ai.billing.insufficient_balance', retryable: false },
    })

    expect(insufficientBalanceFromApiError(sameMessage)).toBeNull()
    expect(insufficientBalanceFromApiError(missingPath)).toBeNull()
    expect(insufficientBalanceFromApiError(undocumentedPath)).toBeNull()
  })

  it('uses only the durable failed-event code and its two paths', () => {
    expect(insufficientBalanceFromFailedEvent({
      conversation_id: 7,
      request_id: 'request-7',
      msg: 'insufficient balance',
      error_code: 'ai.billing.insufficient_balance',
      wallet_path: '/profile/wallet',
      recharge_path: '/payment/recharge',
    })).toEqual({ walletPath: '/profile/wallet', rechargePath: '/payment/recharge' })

    expect(insufficientBalanceFromFailedEvent({
      conversation_id: 7,
      request_id: 'request-7',
      msg: 'ai.billing.insufficient_balance',
      error_code: 'ai.provider.failed',
      wallet_path: null,
      recharge_path: null,
    })).toBeNull()
  })

  it('renders only the two backend-authored wallet actions', () => {
    const node = renderAiBillingActions(
      'insufficient balance',
      { walletPath: '/profile/wallet', rechargePath: '/payment/recharge' },
      { walletLabel: 'Wallet', rechargeLabel: 'Recharge' },
    )
    expect(node.children).toHaveLength(3)
    expect(node.children[1]).toMatchObject({ props: { href: '/profile/wallet' } })
    expect(node.children[2]).toMatchObject({ props: { href: '/payment/recharge' } })
  })
})
