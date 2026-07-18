import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function readFrontendSource(relativePath: string) {
  return readFileSync(resolve(process.cwd(), relativePath), 'utf8')
}

function readUsersApiSource() {
  return readFrontendSource('src/api/user/users.ts')
}

function readUsersLoginLogSource() {
  return readFrontendSource('src/api/user/usersLoginLog.ts')
}

function readUserTypeSource() {
  return readFrontendSource('src/types/user.ts')
}

function readCaptchaTypeSource() {
  return readFrontendSource('src/types/captcha.ts')
}

function readBrowserCredentialSource() {
  return readFrontendSource('src/adapters/web/browser-credentials.ts')
}

function readAuthSchemaSource() {
  return readFrontendSource('src/modules/http/schema.ts')
}

function legacyUsersPath(action: string) {
  return `/${['api', 'Users', action].join('/')}`
}

describe('users api auth contract', () => {
  it('does not expose a standalone register api anymore', () => {
    const source = readUsersApiSource()
    const typeSource = readUserTypeSource()

    expect(source).not.toContain('export interface UserRegisterParams')
    expect(source).not.toContain('register: (params:')
    expect(source).not.toContain(legacyUsersPath('register'))
    expect(source).not.toContain('login: (params:')
    expect(readBrowserCredentialSource()).toContain("'/api/admin/v1/auth/login'")
    expect(typeSource).not.toContain("| 'register'")
  })

  it('uses the REST current-user endpoint as the bootstrap contract', () => {
    const source = readFrontendSource('src/modules/http/admin-operations.ts')

    expect(source).toContain("path: '/api/admin/v1/users/me'")
    expect(source).toContain("auth: 'required'")
    expect(source).toContain('responseSchema: principalSchema')
    expect(source).not.toContain('/users/init')
  })

  it('uses the REST auth refresh endpoint', () => {
    const source = readBrowserCredentialSource()
    const usersApiSource = readUsersApiSource()

    expect(source).toContain("return this.requestCredential('/api/admin/v1/auth/refresh', signal)")
    expect(source).toContain("credentials: 'include'")
    expect(source).not.toContain(legacyUsersPath('refresh'))
    expect(usersApiSource).not.toContain('auth/refresh')
  })

  it('uses the REST password login plus go-captcha contract', () => {
    const source = readUsersApiSource()
    const typeSource = readUserTypeSource()
    const captchaTypeSource = readCaptchaTypeSource()
    const authSchemaSource = readAuthSchemaSource()
    const browserCredentialSource = readBrowserCredentialSource()

    expect(source).toContain('request.get<LoginConfigResponse>(`${ADMIN_API_PREFIX}/auth/login-config`)')
    expect(source).toContain('request.get<SlideCaptchaChallenge>(`${ADMIN_API_PREFIX}/auth/captcha`)')
    expect(source).not.toContain('auth/login`, params')
    expect(browserCredentialSource).toContain("'/api/admin/v1/auth/login'")
    expect(source).not.toContain(legacyUsersPath('login'))

    expect(typeSource).toContain("import type { SlideCaptchaAnswer, SlideCaptchaChallenge } from './captcha'")
    expect(typeSource).toContain('export type UserCaptchaAnswer = SlideCaptchaAnswer')
    expect(typeSource).toContain('export type UserCaptchaChallenge = SlideCaptchaChallenge')
    expect(captchaTypeSource).toContain('export interface SlideCaptchaAnswer')
    expect(captchaTypeSource).toContain('export interface SlideCaptchaChallenge')
    expect(typeSource).toContain('captcha_enabled: boolean')
    expect(typeSource).toContain('captcha_id: string')
    expect(typeSource).toContain('captcha_answer: UserCaptchaAnswer')
    expect(typeSource).not.toContain('refresh_token')
    expect(typeSource).not.toContain('refresh_expires_in')
    expect(authSchemaSource).toContain('refresh_token: z.string().min(1).optional()')
    expect(authSchemaSource).toContain('refresh_expires_in: z.number().int().positive().optional()')
    expect(browserCredentialSource).toContain('auth.browser_refresh_credential_leak')
  })

  it('requires captcha proof for every send-code scene', () => {
    const typeSource = readUserTypeSource()

    expect(typeSource).toContain('export type UserSendCodeContext =')
    expect(typeSource).toContain('export type UserSendCodeCaptchaProof =')
    expect(typeSource).toContain("scene: Exclude<UserScene, 'login'>")
    expect(typeSource).toContain('export type UserSendCodeParams = UserSendCodeContext & UserSendCodeCaptchaProof')
    expect(typeSource).toContain('captcha_id: string')
    expect(typeSource).toContain('captcha_answer: UserCaptchaAnswer')
  })

  it('uses Go REST for forgot password instead of the legacy PHP endpoint', () => {
    const source = readUsersApiSource()
    const forgotSource = readFrontendSource('src/views/Login/composables/useForgotPassword.ts')
    const forgotDialogSource = readFrontendSource('src/views/Login/components/ForgotPasswordDialog.vue')

    expect(source).toContain('request.post<void, UserForgetPasswordParams>(`${ADMIN_API_PREFIX}/auth/forgot-password`, params)')
    expect(source).not.toContain('legacyRequest')
    expect(source).not.toContain(legacyUsersPath('forgetPassword'))
    expect(forgotSource).not.toContain('UsersApi.sendCode')
    expect(forgotDialogSource).toContain("import { SendCode } from '@/components/SendCode'")
    expect(forgotDialogSource).toContain('<SendCode')
    expect(forgotDialogSource).toContain('scene="forget"')
    expect(forgotSource).toContain('pwd.length < 6 || pwd.length > 128')
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
    expect(slideCaptchaSource).toContain('verticalPadding: 12')
    expect(slideCaptchaSource).toContain('horizontalPadding: 16')
    expect(slideCaptchaSource).toContain('iconSize: 22')
    expect(slideCaptchaSource).not.toContain('verticalPadding: 0')
    expect(slideCaptchaSource).not.toContain('horizontalPadding: 0')
    expect(slideCaptchaSource).toContain('background: transparent;')
    expect(slideCaptchaSource).toContain('box-shadow: none;')
  })

  it('uses Go REST for user session APIs including kick and batchKick', () => {
    const source = readUsersApiSource()
    const typeSource = readUserTypeSource()
    const sessionListSource = readFrontendSource('src/views/Main/user/userManager/components/SessionList/index.vue')

    expect(typeSource).toContain('export interface UserSessionPageInitResponse')
    expect(source).toContain('request.get<UserSessionPageInitResponse>(`${ADMIN_API_PREFIX}/user-sessions/page-init`)')
    expect(source).toContain('request.get<UserSessionListResponse>(`${ADMIN_API_PREFIX}/user-sessions`, { params: normalizeUserSessionListParams(params) })')
    expect(source).toContain('request.get<UserSessionStats>(`${ADMIN_API_PREFIX}/user-sessions/stats`)')
    expect(source).toContain('request.patch<UserSessionKickResponse>(`${ADMIN_API_PREFIX}/user-sessions/${params.id}/revoke`)')
    expect(source).toContain('request.patch<UserSessionBatchKickResponse, UserSessionBatchKickPayload>(`${ADMIN_API_PREFIX}/user-sessions/revoke`, { ids })')
    expect(source).not.toContain("legacyRequest.post<UserSessionListResponse>('/api/admin/UserSession/list', params)")
    expect(source).not.toContain("legacyRequest.post<UserSessionStats>('/api/admin/UserSession/stats')")
    expect(source).not.toContain("legacyRequest.post<void>('/api/admin/UserSession/kick', params)")
    expect(source).not.toContain("legacyRequest.post<{ count: number }>('/api/admin/UserSession/batchKick', params)")
    expect(sessionListSource).toContain('const data = await UserSessionApi.pageInit()')
    expect(sessionListSource).not.toContain('const data = await UsersListApi.pageInit()')
  })

  it('removes the current-user quick-entry API and DTO field', () => {
    const typeSource = readUserTypeSource()

    expect(existsSync(resolve(process.cwd(), 'src/api/user/usersQuickEntry.ts'))).toBe(false)
    expect(typeSource).not.toContain('QuickEntryItem')
    expect(typeSource).not.toContain('quick_entry')
    expect(typeSource).not.toContain('quickEntry')
  })

  it('permission tree traversal uses the required children array instead of optional-chain fallback', () => {
    const typeSource = readUserTypeSource()
    const storeSource = readFrontendSource('src/store/user.ts')

    expect(typeSource).toContain('children: PermissionMenuItem[]')
    expect(storeSource).not.toContain('children?.')
  })

  it('uses Go REST for user login log init/list and normalizes date range', () => {
    const source = readUsersLoginLogSource()

    expect(source).toContain("import request from '@/lib/http'")
    expect(source).toContain("import { ADMIN_API_PREFIX } from '@/lib/http/api-prefix'")
    expect(source).toContain('request.get<UserLoginLogInitResponse>(`${ADMIN_API_PREFIX}/users/login-logs/page-init`)')
    expect(source).toContain('request.get<UserLoginLogListResponse>(`${ADMIN_API_PREFIX}/users/login-logs`, { params: normalizeLoginLogListParams(params) })')
    expect(source).toContain('query.date_start = params.date[0]')
    expect(source).toContain('query.date_end = params.date[1]')
    expect(source).not.toContain('legacyRequest')
    expect(source).not.toContain('/api/admin/UsersLoginLog')
  })
})
