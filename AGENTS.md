# AGENTS.md — Vue Admin Frontend

## Project role

This repository is the independent Vue frontend for the new Laravel API backend.

- Backend API lives in `../admin_back_laravel`.
- Frontend owns UI, routing, state, forms, and API client composition.
- Laravel owns persistence, auth, permissions, queues, and REST resources.
- Do not depend on Webman route conventions for new work.

## Stack boundary

- Vue 3
- TypeScript
- Composition API with `<script setup lang="ts">`
- Vue Router
- Pinia
- Element Plus
- Vite

Use Options API only when an existing component forces it.

## API boundary

The new backend API is grouped by client surface:

```text
/api/v1/admin/*    admin console APIs
/api/v1/app/*      app/mobile APIs
```

Frontend code should treat `admin` and `app` as different API surfaces. Do not hardcode old Webman-style paths in new modules.

Environment variables:

```text
VITE_API_BASE_URL   canonical backend base URL
VITE_SOME_KEY       legacy alias kept until the HTTP client is renamed
VITE_PLATFORM       current platform, for example admin
VITE_API_SURFACE    current API surface, for example admin
```

## Vue coding rules

- Use small focused SFCs.
- Use `computed` for derived state.
- Use watchers only for side effects.
- Keep props read-only.
- Emit events instead of mutating parent state.
- Put reusable stateful logic in composables.
- Keep route views as composition surfaces; move feature UI into child components.
- Never use `v-html` with untrusted content.

## Feature folder convention

For new non-trivial features:

```text
src/views/<surface>/<feature>/
  index.vue
  components/
  composables/
  types.ts

src/api/<surface>/<feature>.ts
```

## Verification before completion

Prefer the narrowest relevant check. For code changes:

```powershell
npm run lint
npm run test
```

For release-level changes:

```powershell
npm run build:check
```

Do not run heavy frontend builds casually when only docs or env files changed.

