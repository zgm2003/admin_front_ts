import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { isToday } from '@/utils/date'
import { findTodayConversation } from '../useConversations'
import type { Conversation } from '../types'

// ============================================================
// Helpers: date generators
// ============================================================

/** Generate a Date object that falls on today (local time) */
function todayDateArb(): fc.Arbitrary<Date> {
  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
  return fc.integer({ min: startOfDay.getTime(), max: endOfDay.getTime() }).map(ts => new Date(ts))
}

/** Generate a Date object that is NOT today (local time) — at least 1 day away */
function notTodayDateArb(): fc.Arbitrary<Date> {
  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)

  // Pick from either past (up to 2 years ago) or future (up to 2 years ahead)
  const pastMin = startOfDay.getTime() - 2 * 365 * 24 * 60 * 60 * 1000
  const pastMax = startOfDay.getTime() - 1 // 1ms before today
  const futureMin = endOfDay.getTime() + 1 // 1ms after today
  const futureMax = endOfDay.getTime() + 2 * 365 * 24 * 60 * 60 * 1000

  return fc.oneof(
    fc.integer({ min: pastMin, max: pastMax }).map(ts => new Date(ts)),
    fc.integer({ min: futureMin, max: futureMax }).map(ts => new Date(ts)),
  )
}

/** Format a Date to ISO string (parseable by `new Date()`) */
function toDateStr(d: Date): string {
  return d.toISOString()
}

/** Build a minimal Conversation object for testing */
function makeConversation(overrides: Partial<Conversation> & { id: number }): Conversation {
  return {
    title: `conv-${overrides.id}`,
    last_message_at: '',
    ...overrides,
  }
}

/** Arbitrary for invalid / unparseable date strings */
function invalidDateStrArb(): fc.Arbitrary<string> {
  return fc.oneof(
    fc.constant(''),
    fc.constant('not-a-date'),
    fc.constant('abc123'),
    fc.constant('2024-13-45'), // invalid month/day
    fc.constant('hello world'),
    fc.constant('foo-bar-baz'),
    fc.constant('99/99/9999'),
    fc.string({ minLength: 1, maxLength: 20 }).filter(s => {
      const d = new Date(s)
      return isNaN(d.getTime())
    }),
  )
}

// ============================================================
// Property 1: isToday 日期判断正确性
// **Validates: Requirements 4.1, 4.3**
// ============================================================

describe('Property 1: isToday 日期判断正确性', () => {
  /**
   * **Validates: Requirements 4.1, 4.3**
   *
   * For any date string `dateStr`, `isToday(dateStr)` returns `true`
   * if and only if `new Date(dateStr)` is a valid date AND its year,
   * month, day match `new Date()`.
   * For empty strings or unparseable strings, `isToday` returns `false`.
   */

  it('returns true for any date that falls on today', () => {
    fc.assert(
      fc.property(todayDateArb(), (todayDate) => {
        const dateStr = toDateStr(todayDate)
        expect(isToday(dateStr)).toBe(true)
      }),
      { numRuns: 100 },
    )
  })

  it('returns false for any date that does NOT fall on today', () => {
    fc.assert(
      fc.property(notTodayDateArb(), (otherDate) => {
        const dateStr = toDateStr(otherDate)
        expect(isToday(dateStr)).toBe(false)
      }),
      { numRuns: 100 },
    )
  })

  it('returns false for empty or invalid date strings', () => {
    fc.assert(
      fc.property(invalidDateStrArb(), (badStr) => {
        expect(isToday(badStr)).toBe(false)
      }),
      { numRuns: 100 },
    )
  })

  it('is consistent with manual year/month/day comparison for any valid date', () => {
    // Generate arbitrary timestamps within a wide range (±5 years)
    const now = new Date()
    const fiveYearsMs = 5 * 365 * 24 * 60 * 60 * 1000
    const tsArb = fc.integer({
      min: now.getTime() - fiveYearsMs,
      max: now.getTime() + fiveYearsMs,
    })

    fc.assert(
      fc.property(tsArb, (ts) => {
        const d = new Date(ts)
        const dateStr = d.toISOString()
        const today = new Date()
        const expected =
          d.getFullYear() === today.getFullYear()
          && d.getMonth() === today.getMonth()
          && d.getDate() === today.getDate()
        expect(isToday(dateStr)).toBe(expected)
      }),
      { numRuns: 100 },
    )
  })
})

