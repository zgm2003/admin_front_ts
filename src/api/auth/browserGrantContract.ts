export interface RealtimeTicketResponse {
  ticket: string
  expires_in: number
}

export interface QueueMonitorGrantResponse {
  expires_in: number
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function hasExactKeys(value: Record<string, unknown>, keys: string[]): boolean {
  const actual = Object.keys(value).sort()
  const expected = [...keys].sort()
  return actual.length === expected.length && actual.every((key, index) => key === expected[index])
}

export function parseRealtimeTicketResponse(value: unknown): RealtimeTicketResponse {
  if (
    !isRecord(value)
    || !hasExactKeys(value, ['ticket', 'expires_in'])
    || typeof value.ticket !== 'string'
    || value.ticket.trim() === ''
    || value.expires_in !== 30
  ) {
    throw new Error('realtime ticket response violates contract')
  }

  return {
    ticket: value.ticket,
    expires_in: value.expires_in,
  }
}

export function parseQueueMonitorGrantResponse(value: unknown): QueueMonitorGrantResponse {
  if (
    !isRecord(value)
    || !hasExactKeys(value, ['expires_in'])
    || value.expires_in !== 60
  ) {
    throw new Error('queue monitor grant response violates contract')
  }

  return { expires_in: value.expires_in }
}
