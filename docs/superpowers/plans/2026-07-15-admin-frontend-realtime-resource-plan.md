# Admin Frontend Realtime, Resource, and Quality Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task directly on `master`. Do not use subagents or worktrees unless the user explicitly changes that rule. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add typed recoverable realtime, latest-wins ResourceQuery/mutations, migrate feature APIs and tables, replace source-heavy tests with behavior tests, and meet zero-warning, bundle, Docker-runtime, and WCAG 2.2 AA gates.

**Architecture:** Realtime and resource orchestration are stateful modules owned by AppKernel. Feature workflows consume typed domain events and query/mutation objects, never raw WebSocket/Axios. Shared UI remains focused; pages split only where behavior, state, or presentation has a real boundary.

**Tech Stack:** Vue 3.5, TypeScript 5.9, Vitest, Vue Test Utils, MSW, axe-core 4.12.1, Docker Compose, PowerShell 7.

---

## Docker-only runtime and explicit browser-tool policy

P07 Tasks 1–5 started after the user accepted P06 and are complete. The P08R Browser-only retirement prerequisite and user acceptance are now complete; Tasks 6–10 are active next but have not started. API, worker, frontend, MySQL, and Redis runtime processes are started only by `admin_back_go/scripts/docker-platform.ps1`; no task starts Vite, Go binaries, MySQL, or Redis on the host. Static TypeScript/Vitest/build checks run through `node:22.23.1-alpine`.

Until Task 10 creates `scripts/docker-frontend-gate.ps1`, every `npm` or `node` command shown in Tasks 1-9 is the inner command for an equivalent `node:22.23.1-alpine` one-shot container mounted at `/workspace`; it is not permission to execute a host runtime. After Task 10, use the wrapper exclusively.

Playwright is outside this plan. Do not install it, create browser-test files, or add a browser gate. It may be used only in a later task where the user explicitly requests it. Real UI acceptance belongs to the versioned manual checklist created in Task 9, and only the user may mark that checklist accepted.

### Task 1: Implement typed RealtimeClient with resume

**Files:**
- Create: `src/modules/realtime/protocol.ts`
- Create: `src/modules/realtime/transport.ts`
- Create: `src/modules/realtime/client.ts`
- Create: `src/modules/realtime/subscriptions.ts`
- Create: `src/adapters/web/websocket.ts`
- Create: `tests/unit/realtime/protocol.test.ts`
- Create: `tests/integration/realtime/client.test.ts`
- Modify: `src/app/kernel.ts`
- Delete after migration: `src/lib/realtime/websocket-client.ts` and `message-bus.ts`

- [x] **Step 1: Test lifecycle and failure policy**

Cover connect/open/handshake/ready, handshake-only retry reset, exponential jitter with fake RNG/clock, permanent auth attempt budget, offline/visibility pause, one connection per authenticated kernel, malformed/unknown messages, handler isolation, duplicate event IDs, cursor monotonicity, resume, resync-required, subscription restore, bounded control buffer, and logout purge.

- [x] **Step 2: Define the closed protocol**

```ts
export type RealtimeEventMap = {
  'realtime.connected.v1': ConnectedPayload
  'realtime.subscribed.v1': SubscribedPayload
  'realtime.resync_required.v1': ResyncRequiredPayload
  'notification.created.v1': NotificationCreatedPayload
  'ai.response.start.v1': AIStartPayload
  'ai.response.delta.v1': AIDeltaPayload
  'ai.response.completed.v1': AICompletedPayload
  'ai.response.failed.v1': AIFailedPayload
  'ai.response.canceled.v1': AICanceledPayload
}
export interface Envelope<K extends keyof RealtimeEventMap> {
  event_id: string
  type: K
  request_id?: string
  sequence: number
  occurred_at: string
  durability: 'ephemeral' | 'durable'
  data: RealtimeEventMap[K]
}
```

Build Zod schemas from the locked backend artifacts. No `| string` and no `Record<string,unknown>` payload escape.

- [x] **Step 3: Implement client policy**

Use the P04 one-time ticket endpoint before opening WebSocket. Backoff is `min(30s,500ms*2^attempt)+uniform(0,25%)`. Only a validated connected envelope marks ready/resets failures. Keep a 512-ID LRU dedupe and persist only the durable cursor through user-scoped Persistence. Reference-count topics; restore them after handshake. Buffer at most 32 replay-safe subscribe/resume controls, never domain mutations.

- [x] **Step 4: Recover durable truth**

On reconnect send `realtime.resume.v1` with last durable sequence. Apply terminal events in sequence order. On resync-required call notification/AI command authoritative queries, then set returned cursor. Ephemeral deltas are never reconstructed or persisted.

- [x] **Step 5: Verify and commit**

```powershell
npm test -- --project unit --project integration
npm run typecheck
git add -- src/modules/realtime/protocol.ts src/modules/realtime/transport.ts src/modules/realtime/client.ts src/modules/realtime/subscriptions.ts src/adapters/web/websocket.ts src/app/kernel.ts tests/unit/realtime/protocol.test.ts tests/integration/realtime/client.test.ts
git diff --cached --check
git commit -m "feat(realtime): resume typed terminal events by cursor"
```

### Task 2: Add latest-wins ResourceQuery

**Files:**
- Create: `src/modules/resource-query/types.ts`
- Create: `src/modules/resource-query/query.ts`
- Create: `src/modules/resource-query/vue.ts`
- Create: `tests/unit/resource-query/query.test.ts`
- Modify: `src/components/Table/src/useTable.ts`
- Modify: `tests/shared/table/useTable.test.ts`

- [x] **Step 1: Write reverse-order and cancellation tests**

Start search A, then B; resolve B then A. Assert B owns data/loading/error. Cover abort, preserved-data refresh, empty, retry, selection intersection, reset, page-size normalization, and deletion fallback from an empty page to the previous page.

- [x] **Step 2: Define state and request ownership**

