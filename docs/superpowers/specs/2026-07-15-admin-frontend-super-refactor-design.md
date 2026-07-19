# Admin Frontend Super Refactor Design

**Status:** Historical frontend architecture baseline. Its Tauri/native/browser-desktop portions were superseded on 2026-07-19 by `E:/admin/admin_back_go/docs/superpowers/specs/2026-07-19-admin-browser-only-tauri-retirement-design.md`.

> **Current amendment:** Admin is Browser-only. `NativeBridge`, Tauri/Rust/NSIS, desktop credentials, client variants, client-version UI/update delivery, P08.5, Playwright-as-a-fixed-gate, and GitHub deployment Workflow requirements in this document are no longer executable. The stable AppKernel/AuthSession/ApiClient/RuntimeRouteRegistry/RealtimeClient/ResourceQuery/Persistence architecture remains, with one Cookie/Origin browser credential adapter and focused browser navigation/download helpers. When this file conflicts with the 2026-07-19 Browser-only specification or P08R plan, those newer documents win.

**Scope owner:** `admin_front_ts`

**Goal:** Turn the Vue/Tauri client into one deterministic, secure, contract-driven Admin application with deep modules for bootstrap, session, HTTP, routing, realtime, resource queries, persistence, and native capabilities. The result must support the next SaaS design without implementing tenant behavior now.

## Scope and constraints

This design owns:

- the browser and Tauri Admin clients;
- startup, authentication, authorization UX, routing, HTTP, realtime, state, and persistence;
- reusable table/query behavior and domain-page decomposition;
- frontend contract generation and runtime boundary validation;
- TypeScript, Vue, browser, performance, accessibility, Rust, and deployment gates.

It does not create a tenant context, tenant switcher, organization model, SaaS page, or generic multi-platform runtime. Admin is a compile-time product entry, not a value inferred from the user agent. Future SaaS work adds a new workflow/transport composition around reusable modules instead of restoring `app` or `canvas` branches.

The refactor preserves approved Admin user behavior. A deliberate HTTP or realtime contract change is committed atomically with the backend contract, generated client types, adapters, and tests.

## Verified starting point

- Vue 3.5, TypeScript 5.9, Vite 8, Element Plus, Pinia, Vue Router, Axios, and Tauri 2 are in use.
- TypeScript strict mode, dynamic view resolution, `AppTable`, `useCrudTable`, and locale-parity tests are useful foundations to deepen.
- The current app mounts before `users/me` and runtime routes finish loading.
- Authentication state is split across page code, JS-readable cookies, Axios interceptors, Router, Pinia, and local storage.
- The HTTP generic type is compile-time only; response envelopes and critical payloads are not fully validated at runtime.
- Realtime uses mutable module-global state, a string-degraded event map, fixed reconnect timing, no resume cursor, and no event deduplication.
- List orchestration has no cancellation or latest-wins rule, so an older response can overwrite a newer search or page.
- Production Tauri loads `https://zgm2003.cn`, exposes a global Tauri object to remote content, grants broad remote capabilities, allows `unsafe-eval`, and accepts arbitrary download URL/path values in Rust commands.
- The source audit found approximately 281 frontend code files and 48,204 lines; views contain about 67.8% of those lines. Twenty-one source files exceed the current 350-line warning threshold.
- The current 105 test files contain 79 source-text assertion suites, only a small number of direct production-module tests, no Vue DOM component suite, and no browser E2E suite.
- The active deploy workflow builds and deploys without blocking on lint, typecheck, unit/component tests, browser smoke, performance budgets, or Rust verification.
- The measured build is approximately 3.78 MB, with an approximately 815 KB editor chunk. Declared performance budgets exist but are not executed.

## Target module shape

```text
main
  └─ AppKernel
       ├─ AppBootstrap
       ├─ AuthSession
       ├─ ApiClient
       ├─ RuntimeRouteRegistry
       ├─ RealtimeClient
       ├─ Persistence
       └─ NativeBridge
             │
             ▼
       feature workflows
             │
             ▼
       domain views + shared UI
```

A module is introduced only when it owns a complete policy or lifecycle. Thin aliases and universal configuration DSLs are not the target. Axios, WebSocket, browser storage, Tauri APIs, and generated transport types remain adapters behind the module interfaces.

A representative responsibility layout is:

