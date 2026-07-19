import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const invoke = vi.fn()

vi.mock('@tauri-apps/api/core', () => ({
  invoke,
  isTauri: vi.fn(() => true),
}))

import { createTauriNativeBridge } from '@/adapters/tauri/native-bridge'

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')

describe('managed native downloads', () => {
  beforeEach(() => {
    invoke.mockReset()
  })

  it('lets Rust generate the task id and choose the save path', async () => {
    invoke.mockResolvedValueOnce('6c054f80-bfb0-4f06-8567-fc8885ff968b')
    const bridge = createTauriNativeBridge()

    await expect(bridge.downloads.start({
      url: 'https://cos.zgm2003.cn/releases/admin.exe?signature=secret',
      suggestedFilename: 'admin.exe',
    })).resolves.toBe('6c054f80-bfb0-4f06-8567-fc8885ff968b')

    expect(invoke).toHaveBeenCalledWith('start_managed_download', {
      url: 'https://cos.zgm2003.cn/releases/admin.exe?signature=secret',
      suggestedFilename: 'admin.exe',
    })
  })

  it('reveals only a recorded task id and never passes a filesystem path', async () => {
    invoke.mockResolvedValueOnce(undefined)
    const bridge = createTauriNativeBridge()

    await bridge.downloads.reveal('9d99bf6c-f5d1-4c2d-88c7-26fb2d52ba42')

    expect(invoke).toHaveBeenCalledWith('reveal_managed_download', {
      taskId: '9d99bf6c-f5d1-4c2d-88c7-26fb2d52ba42',
    })
  })

  it('contains no JavaScript dialog, caller task id, or path cache', async () => {
    const source = await readFile(
      resolve(repositoryRoot, 'src/adapters/tauri/native-bridge.ts'),
      'utf8',
    )

    expect(source).not.toContain('@tauri-apps/plugin-dialog')
    expect(source).not.toContain('savePath')
    expect(source).not.toContain('save_path')
    expect(source).not.toContain('savePaths')
    expect(source).not.toContain("invoke('open_file_folder'")
    expect(source).not.toMatch(/downloads:[\s\S]*crypto\.randomUUID\(\)/)
  })

  it('maps cancellation and policy failures without reflecting signed URLs', async () => {
    const bridge = createTauriNativeBridge()
    invoke.mockRejectedValueOnce({
      kind: 'download_cancelled',
      message: '已取消下载',
    })
    await expect(bridge.downloads.start({
      url: 'https://cos.zgm2003.cn/file?signature=must-not-leak',
      suggestedFilename: 'file.zip',
    })).rejects.toMatchObject({ code: 'native.cancelled' })

    invoke.mockRejectedValueOnce({
      kind: 'download_policy',
      message: '下载请求不符合安全策略',
    })
    await expect(bridge.downloads.start({
      url: 'http://127.0.0.1/private',
      suggestedFilename: 'private',
    })).rejects.toMatchObject({ code: 'native.policy_rejected' })
  })
})
