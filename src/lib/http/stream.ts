import { getCommonHeaders } from './headers'

const baseURL = import.meta.env.VITE_SOME_KEY
const sseBaseURL = import.meta.env.VITE_SSE_URL || baseURL

export interface SSECallbacks<T = any> {
  onEvent?: (event: string, data: T) => boolean | void
  onError?: (message: string) => void
  onComplete?: () => void
}

export async function streamPost<T = any, TData = unknown>(
  url: string,
  data: TData,
  callbacks: SSECallbacks<T>
): Promise<void> {
  const fullUrl = url.startsWith('http') ? url : `${sseBaseURL}${url}`
  const controller = new AbortController()

  const response = await fetch(fullUrl, {
    method: 'POST',
    headers: getCommonHeaders(),
    body: JSON.stringify(data),
    signal: controller.signal,
  })

  if (!response.ok) {
    callbacks.onError?.(`HTTP error: ${response.status}`)
    return
  }

  const reader = response.body?.getReader()
  if (!reader) {
    callbacks.onError?.('无法读取响应流')
    return
  }

  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) {
        break
      }

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      let currentEvent = ''
      for (const line of lines) {
        if (line.startsWith('event:')) {
          currentEvent = line.slice(6).trim()
          continue
        }

        if (!line.startsWith('data:')) {
          continue
        }

        const dataString = line.slice(5).trim()
        try {
          const parsed = JSON.parse(dataString) as T
          const shouldStop = callbacks.onEvent?.(currentEvent, parsed)
          if (shouldStop) {
            controller.abort()
            return
          }
        } catch {
          callbacks.onError?.('Malformed SSE payload')
          controller.abort()
          return
        }
      }
    }

    callbacks.onComplete?.()
  } catch (error) {
    if (!(error instanceof DOMException) || error.name !== 'AbortError') {
      throw error
    }
  } finally {
    reader.releaseLock()
  }
}
