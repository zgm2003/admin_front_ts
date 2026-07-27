import { describe, expect, it } from 'vitest'
import { multiplyDecimalStrings } from '@/utils/fixed-decimal'

describe('fixed decimal model price calculations', () => {
  it('multiplies prices and agent multipliers without IEEE-754 conversion', () => {
    expect(multiplyDecimalStrings('2.5', '1.125')).toBe('2.8125')
    expect(multiplyDecimalStrings('9007199254740993', '1.1')).toBe('9907919180215092.3')
    expect(multiplyDecimalStrings('0.0000001', '0.3')).toBe('0.00000003')
  })

  it('normalizes insignificant zeroes and rejects non-decimal inputs', () => {
    expect(multiplyDecimalStrings(' 1.2300 ', '2.00')).toBe('2.46')
    expect(multiplyDecimalStrings('0', '999.5')).toBe('0')
    expect(() => multiplyDecimalStrings('1e3', '2')).toThrow(/decimal/i)
    expect(() => multiplyDecimalStrings('-1', '2')).toThrow(/decimal/i)
  })
})
