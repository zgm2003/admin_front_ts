export type OperationLogPayloadKind = 'request' | 'response'

export interface OperationLogPayloadSummaryLabels {
  empty?: string
  payloadNone?: string
  items?: (count: number) => string
}

type JsonObject = { [key: string]: unknown }

const defaultLabels: Required<OperationLogPayloadSummaryLabels> = {
  empty: '-',
  payloadNone: 'No request or response payload',
  items: (count: number) => `${count} items`,
}

const isJsonObject = (value: unknown): value is JsonObject => (
  value !== null && typeof value === 'object' && !Array.isArray(value)
)

const parseJSON = (raw: string | null | undefined): { ok: true; value: unknown } | { ok: false; value: string } => {
  if (!raw) return { ok: false, value: '' }
  try {
    return { ok: true, value: JSON.parse(raw) as unknown }
  } catch {
    return { ok: false, value: raw }
  }
}

const extractEnvelopePayload = (value: unknown, kind: OperationLogPayloadKind): unknown => {
  if (!isJsonObject(value)) return value

  if (kind === 'request' && 'payload' in value) {
    return value.payload
  }

  if (kind === 'response' && 'payload' in value) {
    return value.payload
  }

  return value
}

const summarizeObjectKeys = (value: JsonObject, labels: Required<OperationLogPayloadSummaryLabels>): string => {
  const keys = Object.keys(value)
  return keys.length > 0 ? keys.slice(0, 4).join(', ') : labels.payloadNone
}

const summarizeResponsePayload = (
  payload: JsonObject,
  labels: Required<OperationLogPayloadSummaryLabels>,
): string => {
  if (isJsonObject(payload.data) && Object.keys(payload.data).length > 0) {
    return summarizeObjectKeys(payload.data, labels)
  }

  const businessKeys = ['code', 'msg'].filter((key) => key in payload)
  if (businessKeys.length > 0) {
    return businessKeys.join(', ')
  }

  return summarizeObjectKeys(payload, labels)
}

export const summarizeOperationLogPayload = (
  raw: string | null | undefined,
  kind: OperationLogPayloadKind,
  labels: OperationLogPayloadSummaryLabels = {},
): string => {
  const mergedLabels = { ...defaultLabels, ...labels }
  const parsed = parseJSON(raw)
  if (!parsed.ok) return parsed.value || mergedLabels.empty

  const payload = extractEnvelopePayload(parsed.value, kind)

  if (Array.isArray(payload)) {
    return mergedLabels.items(payload.length)
  }

  if (isJsonObject(payload)) {
    if (kind === 'response') {
      return summarizeResponsePayload(payload, mergedLabels)
    }
    return summarizeObjectKeys(payload, mergedLabels)
  }

  if (payload === null || payload === undefined || payload === '') {
    return mergedLabels.payloadNone
  }
  return String(payload)
}

export const formatOperationLogPayload = (
  raw: string | null | undefined,
  kind?: OperationLogPayloadKind,
): string => {
  const parsed = parseJSON(raw)
  if (!parsed.ok) return parsed.value

  const value = kind ? extractEnvelopePayload(parsed.value, kind) : parsed.value
  if (typeof value === 'string') return value
  if (value === null || value === undefined) return ''
  return JSON.stringify(value, null, 2)
}
