# Admin Frontend Realtime, Resource, and Quality Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add typed recoverable realtime, latest-wins ResourceQuery/mutations, migrate feature APIs and tables, replace source-heavy tests with behavior tests, and meet zero-warning, performance, browser, and WCAG 2.2 AA gates.

**Architecture:** Realtime and resource orchestration are stateful modules owned by AppKernel. Feature workflows consume typed domain events and query/mutation objects, never raw WebSocket/Axios. Shared UI remains focused; pages split only where behavior, state, or presentation has a real boundary.

**Tech Stack:** Vue 3.5, TypeScript 5.9, Vitest, Vue Test Utils, MSW, Playwright 1.61.1, axe-core 4.12.1.

---

## Docker-only execution policy

P07 runtime and test execution is Docker-only. P06 must first remove the Windows-only `E:/admin/...` fixture assumptions and ensure the test/build context contains every required source fixture. Run npm, Vitest, build, MSW integration, and Playwright commands in pinned Node/Playwright containers; browser flows target the Docker frontend origin and the API/worker/state services started by `admin_back_go/scripts/docker-platform.ps1 up`.

The host may edit files, inspect Git, and orchestrate Docker with PowerShell. It must not start Vite, API, worker, MySQL, or Redis directly, and a host-only passing test is not P07 gate evidence.

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

- [ ] **Step 1: Test lifecycle and failure policy**

Cover connect/open/handshake/ready, handshake-only retry reset, exponential jitter with fake RNG/clock, permanent auth attempt budget, offline/visibility pause, one connection per authenticated kernel, malformed/unknown messages, handler isolation, duplicate event IDs, cursor monotonicity, resume, resync-required, subscription restore, bounded control buffer, and logout purge.

- [ ] **Step 2: Define the closed protocol**

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

- [ ] **Step 3: Implement client policy**

Use the P04 one-time ticket endpoint before opening WebSocket. Backoff is `min(30s,500ms*2^attempt)+uniform(0,25%)`. Only a validated connected envelope marks ready/resets failures. Keep a 512-ID LRU dedupe and persist only the durable cursor through user-scoped Persistence. Reference-count topics; restore them after handshake. Buffer at most 32 replay-safe subscribe/resume controls, never domain mutations.

- [ ] **Step 4: Recover durable truth**

On reconnect send `realtime.resume.v1` with last durable sequence. Apply terminal events in sequence order. On resync-required call notification/AI command authoritative queries, then set returned cursor. Ephemeral deltas are never reconstructed or persisted.

- [ ] **Step 5: Verify and commit**

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

- [ ] **Step 1: Write reverse-order and cancellation tests**

Start search A, then B; resolve B then A. Assert B owns data/loading/error. Cover abort, preserved-data refresh, empty, retry, selection intersection, reset, page-size normalization, and deletion fallback from an empty page to the previous page.

- [ ] **Step 2: Define state and request ownership**

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

- [ ] **Step 3: Adapt AppTable**

`useTable` becomes a Vue adapter over ResourceQuery. Search/page/refresh return promises. Selection keys reconcile with new stable IDs. Errors propagate; the component decides inline/toast policy.

- [ ] **Step 4: Verify and commit**

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

- [ ] **Step 1: Test mutation policy**

Cover confirmation cancel, pending dedupe, required idempotency key, typed failure, success invalidation, selection clear, and empty-page fallback. Query errors must not be swallowed.

- [ ] **Step 2: Define separate orchestration**

```ts
export interface MutationSpec<TInput,TOutput> {
  key(input: TInput): string
  confirm?: (input: TInput) => Promise<boolean>
  execute(input: TInput, options: { signal: AbortSignal; idempotencyKey?: string }): Promise<TOutput>
  invalidate: readonly ResourceQuery<unknown,unknown,unknown>[]
}
```

`Mutation` owns pending identity and invalidation, not form fields, columns, or business validation.

- [ ] **Step 3: Close UI types**

`TableColumn<Row>` is a union of property column (`prop: keyof Row`) and derived column (`key` plus typed formatter); remove the open index signature. `SearchField<Model,K extends keyof Model>` binds keys to compatible value/control types. Keep an explicit `elementProps` object typed from Element Plus props rather than arbitrary top-level unknown values.

- [ ] **Step 4: Verify and commit**

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

- [ ] **Step 1: Generate and use operation descriptors**

Generate `src/modules/http/generated/operations.ts` from OpenAPI operation IDs. Every existing API wrapper calls `kernel.api.execute` with one descriptor and typed input. Add a guard rejecting imports of raw Axios/service and literal `/api/` URLs outside generated descriptors.

- [ ] **Step 2: Migrate representative workflows first**

For user list, notification list/read/delete, export list/delete, AI run list/detail, and AI conversation:

