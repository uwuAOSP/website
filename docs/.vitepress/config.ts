/*
 * SPDX-FileCopyrightText: The uwuAOSP Project
 * SPDX-License-Identifier: Apache-2.0
 */

import { defineConfig } from 'vitepress'
import { brandThemeCss, lightSurface } from './brand'

export default defineConfig({
  lang: 'zh-CN',
  title: 'uwuAOSP',
  description: '基于 Android 的开源系统。',
  base: '/',
  markdown: {
    codeCopyButtonTitle: '复制代码',
    theme: { light: 'github-light', dark: 'github-dark-high-contrast' },
    languages: [{
      name: 'android.bp',
      scopeName: 'source.blueprint',
      patterns: [
        { name: 'comment.line.double-slash.blueprint', match: '//.*$' },
        { name: 'comment.block.blueprint', begin: '/\\*', end: '\\*/' },
        {
          name: 'string.quoted.double.blueprint',
          begin: '"',
          end: '"',
          patterns: [{ name: 'constant.character.escape.blueprint', match: '\\\\.' }],
        },
        { name: 'constant.language.boolean.blueprint', match: '\\b(?:true|false)\\b' },
        { name: 'constant.numeric.blueprint', match: '\\b(?:0[xX][\\da-fA-F]+|\\d+)\\b' },
        { name: 'entity.name.tag.blueprint', match: '\\b[A-Za-z_]\\w*(?=\\s*:)' },
        { name: 'entity.name.type.blueprint', match: '\\b[A-Za-z_]\\w*(?=\\s*\\{)' },
      ],
    }],
  },
  vite: {
    ssr: { noExternal: ['material'] },
  },
  head: [
    ['meta', { name: 'theme-color', content: lightSurface }],
    ['style', {}, brandThemeCss],
    ['script', {}, `try {
      const mode = localStorage.getItem('uwu-appearance');
      if (mode === 'light' || mode === 'dark') {
        document.documentElement.dataset.theme = 'uwu';
        document.documentElement.dataset.themeMode = mode;
      }
    } catch {}`],
  ],
})
