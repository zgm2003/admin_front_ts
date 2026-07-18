# Admin Frontend Kernel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a deterministic Admin AppKernel with secure AuthSession, contract-driven ApiClient, atomic runtime routes, typed persistence, executable tests, and a blocking Docker-image verification gate.

**Architecture:** `AppKernel` is the only composition root and imports cause no I/O. Auth, HTTP, routing, persistence, realtime, and native behavior are injected modules. The backend Admin Contract Bundle is copied under an exact digest lock and generates transport/permission/view types reproducibly.

**Tech Stack:** Vue 3.5, TypeScript 5.9, Vite 8, Pinia 3, Vue Router 4, Axios 1.8, Zod 4.4.3, Vitest 4.0.7, Vue Test Utils 2.4.11, MSW 2.15.0.

---

## Target file map

- Create `src/app/*` for kernel/bootstrap state and Vue injection.
- Create `src/modules/auth/*`, `http/*`, `routing/*`, and `persistence/*`.
- Create `src/adapters/web/*` and a typed `src/adapters/native.ts` seam consumed by P08.
- Create `contracts/backend/admin/v1/*`, `contracts/backend/admin/lock.json`, and sync/check scripts.
- Create unit/component/integration test setup and replace auth/router source-string tests.
- Modify `main.ts`, `App.vue`, Login, Router, user/menu stores, and API entrypoints.
- Create `scripts/verify-frontend.ps1` and make Docker image verification the delivery gate.

### Task 1: Establish executable test layers and a mechanical lint baseline

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `vitest.config.ts`
- Create: `tests/setup/dom.ts`
- Create: `tests/helpers/render.ts`
- Create: `tests/helpers/fake-clock.ts`
- Modify: files changed by `eslint --fix` only
- Fix: `src/api/wallet/index.ts`
- Fix: `tests/shared/system/upload-config-copy.test.ts`

- [ ] **Step 1: Install exact dependencies**

```powershell
npm install --save-exact zod@4.4.3
npm install --save-dev --save-exact openapi-typescript@7.13.0 @vue/test-utils@2.4.11 happy-dom@20.10.6 @vitest/coverage-v8@4.0.7 msw@2.15.0 @playwright/test@1.61.1 @axe-core/playwright@4.12.1
```

- [ ] **Step 2: Split Vitest projects**

Define `unit` Node tests, `component` Happy DOM tests with `tests/setup/dom.ts`, and `integration` deterministic network/protocol tests. Include `src/app` and `src/modules` coverage with 80% statements/branches; do not count generated transport files.

- [ ] **Step 3: Apply only mechanical lint fixes**

Run:

```powershell
npx eslint . --fix
```

Replace the two empty wallet interfaces with type aliases to their actual bases and change the repeated-space regex to `/ {2}/`. Run `npm run typecheck` and `npm test`, inspect that the diff contains formatting/order fixes only, then commit:

```powershell
$mechanicalFiles = @(git diff --name-only --diff-filter=ACMRT -- src tests)
$allChangedFiles = @(git diff --name-only --diff-filter=ACMRT)
if ($mechanicalFiles.Count -eq 0) { throw "eslint produced no mechanical changes" }
if (Compare-Object $mechanicalFiles $allChangedFiles) { throw "mechanical commit contains a path outside src/tests" }
git add -- $mechanicalFiles
git diff --cached --check
git commit -m "style: apply deterministic frontend lint fixes"
```

- [ ] **Step 4: Record the ratcheting warning gate**

After auto-fix the measured ceiling is 82 warnings: 36 `max-lines`, 23 unused variables, 6 default-prop, 6 explicit-any, 4 prop mutation, 3 useless escape, 2 empty-object, 2 required-prop/default, 1 no-v-html, and 1 unused expression. Add `lint:baseline` as `eslint . --max-warnings 82`. P07 removes the remaining warnings and changes the final gate to zero.

- [ ] **Step 5: Verify and commit infrastructure**

```powershell
npm run lint:baseline
npm run typecheck
npm test
git add -- package.json package-lock.json vitest.config.ts tests/setup/dom.ts tests/helpers/render.ts tests/helpers/fake-clock.ts src/api/wallet/index.ts tests/shared/system/upload-config-copy.test.ts
git diff --cached --check
git commit -m "test: establish frontend behavior test layers"
```

### Task 2: Lock and generate the backend Admin contract

