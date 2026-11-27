CREATE TABLE IF NOT EXISTS repositories (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS activity (
  id TEXT PRIMARY KEY,
  repository_id INTEGER NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  title TEXT NOT NULL,
  path TEXT NOT NULL,
  occurred_at TEXT NOT NULL,
  revision TEXT
);

CREATE INDEX IF NOT EXISTS activity_recent ON activity(occurred_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS activity_repository ON activity(repository_id, occurred_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS activity_kind ON activity(kind, occurred_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS activity_revision ON activity(repository_id, revision, kind);
