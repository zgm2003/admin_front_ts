import { computed, toValue, type MaybeRefOrGetter } from 'vue'

interface AuditTimestampParts {
  date: string
  time: string
}

const EMPTY_TIMESTAMP: AuditTimestampParts = {
  date: '',
  time: '--',
}

export function useAuditTimestamp(
  createdAt: MaybeRefOrGetter<string | null | undefined>
) {
  const createdAtParts = computed<AuditTimestampParts>(() => {
    const raw = String(toValue(createdAt) || '').replace('T', ' ').trim()
    if (!raw) return EMPTY_TIMESTAMP

    const parts = raw.split(' ')
    if (parts.length === 1) {
      return {
        date: '',
        time: raw,
      }
    }

    return {
      date: parts[0] || '',
      time: parts.slice(1).join(' ') || raw,
    }
  })

  return {
    createdAtParts,
  }
}
