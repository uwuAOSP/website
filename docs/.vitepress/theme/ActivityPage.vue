<!--
SPDX-FileCopyrightText: The uwuAOSP Project
SPDX-License-Identifier: Apache-2.0
-->

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import { MButton, MSearch } from 'material/vue'
import openInNewIcon from '@material-design-icons/svg/outlined/open_in_new.svg?raw'
import searchSubmitIcon from '@material-design-icons/svg/outlined/arrow_forward.svg?raw'
import arrowBackIcon from '@material-design-icons/svg/outlined/arrow_back.svg?raw'
import releaseIcon from '@material-design-icons/svg/outlined/new_releases.svg?raw'
import mergeIcon from '@material-design-icons/svg/outlined/merge_type.svg?raw'
import commitIcon from '@material-design-icons/svg/outlined/commit.svg?raw'
import issueIcon from '@material-design-icons/svg/outlined/assignment.svg?raw'
import closedIcon from '@material-design-icons/svg/outlined/task_alt.svg?raw'

const activityTypes = {
  release: { label: '发布版本', icon: releaseIcon },
  merge: { label: '合并 PR', icon: mergeIcon },
  push: { label: '推送提交', icon: commitIcon },
  'issue-open': { label: '新建 Issue', icon: issueIcon },
  'issue-close': { label: '关闭 Issue', icon: closedIcon },
}
type Item = {
  id: string
  title: string
  href: string
  repository: string
  kind: keyof typeof activityTypes
  occurred_at: string
}
type Feed = { items: Item[]; previous: string | null; next: string | null }
type Page = { direction: 'before' | 'after'; cursor: string } | null

const endpoint = (import.meta.env.VITE_ACTIVITY_API_URL as string | undefined) ??
  'https://uwuaosp-activity.uwuaosp-website.workers.dev/v1/activity'
const submitIcon = searchSubmitIcon.replace('<svg ', '<svg fill="currentColor" ')
const previousIcon = arrowBackIcon.replace('<svg ', '<svg fill="currentColor" ')
const dateFormat = new Intl.DateTimeFormat('zh-CN', { dateStyle: 'long' })
const timeFormat = new Intl.DateTimeFormat('zh-CN', { timeStyle: 'short' })
const searchText = ref('')
const query = ref('')
const page = ref<Page>(null)
const previous = ref<string | null>(null)
const next = ref<string | null>(null)
const items = ref<Item[]>([])
const loading = ref(false)
const error = ref('')
const loaded = ref(false)
const main = ref<HTMLElement | null>(null)
let pending: AbortController | undefined
let timer: number | undefined
let retry = () => { void load() }

const groups = computed(() => {
  const days = new Map<string, Item[]>()
  for (const item of items.value) {
    const day = dateFormat.format(new Date(item.occurred_at))
    if (!days.has(day)) days.set(day, [])
    days.get(day)!.push(item)
  }
  return Array.from(days, ([day, entries]) => ({ day, entries }))
})

function updateLocation(target: Page, mode: 'push' | 'replace') {
  const url = new URL(window.location.href)
  if (query.value) url.searchParams.set('q', query.value)
  else url.searchParams.delete('q')
  url.searchParams.delete('before')
  url.searchParams.delete('after')
  if (target) url.searchParams.set(target.direction, target.cursor)
  if (url.href === window.location.href) return
  if (mode === 'push') {
    window.history.replaceState({ ...window.history.state, scrollPosition: window.scrollY }, '')
    window.history.pushState({}, '', url)
  } else {
    window.history.replaceState(window.history.state, '', url)
  }
}

async function load(target = page.value, options: { quiet?: boolean; navigate?: boolean } = {}) {
  const { quiet, navigate } = options
  if (!endpoint || (quiet && pending)) return
  pending?.abort()
  const controller = new AbortController()
  pending = controller
  if (!quiet) loading.value = true
  try {
    const url = new URL(endpoint, window.location.origin)
    if (query.value) url.searchParams.set('q', query.value)
    if (target) url.searchParams.set(target.direction, target.cursor)

    const response = await fetch(url, { signal: controller.signal })
    if (!response.ok) throw new Error('Activity unavailable')
    const data: Feed = await response.json()
    if (controller.signal.aborted) return
    const current = target?.direction === 'after' && !data.previous ? null : target
    items.value = data.items
    previous.value = data.previous
    next.value = data.next
    page.value = current
    loaded.value = true
    error.value = ''
    if (navigate) {
      updateLocation(current, 'push')
      await nextTick()
      main.value?.focus({ preventScroll: true })
      window.scrollTo({ top: 0, behavior: 'instant' })
    } else if (current !== target) {
      updateLocation(current, 'replace')
    }
  } catch {
    if (!controller.signal.aborted) {
      retry = () => { void load(target, { navigate }) }
      error.value = navigate ? '暂时无法加载该页。'
        : items.value.length ? '暂时无法刷新，仍显示上次加载的动态。' : '暂时无法加载动态。'
    }
  } finally {
    if (pending === controller) {
      pending = undefined
      loading.value = false
    }
  }
}

function refreshVisible() {
  if (document.visibilityState === 'visible' && !page.value) void load(null, { quiet: true })
}