**Files:**
- Create: `contracts/backend/admin/v1/openapi.json`
- Create: `contracts/backend/admin/v1/permissions.json`
- Create: `contracts/backend/admin/v1/views.json`
- Create: `contracts/backend/admin/v1/realtime/envelope.schema.json`
- Create: `contracts/backend/admin/v1/realtime/events.schema.json`
- Create: `contracts/backend/admin/v1/manifest.json`
- Create: `contracts/backend/admin/lock.json`
- Create: `scripts/sync-admin-contract.mjs`
- Create: `scripts/check-admin-contract.mjs`
- Create: `scripts/generate-admin-types.mjs`
- Create: `src/modules/http/generated/admin.ts`
- Create: `src/modules/routing/generated/permissions.ts`
- Create: `src/modules/routing/generated/views.ts`
- Modify: `package.json`

- [ ] **Step 1: Write tamper and stale-generation tests**

Copy a fixture bundle, alter one byte, and assert sync/check rejects the artifact SHA. Generate twice and assert byte equality. Assert no generated operation path starts with `/api/app/` or `/api/canvas/`.

- [ ] **Step 2: Define the exact lock**

`sync-admin-contract.mjs` validates the backend manifest and constructs the lock from real values rather than a template:

```ts
const lock = {
  backend_commit: assertGitSha(manifest.backend_commit),
  bundle_version: assertBundleVersion(manifest.bundle_version),
  manifest_sha256: sha256(manifestBytes),
  artifacts: Object.fromEntries(requiredArtifacts.map((name) => [
    name,
    assertSha256(manifest.artifacts[name].sha256),
  ])),
}
```

`requiredArtifacts` is the literal five-file content list (`openapi.json`, `permissions.json`, `views.json`, and both realtime schemas); `manifest.json` is copied and hashed separately. The command `sync-admin-contract.mjs --backend E:/admin/admin_back_go --commit $BackendSourceCommit` requires the argument to equal `manifest.backend_commit`, requires that commit to be an ancestor of the clean backend checkout, and verifies every artifact hash. The generated-contract commit may be newer than the source commit because committing generated bytes is intentionally non-circular. The command fails on an unrelated checkout, an extra/missing artifact, or a hash that is not 64 lowercase hexadecimal characters.

- [ ] **Step 3: Generate types**

Run `openapi-typescript` for `admin.ts`. Generate permission codes as a literal `as const` array plus `PermissionCode` union and `ReadonlySet`. Generate backend view keys as a literal union. Sort every output and include the manifest SHA in a generated header.

- [ ] **Step 4: Verify and commit**

```powershell
$backendManifest = Get-Content -Raw E:/admin/admin_back_go/contracts/admin/v1/manifest.json | ConvertFrom-Json
$backendSourceCommit = $backendManifest.backend_commit
npm run contract:sync -- --backend E:/admin/admin_back_go --commit $backendSourceCommit
npm run contract:generate
npm run contract:check
npm run typecheck
git add -- contracts/backend/admin/v1/openapi.json contracts/backend/admin/v1/permissions.json contracts/backend/admin/v1/views.json contracts/backend/admin/v1/realtime/envelope.schema.json contracts/backend/admin/v1/realtime/events.schema.json contracts/backend/admin/v1/manifest.json contracts/backend/admin/lock.json scripts/sync-admin-contract.mjs scripts/check-admin-contract.mjs scripts/generate-admin-types.mjs src/modules/http/generated/admin.ts src/modules/routing/generated/permissions.ts src/modules/routing/generated/views.ts package.json
git diff --cached --check
git commit -m "build(contract): lock generated admin transport types"
```

Expected: check has no diff; every lock value matches the copied manifest; no App or Canvas operation exists.

### Task 3: Add strict environment and deterministic AppKernel bootstrap

**Files:**
- Create: `src/app/environment.ts`
- Create: `src/app/kernel.ts`
- Create: `src/app/state.ts`
- Create: `src/app/injection.ts`
- Create: `tests/unit/app/environment.test.ts`
- Create: `tests/integration/app/kernel.test.ts`
- Modify: `src/main.ts`
- Modify: `src/App.vue`

- [ ] **Step 1: Write state-transition tests**

Cover cold → restoring-session → anonymous, authenticated → loading-principal → installing-routes → ready, invalid config → failed, repeated bootstrap, disposal during principal load, and protected content never rendering before ready.