- own ResourceQuery and Mutation instances in a feature workflow;
- abort on route disposal;
- return promises for search/page/refresh;
- choose inline/toast/silent policy at the feature boundary;
- use typed realtime domain events only;
- recover terminal AI/notification state through authoritative queries.

Test reverse-order list results, failed mutation with preserved data, deletion page fallback, notification dedupe/resume, AI completion/cancel/reconnect, and contract failure.

- [ ] **Step 3: Migrate remaining API wrappers**

Migrate AI agents/knowledge/prompts/providers/tools, payment config/recharges/wallet, auth platform/permission/role, client version/cron/log/mail/SMS/operation log/queue monitor/settings/upload, and login-log/profile APIs. Special pages may keep custom workflows; they must still use typed ApiClient and AbortSignal.

- [ ] **Step 4: Verify and commit**

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

- [ ] **Step 1: Add an executable test audit**

The manifest records every current source-reading suite by exact path with one of `delete`, `replace`, or `retain-guard`, plus the exact replacement test path for `replace`. The script rejects missing files, duplicate entries, replacement collisions, or a source reader absent from the manifest. It parses test imports/file reads, classifies direct production behavior versus source-text guards, prints counts, and fails when source-text suites are 20% or more. Architecture/security guards are the only retained source readers and are listed by exact path in the manifest.

- [ ] **Step 2: Convert critical suites**

Replace text assertions for auth, router, realtime, table/query, notification, payment, user/RBAC, export, AI conversation/run, dialog, and network behavior with imports, mounted Vue components, MSW, fake clocks, and fake WebSocket transports. Delete assertions that only count strings or lines and add no behavior.

- [ ] **Step 3: Enforce core coverage**

Configure 80% statements and branches separately for `src/app`, `src/modules/auth`, `http`, `routing`, `realtime`, `resource-query`, and `persistence`. Add explicit transition tests until each directory passes; do not hide misses through aggregate application coverage.

- [ ] **Step 4: Verify and commit**

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

### Task 6: Decompose mixed-responsibility pages and reach zero lint warnings

**Files:**
- Modify: the 36 exact max-line files enumerated in Step 1
- Modify: only files reported by `npm run lint` for unused/default-prop/explicit-any/prop-mutation/useless-escape/no-v-html findings, with the changed path recorded in the matching wave before staging
- Modify: `package.json` and `eslint.config.js` only to set `--max-warnings 0`, not to disable rules

- [ ] **Step 1: Split by real behavior in five waves**

Wave A — protocol/state-heavy:

```text
src/components/DownloadManager/src/index.vue
src/views/Main/ai/chat/components/MessageInput/index.vue
src/views/Main/ai/chat/index.vue
src/views/Main/ai/runs/components/RunList/index.vue
src/views/Main/component/download/index.vue
```

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
src/views/Main/system/clientVersion/index.vue
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

- [ ] **Step 2: Remove semantic warnings**

Replace prop mutation with local models/emits, explicit any with generated/domain types, missing defaults with `withDefaults` or required props, and unused destructuring with explicit property selection. Sanitize Markdown HTML through one tested renderer before `v-html`; do not suppress `vue/no-v-html` globally.

- [ ] **Step 3: Switch the gate to zero**

Set `lint` to `eslint . --max-warnings 0` and remove `lint:baseline`. Do not weaken recommended rules or add blanket file disables.

- [ ] **Step 4: Verify and commit each wave**

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
- Modify: `src/adapters/native.ts`
- Modify: `src/components/DownloadManager/src/download.ts`
- Create: `scripts/analyze-bundle.mjs`
- Create: `performance/baseline.json`
- Create: `performance/budgets.json`
- Create: `tests/shared/build/bundle-boundary.test.ts`
- Modify: `package.json`

- [ ] **Step 1: Capture the reproducible baseline**

Run production build with Vite manifest, calculate raw/gzip/Brotli for each entry/lazy chunk, record module membership, and commit the generated `baseline.json` with commit, Node version, Vite version, and environment profile. The analyzer sorts keys and excludes source maps.

- [ ] **Step 2: Split locale domains with parity**

Create `common/auth/layout/user/permission/system/payment/ai` domain files for each locale. Load `common/auth/layout` at bootstrap and feature domains on route activation. Generate a key union and fail when Chinese/English key sets differ. Only the fatal startup shell may use a tested literal fallback.

- [ ] **Step 3: Remove eager heavy imports**

The default authenticated route manifest must not include `@wangeditor`, `cos-js-sdk-v5`, `markdown-it`, `highlight.js`, AI chat renderer, or any Tauri adapter. Load them in the route/interaction that uses them. Remove duplicate vendor copies rather than hiding them in another named chunk.

- [ ] **Step 4: Enforce exact compressed budgets**