```ts
export type ResourceState<T> =
  | { kind: 'idle'; data: readonly T[] }
  | { kind: 'loading'; data: readonly T[]; requestId: number }
  | { kind: 'refreshing'; data: readonly T[]; requestId: number }
  | { kind: 'success'; data: readonly T[] }
  | { kind: 'empty'; data: readonly [] }
  | { kind: 'error'; data: readonly T[]; error: ApiError }
export interface ResourceQuery<TItem, TParams, TPage> {
  readonly state: Readonly<ShallowRef<ResourceState<TItem>>>
  execute(params: TParams): Promise<TPage>
  refresh(): Promise<TPage>
  retry(): Promise<TPage>
  reset(): void
  dispose(): void
}
```

Each execution increments a sequence, aborts the previous controller, and commits state only if it still owns the sequence. A stale request can neither replace data nor clear loading.

- [x] **Step 3: Adapt AppTable**

`useTable` becomes a Vue adapter over ResourceQuery. Search/page/refresh return promises. Selection keys reconcile with new stable IDs. Errors propagate; the component decides inline/toast policy.

- [x] **Step 4: Verify and commit**

```powershell
npm test -- --project unit tests/shared/table/useTable.test.ts
npm run typecheck
git add -- src/modules/resource-query/types.ts src/modules/resource-query/query.ts src/modules/resource-query/vue.ts src/components/Table/src/useTable.ts tests/unit/resource-query/query.test.ts tests/shared/table/useTable.test.ts
git diff --cached --check
git commit -m "feat(query): enforce latest-wins table resources"
```

### Task 3: Separate mutations and close table/search extension types

**Files:**
- Create: `src/modules/resource-query/mutation.ts`
- Create: `tests/unit/resource-query/mutation.test.ts`
- Modify: `src/hooks/useCrudTable.ts`
- Modify: `src/components/Table/src/types.ts`
- Modify: `src/components/Search/types.ts`
- Modify: `src/components/Table/src/index.vue`
- Modify: `src/components/Search/src/index.vue`
- Modify: `tests/shared/table/useTable.test.ts`
- Modify: `tests/shared/table/useCrudTable.test.ts`
- Modify: `tests/shared/table/remote-select-contract.test.ts`
- Modify: `tests/shared/table/shared-primitives-quality.test.ts`

- [x] **Step 1: Test mutation policy**

Cover confirmation cancel, pending dedupe, required idempotency key, typed failure, success invalidation, selection clear, and empty-page fallback. Query errors must not be swallowed.

- [x] **Step 2: Define separate orchestration**

```ts
export interface MutationSpec<TInput,TOutput> {
  key(input: TInput): string
  confirm?: (input: TInput) => Promise<boolean>
  execute(input: TInput, options: { signal: AbortSignal; idempotencyKey?: string }): Promise<TOutput>
  invalidate: readonly ResourceQuery<unknown,unknown,unknown>[]
}
```

`Mutation` owns pending identity and invalidation, not form fields, columns, or business validation.

- [x] **Step 3: Close UI types**

`TableColumn<Row>` is a union of property column (`prop: keyof Row`) and derived column (`key` plus typed formatter); remove the open index signature. `SearchField<Model,K extends keyof Model>` binds keys to compatible value/control types. Keep an explicit `elementProps` object typed from Element Plus props rather than arbitrary top-level unknown values.

- [x] **Step 4: Verify and commit**

```powershell
npm test -- --project unit tests/shared/table
npm run typecheck
git add -- src/modules/resource-query/mutation.ts src/hooks/useCrudTable.ts src/components/Table/src/types.ts src/components/Table/src/index.vue src/components/Search/types.ts src/components/Search/src/index.vue tests/unit/resource-query/mutation.test.ts tests/shared/table/useTable.test.ts tests/shared/table/useCrudTable.test.ts tests/shared/table/remote-select-contract.test.ts tests/shared/table/shared-primitives-quality.test.ts
git diff --cached --check
git commit -m "refactor(table): separate mutations and close extension types"
```

### Task 4: Migrate feature workflows to typed HTTP/realtime/resources

**Files:**
- Modify: `src/api/ai/agents.ts`
- Modify: `src/api/ai/chat.ts`
- Modify: `src/api/ai/chat-events.ts`
- Modify: `src/api/ai/conversations.ts`
- Modify: `src/api/ai/knowledge.ts`
- Modify: `src/api/ai/messages.ts`
- Modify: `src/api/ai/prompts.ts`
- Modify: `src/api/ai/providers.ts`
- Modify: `src/api/ai/runs.ts`
- Modify: `src/api/ai/tools.ts`
- Modify: `src/api/payment/config.ts`
- Modify: `src/api/payment/recharges.ts`
- Modify: `src/api/permission/authPlatform.ts`
- Modify: `src/api/permission/permission.ts`
- Modify: `src/api/permission/role.ts`
- Modify: `src/api/system/clientVersion.ts`
- Modify: `src/api/system/cronTask.ts`
- Modify: `src/api/system/exportTask.ts`
- Modify: `src/api/system/log.ts`
- Modify: `src/api/system/mail.ts`
- Modify: `src/api/system/notification.ts`
- Modify: `src/api/system/notificationTask.ts`
- Modify: `src/api/system/operationLog.ts`
- Modify: `src/api/system/queueMonitor.ts`
- Modify: `src/api/system/setting.ts`
- Modify: `src/api/system/sms.ts`
- Modify: `src/api/system/uploadConfig.ts`
- Modify: `src/api/system/uploadToken.ts`
- Modify: `src/api/user/users.ts`
- Modify: `src/api/user/usersLoginLog.ts`
- Modify: `src/api/wallet/index.ts`
- Create: `src/modules/http/generated/operations.ts`
- Create: `src/features/user-management/workflow.ts`
- Create: `src/features/notifications/workflow.ts`
- Create: `src/features/exports/workflow.ts`
- Create: `src/features/ai-chat/workflow.ts`
- Create: `src/features/ai-runs/workflow.ts`
- Modify: `src/views/Main/user/userManager/components/UserList/index.vue`
- Modify: `src/views/Main/notification/index.vue`
- Modify: `src/views/Main/system/exportTask/index.vue`
- Modify: `src/views/Main/ai/chat/index.vue`
- Modify: `src/views/Main/ai/chat/composables/useConversations.ts`
- Modify: `src/views/Main/ai/chat/composables/useConversationSessions.ts`
- Modify: `src/views/Main/ai/chat/composables/useConversationSocket.ts`
- Modify: `src/views/Main/ai/runs/index.vue`
- Modify: `src/views/Main/ai/runs/components/RunList/index.vue`
- Modify: `src/views/Main/ai/runs/components/RunStats/index.vue`
- Create: `tests/integration/features/user-management.test.ts`
- Create: `tests/integration/features/notifications.test.ts`
- Create: `tests/integration/features/exports.test.ts`
- Create: `tests/integration/features/ai-chat.test.ts`
- Create: `tests/integration/features/ai-runs.test.ts`

