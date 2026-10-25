import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import { ADMIN_SOURCE } from '@lcn/shared';

export type Db = Database.Database;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS events (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  starts_at   TEXT    NOT NULL,
  lat         REAL    NOT NULL,
  lng         REAL    NOT NULL,
  media_url   TEXT,
  source      TEXT    NOT NULL DEFAULT '${ADMIN_SOURCE}',
  external_id TEXT,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT    NOT NULL DEFAULT (datetime('now')),
  UNIQUE (source, external_id)
);

CREATE TABLE IF NOT EXISTS event_translations (
  event_id    INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  lang        TEXT    NOT NULL CHECK (lang IN ('uk', 'en', 'pl')),
  title       TEXT    NOT NULL,
  venue       TEXT    NOT NULL,
  category    TEXT    NOT NULL DEFAULT '',
  description TEXT    NOT NULL DEFAULT '',
  PRIMARY KEY (event_id, lang)
);

CREATE INDEX IF NOT EXISTS idx_events_starts_at ON events (starts_at);
`;

/** Відкриває (або створює) базу SQLite і застосовує схему. ':memory:' — для тестів. */
export function openDb(file: string): Db {
  if (file !== ':memory:') fs.mkdirSync(path.dirname(path.resolve(file)), { recursive: true });
  const db = new Database(file);
  db.pragma('foreign_keys = ON');
  if (file !== ':memory:') db.pragma('journal_mode = WAL');
  db.exec(SCHEMA);
  return db;
}
