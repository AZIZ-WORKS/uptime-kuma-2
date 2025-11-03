PRAGMA journal_mode=WAL;

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('admin','engineer','viewer'))
);

CREATE TABLE IF NOT EXISTS vans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  mac TEXT,
  status TEXT,
  last_latency INTEGER,
  last_seen INTEGER,
  agent_api_url TEXT
);

CREATE TABLE IF NOT EXISTS logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  van_id TEXT NOT NULL,
  status TEXT NOT NULL,
  uptime REAL,
  latency INTEGER,
  timestamp TEXT NOT NULL,
  FOREIGN KEY(van_id) REFERENCES vans(id)
);

CREATE INDEX IF NOT EXISTS idx_logs_van_time ON logs(van_id, timestamp DESC);



