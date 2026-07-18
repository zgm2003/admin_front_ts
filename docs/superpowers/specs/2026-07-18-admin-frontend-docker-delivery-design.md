# Admin Frontend Docker-Only Delivery Design

## Status and precedence

This design records the operator-approved delivery change made during P06 on 2026-07-18. It replaces the GitHub Actions/SCP web-artifact portion of the earlier frontend refactor design and implementation plan.

## Non-negotiable constraints

- Work directly on the existing frontend and backend `master` checkouts.
- Do not create or retain Git worktrees or `.worktrees` directories.
- Do not retain `.github` workflows in either repository.
- Do not deploy or start the frontend through Vite, a host process, SCP, or an extracted `dist` archive.
- The frontend runtime and deployment unit is the Docker image produced by `admin_front_ts/Dockerfile`.
- The canonical local runtime entry remains `admin_back_go/scripts/docker-platform.ps1 up`.

## P06 delivery boundary

P06 proves the frontend source and one Docker image build. A host-side verifier may run static checks and automated tests, but it never starts the application and never produces a separately deployable web archive. The production frontend build runs only inside the Docker build stage.

The verifier performs, in order:

1. clean lockfile install;
2. Admin contract drift check;
3. generated route check;
4. lint baseline;
5. TypeScript check;
6. unit, component, and integration tests with the committed 80% core branch threshold;
7. one Docker image build tagged with the exact frontend Git commit;
8. image metadata inspection for revision label, unprivileged runtime user, health check, and exposed port.

The Docker image is the only release candidate. P06 does not invent a registry, production host, credential, or remote rollout contract that the operator has not specified. A later production rollout may push and pull this same image by digest, but it must continue to use Docker/Compose and must not restore GitHub Actions or SCP deployment.

## Compose ownership

`admin_back_go/deploy/docker-first/docker-compose.yml` owns the integrated local platform. It builds the frontend image from the sibling frontend checkout, connects it to `admin-api` through the external `admin-platform` network, and publishes only the loopback port `127.0.0.1:5173`.

The lifecycle script resolves both repository commits, builds backend and frontend images, starts state services, and finally starts application services with `--no-build`. No host Vite or Go server is part of acceptance.

## Failure behavior

- Any contract or generated-route drift fails before image construction.
- Any coverage, lint, type, or test failure prevents image construction.
- A dirty checkout or invalid 40-character revision prevents release-image verification.
- A missing or mismatched image revision label fails verification.
- Docker health failure prevents the Compose acceptance gate from succeeding.

## Acceptance evidence

- Both repositories list only their primary checkout in `git worktree list`.
- `.worktrees` and `.github` are absent in both repositories.
- The Docker-only architecture test passes.
- The shared frontend verifier completes and inspects the tagged image.
- The full platform starts through `scripts/docker-platform.ps1 up` and reports healthy containers.
