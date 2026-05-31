import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, expect, it } from 'vitest'

const apiRoot = join(process.cwd(), 'src', 'api')
const srcRoot = join(process.cwd(), 'src')
const legacyCrudNames = ['init', 'add', 'edit', 'del', 'status'] as const
const legacyPropertyPattern = new RegExp(`(^|\\n)(\\s*)(${legacyCrudNames.join('|')})\\s*:`, 'g')
const apiObjectPattern = /export\s+const\s+\w+Api\s*=\s*\{/g
const localCrudApiObjectPattern = /const\s+\w*CrudApi\s*=\s*\{/g

function walkTsFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry)
    if (statSync(path).isDirectory()) return walkTsFiles(path)
    return path.endsWith('.ts') ? [path] : []
  })
}

function read(path: string): string {
  return readFileSync(path, 'utf8')
}

function apiObjectRanges(source: string): Array<{ start: number; end: number }> {
  return [...source.matchAll(apiObjectPattern)].map((match) => {
    const start = match.index ?? 0
    const bodyStart = start + match[0].length
    let depth = 1
    let quote: '\'' | '"' | '`' | '' = ''
    let escaped = false
    let lineComment = false
    let blockComment = false

    for (let index = bodyStart; index < source.length; index += 1) {
      const char = source[index]
      const next = source[index + 1]

      if (lineComment) {
        if (char === '\n') lineComment = false
        continue
      }
      if (blockComment) {
        if (char === '*' && next === '/') {
          blockComment = false
          index += 1
        }
        continue
      }
      if (quote) {
        if (escaped) {
          escaped = false
          continue
        }
        if (char === '\\') {
          escaped = true
          continue
        }
        if (char === quote) quote = ''
        continue
      }

      if (char === '/' && next === '/') {
        lineComment = true
        index += 1
        continue
      }
      if (char === '/' && next === '*') {
        blockComment = true
        index += 1
        continue
      }
      if (char === '\'' || char === '"' || char === '`') {
        quote = char
        continue
      }
      if (char === '{') depth += 1
      if (char === '}') depth -= 1
      if (depth === 0) return { start, end: index }
    }
    return { start, end: source.length }
  })
}

function lineNumber(source: string, index: number): number {
  return source.slice(0, index).split('\n').length
}

describe('RESTful frontend API naming guard', () => {
  it('does not expose legacy CRUD wrapper names in exported API objects', () => {
    const violations = walkTsFiles(apiRoot).flatMap((file) => {
      const source = read(file)
      return apiObjectRanges(source).flatMap((range) => {
        const objectSource = source.slice(range.start, range.end)
        const matches = [...objectSource.matchAll(legacyPropertyPattern)]
        return matches.map((match) => `${relative(process.cwd(), file)}:${lineNumber(source, range.start + (match.index ?? 0))}:${match[3]}`)
      })
    })

    expect(violations).toEqual([])
  })

  it('does not pass legacy CRUD method names into local useCrudTable api objects', () => {
    const violations = walkTsFiles(srcRoot).flatMap((file) => {
      const source = read(file)
      return apiObjectRanges(source, localCrudApiObjectPattern).flatMap((range) => {
        const objectSource = source.slice(range.start, range.end)
        const matches = [...objectSource.matchAll(legacyPropertyPattern)]
        return matches.map((match) => `${relative(process.cwd(), file)}:${lineNumber(source, range.start + (match.index ?? 0))}:${match[3]}`)
      })
    })

    expect(violations).toEqual([])
  })
})