```text
src/
  app/                    # AppKernel, bootstrap state, process-wide disposal
  modules/
    auth/                 # AuthSession state machine and credential adapters
    http/                 # generated contract, ApiClient, ApiError
    routing/              # runtime route registry and typed route metadata
    realtime/             # protocol, transport, subscriptions, recovery
    resource-query/       # latest-wins list/query orchestration
    persistence/          # versioned codecs and identity/device namespaces
  features/               # Admin workflows grouped by business capability
  adapters/
    web/                  # browser-only adapters
    tauri/                # the sole TypeScript NativeBridge adapter
  shared/                 # stable UI and narrow primitives
```

This is a responsibility map, not a mechanical instruction to move every file.

## AppKernel and deterministic bootstrap

`AppKernel` is the single composition root. It receives explicit environment, clock, telemetry, credential, HTTP, realtime, persistence, and native adapters. Importing a module must not connect a socket, navigate, read credentials, or mutate global state.

Bootstrap follows an explicit state machine:

```text
cold
  → restoring-session
      ├─ anonymous
      └─ loading-principal
             → installing-routes
                    → ready
any non-recoverable contract/config failure → failed
```

The application may mount a neutral loading/error shell immediately, but it must not render the protected Layout or resolve a protected route until the principal and route registry are ready. A refresh, login, logout, permission-version change, or future identity-scope change runs one serialized transition rather than partially updating unrelated stores.

`AppKernel.dispose()` stops realtime, removes runtime routes/listeners, aborts in-flight bootstrap work, and releases platform adapters. Repeated bootstrap and disposal are idempotent.

Environment parsing is strict. Production rejects missing or loopback API/realtime origins, an Admin platform value other than `admin`, invalid URL protocols, and inconsistent HTTP/WebSocket origins. The user-agent fallback that turns mobile browsers into the retired `app` platform is removed.

## AuthSession

`AuthSession` is the only module allowed to read, store, refresh, rotate, or revoke credentials. Router guards, API modules, components, and realtime consume a read-only session snapshot and events.

The state machine is:

```text
unknown → anonymous
unknown → authenticated
anonymous → authenticating → authenticated
authenticated → refreshing → authenticated
authenticated/refreshing → logging-out → anonymous
refreshing → expired → anonymous
```

Required behavior:

- access credentials are memory-only;
- the browser refresh credential is an `HttpOnly`, `Secure`, explicitly scoped cookie issued by the backend;
- packaged-desktop login passes the rotating refresh credential directly to a NativeBridge sealing operation; subsequent refresh exchange runs through the native adapter, and the sealed credential is never returned to DOM JavaScript or persisted in web storage;
- browser and desktop credential transports are explicit Admin client variants backed by the same server-side Session Lifecycle rules;
- no credential is stored in local storage, Pinia persistence, a JS-readable browser cookie, logs, telemetry, or error artifacts;
- refresh is single-flight inside one context; supported browsers use Web Locks for cross-tab exclusion and `BroadcastChannel` for result/logout propagation, while the server-side rotation CAS remains the correctness boundary if a browser cannot provide the lock;
- 20 concurrent eligible 401 responses result in one refresh attempt and deterministic replay or rejection;
- each replay preserves abort state, request identity, timeout policy, and idempotency policy;
- refresh rotation failure, timeout, revocation, offline recovery, and stale-tab messages have explicit transitions;
- logout first freezes new authenticated work, then best-effort revokes the server session, disconnects realtime, aborts authenticated requests, removes runtime routes, clears principal and identity-scoped persistence, and finally navigates to login;
- device preferences such as theme may survive logout, but tabs, filters, cached principal data, and protected navigation state do not.

The credential-contract cutover may require existing users to sign in once. It does not preserve legacy JS-readable refresh cookies through a permanent compatibility path.

## Contract-driven ApiClient and error model

The backend publishes a versioned OpenAPI 3.1 Admin contract. A pinned `openapi-typescript` generation step produces path, operation, request, response, and error types. Generated files are reproducible and CI fails when the committed output differs from the backend contract snapshot.

The frontend contract lock records the backend Git commit, Admin Contract Bundle version, manifest SHA-256, and individual artifact hashes. Cross-repository CI verifies the lock before generation; a frontend build cannot silently consume whichever backend checkout happens to be nearby.

Axios remains a private transport adapter. Feature code imports the typed `ApiClient`, never the raw Axios instance. Critical untrusted boundaries—bootstrap/principal, authentication, payment mutation results, AI command state, exports, and realtime envelopes—also use runtime schemas so a structurally invalid payload becomes a contract error instead of trusted data.

`ApiError` is a discriminated union:

