import { describe, expect, it } from 'vitest'
import { buildPublicFileURL } from '@/lib/upload/url'

describe('upload client public URL builder', () => {
  it('does not double-prefix bucket domains that already include a scheme', () => {
    expect(buildPublicFileURL('https://cos.example.com', 'bucket', 'ap-nanjing', 'avatars/a b.png')).toBe('https://cos.example.com/avatars/a%20b.png')
    expect(buildPublicFileURL('http://cos.example.com/', 'bucket', 'ap-nanjing', 'avatars/a.png')).toBe('http://cos.example.com/avatars/a.png')
  })

  it('builds HTTPS public URLs from the host-only COS bucket domain contract', () => {
    expect(buildPublicFileURL('cos.example.com', 'bucket', 'ap-nanjing', 'avatars/a.png')).toBe('https://cos.example.com/avatars/a.png')
    expect(buildPublicFileURL(null, 'bucket', 'ap-nanjing', 'avatars/a.png')).toBe('https://bucket.cos.ap-nanjing.myqcloud.com/avatars/a.png')
  })
})
