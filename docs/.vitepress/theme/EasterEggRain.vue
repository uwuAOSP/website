<!--
SPDX-FileCopyrightText: The uwuAOSP Project
SPDX-License-Identifier: Apache-2.0
-->

<script setup lang="ts">
import { onUnmounted, ref } from 'vue'
import { withBase } from 'vitepress'

const canvasRef = ref<HTMLCanvasElement | null>(null)
const active = ref(false)

interface Drop {
  x: number
  y: number
  vx: number
  vy: number
  maxVy: number
  gravity: number
  size: number
  rot: number
  rotSpeed: number
  flipMode: 0 | 1 | 2 | 3 // 0: normal/mirrored, 1: 3D flipX, 2: 3D flipY, 3: 3D tumble both
  flipPhaseX: number
  flipSpeedX: number
  flipPhaseY: number
  flipSpeedY: number
  mirrorX: 1 | -1
  swayAmp: number
  swayFreq: number
  swayPhase: number
  age: number
  delay: number
}

const drops: Drop[] = []
let sprite: HTMLImageElement | null = null
let spriteReady = false
let ctx: CanvasRenderingContext2D | null = null
let rafId = 0
let lastTime = 0
let width = 0
let height = 0
let dpr = 1

function ensureSprite(): Promise<void> {
  if (spriteReady && sprite) return Promise.resolve()
  return new Promise((resolve) => {
    if (!sprite) {
      sprite = new Image()
      sprite.decoding = 'async'
      sprite.src = withBase('/easter-egg.webp')
    }
    if (sprite.complete && sprite.naturalWidth > 0) {
      spriteReady = true
      resolve()
      return
    }
    const onDone = () => {
      spriteReady = Boolean(sprite && sprite.naturalWidth > 0)
      resolve()
    }
    sprite.addEventListener('load', onDone, { once: true })
    sprite.addEventListener('error', onDone, { once: true })
  })
}

function preload() {
  if (typeof window === 'undefined') return
  void ensureSprite()
}

function resizeCanvas() {
  const canvas = canvasRef.value
  if (!canvas) return
  width = window.innerWidth
  height = window.innerHeight
  dpr = Math.min(window.devicePixelRatio || 1, 2)
  const nextW = Math.max(1, Math.round(width * dpr))
  const nextH = Math.max(1, Math.round(height * dpr))
  if (canvas.width !== nextW || canvas.height !== nextH) {
    canvas.width = nextW
    canvas.height = nextH
  }
  ctx = canvas.getContext('2d', { alpha: true })
}

function createDrop(delaySpread: number): Drop {
  const compact = width < 700
  const sizeRoll = Math.random()
  const baseSize = sizeRoll > 0.88
    ? (compact ? 68 : 88) + Math.random() * 14 // occasional giant drop
    : (compact ? 38 : 48) + Math.random() * (compact ? 24 : 32)

  const flipRoll = Math.random()
  const flipMode: 0 | 1 | 2 | 3 =
    flipRoll < 0.25 ? 0 : flipRoll < 0.62 ? 1 : flipRoll < 0.84 ? 2 : 3

  return {
    x: baseSize * 0.5 + Math.random() * Math.max(40, width - baseSize),
    y: -baseSize * (0.7 + Math.random() * 0.8),
    vx: (Math.random() - 0.5) * (compact ? 72 : 110),
    vy: 65 + Math.random() * 115,
    maxVy: 310 + Math.random() * 190,
    gravity: 220 + Math.random() * 190,
    size: baseSize,
    rot: Math.random() * Math.PI * 2,
    rotSpeed: (Math.random() > 0.5 ? 1 : -1) * (1.1 + Math.random() * 3.4),
    flipMode,
    flipPhaseX: Math.random() * Math.PI * 2,
    flipSpeedX: (Math.random() > 0.5 ? 1 : -1) * (2.6 + Math.random() * 3.8),
    flipPhaseY: Math.random() * Math.PI * 2,
    flipSpeedY: (Math.random() > 0.5 ? 1 : -1) * (2.2 + Math.random() * 3.4),
    mirrorX: Math.random() > 0.5 ? 1 : -1,
    swayAmp: 16 + Math.random() * 34,
    swayFreq: 1.2 + Math.random() * 1.7,
    swayPhase: Math.random() * Math.PI * 2,
    age: 0,
    delay: Math.random() * delaySpread,
  }
}

