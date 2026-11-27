<!--
SPDX-FileCopyrightText: The uwuAOSP Project
SPDX-License-Identifier: Apache-2.0
-->

<script setup lang="ts">
import { useData } from 'vitepress'
const { frontmatter } = useData()
</script>

<template>
  <main id="main" class="doc-content" tabindex="-1" :lang="frontmatter.contentLang">
    <Content />
  </main>
</template>

<style scoped>
.doc-content {
  width: min(calc(100% - 48px), 768px);
  margin: 20px auto 64px;
  font-size: 1rem;
  font-weight: 300;
  line-height: 1.5;
  overflow-wrap: anywhere;
}
.doc-content :deep(:is(h1, h2, h3, h4, h5, h6)) {
  font-weight: 500;
  scroll-margin-top: 108px;
}
.doc-content :deep(h1) { margin: 0 0 20px; font-size: 3rem; line-height: 1.15; }
.doc-content :deep(h2) { margin: 36px 0 12px; font-size: 2rem; line-height: 1.5; }
.doc-content :deep(h2:first-child) { margin-top: 0; }
.doc-content :deep(h3) { margin: 24px 0 8px; font-size: 1.5625rem; line-height: 1.4; }
.doc-content :deep(h4) { font-size: 1.3rem; line-height: 1.5; }
.doc-content :deep(h5) { font-size: 1.0625rem; line-height: 1.55; }
.doc-content :deep(h6) { font-size: .75rem; font-weight: 500; }
.doc-content :deep(:is(b, strong, th)) { font-weight: 500; }
.doc-content :deep(p) { margin: 12px 0; font: inherit; }
.doc-content :deep(ul), .doc-content :deep(ol) { margin: 12px 0; padding-inline-start: 1.5em; }
.doc-content :deep(ul) { list-style: disc; }
.doc-content :deep(ol) { list-style: decimal; }
.doc-content :deep(li + li) { margin-top: 4px; }
.doc-content :deep(a) { color: var(--mtrl-sys-color-primary); text-underline-offset: 3px; }
.doc-content :deep(a.header-anchor) { text-decoration: none; }
.doc-content :deep(.header-anchor)::before { content: '#'; }
.doc-content :deep(.header-anchor) { opacity: 0; padding-inline: 6px; }
.doc-content :deep(h2:hover .header-anchor),
.doc-content :deep(h3:hover .header-anchor),
.doc-content :deep(.header-anchor:focus-visible) { opacity: 1; }
.doc-content :deep(blockquote) {
  margin: 16px 0;
  padding-inline-start: 16px;
  border-inline-start: 3px solid var(--mtrl-sys-color-outline-variant);
  color: var(--mtrl-sys-color-on-surface-variant);
}
.doc-content :deep(.github-alert) {
  --callout-bg: var(--mtrl-sys-color-primary-container);
  --callout-fg: var(--mtrl-sys-color-on-primary-container);
  --callout-icon: url('@material-design-icons/svg/outlined/info.svg');
  margin: 20px 0;
  padding: 16px 20px;
  border-radius: 16px;
  background: var(--callout-bg);
  color: var(--callout-fg);
  font-size: .875rem;
  line-height: 1.5rem;
}
.doc-content :deep(.github-alert.tip) {
  --callout-bg: var(--mtrl-sys-color-success-container);
  --callout-fg: var(--mtrl-sys-color-on-success-container);
  --callout-icon: url('@material-design-icons/svg/outlined/check.svg');
}
.doc-content :deep(.github-alert:is(.important, .caution)) {
  --callout-bg: var(--mtrl-sys-color-warning-container);
  --callout-fg: var(--mtrl-sys-color-on-warning-container);
  --callout-icon: url('@material-design-icons/svg/filled/warning.svg');
}
.doc-content :deep(.github-alert:is(.warning, .danger)) {
  --callout-bg: var(--mtrl-sys-color-error-container);
  --callout-fg: var(--mtrl-sys-color-on-error-container);
  --callout-icon: url('@material-design-icons/svg/filled/warning.svg');
}
.doc-content :deep(.github-alert > .custom-block-title) {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0;
  font-size: .75rem;
  font-weight: 600;
}
.doc-content :deep(.github-alert > .custom-block-title)::before {
  flex: none;
  width: 22px;
  height: 22px;
  background: currentColor;
  mask: var(--callout-icon) center / contain no-repeat;
  content: '';
}
.doc-content :deep(.github-alert > p) { margin: 8px 0 0; }
.doc-content :deep(.github-alert a) { color: inherit; }
.doc-content :deep(code) { font-size: .875em; }
.doc-content :deep(:not(pre) > code) {
  padding: 2px 5px;
  border-radius: 4px;
  background: var(--mtrl-sys-color-surface-container);
}
.doc-content :deep(div[class*="language-"]) {
  position: relative;
  margin: 16px 0;
  border-radius: 16px;
  background: var(--mtrl-sys-color-surface-container);
}
.doc-content :deep(pre) { margin: 0; padding: 46px 16px 16px; overflow-x: auto; }
.doc-content :deep(pre code) { font-size: .875rem; white-space: pre; }
.doc-content :deep(pre span) { color: var(--shiki-light, inherit); }
.doc-content :deep(div[class*="language-"] > .lang) {
  position: absolute;
  inset-block-start: 10px;
  inset-inline-start: 16px;
  color: var(--mtrl-sys-color-on-surface-variant);
  font-size: 12px;
}
.doc-content :deep(button.copy) {
  position: absolute;
  display: grid;
  place-items: center;
  inset-block-start: 4px;
  inset-inline-end: 4px;
  width: 40px;
  height: 40px;
  padding: 0;
  border: 0;
  border-radius: 999px;
  color: var(--mtrl-sys-color-on-secondary-container);
  background: var(--mtrl-sys-color-secondary-container);
  cursor: pointer;
}
.doc-content :deep(button.copy)::before {
  width: 20px;
  height: 20px;
  background: currentColor;
  mask: url('@material-design-icons/svg/outlined/content_copy.svg') center / contain no-repeat;
  content: '';
}
.doc-content :deep(button.copy.copied)::before {
  mask-image: url('@material-design-icons/svg/outlined/check.svg');
}
.doc-content :deep(button.copy:focus-visible) { outline: 2px solid var(--mtrl-sys-color-primary); }
.doc-content :deep(table) {
  display: block;
  max-width: 100%;
  margin: 16px 0;
  border-collapse: collapse;
  overflow-x: auto;
}
.doc-content :deep(th), .doc-content :deep(td) {
  padding: 8px 12px;
  border-bottom: 1px solid var(--mtrl-sys-color-outline-variant);
  text-align: start;
}
:global(:root[data-theme-mode="dark"] .doc-content pre span) { color: var(--shiki-dark, inherit); }
@media (prefers-color-scheme: dark) {
  :global(:root:not([data-theme-mode="light"]) .doc-content pre span) { color: var(--shiki-dark, inherit); }
}
@media (max-width: 700px) {
  .doc-content { width: calc(100% - 32px); margin-top: 12px; }
  .doc-content :deep(h2), .doc-content :deep(h3) { scroll-margin-top: 96px; }
}
</style>
