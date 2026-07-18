# Login Policy Confirmation Design

**Date:** 2026-07-18
**Scope:** Admin frontend login interaction only

## Goal

Let a user complete the password field and press Enter without first locating the policy checkbox. If the user has not explicitly agreed during the current login-page lifetime, show a confirmation dialog. Login may continue only after an explicit click on the dialog confirmation button.

## Interaction contract

1. The login form keeps native form submission, so Enter in the password or verification-code field triggers the same path as clicking Login.
2. If the policy checkbox is already selected, submission continues normally.
3. If it is not selected, submission stops before validation, captcha loading, code submission, or `AppKernel.login`, and one policy-confirmation dialog opens.
4. Clicking **Agree and continue** is an explicit consent action. It selects the page-local checkbox, closes the dialog, and resumes the original submission path once.
5. Clicking **Cancel**, closing the dialog, or pressing Escape leaves consent false and performs no login work.
6. Repeated Enter presses while the dialog is open do not create additional dialogs or submission attempts.
7. Consent is never persisted. A newly opened or reloaded login page starts unchecked and therefore requires a fresh manual action.
8. Opening the service-terms or privacy-policy information does not imply consent and must no longer select the checkbox.

## Architecture

- `useLoginForm` owns page-local consent state, dialog visibility, the submission gate, and the explicit confirm/cancel commands.
- A focused `LoginPolicyConfirmDialog.vue` renders the interaction with the existing shared `AppDialog`; it contains no API or authentication logic.
- `Login/index.vue` only wires the composable state and commands to the dialog.
- `LoginFormCard.vue` retains native form submission and the visible checkbox; it does not duplicate the consent decision.
- No backend endpoint, request field, response field, AppKernel contract, captcha contract, or persistence schema changes.

## Copy and accessibility

- Add localized Chinese and English strings for the dialog title, explanation, cancel button, and agree-and-continue button.
- The dialog has a visible title, keyboard-operable controls, focus containment through Element Plus, Escape/close cancellation, and a primary confirmation action.
- Service-terms and privacy-policy links remain separately operable and do not silently change consent.

## Error and concurrency behavior

- Confirmation only authorizes the existing submission flow; all existing validation, captcha, and backend errors continue through their current states.
- A single pending-intent flag prevents duplicate continuation when Enter or confirm is triggered repeatedly.
- Closing the dialog clears the pending intent without mutating credentials or consent.

## Test contract

Component/composable tests must prove:

- unchecked Enter opens one dialog and does not load captcha or call the kernel;
- cancel/close performs no login and leaves consent false;
- explicit confirm selects consent and resumes exactly once;
- an already checked form skips the dialog;
- opening policy information does not select consent;
- a fresh composable instance starts unchecked;
- existing captcha-to-AppKernel credential mapping remains unchanged.

## Acceptance

- Run focused login tests first, then lint baseline, typecheck, contract check, route generation, and the full test suite.
- Production build and application restart occur only through Docker/Compose.
- Rebuild from `E:/admin/admin_back_go` with `pwsh -NoProfile -File scripts/docker-platform.ps1 up`, verify all containers are healthy, and check `http://localhost:5173`.
