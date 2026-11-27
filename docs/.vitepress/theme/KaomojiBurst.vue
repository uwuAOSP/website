<!--
SPDX-FileCopyrightText: The uwuAOSP Project
SPDX-License-Identifier: Apache-2.0
-->

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'

const props = defineProps<{
  originEl?: HTMLElement | null
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)

const KAOMOJI = [
  // uwu / owo / core
  'UwU', 'OwO', '>w<', '^w^', '=w=', 'QwQ', 'TwT', 'XwX', '•ω•', '´•ω•`', '˘ω˘',
  // こねこ / cat vibes
  '(=^･ω･^=)', '(=｀ω´=)', '(=^-ω-^=)', '(ΦωΦ)', '(=ﾟωﾟ)ﾉ', '(^・ω・^)', 'ฅ•ω•ฅ',
  // Logo homage & expressive faces
  '\\(￣■￣)', '(￣▽￣)', '(￣ω￣)', '(´▽｀)', '(・∀・)', '(´∀`*)', '(o´∀`o)',
  '(*≧ω≦)', '(｡•̀ᴗ-)✧', '(つ✧ω✧)つ', '(๑•̀ㅂ•́)و✧', 'ヾ(≧▽≦*)o', '♪(´▽｀)',
  '(｡･ω･｡)', '(´･ω･`)', '(*^▽^*)', '(ﾉ◕ヮ◕)ﾉ✧', 'o(≧▽≦)o', '(≧◡≦)',
  '(✿◠‿◠)', '(ง •̀_•́)ง', '٩(ˊᗜˋ*)و', '(⁎˃ᴗ˂⁎)', 'ヽ(>∀<☆)ノ',
]

const DARK_COLORS = [
  '#8DE3FD', '#97CEFB', '#A6CBFC', '#BCDBFD', '#B6BAFF', '#99C5FF', '#C4B8FF',
]
const LIGHT_COLORS = [
  '#1F78B8', '#3B6ED0', '#5C62C6', '#1683AC', '#4876CC', '#7060BC', '#2E7CC8',
]

const FONT_STACK = '"Google Sans Variable", "Noto Sans CJK SC", "Hiragino Sans", "PingFang SC", system-ui, sans-serif'
const SPRITE_FONT_SIZE = 24

interface Sprite {
  canvas: HTMLCanvasElement
  w: number
  h: number
  hw: number
  hh: number
}

interface Particle {
  textIndex: number
  colorIndex: number
  cosA: number
  sinA: number
  speed: number
  dist: number
  age: number
  life: number
  invLife: number
  scaleFactor: number
  maxAlpha: number
  rotation: number
  rotSpeed: number
  swayAmp: number
  swayFreq: number
  swayPhase: number
  parallax: number
  originJitterX: number
  originJitterY: number
  retiring: boolean
  extraFade: number
}

const particles: Particle[] = []
const spriteCache = new Map<number, Sprite>()
let measureCtx: CanvasRenderingContext2D | null = null
let ctx: CanvasRenderingContext2D | null = null
let rafId = 0
let lastTime = 0
let lastBurstTime = 0
let spawnAccumulator = 0
let goldenCursor = Math.random() * Math.PI * 2
let width = 0
let height = 0
let dpr = 1
let spriteDpr = 1
let originX = 0
let originY = 0
let logoRx = 140
let logoRy = 86
let spawnRx = 28
let spawnRy = 18
let isDark = true
let reducedMotion = false
let inView = true
let pointerX = 0
let pointerY = 0
let smoothPointerX = 0
let smoothPointerY = 0

let resizeObserver: ResizeObserver | null = null
let intersectionObserver: IntersectionObserver | null = null
let themeObserver: MutationObserver | null = null
let darkQuery: MediaQueryList | null = null
let motionQuery: MediaQueryList | null = null

function detectDarkMode(): boolean {
  const mode = document.documentElement.dataset.themeMode
  if (mode === 'dark') return true
  if (mode === 'light') return false
  return darkQuery ? darkQuery.matches : false
}

