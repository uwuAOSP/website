/*
 * SPDX-FileCopyrightText: The uwuAOSP Project
 * SPDX-License-Identifier: Apache-2.0
 */

const org = 'uwuAOSP'
const kinds = ['release', 'merge', 'push', 'issue-open', 'issue-close']
const repoName = /^[a-z0-9_.-]{1,100}$/i
const sha = /^[a-f0-9]{40}$/
const maxBodyBytes = 2 * 1024 * 1024
const pageSize = 30
const publicHeaders = { 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-store' }

function toIso(value) {
  const timestamp = typeof value === 'string' ? Date.parse(value) : NaN
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : null
}

async function readBody(request) {
  if (!request.body || Number(request.headers.get('content-length')) > maxBodyBytes) return null
  const reader = request.body.getReader()
  const chunks = []
  let size = 0
  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    size += value.length
    if (size > maxBodyBytes) {
      await reader.cancel()
      return null
    }
    chunks.push(value)
  }
  const bytes = new Uint8Array(size)
  let offset = 0
  for (const chunk of chunks) {
    bytes.set(chunk, offset)
    offset += chunk.length
  }
  return bytes
}

function activityFrom(event, payload, delivery) {
  let kind, key, title, path, date, revision
  if (event === 'push') {
    const commit = payload.head_commit
    if (payload.deleted || payload.ref !== `refs/heads/${payload.repository.default_branch}` ||
        !commit || !sha.test(payload.after) || commit.id !== payload.after) return
    kind = 'push'
    key = delivery
    title = commit.message
    path = `/commit/${payload.after}`
    date = new Date().toISOString()
    revision = payload.after
  } else if (event === 'pull_request' && payload.action === 'closed' && payload.pull_request?.merged) {
    const pr = payload.pull_request
    if (!Number.isSafeInteger(pr.number)) return
    kind = 'merge'
    key = pr.number
    title = pr.title
    path = `/pull/${pr.number}`
    date = pr.merged_at
    revision = sha.test(pr.merge_commit_sha) ? pr.merge_commit_sha : null
  } else if (event === 'issues' && ['opened', 'closed'].includes(payload.action) && payload.issue) {
    const issue = payload.issue
    if (!Number.isSafeInteger(issue.number)) return
    kind = payload.action === 'opened' ? 'issue-open' : 'issue-close'
    key = payload.action === 'opened' ? issue.number : `${issue.number}-${issue.closed_at}`
    title = issue.title
    path = `/issues/${issue.number}`
    date = payload.action === 'opened' ? issue.created_at : issue.closed_at
  } else if (event === 'release' && payload.action === 'published' && payload.release) {
    const release = payload.release
    if (release.draft || typeof release.tag_name !== 'string' || !Number.isSafeInteger(release.id)) return
    kind = 'release'
    key = release.id
    title = release.name || release.tag_name
    path = `/releases/tag/${encodeURIComponent(release.tag_name)}`
    date = release.published_at
  } else {
    return
  }
  const occurredAt = toIso(date)
  const label = typeof title === 'string' ? title.split('\n', 1)[0].trim().slice(0, 300) : ''
  if (!occurredAt || !label) return
  return [`${payload.repository.id}:${kind}:${key}`, payload.repository.id, kind, label, path, occurredAt, revision ?? null]
}

async function receive(request, env) {
  if (!env.GITHUB_WEBHOOK_SECRET) return new Response(null, { status: 503 })
  const header = request.headers.get('x-hub-signature-256') ?? ''
  if (!/^sha256=[a-f0-9]{64}$/.test(header)) return new Response(null, { status: 401 })
  const body = await readBody(request)
  if (!body) return new Response(null, { status: 413 })
  const signature = Uint8Array.from(header.slice(7).match(/../g), part => parseInt(part, 16))
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(env.GITHUB_WEBHOOK_SECRET),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['verify'])
  if (!await crypto.subtle.verify('HMAC', key, signature, body)) return new Response(null, { status: 401 })

  const event = request.headers.get('x-github-event')
  const delivery = request.headers.get('x-github-delivery') ?? ''
  if (event === 'ping') return new Response(null, { status: 204 })
  if (!/^[\da-f-]{36}$/i.test(delivery)) return new Response(null, { status: 400 })
  let payload
  try { payload = JSON.parse(new TextDecoder().decode(body)) }
  catch { return new Response(null, { status: 400 }) }

  const repo = payload?.repository
  if (!Number.isSafeInteger(repo?.id) || payload.organization?.login?.toLowerCase() !== org.toLowerCase()) {
    return new Response(null, { status: 204 })
  }
  if (repo.private !== false || (repo.visibility && repo.visibility !== 'public') ||
      (event === 'repository' && ['deleted', 'transferred', 'privatized'].includes(payload.action))) {
    await env.DB.prepare('DELETE FROM repositories WHERE id = ?').bind(repo.id).run()
    return new Response(null, { status: 204 })
  }
  if (typeof repo.name !== 'string' || !repoName.test(repo.name) ||
      repo.full_name?.toLowerCase() !== `${org}/${repo.name}`.toLowerCase()) {
    return new Response(null, { status: 204 })
  }
  if (event === 'repository' && payload.action === 'renamed') {
    await env.DB.prepare('UPDATE repositories SET name = ? WHERE id = ?').bind(repo.name, repo.id).run()
  }
  if (payload.sender?.type === 'Bot' && event !== 'pull_request') return new Response(null, { status: 204 })
  const activity = activityFrom(event, payload, delivery)
  if (activity) {
    await env.DB.batch([
      env.DB.prepare(`INSERT INTO repositories (id, name) VALUES (?, ?)
        ON CONFLICT(id) DO UPDATE SET name = excluded.name WHERE name <> excluded.name`).bind(repo.id, repo.name),
      env.DB.prepare(`INSERT INTO activity (id, repository_id, kind, title, path, occurred_at, revision)
        VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO NOTHING`).bind(...activity),
    ])
  }
  return new Response(null, { status: 204 })
}

