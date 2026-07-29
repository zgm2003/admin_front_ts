import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import type { AiRunUsageItem } from '@/api/ai/runs'
import {
  formatRunAmount,
  groupRunUsageItems,
  runBillingSummary,
} from '@/views/Main/ai/runs/components/RunList/detail-dialog'
import {
  formatRunLatency,
} from '@/views/Main/ai/runs/components/RunList/presenters'

const usageItem = (
  category: AiRunUsageItem['category'],
  amount: string,
  attemptNo: number,
): AiRunUsageItem => ({
  amount,
  attempt_no: attemptNo,
  billable: true,
  category,
  quantity: 1,
  tier_key: '',
  unit: category === 'media' ? 'image' : 'token',
  unit_price: amount,
  unit_scale: 1,
})

describe('AI run billing presenters', () => {
  it('keeps run failure and settled billing as independent facts', () => {
    expect(runBillingSummary({
      status: 'failed',
      billing_status: 'settled',
      billing_reason: 'settled_complete_usage',
      held_amount: '9007199254740993.12345678',
      actual_amount: '0.00000001',
    })).toEqual({
      runStatus: 'failed',
      billingStatus: 'settled',
      billingReason: 'settled_complete_usage',
      heldAmount: '9007199254740993.12345678',
      actualAmount: '0.00000001',
    })
    expect(formatRunAmount('9007199254740993.12345678'))
      .toBe('¥9007199254740993.12345678')
  })

  it('classifies usage without recomputing backend-authored amounts', () => {
    const input = usageItem('input', '0.00000001', 1)
    const output = usageItem('output', '0.00000002', 1)
    const cacheRead = usageItem('cache_read', '0.00000003', 1)
    const cacheWrite = usageItem('cache_write', '0.00000004', 2)
    const media = usageItem('media', '12.3456789', 2)

    expect(groupRunUsageItems([media, cacheWrite, input, cacheRead, output]))
      .toEqual([
        { category: 'input', items: [input] },
        { category: 'output', items: [output] },
        { category: 'cache', items: [cacheWrite, cacheRead] },
        { category: 'media', items: [media] },
      ])
  })

	it('distinguishes missing latency from a measured zero', () => {
	  expect(formatRunLatency(null)).toBe('-')
	  expect(formatRunLatency(0)).toBe('0 ms')
	})

  it('renders provider request IDs only from the permission-protected detail contract', () => {
    const source = readFileSync(resolve(
      process.cwd(),
      'src/views/Main/ai/runs/components/RunList/RunDetailDialog.vue',
    ), 'utf8')

    for (const field of [
      'billing_status',
      'billing_reason',
      'held_amount',
      'actual_amount',
      'pricing',
      'usage_items',
      'provider_attempts',
      'provider_request_id',
    ]) {
      expect(source, field).toContain(field)
    }
	expect(source).not.toMatch(/api_key|credential|prepared_request_json|prepared_request\s*[:=]/)
  })
})