- [ ] **Step 2: Parse a closed Admin environment**

```ts
export interface AppEnvironment {
  mode: 'development' | 'production' | 'test'
  platform: 'admin'
  apiOrigin: URL
  realtimeOrigin: URL
  clientVariant: 'browser' | 'desktop'
}
export function parseEnvironment(input: ImportMetaEnv, location: Location): AppEnvironment
```

Production rejects loopback, non-HTTPS API, non-WSS realtime, mismatched origins, credentials/query/fragment in origins, and any platform other than `admin`. Remove user-agent platform inference.

- [ ] **Step 3: Implement the kernel state machine**

```ts
export type BootstrapState =
  | { kind: 'cold' }
  | { kind: 'restoring-session' }
  | { kind: 'anonymous' }
  | { kind: 'loading-principal' }
  | { kind: 'installing-routes' }
  | { kind: 'ready'; principal: PrincipalSnapshot }
  | { kind: 'failed'; error: ApiError }
export class AppKernel {
  readonly state: Readonly<ShallowRef<BootstrapState>>
  bootstrap(signal?: AbortSignal): Promise<BootstrapState>
  refreshPrincipal(reason: PrincipalRefreshReason): Promise<void>
  dispose(): Promise<void>
}
```

Serialize transitions through one promise chain. `dispose` aborts bootstrap/authenticated requests, disconnects realtime, removes runtime routes/listeners, and disposes adapters once.

- [ ] **Step 4: Mount only the neutral shell before bootstrap**

`main.ts` creates dependencies, provides the kernel, mounts `App.vue`, awaits Router readiness, then calls bootstrap. `App.vue` renders loading/fatal/login/protected branches from kernel state; protected `router-view` exists only for `ready`.

- [ ] **Step 5: Verify and commit**

```powershell
npm test -- --project unit --project integration
npm run typecheck
git add -- src/app src/main.ts src/App.vue tests/unit/app tests/integration/app
git commit -m "feat(app): serialize admin bootstrap in one kernel"
```

### Task 4: Implement AuthSession and secure credential adapters

**Files:**
- Create: `src/modules/auth/types.ts`
- Create: `src/modules/auth/session.ts`
- Create: `src/modules/auth/refresh-coordinator.ts`
- Create: `src/modules/auth/events.ts`
- Create: `src/adapters/web/browser-credentials.ts`
- Create: `src/adapters/web/browser-coordinator.ts`
- Create: `src/adapters/native.ts`
- Create: `tests/unit/auth/session.test.ts`
- Create: `tests/integration/auth/refresh-race.test.ts`

- [ ] **Step 1: Test the complete state machine**

Cover unknown/anonymous/authenticated/refreshing/logging-out/expired transitions, 20 simultaneous 401s, abort before/during replay, refresh timeout, offline retry, stale BroadcastChannel results, Web Locks unavailable, and logout cleanup ordering.

- [ ] **Step 2: Define read-only session state**

```ts
export type AuthState =
  | { kind: 'unknown' }
  | { kind: 'anonymous' }
  | { kind: 'authenticating' }
  | { kind: 'authenticated'; accessToken: string; expiresAt: number }
  | { kind: 'refreshing'; accessToken?: string }
  | { kind: 'logging-out' }
  | { kind: 'expired'; reason: 'revoked' | 'rotation-failed' | 'timeout' }
export interface CredentialAdapter {
  readonly variant: 'browser' | 'desktop'
  restore(signal: AbortSignal): Promise<AccessCredential | null>
  login(input: LoginCommand, signal: AbortSignal): Promise<AccessCredential>
  refresh(signal: AbortSignal): Promise<AccessCredential>
  revoke(accessToken: string | null, signal: AbortSignal): Promise<void>
  clear(): Promise<void>
}
```

`AuthSession` is the only owner of access tokens. It exposes a snapshot/event subscription and `withAccessToken`, not the credential value through Pinia or persistence.

- [ ] **Step 3: Implement one refresh flight**

Within a context, all callers await one stored promise. Browser coordination uses `navigator.locks.request("admin-auth-refresh")` when available and BroadcastChannel messages containing only nonce, outcome, and expiry; no credential crosses the channel. A tab that did not perform refresh calls the cookie-backed refresh endpoint after the winner signal, and server CAS remains correctness boundary.

