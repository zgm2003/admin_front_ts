import { computed, onMounted, onUnmounted, readonly, shallowRef } from 'vue'

export interface NavigatorOnlineSource {
  readonly onLine?: boolean
}

function browserNavigator(): NavigatorOnlineSource | null {
  return typeof navigator === 'undefined' ? null : navigator
}

export function readNavigatorOnline(source: NavigatorOnlineSource | null = browserNavigator()): boolean {
  return source?.onLine !== false
}

export function shouldShowOfflineNotice(isOnline: boolean): boolean {
  return !isOnline
}

export function useNetworkStatus() {
  const isOnline = shallowRef(readNavigatorOnline())
  const lastOfflineAt = shallowRef<Date | null>(isOnline.value ? null : new Date())

  const markOnline = () => {
    isOnline.value = true
  }

  const markOffline = () => {
    if (!lastOfflineAt.value || isOnline.value) {
      lastOfflineAt.value = new Date()
    }
    isOnline.value = false
  }

  const syncNavigatorStatus = () => {
    if (readNavigatorOnline()) {
      markOnline()
      return
    }
    markOffline()
  }

  const refreshPage = () => {
    window.location.reload()
  }

  onMounted(() => {
    syncNavigatorStatus()
    window.addEventListener('online', markOnline)
    window.addEventListener('offline', markOffline)
  })

  onUnmounted(() => {
    window.removeEventListener('online', markOnline)
    window.removeEventListener('offline', markOffline)
  })

  return {
    isOnline: readonly(isOnline),
    isOffline: computed(() => shouldShowOfflineNotice(isOnline.value)),
    lastOfflineAt: readonly(lastOfflineAt),
    refreshPage,
  }
}
