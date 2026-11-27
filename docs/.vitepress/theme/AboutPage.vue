<!--
SPDX-FileCopyrightText: The uwuAOSP Project
SPDX-License-Identifier: Apache-2.0
-->

<script setup lang="ts">
import { onUnmounted, ref } from 'vue'
import { withBase } from 'vitepress'
import { MButton, MCard } from 'material/vue'
import { polygonPath, shapeFlower } from 'material/core/shapes'
import bugIcon from '@material-design-icons/svg/outlined/bug_report.svg?raw'
import devicesIcon from '@material-design-icons/svg/outlined/devices.svg?raw'
import translateIcon from '@material-design-icons/svg/outlined/translate.svg?raw'
import openInNewIcon from '@material-design-icons/svg/outlined/open_in_new.svg?raw'
import expandMoreIcon from '@material-design-icons/svg/outlined/expand_more.svg?raw'
import githubIcon from './icons/github.svg?raw'
import KaomojiBurst from './KaomojiBurst.vue'
import EasterEggRain from './EasterEggRain.vue'

const githubButtonIcon = githubIcon
const bugButtonIcon = bugIcon.replace('<svg ', '<svg fill="currentColor" ')
const devicesButtonIcon = devicesIcon.replace('<svg ', '<svg fill="currentColor" ')
const translateButtonIcon = translateIcon.replace('<svg ', '<svg fill="currentColor" ')
const flowerShape = polygonPath(shapeFlower(), 320)

const upstreams = [
  { name: 'Android Open Source Project', note: '系统源码基础', href: 'https://source.android.com/' },
  { name: 'CatShare', note: '互传协议与上游实现', href: 'https://github.com/kmod-midori/CatShare' },
  { name: 'Cirno', note: '墓碑后台实现参考', href: 'https://github.com/Freezer-Team/Cirno' },
  { name: 'Smartspacer', note: '桌面一览扩展支持', href: 'https://github.com/KieronQuinn/Smartspacer' },
  { name: 'Tesseract OCR', note: 'uwuPrism 本地文字识别', href: 'https://github.com/tesseract-ocr/tesseract' },
  { name: 'llama.cpp', note: '端侧推理运行时', href: 'https://github.com/ggml-org/llama.cpp' },
  { name: 'PUI Theme For Stock Android', note: '天伞桜（系统小图标风格）', href: '' },
]

const licenses = [
  {
    name: '本页专属二创 Logo',
    note: 'Jelly10086/AOSP-VtuberLOGO（CC BY-NC 4.0）',
    href: 'https://github.com/Jelly10086/AOSP-VtuberLOGO',
  },
  {
    name: '官方网站源码',
    note: 'uwuAOSP/website（Apache-2.0），使用 VitePress 与 md3.io 构建',
    href: 'https://github.com/uwuAOSP/website',
  },
  {
    name: '项目文档仓库',
    note: 'uwuAOSP/Docs（Apache-2.0）',
    href: 'https://github.com/uwuAOSP/Docs',
  },
]

const logoAnchor = ref<HTMLElement | null>(null)
const burstLayer = ref<InstanceType<typeof KaomojiBurst> | null>(null)
const easterEggRain = ref<InstanceType<typeof EasterEggRain> | null>(null)
const overviewSection = ref<HTMLElement | null>(null)

// Rapid-click Easter egg streak tracker (20+ rapid clicks triggers emoji rain)
const EASTER_EGG_THRESHOLD = 20
const RAPID_CLICK_WINDOW_MS = 650
let rapidStreak = 0
let lastLogoClickAt = 0

// Damped spring state for volume-preserving jelly squash & stretch
let springRaf = 0
let springLast = 0
let hovered = false
let pressed = false
let pressOffsetX = 0
let usedPointer = false
let sx = 1
let sy = 1
let rot = 0
let vsx = 0
let vsy = 0
let vrot = 0

function isReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function applyLogoTransform() {
  const el = logoAnchor.value
  if (!el) return
  if (Math.abs(sx - 1) < 0.0004 && Math.abs(sy - 1) < 0.0004 && Math.abs(rot) < 0.01) {
    el.style.transform = ''
  } else {
    el.style.transform = `scale3d(${sx.toFixed(4)}, ${sy.toFixed(4)}, 1) rotate(${rot.toFixed(2)}deg)`
  }
}

