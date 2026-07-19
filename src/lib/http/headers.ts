export type AdminRequestLanguage = 'zh-CN' | 'en-US'

export interface CommonHeaderContext {
  readonly language: AdminRequestLanguage
  readonly deviceId: string
  readonly traceId: string
}

export function generateTraceId(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') return globalThis.crypto.randomUUID()
  throw new Error('crypto.randomUUID is required to create a trace id')
}

export function buildCommonHeaders(context: CommonHeaderContext): Record<string, string> {
  return {
    'Accept-Language': context.language,
    platform: 'admin',
    'device-id': context.deviceId,
    'X-Trace-Id': context.traceId,
  }
}
