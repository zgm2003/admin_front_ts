import { describe, expect, it } from 'vitest'
import {
  formatOperationLogPayload,
  summarizeOperationLogPayload,
} from '../../../src/views/Main/system/operationLog/utils/payload'

describe('operation log payload formatting', () => {
  it('summarizes request data from the real payload instead of wrapper metadata', () => {
    const raw = JSON.stringify({
      method: 'POST',
      path: '/api/admin/v1/notification-tasks',
      module: 'notification_task',
      action: 'create',
      payload: {
        title: 'hello',
        level: 2,
        target_ids: [1],
      },
    })

    expect(summarizeOperationLogPayload(raw, 'request')).toBe('title, level, target_ids')
  })

  it('summarizes response data from response payload data instead of status wrapper', () => {
    const raw = JSON.stringify({
      status: 200,
      success: true,
      payload: {
        code: 0,
        data: {
          id: 11,
          queued: true,
        },
        msg: 'ok',
      },
    })

    expect(summarizeOperationLogPayload(raw, 'response')).toBe('id, queued')
  })

  it('keeps failed response business code and message visible when data is empty', () => {
    const raw = JSON.stringify({
      status: 400,
      success: false,
      payload: {
        code: 100,
        data: {},
        msg: '参数错误',
      },
    })

    expect(summarizeOperationLogPayload(raw, 'response')).toBe('code, msg')
  })

  it('pretty-prints invalid and valid payloads without throwing', () => {
    expect(formatOperationLogPayload('{"a":1}')).toBe('{\n  "a": 1\n}')
    expect(formatOperationLogPayload('not-json')).toBe('not-json')
  })
})
