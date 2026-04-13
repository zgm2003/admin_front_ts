import { describe, expect, it } from 'vitest'

const {
  getGoodsStatusTagType,
  goodsMetaToText,
  goodsTextToMeta,
} = await import('../../../src/views/Main/ai/goods/composables/helpers')

describe('goods helpers', () => {
  it('maps goods status to stable tag types', () => {
    expect(getGoodsStatusTagType(1)).toBe('info')
    expect(getGoodsStatusTagType(2)).toBe('warning')
    expect(getGoodsStatusTagType(3)).toBe('primary')
    expect(getGoodsStatusTagType(7)).toBe('success')
    expect(getGoodsStatusTagType(8)).toBe('danger')
  })

  it('formats meta records into readable text lines', () => {
    const t = (key: string) => ({
      'goods.meta.price': 'Price',
      'goods.meta.brand': 'Brand',
    }[key] || key)

    expect(goodsMetaToText({
      price: '100',
      brand: 'Acme',
      ignored: '',
    }, t)).toBe('Price: 100\nBrand: Acme')
  })

  it('parses readable text back into meta records', () => {
    const t = (key: string) => ({
      'goods.meta.price': 'Price',
      'goods.meta.brand': 'Brand',
    }[key] || key)

    expect(goodsTextToMeta('Price: 100\nBrand: Acme\ncustom: value', t)).toEqual({
      price: '100',
      brand: 'Acme',
      custom: 'value',
    })
  })
})