```text
authentication | authorization | validation | business
rate-limit | network | timeout | dependency
contract | canceled | internal
```

Each error contains the stable backend code when present, retryability, a safe message key/data, request/trace ID, HTTP status where relevant, and an internal cause retained for local diagnostics. The cause is redacted and is never serialized to telemetry by default. UI code does not inspect Axios internals. Transport code does not display notifications; feature or application policy decides whether an error is inline, toast-worthy, retryable, or silent.

Every operation declares:

- timeout class;
- cancellation behavior;
- authentication requirement;
- safe replay policy;
- idempotency key policy for retryable mutations;
- runtime schema requirement;
- telemetry name.

Search, pagination, route disposal, and superseded requests propagate `AbortSignal`. Unknown response shapes fail closed as `contract` errors. Request and response telemetry never records tokens, payment secrets, private prompts, or full sensitive bodies.

## RuntimeRouteRegistry and authorization UX

`RuntimeRouteRegistry` owns the complete installed runtime route set. It validates the `users/me` route contract, resolves a compile-time view allowlist, installs a new set atomically, records removal callbacks, and removes the old set before identity or permission state changes.

Requirements:

- route names, paths, parents, view keys, menu IDs, page layout, and permission metadata use closed TypeScript types;
- duplicate names/paths, invalid nesting, unsafe redirects, unknown view keys, or unapproved metadata are contract errors;
- an invalid route is quarantined and reported rather than silently becoming a normal DeadPage; the application remains usable when other routes are valid;
- the requested/last route is restored only if it exists in the new registry and the principal may see it;
- tabs and selected-menu state are reconciled against the new registry;
- button codes are a generated literal union stored as a `ReadonlySet`;
- repeated installation produces exactly one copy of each runtime route;
- Router guards consult bootstrap/session state, not the presence of a cookie;
- the backend remains the authorization boundary; frontend checks are only navigation and presentation policy.

Contract CI compares backend route/permission output, the generated permission catalog, and the frontend view registry. A backend route pointing to a missing view fails before deployment.

## RealtimeClient

`RealtimeClient` separates a typed protocol from the browser WebSocket transport. Its lifecycle is:

```text
idle → connecting → authenticating → ready
                         │            │
                         └─ failed ←──┘
failed → bounded backoff → connecting
any state → closed
```

TCP open does not reset failure counters; only a completed protocol handshake does. Backoff is exponential with jitter, a maximum delay, an attempt budget for permanent authentication failures, and online/visibility-aware retry.

A closed `RealtimeEventMap` maps every event name to one runtime-validated payload. The envelope contains event ID, request ID when relevant, sequence/cursor, occurrence time, durability class, and payload. There is no `| string` escape hatch.

The client owns:

- one connection per authenticated application context;
- a reference-counted subscription registry restored after reconnect;
- bounded control-message buffering only for explicitly replay-safe messages;
- event-ID deduplication and monotonic cursor tracking;
- handler isolation so one exception cannot block other subscribers;
- protocol error telemetry for malformed or unknown events;
- session refresh/revoke integration;
- immediate disconnect and state purge on logout.

Ephemeral AI deltas may be lost and are never treated as durable truth. AI completed/failed/canceled state and notification creation are recoverable through cursor resume or an authoritative domain query after reconnect. Feature composables consume domain events and do not parse raw websocket objects.

## ResourceQuery, tables, and mutations

`ResourceQuery` deepens the existing table primitives without becoming a universal page generator. It owns:

- `idle/loading/refreshing/success/empty/error` state;
- request sequence and latest-wins commit rules;
- `AbortController` propagation;
- pagination and search normalization;
- loading ownership by active request identity;
- preserved-data refresh;
- selection reconciliation by stable ID;
- empty-page fallback after deletion;
- explicit retry and reset.

Search, refresh, and page-change functions return promises. A late response can never overwrite newer data or clear the newer request's loading state. Query errors remain observable to the caller.

Mutation orchestration is separate from query orchestration. It handles confirmation, pending state, idempotency, success invalidation, and typed errors, while domain features retain their own forms, columns, commands, and business rules. Special tables use adapters; they are not forced into a catch-all CRUD schema.

Table and search column keys are constrained to DTO keys or explicit derived-column definitions. Open `string`/ `unknown` prop bags are replaced by typed extension points.

## Persistence

`Persistence` is the only module allowed to use local/session storage. Stored values have a codec, schema version, namespace, migration, size policy, and reset behavior.

Current namespaces are:

```text
admin:<schema>:device
admin:<schema>:user:<user-id>
```