function getSprite(textIndex: number, colorIndex: number): Sprite {
  const key = textIndex * DARK_COLORS.length + colorIndex
  const cached = spriteCache.get(key)
  if (cached) return cached

  if (!measureCtx) {
    const tmp = document.createElement('canvas')
    measureCtx = tmp.getContext('2d')
  }

  const text = KAOMOJI[textIndex]
  const font = `600 ${SPRITE_FONT_SIZE}px ${FONT_STACK}`
  let textWidth = text.length * SPRITE_FONT_SIZE * 0.72
  if (measureCtx) {
    measureCtx.font = font
    const metrics = measureCtx.measureText(text)
    const boxW = (metrics.actualBoundingBoxLeft ?? 0) + (metrics.actualBoundingBoxRight ?? 0)
    textWidth = Math.max(metrics.width, boxW)
  }

  const w = Math.ceil(textWidth + 16)
  const h = Math.ceil(SPRITE_FONT_SIZE * 1.9)
  const off = document.createElement('canvas')
  off.width = Math.max(1, Math.ceil(w * spriteDpr))
  off.height = Math.max(1, Math.ceil(h * spriteDpr))
  const octx = off.getContext('2d')
  if (octx) {
    octx.setTransform(spriteDpr, 0, 0, spriteDpr, 0, 0)
    octx.font = font
    octx.textAlign = 'center'
    octx.textBaseline = 'middle'
    octx.fillStyle = (isDark ? DARK_COLORS : LIGHT_COLORS)[colorIndex]
    octx.fillText(text, w / 2, h / 2)
  }

  const sprite: Sprite = { canvas: off, w, h, hw: w / 2, hh: h / 2 }
  spriteCache.set(key, sprite)
  return sprite
}

function measureOrigin() {
  const canvas = canvasRef.value
  if (!canvas) return
  const canvasRect = canvas.getBoundingClientRect()
  width = canvasRect.width
  height = canvasRect.height
  if (props.originEl) {
    const r = props.originEl.getBoundingClientRect()
    originX = r.left - canvasRect.left + r.width / 2
    originY = r.top - canvasRect.top + r.height / 2
    logoRx = Math.max(70, r.width * 0.38)
    logoRy = Math.max(44, r.height * 0.36)
    spawnRx = Math.min(44, r.width * 0.14)
    spawnRy = Math.min(28, r.height * 0.14)
  } else {
    originX = width / 2
    originY = height * 0.42
    logoRx = 120
    logoRy = 72
    spawnRx = 28
    spawnRy = 18
  }
}

function resizeCanvas() {
  const canvas = canvasRef.value
  if (!canvas) return
  measureOrigin()
  const nextDpr = Math.min(window.devicePixelRatio || 1, 2)
  if (nextDpr !== spriteDpr) {
    spriteDpr = nextDpr
    spriteCache.clear()
  }
  dpr = nextDpr
  const nextW = Math.max(1, Math.round(width * dpr))
  const nextH = Math.max(1, Math.round(height * dpr))
  if (canvas.width !== nextW || canvas.height !== nextH) {
    canvas.width = nextW
    canvas.height = nextH
  }
  ctx = canvas.getContext('2d', { alpha: true })
  if (reducedMotion) renderStaticConstellation()
}

