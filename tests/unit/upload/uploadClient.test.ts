import { beforeEach, describe, expect, it, vi } from 'vitest'

const cosMocks = vi.hoisted(() => ({
  putObject: vi.fn(),
  cancelTask: vi.fn(),
}))

vi.mock('cos-js-sdk-v5/index.js', () => ({
  default: class {
    putObject = cosMocks.putObject
    cancelTask = cosMocks.cancelTask
  },
}))

vi.mock('@/i18n', () => ({
  default: { global: { t: (key: string) => key } },
}))

import { uploadFileToCloud, type UploadConfig } from '@/lib/upload/uploadClient'

function config(): UploadConfig {
  return {
    provider: 'cos',
    key: 'ai_chat_attachments/report.pdf',
    bucket: 'bucket',
    region: 'region',
    bucket_domain: 'https://files.example.test',
    start_time: 1,
    expired_time: 2,
    credentials: {
      tmp_secret_id: 'id',
      tmp_secret_key: 'key',
      session_token: 'token',
    },
    rule: {
      max_size_mb: 100,
      image_exts: ['png'],
      file_exts: ['pdf'],
    },
  }
}

describe('uploadFileToCloud cancellation', () => {
  beforeEach(() => vi.clearAllMocks())

  it('cancels the active COS task and rejects when the signal aborts', async () => {
    cosMocks.putObject.mockImplementation((params: { onTaskReady?: (taskId: string) => void }) => {
      params.onTaskReady?.('task-1')
    })
    const controller = new AbortController()
    const upload = uploadFileToCloud(
      new File(['pdf'], 'report.pdf', { type: 'application/pdf' }),
      config(),
      controller.signal,
    )
    await vi.waitFor(() => expect(cosMocks.putObject).toHaveBeenCalledOnce())

    controller.abort()

    await expect(upload).rejects.toMatchObject({ name: 'AbortError' })
    expect(cosMocks.cancelTask).toHaveBeenCalledWith('task-1')
  })
})