- [x] **Step 1: Generate and use operation descriptors**

Generate `src/modules/http/generated/operations.ts` from OpenAPI operation IDs. Every existing API wrapper calls `kernel.api.execute` with one descriptor and typed input. Add a guard rejecting imports of raw Axios/service and literal `/api/` URLs outside generated descriptors.

- [x] **Step 2: Migrate representative workflows first**

For user list, notification list/read/delete, export list/delete, AI run list/detail, and AI conversation:

- own ResourceQuery and Mutation instances in a feature workflow;
- abort on route disposal;
- return promises for search/page/refresh;
- choose inline/toast/silent policy at the feature boundary;
- use typed realtime domain events only;
- recover terminal AI/notification state through authoritative queries.

Test reverse-order list results, failed mutation with preserved data, deletion page fallback, notification dedupe/resume, AI completion/cancel/reconnect, and contract failure.

- [x] **Step 3: Migrate remaining API wrappers**

Migrate AI agents/knowledge/prompts/providers/tools, payment config/recharges/wallet, auth platform/permission/role, client version/cron/log/mail/SMS/operation log/queue monitor/settings/upload, and login-log/profile APIs. Special pages may keep custom workflows; they must still use typed ApiClient and AbortSignal.

- [x] **Step 4: Verify and commit**

```powershell
npm test -- --project integration tests/integration/features
npm run typecheck
rg -n "from ['\"]axios|service\.|['\"]/api/" src --glob "!src/modules/http/generated/**" --glob "!src/modules/http/axios-adapter.ts"
$apiFiles = @(
  'src/api/ai/agents.ts','src/api/ai/chat.ts','src/api/ai/chat-events.ts','src/api/ai/conversations.ts','src/api/ai/knowledge.ts','src/api/ai/messages.ts','src/api/ai/prompts.ts','src/api/ai/providers.ts','src/api/ai/runs.ts','src/api/ai/tools.ts','src/api/payment/config.ts','src/api/payment/recharges.ts','src/api/permission/authPlatform.ts','src/api/permission/permission.ts','src/api/permission/role.ts','src/api/system/clientVersion.ts','src/api/system/cronTask.ts','src/api/system/exportTask.ts','src/api/system/log.ts','src/api/system/mail.ts','src/api/system/notification.ts','src/api/system/notificationTask.ts','src/api/system/operationLog.ts','src/api/system/queueMonitor.ts','src/api/system/setting.ts','src/api/system/sms.ts','src/api/system/uploadConfig.ts','src/api/system/uploadToken.ts','src/api/user/users.ts','src/api/user/usersLoginLog.ts','src/api/wallet/index.ts'
)
git add -- $apiFiles src/modules/http/generated/operations.ts src/features/user-management/workflow.ts src/features/notifications/workflow.ts src/features/exports/workflow.ts src/features/ai-chat/workflow.ts src/features/ai-runs/workflow.ts src/views/Main/user/userManager/components/UserList/index.vue src/views/Main/notification/index.vue src/views/Main/system/exportTask/index.vue src/views/Main/ai/chat/index.vue src/views/Main/ai/chat/composables/useConversations.ts src/views/Main/ai/chat/composables/useConversationSessions.ts src/views/Main/ai/chat/composables/useConversationSocket.ts src/views/Main/ai/runs/index.vue src/views/Main/ai/runs/components/RunList/index.vue src/views/Main/ai/runs/components/RunStats/index.vue tests/integration/features/user-management.test.ts tests/integration/features/notifications.test.ts tests/integration/features/exports.test.ts tests/integration/features/ai-chat.test.ts tests/integration/features/ai-runs.test.ts
git diff --cached --check
git commit -m "refactor(features): consume typed query and realtime workflows"
```

Expected: search/page races are latest-wins; no feature imports Axios or raw WebSocket.

### Task 5: Replace source-heavy tests with behavior tests

**Files:**
- Create: `scripts/audit-test-architecture.mjs`
- Create: `scripts/test-migration-manifest.json`
- Modify/delete: source-text suites under `tests/shared`
- Create: component/integration replacements under `tests/component` and `tests/integration`
- Modify: `package.json`

- [x] **Step 1: Add an executable test audit**

The manifest records every current source-reading suite by exact path with one of `delete`, `replace`, or `retain-guard`, plus the exact replacement test path for `replace`. The script rejects missing files, duplicate entries, replacement collisions, or a source reader absent from the manifest. It parses test imports/file reads, classifies direct production behavior versus source-text guards, prints counts, and fails when source-text suites are 20% or more. Architecture/security guards are the only retained source readers and are listed by exact path in the manifest.

- [x] **Step 2: Convert critical suites**

Replace text assertions for auth, router, realtime, table/query, notification, payment, user/RBAC, export, AI conversation/run, dialog, and network behavior with imports, mounted Vue components, MSW, fake clocks, and fake WebSocket transports. Delete assertions that only count strings or lines and add no behavior.

