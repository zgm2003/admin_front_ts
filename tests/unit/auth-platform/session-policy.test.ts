import { describe, expect, it } from 'vitest'
import {
  maxSessionsForMode,
  sessionModeFromMaxSessions,
} from '@/views/Main/permission/authPlatform/helpers'

describe('auth platform session policy', () => {
  it.each([
    [0, 'unlimited'],
    [1, 'single'],
    [2, 'limited'],
    [5, 'limited'],
  ] as const)('maps max_sessions=%s to %s mode', (maxSessions, mode) => {
    expect(sessionModeFromMaxSessions(maxSessions)).toBe(mode)
  })

  it.each([
    ['unlimited', 9, 0],
    ['single', 9, 1],
    ['limited', 1, 2],
    ['limited', 5, 5],
    ['limited', 101, 100],
  ] as const)('maps %s mode with %s sessions to %s', (mode, value, expected) => {
    expect(maxSessionsForMode(mode, value)).toBe(expected)
  })
})
