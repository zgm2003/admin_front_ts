import { describe, expect, it } from 'vitest'
import { parseRunInputSnapshot } from '@/views/Main/ai/runs/components/RunList/input-snapshot'

describe('AI run input snapshot parser', () => {
  it('keeps historical plain text as the complete raw fallback', () => {
    expect(parseRunInputSnapshot('plain <script>alert(1)</script> text')).toEqual({
      kind: 'raw',
      text: 'plain <script>alert(1)</script> text',
    })
  })

  it('maps only the documented direct snapshot fields', () => {
    const snapshot = JSON.stringify({
      content: 'describe the image',
      attachments: [{
        type: 'image',
        mime_type: 'image/png',
        name: 'input.png',
        size: 1536,
      }],
      runtime_params: {
        temperature: 0.7,
        max_tokens: 1024,
      },
    })

    expect(parseRunInputSnapshot(snapshot)).toEqual({
      kind: 'structured',
      content: 'describe the image',
      attachments: [{
        ordinal: 1,
        type: 'image',
        mimeType: 'image/png',
        name: 'input.png',
        size: 1536,
      }],
      runtimeParams: {
        temperature: 0.7,
        max_tokens: 1024,
      },
    })
  })

  it('parses a string meta_json exactly once and supports missing optional sections', () => {
    const nested = JSON.stringify({
      content: 'image only metadata follows',
      meta_json: JSON.stringify({
        attachments: [{
          type: 'image',
          mime_type: 'image/png',
          name: 'unsafe.png',
          size: 0,
        }],
      }),
    })

    expect(parseRunInputSnapshot(nested)).toEqual({
      kind: 'structured',
      content: 'image only metadata follows',
      attachments: [{
        ordinal: 1,
        type: 'image',
        mimeType: 'image/png',
        name: 'unsafe.png',
        size: 0,
      }],
      runtimeParams: null,
    })

    expect(parseRunInputSnapshot('{"content":"text only"}')).toEqual({
      kind: 'structured',
      content: 'text only',
      attachments: [],
      runtimeParams: null,
    })
  })

  it('keeps the original attachment ordinal when files precede an image', () => {
    const snapshot = JSON.stringify({
      content: 'compare the attachment and image',
      attachments: [
        {
          type: 'file',
          mime_type: 'application/pdf',
          name: 'context.pdf',
          size: 2048,
        },
        {
          type: 'image',
          mime_type: 'image/png',
          name: 'reference.png',
          size: 1536,
        },
      ],
    })

    expect(parseRunInputSnapshot(snapshot)).toEqual({
      kind: 'structured',
      content: 'compare the attachment and image',
      attachments: [{
        ordinal: 2,
        type: 'image',
        mimeType: 'image/png',
        name: 'reference.png',
        size: 1536,
      }],
      runtimeParams: null,
    })
  })

  it('keeps history request identity metadata internal while rendering its accepted image snapshot', () => {
    const snapshot = JSON.stringify({
      content: 'changed question',
      attachments: [{
        type: 'image',
        mime_type: 'image/png',
        name: 'reference.png',
        size: 1536,
      }],
      request_identity: {
        operation: 'chat.revision',
        source_message_id: 41,
      },
    })

    expect(parseRunInputSnapshot(snapshot)).toEqual({
      kind: 'structured',
      content: 'changed question',
      attachments: [{
        ordinal: 1,
        type: 'image',
        mimeType: 'image/png',
        name: 'reference.png',
        size: 1536,
      }],
      runtimeParams: null,
    })
  })

  it.each([
    '{bad json',
    '{"content":"keep me","meta_json":"{bad json"}',
    '{"content":"keep me","meta_json":"\\"{\\\\\\"attachments\\\\\\":[]}\\""}',
    '{"prompt":"alias is forbidden"}',
    '{"content":"hello","runtime_params":{"top_p":0.9}}',
    '{"attachments":[{"type":"image","mime_type":"image/png","name":"a.png","size":1},{"type":"audio","mime_type":"audio/mpeg","name":"a.mp3","size":1}]}',
    '{"attachments":[{"type":"image","mime_type":"image/png","name":"a.png","size":-1}]}',
    '{"attachments":[{"type":"image","url":"https://should-not-leak.example/a.png","name":"a.png","size":1}]}',
  ])('returns the complete raw input for malformed or unknown required shapes: %s', (text) => {
    expect(parseRunInputSnapshot(text)).toEqual({ kind: 'raw', text })
  })
})
