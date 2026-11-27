<!--
SPDX-FileCopyrightText: The uwuAOSP Project
SPDX-License-Identifier: Apache-2.0
-->

<script setup lang="ts">
import { computed } from 'vue'
import { useData } from 'vitepress'
import AboutPage from './AboutPage.vue'
import ActivityPage from './ActivityPage.vue'
import ChangelogPage from './ChangelogPage.vue'
import HomePage from './HomePage.vue'
import DocPage from './DocPage.vue'
import DocsNavigation from './DocsNavigation.vue'
import SiteHeader from './SiteHeader.vue'

const { page, frontmatter } = useData()
const docs = computed(() => /^(building|project-docs)\//.test(page.value.relativePath ?? ''))
</script>

<template>
  <HomePage v-if="page.relativePath === 'index.md'" />
  <template v-else>
    <a class="skip-link" href="#main">跳到主要内容</a>
    <SiteHeader
      :page-title="frontmatter.appBarTitle ?? page.title"
      :back-href="frontmatter.parent"
      :docs="docs"
      back
    />
    <AboutPage v-if="page.relativePath === 'about.md'" />
    <ActivityPage v-else-if="page.relativePath === 'activity.md'" />
    <ChangelogPage v-else-if="page.relativePath === 'changelog.md'" />
    <div v-else-if="docs" class="docs-layout">
      <aside class="docs-sidebar"><DocsNavigation /></aside>
      <DocPage />
    </div>
    <DocPage v-else />
  </template>
</template>

<style scoped>
.docs-sidebar { display: none; }
@media (width > 900px) {
  .docs-layout {
    display: grid;
    grid-template-columns: minmax(190px, 232px) minmax(0, 768px);
    justify-content: center;
    gap: clamp(28px, 4vw, 64px);
    max-width: 1296px;
    margin-inline: auto;
    padding-inline: 40px;
  }
  .docs-sidebar {
    display: block;
    position: sticky;
    top: 104px;
    align-self: start;
    max-height: calc(100dvh - 120px);
    margin-top: 20px;
    border-radius: 20px;
    overflow-y: auto;
    overscroll-behavior: contain;
  }
  .docs-layout > .doc-content { width: 100%; min-width: 0; }
}
</style>
