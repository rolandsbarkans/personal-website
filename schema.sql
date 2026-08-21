CREATE TABLE IF NOT EXISTS hikes (
  id         INTEGER PRIMARY KEY,
  lat        REAL NOT NULL,
  lng        REAL NOT NULL,
  title      TEXT NOT NULL,
  note       TEXT,
  author     TEXT,
  country    TEXT,
  secret     TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS hikes_recent ON hikes (id DESC);