- [x] **Step 3: Enforce core coverage**

Configure 80% statements and branches separately for `src/app`, `src/modules/auth`, `http`, `routing`, `realtime`, `resource-query`, and `persistence`. Add explicit transition tests until each directory passes; do not hide misses through aggregate application coverage.

- [x] **Step 4: Verify and commit**

```powershell
npm test -- --coverage
node scripts/audit-test-architecture.mjs
$migrationFiles = @(node scripts/audit-test-architecture.mjs --migration-files)
if ($LASTEXITCODE -ne 0 -or $migrationFiles.Count -eq 0) { throw "test migration manifest produced no files" }
git add -- scripts/audit-test-architecture.mjs scripts/test-migration-manifest.json package.json $migrationFiles
git diff --cached --check
git commit -m "test: replace source assertions with executable behavior"
```

Expected: source-text suites are below 20%; all core modules meet both coverage thresholds.

#### P07 Tasks 1–5 checkpoint evidence (2026-07-19)

- Execution boundary: `master` checkout only; no worktree, host runtime, or browser automation was used. All Node checks ran in `node:22.23.1-alpine` Docker containers.
- Contract lock: backend `aff99f2c8a949f90c39f1149308591b8b5f1f51b`, manifest `64e6d06da13471b891bd165b8729d12802f575936ec1563607ae4eff736a9295`, OpenAPI `3db932285afe4325315e7263fe81245334197e6c8385596901728e7d896ec509`.
- Task commits: `2aae720` (realtime), `0c1a887` (latest-wins query), `fd793c4` (mutations/closed UI types), `5a38b00` (behavior-test migration), `3158407` + `1be5170` + `c6fb927` + `eee1777` (typed feature/API migration and final contract closure).
- `npm run contract:check`: passed with the locked manifest hash above; generated transport, operation descriptors, permissions, and views are byte-identical.
- `npm test -- --project unit --project integration`: 89 files / 352 tests passed.
- `npm test -- --coverage`: 97 files / 373 tests passed; all configured core statement and branch thresholds remained at or above 80%.
- `npm run typecheck`: passed.
- `npm run lint:baseline`: 0 errors / 61 warnings, below the pre-Task-6 ceiling of 82; zero-warning closure remains Task 6.
- `npm run test:architecture`: 97 suites, 67 direct-production behavior suites, 16 source-text guards, 16.49% source-text ratio.
- `npm run build:check`: passed production TypeScript and Vite build.
- `git diff --check`: passed. The only handwritten Admin path retained under `src/api` is the explicitly guarded queue-monitor HTML UI URL; its authorization grant is a generated typed operation.
- The user completed the Tasks 1–5 stage review before historical P08 began.
  P08R and its user acceptance are also closed; Tasks 6–10 are the next phase
  and remain unstarted until the user explicitly opens P07 again.

### Task 6: Decompose remaining Browser-only pages and reach zero lint warnings

**Prerequisite:** P08R is committed, its Browser-only static/contract/Docker gates pass, and the user has accepted `docs/acceptance/p08r-browser-only-manual.md`. Recompute line/warning evidence from that exact frontend revision; do not resurrect files deleted by P08R.

**Files:**
- Modify: the 33 exact Browser-only decomposition candidates enumerated in Step 1
- Modify: only files reported by `npm run lint` for unused/default-prop/explicit-any/prop-mutation/useless-escape/no-v-html findings, with the changed path recorded in the matching wave before staging
- Modify: `package.json` and `eslint.config.js` only to set `--max-warnings 0`, not to disable rules

- [x] **Step 1: Split by real behavior in five waves**

Wave A — protocol/state-heavy:

```text
src/views/Main/ai/chat/components/MessageInput/index.vue
src/views/Main/ai/chat/index.vue
src/views/Main/ai/runs/components/RunList/index.vue
```

The Tauri download manager and client-version page were deleted by P08R and must not be recreated or included in any wave.

Extract typed workflow/composable, pure normalization, and focused presentation components; keep the route component as local assembly.

Wave B — identity/navigation:

```text
src/views/Layout/components/Aside/index.vue
src/views/Layout/components/TabTag/index.vue
src/views/Login/components/ForgotPasswordDialog.vue
src/views/Login/components/LoginFormCard.vue
src/views/Main/user/userManager/components/UserList/index.vue
src/views/Main/personal/components/BaseInfo/index.vue
src/views/Main/personal/components/Security/index.vue
```

Wave C — AI administration:

```text
src/views/Main/ai/agents/index.vue
src/views/Main/ai/chat/components/ConversationDrawer/index.vue
src/views/Main/ai/prompts/index.vue
src/views/Main/ai/providers/components/ProviderFormDialog.vue
src/views/Main/ai/runs/components/RunStats/index.vue
src/views/Main/ai/tools/components/ToolFormDialog/index.vue
```

Wave D — system/permission/payment:

```text
src/views/Main/payment/config/components/PaymentConfigForm.vue
src/views/Main/permission/permission/components/IconSelect.vue
src/views/Main/permission/role/components/RolePermissionMatrix.vue
src/views/Main/permission/role/index.vue
src/views/Main/system/cronTask/index.vue
src/views/Main/system/mail/components/MailConfigPanel.vue
src/views/Main/system/mail/components/MailTemplatePanel.vue
src/views/Main/system/notificationTask/index.vue
src/views/Main/system/sms/components/SmsConfigPanel.vue
src/views/Main/system/sms/components/SmsTemplatePanel.vue
src/views/Main/system/uploadConfig/components/UploadDriver/index.vue
src/views/Main/system/uploadConfig/components/UploadRule/index.vue
src/views/Main/system/uploadConfig/components/UploadSetting/index.vue
```

Wave E — demos/locales:

```text
src/views/Main/component/display/index.vue
src/views/Main/component/form/index.vue
src/i18n/locales/en-US.ts
src/i18n/locales/zh-CN.ts
```

