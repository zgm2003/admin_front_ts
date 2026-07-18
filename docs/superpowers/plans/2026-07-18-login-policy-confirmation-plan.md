# Login Policy Confirmation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Require one explicit, page-local policy consent action while preserving Enter-to-submit login behavior.

**Architecture:** `useLoginForm` remains the single owner of login intent and adds a closed consent gate plus one deferred submission intent. A focused `LoginPolicyConfirmDialog` renders the existing shared `AppDialog`; `Login/index.vue` only wires state and commands. No API, AppKernel, captcha, or persistence contract changes.

**Tech Stack:** Vue 3 Composition API, TypeScript, Element Plus, vue-i18n, Vitest, Vue Test Utils, Docker/Compose.

**Execution constraints:** Work directly on `master` by operator instruction, create no worktree, and start/rebuild the application only through Docker/Compose.

---

## File responsibilities

- `src/views/Login/composables/useLoginForm.ts`: owns page-local consent, deferred submit intent, confirm/cancel commands, and the existing login flow.
- `src/views/Login/components/LoginPolicyConfirmDialog.vue`: presentational dialog only; emits confirm, cancel, policy-link, and terms-link events.
- `src/views/Login/index.vue`: connects composable state to the dialog.
- `src/i18n/locales/zh-CN.ts`, `src/i18n/locales/en-US.ts`: exact localized dialog copy.
- `tests/component/login/LoginForm.test.ts`: proves the consent gate cannot invoke captcha or AppKernel before explicit confirmation.
- `tests/component/login/LoginPolicyConfirmDialog.test.ts`: proves dialog buttons and close behavior emit the exact commands.

### Task 1: Gate every login submission on explicit page-local consent

**Files:**
- Modify: `tests/component/login/LoginForm.test.ts`
- Modify: `src/views/Login/composables/useLoginForm.ts`

- [x] **Step 1: Write failing consent-flow tests**

Add tests that initialize a valid password form, call `handleSubmit()` while unchecked, and assert:

```ts
expect(login.policyConfirmVisible.value).toBe(true)
expect(mocks.getCaptcha).not.toHaveBeenCalled()
expect(mocks.kernelLogin).not.toHaveBeenCalled()
```

Then cover cancellation and confirmation:

```ts
login.cancelPolicyConfirmation()
expect(login.agreePolicy.value).toBe(false)

await login.handleSubmit()
await login.confirmPolicyAndContinue()
expect(login.agreePolicy.value).toBe(true)
expect(mocks.getCaptcha).toHaveBeenCalledTimes(1)
```

Also assert repeated unchecked submission opens only the same Boolean dialog state, already-checked submission skips the dialog, and `openService()` / `openPolicy()` do not change consent.

- [x] **Step 2: Run the test and verify RED**

Run:

```powershell
npm test -- tests/component/login/LoginForm.test.ts
```

Expected: FAIL because `policyConfirmVisible`, `confirmPolicyAndContinue`, and `cancelPolicyConfirmation` do not exist and the current code emits `policyRequired` instead of opening a dialog.

- [x] **Step 3: Implement the minimal closed consent gate**

Add page-local state and a private submission continuation:

```ts
const policyConfirmVisible = ref(false)
let policySubmitPending = false

const continueSubmit = async () => {
  // existing validation, password captcha, and code-login body
}

const handleSubmit = async () => {
  if (!agreePolicy.value) {
    policySubmitPending = true
    policyConfirmVisible.value = true
    return
  }
  await continueSubmit()
}

const confirmPolicyAndContinue = async () => {
  if (!policySubmitPending) return
  policySubmitPending = false
  agreePolicy.value = true
  policyConfirmVisible.value = false
  await continueSubmit()
}

const cancelPolicyConfirmation = () => {
  policySubmitPending = false
  policyConfirmVisible.value = false
}
```

Return those members from the composable. Change `openService()` and `openPolicy()` so they only show their existing informational messages and never set `agreePolicy`.

