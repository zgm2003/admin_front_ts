import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function readFrontendSource(relativePath: string) {
  return readFileSync(resolve(process.cwd(), relativePath), 'utf8')
}

function readUsersApiSource() {
  return readFrontendSource('src/api/user/users.ts')
}

function readUserTypeSource() {
  return readFrontendSource('src/types/user.ts')
}

function readCaptchaTypeSource() {
  return readFrontendSource('src/types/captcha.ts')
}

function readAuthSessionSource() {
  return readFrontendSource('src/lib/http/auth-session.ts')
}

describe('users api auth contract', () => {
  it('does not expose a standalone register api anymore', () => {
    const source = readUsersApiSource()
    const typeSource = readUserTypeSource()

    expect(source).not.toContain('export interface UserRegisterParams')
    expect(source).not.toContain('register: (params:')
    expect(source).not.toContain('/api/Users/register')
    expect(source).toContain('`${ADMIN_API_PREFIX}/auth/login`')
    expect(typeSource).not.toContain("| 'register'")
  })

  it('uses the REST current-user endpoint as the bootstrap contract', () => {
    const source = readUsersApiSource()

    expect(source).toContain("import request, { legacyRequest } from '@/lib/http'")
    expect(source).toContain("import { ADMIN_API_PREFIX } from '@/lib/http/api-prefix'")
    expect(source).toContain('request.get<UserInitResponse>(`${ADMIN_API_PREFIX}/users/me`)')
    expect(source).toContain('me: fetchCurrentUser')
    expect(source).toContain('init: fetchCurrentUser')
    expect(source).not.toContain('goRequest')
    expect(source).not.toContain("legacyRequest.post<UserInitResponse>('/api/Users/init', {})")
  })

  it('uses the REST auth refresh endpoint', () => {
    const source = readAuthSessionSource()
    const usersApiSource = readUsersApiSource()

    expect(source).toContain("import { ADMIN_AUTH_REFRESH_PATH } from './api-prefix'")
    expect(source).toContain('const REFRESH_PATH = ADMIN_AUTH_REFRESH_PATH')
    expect(source).toContain('`${baseURL}${REFRESH_PATH}`')
    expect(source).toContain('originalRequest.url?.includes(REFRESH_PATH)')
    expect(source).not.toContain('/api/Users/refresh')
    expect(usersApiSource).toContain('request.post<UserLoginSession>(`${ADMIN_API_PREFIX}/auth/refresh`, params)')
    expect(usersApiSource).not.toContain("legacyRequest.post<UserLoginSession>('/api/Users/refresh', params)")
  })

  it('uses the REST password login plus go-captcha contract', () => {
    const source = readUsersApiSource()
    const typeSource = readUserTypeSource()
    const captchaTypeSource = readCaptchaTypeSource()

    expect(source).toContain('request.get<LoginConfigResponse>(`${ADMIN_API_PREFIX}/auth/login-config`)')
    expect(source).toContain('request.get<SlideCaptchaChallenge>(`${ADMIN_API_PREFIX}/auth/captcha`)')
    expect(source).toContain('request.post<UserLoginSession, UserLoginParams>(`${ADMIN_API_PREFIX}/auth/login`, params)')
    expect(source).not.toContain('/api/Users/login')

    expect(typeSource).toContain("import type { SlideCaptchaAnswer, SlideCaptchaChallenge } from './captcha'")
    expect(typeSource).toContain('export type UserCaptchaAnswer = SlideCaptchaAnswer')
    expect(typeSource).toContain('export type UserCaptchaChallenge = SlideCaptchaChallenge')
    expect(captchaTypeSource).toContain('export interface SlideCaptchaAnswer')
    expect(captchaTypeSource).toContain('export interface SlideCaptchaChallenge')
    expect(typeSource).toContain('captcha_enabled: boolean')
    expect(typeSource).toContain('captcha_id: string')
    expect(typeSource).toContain('captcha_answer: UserCaptchaAnswer')
  })

  it('keeps captcha as a shared component instead of a login-private widget', () => {
    const loginPageSource = readFrontendSource('src/views/Login/index.vue')
    const loginFormSource = readFrontendSource('src/views/Login/components/LoginFormCard.vue')
    const captchaOverlaySource = readFrontendSource('src/components/AppCaptcha/src/AppCaptchaOverlay.vue')
    const slideCaptchaSource = readFrontendSource('src/components/AppCaptcha/src/AppSlideCaptcha.vue')

    expect(loginPageSource).toContain("import { AppCaptchaOverlay } from '@/components/AppCaptcha'")
    expect(loginPageSource).toContain('@complete="completeCaptchaLogin"')
    expect(loginFormSource).not.toContain('LoginSlideCaptcha')
    expect(loginFormSource).not.toContain('captchaChallenge')
    expect(captchaOverlaySource).not.toContain("from '@/components/AppDialog'")
    expect(captchaOverlaySource).not.toContain('#footer')
    expect(captchaOverlaySource).not.toContain('确认登录')
    expect(captchaOverlaySource).not.toContain('取消')
    expect(captchaOverlaySource).toContain('minMoveOffset: 16')
    expect(captchaOverlaySource).toContain('value < props.challenge.tile_x + props.minMoveOffset')
    expect(slideCaptchaSource).toContain("import type { SlideCaptchaChallenge } from '@/types/captcha'")
    expect(slideCaptchaSource).toContain("import { Slide as GoCaptchaSlide } from 'go-captcha-vue'")
    expect(slideCaptchaSource).toContain("import 'go-captcha-vue/dist/style.css'")
    expect(slideCaptchaSource).not.toContain('<el-slider')
    expect(slideCaptchaSource).toContain('<GoCaptchaSlide')
  })
})

