<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  r: number
}

interface PointerPosition {
  x: number | null
  y: number | null
}

const canvasRef = ref<HTMLCanvasElement | null>(null)

let ctx: CanvasRenderingContext2D | null = null
let width = 0
let height = 0
let dpr = 1
let particles: Particle[] = []
let mouse: PointerPosition = { x: null, y: null }
let raf = 0

function requireCanvas(): HTMLCanvasElement {
  const canvas = canvasRef.value
  if (!canvas) {
    throw new Error('ParticleBackground canvas should be mounted before init')
  }
  return canvas
}

function requireParticleContext(): CanvasRenderingContext2D {
  if (!ctx) {
    throw new Error('ParticleBackground canvas context should be initialized before drawing')
  }
  return ctx
}

function currentDevicePixelRatio(): number {
  const currentDpr = window.devicePixelRatio
  if (currentDpr > 0) {
    return currentDpr
  }
  return 1
}

function positiveDistance(distance: number): number {
  if (distance === 0) {
    return 1
  }
  return distance
}

function isOutside(value: number, max: number): boolean {
  if (value < 0) {
    return true
  }
  return value > max
}

function createParticle(): Particle {
  return {
    x: Math.random() * width,
    y: Math.random() * height,
    vx: (Math.random() - 0.5) * 0.6,
    vy: (Math.random() - 0.5) * 0.6,
    r: 1.5 + Math.random() * 1.5
  }
}

function initParticles(count: number): Particle[] {
  const nextParticles: Particle[] = []
  for (let i = 0; i < count; i += 1) {
    nextParticles.push(createParticle())
  }
  return nextParticles
}

function init(): void {
  dpr = currentDevicePixelRatio()
  width = window.innerWidth
  height = window.innerHeight

  const canvas = requireCanvas()
  canvas.width = width * dpr
  canvas.height = height * dpr
  canvas.style.width = `${width}px`
  canvas.style.height = `${height}px`

  ctx = canvas.getContext('2d')
  const context = requireParticleContext()
  context.setTransform(dpr, 0, 0, dpr, 0, 0)

  const count = Math.floor((width * height) / 60000) + 30
  particles = initParticles(count)
}

function applyPointerForce(particle: Particle): void {
  if (mouse.x === null || mouse.y === null) {
    return
  }

  const dx = mouse.x - particle.x
  const dy = mouse.y - particle.y
  const dist = positiveDistance(Math.sqrt(dx * dx + dy * dy))
  const force = Math.min(2.4 / dist, 0.06)
  particle.vx += dx * force * 0.02
  particle.vy += dy * force * 0.02
}

function moveParticle(particle: Particle): void {
  applyPointerForce(particle)
  particle.x += particle.vx
  particle.y += particle.vy

  if (isOutside(particle.x, width)) {
    particle.vx *= -1
  }
  if (isOutside(particle.y, height)) {
    particle.vy *= -1
  }
}

function drawParticle(context: CanvasRenderingContext2D, particle: Particle, dotColor: string): void {
  context.beginPath()
  context.arc(particle.x, particle.y, particle.r, 0, Math.PI * 2)
  context.fillStyle = dotColor
  context.fill()
}

function drawLink(
  context: CanvasRenderingContext2D,
  p1: Particle,
  p2: Particle,
  isDark: boolean
): void {
  const dx = p1.x - p2.x
  const dy = p1.y - p2.y
  const dist2 = dx * dx + dy * dy
  if (dist2 >= 12000) {
    return
  }

  const alpha = 1 - dist2 / 12000
  context.strokeStyle = isDark ? `rgba(255,255,255,${0.12 * alpha})` : `rgba(0,0,0,${0.12 * alpha})`
  context.lineWidth = 1
  context.beginPath()
  context.moveTo(p1.x, p1.y)
  context.lineTo(p2.x, p2.y)
  context.stroke()
}

function requireParticle(index: number): Particle {
  const particle = particles[index]
  if (!particle) {
    throw new Error(`Particle at index ${index} should exist while drawing links`)
  }
  return particle
}

function drawLinks(context: CanvasRenderingContext2D, isDark: boolean): void {
  for (let i = 0; i < particles.length; i += 1) {
    const p1 = requireParticle(i)
    for (let j = i + 1; j < particles.length; j += 1) {
      drawLink(context, p1, requireParticle(j), isDark)
    }
  }
}

function step(): void {
  const context = requireParticleContext()
  context.clearRect(0, 0, width, height)

  const isDark = document.documentElement.classList.contains('dark')
  const dotColor = isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)'
  for (const particle of particles) {
    moveParticle(particle)
    drawParticle(context, particle, dotColor)
  }
  drawLinks(context, isDark)

  raf = requestAnimationFrame(step)
}

function onMouseMove(e: MouseEvent): void {
  mouse.x = e.clientX
  mouse.y = e.clientY
}

function onMouseLeave(): void {
  mouse.x = null
  mouse.y = null
}

function onResize(): void {
  cancelAnimationFrame(raf)
  init()
  step()
}

onMounted(() => {
  init()
  step()
  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseleave', onMouseLeave)
  window.addEventListener('resize', onResize)
})

onUnmounted(() => {
  cancelAnimationFrame(raf)
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('mouseleave', onMouseLeave)
  window.removeEventListener('resize', onResize)
})
</script>

<template>
  <canvas ref="canvasRef" class="particle"></canvas>
</template>

<style scoped>
.particle {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
}
</style>
