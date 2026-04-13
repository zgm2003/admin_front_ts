import { isTauri } from './env'

export async function getTauriAppVersion() {
  if (!isTauri()) {
    return ''
  }

  const { getVersion } = await import('@tauri-apps/api/app')
  return getVersion()
}