Locale splitting is completed in Task 7. Do not split a file only to move lines; each extracted file owns a named behavior, pure transformation, or interaction.

- [x] **Step 2: Remove semantic warnings**

Replace prop mutation with local models/emits, explicit any with generated/domain types, missing defaults with `withDefaults` or required props, and unused destructuring with explicit property selection. Sanitize Markdown HTML through one tested renderer before `v-html`; do not suppress `vue/no-v-html` globally.

- [x] **Step 3: Switch the gate to zero**

Set `lint` to `eslint . --max-warnings 0` and remove `lint:baseline`. Do not weaken recommended rules or add blanket file disables.

- [x] **Step 4: Verify and commit each wave**

After every wave run `npm run lint && npm run typecheck && npm test`. Stage only the exact source paths named by that wave plus newly extracted files in the same component directories, then use these fixed commits:

```text
Wave A: refactor(frontend): separate protocol state pages
Wave B: refactor(identity): separate navigation and account views
Wave C: refactor(ai): separate administration views
Wave D: refactor(admin): separate system and payment views
Wave E: refactor(demos): separate examples and locale sources
```

For each wave, collect `git diff --name-only`, reject a path outside that wave's declared directories, stage the resulting non-empty list, run `git diff --cached --check`, and commit with the message above. After Wave E, run:

```powershell
npm run lint
npm run typecheck
npm test -- --coverage
```

Expected: 0 errors and 0 warnings, with behavior/coverage unchanged or improved.

#### P07 Task 6 checkpoint evidence (2026-07-20)

- Execution boundary: direct `master` checkout only; no worktree, host Node runtime, browser automation, or GitHub Workflow was used. All Node checks ran in `node:22.23.1-alpine` Docker containers.
- Wave commits: `c863919` (protocol/state), `d644418` (identity/navigation), `d853a93` (AI administration), `10cca02` (system/payment), and `51bd37d` (demos/locale sources).
- `npm run lint`: passed with 0 errors and 0 warnings; `lint:baseline` was removed and the blocking command is `eslint . --max-warnings 0`.
- `npm run typecheck`: passed.
- `npm test -- --coverage`: 99 files / 410 tests passed; aggregate coverage was 89.71% statements and 83.90% branches, with every configured core threshold at or above 80%.
- `npm run contract:check`: passed with locked manifest hash `d0a7649f4fe22ac5a095a108e7c8969fa1a626dea50fdf82f1fa19dfc0b8b1fa`.
- `npm run check:browser-only`: passed for 541 tracked paths, 333 production files, and 6 contract files.
- `npm run build`: passed after transforming 2308 modules.
- `git diff --cached --check`: passed before every wave commit; the Task 6 working tree was clean after Wave E.

### Task 7: Lazy-load locale/heavy code and enforce bundle budgets

**Files:**
- Delete: `src/i18n/locales/en-US.ts`
- Delete: `src/i18n/locales/zh-CN.ts`
- Create: `src/i18n/locales/en-US/common.ts`
- Create: `src/i18n/locales/en-US/auth.ts`
- Create: `src/i18n/locales/en-US/layout.ts`
- Create: `src/i18n/locales/en-US/user.ts`
- Create: `src/i18n/locales/en-US/permission.ts`
- Create: `src/i18n/locales/en-US/system.ts`
- Create: `src/i18n/locales/en-US/payment.ts`
- Create: `src/i18n/locales/en-US/ai.ts`
- Create: `src/i18n/locales/zh-CN/common.ts`
- Create: `src/i18n/locales/zh-CN/auth.ts`
- Create: `src/i18n/locales/zh-CN/layout.ts`
- Create: `src/i18n/locales/zh-CN/user.ts`
- Create: `src/i18n/locales/zh-CN/permission.ts`
- Create: `src/i18n/locales/zh-CN/system.ts`
- Create: `src/i18n/locales/zh-CN/payment.ts`
- Create: `src/i18n/locales/zh-CN/ai.ts`
- Create: `src/i18n/locales/generated.ts`
- Create: `scripts/generate-locale-types.mjs`
- Modify: `src/i18n/index.ts`
- Modify: `vite.config.ts`
- Modify: `src/views/Main/component/display/components/Editor.vue`
- Modify: `src/components/MarkdownRenderer/src/index.vue`
- Modify: `src/lib/upload/uploadClient.ts`
- Modify: `src/views/Main/ai/chat/components/MessageList/index.vue`
- Create: `scripts/analyze-bundle.mjs`
- Create: `performance/baseline.json`
- Create: `performance/budgets.json`
- Create: `tests/shared/build/bundle-boundary.test.ts`
- Modify: `package.json`

- [x] **Step 1: Capture the reproducible baseline**

Run production build with Vite manifest, calculate raw/gzip/Brotli for each entry/lazy chunk, record module membership, and commit the generated `baseline.json` with commit, Node version, Vite version, and environment profile. The analyzer sorts keys and excludes source maps.

- [x] **Step 2: Split locale domains with parity**

Create `common/auth/layout/user/permission/system/payment/ai` domain files for each locale. Load `common/auth/layout` at bootstrap and feature domains on route activation. Generate a key union and fail when Chinese/English key sets differ. Only the fatal startup shell may use a tested literal fallback.

- [x] **Step 3: Remove eager heavy imports**

The default authenticated route manifest must not include `@wangeditor`, `cos-js-sdk-v5`, `markdown-it`, `highlight.js`, or the AI chat renderer. Load them only in the route/interaction that uses them. P08R's `check:browser-only` gate separately proves that no Tauri/native adapter exists; Task 7 must not recreate one merely to satisfy a chunk boundary. Remove duplicate vendor copies rather than hiding them in another named chunk.

- [x] **Step 4: Enforce exact compressed budgets**