function stepSpring(now: number) {
  const dt = Math.min(0.032, Math.max(0.001, (now - springLast) / 1000))
  springLast = now

  const base = hovered ? 1.03 : 1
  const tx = pressed ? base * 1.09 : base
  const ty = pressed ? base * 0.89 : base
  const trot = pressed ? pressOffsetX * 3.5 : 0

  // Underdamped spring (zeta ~ 0.34) for juicy jelly bounce
  const k = 340
  const d = 12.5
  vsx += ((tx - sx) * k - vsx * d) * dt
  vsy += ((ty - sy) * k - vsy * d) * dt
  sx += vsx * dt
  sy += vsy * dt

  const kRot = 260
  const dRot = 11
  vrot += ((trot - rot) * kRot - vrot * dRot) * dt
  rot += vrot * dt

  applyLogoTransform()

  const settled =
    Math.abs(tx - sx) < 0.0006 && Math.abs(vsx) < 0.004 &&
    Math.abs(ty - sy) < 0.0006 && Math.abs(vsy) < 0.004 &&
    Math.abs(trot - rot) < 0.02 && Math.abs(vrot) < 0.08

  if (settled) {
    sx = tx
    sy = ty
    rot = trot
    vsx = 0
    vsy = 0
    vrot = 0
    applyLogoTransform()
    springRaf = 0
    return
  }

  springRaf = requestAnimationFrame(stepSpring)
}

function wakeSpring() {
  if (isReducedMotion()) return
  if (!springRaf) {
    springLast = performance.now()
    springRaf = requestAnimationFrame(stepSpring)
  }
}

function clampVelocity(v: number, limit: number) {
  return Math.max(-limit, Math.min(limit, v))
}

function onLogoPointerEnter() {
  hovered = true
  wakeSpring()
}

function onLogoPointerDown(event: PointerEvent) {
  usedPointer = true
  pressed = true
  const el = logoAnchor.value
  if (el) {
    const rect = el.getBoundingClientRect()
    pressOffsetX = Math.max(-1, Math.min(1, ((event.clientX - rect.left) / rect.width - 0.5) * 2))
  } else {
    pressOffsetX = 0
  }
  vsx = clampVelocity(vsx + 1.6, 7)
  vsy = clampVelocity(vsy - 2.1, 7)
  vrot = clampVelocity(vrot + pressOffsetX * 18, 90)
  wakeSpring()
}

function releaseLogoSpring(rebound: boolean) {
  if (!pressed) return
  pressed = false
  if (rebound) {
    vsx = clampVelocity(vsx - 2.6, 8)
    vsy = clampVelocity(vsy + 3.6, 8)
    vrot = clampVelocity(vrot - pressOffsetX * 32, 110)
  }
  wakeSpring()
}

function onLogoPointerUp() {
  releaseLogoSpring(true)
}

function onLogoPointerLeave() {
  hovered = false
  releaseLogoSpring(false)
  wakeSpring()
}

function onLogoPointerCancel() {
  releaseLogoSpring(false)
}

function openLink(url: string, external = true) {
  window.location.assign(external ? url : withBase(url))
}

function scrollToOverview() {
  overviewSection.value?.scrollIntoView({ behavior: isReducedMotion() ? 'auto' : 'smooth', block: 'start' })
}

function triggerLogoBurst() {
  burstLayer.value?.burst(14)

  const now = performance.now()
  if (now - lastLogoClickAt <= RAPID_CLICK_WINDOW_MS) {
    rapidStreak++
  } else {
    rapidStreak = 1
  }
  lastLogoClickAt = now

  if (rapidStreak === 10) {
    easterEggRain.value?.preload()
  } else if (rapidStreak === EASTER_EGG_THRESHOLD) {
    void easterEggRain.value?.trigger(undefined, 4.2)
  } else if (rapidStreak > EASTER_EGG_THRESHOLD && (rapidStreak - EASTER_EGG_THRESHOLD) % 3 === 0) {
    void easterEggRain.value?.trigger(16, 1.4)
  }

  if (!usedPointer) {
    // Keyboard activation (Enter/Space) also gets the full jelly bounce
    const dir = Math.random() > 0.5 ? 1 : -1
    vsx = clampVelocity(vsx - 2.4, 8)
    vsy = clampVelocity(vsy + 3.4, 8)
    vrot = clampVelocity(vrot + dir * 28, 110)
    wakeSpring()
  }
  usedPointer = false
}

function onLogoLoad() {
  burstLayer.value?.syncOrigin()
}

onUnmounted(() => {
  cancelAnimationFrame(springRaf)
  springRaf = 0
})
</script>