async function list(url, db) {
  const repo = url.searchParams.get('repo')
  const kind = url.searchParams.get('kind')
  const queryText = url.searchParams.get('q')?.trim() ?? ''
  const terms = queryText.split(/\s+/).filter(Boolean)
  const scopedRepo = /^repo:([a-z0-9-]+)\/([a-z0-9_.-]{1,100})$/i
  const before = url.searchParams.get('before')
  const after = url.searchParams.get('after')
  const cursor = before ?? after
  const [date, id] = cursor?.split('|') ?? []
  const includeRepos = url.searchParams.get('repositories') === '1'
  if (queryText.length > 240 || terms.length > 24 || (before !== null && after !== null) ||
      (repo !== null && !repoName.test(repo)) || (kind !== null && !kinds.includes(kind)) ||
      (cursor !== null && (!date || toIso(date) !== date || !id || cursor.length > 160 || cursor !== `${date}|${id}`))) {
    return Response.json({ error: 'Invalid filter or cursor' }, { status: 400, headers: publicHeaders })
  }
  const conditions = [`(a.kind <> 'push' OR NOT EXISTS (
    SELECT 1 FROM activity AS m WHERE m.repository_id = a.repository_id
    AND m.revision = a.revision AND m.kind = 'merge'
  ))`]
  const args = []
  function filterRepo(name) {
    conditions.push('r.name = ? COLLATE NOCASE')
    args.push(name)
  }
  if (repo) filterRepo(repo)
  for (const term of terms) {
    const scope = term.match(scopedRepo)
    if (scope) {
      if (scope[1].toLowerCase() !== org.toLowerCase()) conditions.push('0')
      else filterRepo(scope[2])
    } else {
      conditions.push('(instr(lower(a.title), lower(?)) > 0 OR instr(lower(r.name), lower(?)) > 0)')
      args.push(term, term)
    }
  }
  if (kind) {
    conditions.push('a.kind = ?')
    args.push(kind)
  }
  function pageQuery(anchor, ascending = false) {
    const where = anchor
      ? [...conditions, `(a.occurred_at, a.id) ${ascending ? '>' : '<'} (?, ?)`]
      : conditions
    const order = ascending ? 'ASC' : 'DESC'
    return db.prepare(`SELECT a.id, a.kind, a.title, a.path, a.occurred_at, r.name AS repository
      FROM activity AS a JOIN repositories AS r ON r.id = a.repository_id
      WHERE ${where.join(' AND ')} ORDER BY a.occurred_at ${order}, a.id ${order} LIMIT ?`)
      .bind(...args, ...(anchor ?? []), pageSize + 1)
  }

  const query = pageQuery(cursor ? [date, id] : null, after !== null)
  const results = includeRepos
    ? await db.batch([query, db.prepare('SELECT name FROM repositories ORDER BY name COLLATE NOCASE')])
    : [await query.all()]
  let rows = results[0].results
  let hasNewer = before !== null
  let hasOlder = rows.length > pageSize
  if (after !== null) {
    hasNewer = rows.length > pageSize
    if (hasNewer) {
      rows = rows.slice(0, pageSize).reverse()
      hasOlder = true
    } else {
      // At the newest boundary, fill the latest page even if some rows were removed.
      rows = (await pageQuery(null).all()).results
      hasOlder = rows.length > pageSize
    }
  }
  const page = rows.slice(0, pageSize)
  const first = page[0]
  const last = page.at(-1)
  const boundary = item => `${item.occurred_at}|${item.id}`
  const items = page.map(({ path, ...item }) => ({
    ...item, href: `https://github.com/${org}/${encodeURIComponent(item.repository)}${path}`,
  }))
  return Response.json({
    items,
    previous: hasNewer && first ? boundary(first) : null,
    next: hasOlder && last ? boundary(last) : null,
    ...(includeRepos && { repositories: results[1].results.map(row => row.name) }),
  }, { headers: { ...publicHeaders, 'Cache-Control': 'public, max-age=10' } })
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    const webhook = url.pathname === '/webhooks/github'
    const feed = url.pathname === '/v1/activity'
    try {
      if (webhook && request.method === 'POST') return await receive(request, env)
      if (feed && request.method === 'GET') return await list(url, env.DB)
      if (webhook || feed) return new Response(null, { status: 405, headers: { Allow: webhook ? 'POST' : 'GET' } })
      return new Response(null, { status: 404 })
    } catch {
      console.error({ message: 'Activity request failed', path: url.pathname })
      return new Response(null, { status: 503, headers: feed ? publicHeaders : undefined })
    }
  },
}
