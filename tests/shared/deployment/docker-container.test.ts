import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8')

describe('frontend Docker runtime', () => {
  it('uses pinned build and unprivileged runtime images', () => {
    const dockerfile = read('Dockerfile')

    expect(dockerfile).toContain('node:22.23.1-alpine')
    expect(dockerfile).toContain('nginxinc/nginx-unprivileged:1.31.3-alpine')
    expect(dockerfile).toContain('npm ci')
    expect(dockerfile).toContain('npm run build:check')
    expect(dockerfile).toContain('VITE_GO_API_BASE_URL')
    expect(dockerfile).toContain('VITE_WEB_SOCKET_URL')
    expect(dockerfile).toContain('ARG VITE_ADMIN_RUNTIME_MODE=production')
    expect(dockerfile).toContain('ENV VITE_ADMIN_RUNTIME_MODE=${VITE_ADMIN_RUNTIME_MODE}')
    expect(dockerfile).toContain('ARG BUILD_REVISION=unknown')
    expect(dockerfile).toContain('LABEL org.opencontainers.image.revision="${BUILD_REVISION}"')
    expect(dockerfile).toContain('HEALTHCHECK')
  })

  it('proxies API and WebSocket traffic and keeps Vue fallback', () => {
    const nginx = read('deploy/nginx.conf')

    expect(nginx).toContain('listen 8080')
    expect(nginx).toContain('location = /healthz')
    expect(nginx).toContain('resolver 127.0.0.11 valid=5s ipv6=off')
    expect(nginx).toContain('set $admin_api_upstream admin-api:8080')
    expect(nginx).toContain('proxy_pass http://$admin_api_upstream')
    expect(nginx).toContain('proxy_set_header Upgrade $http_upgrade')
    expect(nginx).toContain('try_files $uri $uri/ /index.html')
  })
})