function readLocation() {
  const params = new URLSearchParams(window.location.search)
  query.value = (params.get('q') ?? '').trim().slice(0, 240)
  searchText.value = query.value
  const before = params.get('before')
  const after = params.get('after')
  page.value = before ? { direction: 'before', cursor: before }
    : after ? { direction: 'after', cursor: after } : null
  items.value = []
  previous.value = null
  next.value = null
  error.value = ''
  loaded.value = false
  void load()
}

function turnPage(direction: 'before' | 'after', cursor: string | null) {
  if (cursor && !loading.value) void load({ direction, cursor }, { navigate: true })
}

function submitSearch(text = searchText.value) {
  query.value = text.trim().slice(0, 240)
  updateLocation(null, 'push')
  readLocation()
}

function clearSearchIfEmpty(event: CustomEvent<{ value: string }>) {
  if (!event.detail.value && query.value) submitSearch('')
}

onMounted(() => {
  if (!endpoint) return
  readLocation()
  window.addEventListener('popstate', readLocation)
  timer = window.setInterval(refreshVisible, 30_000)
  document.addEventListener('visibilitychange', refreshVisible)
})

onUnmounted(() => {
  pending?.abort()
  window.clearInterval(timer)
  window.removeEventListener('popstate', readLocation)
  document.removeEventListener('visibilitychange', refreshVisible)
})
</script>

<template>
  <main id="main" ref="main" class="activity-main" tabindex="-1">
    <div v-if="endpoint" role="search">
      <MSearch
        v-model="searchText"
        full-width
        no-expand-on-focus
        placeholder="搜索项目动态"
        aria-label="搜索项目动态"
        :trailing-icon="submitIcon"
        trailing-label="搜索"
        @change="submitSearch($event.detail.value)"
        @action="submitSearch()"
        @input="clearSearchIfEmpty"
      />
    </div>

    <p v-if="!endpoint" class="activity-status">项目动态尚未接入。</p>
    <p v-else-if="loading && !loaded" class="activity-status" role="status">正在加载动态…</p>
    <div v-else-if="error" class="activity-status" role="status">
      <p>{{ error }}</p>
      <MButton variant="outlined" @click="retry()">重试</MButton>
    </div>
    <p v-else-if="loaded && !items.length" class="activity-status" role="status">
      {{ query ? '未找到匹配的动态。' : '暂无项目动态。' }}
    </p>

    <section v-for="group in groups" :key="group.day" class="activity-day">
      <h2>{{ group.day }}</h2>
      <ul>
        <li v-for="item in group.entries" :key="item.id">
          <a class="activity-item" :href="item.href">
            <span
              class="activity-type-icon"
              role="img"
              :aria-label="activityTypes[item.kind].label"
              v-html="activityTypes[item.kind].icon"
            />
            <div class="activity-item-body">
              <div class="activity-meta">
                <span>{{ item.repository }}</span>
                <time :datetime="item.occurred_at">{{ timeFormat.format(new Date(item.occurred_at)) }}</time>
              </div>
              <span class="activity-item-title">{{ item.title }}</span>
            </div>
            <span class="activity-external" aria-hidden="true" v-html="openInNewIcon" />
          </a>
        </li>
      </ul>
    </section>

    <nav v-if="previous || next || page" class="activity-controls" aria-label="动态分页">
      <MButton
        variant="outlined"
        :icon="previousIcon"
        :disabled="!previous || loading"
        @click="turnPage('after', previous)"
      >较新</MButton>
      <MButton
        variant="outlined"
        :icon="submitIcon"
        icon-position="end"
        :disabled="!next || loading"
        @click="turnPage('before', next)"
      >较旧</MButton>
      <MButton
        v-if="page && !previous && !next && !loading"
        variant="text"
        @click="load(null, { navigate: true })"
      >返回最新</MButton>
    </nav>
  </main>
</template>

<style scoped>
.activity-main { width: min(calc(100% - 32px), 880px); margin: 16px auto 64px; }
@media (max-width: 700px) {
  .activity-main { margin-top: 8px; }
}
.activity-status { margin-block: 24px; color: var(--mtrl-sys-color-on-surface-variant); }
.activity-day { margin-top: 28px; }
h2 { margin: 0 0 10px; font-size: 16px; }
.activity-day ul { margin: 0; padding: 0; list-style: none; }
.activity-day li + li { margin-top: 4px; }
.activity-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 14px;
  background: var(--mtrl-sys-color-surface-container);
  color: var(--mtrl-sys-color-on-surface);
  text-decoration: none;
}
.activity-item:hover { background: var(--mtrl-sys-color-surface-container-high); }
.activity-item:focus-visible { outline: 2px solid var(--mtrl-sys-color-primary); }
.activity-type-icon { flex-shrink: 0; color: var(--mtrl-sys-color-on-surface-variant); }
.activity-item-body { flex: 1; min-width: 0; overflow-wrap: anywhere; }
.activity-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 12px;
  margin-bottom: 4px;
  color: var(--mtrl-sys-color-on-surface-variant);
  font-size: 13px;
}
.activity-item-title { font-size: 16px; font-weight: 500; }
.activity-external { flex-shrink: 0; color: var(--mtrl-sys-color-on-surface-variant); }
.activity-external :deep(svg) { width: 18px; height: 18px; }
.activity-controls { display: flex; flex-wrap: wrap; justify-content: center; gap: 12px; margin-top: 24px; }
</style>