The browser adapter uses `credentials:"include"`, `X-Admin-Client-Variant: browser`, and never reads cookies. The native interface requires `sealRefreshCredential` and `refreshAccessCredential`; P08 supplies its implementation.

- [ ] **Step 4: Implement ordered logout**

Freeze new authenticated calls, best-effort revoke, disconnect realtime, abort authenticated requests, remove routes, clear principal, clear identity persistence, call credential adapter clear, then navigate to login. Device theme/language remain.

- [ ] **Step 5: Verify and commit**

```powershell
npm test -- --project unit --project integration
npm run typecheck
git add -- src/modules/auth src/adapters/web src/adapters/native.ts tests/unit/auth tests/integration/auth
git commit -m "feat(auth): own credentials in a tested session state machine"
```

Do not delete the legacy file until Task 8 has no import of it.

### Task 5: Build typed ApiClient and ApiError

**Files:**
- Create: `src/modules/http/error.ts`
- Create: `src/modules/http/schema.ts`
- Create: `src/modules/http/operations.ts`
- Create: `src/modules/http/client.ts`
- Create: `src/modules/http/axios-adapter.ts`
- Create: `tests/unit/http/error.test.ts`
- Create: `tests/integration/http/client.test.ts`
- Modify: `src/lib/http/index.ts`

- [ ] **Step 1: Test timeout, cancel, replay, and contract failure**

Use MSW and fake timers. Verify safe GET replay after one refresh, mutation replay only with idempotency key, abort propagation, preserved timeout budget/request ID, 20 queued 401s, malformed envelope → contract error, and no UI notification inside transport.

- [ ] **Step 2: Define closed errors and operation policy**

```ts
export type ApiErrorKind =
  | 'authentication' | 'authorization' | 'validation' | 'business'
  | 'rate-limit' | 'network' | 'timeout' | 'dependency'
  | 'contract' | 'canceled' | 'internal'
export interface ApiError {
  readonly kind: ApiErrorKind
  readonly code?: string
  readonly retryable: boolean
  readonly messageKey: string
  readonly messageData?: Readonly<Record<string, string | number>>
  readonly requestId?: string
  readonly traceId?: string
  readonly status?: number
  readonly cause?: unknown
}
export interface Operation<TInput, TOutput> {
  readonly id: string
  readonly method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  readonly path: string
  readonly auth: 'public' | 'required'
  readonly timeout: 'interactive' | 'upload' | 'long'
  readonly replay: 'safe' | 'idempotency-key' | 'never'
  readonly responseSchema?: z.ZodType<TOutput>
  readonly telemetryName: string
}
```

- [ ] **Step 3: Keep Axios private**

`ApiClient.execute(operation,input,{signal,idempotencyKey})` constructs the generated path/query/body, gets an access credential through AuthSession, and maps Axios failures once. Unknown response/envelope shapes fail closed. Telemetry records operation/status/timing only, never headers, tokens, payment secrets, prompts, or bodies.

Critical Zod schemas cover auth/principal, payment mutation result, AI command state, export, and error envelope. Noncritical generated types remain compile-time until migrated.

- [ ] **Step 4: Provide a temporary typed compatibility facade**

`src/lib/http/index.ts` exports a facade backed by the injected ApiClient for existing feature APIs. It does not export Axios `service`. Add an architecture test rejecting imports of `axios` outside `src/modules/http/axios-adapter.ts`.

- [ ] **Step 5: Verify and commit**

```powershell
npm test -- --project unit --project integration
npm run typecheck
git add -- src/modules/http src/lib/http/index.ts tests/unit/http tests/integration/http
git commit -m "feat(http): enforce typed operation and error policy"
```

### Task 6: Install runtime routes atomically from closed contracts

**Files:**
- Create: `scripts/generate-view-registry.mjs`
- Create: `src/modules/routing/generated/local-views.ts`
- Create: `src/modules/routing/contracts.ts`
- Create: `src/modules/routing/registry.ts`
- Create: `src/modules/routing/guards.ts`
- Create: `tests/unit/routing/contracts.test.ts`
- Create: `tests/integration/routing/registry.test.ts`
- Modify: `src/router/index.ts`
- Modify: `src/router/view-registry.ts`
- Modify: `src/types/vue-router.d.ts`

- [ ] **Step 1: Generate a literal local view allowlist**

Scan only `src/views/Main/**/index.vue`, normalize to backend view keys, sort, and emit `localViewKeys as const` plus loader map. Duplicate normalized keys fail generation.

