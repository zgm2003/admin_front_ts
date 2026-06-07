import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const editorPath = 'src/views/Main/component/display/components/Editor.vue'

function stripComments(source: string) {
  return source
    .replace(/<!--([\s\S]*?)-->/g, '')
    .replace(/\/\*([\s\S]*?)\*\//g, '')
    .replace(/\/\/.*$/gm, '')
}

function editorSource() {
  return stripComments(readFileSync(join(process.cwd(), editorPath), 'utf8'))
}

describe('wangEditor wrapper source quality', () => {
  it('does not use any/as-any at the editor boundary', () => {
    const source = editorSource()

    expect(source).not.toMatch(/\bany\b/)
    expect(source).not.toContain('(editorModule as any)')
  })

  it('uses wangEditor exported types instead of dynamic module indexing', () => {
    const source = editorSource()

    expect(source).toContain("import { Boot, type IDomEditor, type IEditorConfig, type IModuleConf } from '@wangeditor/editor'")
    expect(source).toContain('shallowRef<IDomEditor | null>(null)')
    expect(source).toContain('computed<AdminEditorConfig>')
    expect(source).toContain("type EditorAlertType = Parameters<IEditorConfig['customAlert']>[1]")
    expect(source).toContain('Boot.registerModule(markdownModule.default)')
  })

  it('types custom upload insert functions and rejects empty uploaded URLs', () => {
    const source = editorSource()

    expect(source).toContain('type ImageInsertFn = (src: string, alt: string, href: string) => void')
    expect(source).toContain('type VideoInsertFn = (src: string, poster: string) => void')
    expect(source).toContain('requireUploadURL(result.url)')
    expect(source).not.toContain('result.url ||')
  })
})