```json
{
  "initialJs": {"gzip": 307200, "brotli": 256000},
  "initialCss": {"gzip": 153600, "brotli": 128000},
  "largestLazyJs": {"gzip": 307200, "brotli": 256000},
  "totalJs": {"gzip": 1572864, "brotli": 1258291},
  "forbiddenInitialModules": [
    "@wangeditor", "cos-js-sdk-v5", "markdown-it",
    "highlight.js"
  ]
}
```

`analyze-bundle.mjs --check` exits nonzero on any byte or boundary violation and prints the responsible chunks/modules.

- [x] **Step 5: Verify and commit**

```powershell
npm run build
node scripts/generate-locale-types.mjs --check
node scripts/analyze-bundle.mjs --check
npm test -- tests/shared/build/bundle-boundary.test.ts
git add -- src/i18n/index.ts src/i18n/locales/en-US/common.ts src/i18n/locales/en-US/auth.ts src/i18n/locales/en-US/layout.ts src/i18n/locales/en-US/user.ts src/i18n/locales/en-US/permission.ts src/i18n/locales/en-US/system.ts src/i18n/locales/en-US/payment.ts src/i18n/locales/en-US/ai.ts src/i18n/locales/zh-CN/common.ts src/i18n/locales/zh-CN/auth.ts src/i18n/locales/zh-CN/layout.ts src/i18n/locales/zh-CN/user.ts src/i18n/locales/zh-CN/permission.ts src/i18n/locales/zh-CN/system.ts src/i18n/locales/zh-CN/payment.ts src/i18n/locales/zh-CN/ai.ts src/i18n/locales/generated.ts scripts/generate-locale-types.mjs vite.config.ts src/views/Main/component/display/components/Editor.vue src/components/MarkdownRenderer/src/index.vue src/lib/upload/uploadClient.ts src/views/Main/ai/chat/components/MessageList/index.vue scripts/analyze-bundle.mjs performance/baseline.json performance/budgets.json package.json tests/shared/build/bundle-boundary.test.ts
git add -u -- src/i18n/locales/en-US.ts src/i18n/locales/zh-CN.ts
git diff --cached --check
git commit -m "perf(frontend): enforce lazy boundaries and compressed budgets"
```

#### P07 Task 7 checkpoint evidence (2026-07-20)

- Commit: `a75989b` (`perf(frontend): enforce lazy boundaries and compressed budgets`).
- Baseline: frontend `c8e8245fbf0bfc916c6b9deba1139a13eaa7241b`, Node `v22.23.1`, Vite `8.0.3`; initial JS measured 310207 gzip / 267137 Brotli bytes.
- Final bundle gate: initial JS 289069 gzip / 251632 Brotli, initial CSS 55422 gzip / 43384 Brotli, largest lazy JS 278400 gzip / 182607 Brotli, total JS 1148512 gzip / 946014 Brotli bytes.
- Initial JS improved by 21138 gzip and 15505 Brotli bytes versus the recorded baseline; every exact compressed budget passed.
- Module membership metadata proved that `@wangeditor`, `cos-js-sdk-v5`, `markdown-it`, and `highlight.js` are absent from the initial graph.
- Locale generation/check passed with 1543 parity-checked keys; `common/auth/layout` remain bootstrap domains and `user/permission/system/payment/ai` load before matching route activation.
- `npm run lint`: 0 errors / 0 warnings; `npm run typecheck` passed.
- Full Vitest run: 102 files / 417 tests passed.
- All build, analyzer, locale, lint, type, and test commands ran in the pinned `node:22.23.1-alpine` Docker container; no host Node runtime or browser automation was used.

### Task 8: Meet WCAG 2.2 AA on critical Admin flows

**Files:**
- Create: `src/shared/accessibility/Announcer.vue`
- Create: `src/shared/accessibility/SkipLink.vue`
- Modify: `src/views/Layout/index.vue`
- Modify: `src/components/AppDialog/src/index.vue`
- Modify: `src/views/Login/components/LoginFormCard.vue`
- Modify: `src/components/Table/src/index.vue`
- Modify: `src/components/Search/src/index.vue`
- Modify: `src/views/Main/notification/index.vue`
- Modify: `src/views/Main/ai/chat/index.vue`
- Modify: `src/views/Main/ai/chat/components/MessageInput/index.vue`
- Modify: `src/views/Main/ai/chat/components/MessageList/index.vue`
- Modify: `src/style.css`
- Create: `tests/component/accessibility/layout.test.ts`
- Create: `tests/component/accessibility/dialog.test.ts`
- Create: `tests/component/accessibility/login.test.ts`
- Create: `tests/component/accessibility/table-form.test.ts`
- Create: `tests/component/accessibility/notification.test.ts`
- Create: `tests/component/accessibility/ai-chat.test.ts`
- Create: `docs/accessibility/manual-test-matrix.md`

- [x] **Step 1: Write keyboard/focus/announcement tests**

Test skip-to-main, logical tab order, Escape close, dialog focus trap and return, form label/error association, async loading/result announcements, AI delta suppression plus terminal announcement, visible focus, and reduced-motion styles.

- [x] **Step 2: Implement semantic structure**

Use native buttons/inputs/links before ARIA. Layout has one header/nav/main, a visible-on-focus skip link to `#main-content`, and `main tabindex="-1"` for route focus. Dialogs set `role=dialog`, `aria-modal=true`, labelled title/description, trap focus, close on Escape when allowed, and return focus to the trigger.

- [x] **Step 3: Make dynamic state perceivable**

Add one application announcer with polite/assertive channels. ResourceQuery announces result count/error; forms associate `label`, `aria-invalid`, and error description; buttons expose busy/disabled; notification/AI terminal states announce once. Do not announce every streaming delta.

- [x] **Step 4: Meet visual/mobile criteria**

Enforce text contrast 4.5:1, large text and component boundaries 3:1, visible focus in light/dark/high-contrast, WCAG minimum 24x24 CSS-pixel targets and 44x44 for primary/mobile actions, 200% zoom without two-dimensional page scrolling, gesture alternatives, and `prefers-reduced-motion`/`prefers-contrast`. Decorative images are hidden; meaningful images have localized alt text.

