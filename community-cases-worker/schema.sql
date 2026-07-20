CREATE TABLE IF NOT EXISTS community_cases (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  page_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TEXT NOT NULL,
  reviewed_at TEXT,
  reviewed_note TEXT
);

CREATE INDEX IF NOT EXISTS idx_community_cases_public ON community_cases(status, created_at DESC);
