import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const uploadDemoPath = 'src/views/Main/component/upload/index.vue'
const upMediaListPath = 'src/views/Main/component/upload/components/UpMediaList.vue'
const mediaTypesPath = 'src/views/Main/component/upload/components/media.ts'

function source(path: string) {
  const absolutePath = join(process.cwd(), path)
  expect(existsSync(absolutePath)).toBe(true)
  return readFileSync(absolutePath, 'utf8')
}

describe('upload demo source quality', () => {
  it('does not hide UpMediaList model shape behind any array refs', () => {
    const demo = source(uploadDemoPath)
    const list = source(upMediaListPath)
    const mediaTypes = source(mediaTypesPath)

    expect(demo).not.toContain('ref<any[]>')
    expect(demo).toContain("import type { UploadMediaItem } from './components/media'")
    expect(demo).toContain('const imgList = ref<UploadMediaItem[]>([])')

    expect(list).toContain("import type { UploadMediaItem } from './media'")
    expect(list).not.toContain('interface MediaItem')
    expect(list).toContain('modelValue?: UploadMediaItem[]')
    expect(list).toContain("'update:modelValue': [value: UploadMediaItem[]]")
    expect(mediaTypes).toContain('export interface UploadMediaItem')
    expect(mediaTypes).toContain('uid: number')
  })
})
