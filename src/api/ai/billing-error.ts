import type { AIFailedPayload } from '@/modules/realtime/protocol'
import { isApiError } from '@/modules/http/error'

const INSUFFICIENT_BALANCE = 'ai.billing.insufficient_balance'
const WALLET_PATH = '/profile/wallet'
const RECHARGE_PATH = '/payment/recharge'

export interface AiInsufficientBalanceActions {
  readonly walletPath: string
  readonly rechargePath: string
}

function actionsFromData(data: unknown): AiInsufficientBalanceActions | null {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null
  const walletPath = Reflect.get(data, 'wallet_path')
  const rechargePath = Reflect.get(data, 'recharge_path')
  if (walletPath !== WALLET_PATH || rechargePath !== RECHARGE_PATH) return null
  return { walletPath, rechargePath }
}

export function insufficientBalanceFromApiError(error: unknown): AiInsufficientBalanceActions | null {
  if (!isApiError(error) || error.code !== INSUFFICIENT_BALANCE) return null
  return actionsFromData(error.data)
}

export function insufficientBalanceFromFailedEvent(payload: AIFailedPayload): AiInsufficientBalanceActions | null {
  if (payload.error_code !== INSUFFICIENT_BALANCE) return null
  return actionsFromData({
    wallet_path: payload.wallet_path,
    recharge_path: payload.recharge_path,
  })
}