Tenant is intentionally absent. The SaaS design may add a new ownership scope later without changing feature APIs.

Device preferences include theme, language, and desktop window preference. Identity-scoped values may include validated tabs, table preferences, and non-sensitive filters. Permissions, routes, credentials, and authoritative server data are not persisted as truth.

Corrupt, oversized, expired, or unknown-version values are migrated or safely discarded. Restored tabs and filters are intersected with the current route/permission contract. Direct `localStorage`, `sessionStorage`, or token-cookie access outside adapters fails an architecture guard.

## Feature and component boundaries

Large pages are split along domain behavior:

- a feature workflow/composable owns server state and commands;
- pure functions own normalization and derived state;
- focused components own one interaction or presentation responsibility;
- route components assemble the feature locally.

Files are not split merely to satisfy a line counter. The priority is the AI message input/chat flow, AI run detail/list, download workflow, login/recovery flow, user management, and other files currently mixing protocol, state, formatting, and presentation.

Prop mutation is removed. Shared components expose typed props, emits, slots, and imperative handles only when required. Existing `AppTable`, dialogs, search, upload, and form primitives are retained when their interfaces become clearer than page-local duplication.

Locale files are split by stable domain and loaded by active locale/feature. Translation keys are generated or type-checked, and Chinese/English key sets remain identical. Visible fallback literals are limited to a tested fatal-startup path.

Accessibility completion includes keyboard navigation, visible focus, semantic labels, dialog focus trapping/return, reduced-motion support, status announcements for async work, and automated axe checks on critical pages.

## NativeBridge and Tauri security boundary

Production Tauri packages the verified local `dist`; it no longer loads the deployed website as its application source. Remote content receives no Tauri capability. `withGlobalTauri` is disabled and TypeScript may invoke native behavior only through one typed `NativeBridge`.

The Web adapter implements supported operations with browser APIs or an explicit unavailable result. The Tauri adapter exposes only approved operations:

- window state/control;
- signed updater lifecycle;
- native notification;
- user-mediated save selection and managed download;
- reveal a completed managed download;
- OS-protected credential storage;
- controlled relaunch/exit.

Rust is the final policy boundary. It validates command payloads, canonicalizes paths, constrains writes to a user-selected or application-owned download location, rejects traversal/symlink escape, sanitizes filenames, and writes through a temporary file plus atomic rename. Download URLs require HTTPS, an exact allowlisted host, redirect revalidation, private/loopback-address rejection, response-size limits, and bounded timeouts. Reveal/open commands operate only on recorded managed downloads.

The capability manifest grants only permissions used by the local main window. Shell/opener defaults and broad remote URL capabilities are removed. CSP removes `unsafe-eval`, narrows script/connect/frame origins to measured requirements, and has an automated regression test. Updater artifacts remain signed and the updater endpoint is allowlisted.

Rust code returns structured safe errors, never panics on user-controlled mutex or path input, and cleans partial downloads on failure/cancel. Native commands have unit tests plus negative tests for URL, redirect, path, capability, and remote-content abuse.

## Testing architecture

Tests are organized into four frontend layers:

1. pure TypeScript unit tests in a Node environment;
2. Vue component tests with `@vue/test-utils` and a DOM environment;
3. HTTP/realtime integration tests with deterministic fake servers, clocks, network state, and protocol fixtures;
4. Playwright browser flows against the real Admin API test environment.

Critical required suites cover:

- bootstrap anonymous/authenticated/failure transitions;
- single-context and cross-tab refresh races;
- logout cleanup and protected-route revocation;
- runtime route replacement, invalid view keys, and last-route restoration;
- HTTP timeout, cancellation, replay, contract failure, and typed error mapping;
- ResourceQuery reverse-order responses and mutation invalidation;
- realtime handshake, backoff, duplicate/lost events, resume, malformed messages, handler failure, and session changes;
- payment, user/RBAC, notification, export, and AI conversation happy/failure paths;
- desktop bridge denial and Rust download-path/URL validation.

Source-text tests remain only for a small set of architecture/security guards that cannot be expressed more directly. They account for less than 20% of test files. Core deep modules maintain at least 80% statement and branch coverage; high-risk state transitions are covered explicitly rather than hidden by an aggregate percentage.

Playwright smoke covers Chromium desktop and a mobile viewport: login, refresh, logout, menu/RBAC, one representative CRUD flow, notification delivery/recovery, AI reply completion/cancel/reconnect, and a contract-error screen. Accessibility scans run on login, Layout, a data table/form, and AI chat.

