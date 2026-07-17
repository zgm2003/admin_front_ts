# All Send-Code Captcha Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Require a one-time slide captcha before every verification-code send across login, password recovery, phone binding, email binding, and code-verified password changes.

**Architecture:** The Go auth service is the final enforcement boundary and verifies captcha before any code generation, cache write, mock-phone success, or email send. The Vue `SendCode` component owns the shared non-login captcha flow through a small testable composable, while login retains its form-aware orchestration and forgot-password replaces its duplicate sender/timer with the shared component.

**Tech Stack:** Go 1.26, Gin, Vue 3, TypeScript, Vitest, Element Plus, go-captcha, Docker Compose.

**Execution constraint:** Work directly on the existing `master` workspaces. Do not create a worktree. Start or rebuild the application only through `admin_back_go/scripts/docker-platform.ps1`.

---

### Task 1: Enforce captcha for every backend send-code scene

**Files:**
- Modify: `../admin_back_go/internal/module/auth/service.go`
- Modify: `../admin_back_go/internal/module/auth/service_test.go`

- [ ] **Step 1: Write the failing all-scene service test**

Add a table test containing `login`, `forget`, `bind_phone`, `bind_email`, and `change_password`. Each call omits captcha proof and must return `captcha.required` without writing to `fakeCodeStore`:

```go
func TestServiceSendCodeRequiresCaptchaForEveryScene(t *testing.T) {
	tests := []struct {
		name, account, scene, loginType string
	}{
		{"login", "15671628271", VerifyCodeSceneLogin, LoginTypePhone},
		{"forget", "15671628271", VerifyCodeSceneForget, ""},
		{"bind phone", "15671628271", VerifyCodeSceneBindPhone, ""},
		{"bind email", "user@example.com", VerifyCodeSceneBindEmail, ""},
		{"change password", "15671628271", VerifyCodeSceneChangePassword, ""},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			store := &fakeCodeStore{}
			service := NewService(&fakeAuthRepository{}, fakeLoginTypeProvider{}, &fakeSessionCreator{}, &fakeCaptchaVerifier{}, WithCodeStore(store), WithVerifyCodeMailSender(&fakeVerifyCodeMailSender{}))
			_, appErr := service.SendCode(context.Background(), SendCodeInput{Account: tt.account, Scene: tt.scene, LoginType: tt.loginType})
			if appErr == nil || appErr.MessageID != "captcha.required" || store.setKey != "" {
				t.Fatalf("scene=%s err=%#v store=%#v", tt.scene, appErr, store)
			}
		})
	}
}
```

- [ ] **Step 2: Run the test and verify RED**

Run:

```powershell
go test ./internal/module/auth -run '^TestServiceSendCodeRequiresCaptchaForEveryScene$' -count=1
```

Expected: `forget`, `bind_phone`, `bind_email`, and `change_password` fail because they currently bypass captcha.

- [ ] **Step 3: Move captcha verification outside the login-only branch**

Keep `login_type` validation inside `scene=login`, then unconditionally require and verify captcha:

```go
if input.Scene == VerifyCodeSceneLogin {
	if input.LoginType != LoginTypeEmail && input.LoginType != LoginTypePhone {
		return "", apperror.BadRequestKey("auth.send_code.login_type.invalid", nil, "请选择邮箱或手机号登录方式")
	}
	if accountType != input.LoginType {
		if input.LoginType == LoginTypeEmail {
			return "", apperror.BadRequestKey("auth.send_code.email.invalid", nil, "请输入正确的邮箱格式")
		}
		return "", apperror.BadRequestKey("auth.send_code.phone.invalid", nil, "请输入正确的手机号格式")
	}
}
if input.CaptchaID == "" || input.CaptchaAnswer == nil {
	return "", apperror.BadRequestKey("captcha.required", nil, "请完成验证码")
}
if s.captchaVerifier == nil {
	return "", apperror.InternalKey("captcha.service_missing", nil, "验证码服务未配置")
}
if appErr := s.captchaVerifier.Verify(ctx, VerifyInput{
	ID: input.CaptchaID, Answer: input.CaptchaAnswer,
	ClientIP: input.ClientIP, UserAgent: input.UserAgent,
}); appErr != nil {
	return "", appErr
}
```

- [ ] **Step 4: Run auth tests and verify GREEN**

```powershell
gofmt -w internal/module/auth/service.go internal/module/auth/service_test.go
go test ./internal/module/auth/... -count=1
```

Expected: all auth tests pass.

### Task 2: Make captcha proof mandatory in frontend send-code types

**Files:**
- Modify: `src/types/user.ts`
- Modify: `tests/shared/user/users-api.test.ts`