function createParticle(options?: { angle?: number; prewarmProgress?: number; boost?: boolean }): Particle {
  goldenCursor = (goldenCursor + 2.399963229728653) % (Math.PI * 2)
  const angle = options?.angle ?? (goldenCursor + (Math.random() - 0.5) * 0.34)
  const layerRoll = Math.random()
  const layer = layerRoll < 0.38 ? 0 : layerRoll < 0.78 ? 1 : 2
  const boost = options?.boost ? 1.28 : 1

  const compact = width < 700
  const sizeBase = compact ? [12, 15, 19][layer] : [14, 18, 23][layer]
  const baseSize = sizeBase + Math.random() * 2.5

  const maxReach = Math.hypot(
    Math.max(originX, width - originX),
    Math.max(originY, height - originY),
  )
  const cosA = Math.cos(angle)
  const sinA = Math.sin(angle)
  const startDist = Math.hypot(cosA * logoRx * 0.55, sinA * logoRy * 0.55)
  const speedBase = [64, 92, 122][layer] * (compact ? 0.76 : 1) * boost
  const speed = speedBase * (0.86 + Math.random() * 0.32)
  const targetReach = Math.min(maxReach * 1.02, Math.max(360, maxReach * (0.72 + layer * 0.11 + Math.random() * 0.16)))
  const travelSpan = Math.max(220, targetReach - startDist)
  const life = travelSpan / speed
  const progress = options?.prewarmProgress ?? 0

  const jitterAngle = Math.random() * Math.PI * 2
  const jitterMag = Math.random()
  const maxAlpha = (isDark ? [0.42, 0.6, 0.8] : [0.34, 0.5, 0.66])[layer]

  return {
    textIndex: Math.floor(Math.random() * KAOMOJI.length),
    colorIndex: Math.floor(Math.random() * DARK_COLORS.length),
    cosA,
    sinA,
    speed,
    dist: startDist + progress * travelSpan,
    age: progress * life,
    life,
    invLife: 1 / life,
    scaleFactor: baseSize / SPRITE_FONT_SIZE,
    maxAlpha,
    rotation: (Math.random() - 0.5) * 0.34,
    rotSpeed: (Math.random() - 0.5) * 0.12,
    swayAmp: 7 + Math.random() * 13,
    swayFreq: 0.9 + Math.random() * 1.1,
    swayPhase: Math.random() * Math.PI * 2,
    parallax: (layer + 1) * 5,
    originJitterX: Math.cos(jitterAngle) * spawnRx * jitterMag,
    originJitterY: Math.sin(jitterAngle) * spawnRy * jitterMag,
    retiring: false,
    extraFade: 1,
  }
}

function prewarm() {
  particles.length = 0
  const count = width < 700 ? 24 : 46
  for (let i = 0; i < count; i++) {
    const progress = 0.04 + (i / count) * 0.9 + (Math.random() - 0.5) * 0.04
    particles.push(createParticle({ prewarmProgress: Math.max(0.02, Math.min(0.95, progress)) }))
  }
}

function burst(count = 14) {
  if (reducedMotion) return
  const now = performance.now()
  const rapid = now - lastBurstTime < 180
  lastBurstTime = now

  // Keep rapid clicks snappy and joyful without overwhelming the viewport
  const emitCount = rapid ? Math.max(6, Math.round(count * 0.5)) : count
  const baseAngle = Math.random() * Math.PI * 2
  for (let i = 0; i < emitCount; i++) {
    const angle = baseAngle + (i / emitCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.24
    particles.push(createParticle({ angle, boost: true }))
  }

  // Never abruptly delete visible particles: smoothly retire the oldest ones only above a high soft cap
  const softCap = width < 700 ? 96 : 180
  let activeCount = 0
  for (let i = 0; i < particles.length; i++) {
    if (!particles[i].retiring) activeCount++
  }
  let excess = activeCount - softCap
  if (excess > 0) {
    // Retire oldest (highest progress) non-retiring particles smoothly over ~0.55s
    for (let i = 0; i < particles.length && excess > 0; i++) {
      const p = particles[i]
      if (!p.retiring && p.age > 0.35) {
        p.retiring = true
        excess--
      }
    }
  }
}

function renderStaticConstellation() {
  if (!ctx || width <= 0 || height <= 0) return
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.clearRect(0, 0, width * dpr, height * dpr)

  const count = width < 700 ? 16 : 28
  const minR = width < 700 ? 120 : 185
  const maxR = Math.min(Math.max(width, height) * 0.46, 540)

  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + (i % 2 ? 0.14 : -0.1)
    const ring = (i % 3) / 2
    const radius = minR + ring * (maxR - minR)
    const x = originX + Math.cos(angle) * radius * 1.18
    const y = originY + Math.sin(angle) * radius * 0.82
    if (x < 32 || x > width - 32 || y < 32 || y > height - 48) continue
    const size = width < 700 ? 14 + (i % 3) * 2 : 15 + (i % 3) * 3
    const sprite = getSprite(i % KAOMOJI.length, i % DARK_COLORS.length)
    const rot = ((i % 5) - 2) * 0.08
    const s = (size / SPRITE_FONT_SIZE) * dpr
    const cosR = Math.cos(rot) * s
    const sinR = Math.sin(rot) * s
    ctx.setTransform(cosR, sinR, -sinR, cosR, x * dpr, y * dpr)
    ctx.globalAlpha = isDark ? 0.38 : 0.3
    ctx.drawImage(sprite.canvas, -sprite.hw, -sprite.hh, sprite.w, sprite.h)
  }
  ctx.globalAlpha = 1
}

