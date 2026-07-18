import { describe, expect, it, vi } from 'vitest'
import { createApiError } from '@/modules/http/error'
import {
  computeReconnectDelay,
  permanentAuthenticationError,
  ReconnectController,
  sameIdentity,
  shouldRestartAfterFlight,
  validIdentity,
  type RealtimeAvailability,
  type RealtimeClock,
  type RealtimeState,
} from '@/modules/realtime/policy'

describe('realtime policy', () => {
  it('rejects invalid attempts and jitter values', () => {
    for (const attempt of [-1, 0.5, Number.MAX_SAFE_INTEGER + 1]) {
      expect(() => computeReconnectDelay(attempt, () => 0)).toThrow(/attempt/i)
    }
    for (const jitter of [-0.1, 1.1, Number.NaN]) {
      expect(() => computeReconnectDelay(0, () => jitter)).toThrow(/jitter/i)
    }
  })

  it('classifies identity, authentication, and restart policy exactly', () => {
    const identity = { userId: 7, platform: 'admin' as const }
    expect(validIdentity(identity)).toBe(true)
    expect(validIdentity({ userId: 0, platform: 'admin' })).toBe(false)
    expect(validIdentity({ userId: 1.2, platform: 'admin' })).toBe(false)
    expect(validIdentity({ userId: 7, platform: 'app' } as never)).toBe(false)
    expect(sameIdentity(null, identity)).toBe(false)
    expect(sameIdentity({ userId: 8, platform: 'admin' }, identity)).toBe(false)
    expect(sameIdentity(identity, identity)).toBe(true)

    const permanent = createApiError({
      kind: 'authorization', retryable: false, messageKey: 'forbidden',
    })
    const retryable = createApiError({
      kind: 'authentication', retryable: true, messageKey: 'retry',
    })
    expect(permanentAuthenticationError(permanent)).toBe(true)
    expect(permanentAuthenticationError(retryable)).toBe(false)
    expect(permanentAuthenticationError(new Error('raw'))).toBe(false)

    expect(shouldRestartAfterFlight(identity, { kind: 'idle' }, true, false, false)).toBe(true)
    expect(shouldRestartAfterFlight(null, { kind: 'idle' }, true, false, false)).toBe(false)
    expect(shouldRestartAfterFlight(identity, { kind: 'failed', error: permanent }, true, false, false)).toBe(false)
    expect(shouldRestartAfterFlight(identity, { kind: 'idle' }, false, false, false)).toBe(false)
    expect(shouldRestartAfterFlight(identity, { kind: 'idle' }, true, true, false)).toBe(false)
    expect(shouldRestartAfterFlight(identity, { kind: 'idle' }, true, false, true)).toBe(false)
  })

  it('schedules, pauses, resumes, and disposes reconnect work', () => {
    let online = true
    let visible = true
    let availabilityListener = () => undefined
    let timerRun = () => undefined
    const clock: RealtimeClock = {
      setTimeout: vi.fn((run) => { timerRun = run; return 4 }),
      clearTimeout: vi.fn(),
    }
    const availability: RealtimeAvailability = {
      isOnline: () => online,
      isVisible: () => visible,
      subscribe: vi.fn((listener) => {
        availabilityListener = listener
        return vi.fn()
      }),
    }
    const states: RealtimeState[] = []
    const connect = vi.fn()
    const controller = new ReconnectController({
      clock,
      availability,
      random: () => 0,
      updateState: (state) => states.push(state),
      canConnect: () => true,
      connect,
    })

    controller.schedule()
    controller.schedule()
    expect(clock.setTimeout).toHaveBeenCalledTimes(1)
    expect(controller.hasTimer).toBe(true)

    online = false
    availabilityListener()
    expect(clock.clearTimeout).toHaveBeenCalledWith(4)
    expect(states.at(-1)).toMatchObject({ kind: 'waiting' })

    visible = false
    online = true
    controller.schedule()
    expect(clock.setTimeout).toHaveBeenCalledTimes(1)

    visible = true
    availabilityListener()
    expect(connect).toHaveBeenCalledTimes(1)

    controller.schedule()
    online = false
    timerRun()
    expect(connect).toHaveBeenCalledTimes(1)

    controller.resetFailures()
    controller.reset()
    controller.dispose()
  })

  it('fails closed when the jitter source is invalid', () => {
    const states: RealtimeState[] = []
    const controller = new ReconnectController({
      clock: { setTimeout: vi.fn(), clearTimeout: vi.fn() },
      availability: {
        isOnline: () => true,
        isVisible: () => true,
        subscribe: () => () => undefined,
      },
      random: () => Number.NaN,
      updateState: (state) => states.push(state),
      canConnect: () => true,
      connect: vi.fn(),
    })

    controller.schedule()
    expect(states.at(-1)?.kind).toBe('failed')
  })
})
