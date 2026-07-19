import type { NativeBridge } from '@/modules/native/types'

export type AdminClientVariant = 'browser' | 'desktop'
export type AdminRequestLanguage = 'zh-CN' | 'en-US'

export interface CommonHeaderContext {
  readonly language: AdminRequestLanguage
  readonly deviceId: string
  readonly clientVariant: AdminClientVariant
  readonly traceId: string
}

export function getAdminClientVariant(
  runtime: NativeBridge['kind'] = 'web',
): AdminClientVariant {
  return runtime === 'tauri' ? 'desktop' : 'browser'
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
    'X-Admin-Client-Variant': context.clientVariant,
    'X-Trace-Id': context.traceId,
  }
}
