# Admin Tauri Security Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Package a verified local Windows UI, expose one narrow NativeBridge, protect desktop refresh credentials with the OS, and make native URL/path/download/updater commands deny untrusted input by default.

**Architecture:** Remote pages receive no Tauri capability. TypeScript imports one injected NativeBridge; the Rust command layer is the final policy boundary. Credentials never return from OS storage, managed downloads use Rust-owned dialogs/records, and updater artifacts remain signature verified.

**Tech Stack:** Windows x86_64, NSIS, Tauri 2, cargo-tauri 2.10.0, Rust 1.97.0, TypeScript/Vue, keyring 4.1.5, reqwest, URL 2.5.8, PowerShell 7.

---

## Execution and release boundary

- P08 supports Windows x86_64/NSIS only; it does not add macOS, Linux, MSI, or mobile targets.
- P08 changes security architecture and produces a locally verified package, but it does not upload a candidate, publish updater JSON, or create a GitHub Workflow.
- P08.5 owns version synchronization, tag-triggered Windows build/signing, COS candidate upload, backend candidate import, and user-controlled promotion.
- Web/API/worker/state runtime remains Docker-only. Native Rust/Tauri compilation may run on the Windows host because it is a build gate, not a Web/backend service.
- Playwright is outside this plan and may be used only when the user explicitly requests it in a separate task.

### Task 1: Pin Rust and establish native verification

**Files:**
- Create: `rust-toolchain.toml`
- Modify: `src-tauri/Cargo.toml`
- Modify: `src-tauri/Cargo.lock`
- Create: `scripts/verify-tauri.ps1`
- Create: `tests/shared/tauri/rust-toolchain.test.ts`

- [x] **Step 1: Pin toolchain and dependencies**

```toml
[toolchain]
channel = "1.97.0"
components = ["rustfmt", "clippy"]
profile = "minimal"
```

Pin direct security dependencies exactly: `keyring=4.1.5`, `url=2.5.8`, `tempfile=3.27.0`, `sha2=0.11.0`, `uuid=1.23.5`, `thiserror=2.0.18`, `secrecy=0.10.3`, `zeroize=1.9.0`, `ipnet=2.12.0`, `reqwest=0.12.28`, `tokio=1.49.0`, and `futures-util=0.3.31`; add `proptest=1.11.0` as dev dependency. Pin the existing Tauri/serde/image/plugin versions to their committed lock values rather than broad major ranges, remove `tauri-plugin-opener`, and keep Cargo.lock committed.

- [x] **Step 2: Implement the shared Rust gate**

```powershell
$ErrorActionPreference = "Stop"
Push-Location src-tauri
try {
  cargo fmt --all -- --check
  cargo clippy --all-targets --all-features -- -D warnings
  cargo test --all-features
  cargo audit --deny warnings
  cargo build --locked --release
} finally {
  Pop-Location
}
```

- [x] **Step 3: Verify on the pinned Windows toolchain and commit**

Run `pwsh -NoProfile -File scripts/verify-tauri.ps1` on Windows with the `rust-toolchain.toml` toolchain. If `rustup`, `cargo`, Clippy, rustfmt, or pinned `cargo-audit` is unavailable, stop and install the declared tool rather than skip or weaken the gate. Do not start Vite or any backend/state service.

```powershell
git add -- rust-toolchain.toml src-tauri/Cargo.toml src-tauri/Cargo.lock scripts/verify-tauri.ps1 tests/shared/tauri/rust-toolchain.test.ts
git commit -m "build(tauri): pin rust and native verification"
```

### Task 2: Package local assets and remove remote capability

**Files:**
- Modify: `src-tauri/tauri.conf.json`
- Modify: `src-tauri/capabilities/default.json`
- Modify: `src-tauri/src/lib.rs`
- Modify: `src-tauri/Cargo.toml`
- Modify: `src-tauri/Cargo.lock`
- Create: `tests/shared/tauri/security-config.test.ts`

- [x] **Step 1: Write the configuration regression test**

Require `frontendDist="../dist"`, `withGlobalTauri=false`, no `remote` capability block, no opener/shell default permission, no `unsafe-eval`, exact window `main`, and no wildcard URL capability.

- [x] **Step 2: Apply the measured local CSP**

Use:

```text
default-src 'self';
script-src 'self';
style-src 'self' 'unsafe-inline';
img-src 'self' data: blob: https://www.zgm2003.cn https://cos.zgm2003.cn;
font-src 'self' data:;
connect-src 'self' https://www.zgm2003.cn https://cos.zgm2003.cn wss://www.zgm2003.cn;
frame-src https://www.zgm2003.cn;
object-src 'none';
base-uri 'none';
form-action 'self';
frame-ancestors 'none'
```