function drawFrame(now: number) {
  if (!ctx || !sprite || !spriteReady) {
    rafId = 0
    return
  }

  const dt = Math.min(0.04, Math.max(0.001, (now - lastTime) / 1000))
  lastTime = now

  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.clearRect(0, 0, Math.round(width * dpr), Math.round(height * dpr))

  let writeIdx = 0
  for (let i = 0; i < drops.length; i++) {
    const d = drops[i]
    if (d.delay > 0) {
      d.delay -= dt
      drops[writeIdx++] = d
      continue
    }

    d.age += dt
    d.vy = Math.min(d.maxVy, d.vy + d.gravity * dt)
    d.x += d.vx * dt
    d.y += d.vy * dt
    d.rot += d.rotSpeed * dt

    if (d.y - d.size > height + 40) {
      continue
    }

    const swayX = Math.sin(d.age * d.swayFreq + d.swayPhase) * d.swayAmp
    const drawX = d.x + swayX
    const drawY = d.y

    let scaleX: number = d.mirrorX
    let scaleY = 1
    if (d.flipMode === 1 || d.flipMode === 3) {
      scaleX = Math.cos(d.flipPhaseX + d.age * d.flipSpeedX)
      if (Math.abs(scaleX) < 0.08) scaleX = scaleX >= 0 ? 0.08 : -0.08
    }
    if (d.flipMode === 2 || d.flipMode === 3) {
      scaleY = Math.cos(d.flipPhaseY + d.age * d.flipSpeedY)
      if (Math.abs(scaleY) < 0.08) scaleY = scaleY >= 0 ? 0.08 : -0.08
    }

    const cosR = Math.cos(d.rot)
    const sinR = Math.sin(d.rot)
    const sx = scaleX * dpr
    const sy = scaleY * dpr

    ctx.setTransform(
      cosR * sx,
      sinR * sx,
      -sinR * sy,
      cosR * sy,
      drawX * dpr,
      drawY * dpr,
    )
    const half = d.size * 0.5
    ctx.drawImage(sprite, -half, -half, d.size, d.size)

    drops[writeIdx++] = d
  }

  drops.length = writeIdx

  if (drops.length === 0) {
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, Math.round(width * dpr), Math.round(height * dpr))
    rafId = 0
    active.value = false
    window.removeEventListener('resize', resizeCanvas)
    return
  }

  rafId = requestAnimationFrame(drawFrame)
}

async function trigger(count?: number, delaySpread = 4.2) {
  if (typeof window === 'undefined') return
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  await ensureSprite()
  if (!spriteReady) return

  active.value = true
  // Wait a microtask if canvas just mounted via v-show / layout
  requestAnimationFrame(() => {
    resizeCanvas()
    const compact = width < 700
    const spawnCount = count ?? (compact ? 54 : 84)
    const hardLimit = compact ? 150 : 240
    const room = Math.max(0, hardLimit - drops.length)
    const actual = Math.min(spawnCount, room)
    for (let i = 0; i < actual; i++) {
      drops.push(createDrop(delaySpread))
    }

    if (!rafId && drops.length > 0) {
      window.addEventListener('resize', resizeCanvas, { passive: true })
      lastTime = performance.now()
      rafId = requestAnimationFrame(drawFrame)
    }
  })
}

onUnmounted(() => {
  cancelAnimationFrame(rafId)
  rafId = 0
  drops.length = 0
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', resizeCanvas)
  }
})

defineExpose({ preload, trigger })
</script>

<template>
  <canvas
    v-show="active"
    ref="canvasRef"
    class="easter-egg-canvas"
    aria-hidden="true"
  />
</template>

<style scoped>
.easter-egg-canvas {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 40;
}
</style>
