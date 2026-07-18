# Retired: GitHub Actions / SCP deployment

The GitHub Actions and SCP `dist` deployment path is retired. The frontend repository intentionally contains no `.github` directory.

The only supported runtime and deployment unit is the image built from `Dockerfile`. Integrated local startup is owned by:

```powershell
cd E:/admin/admin_back_go
pwsh -NoProfile -File scripts/docker-platform.ps1 up
```

P06 Docker delivery design:
`../superpowers/specs/2026-07-18-admin-frontend-docker-delivery-design.md`.

Do not restore Vite host startup, SCP archives, GitHub workflow deployment, or a second Compose entrypoint.
