const EMPTY_JSON_OBJECT_SOURCE = '{}'

export function jsonEditorParseSource(value: string): string {
  if (value.trim().length === 0) return EMPTY_JSON_OBJECT_SOURCE
  return value
}

export function parseJsonEditorValue(value: string): unknown {
  return JSON.parse(jsonEditorParseSource(value))
}

export function formatJsonEditorValue(value: string): string {
  return JSON.stringify(parseJsonEditorValue(value), null, 2)
}

export function requireJsonParseErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) {
    throw new Error('json editor parse failed with non-Error reason')
  }

  const message = error.message.trim()
  if (message.length === 0) {
    throw new Error('json editor parse error message must be non-empty')
  }

  return message
}