- [x] **Step 4: Run focused tests and verify GREEN**

Run:

```powershell
npm test -- tests/component/login/LoginForm.test.ts
```

Expected: all login-form tests pass; unchecked submission causes zero captcha/API work until explicit confirmation.

- [x] **Step 5: Commit the consent state machine**

```powershell
git add -- src/views/Login/composables/useLoginForm.ts tests/component/login/LoginForm.test.ts
git diff --cached --check
git commit -m "feat(login): require explicit policy confirmation"
```

### Task 2: Render the shared policy confirmation dialog

**Files:**
- Create: `src/views/Login/components/LoginPolicyConfirmDialog.vue`
- Create: `tests/component/login/LoginPolicyConfirmDialog.test.ts`
- Modify: `src/views/Login/index.vue`
- Modify: `src/i18n/locales/zh-CN.ts`
- Modify: `src/i18n/locales/en-US.ts`

- [x] **Step 1: Write a failing dialog component test**

Mount the component with Element Plus controls stubbed and assert:

```ts
await wrapper.get('[data-testid="policy-confirm"]').trigger('click')
expect(wrapper.emitted('confirm')).toHaveLength(1)

await wrapper.get('[data-testid="policy-cancel"]').trigger('click')
expect(wrapper.emitted('cancel')).toHaveLength(1)
```

Also invoke the `AppDialog` model update with `false` and assert it emits `cancel`, and assert the terms/privacy controls emit `openService`/`openPolicy` without emitting `confirm`.

- [x] **Step 2: Run the test and verify RED**

Run:

```powershell
npm test -- tests/component/login/LoginPolicyConfirmDialog.test.ts
```

Expected: FAIL because `LoginPolicyConfirmDialog.vue` does not exist.

- [x] **Step 3: Implement the focused dialog and localized copy**

Create a component based on the shared dialog boundary:

```vue
<AppDialog
  :model-value="visible"
  :title="t('loginPage.policyConfirm.title')"
  width="440px"
  align-center
  append-to-body
  destroy-on-close
  @update:model-value="handleVisibleChange"
>
  <p>{{ t('loginPage.policyConfirm.description') }}</p>
  <button @click="$emit('openService')">{{ t('loginPage.form.serviceTerms') }}</button>
  <button @click="$emit('openPolicy')">{{ t('loginPage.form.privacyPolicy') }}</button>
  <template #footer>
    <el-button data-testid="policy-cancel" @click="$emit('cancel')">{{ t('loginPage.policyConfirm.cancel') }}</el-button>
    <el-button data-testid="policy-confirm" type="primary" @click="$emit('confirm')">{{ t('loginPage.policyConfirm.confirm') }}</el-button>
  </template>
</AppDialog>
```

Use these exact meanings in both locale files:

```ts
policyConfirm: {
  title: '请确认服务条款与隐私政策',
  description: '登录前，请阅读并同意服务条款和隐私政策。仅本次登录页面有效。',
  cancel: '取消',
  confirm: '同意并继续',
}
```

Wire the component in `Login/index.vue` to `policyConfirmVisible`, `confirmPolicyAndContinue`, `cancelPolicyConfirmation`, `openService`, and `openPolicy`.

- [x] **Step 4: Run dialog and login tests and verify GREEN**

Run:

```powershell
npm test -- tests/component/login/LoginPolicyConfirmDialog.test.ts tests/component/login/LoginForm.test.ts
```

Expected: both files pass; confirm/cancel/link events remain distinct.

- [x] **Step 5: Commit the dialog integration**

```powershell
git add -- src/views/Login/components/LoginPolicyConfirmDialog.vue src/views/Login/index.vue src/i18n/locales/zh-CN.ts src/i18n/locales/en-US.ts tests/component/login/LoginPolicyConfirmDialog.test.ts
git diff --cached --check
git commit -m "feat(login): add policy confirmation dialog"
```

### Task 3: Verify, rebuild, and restart only with Docker

