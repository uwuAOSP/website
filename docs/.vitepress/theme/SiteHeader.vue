<!--
SPDX-FileCopyrightText: The uwuAOSP Project
SPDX-License-Identifier: Apache-2.0
-->

<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { useData, withBase } from 'vitepress'
import { MAppBar, MButton, MIconButton } from 'material/vue'
import lightIcon from '@material-design-icons/svg/outlined/light_mode.svg?raw'
import darkIcon from '@material-design-icons/svg/outlined/dark_mode.svg?raw'
import activityIcon from '@material-design-icons/svg/outlined/timeline.svg?raw'
import infoIcon from '@material-design-icons/svg/outlined/info.svg?raw'
import menuIcon from '@material-design-icons/svg/outlined/menu.svg?raw'
import closeIcon from '@material-design-icons/svg/outlined/close.svg?raw'
import backIcon from './icons/expressive-back.svg?raw'
import DocsNavigation from './DocsNavigation.vue'

defineProps<{ home?: boolean; pageTitle?: string; back?: boolean; backHref?: string; docs?: boolean }>()

const { page } = useData()
const dark = ref(false)
const drawer = ref<HTMLDialogElement | null>(null)
const drawerOpen = ref(false)
const lightModeIcon = lightIcon.replace('<svg ', '<svg fill="currentColor" ')
const darkModeIcon = darkIcon.replace('<svg ', '<svg fill="currentColor" ')
const closeButtonIcon = closeIcon.replace('<svg ', '<svg fill="currentColor" ')
let systemTheme: MediaQueryList | undefined
let desktop: MediaQueryList | undefined

function showDrawer() {
  const dialog = drawer.value
  if (!dialog || dialog.open) return
  dialog.showModal()
  drawerOpen.value = true
}

function closeDrawer() {
  drawer.value?.close()
  drawerOpen.value = false
}

function closeOnDesktop(event: MediaQueryListEvent) {
  if (event.matches) closeDrawer()
}

watch(() => page.value.relativePath, closeDrawer)

function updateThemeColor() {
  const color = getComputedStyle(document.documentElement)
    .getPropertyValue('--mtrl-sys-color-surface').trim()
  if (color) document.querySelector('meta[name="theme-color"]')?.setAttribute('content', color)
}

function followSystem(event: MediaQueryListEvent) {
  if (!document.documentElement.dataset.themeMode) {
    dark.value = event.matches
    updateThemeColor()
  }
}

function toggleAppearance() {
  dark.value = !dark.value
  const mode = dark.value ? 'dark' : 'light'
  document.documentElement.dataset.theme = 'uwu'
  document.documentElement.dataset.themeMode = mode
  try { localStorage.setItem('uwu-appearance', mode) } catch {}
  updateThemeColor()
}

onMounted(() => {
  systemTheme = window.matchMedia('(prefers-color-scheme: dark)')
  const mode = document.documentElement.dataset.themeMode
  dark.value = mode ? mode === 'dark' : systemTheme.matches
  systemTheme.addEventListener('change', followSystem)
  desktop = window.matchMedia('(width > 900px)')
  desktop.addEventListener('change', closeOnDesktop)
  updateThemeColor()
})

onUnmounted(() => {
  systemTheme?.removeEventListener('change', followSystem)
  desktop?.removeEventListener('change', closeOnDesktop)
})
</script>

