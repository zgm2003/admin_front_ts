import { isTauriRuntime } from '@/platform/tauri/env'

export type AdminClientVariant = 'browser' | 'desktop'
export type AdminRequestLanguage = 'zh-CN' | 'en-US'

type TauriRuntime = { __TAURI__?: unknown }

export interface CommonHeaderContext {
  readonly language: AdminRequestLanguage
  readonly deviceId: string
  readonly clientVariant: AdminClientVariant
  readonly traceId: string
}

export function getAdminClientVariant(
  runtime: TauriRuntime | undefined | null = globalThis as typeof globalThis & TauriRuntime,
): AdminClientVariant {
  return isTauriRuntime(runtime) ? 'desktop' : 'browser'
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
