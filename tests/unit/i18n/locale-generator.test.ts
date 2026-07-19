import { afterEach, describe, expect, it } from 'vitest'
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const generatorPath = resolve(process.cwd(), 'scripts/generate-locale-types.mjs')
const temporaryDirectories: string[] = []

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true })
  }
})

describe('locale type generator', () => {
  it('generates a sorted key union and rejects locale parity drift', async () => {
    expect(existsSync(generatorPath)).toBe(true)
    if (!existsSync(generatorPath)) return

    const root = join(tmpdir(), `admin-locales-${process.pid}-${Date.now()}`)
    temporaryDirectories.push(root)
    for (const locale of ['en-US', 'zh-CN']) {
      mkdirSync(join(root, locale), { recursive: true })
      writeFileSync(join(root, locale, 'common.ts'), `export default { common: { ok: '${locale}' } }\n`)
      writeFileSync(join(root, locale, 'ai-extra.ts'), `export default { aiChat: { send: '${locale}' } }\n`)
      writeFileSync(join(root, locale, 'ai.ts'), "import extra from './ai-extra'\nexport default { ...extra }\n")
    }

    const generator = await import('../../../scripts/generate-locale-types.mjs')
    expect(generator.generateLocaleKeySource).toBeTypeOf('function')
    expect(generator.collectLocaleKeys).toBeTypeOf('function')
    if (typeof generator.generateLocaleKeySource !== 'function'
      || typeof generator.collectLocaleKeys !== 'function') return

    const keys = await generator.collectLocaleKeys(root, 'en-US', ['common', 'ai'])
    expect(keys).toEqual(['aiChat.send', 'common.ok'])
    expect(generator.generateLocaleKeySource(keys)).toContain("'aiChat.send'")

    writeFileSync(join(root, 'zh-CN/ai-extra.ts'), "export default { aiChat: { cancel: '取消' } }\n")
    await expect(generator.assertLocaleParity(root, ['common', 'ai']))
      .rejects.toThrow(/locale key parity/i)
  })
})