// ============================================================
// Property 2: findTodayConversation 查找正确性
// **Validates: Requirements 1.2, 1.3, 4.2**
// ============================================================

describe('Property 2: findTodayConversation 查找正确性', () => {
  /**
   * **Validates: Requirements 1.2, 1.3, 4.2**
   *
   * For any list of conversations sorted by `last_message_at` descending:
   * - If the list contains a conversation with `last_message_at` today,
   *   `findTodayConversation` returns the first match (newest today conversation)
   * - If no today conversation exists, returns `null`
   */

  /** Arbitrary: a sorted (desc) list of conversations with NO today entries */
  function noTodayConversationsArb(): fc.Arbitrary<Conversation[]> {
    return fc
      .array(notTodayDateArb(), { minLength: 0, maxLength: 15 })
      .map(dates => {
        // Sort descending
        dates.sort((a, b) => b.getTime() - a.getTime())
        return dates.map((d, i) =>
          makeConversation({ id: i + 1, last_message_at: toDateStr(d) }),
        )
      })
  }

  /** Arbitrary: a sorted (desc) list with at least one today entry */
  function withTodayConversationsArb(): fc.Arbitrary<{
    conversations: Conversation[]
    expectedFirstTodayId: number
  }> {
    return fc
      .tuple(
        // At least 1 today date
        fc.array(todayDateArb(), { minLength: 1, maxLength: 8 }),
        // 0+ non-today dates
        fc.array(notTodayDateArb(), { minLength: 0, maxLength: 8 }),
      )
      .map(([todayDates, otherDates]) => {
        // Combine all dates with ids, then sort descending
        const allEntries = [
          ...todayDates.map((d, i) => ({ date: d, id: i + 1, isToday: true })),
          ...otherDates.map((d, i) => ({ date: d, id: todayDates.length + i + 1, isToday: false })),
        ]
        allEntries.sort((a, b) => b.date.getTime() - a.date.getTime())

        const conversations = allEntries.map(e =>
          makeConversation({ id: e.id, last_message_at: toDateStr(e.date) }),
        )

        // The first today entry in the sorted list is the expected result
        const firstToday = allEntries.find(e => e.isToday)!
        return { conversations, expectedFirstTodayId: firstToday.id }
      })
  }

  it('returns null when no conversations have last_message_at today', () => {
    fc.assert(
      fc.property(noTodayConversationsArb(), (conversations) => {
        expect(findTodayConversation(conversations)).toBeNull()
      }),
      { numRuns: 100 },
    )
  })

  it('returns the first today conversation from a desc-sorted list', () => {
    fc.assert(
      fc.property(withTodayConversationsArb(), ({ conversations, expectedFirstTodayId }) => {
        const result = findTodayConversation(conversations)
        expect(result).not.toBeNull()
        expect(result!.id).toBe(expectedFirstTodayId)
      }),
      { numRuns: 100 },
    )
  })

  it('returns null for an empty list', () => {
    expect(findTodayConversation([])).toBeNull()
  })

  it('returns null when all conversations have empty or invalid last_message_at', () => {
    fc.assert(
      fc.property(
        fc.array(invalidDateStrArb(), { minLength: 1, maxLength: 10 }),
        (badDates) => {
          const conversations = badDates.map((d, i) =>
            makeConversation({ id: i + 1, last_message_at: d }),
          )
          expect(findTodayConversation(conversations)).toBeNull()
        },
      ),
      { numRuns: 100 },
    )
  })
})

// ============================================================
// Unit Tests: isToday 边界用例
// Requirements: 4.1, 4.3
// ============================================================

