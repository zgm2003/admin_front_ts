import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const diconPath = 'src/components/DIcon/src/index.vue'

function stripComments(source: string) {
  return source
    .replace(/<!--([\s\S]*?)-->/g, '')
    .replace(/\/\*([\s\S]*?)\*\//g, '')
    .replace(/\/\/.*$/gm, '')
}

function diconSource() {
  return stripComments(readFileSync(join(process.cwd(), diconPath), 'utf8'))
}

describe('DIcon source quality', () => {
  it('does not index the Element Plus icon module through any', () => {
    const source = diconSource()

    expect(source).not.toContain('(mod as any)')
    expect(source).not.toContain('as unknown as Promise<Record<string, Component>>')
    expect(source).not.toContain('Record<string, Component>')
  })

  it('narrows runtime icon names through an explicit module key guard', () => {
    const source = diconSource()

    expect(source).toContain("type ElementPlusIconsModule = typeof import('@element-plus/icons-vue')")
    expect(source).toContain('type ElementPlusIconName = keyof ElementPlusIconsModule')
    expect(source).toContain('function hasElementPlusIcon(')
    expect(source).toContain('name is ElementPlusIconName')
    expect(source).toContain('hasElementPlusIcon(mod, name) ? mod[name] : undefined')
  })
})
