<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
const canvasRef = ref<HTMLCanvasElement | null>(null)
let ctx: CanvasRenderingContext2D, width: number, height: number, dpr: number, particles: any[] = [], mouse: any = { x: null, y: null }, raf: number
function init(){ dpr = window.devicePixelRatio || 1; width = window.innerWidth; height = window.innerHeight; const canvas = canvasRef.value as HTMLCanvasElement; canvas.width = width * dpr; canvas.height = height * dpr; canvas.style.width = width + 'px'; canvas.style.height = height + 'px'; ctx = canvas.getContext('2d') as CanvasRenderingContext2D; ctx.scale(dpr, dpr); const count = Math.floor((width * height) / 60000) + 30; particles = []; for(let i=0;i<count;i++){ particles.push({ x: Math.random()*width, y: Math.random()*height, vx:(Math.random()-0.5)*0.6, vy:(Math.random()-0.5)*0.6, r:1.5+Math.random()*1.5 }) } }
function step(){ ctx.clearRect(0,0,width,height); const isDark = document.documentElement.classList.contains('dark'); const dotColor = isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)'; for(const p of particles){ if(mouse.x!=null){ const dx = mouse.x - p.x; const dy = mouse.y - p.y; const dist = Math.sqrt(dx*dx + dy*dy) || 1; const force = Math.min(2.4/dist, 0.06); p.vx += dx * force * 0.02; p.vy += dy * force * 0.02 } p.x += p.vx; p.y += p.vy; if(p.x<0 || p.x>width) p.vx *= -1; if(p.y<0 || p.y>height) p.vy *= -1; ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fillStyle = dotColor; ctx.fill() } for(let i=0;i<particles.length;i++){ const p1 = particles[i]; for(let j=i+1;j<particles.length;j++){ const p2 = particles[j]; const dx = p1.x - p2.x; const dy = p1.y - p2.y; const dist2 = dx*dx + dy*dy; if(dist2 < 12000){ const alpha = 1 - dist2/12000; ctx.strokeStyle = isDark ? `rgba(255,255,255,${0.12*alpha})` : `rgba(0,0,0,${0.12*alpha})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(p1.x,p1.y); ctx.lineTo(p2.x,p2.y); ctx.stroke() } } } raf = requestAnimationFrame(step) }
function onMouseMove(e: MouseEvent){ mouse.x = e.clientX; mouse.y = e.clientY }
function onMouseLeave(){ mouse.x = null; mouse.y = null }
function onResize(){ cancelAnimationFrame(raf); init(); step() }
onMounted(()=>{ init(); step(); window.addEventListener('mousemove', onMouseMove); window.addEventListener('mouseleave', onMouseLeave); window.addEventListener('resize', onResize) })
onUnmounted(()=>{ cancelAnimationFrame(raf); window.removeEventListener('mousemove', onMouseMove); window.removeEventListener('mouseleave', onMouseLeave); window.removeEventListener('resize', onResize) })
</script>
<template>
  <canvas ref="canvasRef" class="particle"></canvas>
</template>
<style scoped>
.particle{ position:fixed; inset:0; z-index:0; pointer-events:none }
</style>
