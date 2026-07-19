import { describe, expect, it } from 'vitest'
import {
  buildCommonHeaders,
  getAdminClientVariant,
} from '@/lib/http/platform'

describe('HTTP common headers', () => {
  it('identifies browser and packaged desktop clients explicitly', () => {
    expect(getAdminClientVariant('web')).toBe('browser')
    expect(getAdminClientVariant('tauri')).toBe('desktop')
  })

  it('builds the explicit Admin context without reading or adding a credential', () => {
    const headers = buildCommonHeaders({
      language: 'en-US',
      deviceId: '8d4fc816-0eb7-4b72-a31f-25d8fb98c819',
      clientVariant: 'browser',
      traceId: 'trace-1',
    })

    expect(headers).toEqual({
      'Accept-Language': 'en-US',
      platform: 'admin',
      'device-id': '8d4fc816-0eb7-4b72-a31f-25d8fb98c819',
      'X-Admin-Client-Variant': 'browser',
      'X-Trace-Id': 'trace-1',
    })
    expect(JSON.stringify(headers)).not.toMatch(/authorization|access[_-]?token|refresh[_-]?token/i)
  })
})
