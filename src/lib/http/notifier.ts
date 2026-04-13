export function createDebouncedNotifier(params: {
  notify: (message: string) => void
  debounceMs?: number
  now?: () => number
}) {
  const {
    notify,
    debounceMs = 2000,
    now = () => Date.now(),
  } = params

  let lastNotifyTime = 0
  let lastNotifyMessage = ''

  return (message: string) => {
    const currentTime = now()
    if (message === lastNotifyMessage && currentTime - lastNotifyTime < debounceMs) {
      return
    }

    lastNotifyTime = currentTime
    lastNotifyMessage = message
    notify(message)
  }
}
