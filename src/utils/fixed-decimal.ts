interface ParsedDecimal {
  coefficient: bigint
  scale: number
}

function parseUnsignedDecimal(value: string): ParsedDecimal {
  const normalized = value.trim()
  const match = /^(\d+)(?:\.(\d+))?$/.exec(normalized)
  if (!match) throw new Error(`invalid unsigned decimal: ${value}`)

  const integer = match[1] ?? '0'
  const fraction = match[2] ?? ''
  return {
    coefficient: BigInt(`${integer}${fraction}`),
    scale: fraction.length,
  }
}

function formatDecimal(coefficient: bigint, scale: number): string {
  if (coefficient === 0n) return '0'
  if (scale === 0) return coefficient.toString()

  const digits = coefficient.toString().padStart(scale + 1, '0')
  const splitAt = digits.length - scale
  const integer = digits.slice(0, splitAt)
  const fraction = digits.slice(splitAt).replace(/0+$/, '')
  return fraction ? `${integer}.${fraction}` : integer
}

export function multiplyDecimalStrings(left: string, right: string): string {
  const first = parseUnsignedDecimal(left)
  const second = parseUnsignedDecimal(right)
  return formatDecimal(
    first.coefficient * second.coefficient,
    first.scale + second.scale,
  )
}