function drawFrame(now: number) {
  if (!inView || reducedMotion) {
    rafId = 0
    return
  }
  rafId = requestAnimationFrame(drawFrame)
  if (document.hidden || !ctx || width <= 0 || height <= 0) {
    lastTime = now
    return
  }

  const dt = Math.min(0.05, Math.max(0.001, (now - lastTime) / 1000))
  lastTime = now

  const lerp = Math.min(1, dt * 4)
  smoothPointerX += (pointerX - smoothPointerX) * lerp
  smoothPointerY += (pointerY - smoothPointerY) * lerp

  const compact = width < 700
  const targetCount = compact ? 26 : 48
  const spawnInterval = compact ? 0.21 : 0.125
  spawnAccumulator += dt
  while (spawnAccumulator >= spawnInterval) {
    spawnAccumulator -= spawnInterval
    if (particles.length < targetCount) {
      particles.push(createParticle())
    }
  }

  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.clearRect(0, 0, Math.round(width * dpr), Math.round(height * dpr))

  const edgeMargin = compact ? 36 : 56
  const invEdgeMargin = 1 / edgeMargin

  let writeIdx = 0
  for (let i = 0; i < particles.length; i++) {
    const p = particles[i]
    p.age += dt
    if (p.retiring) {
      p.extraFade -= dt * 1.85
    }
    if (p.age >= p.life || p.extraFade <= 0) {
      continue
    }

    const t = p.age * p.invLife
    const speedFactor = 1.16 - t * 0.32
    p.dist += p.speed * speedFactor * dt

    const swayRamp = t < 0.4 ? t * 2.5 : 1
    const sway = Math.sin(p.age * p.swayFreq + p.swayPhase) * p.swayAmp * swayRamp

    const x = originX + p.originJitterX + p.cosA * p.dist - p.sinA * sway + smoothPointerX * p.parallax
    const y = originY + p.originJitterY + p.sinA * p.dist + p.cosA * sway + smoothPointerY * p.parallax

    // Scale blooms gently as particle emerges from behind the logo
    const b = t < 0.18 ? 1 - t / 0.18 : 0
    const bloom = 1 - b * b * b
    const scale = 0.48 + bloom * 0.62 + t * 0.14

    // Alpha envelope: prompt fade-in, smooth quadratic fade-out, edge fade, and soft retirement fade
    const fadeIn = t < 0.12 ? t / 0.12 : 1
    let fadeOut = 1
    if (t > 0.7) {
      const u = 1 - (t - 0.7) / 0.3
      fadeOut = u * u
    }
    const edgeDist = Math.min(x, width - x, y, height - y)
    const edgeFade = edgeDist <= 0 ? 0 : edgeDist >= edgeMargin ? 1 : edgeDist * invEdgeMargin
    const alpha = p.maxAlpha * fadeIn * fadeOut * edgeFade * p.extraFade

    if (alpha > 0.008) {
      const sprite = getSprite(p.textIndex, p.colorIndex)
      const rot = p.rotation + p.rotSpeed * p.age
      const s = scale * p.scaleFactor * dpr
      const cosR = Math.cos(rot) * s
      const sinR = Math.sin(rot) * s
      ctx.setTransform(cosR, sinR, -sinR, cosR, x * dpr, y * dpr)
      ctx.globalAlpha = alpha
      ctx.drawImage(sprite.canvas, -sprite.hw, -sprite.hh, sprite.w, sprite.h)
    }

    particles[writeIdx++] = p
  }
  particles.length = writeIdx
  ctx.globalAlpha = 1
}

