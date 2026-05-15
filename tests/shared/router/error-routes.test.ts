import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { createCatchAllRoute, createMainRoute, publicRoutes } from '../../../src/router/routes'

describe('error route shell', () => {
  it('keeps 404 under the Layout shell and keeps login as the only public route record', () => {
    expect(publicRoutes.map((route) => route.name)).toEqual(['login'])

    const mainRoute = createMainRoute()
    const childNames = (mainRoute.children ?? []).map((route) => route.name)

    expect(childNames).toContain('home')
    expect(childNames).toContain('404')

    const notFound = (mainRoute.children ?? []).find((route) => route.name === '404')
    expect(notFound?.path).toBe('/404')
    expect(notFound?.meta?.pageLayout).toBe('centered')
    expect(notFound?.meta?.errorKind).toBe('not-found')

    expect(createCatchAllRoute().redirect).toBe('/404')
  })

  it('does not use viewport-sized self centering in the error views', () => {
    const source404 = readFileSync(join(process.cwd(), 'src/views/Error/404.vue'), 'utf8')
    const sourceDead = readFileSync(join(process.cwd(), 'src/views/Error/DeadPage.vue'), 'utf8')

    expect(source404).not.toContain('100vh')
    expect(sourceDead).not.toContain('100vh')
  })
})
