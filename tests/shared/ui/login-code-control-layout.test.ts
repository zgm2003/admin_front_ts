import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8')

describe('login verification-code control layout', () => {
  it('keeps the input and send action in one joined control', () => {
    const styles = read('src/views/Login/components/LoginFormCard.styles.scss')

    expect(styles).toMatch(/:global\(\.login-send-code\)\s*\{[\s\S]*?gap:\s*0 !important;[\s\S]*?border-radius:\s*16px;/)
    expect(styles).toMatch(/:global\(\.login-send-code \.el-input__wrapper\)\s*\{[\s\S]*?border-radius:\s*0 !important;/)
    expect(styles).toMatch(/:global\(\.login-send-code \.el-button\)\s*\{[\s\S]*?border-left: 1px solid #dbeafe !important;/)
    expect(styles).toMatch(/:global\(\.login-form-card\.is-mobile \.login-send-code\)\s*\{[\s\S]*?height:\s*44px !important;/)
    expect(styles).toMatch(/:global\(\.login-form-card\.is-mobile \.login-send-code \.el-button\)\s*\{[\s\S]*?width:\s*auto !important;/)
  })
})
