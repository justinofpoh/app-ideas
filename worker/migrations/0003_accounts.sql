-- Accounts (Better Auth), saved ideas and entitlements.
-- Numbered after the catalog's 0001_init and 0002_betas so both apps can share the appidea-store D1 database.
CREATE TABLE IF NOT EXISTS "user" (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  email_verified INTEGER NOT NULL DEFAULT 0,
  image TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS session (
  id TEXT PRIMARY KEY,
  expires_at INTEGER NOT NULL,
  token TEXT NOT NULL UNIQUE,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS session_user_idx ON session(user_id);
CREATE TABLE IF NOT EXISTS account (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  access_token TEXT,
  refresh_token TEXT,
  id_token TEXT,
  access_token_expires_at INTEGER,
  refresh_token_expires_at INTEGER,
  scope TEXT,
  password TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS account_user_idx ON account(user_id);
CREATE TABLE IF NOT EXISTS verification (
  id TEXT PRIMARY KEY,
  identifier TEXT NOT NULL,
  value TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  created_at INTEGER,
  updated_at INTEGER
);
CREATE TABLE IF NOT EXISTS saved_idea (
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  idea_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, idea_id)
);
CREATE TABLE IF NOT EXISTS entitlement (
  user_id TEXT PRIMARY KEY REFERENCES "user"(id) ON DELETE CASCADE,
  plan TEXT NOT NULL DEFAULT 'free',
  source TEXT,
  external_id TEXT,
  current_period_end INTEGER,
  updated_at INTEGER NOT NULL
);