```json
{
  "initialJs": {"gzip": 307200, "brotli": 256000},
  "initialCss": {"gzip": 153600, "brotli": 128000},
  "largestLazyJs": {"gzip": 307200, "brotli": 256000},
  "totalJs": {"gzip": 1572864, "brotli": 1258291},
  "forbiddenInitialModules": [
    "@wangeditor", "cos-js-sdk-v5", "markdown-it",
    "highlight.js", "@tauri-apps"
  ]
}
```

`analyze-bundle.mjs --check` exits nonzero on any byte or boundary violation and prints the responsible chunks/modules.

- [ ] **Step 5: Verify and commit**

```powershell
npm run build
node scripts/generate-locale-types.mjs --check
node scripts/analyze-bundle.mjs --check
npm test -- tests/shared/build/bundle-boundary.test.ts
git add -- src/i18n/index.ts src/i18n/locales/en-US/common.ts src/i18n/locales/en-US/auth.ts src/i18n/locales/en-US/layout.ts src/i18n/locales/en-US/user.ts src/i18n/locales/en-US/permission.ts src/i18n/locales/en-US/system.ts src/i18n/locales/en-US/payment.ts src/i18n/locales/en-US/ai.ts src/i18n/locales/zh-CN/common.ts src/i18n/locales/zh-CN/auth.ts src/i18n/locales/zh-CN/layout.ts src/i18n/locales/zh-CN/user.ts src/i18n/locales/zh-CN/permission.ts src/i18n/locales/zh-CN/system.ts src/i18n/locales/zh-CN/payment.ts src/i18n/locales/zh-CN/ai.ts src/i18n/locales/generated.ts scripts/generate-locale-types.mjs vite.config.ts src/views/Main/component/display/components/Editor.vue src/components/MarkdownRenderer/src/index.vue src/lib/upload/uploadClient.ts src/views/Main/ai/chat/components/MessageList/index.vue src/adapters/native.ts src/components/DownloadManager/src/download.ts scripts/analyze-bundle.mjs performance/baseline.json performance/budgets.json package.json tests/shared/build/bundle-boundary.test.ts
git add -u -- src/i18n/locales/en-US.ts src/i18n/locales/zh-CN.ts
git diff --cached --check
git commit -m "perf(frontend): enforce lazy boundaries and compressed budgets"
```

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

- [ ] **Step 1: Write keyboard/focus/announcement tests**

Test skip-to-main, logical tab order, Escape close, dialog focus trap and return, form label/error association, async loading/result announcements, AI delta suppression plus terminal announcement, visible focus, and reduced-motion styles.

- [ ] **Step 2: Implement semantic structure**

Use native buttons/inputs/links before ARIA. Layout has one header/nav/main, a visible-on-focus skip link to `#main-content`, and `main tabindex="-1"` for route focus. Dialogs set `role=dialog`, `aria-modal=true`, labelled title/description, trap focus, close on Escape when allowed, and return focus to the trigger.

- [ ] **Step 3: Make dynamic state perceivable**

Add one application announcer with polite/assertive channels. ResourceQuery announces result count/error; forms associate `label`, `aria-invalid`, and error description; buttons expose busy/disabled; notification/AI terminal states announce once. Do not announce every streaming delta.

- [ ] **Step 4: Meet visual/mobile criteria**

Enforce text contrast 4.5:1, large text and component boundaries 3:1, visible focus in light/dark/high-contrast, WCAG minimum 24x24 CSS-pixel targets and 44x44 for primary/mobile actions, 200% zoom without two-dimensional page scrolling, gesture alternatives, and `prefers-reduced-motion`/`prefers-contrast`. Decorative images are hidden; meaningful images have localized alt text.

- [ ] **Step 5: Verify automated and manual matrix**

Mount critical components and run axe with zero serious/critical violations. The manual matrix records keyboard, NVDA/Windows, VoiceOver/macOS/iOS, TalkBack/Android, 200% zoom, high contrast, and reduced motion for login, Layout, data table/form, dialog, notification, and AI chat.

- [ ] **Step 6: Commit**

```powershell
npm test -- --project component tests/component/accessibility
npm run lint
npm run typecheck
git add -- src/shared/accessibility/Announcer.vue src/shared/accessibility/SkipLink.vue src/views/Layout/index.vue src/components/AppDialog/src/index.vue src/views/Login/components/LoginFormCard.vue src/components/Table/src/index.vue src/components/Search/src/index.vue src/views/Main/notification/index.vue src/views/Main/ai/chat/index.vue src/views/Main/ai/chat/components/MessageInput/index.vue src/views/Main/ai/chat/components/MessageList/index.vue src/style.css tests/component/accessibility/layout.test.ts tests/component/accessibility/dialog.test.ts tests/component/accessibility/login.test.ts tests/component/accessibility/table-form.test.ts tests/component/accessibility/notification.test.ts tests/component/accessibility/ai-chat.test.ts docs/accessibility/manual-test-matrix.md
git diff --cached --check
git commit -m "feat(accessibility): meet wcag 2.2 aa on critical flows"
```