`unsafe-inline` is limited to styles because Element Plus/Vue currently emit inline style attributes; scripts remain self-only and `unsafe-eval` is forbidden. Bundle dependencies rather than runtime third-party scripts.

- [x] **Step 3: Narrow capabilities/plugins**

Keep only explicit main-window operations needed for window control, user-mediated dialog, updater check/download/install, and controlled process restart/exit. Remove `tauri-plugin-opener` and its default capability. Remote web content has no capability entry.

- [x] **Step 4: Verify and commit**

```powershell
npm test -- tests/shared/tauri/security-config.test.ts
npm run build
git add -- src-tauri/tauri.conf.json src-tauri/capabilities/default.json src-tauri/src/lib.rs src-tauri/Cargo.toml src-tauri/Cargo.lock tests/shared/tauri/security-config.test.ts
git commit -m "security(tauri): package local ui and remove remote privilege"
```

### Task 3: Route all native calls through one typed NativeBridge

**Files:**
- Modify: `src/adapters/native.ts`
- Create: `src/adapters/web/native-bridge.ts`
- Create: `src/adapters/tauri/native-bridge.ts`
- Create: `src/modules/native/types.ts`
- Create: `tests/unit/native/web-bridge.test.ts`
- Create: `tests/shared/tauri/native-boundary.test.ts`
- Delete: `src/platform/tauri/app.ts`
- Delete: `src/platform/tauri/env.ts`
- Delete: `src/platform/tauri/index.ts`
- Delete: `src/platform/tauri/notification.ts`
- Delete: `src/platform/tauri/process.ts`
- Delete: `src/platform/tauri/updater.ts`
- Delete: `src/platform/tauri/window.ts`
- Modify: `src/components/TauriManager/src/index.vue`
- Modify: `src/components/DownloadManager/src/download.ts`

- [x] **Step 1: Define the narrow bridge**

```ts
export interface NativeBridge {
  readonly kind: 'web' | 'tauri'
  window: WindowBridge
  updater: UpdaterBridge
  notifications: NotificationBridge
  credentials: DesktopCredentialBridge
  downloads: ManagedDownloadBridge
  process: ProcessBridge
  dispose(): Promise<void>
}
```

No catch-all `invoke(command,args)` method is exposed.

- [x] **Step 2: Implement explicit adapters**

The web adapter uses safe browser APIs or returns typed `unavailable`. It validates any external URL as HTTPS plus an allowed host and uses `noopener,noreferrer`. The Tauri adapter dynamically imports exact commands inside this one file. No component/store/feature imports `@tauri-apps/*` or reads `window.__TAURI__`.

- [x] **Step 3: Add the architecture guard**

Reject `@tauri-apps` imports outside `src/adapters/tauri/native-bridge.ts`, `__TAURI__`, raw `invoke` outside that adapter, dynamic command names, `postMessage('*')`, and unvalidated `window.open`.

- [x] **Step 4: Verify and commit**

```powershell
npm test -- tests/unit/native tests/shared/tauri/native-boundary.test.ts
npm run typecheck
git add -- src/adapters/native.ts src/adapters/web/native-bridge.ts src/adapters/tauri/native-bridge.ts src/modules/native/types.ts src/components/TauriManager/src/index.vue src/components/DownloadManager/src/download.ts tests/unit/native/web-bridge.test.ts tests/shared/tauri/native-boundary.test.ts
git add -u -- src/platform/tauri/app.ts src/platform/tauri/env.ts src/platform/tauri/index.ts src/platform/tauri/notification.ts src/platform/tauri/process.ts src/platform/tauri/updater.ts src/platform/tauri/window.ts
git diff --cached --check
git commit -m "refactor(tauri): isolate native calls behind one bridge"
```

### Task 4: Seal desktop refresh credentials in OS storage

**Files:**
- Create: `src-tauri/src/credentials.rs`
- Create: `src-tauri/src/http_policy.rs`
- Modify: `src-tauri/src/error.rs`
- Modify: `src-tauri/src/lib.rs`
- Modify: `src/adapters/tauri/native-bridge.ts`
- Create: `tests/integration/auth/desktop-credentials.test.ts`

- [x] **Step 1: Write Rust and TypeScript negative tests**

