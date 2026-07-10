<template>
  <canvas ref="canvasRef" class="particle-mouse-background" aria-hidden="true" />
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  color: string
}

const COLORS = [
  'rgba(255, 91, 91, .72)',
  'rgba(50, 205, 120, .72)',
  'rgba(65, 125, 255, .72)',
  'rgba(255, 196, 61, .72)',
  'rgba(37, 205, 210, .72)',
  'rgba(198, 92, 224, .72)',
  'rgba(255, 143, 54, .72)'
]
const MAX_DPR = 1.5
const LINK_DISTANCE = 112
const POINTER_DISTANCE = 150

const canvasRef = ref<HTMLCanvasElement | null>(null)
const particles: Particle[] = []
let context: CanvasRenderingContext2D | null = null
let width = 0
let height = 0
let frameId = 0
let pointerX: number | null = null
let pointerY: number | null = null
let resizeTimer = 0

function createParticles() {
  const count = Math.min(88, Math.max(48, Math.round((width * height) / 21000)))
  particles.length = 0

  for (let index = 0; index < count; index += 1) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.34,
      vy: (Math.random() - 0.5) * 0.34,
      color: COLORS[index % COLORS.length]
    })
  }
}

function resize() {
  const canvas = canvasRef.value
  if (!canvas) return

  width = window.innerWidth
  height = window.innerHeight
  const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR)
  canvas.width = Math.round(width * dpr)
  canvas.height = Math.round(height * dpr)
  canvas.style.width = `${width}px`
  canvas.style.height = `${height}px`
  context = canvas.getContext('2d')
  context?.setTransform(dpr, 0, 0, dpr, 0, 0)
  createParticles()
}

function draw() {
  if (!context) return
  context.clearRect(0, 0, width, height)

  for (let index = 0; index < particles.length; index += 1) {
    const particle = particles[index]
    particle.x += particle.vx
    particle.y += particle.vy

    if (particle.x <= 0 || particle.x >= width) particle.vx *= -1
    if (particle.y <= 0 || particle.y >= height) particle.vy *= -1
    particle.x = Math.max(0, Math.min(width, particle.x))
    particle.y = Math.max(0, Math.min(height, particle.y))

    if (pointerX !== null && pointerY !== null) {
      const dx = particle.x - pointerX
      const dy = particle.y - pointerY
      const distance = Math.hypot(dx, dy)
      if (distance > 1 && distance < POINTER_DISTANCE) {
        const force = (1 - distance / POINTER_DISTANCE) * 0.018
        particle.x -= dx * force
        particle.y -= dy * force
      }
    }

    context.fillStyle = particle.color
    context.fillRect(particle.x - 1.1, particle.y - 1.1, 2.2, 2.2)

    for (let targetIndex = index + 1; targetIndex < particles.length; targetIndex += 1) {
      const target = particles[targetIndex]
      const dx = particle.x - target.x
      const dy = particle.y - target.y
      const distanceSquared = dx * dx + dy * dy
      if (distanceSquared >= LINK_DISTANCE * LINK_DISTANCE) continue

      const alpha = (1 - distanceSquared / (LINK_DISTANCE * LINK_DISTANCE)) * 0.52
      context.globalAlpha = alpha
      context.strokeStyle = particle.color
      context.lineWidth = 1
      context.beginPath()
      context.moveTo(particle.x, particle.y)
      context.lineTo(target.x, target.y)
      context.stroke()
    }
    context.globalAlpha = 1
  }

  frameId = window.requestAnimationFrame(draw)
}

function handlePointerMove(event: PointerEvent) {
  pointerX = event.clientX
  pointerY = event.clientY
}

function handlePointerLeave() {
  pointerX = null
  pointerY = null
}

function handleResize() {
  window.clearTimeout(resizeTimer)
  resizeTimer = window.setTimeout(resize, 120)
}

function handleVisibilityChange() {
  window.cancelAnimationFrame(frameId)
  if (!document.hidden) frameId = window.requestAnimationFrame(draw)
}

onMounted(() => {
  if (
    window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
    window.matchMedia('(pointer: coarse)').matches
  ) return

  resize()
  frameId = window.requestAnimationFrame(draw)
  window.addEventListener('pointermove', handlePointerMove, { passive: true })
  window.addEventListener('pointerleave', handlePointerLeave, { passive: true })
  window.addEventListener('resize', handleResize, { passive: true })
  document.addEventListener('visibilitychange', handleVisibilityChange)
})

onUnmounted(() => {
  window.cancelAnimationFrame(frameId)
  window.clearTimeout(resizeTimer)
  window.removeEventListener('pointermove', handlePointerMove)
  window.removeEventListener('pointerleave', handlePointerLeave)
  window.removeEventListener('resize', handleResize)
  document.removeEventListener('visibilitychange', handleVisibilityChange)
})
</script>

<style scoped lang="scss">
.particle-mouse-background {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  opacity: 0.9;
}

@media (pointer: coarse), (prefers-reduced-motion: reduce) {
  .particle-mouse-background {
    display: none;
  }
}
</style>