- [ ] **Step 1: Add a failing source-contract assertion**

Require the type source to define a shared proof and require it for non-login scenes:

```ts
expect(typeSource).toContain('type UserSendCodeCaptchaProof')
expect(typeSource).toContain("scene: Exclude<UserScene, 'login'>")
expect(typeSource).toContain('captcha_id: string')
expect(typeSource).toContain('captcha_answer: UserCaptchaAnswer')
```

- [ ] **Step 2: Run the focused test and verify RED**

```powershell
npm test -- --run tests/shared/user/users-api.test.ts
```

Expected: FAIL because non-login send-code parameters currently omit proof.

- [ ] **Step 3: Introduce context and proof types**

```ts
export type UserSendCodeContext =
  | { account: string; scene: 'login'; login_type: 'email' | 'phone' }
  | { account: string; scene: Exclude<UserScene, 'login'> }

export type UserSendCodeCaptchaProof = {
  captcha_id: string
  captcha_answer: UserCaptchaAnswer
}

export type UserSendCodeParams = UserSendCodeContext & UserSendCodeCaptchaProof
```

- [ ] **Step 4: Run the focused test and typecheck**

```powershell
npm test -- --run tests/shared/user/users-api.test.ts
npm run typecheck
```

Expected: source-contract test passes; typecheck fails only at remaining bare non-login send calls, proving every caller is identified.

### Task 3: Add a testable shared captcha-send flow

**Files:**
- Create: `src/components/SendCode/src/useCaptchaSendCode.ts`
- Create: `tests/shared/user/send-code-captcha-flow.test.ts`

- [ ] **Step 1: Write failing composable tests**

Mock `UsersApi.getCaptcha` and `UsersApi.sendCode`. Verify:

```ts
const flow = useCaptchaSendCode({
  buildRequest: () => ({ account: 'user@example.com', scene: 'bind_email' }),
  onSent,
})
await flow.openCaptcha()
expect(getCaptcha).toHaveBeenCalledOnce()
expect(sendCode).not.toHaveBeenCalled()
flow.captchaX.value = 124
await flow.completeCaptcha()
expect(sendCode).toHaveBeenCalledWith({
  account: 'user@example.com', scene: 'bind_email',
  captcha_id: 'captcha-id', captcha_answer: { x: 124, y: 12 },
})
expect(onSent).toHaveBeenCalledOnce()
```

Add table assertions for account validation:

```ts
expect(isSendCodeAccountValid('15671628271', 'bind_phone')).toBe(true)
expect(isSendCodeAccountValid('user@example.com', 'bind_phone')).toBe(false)
expect(isSendCodeAccountValid('user@example.com', 'bind_email')).toBe(true)
expect(isSendCodeAccountValid('15671628271', 'forget')).toBe(true)
expect(isSendCodeAccountValid('user@example.com', 'change_password')).toBe(true)
```

- [ ] **Step 2: Run tests and verify RED**

```powershell
npm test -- --run tests/shared/user/send-code-captcha-flow.test.ts
```

Expected: FAIL because the composable and validator do not exist.

- [ ] **Step 3: Implement the composable**

The composable must expose `captchaChallenge`, `captchaX`, `captchaLoading`, `captchaDialogVisible`, `sending`, `openCaptcha`, `refreshCaptcha`, `completeCaptcha`, and `resetCaptcha`. It captures `UserSendCodeContext` before opening, builds proof only after the minimum slide offset, calls `UsersApi.sendCode`, invokes `onSent` only on success, and clears the one-time challenge after every send attempt.

- [ ] **Step 4: Run tests and verify GREEN**

```powershell
npm test -- --run tests/shared/user/send-code-captcha-flow.test.ts
```

Expected: all flow and account-validation tests pass.

### Task 4: Route the shared SendCode component through captcha

**Files:**
- Modify: `src/components/SendCode/src/index.vue`
- Modify: `tests/shared/user/send-code-security-source.test.ts`

- [ ] **Step 1: Strengthen the failing source boundary test**

Assert that the component imports `AppCaptchaOverlay` and `useCaptchaSendCode`, and that its non-login click path calls `openCaptcha()` rather than `UsersApi.sendCode` directly.

- [ ] **Step 2: Run the focused test and verify RED**

```powershell
npm test -- --run tests/shared/user/send-code-security-source.test.ts
```

Expected: FAIL because non-login scenes still send directly.

- [ ] **Step 3: Integrate the shared flow**

Keep login controlled via `emit('request')`. For every other scene, build `{ account: props.account.trim(), scene }`, call `openCaptcha`, render:

