import { computed, type Ref } from 'vue'

interface UseAuditStreamMetricsOptions<T> {
  list: Ref<T[]>
  searchForm: Ref<Record<string, unknown>>
  isSuccess: (item: T) => boolean
}

const hasFilterValue = (value: unknown): boolean => {
  if (Array.isArray(value)) return value.some((item) => hasFilterValue(item))
  return value !== '' && value !== null && value !== undefined
}

export function useAuditStreamMetrics<T>(
  options: UseAuditStreamMetricsOptions<T>
) {
  const { list, searchForm, isSuccess } = options

  const activeFilterCount = computed(() =>
    Object.values(searchForm.value).filter((value) => hasFilterValue(value)).length
  )

  const successCount = computed(() =>
    list.value.filter((item) => isSuccess(item)).length
  )

  const failureCount = computed(() => list.value.length - successCount.value)

  const successRate = computed(() =>
    list.value.length ? Math.round((successCount.value / list.value.length) * 100) : 0
  )

  return {
    activeFilterCount,
    successCount,
    failureCount,
    successRate,
  }
}
