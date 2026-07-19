// @vitest-environment jsdom

import { describe, expect, it } from 'vitest'

import { sanitizeMarkdownHtml } from '@/shared/security/safe-html'

describe('sanitizeMarkdownHtml', () => {
  it('preserves renderer markup while removing executable content', () => {
    const result = sanitizeMarkdownHtml(`
      <p>safe</p>
      <script>alert('xss')</script>
      <img src="x" onerror="alert('xss')">
      <a href="javascript:alert('xss')">unsafe link</a>
      <pre><code class="hljs language-ts">const value = 1</code></pre>
    `)

    expect(result).toContain('<p>safe</p>')
    expect(result).toContain('hljs language-ts')
    expect(result).not.toContain('<script')
    expect(result).not.toContain('onerror')
    expect(result).not.toContain('javascript:')
  })
})
