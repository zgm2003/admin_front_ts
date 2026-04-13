import { isTauri } from './env'

export async function exitAppProcess(code = 0) {
  if (!isTauri()) {
    return
  }

  const { exit } = await import('@tauri-apps/plugin-process')
  await exit(code)
}

export async function relaunchAppProcess() {
  if (!isTauri()) {
    return
  }

  const { relaunch } = await import('@tauri-apps/plugin-process')
  await relaunch()
}