- [x] **Step 5: Verify automated and manual matrix**

Mount critical components and run axe with zero serious/critical violations. The manual matrix records keyboard, NVDA/Windows, VoiceOver/macOS/iOS, TalkBack/Android, 200% zoom, high contrast, and reduced motion for login, Layout, data table/form, dialog, notification, and AI chat.

- [x] **Step 6: Commit**

```powershell
npm test -- --project component tests/component/accessibility
npm run lint
npm run typecheck
git add -- src/shared/accessibility/Announcer.vue src/shared/accessibility/SkipLink.vue src/views/Layout/index.vue src/components/AppDialog/src/index.vue src/views/Login/components/LoginFormCard.vue src/components/Table/src/index.vue src/components/Search/src/index.vue src/views/Main/notification/index.vue src/views/Main/ai/chat/index.vue src/views/Main/ai/chat/components/MessageInput/index.vue src/views/Main/ai/chat/components/MessageList/index.vue src/style.css tests/component/accessibility/layout.test.ts tests/component/accessibility/dialog.test.ts tests/component/accessibility/login.test.ts tests/component/accessibility/table-form.test.ts tests/component/accessibility/notification.test.ts tests/component/accessibility/ai-chat.test.ts docs/accessibility/manual-test-matrix.md
git diff --cached --check
git commit -m "feat(accessibility): meet wcag 2.2 aa on critical flows"
```

#### P07 Task 8 checkpoint evidence (2026-07-20)

- Commit: `870cc79` (`feat(accessibility): meet wcag 2.2 aa on critical flows`).
- Critical-flow accessibility suite: 6 files / 11 tests passed; axe-core 4.12.0 reported zero serious or critical violations in the mounted fixtures.
- Full Vitest run: 108 files / 428 tests passed.
- Dialog naming was verified against Element Plus title-slot semantics; custom headers and visually hidden labels now bind the generated `aria-labelledby` target, Escape remains policy-controlled, and trigger focus is restored after close.
- Tables distinguish `success`, `empty`, `missing`, and `error`; notification-list failures are visible and assertive rather than being announced as empty data.
- Locale parity passed with 1563 keys; lint passed with 0 errors / 0 warnings; typecheck and production build passed.
- Bundle gate passed: initial JS 290527 gzip / 252917 Brotli, initial CSS 55854 gzip / 43709 Brotli, largest lazy JS 278399 gzip / 182862 Brotli, total JS 1152484 gzip / 949835 Brotli bytes.
- Browser-only and Admin contract gates passed; contract manifest remained `d0a7649f4fe22ac5a095a108e7c8969fa1a626dea50fdf82f1fa19dfc0b8b1fa`.
- All Node, test, type, build, locale, bundle, contract, and architecture commands ran in `node:22.23.1-alpine`; no host Node runtime or browser automation was used.
- The versioned assistive-technology matrix exists at `docs/accessibility/manual-test-matrix.md`; its environment-specific boxes remain user-owned and were not marked by the Agent.

### Task 9: Add Docker runtime smoke and the user-owned acceptance checklist

**Files:**
- Create: `scripts/verify-docker-runtime.ps1`
- Create: `tests/shared/deployment/docker-runtime-smoke.test.ts`
- Create: `docs/acceptance/p07-frontend-manual.md`

- [x] **Step 1: Write the failing deployment-boundary test**

The test reads `scripts/verify-docker-runtime.ps1` and requires it to invoke `E:/admin/admin_back_go/scripts/docker-platform.ps1 status`, require all five containers to be healthy, call `/healthz`, `/health`, and `/ready`, compare both image revision labels with repository HEAD, invoke the P08R Browser-only retirement verifier, and accept smoke credentials only through `ADMIN_SMOKE_ACCOUNT` and `ADMIN_SMOKE_PASSWORD`. It also rejects `npm run dev`, Vite, `go run`, `Start-Process`, host MySQL, and host Redis startup.

Run directly through the pinned Node container:

```powershell
docker run --rm --mount "type=bind,src=$((Get-Location).Path),dst=/workspace" --workdir /workspace node:22.23.1-alpine sh -lc "npm ci && npm test -- tests/shared/deployment/docker-runtime-smoke.test.ts"
```

Expected: FAIL because the runtime smoke script does not exist.

- [x] **Step 2: Implement fail-closed Docker runtime verification**

`verify-docker-runtime.ps1` validates resolved backend/frontend roots, invokes only the backend Docker platform script, and exits nonzero on an unhealthy/missing container, non-2xx health response, revision mismatch, authentication failure, missing realtime ticket, WebSocket failure, or secret-like output. It runs authenticated HTTP and realtime-ticket/WebSocket smoke without printing credentials or tokens.

If either smoke credential environment variable is absent, stop with `ADMIN_SMOKE_CREDENTIALS_REQUIRED`; never silently skip authenticated checks or use a mock response.

- [x] **Step 3: Write the versioned manual acceptance checklist**

`docs/acceptance/p07-frontend-manual.md` records the frontend/backend revisions plus the P08R bundle/retirement evidence and leaves user-owned checkboxes for password login without captcha, send-code captcha, Cookie session restore/logout, first protected navigation, menu persistence, direct URL entry, CRUD/error/empty states, notification and AI reconnect, queue monitor, browser download/external navigation, visible online/offline state, absence of the client-version menu/route, keyboard behavior, narrow viewport, 200% zoom, dark theme, reduced motion, and visible focus.

The Agent may populate revision/evidence fields but must not mark user acceptance checkboxes.

- [x] **Step 4: Verify and commit**

