import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import enUS from '@/i18n/locales/en-US/payment'
import zhCN from '@/i18n/locales/zh-CN/payment'

const readSource = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8')

describe('wallet redemption UI boundaries', () => {
  it('keeps the profile wallet as a pure personal-wallet wrapper', () => {
    const source = readSource('src/views/Main/profile/wallet/index.vue')

    expect(source).toBe(`<script setup lang="ts">
import PersonalWallet from '@/views/Main/personal/wallet/index.vue'
</script>

<template>
  <PersonalWallet />
</template>
`)
  })

  it('keeps the full code in dialog memory and sends it through the redemption body only', () => {
    const source = readSource(
      'src/views/Main/personal/wallet/components/RedeemCodeDialog.vue',
    )

    expect(source).toContain('WalletApi.redeem({ code: code.value.trim() })')
    expect(source.match(/WalletApi\.redeem/g)).toHaveLength(1)
    expect(source).not.toMatch(/useRoute|useRouter|document\.title|console\.|use[A-Za-z]+Store/)
    expect(source).not.toMatch(/emit\([^\n]+code\.value/)
  })

  it('provides generated-compatible bilingual copy without disclosing code state', () => {
    expect(zhCN.wallet.sourceRedeemCode).toBe('兑换码充值')
    expect(enUS.wallet.sourceRedeemCode).toBe('Redeem code recharge')
    expect(zhCN.wallet.redeem.errors).toEqual({
      unavailable: '兑换码不可用或格式错误',
      tooFrequent: '尝试过于频繁，请稍后再试',
      serviceUnavailable: '兑换服务暂不可用，请稍后再试',
      resultUncertain: '兑换结果暂未确认，请稍后使用同一兑换码重试',
    })
    expect(JSON.stringify(zhCN.wallet.redeem.errors)).not.toMatch(/未知|过期|作废|他人|已使用/)
  })
})