<template>
  <main id="main" class="about-page" tabindex="-1" aria-label="关于我们">
    <EasterEggRain ref="easterEggRain" />
    <section class="about-hero-stage" aria-label="uwuAOSP">
      <KaomojiBurst ref="burstLayer" :origin-el="logoAnchor" />

      <div class="about-hero-inner">
        <div class="about-hero-visual">
          <button
            ref="logoAnchor"
            type="button"
            class="about-logo-button"
            aria-label="uwuAOSP"
            @pointerenter="onLogoPointerEnter"
            @pointerdown="onLogoPointerDown"
            @pointerup="onLogoPointerUp"
            @pointerleave="onLogoPointerLeave"
            @pointercancel="onLogoPointerCancel"
            @click="triggerLogoBurst"
          >
            <img
              class="about-logo-image"
              :src="withBase('/uwu-logo.png')"
              alt="uwuAOSP"
              width="677"
              height="401"
              decoding="async"
              fetchpriority="high"
              @load="onLogoLoad"
            >
          </button>
        </div>

        <div class="about-hero-copy">
          <h1 class="about-hero-heading">基于 AOSP 的社区开源系统</h1>
          <p class="about-hero-desc">
            保留原生 Android 的界面与操作习惯，面向日常使用补齐隐私控制、系统增强与本地工具。
          </p>
          <p class="about-hero-desc">
            同时维护交互式构建工具 uwuCLI、设备移植文档与完整的发布清单，让源码构建与移植更顺手。
          </p>
        </div>
      </div>

      <button
        type="button"
        class="about-scroll-cue"
        aria-label="向下查看更多"
        @click="scrollToOverview"
      >
        <span aria-hidden="true" v-html="expandMoreIcon" />
      </button>
    </section>

    <div id="about-details" ref="overviewSection" class="about-content">
      <section class="about-section" aria-labelledby="about-contribute-heading">
        <MCard variant="filled" class="contribute-card">
          <div class="contribute-inner">
            <svg class="contribute-shape" viewBox="0 0 320 320" aria-hidden="true">
              <path :d="flowerShape" />
            </svg>
            <div class="contribute-copy">
              <h2 id="about-contribute-heading">为 uwuAOSP 贡献</h2>
              <p>
                欢迎参与源码开发、完善文档与多语言翻译，或使用 uwuCLI 为你的设备移植 uwuAOSP。
              </p>
            </div>
            <div class="contribute-actions">
              <MButton
                variant="filled"
                size="m"
                :icon="devicesButtonIcon"
                @click="openLink('/building/bringup.html', false)"
              >设备移植指南</MButton>
              <MButton
                variant="outlined"
                size="m"
                :icon="githubButtonIcon"
                @click="openLink('https://github.com/uwuAOSP')"
              >GitHub 组织</MButton>
              <MButton
                variant="outlined"
                size="m"
                :icon="translateButtonIcon"
                @click="openLink('https://github.com/uwuAOSP/platform_vendor_uwu-translations')"
              >参与翻译</MButton>
              <MButton
                variant="outlined"
                size="m"
                :icon="bugButtonIcon"
                @click="openLink('https://github.com/uwuAOSP/issue_tracker/issues')"
              >提交反馈</MButton>
            </div>
          </div>
        </MCard>
      </section>

      <section class="about-section" aria-labelledby="about-credits-heading">
        <h2 id="about-credits-heading" class="about-section-title">致谢与署名</h2>

        <div class="credits-grid">
          <div class="credit-group">
            <h3 class="credit-group-title">上游与开源项目</h3>
            <ul class="segmented-list" aria-label="上游与开源项目">
              <li v-for="up in upstreams" :key="up.name">
                <a
                  v-if="up.href"
                  class="segmented-item segmented-item--link"
                  :href="up.href"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span class="segmented-text">
                    <span class="segmented-headline">{{ up.name }}</span>
                    <span class="segmented-supporting">{{ up.note }}</span>
                  </span>
                  <span class="segmented-trailing" aria-hidden="true" v-html="openInNewIcon" />
                </a>
                <div v-else class="segmented-item">
                  <span class="segmented-text">
                    <span class="segmented-headline">{{ up.name }}</span>
                    <span class="segmented-supporting">{{ up.note }}</span>
                  </span>
                </div>
              </li>
            </ul>
          </div>

          <div class="credit-group">
            <h3 class="credit-group-title">署名与许可</h3>
            <ul class="segmented-list" aria-label="署名与许可">
              <li v-for="item in licenses" :key="item.name">
                <a
                  class="segmented-item segmented-item--link"
                  :href="item.href"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span class="segmented-text">
                    <span class="segmented-headline">{{ item.name }}</span>
                    <span class="segmented-supporting">{{ item.note }}</span>
                  </span>
                  <span class="segmented-trailing" aria-hidden="true" v-html="openInNewIcon" />
                </a>
              </li>
            </ul>
          </div>
        </div>
      </section>
    </div>

    <footer class="about-footer">
      <span class="brand-wordmark">uwuAOSP</span>
      <span>由社区共同构建</span>
    </footer>
  </main>