```vue
<AppCaptchaOverlay
  v-model="captchaDialogVisible"
  :challenge="captchaChallenge"
  :slider-x="captchaX"
  :loading="captchaLoading"
  :verifying="captchaSending"
  @update:slider-x="captchaX = $event"
  @refresh="refreshCaptcha"
  @complete="completeCaptcha"
/>
```

Use `isSendCodeAccountValid` in `isSendDisabled`. Preserve `completeSend()` so notification and countdown start only after the API succeeds.

- [ ] **Step 4: Run focused tests and typecheck**

```powershell
npm test -- --run tests/shared/user/send-code-captcha-flow.test.ts tests/shared/user/send-code-security-source.test.ts
npm run typecheck
```

Expected: tests and typecheck pass except for the old forgot-password bare call.

### Task 5: Reuse SendCode in forgot password and cover every UI entry

**Files:**
- Modify: `src/views/Login/components/ForgotPasswordDialog.vue`
- Modify: `src/views/Login/composables/useForgotPassword.ts`
- Modify: `src/views/Login/index.vue`
- Modify: `src/views/Main/personal/components/Security/index.vue`
- Modify: `src/views/Main/component/form/index.vue`
- Modify: `tests/shared/user/users-api.test.ts`
- Modify: `tests/shared/user/forgot-password-source-quality.test.ts`
- Modify: `tests/shared/user/send-code-security-source.test.ts`

- [ ] **Step 1: Write failing coverage assertions**

Require `ForgotPasswordDialog` to render `<SendCode ... scene="forget">`, require Security to contain `bind_phone`, `bind_email`, and `change_password`, and assert `useForgotPassword.ts` contains no `UsersApi.sendCode`, countdown timer, or `isSendingCode` state.

- [ ] **Step 2: Run focused tests and verify RED**

```powershell
npm test -- --run tests/shared/user/users-api.test.ts tests/shared/user/forgot-password-source-quality.test.ts tests/shared/user/send-code-security-source.test.ts
```

Expected: FAIL because forgot password still owns a bare sender and timer.

- [ ] **Step 3: Replace the forgot-password sender**

Import `SendCode` in `ForgotPasswordDialog.vue`, replace the code input/button block with:

```vue
<SendCode
  v-model="form.code"
  :account="form.account"
  scene="forget"
  :placeholder="t('auth.forget.codePlaceholder')"
  class="forgot-send-code"
/>
```

Remove `countdown`, `isSendingCode`, and `sendCode` props/events. Delete timer and sending logic from `useForgotPassword`, and remove the corresponding bindings from `Login/index.vue`.

In `forgot-password-source-quality.test.ts`, remove the `sendCode` mock and the obsolete `sendForgotCode()` error test; retain the reset-password unknown-error test and its `requireRequestErrorMessage(error, 'reset')` boundary.

Pass explicit format-disabled conditions in Security for phone and email, and change the component demo from unsupported uncontrolled `scene="login"` to `scene="bind_email"`.

- [ ] **Step 4: Run focused tests and typecheck**

```powershell
npm test -- --run tests/shared/user/users-api.test.ts tests/shared/user/forgot-password-source-quality.test.ts tests/shared/user/send-code-security-source.test.ts tests/shared/user/send-code-captcha-flow.test.ts tests/shared/user/login-captcha-state.test.ts
npm run typecheck
```

Expected: all focused tests and typecheck pass; no bare `UsersApi.sendCode` call remains outside captcha-completion flows.

### Task 6: Full verification and Docker-only acceptance

**Files:**
- Verify only; no application code expected.

- [ ] **Step 1: Run complete host-side verification**

```powershell
go test ./... -count=1
npm run typecheck
npm test
npm run lint
git diff --check
```

Expected: Go, typecheck, and Vitest exit 0; ESLint has zero errors; diff check is clean.

- [ ] **Step 2: Rebuild only through Docker**

From `admin_back_go`:

```powershell
pwsh -NoProfile -File scripts/docker-platform.ps1 stop
pwsh -NoProfile -File scripts/docker-platform.ps1 up
```

Expected: MySQL, Redis, API, worker, and frontend all become healthy; no volume deletion occurs.

- [ ] **Step 3: Verify backend rejection in the Docker runtime**

POST each scene without captcha to `http://127.0.0.1:8080/api/admin/v1/auth/send-code`.

Expected: every response is HTTP 400 with `msg=请完成验证码`; login account/type mismatch remains HTTP 400 before captcha consumption.

- [ ] **Step 4: Verify browser behavior**

At `http://127.0.0.1:5173`, inspect login, forgot password, personal phone, personal email, and code-based password change.

Expected: clicking send opens captcha; network contains only `GET /auth/captcha` before completion and no `POST /auth/send-code`; invalid account formats keep send disabled.