- [ ] **Step 2: Test invalid and repeated sets**

Cover duplicate name/path, missing parent, unsafe redirect, unknown view, invalid metadata, partial valid set with quarantine, repeated installation, identity replacement, tab/menu reconciliation, and allowed last-route restore.

- [ ] **Step 3: Define closed route contracts**

```ts
export interface RuntimeRoute {
  readonly name: RuntimeRouteName
  readonly path: RuntimeRoutePath
  readonly parentName: RuntimeRouteName | null
  readonly viewKey: BackendViewKey
  readonly menuId: string
  readonly permission?: PermissionCode
  readonly meta: {
    readonly titleKey: string
    readonly showMenu: boolean
    readonly pageLayout: 'card' | 'full' | 'centered'
  }
}
```

Validate with Zod. Unknown views enter a quarantined error list and do not become normal DeadPage routes. Install the valid set into a temporary validated plan, remove old callbacks, then add all new routes. Reconcile last route, tabs, and selected menu against the new names/permissions.

- [ ] **Step 4: Make guards read kernel/session only**

Guards await bootstrap for protected routes, redirect anonymous users with a validated relative redirect, and never inspect cookie/storage. Backend remains authorization boundary.

- [ ] **Step 5: Verify and commit**

```powershell
npm run routes:generate
npm test -- --project unit --project integration
npm run typecheck
git add -- scripts/generate-view-registry.mjs src/modules/routing src/router/index.ts src/router/view-registry.ts src/types/vue-router.d.ts tests/unit/routing tests/integration/routing package.json
git commit -m "feat(routing): replace runtime routes atomically"
```

### Task 7: Centralize versioned persistence

**Files:**
- Create: `src/modules/persistence/codec.ts`
- Create: `src/modules/persistence/store.ts`
- Create: `src/modules/persistence/namespaces.ts`
- Create: `src/modules/persistence/preferences.ts`
- Create: `src/adapters/web/storage.ts`
- Create: `tests/unit/persistence/store.test.ts`
- Create: `tests/shared/architecture/storage-boundary.test.ts`
- Modify: `src/store/menu.ts`
- Modify: `src/lib/http/device.ts`
- Delete after migration: `src/utils/storage.ts`

- [ ] **Step 1: Test corruption, versioning, limits, and logout**

Cover corrupt JSON, unknown version, migration, expiry, oversized value, quota error, device/user namespace separation, route/permission intersection, and clearing user state while retaining theme/language/device ID.

- [ ] **Step 2: Define codecs and namespaces**

```ts
export interface Codec<T> {
  readonly version: number
  readonly maxBytes: number
  decode(value: unknown): T
  migrate?(version: number, value: unknown): T | null
}
export type Namespace =
  | `admin:1:device`
  | `admin:1:user:${string}`
```

The implementation uses actual template-literal TypeScript types for those two strings. Tenant is absent.

- [ ] **Step 3: Migrate allowed values**

Device: device ID, theme, language, desktop window preference, remembered non-secret login account/type. User: validated tabs, table preferences, filters, last allowed route. Never persist credentials, principal, permission set, runtime routes, or authoritative API data.

Architecture guard rejects `localStorage`, `sessionStorage`, `document.cookie`, and `js-cookie` outside `src/adapters/web/storage.ts`. The adapter itself does not store credentials.

- [ ] **Step 4: Verify and commit**

```powershell
npm test -- --project unit
npm run typecheck
git add -- src/modules/persistence src/adapters/web/storage.ts src/store/menu.ts src/lib/http/device.ts tests/unit/persistence tests/shared/architecture/storage-boundary.test.ts
git commit -m "feat(persistence): namespace validated device and user state"
```

### Task 8: Migrate login, stores, and Router to the kernel

**Files:**
- Modify: `src/views/Login/composables/useLoginForm.ts`
- Modify: `src/views/Login/index.vue`
- Modify: `src/store/user.ts`
- Modify: `src/store/menu.ts`
- Modify: `src/router/index.ts`
- Modify: `src/router/guards.ts`
- Modify: `src/main.ts`
- Delete: `src/lib/http/auth-session.ts`
- Delete: `src/utils/storage.ts`
- Delete: `src/types/js-cookie.d.ts`
- Modify: `package.json` and `package-lock.json`
- Create: `tests/component/login/LoginForm.test.ts`
- Create: `tests/integration/app/logout.test.ts`