```powershell
docker run --rm --mount "type=bind,src=$((Get-Location).Path),dst=/workspace" --workdir /workspace node:22.23.1-alpine sh -lc "npm ci && npm test -- tests/shared/deployment/docker-runtime-smoke.test.ts"
pwsh -NoProfile -File E:/admin/admin_back_go/scripts/docker-platform.ps1 up
pwsh -NoProfile -File scripts/verify-docker-runtime.ps1
git add -- scripts/verify-docker-runtime.ps1 tests/shared/deployment/docker-runtime-smoke.test.ts docs/acceptance/p07-frontend-manual.md
git diff --cached --check
git commit -m "test(docker): add frontend runtime acceptance gate"
```

Expected: automated Docker checks pass and the manual checklist remains pending user confirmation.

#### P07 Task 9 checkpoint evidence (2026-07-20)

- Commit: `74e98fd` (`test(docker): add frontend runtime acceptance gate`).
- Static deployment-boundary suite: 1 file / 4 tests passed after its initial missing-script failure.
- The only platform lifecycle entry was `E:/admin/admin_back_go/scripts/docker-platform.ps1`; it rebuilt and started MySQL, Redis, Admin API, Admin worker, and frontend with all five containers healthy.
- Runtime image evidence before the Task 9 source-only commit: frontend `sha256:f164a2c14cde6a264ddc72254e3737a398399cc95b9c8acd7d23a96569ed57bc` labelled `f7bcf959942f2cf6480170b299d1d7171ab89beb`; API/worker `sha256:51cec099929ff6b44128cf0b205420cfe122548dfd43a832935ba99647f75ac8` labelled backend `27b85c20730d1cba4d534fc670328818fefed24b`.
- `verify-docker-runtime.ps1` passed `/healthz`, `/health`, `/ready`, password login without captcha, authenticated `users/me`, realtime-ticket issuance, WebSocket `connected.v1`, and ping/pong without printing credentials, tokens, or tickets.
- The broader P08R Docker regression fixture also passed captcha enforcement, Cookie rotation/logout, queue monitor grant/UI, realtime, retired-route absence, temporary-user cleanup, and ended with zero active Admin smoke sessions.
- Missing environment credentials fail immediately with `ADMIN_SMOKE_CREDENTIALS_REQUIRED`; the verifier has no account/password parameters, defaults, runtime mock, or host service startup.
- `docs/acceptance/p07-frontend-manual.md` records immutable revisions and the user's explicit `验收通过` stage-review statement. Per-item boxes remain user-owned and were not marked by the Agent.
- Docker-only lint and typecheck passed; `git diff --cached --check` passed before commit. No worktree, GitHub Workflow, browser automation, or host Node runtime was used.

### Task 10: Make containerized frontend quality gates blocking

**Files:**
- Create: `scripts/docker-frontend-gate.ps1`
- Modify: `scripts/verify-frontend.ps1`
- Create: `tests/shared/deployment/quality-gates.test.ts`
- Modify: `package.json`

- [ ] **Step 1: Write the failing quality-gate contract test**

Require the shared verifier to run P08R `check:browser-only`, contract and generated-route checks, ESLint with zero warnings, typecheck, unit/component/integration coverage, production build, locale generation check, bundle budgets, test-architecture audit, dependency audit, and `git diff --check`. Reject browser automation commands, host service startup, runtime mock fallback, `.github`, Tauri/native/desktop dependencies, and deployment Workflow references.

Require `docker-frontend-gate.ps1` to use exact image `node:22.23.1-alpine`, `npm ci`, a named npm cache volume, the repository lockfile, and a caller-supplied static command. It validates that the mounted repository is `E:/admin/admin_front_ts` and propagates the container exit code.

Run:

```powershell
npm test -- tests/shared/deployment/quality-gates.test.ts
```

Expected: FAIL until both scripts express the complete gate.

- [ ] **Step 2: Implement the pinned container gate**

The Docker wrapper mounts the repository at `/workspace`, sets that working directory, installs exactly from `package-lock.json`, and runs only the requested static command. It publishes no ports and starts no dev/preview server.

`verify-frontend.ps1` becomes the single in-container gate and uses `npm run lint -- --max-warnings 0`; it removes the temporary P06 warning baseline. Dependency audit failures remain blocking and cannot be converted into warnings.

- [ ] **Step 3: Prove that browser tooling is absent**

```powershell
npm run check:browser-only
git grep -n -i playwright -- package.json src tests scripts
git ls-files .github .worktrees
```

Expected: Browser-only check passes; both Git commands produce no output. Documentation may record the Playwright prohibition; runtime, dependency, test, and script paths may not contain it.

- [ ] **Step 4: Run and commit**

```powershell
pwsh -NoProfile -File scripts/docker-frontend-gate.ps1 -Command "pwsh -NoProfile -File scripts/verify-frontend.ps1"
git add -- scripts/docker-frontend-gate.ps1 scripts/verify-frontend.ps1 tests/shared/deployment/quality-gates.test.ts package.json package-lock.json
git diff --cached --check
git commit -m "build(frontend): block containerized quality regressions"
```

## Plan completion gate

```powershell
cd E:/admin/admin_front_ts
pwsh -NoProfile -File scripts/docker-frontend-gate.ps1 -Command "pwsh -NoProfile -File scripts/verify-frontend.ps1"

cd E:/admin/admin_back_go
pwsh -NoProfile -File scripts/docker-platform.ps1 up
pwsh -NoProfile -File scripts/docker-platform.ps1 status

cd E:/admin/admin_front_ts
pwsh -NoProfile -File scripts/verify-docker-runtime.ps1
npm run check:browser-only
git grep -n -i playwright -- package.json src tests scripts
git ls-files .github .worktrees
git status --short
git -C E:/admin/admin_back_go status --short
```

Expected: realtime recovery and latest-wins tests pass; source-text tests are below 20%; core coverage is at least 80% statements/branches; lint is 0/0; Browser-only, contract, type, bundle, WCAG component, Docker health/revision, authenticated HTTP, and realtime smoke gates pass; browser-tool/workflow/worktree searches and both status commands produce no output. P07 is not accepted until the user separately confirms `docs/acceptance/p07-frontend-manual.md`.