</template>

<style scoped>
.about-page {
  display: flex;
  flex-direction: column;
}

.about-hero-stage {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: calc(100svh - 88px);
  overflow: hidden;
  isolation: isolate;
}

.about-hero-stage::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  background: radial-gradient(
    circle 520px at 31% 48%,
    color-mix(in srgb, #97CEFB 11%, transparent) 0%,
    color-mix(in srgb, #97CEFB 5.5%, transparent) 30%,
    color-mix(in srgb, #B4B8FF 2%, transparent) 58%,
    transparent 82%
  );
}

.about-hero-inner {
  position: relative;
  z-index: 1;
  width: min(calc(100% - 80px), 1140px);
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr);
  align-items: center;
  gap: clamp(36px, 6vw, 88px);
  padding-block: 24px 56px;
}

.about-hero-visual {
  display: flex;
  align-items: center;
  justify-content: center;
}

.about-logo-button {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin: 0;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
  border-radius: 36px;
  -webkit-tap-highlight-color: transparent;
  will-change: transform;
}

.about-logo-button:focus-visible {
  outline: 2px solid var(--mtrl-sys-color-primary);
  outline-offset: 10px;
}

.about-logo-image {
  display: block;
  width: clamp(280px, 31vw, 440px);
  height: auto;
  user-select: none;
  -webkit-user-drag: none;
  will-change: transform;
}

.about-hero-copy {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  max-width: 500px;
}

.about-hero-copy::before {
  content: "";
  position: absolute;
  inset: -48px -56px;
  z-index: -1;
  pointer-events: none;
  background: radial-gradient(
    ellipse at center,
    color-mix(in srgb, var(--mtrl-sys-color-surface) 86%, transparent) 36%,
    color-mix(in srgb, var(--mtrl-sys-color-surface) 52%, transparent) 58%,
    transparent 78%
  );
}

.about-hero-heading {
  margin: 0 0 18px;
  font-size: clamp(28px, 3vw, 38px);
  font-weight: 700;
  line-height: 1.24;
  letter-spacing: -0.02em;
  color: var(--mtrl-sys-color-on-surface);
}

.about-hero-desc {
  margin: 0;
  font-size: 16px;
  line-height: 1.8;
  color: var(--mtrl-sys-color-on-surface-variant);
}

.about-hero-desc + .about-hero-desc {
  margin-top: 12px;
}

.about-scroll-cue {
  position: absolute;
  bottom: 20px;
  z-index: 1;
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  margin: 0;
  padding: 0;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: var(--mtrl-sys-color-on-surface-variant);
  cursor: pointer;
  opacity: 0.72;
  transition: opacity 200ms ease, background-color 200ms ease, transform 300ms var(--home-spatial);
}

@media (hover: hover) {
  .about-scroll-cue:hover {
    opacity: 1;
    background: var(--mtrl-sys-color-surface-container-high);
    transform: translateY(2px);
  }
}

.about-scroll-cue:focus-visible {
  outline: 2px solid var(--mtrl-sys-color-primary);
}

.about-content {
  width: min(calc(100% - 80px), 1080px);
  margin: 0 auto;
  padding-top: 56px;
  display: flex;
  flex-direction: column;
  gap: 48px;
  scroll-margin-top: 88px;
}

.about-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.about-section-title {
  margin: 0;
  font-size: 22px;
  font-weight: 600;
  line-height: 30px;
  color: var(--mtrl-sys-color-on-surface);
}

.contribute-card {
  display: block;
  overflow: hidden;
  border-radius: 28px;
  --mtrl-sys-shape-corner-medium: 28px;
  --mtrl-sys-color-surface-container-highest: color-mix(
    in srgb,
    var(--mtrl-sys-color-primary-container) 48%,
    var(--mtrl-sys-color-surface)
  );
}

.contribute-inner {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 20px;
  color: var(--mtrl-sys-color-on-primary-container);
}

.contribute-shape {
  position: absolute;
  right: -24px;
  bottom: -92px;
  width: 240px;
  height: 240px;
  opacity: 0.07;
  pointer-events: none;
}

.contribute-copy {
  position: relative;
  z-index: 1;
  max-width: 640px;
}

.contribute-copy h2 {
  margin: 0 0 8px;
  font-size: 24px;
  font-weight: 600;
  line-height: 32px;
}

.contribute-copy p {
  margin: 0;
  font-size: 15px;
  line-height: 1.7;
  opacity: 0.9;
}

.contribute-actions {
  position: relative;
  z-index: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.credits-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px;
  align-items: start;
}

.credit-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.credit-group-title {
  margin: 0;
  padding-inline: 16px;
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  color: var(--mtrl-sys-color-primary);
}

.segmented-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.segmented-item {
  display: flex;
  align-items: center;
  gap: 16px;
  min-width: 0;
  min-height: 72px;
  padding: 12px 16px;
  border-radius: 4px;
  background: var(--mtrl-sys-color-surface-container);
  color: var(--mtrl-sys-color-on-surface);
  text-decoration: none;
  transition:
    background-color 180ms ease,
    border-radius 260ms var(--home-spatial);
}

.segmented-list > li:first-child > .segmented-item {
  border-start-start-radius: 20px;
  border-start-end-radius: 20px;
}

.segmented-list > li:last-child > .segmented-item {
  border-end-start-radius: 20px;
  border-end-end-radius: 20px;
}

.segmented-item--link {
  cursor: pointer;
}

@media (hover: hover) {
  .segmented-item--link:hover {
    background: var(--mtrl-sys-color-surface-container-high);
    border-radius: 12px;
  }
}

.segmented-item--link:focus-visible {
  outline: 2px solid var(--mtrl-sys-color-primary);
  outline-offset: -2px;
  border-radius: 20px;
}

.segmented-item--link:active {
  background: var(--mtrl-sys-color-surface-container-highest);
  border-radius: 20px;
}

.segmented-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
}