Cover seal/replace/clear, refresh rotation, missing credential, keyring failure, malformed server envelope, disallowed origin, HTTP/loopback/private address, timeout, and redaction. Assert no command returns a refresh credential and serialized errors contain no token.

- [x] **Step 2: Define OS keyring identity**

Use service `cn.zgm2003.admin.refresh` and account `current-session`. Store one rotating refresh credential because the packaged Admin app owns one active desktop session. Wrap memory in `SecretString` and zeroize request/response buffers after use.

- [x] **Step 3: Expose three commands only**

```rust
pub struct RefreshCredentialInput(SecretString);

impl std::fmt::Debug for RefreshCredentialInput {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str("RefreshCredentialInput([REDACTED])")
    }
}

#[tauri::command]
fn seal_refresh_credential(state: State<'_, CredentialStore>, input: RefreshCredentialInput) -> Result<(), SafeError>;
#[tauri::command]
async fn refresh_access_credential(state: State<'_, CredentialStore>, client: State<'_, AdminHttpClient>) -> Result<AccessCredential, SafeError>;
#[tauri::command]
fn clear_refresh_credential(state: State<'_, CredentialStore>) -> Result<(), SafeError>;
```

`RefreshCredentialInput` implements custom deserialization directly into secret memory and the redacted `Debug` shown above; it never derives a plaintext `Debug`. Refresh reads keyring internally, posts to exact `https://www.zgm2003.cn/api/admin/v1/auth/refresh` with desktop variant/device headers, validates the response, stores the rotated refresh credential before returning only access token/expiry, then zeroizes temporary secret material.

- [x] **Step 4: Integrate AuthSession**

Desktop login passes the one-time refresh field immediately to `sealRefreshCredential`, clears the JS reference in `finally`, and keeps only access credential in memory. Subsequent refresh calls the native command; logout clears keyring even when server revoke fails.

- [x] **Step 5: Verify and commit**

```powershell
npm test -- tests/integration/auth/desktop-credentials.test.ts
pwsh -NoProfile -File scripts/verify-tauri.ps1
git add -- src-tauri/src/credentials.rs src-tauri/src/http_policy.rs src-tauri/src/error.rs src-tauri/src/lib.rs src/adapters/tauri/native-bridge.ts tests/integration/auth/desktop-credentials.test.ts
git commit -m "security(auth): seal desktop refresh credentials in the os"
```

### Task 5: Replace arbitrary downloads with managed Rust downloads

**Files:**
- Replace: `src-tauri/src/download.rs`
- Create: `src-tauri/src/download/policy.rs`
- Create: `src-tauri/src/download/store.rs`
- Create: `src-tauri/src/download/http.rs`
- Create: `src-tauri/src/download/tests.rs`
- Modify: `src-tauri/src/lib.rs`
- Modify: `src-tauri/src/error.rs`
- Modify: `src/adapters/tauri/native-bridge.ts`
- Modify: `src/components/DownloadManager/src/download.ts`
- Create: `tests/unit/native/managed-download.test.ts`

- [x] **Step 1: Write URL/path abuse tests**

Reject HTTP, credentials in URL, fragments, non-allowlisted hosts, literal/private/loopback/link-local IPs, DNS resolving only private IPs, redirect to another/private host, more than five redirects, missing/oversized length, streamed bytes over 1 GiB, traversal names, separators/reserved names, symlink parent/target, and reveal of an unrecorded path.

- [x] **Step 2: Validate every network hop**

Allow only HTTPS hosts `cos.zgm2003.cn` and `www.zgm2003.cn`. Resolve all A/AAAA addresses and reject loopback, private, link-local, multicast, unspecified, and documentation ranges. Pin each request connection to one validated address while preserving the allowlisted hostname for TLS/SNI, so reqwest cannot perform an unchecked second DNS resolution. Disable automatic redirects; for each of at most five Location hops, parse/resolve/revalidate before request. Use 10-second connect, 30-second idle, and 10-minute total deadlines.

- [x] **Step 3: Make Rust own save selection and paths**

`start_managed_download` accepts only URL and suggested filename, opens the native save dialog itself, sanitizes the filename, canonicalizes the selected parent, rejects symlinks/escape, creates a same-directory random temporary file with `create_new`, streams under the size limit, flushes/syncs, and atomically renames. On cancel/failure it deletes the partial file.

Use random UUID task IDs, never caller-supplied incremental IDs. Store completed canonical paths in the managed task map. `reveal_managed_download(task_id)` operates only on a recorded completed task; remove arbitrary `open_file_folder(path)`.