<template>
  <header class="site-header" :class="{ 'site-header--with-back': back, 'site-header--docs': docs }">
    <MAppBar no-scroll>
      <template v-if="back" #leading>
        <a
          class="appbar-back"
          :href="withBase(backHref ?? '/')"
          :aria-label="backHref ? '返回上一级' : '返回首页'"
          :title="backHref ? '返回上一级' : '返回首页'"
        >
          <span aria-hidden="true" v-html="backIcon" />
        </a>
      </template>
      <h1 v-if="home" class="appbar-title"><span class="brand-wordmark">uwuAOSP</span></h1>
      <div v-else class="appbar-page" :class="{ 'appbar-page--with-back': back }">
        <span v-if="back" class="brand-wordmark">uwuAOSP</span>
        <a v-else class="brand-wordmark appbar-home" :href="withBase('/')">uwuAOSP</a>
        <span class="appbar-page-title">{{ pageTitle }}</span>
      </div>
      <template #trailing>
        <a
          v-if="home"
          class="appbar-activity"
          :href="withBase('/about.html')"
          aria-label="关于我们"
          title="关于我们"
        ><span aria-hidden="true" v-html="infoIcon" /></a>
        <a
          v-if="home"
          class="appbar-activity"
          :href="withBase('/activity.html')"
          aria-label="项目动态"
          title="项目动态"
        ><span aria-hidden="true" v-html="activityIcon" /></a>
        <button
          v-if="docs"
          type="button"
          class="appbar-activity docs-menu-button"
          aria-label="打开文档目录"
          aria-haspopup="dialog"
          aria-controls="docs-drawer"
          :aria-expanded="drawerOpen"
          @click="showDrawer"
        ><span aria-hidden="true" v-html="menuIcon" /></button>
        <MIconButton
          :class="{ 'docs-desktop-theme': docs }"
          :icon="dark ? lightModeIcon : darkModeIcon"
          :aria-label="dark ? '切换到浅色模式' : '切换到深色模式'"
          @click="toggleAppearance"
        />
      </template>
    </MAppBar>
  </header>
  <dialog
    v-if="docs"
    id="docs-drawer"
    ref="drawer"
    class="docs-drawer"
    aria-labelledby="docs-drawer-title"
    @click.self="closeDrawer"
    @close="drawerOpen = false"
  >
    <div class="docs-drawer-panel">
      <div class="docs-drawer-head">
        <h2 id="docs-drawer-title">文档目录</h2>
        <MIconButton :icon="closeButtonIcon" aria-label="关闭文档目录" autofocus @click="closeDrawer" />
      </div>
      <div class="docs-drawer-scroll">
        <DocsNavigation @navigate="closeDrawer" />
      </div>
      <div class="docs-drawer-actions">
        <MButton
          variant="outlined"
          :icon="dark ? lightModeIcon : darkModeIcon"
          @click="toggleAppearance"
        >{{ dark ? '切换到浅色模式' : '切换到深色模式' }}</MButton>
      </div>
    </div>
  </dialog>
</template>

<style scoped>
.docs-menu-button {
  display: none;
  margin: 0;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
}
.docs-drawer {
  position: fixed;
  inset: 0;
  width: 100%;
  max-width: none;
  height: 100dvh;
  max-height: none;
  margin: 0;
  padding: 0;
  border: 0;
  border-radius: 0;
  background: var(--mtrl-sys-color-surface-container);
  color: var(--mtrl-sys-color-on-surface);
  overflow: hidden;
}
.docs-drawer::backdrop { background: color-mix(in srgb, var(--mtrl-sys-color-scrim) 32%, transparent); }
.docs-drawer-panel { display: flex; flex-direction: column; height: 100%; }
.docs-drawer-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: max(8px, env(safe-area-inset-top, 0px)) 8px 8px 20px;
}
.docs-drawer-head h2 { margin: 0; font-size: 20px; font-weight: 600; }
.docs-drawer-scroll { flex: 1; min-height: 0; overflow-y: auto; overscroll-behavior: contain; }
.docs-drawer-actions {
  display: flex;
  justify-content: center;
  padding: 12px 8px max(12px, env(safe-area-inset-bottom, 0px));
  border-top: 1px solid var(--mtrl-sys-color-outline-variant);
}
:global(html:has(.docs-drawer[open])) { overflow: hidden; }
@media (width <= 900px) {
  .site-header--docs { padding-inline-end: 0; }
  .docs-menu-button { display: inline-flex; }
  .docs-desktop-theme { display: none; }
}
@media (prefers-reduced-motion: no-preference) {
  .docs-drawer[open] { animation: docs-slide-in 220ms cubic-bezier(.2, 0, 0, 1); }
  @keyframes docs-slide-in {
    from { transform: translateX(100%); }
    to { transform: translateX(0); }
  }
}
</style>
