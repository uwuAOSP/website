<!--
SPDX-FileCopyrightText: The uwuAOSP Project
SPDX-License-Identifier: Apache-2.0
-->

<script setup lang="ts">
import { withBase } from 'vitepress'
import { MButton, MCard } from 'material/vue'
import { polygonPath, shapeFlower, shapeArch, shapeCookie4Sided } from 'material/core/shapes'
import bookIcon from '@material-design-icons/svg/outlined/menu_book.svg?raw'
import historyIcon from '@material-design-icons/svg/outlined/history.svg?raw'
import buildIcon from '@material-design-icons/svg/outlined/construction.svg?raw'
import arrowIcon from '@material-design-icons/svg/outlined/arrow_forward.svg?raw'
import openInNewIcon from '@material-design-icons/svg/outlined/open_in_new.svg?raw'
import bugIcon from '@material-design-icons/svg/outlined/bug_report.svg?raw'
import githubIcon from './icons/github.svg?raw'
import SiteHeader from './SiteHeader.vue'

const githubButtonIcon = githubIcon
const bugButtonIcon = bugIcon.replace('<svg ', '<svg fill="currentColor" ')
const flower = polygonPath(shapeFlower(), 320)
const arch = polygonPath(shapeArch(), 320)
const cookie = polygonPath(shapeCookie4Sided(), 320)
const entries = [
  { title: '项目文档', icon: bookIcon, tone: 'primary', shape: arch, href: '/project-docs/' },
  { title: '更新日志', icon: historyIcon, tone: 'secondary', shape: cookie, href: '/changelog.html' },
  { title: '构建与移植', icon: buildIcon, tone: 'tertiary', shape: flower, href: '/building/' },
]
const externalLinks = [
  { title: 'GitHub', icon: githubIcon, href: 'https://github.com/uwuAOSP' },
  { title: 'Issue Tracker', icon: bugIcon, href: 'https://github.com/uwuAOSP/issue_tracker/issues' },
]

function openProjectLink(url: string) {
  window.location.assign(url)
}
</script>

<template>
  <a class="skip-link" href="#main">跳到主要内容</a>

  <div class="site-page">
    <SiteHeader home />

    <div class="site-shell">
    <main id="main" class="home-main" tabindex="-1">
      <section class="desktop-brand" aria-label="uwuAOSP">
        <h2 class="desktop-brand-title"><span class="brand-wordmark">uwuAOSP</span></h2>
        <div class="desktop-brand-actions">
          <MButton
            v-for="(link, index) in externalLinks"
            :key="link.href"
            variant="outlined"
            size="m"
            :icon="index === 0 ? githubButtonIcon : bugButtonIcon"
            @click="openProjectLink(link.href)"
          >{{ link.title }}</MButton>
        </div>
      </section>
      <section class="entry-section" aria-label="主要导航">
        <div class="entry-grid">
          <component
            :is="entry.href ? 'a' : 'div'"
            v-for="entry in entries"
            :key="entry.title"
            class="entry-slot"
            :href="entry.href && withBase(entry.href)"
            :aria-label="entry.href ? entry.title : undefined"
          >
            <MCard
              variant="filled"
              :class="['entry-card', `entry-card--${entry.tone}`]"
              :clickable="!entry.href"
              :aria-label="entry.href ? undefined : entry.title"
            >
              <div class="entry-content">
                <span class="entry-icon" aria-hidden="true" v-html="entry.icon" />
                <h3>{{ entry.title }}</h3>
                <svg class="entry-shape" viewBox="0 0 320 320" aria-hidden="true"><path :d="entry.shape" /></svg>
                <span class="entry-arrow" aria-hidden="true" v-html="arrowIcon" />
              </div>
            </MCard>
          </component>
        </div>
      </section>

      <nav class="external-grid" aria-label="项目链接">
        <a
          v-for="link in externalLinks"
          :key="link.href"
          class="external-card"
          :href="link.href"
        >
          <span class="external-card-leading" aria-hidden="true" v-html="link.icon" />
          <span>{{ link.title }}</span>
          <span class="external-card-icon" aria-hidden="true" v-html="openInNewIcon" />
        </a>
      </nav>

    </main>

    <footer class="site-footer">
      <span class="brand-wordmark">uwuAOSP</span>
      <a href="https://uwuaosp-legacy.uwuniverse.org">旧版页面</a>
    </footer>
    </div>
  </div>
</template>
