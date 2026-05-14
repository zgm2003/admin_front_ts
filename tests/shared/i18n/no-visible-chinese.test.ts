import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const guardedFiles = [
  'src/views/Error/404.vue',
  'src/store/user.ts',
  'src/lib/upload/uploadClient.ts',
  'src/utils/date.ts',
  'src/views/Login/composables/useLoginForm.ts',
  'src/views/Login/composables/useForgotPassword.ts',
  'src/views/Main/test/index.vue',
]

function stripComments(source: string) {
  return source
    .replace(/<!--([\s\S]*?)-->/g, '')
    .replace(/\/\*([\s\S]*?)\*\//g, '')
    .replace(/\/\/.*$/gm, '')
}

describe('frontend visible Chinese closure', () => {
  it('keeps known user-visible surfaces on i18n keys instead of raw Chinese', () => {
    const offenders: string[] = []

    for (const file of guardedFiles) {
      const source = stripComments(readFileSync(join(process.cwd(), file), 'utf8'))
      const lines = source.split(/\r?\n/)
      lines.forEach((line, index) => {
        if (/[\u4e00-\u9fff]/.test(line)) {
          offenders.push(`${file}:${index + 1}: ${line.trim()}`)
        }
      })
    }

    expect(offenders).toEqual([])
  })
})
