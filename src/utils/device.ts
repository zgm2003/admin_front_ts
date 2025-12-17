const DEVICE_KEY = 'device_id'

export function getDeviceId(): string {
  let deviceId = localStorage.getItem(DEVICE_KEY)
  if (!deviceId) {
    // Simple UUID v4 replacement
    deviceId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0
      const v = c === 'x' ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    })
    localStorage.setItem(DEVICE_KEY, deviceId)
  }
  return deviceId
}