### Task 9: Add real browser, accessibility, and performance smoke

**Files:**
- Create: `playwright.config.ts`
- Create: `tests/e2e/auth.spec.ts`
- Create: `tests/e2e/rbac-crud.spec.ts`
- Create: `tests/e2e/notification.spec.ts`
- Create: `tests/e2e/ai-realtime.spec.ts`
- Create: `tests/e2e/contract-error.spec.ts`
- Create: `tests/e2e/accessibility.spec.ts`
- Create: `tests/e2e/performance.spec.ts`
- Create: `tests/e2e/fixtures/admin.ts`
- Create: `scripts/start-e2e-environment.ps1`
- Create: `performance/e2e-profile.json`
- Modify: `package.json`

- [ ] **Step 1: Configure deterministic projects**

Run Chromium desktop at 1440x900 and mobile at 390x844. Start the real Admin API/Worker test environment with MySQL/Redis and fake provider/COS endpoints. Seed unique run IDs, never a committed account/password.

- [ ] **Step 2: Implement required flows**

- login, 20-request refresh, logout, revoked protected route;
- menu/RBAC route and button update;
- one representative create/edit/status/delete flow with latest-wins search;
- notification live delivery, disconnect, and recovery;
- AI reply completion, cancel, Worker restart, reconnect/resume;
- malformed critical response and fatal contract-error screen.

Each test cleans its own rows and sessions by unique prefix.

- [ ] **Step 3: Run axe and keyboard smoke**

Scan login, Layout, table/form/dialog, and AI chat with `@axe-core/playwright`; fail serious/critical violations. Use keyboard-only steps for skip link, menu, table action, form error, dialog close/return, and chat send/cancel.

- [ ] **Step 4: Enforce environment-profile performance**

Record LCP ≤ 2500 ms, INP ≤ 200 ms, CLS ≤ 0.1, login API p95 ≤ 300 ms, list p95 ≤ 200 ms, and fake-provider AI first event ≤ 2000 ms. Use five warmed runs on the committed CI profile; report raw samples and median/p95.

- [ ] **Step 5: Verify and commit**

```powershell
npx playwright install chromium
pwsh -NoProfile -File scripts/start-e2e-environment.ps1 -Command test
npm run test:e2e
git add -- playwright.config.ts tests/e2e/auth.spec.ts tests/e2e/rbac-crud.spec.ts tests/e2e/notification.spec.ts tests/e2e/ai-realtime.spec.ts tests/e2e/contract-error.spec.ts tests/e2e/accessibility.spec.ts tests/e2e/performance.spec.ts tests/e2e/fixtures/admin.ts scripts/start-e2e-environment.ps1 performance/e2e-profile.json package.json
git diff --cached --check
git commit -m "test(browser): cover admin recovery accessibility and budgets"
```

### Task 10: Make all frontend quality gates blocking

**Files:**
- Modify: `scripts/verify-frontend.ps1`
- Modify: `.github/workflows/deploy-admin-front.yml`
- Create: `tests/shared/deployment/quality-gates.test.ts`

- [ ] **Step 1: Require every gate**

The workflow and shared script run contract/view generation checks, ESLint zero warnings, typecheck, unit/component/integration coverage, production build, bundle budgets, Playwright desktop/mobile, axe, performance profile, dependency/license audit, and immutable artifact packaging.

- [ ] **Step 2: Pin browser/runtime inputs**

Use Node 22.12.0, `@playwright/test 1.61.1`, and the lockfile. Install Chromium with the package CLI; cache only npm and browser binaries keyed by lockfile+Playwright version. Upload test report, traces on failure, bundle report, and checksums without credentials.

- [ ] **Step 3: Run and commit**

```powershell
pwsh -NoProfile -File scripts/verify-frontend.ps1
npm run test:e2e
npm test -- tests/shared/deployment/quality-gates.test.ts
git add -- scripts/verify-frontend.ps1 .github/workflows/deploy-admin-front.yml tests/shared/deployment/quality-gates.test.ts
git diff --cached --check
git commit -m "ci: block frontend quality accessibility and budget regressions"
```

## Plan completion gate

```powershell
npm ci
pwsh -NoProfile -File scripts/verify-frontend.ps1
npm run test:e2e
node scripts/audit-test-architecture.mjs
node scripts/analyze-bundle.mjs --check
git status --short
```

Expected: realtime recovery and latest-wins tests pass; source-text tests are below 20%; core coverage is at least 80% statements/branches; lint is 0/0; bundle, browser, WCAG, and performance gates pass; status is clean.