.segmented-headline {
  font-size: 16px;
  font-weight: 400;
  line-height: 24px;
  letter-spacing: 0.15px;
  color: var(--mtrl-sys-color-on-surface);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.segmented-supporting {
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
  color: var(--mtrl-sys-color-on-surface-variant);
}

.segmented-trailing {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  color: var(--mtrl-sys-color-on-surface-variant);
}

.segmented-trailing :deep(svg) {
  width: 20px;
  height: 20px;
}

.about-footer {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  width: 100%;
  max-width: 1376px;
  margin: 56px auto 0;
  padding: 20px 48px 28px;
  color: var(--mtrl-sys-color-on-surface-variant);
  font-size: 12px;
  line-height: 20px;
}

@media (prefers-reduced-motion: no-preference) {
  .about-logo-image {
    animation: about-logo-float 4.8s ease-in-out infinite;
  }
}

@keyframes about-logo-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-7px); }
}

@media (max-width: 900px) {
  .about-hero-stage::before {
    background: radial-gradient(
      circle 420px at 50% 32%,
      color-mix(in srgb, #97CEFB 11%, transparent) 0%,
      color-mix(in srgb, #97CEFB 5.5%, transparent) 30%,
      color-mix(in srgb, #B4B8FF 2%, transparent) 58%,
      transparent 82%
    );
  }
  .about-hero-inner {
    width: calc(100% - 48px);
    grid-template-columns: 1fr;
    gap: 28px;
    justify-items: center;
    padding-block: 20px 64px;
  }
  .about-hero-copy {
    align-items: center;
    text-align: center;
    max-width: 540px;
  }
  .about-content { width: calc(100% - 48px); gap: 36px; padding-top: 40px; }
  .credits-grid { grid-template-columns: 1fr; gap: 20px; }
  .about-footer { padding-inline: 24px; }
}

@media (max-width: 700px) {
  .about-hero-stage { min-height: calc(100svh - 80px); }
  .about-hero-inner { width: calc(100% - 32px); gap: 22px; }
  .about-logo-image { width: min(74vw, 310px); }
  .about-hero-heading { font-size: 26px; margin-bottom: 12px; }
  .about-hero-desc { font-size: 15px; line-height: 1.75; }
  .about-content { width: calc(100% - 32px); gap: 32px; scroll-margin-top: 80px; }
  .contribute-inner { padding: 12px; }
  .contribute-copy h2 { font-size: 21px; line-height: 28px; }
  .about-footer { margin-top: 40px; padding-inline: 16px; }
}

@media (prefers-reduced-motion: reduce) {
  .about-logo-button,
  .about-scroll-cue,
  .segmented-item {
    transition: none;
  }
}
</style>