## Performance and build budgets

An executable manifest analyzer measures raw, gzip, and Brotli sizes for the initial route and every lazy chunk. Completion must meet the budgets committed in `package.json`; CI rejects regressions rather than treating Vite warnings as evidence.

Required outcomes:

- the default authenticated route does not download the editor, COS SDK, AI chat renderer, or Tauri adapter;
- editor and Markdown code load only for routes that use them;
- locale domains load on demand without duplicate vendor copies;
- initial JS, CSS, and largest lazy chunks stay within explicit compressed budgets;
- duplicate dependencies and accidental eager imports fail analysis;
- browser smoke records LCP, INP, CLS, API timing, and AI first-event timing against a committed environment profile.

Phase 0 records a reproducible baseline. Later tasks may only tighten or explicitly justify a budget change in the same review as the behavior requiring it.

## Verification and Docker deployment

The local release verifier blocks on:

- lockfile-clean `npm ci`;
- generated-contract drift;
- ESLint with zero warnings;
- TypeScript project build;
- unit, component, and integration tests with core-module coverage;
- production build and bundle budgets;
- Playwright smoke and accessibility checks;
- dependency/license audit;
- Rust format, Clippy with warnings denied, tests, audit, and Tauri build in pinned environments.

Mechanical formatting/autofix is isolated in its own commit before architectural changes. Blanket lint disables are forbidden; generated files use narrow, documented exclusions. Neither repository retains `.github` workflows or secondary Git worktrees.

The frontend production build runs once inside `admin_front_ts/Dockerfile`; the resulting revision-labelled Docker image is the only deployable unit. Integrated runtime acceptance uses `admin_back_go/scripts/docker-platform.ps1 up`. No SCP, extracted `dist` archive, host Vite process, or GitHub Actions deployment path exists. Registry, signing, remote rollout, and rollback remain separate contracts to define before production release rather than being guessed in P06.

## Required execution order

1. Establish blocking verification, contract snapshots, test environments, bundle measurement, and a mechanical lint-only commit.
2. Implement AppKernel, AuthSession, ApiClient/ApiError, and RuntimeRouteRegistry together with the synchronized backend session/contract changes.
3. Implement RealtimeClient together with the backend delivery/resume contract.
4. Deepen ResourceQuery/table/mutation behavior and migrate representative flows before broad page migration.
5. Replace direct storage with Persistence and reconcile identity-scoped UI state.
6. Package local Tauri assets, narrow NativeBridge/Rust commands/capabilities/CSP, and enable desktop gates.
7. Decompose domain pages, lazy-load locale/heavy features, migrate behavioral tests, and meet performance/accessibility budgets.
8. Run the full cross-repository release proof.

Shared generated contracts, authentication transport, route/permission catalogs, and realtime schemas are serialized integration points. Subagents may work in parallel only when they do not edit the same contract, runtime composition, test fixture, or generated output.

## Completion criteria

- Protected UI never renders before authenticated bootstrap and route installation finish.
- No production component, Router guard, API module, or realtime module directly reads a token cookie or browser storage.
- Access credentials are memory-only; browser and desktop refresh credentials use their approved secure adapters.
- Concurrent refresh, logout, route replacement, query ordering, and realtime recovery tests pass deterministically.
- Raw Axios and WebSocket objects do not escape their infrastructure adapters.
- OpenAPI, permission, view, and realtime contracts cannot drift without verification failure.
- All API and realtime boundary failures map to typed safe errors.
- Lint reports zero errors and zero warnings; typecheck, tests, coverage, build, budgets, browser smoke, and accessibility gates pass.
- Source-text tests are below 20% of test files and core behavior is tested through executable interfaces.
- Tauri uses local verified assets, no global Tauri object, no remote capability, no `unsafe-eval`, and rejects untrusted URL/path/native-command input.
- Deployment consumes only a verified, revision-labelled Docker image; rollback is implemented only after its production contract is approved.
- No App/Canvas API prefix, platform inference, runtime branch, or compatibility contract remains.
- No tenant behavior or speculative tenant interface is implemented.

## SaaS handoff

The next design may compose a SaaS AppKernel with a tenant-aware principal, routes, persistence scope, and workflow adapters. It must reuse the stable AuthSession, ApiClient, RealtimeClient, ResourceQuery, and NativeBridge concepts without copying Admin feature code wholesale.

This refactor intentionally leaves that composition for the SaaS spec. Admin remains complete and independently deployable.
