# P07 Admin Frontend Manual Acceptance

This checklist belongs to the user. The Agent records immutable revisions and automated evidence, but does not mark the acceptance boxes.

## Acceptance target

| Evidence | Value |
| --- | --- |
| Frontend accepted source revision | `f7bcf959942f2cf6480170b299d1d7171ab89beb` |
| Backend accepted source revision | `27b85c20730d1cba4d534fc670328818fefed24b` |
| P08R Browser-only cutover revision | `39fe04755a4fc76a83ab385a961cb9ccbbb08f92` |
| P08R acceptance record commit | `c4a23a9` |
| Admin Contract manifest SHA256 | `d0a7649f4fe22ac5a095a108e7c8969fa1a626dea50fdf82f1fa19dfc0b8b1fa` |
| P07 decomposition commit | `51bd37d` |
| P07 performance commit | `a75989b` |
| P07 accessibility commit | `870cc79` |
| Frontend Docker image / revision | `sha256:f164a2c14cde6a264ddc72254e3737a398399cc95b9c8acd7d23a96569ed57bc` / `f7bcf959942f2cf6480170b299d1d7171ab89beb` |
| Backend API/worker image / revision | `sha256:51cec099929ff6b44128cf0b205420cfe122548dfd43a832935ba99647f75ac8` / `27b85c20730d1cba4d534fc670328818fefed24b` |
| Docker runtime gate | passed: five healthy containers, `/healthz`, `/health`, `/ready`, authenticated `users/me`, realtime ticket + WebSocket ping/pong, no secret output |
| P08R runtime regression smoke | passed: captcha enforcement, password login, Cookie rotation/logout, queue monitor, realtime, retired route, fixture cleanup; active Admin sessions after smoke: 0 |
| Accessibility automated evidence | 6 files / 11 tests; axe serious or critical violations: 0 |
| Full test evidence | 108 files / 428 tests |
| Initial JS budget | 290527 gzip / 252917 Brotli bytes |
| Browser-only evidence | 583 tracked paths / 362 production files / 6 contract files |

The user stated `验收通过` in the current session on 2026-07-20. That statement is recorded as the stage-review decision; the per-item boxes below remain user-owned as required by the plan.

## Authentication and first navigation

- [ ] Password login submits without captcha, including Enter-key submission after the policy-confirmation interaction.
- [ ] Every send-code entry opens captcha first: login email/phone, forgot password, bind phone, bind email, and verification-code password change.
- [ ] Refresh is restored only from the scoped HttpOnly Cookie; logout returns to login and protected APIs no longer work.
- [ ] The first protected navigation completes without returning to login or exposing a transient unauthorized page.
- [ ] Selected menu state persists after refresh, and direct entry to an authorized protected URL restores the correct page.

## Contract states and primary modules

- [ ] CRUD pages distinguish loading, success, empty, missing-field, and API-error states; an error is never relabelled as empty data.
- [ ] Notification list/actions work, realtime notifications reconnect, and replay does not duplicate a durable notification.
- [ ] AI chat loads conversations, streams once, stops generation, reconnects, and does not duplicate the terminal response.
- [ ] Queue monitor opens inside the page and through its same-origin external-window action without a 401 loop.
- [ ] Browser download and approved HTTPS external navigation work; no retired native/desktop bridge is used.
- [ ] Online/offline state is visibly accurate; HTTP 401/500 and contract failures do not masquerade as offline mode.
- [ ] No client-version menu, route, API entry, updater, desktop mode, or Tauri behavior remains.

## Keyboard, responsive, and visual review

- [ ] Keyboard-only flow has a visible skip link, logical focus order, no focus trap, working Escape policy, and focus return after dialogs close.
- [ ] Login, Layout, forms, tables, dialogs, notifications, and AI chat remain usable at a narrow mobile viewport.
- [ ] At 200% zoom, text and controls remain usable without two-dimensional page scrolling.
- [ ] Light and dark themes retain readable text, boundaries, links, status colors, and visible focus indicators.
- [ ] Reduced-motion mode removes nonessential movement while preserving state changes.
- [ ] Windows High Contrast / forced-colors mode keeps controls, boundaries, links, and focus visible.

## User sign-off

- [ ] All applicable items above were checked against the target Docker image.
- User: ____________________
- Checked at: ____________________
- Result: `pending` / `passed` / `failed`
- Failed item and reproduction notes: ____________________