- [x] **Step 4: Avoid panic/error disclosure**

Replace every user-controlled `unwrap` with poisoned-lock/safe error handling. `SafeError` serializes stable kind and localized-safe message only; internal URL/path/network causes go to redacted Rust logs. Do not expose signed query values.

- [x] **Step 5: Verify and commit**

```powershell
pwsh -NoProfile -File scripts/verify-tauri.ps1
npm test -- tests/unit/native/managed-download.test.ts
git add -- src-tauri/src/download.rs src-tauri/src/download/policy.rs src-tauri/src/download/store.rs src-tauri/src/download/http.rs src-tauri/src/download/tests.rs src-tauri/src/lib.rs src-tauri/src/error.rs src/adapters/tauri/native-bridge.ts src/components/DownloadManager/src/download.ts tests/unit/native/managed-download.test.ts
git diff --cached --check
git commit -m "security(download): constrain urls paths and managed files"
```

### Task 6: Narrow updater, window, notification, and process operations

**Files:**
- Create: `src-tauri/src/window.rs`
- Create: `src-tauri/src/notification.rs`
- Create: `src-tauri/src/process.rs`
- Modify: `src-tauri/src/lib.rs`
- Modify: `src/adapters/tauri/native-bridge.ts`
- Modify: `src/components/TauriManager/src/index.vue`
- Modify: `src-tauri/tauri.conf.json`

- [x] **Step 1: Enumerate approved operations**

Window: minimize, toggle maximize, hide, request close, query state. Notification: bounded title/body with no HTML/URL. Process: controlled relaunch/exit after UI confirmation. Updater: check, signed download, signed install, relaunch. No shell command, arbitrary opener, filesystem path, or URL command remains.

- [x] **Step 2: Harden updater**

Keep exact HTTPS endpoint `https://cos.zgm2003.cn/tauri_updater/{{target}}-{{arch}}.json` and existing public verification key. Reject unsigned/mismatched artifacts; record version/checksum outcome without signed query values. P08.5 owns private signing material and candidate publication outside the repository.

- [x] **Step 3: Verify and commit**

```powershell
pwsh -NoProfile -File scripts/verify-tauri.ps1
npm test -- tests/shared/tauri
git add -- src-tauri/src/window.rs src-tauri/src/notification.rs src-tauri/src/process.rs src-tauri/src/lib.rs src/adapters/tauri/native-bridge.ts src/components/TauriManager/src/index.vue src-tauri/tauri.conf.json
git commit -m "security(tauri): expose only approved native operations"
```

### Task 7: Add end-to-end native denial and cleanup tests

**Files:**
- Create: `src-tauri/tests/security_boundary.rs`
- Create: `src-tauri/tests/credential_rotation.rs`
- Create: `src-tauri/tests/managed_download.rs`
- Create: `tests/integration/native/bridge.test.ts`
- Create: `scripts/tests/tauri-security-source.tests.ps1`

- [x] **Step 1: Property-test parsers and sanitizers**

Use proptest for URL strings, redirect chains, filenames, and paths. The invariant is deny or produce a canonical value inside the selected directory/host allowlist; never panic.

- [x] **Step 2: Test full native boundaries**

With local fake HTTPS endpoints and fake keyring/dialog adapters, prove credential rotation stores before return, failed rotation retains/clears according to server class, download redirects are revalidated, cancellation removes partial files, reveal needs completed task, remote content cannot invoke commands, and bridge disposal removes listeners.

- [x] **Step 3: Scan high-risk TypeScript/config patterns**

The source guard rejects:

- `window.__TAURI__`, raw invoke outside one adapter, dynamic command strings;
- refresh/access token storage or logging;
- `unsafe-eval` or script `unsafe-inline`;
- remote capabilities, shell/opener default;
- unvalidated external `window.open`/`href`/`src` and `javascript:`;
- `postMessage` with wildcard target or receiver without exact origin/schema;
- dynamic script injection or runtime Vue template compilation.

- [x] **Step 4: Verify and commit**

```powershell
pwsh -NoProfile -File scripts/tests/tauri-security-source.tests.ps1
pwsh -NoProfile -File scripts/verify-tauri.ps1
npm test -- tests/integration/native
git add -- src-tauri/tests/security_boundary.rs src-tauri/tests/credential_rotation.rs src-tauri/tests/managed_download.rs tests/integration/native/bridge.test.ts scripts/tests/tauri-security-source.tests.ps1
git diff --cached --check
git commit -m "test(tauri): enforce native denial and cleanup behavior"
```

