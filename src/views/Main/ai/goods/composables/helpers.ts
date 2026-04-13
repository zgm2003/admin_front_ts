type Translate = (key: string) => string

const metaLabels: Record<string, string> = {
  price: 'goods.meta.price',
  originalPrice: 'goods.meta.originalPrice',
  sales: 'goods.meta.sales',
  brand: 'goods.meta.brand',
  shop: 'goods.meta.shop',
  specs: 'goods.meta.specs',
  description: 'goods.meta.description',
  reviews: 'goods.meta.reviews',
}

export function getGoodsStatusTagType(status: number): 'info' | 'warning' | 'success' | 'danger' | 'primary' {
  const map: Record<number, 'info' | 'warning' | 'success' | 'danger' | 'primary'> = {
    1: 'info',
    2: 'warning',
    3: 'primary',
    4: 'warning',
    5: 'primary',
    6: 'warning',
    7: 'success',
    8: 'danger',
  }

  return map[status] || 'info'
}

export function goodsMetaToText(meta: Record<string, unknown> | null | undefined, t: Translate): string {
  if (!meta || typeof meta !== 'object') return ''

  return Object.entries(meta)
    .filter(([, value]) => value && String(value).trim())
    .map(([key, value]) => {
      const label = metaLabels[key] ? t(metaLabels[key]) : key
      const normalizedValue = Array.isArray(value) ? value.join('、') : String(value)
      return `${label}: ${normalizedValue}`
    })
    .join('\n')
}

export function goodsTextToMeta(text: string, t: Translate): Record<string, string> {
  const result: Record<string, string> = {}
  const labelToKey: Record<string, string> = {}

  for (const [key, value] of Object.entries(metaLabels)) {
    labelToKey[t(value)] = key
    labelToKey[key] = key
  }

  for (const line of text.split('\n')) {
    const separatorIndex = line.indexOf(':')
    if (separatorIndex < 1) continue

    const rawLabel = line.slice(0, separatorIndex).trim()
    const rawValue = line.slice(separatorIndex + 1).trim()
    const key = labelToKey[rawLabel] || rawLabel

    if (rawValue) {
      result[key] = rawValue
    }
  }

  return result
}
