import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const particlePath = 'src/views/Main/component/effect/components/ParticleBackground.vue'

function source(path: string) {
  const absolutePath = join(process.cwd(), path)
  expect(existsSync(absolutePath)).toBe(true)
  return readFileSync(absolutePath, 'utf8')
}

describe('ParticleBackground source quality', () => {
  it('does not hide particle and pointer state behind any or logical-or fallbacks', () => {
    const text = source(particlePath)

    expect(text).not.toContain('particles: any[]')
    expect(text).not.toContain('mouse: any')
    expect(text).not.toContain('window.devicePixelRatio || 1')
    expect(text).not.toContain('Math.sqrt(dx*dx + dy*dy) || 1')

    expect(text).toContain('interface Particle {')
    expect(text).toContain('interface PointerPosition {')
    expect(text).toContain('let particles: Particle[] = []')
    expect(text).toContain('let mouse: PointerPosition = { x: null, y: null }')
    expect(text).toContain('function requireParticleContext(): CanvasRenderingContext2D')
    expect(text).toContain('function positiveDistance(distance: number): number')
  })
})
