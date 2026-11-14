-- People who asked for the weekly radar or to be told when a paid plan opens.
CREATE TABLE IF NOT EXISTS subscriber (
  email TEXT PRIMARY KEY,
  source TEXT NOT NULL DEFAULT 'site',   -- where on the site they signed up
  interest TEXT NOT NULL DEFAULT 'radar', -- radar | brief | pass | niche
  note TEXT,                              -- e.g. the opening or the niche they asked about
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS subscriber_interest_idx ON subscriber(interest, created_at);
