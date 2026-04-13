import { isTauri } from './env'
import type { DownloadEvent, Update } from '@tauri-apps/plugin-updater'

export type { DownloadEvent, Update }

export async function checkForAppUpdate() {
  if (!isTauri()) {
    return null
  }

  const { check } = await import('@tauri-apps/plugin-updater')
  return check()
}
