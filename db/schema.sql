CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  telegram_id TEXT UNIQUE NOT NULL,
  username TEXT,
  first_name TEXT,
  last_name TEXT,
  course INTEGER NOT NULL CHECK (course BETWEEN 1 AND 6),
  group_name TEXT NOT NULL,
  subgroup TEXT NOT NULL DEFAULT 'all' CHECK (subgroup IN ('all', '1', '2')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS users_telegram_id_idx ON users(telegram_id);

CREATE TABLE IF NOT EXISTS schedule_cache (
  id BIGSERIAL PRIMARY KEY,
  course INTEGER NOT NULL,
  week_date DATE NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(course, week_date)
);

CREATE INDEX IF NOT EXISTS schedule_cache_lookup_idx
  ON schedule_cache(course, week_date);