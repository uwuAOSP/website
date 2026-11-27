/*
 * SPDX-FileCopyrightText: The uwuAOSP Project
 * SPDX-License-Identifier: Apache-2.0
 */

import { execFile } from 'node:child_process'
import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { promisify } from 'node:util'
import MarkdownIt from 'markdown-it'
import { defineLoader } from 'vitepress'
import { parse } from 'yaml'

interface Release {
  version: string
  date: string
  html: string
  source: string
}

declare const data: Release[]
export { data }

const repository = 'https://github.com/uwuAOSP/changelog'
const branch = 'main'
const versionOrder = new Intl.Collator('en', { numeric: true })
const command = promisify(execFile)
const local = process.env.UWU_CHANGELOG_DIR ? resolve(process.env.UWU_CHANGELOG_DIR) : null
const markdown = new MarkdownIt({ html: false, linkify: true, breaks: true })
markdown.linkify.set({ fuzzyLink: false, fuzzyEmail: false })

async function readReleases(root: string) {
  const versions = (await readdir(join(root, 'releases'), { withFileTypes: true }))
    .filter(entry => entry.isDirectory() && /^\d+\.\d+\.\d+$/.test(entry.name) &&
      versionOrder.compare(entry.name, '17.0.100') > 0)
    .map(entry => entry.name)
    .sort((a, b) => versionOrder.compare(b, a))

  if (!versions.length) throw new Error('No changelog versions after 17.0.100')

  return Promise.all(versions.map(async (version): Promise<Release> => {
    const path = `releases/${version}/zh-CN.md`
    const contents = await readFile(join(root, path), 'utf8')
    const frontmatter = contents.match(/^\uFEFF?---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)
    const metadata = frontmatter && parse(frontmatter[1])
    const date = metadata?.date
    if (metadata?.version !== version || typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
        new Date(`${date}T00:00:00Z`).toJSON()?.slice(0, 10) !== date) {
      throw new Error(`Invalid version or date in ${path}`)
    }

    const body = contents.slice(frontmatter![0].length)
      .replace(/<!--\s*SPDX-FileCopyrightText:[\s\S]*?-->/g, '')
      .replace(/^重要的上游变更[：:][ \t]*$/m, '### 重要的上游变更')
      .trim()

    return { version, date, html: markdown.render(body), source: `${repository}/blob/${branch}/${path}` }
  }))
}

export default defineLoader({
  watch: local ? [`${local}/releases/*/zh-CN.md`] : [],
  async load(): Promise<Release[]> {
    if (local) return readReleases(local)
    const checkout = await mkdtemp(join(tmpdir(), 'uwuaosp-changelog-'))
    try {
      await command('git', ['clone', '--quiet', '--depth=1', '--no-tags', '--branch', branch, `${repository}.git`, checkout], {
        timeout: 30_000,
        env: { ...process.env, GIT_TERMINAL_PROMPT: '0' },
      })
      return await readReleases(checkout)
    } finally {
      await rm(checkout, { recursive: true, force: true })
    }
  },
})
