import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const headerPath = 'src/views/Layout/components/Header/index.vue'

function stripComments(source: string) {
  return source
    .replace(/<!--([\s\S]*?)-->/g, '')
    .replace(/\/\*([\s\S]*?)\*\//g, '')
    .replace(/\/\/.*$/gm, '')
}

function sourceLines() {
  const source = stripComments(readFileSync(join(process.cwd(), headerPath), 'utf8'))
  return source.split(/\r?\n/)
}

describe('layout Header source quality', () => {
  it('keeps breadcrumb route data typed without any or as any', () => {
    const offenders = sourceLines().flatMap((line, index) => {
      if (!/\bany\b|\bas\s+any\b/.test(line)) return []

      return [`${headerPath}:${index + 1}: ${line.trim()}`]
    })

    expect(offenders).toEqual([])
  })

  it('does not hide breadcrumb path lookup failures behind logical-or fallback', () => {
    const source = sourceLines().join('\n')

    expect(source).not.toContain('return getPath(userStore.permissions, selectedIndex) || []')
    expect(source).not.toContain('if (!selectedIndex || selectedIndex ===')
  })
})
