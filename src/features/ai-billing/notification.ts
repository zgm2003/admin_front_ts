import { h, type VNode } from 'vue'
import type { AiInsufficientBalanceActions } from '@/api/ai/billing-error'

export function renderAiBillingActions(
  message: string,
  actions: AiInsufficientBalanceActions,
  labels: { walletLabel: string; rechargeLabel: string },
): VNode {
  return h('div', { class: 'ai-billing-error' }, [
    h('p', { class: 'ai-billing-error__message' }, message),
    h('a', { href: actions.walletPath, class: 'ai-billing-error__action' }, labels.walletLabel),
    h('a', { href: actions.rechargePath, class: 'ai-billing-error__action' }, labels.rechargeLabel),
  ])
}
