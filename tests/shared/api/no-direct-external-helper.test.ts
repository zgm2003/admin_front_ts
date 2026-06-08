import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, expect, it } from 'vitest'

const srcRoot = join(process.cwd(), 'src')
const deletedRandomHelperPath = join(srcRoot, 'api', 'tools.ts')
const forbiddenExternalHosts = ['api.btstu.cn']

function walkSourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry)
    if (statSync(path).isDirectory()) return walkSourceFiles(path)
    return /\.(ts|vue)$/.test(path) && !path.endsWith('.d.ts') ? [path] : []
  })
}

function stripComments(source: string): string {
  return source
    .replace(/<!--([\s\S]*?)-->/g, '')
    .replace(/\/\*([\s\S]*?)\*\//g, '')
    .replace(/\/\/.*$/gm, '')
}

describe('Admin Vue direct external helper guard', () => {
  it('does not keep the unused random-image external helper module', () => {
    expect(existsSync(deletedRandomHelperPath)).toBe(false)
  })

  it('does not call the retired external image host from Admin Vue source', () => {
    const offenders = walkSourceFiles(srcRoot).flatMap((file) => {
      const source = stripComments(readFileSync(file, 'utf8'))
      return forbiddenExternalHosts.flatMap((host) =>
        source.includes(host) ? [`${relative(process.cwd(), file)} contains ${host}`] : [],
      )
    })

    expect(offenders).toEqual([])
  }, 15000)
})
