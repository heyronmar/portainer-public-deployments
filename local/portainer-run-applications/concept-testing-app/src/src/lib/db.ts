// SQLite access (server only). One connection per process, opened lazily so `next build` never touches the database.
import Database from "better-sqlite3";
import { randomBytes } from "node:crypto";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { blank, sanitize, type State } from "./survey";

export type ResponseRow = { id: string; state: State; step: number; submittedAt: string | null; createdAt: string; updatedAt: string };
type RawRow = { id: string; data: string; step: number; submitted_at: string | null; created_at: string; updated_at: string };

const globalForDb = globalThis as unknown as { __ctDb?: Database.Database };

function db(): Database.Database {
  if (globalForDb.__ctDb) return globalForDb.__ctDb;
  const file = process.env.DATABASE_PATH || "/data/concept-test.db";
  mkdirSync(dirname(file), { recursive: true });
  const conn = new Database(file);
  conn.pragma("journal_mode = WAL");
  conn.pragma("busy_timeout = 5000");
  conn.exec(`CREATE TABLE IF NOT EXISTS responses (
    id TEXT PRIMARY KEY,
    data JSON NOT NULL,
    step INT NOT NULL DEFAULT 0,
    submitted_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`);
  globalForDb.__ctDb = conn;
  return conn;
}

const toRow = (r: RawRow): ResponseRow => ({
  id: r.id, state: sanitize(JSON.parse(r.data)), step: r.step, submittedAt: r.submitted_at, createdAt: r.created_at, updatedAt: r.updated_at,
});

/** 96 random bits, URL-safe. The id doubles as the participant's resume credential. */
export const newId = () => randomBytes(12).toString("base64url");
export const isValidId = (id: unknown): id is string => typeof id === "string" && /^[A-Za-z0-9_-]{16}$/.test(id);

export function createResponse(): ResponseRow {
  const id = newId(), now = new Date().toISOString(), state = blank();
  state.startedAt = now;
  db().prepare("INSERT INTO responses (id, data, step, submitted_at, created_at, updated_at) VALUES (?, ?, 0, NULL, ?, ?)")
    .run(id, JSON.stringify(state), now, now);
  return { id, state, step: 0, submittedAt: null, createdAt: now, updatedAt: now };
}

export function getResponse(id: string): ResponseRow | null {
  if (!isValidId(id)) return null;
  const r = db().prepare("SELECT * FROM responses WHERE id = ?").get(id) as RawRow | undefined;
  return r ? toRow(r) : null;
}

export function saveResponse(id: string, state: State): ResponseRow {
  const now = new Date().toISOString();
  state.updatedAt = now;
  db().prepare("UPDATE responses SET data = ?, step = ?, submitted_at = ?, updated_at = ? WHERE id = ?")
    .run(JSON.stringify(state), state.step, state.submittedAt, now, id);
  return getResponse(id)!;
}

export function listResponses(): ResponseRow[] {
  return (db().prepare("SELECT * FROM responses ORDER BY updated_at DESC").all() as RawRow[]).map(toRow);
}

export function ping() {
  db().prepare("SELECT 1").get();
}