function handlePointerMove(event: PointerEvent) {
  if (width <= 0 || height <= 0) return
  pointerX = (event.clientX / width - 0.5) * 2
  pointerY = (event.clientY / height - 0.5) * 2
}

function handlePointerLeave() {
  pointerX = 0
  pointerY = 0
}

function handleVisibility() {
  if (!document.hidden) lastTime = performance.now()
}

function handleThemeChange() {
  const nextDark = detectDarkMode()
  if (nextDark !== isDark) {
    isDark = nextDark
    spriteCache.clear()
  }
  if (reducedMotion) renderStaticConstellation()
}

function handleMotionChange(event: MediaQueryListEvent) {
  reducedMotion = event.matches
  cancelAnimationFrame(rafId)
  if (reducedMotion) {
    renderStaticConstellation()
  } else {
    prewarm()
    lastTime = performance.now()
    rafId = requestAnimationFrame(drawFrame)
  }
}

onMounted(() => {
  darkQuery = window.matchMedia('(prefers-color-scheme: dark)')
  motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  isDark = detectDarkMode()
  reducedMotion = motionQuery.matches

  resizeCanvas()

  if (canvasRef.value) {
    resizeObserver = new ResizeObserver(() => resizeCanvas())
    resizeObserver.observe(canvasRef.value)
    if (props.originEl) resizeObserver.observe(props.originEl)

    if ('IntersectionObserver' in window) {
      intersectionObserver = new IntersectionObserver((entries) => {
        const visible = entries.some(entry => entry.isIntersecting)
        inView = visible
        if (visible && !reducedMotion && !rafId) {
          lastTime = performance.now()
          rafId = requestAnimationFrame(drawFrame)
        }
      }, { threshold: 0.01 })
      intersectionObserver.observe(canvasRef.value)
    }
  }

  themeObserver = new MutationObserver(handleThemeChange)
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme-mode'],
  })
  darkQuery.addEventListener('change', handleThemeChange)
  motionQuery.addEventListener('change', handleMotionChange)
  window.addEventListener('resize', resizeCanvas, { passive: true })
  window.addEventListener('pointermove', handlePointerMove, { passive: true })
  document.addEventListener('pointerleave', handlePointerLeave)
  document.addEventListener('visibilitychange', handleVisibility)

  // Re-bake sprites once web fonts finish loading so glyphs use Google Sans
  document.fonts?.ready.then(() => {
    spriteCache.clear()
    if (reducedMotion) renderStaticConstellation()
  })

  requestAnimationFrame(() => {
    resizeCanvas()
    if (reducedMotion) {
      renderStaticConstellation()
    } else {
      prewarm()
      lastTime = performance.now()
      rafId = requestAnimationFrame(drawFrame)
    }
  })
})

onUnmounted(() => {
  cancelAnimationFrame(rafId)
  rafId = 0
  resizeObserver?.disconnect()
  intersectionObserver?.disconnect()
  themeObserver?.disconnect()
  darkQuery?.removeEventListener('change', handleThemeChange)
  motionQuery?.removeEventListener('change', handleMotionChange)
  window.removeEventListener('resize', resizeCanvas)
  window.removeEventListener('pointermove', handlePointerMove)
  document.removeEventListener('pointerleave', handlePointerLeave)
  document.removeEventListener('visibilitychange', handleVisibility)
  spriteCache.clear()
})

defineExpose({ burst, syncOrigin: measureOrigin })
</script>

<template>
  <canvas ref="canvasRef" class="kaomoji-canvas" aria-hidden="true" />
</template>

<style scoped>
.kaomoji-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
}
</style>