describe('Unit Tests: isToday', () => {
  it('returns false for empty string', () => {
    expect(isToday('')).toBe(false)
  })

  it('returns false for invalid date string', () => {
    expect(isToday('not-a-date')).toBe(false)
  })

  it('returns false for yesterday 23:59:59', () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    yesterday.setHours(23, 59, 59, 0)
    // Use local date string format to avoid timezone issues with ISO
    const dateStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}T23:59:59`
    expect(isToday(dateStr)).toBe(false)
  })

  it('returns true for today 00:00:00', () => {
    const today = new Date()
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}T00:00:00`
    expect(isToday(dateStr)).toBe(true)
  })

  it('returns true for today 23:59:59', () => {
    const today = new Date()
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}T23:59:59`
    expect(isToday(dateStr)).toBe(true)
  })
})

// ============================================================
// Unit Tests: findTodayConversation 边界用例
// Requirements: 1.2, 1.3
// ============================================================

describe('Unit Tests: findTodayConversation', () => {
  /** Helper: format a Date to a local datetime string (no timezone offset issues) */
  function toLocalDateStr(d: Date): string {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const h = String(d.getHours()).padStart(2, '0')
    const min = String(d.getMinutes()).padStart(2, '0')
    const s = String(d.getSeconds()).padStart(2, '0')
    return `${y}-${m}-${day}T${h}:${min}:${s}`
  }

  it('returns null for an empty list', () => {
    expect(findTodayConversation([])).toBeNull()
  })

  it('returns null when all conversations are non-today', () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const twoDaysAgo = new Date()
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)

    const conversations: Conversation[] = [
      makeConversation({ id: 1, last_message_at: toLocalDateStr(yesterday) }),
      makeConversation({ id: 2, last_message_at: toLocalDateStr(twoDaysAgo) }),
    ]
    expect(findTodayConversation(conversations)).toBeNull()
  })

  it('returns the single today conversation', () => {
    const today = new Date()
    today.setHours(10, 30, 0, 0)
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)

    const conversations: Conversation[] = [
      makeConversation({ id: 1, last_message_at: toLocalDateStr(today) }),
      makeConversation({ id: 2, last_message_at: toLocalDateStr(yesterday) }),
    ]
    const result = findTodayConversation(conversations)
    expect(result).not.toBeNull()
    expect(result!.id).toBe(1)
  })

  it('returns the first (newest) today conversation when multiple exist (desc sorted)', () => {
    const todayLater = new Date()
    todayLater.setHours(15, 0, 0, 0)
    const todayEarlier = new Date()
    todayEarlier.setHours(9, 0, 0, 0)

    // Desc sorted: todayLater first
    const conversations: Conversation[] = [
      makeConversation({ id: 1, last_message_at: toLocalDateStr(todayLater) }),
      makeConversation({ id: 2, last_message_at: toLocalDateStr(todayEarlier) }),
    ]
    const result = findTodayConversation(conversations)
    expect(result).not.toBeNull()
    expect(result!.id).toBe(1)
  })

  it('returns the correct today conversation from mixed dates', () => {
    const twoDaysAgo = new Date()
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const todayMorning = new Date()
    todayMorning.setHours(8, 0, 0, 0)
    const lastWeek = new Date()
    lastWeek.setDate(lastWeek.getDate() - 7)

    // Desc sorted: yesterday is more recent than todayMorning in terms of absolute time?
    // No — we sort by last_message_at desc. Today 08:00 > yesterday any time.
    const conversations: Conversation[] = [
      makeConversation({ id: 1, last_message_at: toLocalDateStr(todayMorning) }),
      makeConversation({ id: 2, last_message_at: toLocalDateStr(yesterday) }),
      makeConversation({ id: 3, last_message_at: toLocalDateStr(twoDaysAgo) }),
      makeConversation({ id: 4, last_message_at: toLocalDateStr(lastWeek) }),
    ]
    const result = findTodayConversation(conversations)
    expect(result).not.toBeNull()
    expect(result!.id).toBe(1)
  })

  it('returns null when conversations have empty last_message_at', () => {
    const conversations: Conversation[] = [
      makeConversation({ id: 1, last_message_at: '' }),
      makeConversation({ id: 2, last_message_at: '' }),
    ]
    expect(findTodayConversation(conversations)).toBeNull()
  })
})