- [ ] **Step 1: Write behavior tests before migration**

Render login and prove config order, captcha path, browser login, desktop adapter handoff, failure display, successful kernel bootstrap, and no credential persistence. Logout test proves the exact cleanup sequence and protected-route removal.

- [ ] **Step 2: Replace page-owned authentication**

`useLoginForm` validates form/captcha and calls `kernel.auth.login`. It remembers account/type through Persistence but never receives a refresh cookie value on browser. It does not call `setupDynamicRoutes` or set cookies; successful AuthSession transition triggers kernel principal/routes.

User store becomes a presentation projection of kernel principal and stores `ReadonlySet<PermissionCode>`. Menu store persists only through Persistence. Router exports creation functions instead of a side-effect singleton where tests require isolation.

- [ ] **Step 3: Remove legacy credential dependencies**

Uninstall `js-cookie` and its types. Delete legacy auth/session/storage files. Search:

```powershell
rg -n "js-cookie|Cookies\.|access_token|refresh_token|localStorage|sessionStorage|document\.cookie" src
```

Expected matches are generated response field names, AuthSession memory fields, native adapter calls, and the one web storage adapter only; no component/store/guard direct access.

- [ ] **Step 4: Verify and commit**

```powershell
npm uninstall js-cookie
npm test -- --project component --project integration
npm run typecheck
npm run lint:baseline
git add -- src/views/Login/composables/useLoginForm.ts src/views/Login/index.vue src/store/user.ts src/store/menu.ts src/router/index.ts src/router/guards.ts src/main.ts package.json package-lock.json tests/component/login/LoginForm.test.ts tests/integration/app/logout.test.ts
git add -u -- src/lib/http/auth-session.ts src/utils/storage.ts src/types/js-cookie.d.ts
git diff --cached --check
git commit -m "refactor(app): route login and logout through the kernel"
```

### Task 9: Verify once and deliver only a Docker image

**Files:**
- Create: `scripts/verify-frontend.ps1`
- Create: `tests/shared/deployment/docker-only-delivery.test.ts`
- Modify: `.gitignore`
- Modify: `.dockerignore`
- Delete: `.github/`
- Delete: `.worktrees/`
- Modify: `docs/deployment/github-actions-scp.md`

- [ ] **Step 1: Guard the Docker-only boundary**

The test requires both repositories to have no `.github` or `.worktrees` directory, no registered secondary worktree, and no worktree ignore rule. It rejects SCP, `dist.tar.gz`, Vite/Go host startup, or any deployable archive path.

- [ ] **Step 2: Implement the shared source and image verifier**

```powershell
$ErrorActionPreference = "Stop"
npm ci
npm run contract:check
npm run routes:generate
npm run lint:baseline
npm run typecheck
npm test -- --coverage
docker build --build-arg BUILD_REVISION=$GitSha --tag admin-frontend:$GitSha .
docker image inspect admin-frontend:$GitSha
```

The verifier requires the exact clean checkout commit, performs no host-side production build, and treats the resulting Docker image as the only release candidate. It verifies the revision label, unprivileged runtime user, healthcheck, and exposed port.

- [ ] **Step 3: Keep Compose as the only runtime entry**

Local integrated acceptance runs only through `E:/admin/admin_back_go/scripts/docker-platform.ps1 up`. The backend Compose file builds the same frontend Dockerfile and starts the resulting image with `--no-build`. No registry or remote host contract is added until the operator specifies one.

- [ ] **Step 4: Verify and commit**

```powershell
pwsh -NoProfile -File scripts/verify-frontend.ps1
npm test -- tests/shared/deployment/docker-only-delivery.test.ts
git add -- scripts/verify-frontend.ps1 .gitignore .dockerignore docs/deployment/github-actions-scp.md tests/shared/deployment/docker-only-delivery.test.ts
git add -u -- .github
git commit -m "build(docker): verify the frontend image as the release unit"
```

## Plan completion gate

```powershell
npm ci
pwsh -NoProfile -File scripts/verify-frontend.ps1
rg -n "js-cookie|Cookies\.|document\.cookie" src
git status --short
```

Expected: kernel transitions, auth races, HTTP replay, route replacement, and persistence tests pass; contract generation is clean; no production code reads credential cookies/storage; the verified release candidate is one revision-labelled Docker image; status is clean.
