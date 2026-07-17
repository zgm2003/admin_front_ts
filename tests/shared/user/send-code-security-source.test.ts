import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function source(relativePath: string) {
  return readFileSync(resolve(process.cwd(), relativePath), 'utf8')
}

describe('login send-code security boundary', () => {
  it('does not let the shared send-code control call the login endpoint directly', () => {
    const sendCodeSource = source('src/components/SendCode/src/index.vue')

    expect(sendCodeSource).toContain("if (scene === 'login')")
    expect(sendCodeSource).toContain("emit('request')")
    expect(sendCodeSource.indexOf("if (scene === 'login')"))
      .toBeLessThan(sendCodeSource.indexOf('UsersApi.sendCode'))
  })

  it('keeps login send-code controlled by the validated login form', () => {
    const formSource = source('src/views/Login/components/LoginFormCard.vue')
    const pageSource = source('src/views/Login/index.vue')

    expect(formSource).toContain('@request="$emit(\'sendCode\')"')
    expect(formSource).toContain(':send-disabled="isLoginCodeAccountInvalid"')
    expect(pageSource).toContain('@send-code="requestLoginCode"')
  })
})
