<!--
SPDX-FileCopyrightText: The uwuAOSP Project
SPDX-License-Identifier: Apache-2.0
-->

<script setup lang="ts">
import openInNewIcon from '@material-design-icons/svg/outlined/open_in_new.svg?raw'
import { data as releases } from '../changelog.data'
</script>

<template>
  <main id="main" class="changelog" tabindex="-1" aria-label="更新日志">
    <article
      v-for="release in releases"
      :id="`v${release.version}`"
      :key="release.version"
      class="release"
      :aria-labelledby="`title-v${release.version}`"
    >
      <header class="release-header">
        <h2 :id="`title-v${release.version}`">
          <a :href="`#v${release.version}`">{{ release.version }}</a>
        </h2>
        <div class="release-meta">
          <time :datetime="release.date">{{ release.date }}</time>
          <a class="release-source" :href="release.source">
            查看原文
            <span aria-hidden="true" v-html="openInNewIcon" />
          </a>
        </div>
      </header>
      <div class="release-body" v-html="release.html" />
    </article>
  </main>
</template>

<style scoped>
.changelog { width: min(calc(100% - 48px), 768px); margin: 20px auto 64px; }
.release { scroll-margin-top: 104px; }
.release + .release {
  margin-top: 40px;
  padding-top: 32px;
  border-top: 1px solid var(--mtrl-sys-color-outline-variant);
}
.release-header { margin-bottom: 20px; }
.release-header h2 {
  margin: 0 0 4px;
  font-size: clamp(32px, 6vw, 44px);
  line-height: 1.2;
  font-weight: 700;
  color: var(--mtrl-sys-color-primary);
}
.release-header h2 a { text-decoration: none; }
.release-header h2 a:hover { text-decoration: underline; text-underline-offset: 5px; }
.release-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  column-gap: 20px;
  font-size: 14px;
  line-height: 24px;
  color: var(--mtrl-sys-color-on-surface-variant);
}
.release-source {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 40px;
  color: var(--mtrl-sys-color-primary);
  text-underline-offset: 3px;
}
.release-source :deep(svg) { width: 16px; height: 16px; }
.release-body { font-size: 16px; line-height: 1.75; overflow-wrap: anywhere; }
.release-body :deep(p) { font: inherit; }
.release-body :deep(ul), .release-body :deep(ol) { padding-inline-start: 1.45em; margin-block: 12px; }
.release-body :deep(ul) { list-style: disc; }
.release-body :deep(ol) { list-style: decimal; }
.release-body :deep(li + li) { margin-top: 6px; }
.release-body :deep(li > p) { margin: 0; }
.release-body :deep(h3) { margin: 24px 0 8px; font-size: 18px; font-weight: 700; line-height: 1.45; }
.release-body :deep(a) { color: var(--mtrl-sys-color-primary); text-underline-offset: 3px; }
.release-body :deep(pre) {
  padding: 12px 16px;
  border-radius: 12px;
  background: var(--mtrl-sys-color-surface-container);
  overflow-x: auto;
}
@media (max-width: 700px) {
  .changelog { width: calc(100% - 32px); margin-top: 12px; }
  .release { scroll-margin-top: 96px; }
  .release + .release { margin-top: 32px; padding-top: 24px; }
}
</style>
