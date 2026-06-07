import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const searchDialogPath = 'src/views/Layout/components/Header/components/SearchDialog.vue'

function stripComments(source: string) {
  return source
    .replace(/<!--([\s\S]*?)-->/g, '')
    .replace(/\/\*([\s\S]*?)\*\//g, '')
    .replace(/\/\/.*$/gm, '')
}

function sourceLines() {
  const source = stripComments(readFileSync(join(process.cwd(), searchDialogPath), 'utf8'))
  return source.split(/\r?\n/)
}

describe('layout SearchDialog source quality', () => {
  it('keeps route search data typed without any or as any', () => {
    const offenders = sourceLines().flatMap((line, index) => {
      if (!/\bany\b|\bas\s+any\b/.test(line)) return []

      return [`${searchDialogPath}:${index + 1}: ${line.trim()}`]
    })

    expect(offenders).toEqual([])
  })
})