### Task 8: Make local Windows Tauri security gates blocking

**Files:**
- Modify: `scripts/verify-tauri.ps1`
- Create: `tests/shared/tauri/security-gate.test.ts`
- Create: `docs/acceptance/p08-tauri-windows-manual.md`

- [x] **Step 1: Write the failing security-gate contract test**

Require `verify-tauri.ps1` to run exact-toolchain checks, fmt, Clippy with warnings denied, Rust tests, `cargo audit --deny warnings`, locked release build, Tauri config/source guards, TypeScript NativeBridge tests, and a Windows NSIS package build. Reject skipped commands, broad-version tool installation, remote `frontendDist`, remote capability, shell/opener defaults, signing-key output, candidate upload, updater-manifest publication, GitHub deployment references, and browser automation.

```powershell
npm test -- tests/shared/tauri/security-gate.test.ts
```

Expected: FAIL until the shared gate expresses every required check.

- [x] **Step 2: Complete the fail-closed Windows verifier**

The verifier checks `rustc --version` against `rust-toolchain.toml`, checks the pinned `cargo-audit` version, and runs all commands from the repository root with `--locked` where supported. It builds only `x86_64-pc-windows-msvc` and confirms an NSIS artifact exists. It never reads the Tauri private key and never uploads or publishes a version.

- [x] **Step 3: Write the user-owned packaged-app checklist**

The checklist records the frontend and Rust revisions and leaves user-owned checks for offline local UI loading, password login, browser-versus-desktop credential separation, restart/session restoration, Windows credential cleanup on logout, managed download allow/deny/cancel behavior, window close/minimize, notification permission, updater signature failure, and absence of remote native capability. The Agent cannot mark these checks accepted.

- [x] **Step 4: Verify and commit**

```powershell
npm test -- tests/shared/tauri/security-gate.test.ts tests/integration/native
pwsh -NoProfile -File scripts/tests/tauri-security-source.tests.ps1
pwsh -NoProfile -File scripts/verify-tauri.ps1
git add -- scripts/verify-tauri.ps1 tests/shared/tauri/security-gate.test.ts docs/acceptance/p08-tauri-windows-manual.md
git diff --cached --check
git commit -m "build(tauri): block Windows security regressions"
```

### Post-implementation security audit closure

**Files:**
- Modify: `src-tauri/build.rs`
- Modify: `src-tauri/capabilities/default.json`
- Modify: `src-tauri/tauri.conf.json`
- Modify: `src-tauri/src/lib.rs`
- Modify: `src-tauri/src/window.rs`
- Modify: `src-tauri/src/download/policy.rs`
- Modify: `scripts/verify-tauri.ps1`
- Modify: `tests/shared/tauri/security-config.test.ts`
- Modify: `tests/shared/tauri/security-gate.test.ts`
- Modify: `src-tauri/tests/security_boundary.rs`

- [x] Deny WebView-native downloads and child-window creation so remote frames cannot bypass the Rust-managed download boundary.
- [x] Reject cross-host redirects even when both hosts are individually allowlisted.
- [x] Generate an application ACL for every custom `#[tauri::command]` and grant it only to the local `main` window; no remote origin is present.
- [x] Make the verifier compare Rust commands, generated `__app-acl__` permissions, and capability grants one-to-one.
- [x] Re-run Docker TypeScript gates, Rust security gates, release build, and Windows x64 NSIS packaging.

## Plan completion gate

```powershell
cd E:/admin/admin_front_ts
# Both verifiers install and test frontend dependencies inside Docker; do not run host npm.
pwsh -NoProfile -File scripts/tests/tauri-security-source.tests.ps1
pwsh -NoProfile -File scripts/verify-frontend.ps1
pwsh -NoProfile -File scripts/verify-tauri.ps1
# `security-gate.test.ts` structurally rejects declared or installed browser automation.
# Keep the text search on owned source/config only: Vitest records optional browser peers
# in its package-lock metadata even when those packages are not installed.
git grep -n -i playwright -- package.json src tests scripts .github
git status --short
```

Expected: the Windows NSIS app loads only packaged local assets; global/remote capability and unsafe eval are absent; DOM code never persists a refresh credential; native URL/path/redirect/private-address abuse is denied; partial downloads are cleaned; unsigned updater artifacts are rejected; Rust/TypeScript gates pass; the structural browser-dependency test, owned-source search, and status check pass. P08 uploads no candidate and is accepted only after the user confirms `docs/acceptance/p08-tauri-windows-manual.md`.