**Files:**
- Modify: `docs/superpowers/plans/2026-07-18-login-policy-confirmation-plan.md`

- [x] **Step 1: Run frontend gates**

```powershell
npm run lint:baseline
npm run typecheck
npm run contract:check
npm run routes:generate
npm test
git diff --check
```

Expected: zero errors, lint at or below the 82-warning ratchet, generated contracts/routes unchanged, and all tests pass.

- [x] **Step 2: Audit architecture and consent boundaries**

```powershell
rg -n "agreePolicy\.value = true|policySubmitPending|policyConfirmVisible" src/views/Login
rg -n "localStorage|sessionStorage|document\.cookie|UsersApi|kernel\.login" src/views/Login/components/LoginPolicyConfirmDialog.vue
```

Expected: consent becomes true only in the explicit confirm command or direct checkbox model update; the dialog contains no storage, cookie, API, or kernel access.

- [x] **Step 3: Commit plan evidence before the clean-checkout image build**

Mark completed steps and append exact test/Docker evidence, then:

```powershell
git add -- docs/superpowers/plans/2026-07-18-login-policy-confirmation-plan.md
git diff --cached --check
git commit -m "docs(login): record policy confirmation evidence"
```

- [x] **Step 4: Build and restart through the sole Compose lifecycle**

```powershell
cd E:/admin/admin_back_go
pwsh -NoProfile -File scripts/docker-platform.ps1 up
pwsh -NoProfile -File scripts/docker-platform.ps1 status
curl.exe -fsS http://127.0.0.1:5173/healthz
curl.exe -fsS http://127.0.0.1:8080/health
curl.exe -fsS http://127.0.0.1:8080/ready
```

Expected: all five containers are healthy and all endpoints succeed. No host Vite or Go application process is started.

- [x] **Step 5: Verify the final repository and runtime revision**

```powershell
git -C E:/admin/admin_front_ts status --short
git -C E:/admin/admin_back_go status --short
docker image inspect admin-frontend:local
```

Expected: both repositories are clean and the frontend image revision label equals frontend `HEAD`.

---

## Verification evidence

- Branch/workspace: direct checkout `E:/admin/admin_front_ts` on `master`; no worktree used.
- Consent gate RED (2026-07-18): `LoginForm.test.ts` failed 5 of 7 tests because the confirmation state and commands did not exist and terms links still granted consent.
- Consent gate GREEN: `LoginForm.test.ts` passed 7 of 7 tests; commit `435ee3c`.
- Dialog RED: `LoginPolicyConfirmDialog.test.ts` failed import resolution because the component did not exist.
- Dialog GREEN: dialog and login focused suites passed 10 of 10 tests; commit `e40f690`.
- Lint gate: 0 errors and 82 baseline warnings (ratchet maximum: 82).
- Type gate: `vue-tsc -b` exited 0.
- Contract gate: hash `60379e7aa488dfcf64da72ef093a6b49ec5414c4ac29a3ba1356939ee0514381` verified.
- Route gate: 68 Admin view loaders generated with no repository diff.
- Full test gate: 134 files passed, 458 tests passed.
- Architecture audit: `agreePolicy.value = true` exists only in `confirmPolicyAndContinue`; the dialog has no storage, cookie, API, AppKernel, fallback-field, or compatibility logic.
- Docker build gate: `scripts/docker-platform.ps1 up` exited 0; the frontend ran `vue-tsc -b && vite build`, and the backend image ran `go test ./...` before startup.
- Runtime gate: MySQL, Redis, Admin API, Admin worker, and frontend all reported `healthy`.
- Health probes: frontend returned `ok`; `/health` returned `status: ok`; `/ready` returned `status: ready` with database, Redis, queue, realtime, and token checks up.
- Revision gate before this final evidence commit: frontend image revision `875dd3b0493ca8a4364e571ccfbb196d52e82532` exactly matched the then-current frontend `HEAD`. The Compose lifecycle is rerun after this evidence commit to stamp and verify the final revision.
