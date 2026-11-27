/*
 * SPDX-FileCopyrightText: The uwuAOSP Project
 * SPDX-License-Identifier: Apache-2.0
 */

import { execFileSync } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const output = process.argv[2]
if (!output) throw new Error('Usage: node backfill.mjs <new output directory>')

const org = 'uwuAOSP'
const origin = 'https://api.github.com'
const token = execFileSync('gh', ['auth', 'token'], { encoding: 'utf8' }).trim()
const until = new Date().toISOString()
const since = new Date(Date.parse(until) - 30 * 86400_000).toISOString()
const headers = {
  Accept: 'application/vnd.github+json',
  Authorization: `Bearer ${token}`,
  'User-Agent': 'uwuaosp-activity-backfill',
  'X-GitHub-Api-Version': '2022-11-28',
}

function iso(value) {
  const ms = Date.parse(value)
  return Number.isFinite(ms) ? new Date(ms).toISOString() : ''
}
const recent = value => {
  const date = iso(value)
  return date >= since && date <= until
}

function url(path, params = {}) {
  const result = new URL(path, origin)
  for (const [key, value] of Object.entries(params)) result.searchParams.set(key, value)
  return result
}

async function request(url, allowMissing = false) {
  if (url.origin !== origin) throw new Error('Unexpected GitHub API origin')
  const response = await fetch(url, { headers, signal: AbortSignal.timeout(30_000), redirect: 'error' })
  if (allowMissing && [404, 409, 422].includes(response.status)) return null
  if (!response.ok) throw new Error(`${url.pathname}: GitHub returned ${response.status}`)
  return response
}

async function* list(path, params = {}, allowMissing = false) {
  let next = url(path, { per_page: '100', ...params })
  while (next) {
    const response = await request(next, allowMissing)
    if (!response) return
    const page = await response.json()
    if (!Array.isArray(page)) throw new Error(`${next.pathname}: expected an array`)
    yield* page
    const link = response.headers.get('link')?.match(/<([^>]+)>;\s*rel="next"/)?.[1]
    next = link ? new URL(link) : null
  }
}

const repoStatement = {
  sql: 'INSERT INTO repositories (id, name) VALUES (?, ?) ON CONFLICT(id) DO NOTHING',
}
const insert = `INSERT INTO activity (id, repository_id, kind, title, path, occurred_at, revision)
  SELECT ?, ?, ?, ?, ?, ?, NULLIF(?, '')`
// Live push rows use the webhook delivery ID and time of receipt. Match nearby
// pushes with the same head SHA without collapsing a later rollback to that SHA.
const mergePushOverlap = ` WHERE NOT EXISTS (
  SELECT 1 FROM activity WHERE repository_id = ? AND revision = ? AND kind = 'push'
  AND id NOT LIKE '%:push:history-%'
  AND ABS(unixepoch(occurred_at) - unixepoch(?)) <= 900
)`

async function collect(repo) {
  const root = `/repos/${org}/${encodeURIComponent(repo.name)}`
  const rows = new Map()
  function add(kind, key, title, path, timestamp, revision = '') {
    const label = typeof title === 'string' ? title.split('\n', 1)[0].trim().slice(0, 300) : ''
    if (!label || !recent(timestamp)) return
    const date = iso(timestamp)
    const id = `${repo.id}:${kind}:${key}`
    const params = [id, String(repo.id), kind, label, path, date, revision || '']
    if (kind === 'push') params.push(String(repo.id), revision, date)
    rows.set(id, {
      sql: insert + (kind === 'push' ? mergePushOverlap : '') + ' ON CONFLICT(id) DO NOTHING',
      params,
    })
  }

  for await (const pr of list(`${root}/pulls`, { state: 'closed', sort: 'updated', direction: 'desc' })) {
    if (iso(pr.updated_at) < since) break
    if (pr.merged_at) add('merge', pr.number, pr.title, `/pull/${pr.number}`, pr.merged_at, pr.merge_commit_sha)
  }

  if (repo.has_issues) {
    for await (const issue of list(`${root}/issues`, { state: 'all', since })) {
      if (issue.pull_request) continue
      const path = `/issues/${issue.number}`
      if (issue.user?.type !== 'Bot') add('issue-open', issue.number, issue.title, path, issue.created_at)
      for await (const event of list(`${root}${path}/timeline`)) {
        if (event.event !== 'closed' || event.actor?.type === 'Bot') continue
        // GitHub timestamps for the close event and Issue.closed_at use UTC.
        const timestamp = iso(event.created_at).replace('.000Z', 'Z')
        if (timestamp) add('issue-close', `${issue.number}-${timestamp}`, issue.title, path, timestamp)
      }
    }
  }

  for await (const release of list(`${root}/releases`)) {
    if (!release.draft) add('release', release.id, release.name || release.tag_name,
      `/releases/tag/${encodeURIComponent(release.tag_name)}`, release.published_at)
  }

  const ref = `refs/heads/${repo.default_branch}`
  if (repo.default_branch) {
    for await (const push of list(`${root}/activity`, { ref, time_period: 'quarter', direction: 'desc' }, true)) {
      if (iso(push.timestamp) < since) break
      if (!recent(push.timestamp) || push.ref !== ref || !['push', 'force_push'].includes(push.activity_type) ||
          push.actor?.type === 'Bot' || !/^[a-f0-9]{40}$/.test(push.after)) continue
      const commit = await request(url(`${root}/commits/${push.after}`), true)
      const title = commit ? (await commit.json()).commit?.message : `推送 ${push.after.slice(0, 7)}`
      add('push', `history-${push.id}`, title, `/commit/${push.after}`, push.timestamp, push.after)
    }
  }
  return rows
}

const repos = []
for await (const repo of list(`/orgs/${org}/repos`, { type: 'public' })) {
  if (repo.private === false && repo.owner?.login?.toLowerCase() === org.toLowerCase()) repos.push(repo)
}
const records = []
const counts = new Map()
// Small groups keep GitHub traffic bounded without taking a separate request
// for every entry on the web page.
for (let i = 0; i < repos.length; i += 4) {
  const group = repos.slice(i, i + 4)
  const results = await Promise.all(group.map(collect))
  for (const [index, rows] of results.entries()) {
    if (!rows.size) continue
    const repo = group[index]
    records.push({ ...repoStatement, params: [String(repo.id), repo.name] }, ...rows.values())
    for (const row of rows.values()) counts.set(row.params[2], (counts.get(row.params[2]) ?? 0) + 1)
  }
  console.error(`Checked ${Math.min(i + 4, repos.length)}/${repos.length} public repositories`)
}

await mkdir(output)
for (let i = 0; i < records.length; i += 40) {
  const name = `${String(i / 40 + 1).padStart(4, '0')}.json`
  await writeFile(join(output, name), JSON.stringify(records.slice(i, i + 40)), { mode: 0o600 })
}
console.log(JSON.stringify({ from: since, until, counts: Object.fromEntries(counts), statements: records.length }))
