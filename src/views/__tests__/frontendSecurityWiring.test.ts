import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const readSource = (relativePath: string) =>
  readFileSync(resolve(process.cwd(), relativePath), 'utf8').split('\r\n').join('\n')

describe('frontend security wiring', () => {
  it('renders user bio as plain text instead of raw HTML', () => {
    const source = readSource('src/views/Main/user/userManager/components/UserList/index.vue')

    expect(source).not.toContain('v-html="row.bio"')
    expect(source).toMatch(/<el-text>\s*\{\{\s*row\.bio\s*\}\}\s*<\/el-text>/)
  })

  it('creates i18n translator inside useValidator', () => {
    const source = readSource('src/hooks/web/useValidator.ts')

    expect(source).not.toMatch(/^const \{ t \} = useI18n\(\)/m)
    expect(source).toMatch(/export const useValidator = \(\) => \{\n\s*const \{ t \} = useI18n\(\)/)
  })

  it('exposes websocket through a computed ref', () => {
    const source = readSource('src/hooks/useWebSocket.ts')

    expect(source).toContain('ws: computed(() => sharedWs)')
    expect(source).not.toContain('ws: ref(sharedWs)')
  })
})
