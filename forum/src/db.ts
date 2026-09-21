/**
 * Forum storage: one SQLite file on a Docker volume. No separate database server.
 *
 * Design notes:
 * - Accounts are pseudonymous: a display name plus a signed cookie token. No passwords to
 *   leak, no email to store. An account can be upgraded with an email later without a migration.
 * - IP addresses are stored only as a salted hash, only for rate limiting, and only for 30 days.
 */
import Database from 'better-sqlite3';
import { createHash, randomBytes } from 'node:crypto';

export interface Category { id: number; slug: string; name: string; description: string; sort: number }
export interface Thread {
  id: number; category_id: number; slug: string; title: string; body: string;
  user_id: number; author: string; created_at: string; last_reply_at: string;
  reply_count: number; hidden: number; pinned: number;
}
export interface Post { id: number; thread_id: number; body: string; user_id: number; author: string; created_at: string; hidden: number }

const SALT = process.env.IP_SALT ?? 'cigarreronline';
export const hashIp = (ip: string) => createHash('sha256').update(SALT + ip).digest('hex').slice(0, 32);
export const hashToken = (t: string) => createHash('sha256').update(t).digest('hex');
export const newToken = () => randomBytes(24).toString('base64url');

export function open(file = process.env.DB_FILE ?? '/data/forum.db') {
  const db = new Database(file);
  db.pragma('journal_mode = WAL');
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY, slug TEXT UNIQUE NOT NULL, name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '', sort INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY, name TEXT UNIQUE NOT NULL, token_hash TEXT UNIQUE NOT NULL,
      created_at TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'member',
      banned INTEGER NOT NULL DEFAULT 0, post_count INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS threads (
      id INTEGER PRIMARY KEY, category_id INTEGER NOT NULL REFERENCES categories(id),
      slug TEXT NOT NULL, title TEXT NOT NULL, body TEXT NOT NULL,
      user_id INTEGER NOT NULL REFERENCES users(id), created_at TEXT NOT NULL,
      last_reply_at TEXT NOT NULL, reply_count INTEGER NOT NULL DEFAULT 0,
      hidden INTEGER NOT NULL DEFAULT 0, pinned INTEGER NOT NULL DEFAULT 0
    );
    CREATE UNIQUE INDEX IF NOT EXISTS threads_slug ON threads(slug);
    CREATE INDEX IF NOT EXISTS threads_cat ON threads(category_id, pinned DESC, last_reply_at DESC);
    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY, thread_id INTEGER NOT NULL REFERENCES threads(id),
      body TEXT NOT NULL, user_id INTEGER NOT NULL REFERENCES users(id),
      created_at TEXT NOT NULL, hidden INTEGER NOT NULL DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS posts_thread ON posts(thread_id, created_at);
    CREATE TABLE IF NOT EXISTS reports (
      id INTEGER PRIMARY KEY, kind TEXT NOT NULL, target_id INTEGER NOT NULL,
      reason TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL, resolved INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS actions (
      id INTEGER PRIMARY KEY, ip_hash TEXT NOT NULL, kind TEXT NOT NULL, at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS actions_ip ON actions(ip_hash, at);
  `);

  const count = db.prepare('SELECT count(*) n FROM categories').get() as { n: number };
  if (count.n === 0) {
    const insert = db.prepare('INSERT INTO categories (slug, name, description, sort) VALUES (?,?,?,?)');
    [
      ['nyborjare', 'Nybörjare', 'Frågor från dig som är ny. Inga dumma frågor här.', 1],
      ['cigarrer', 'Cigarrer & märken', 'Smaknoteringar, jämförelser och tips om märken och format.', 2],
      ['forvaring', 'Förvaring & humidor', 'Luftfuktighet, humidorer, lagring och räddning av torra cigarrer.', 3],
      ['allmant', 'Allmänt', 'Allt annat: tillbehör, dryck till cigarren, och lite småprat.', 4],
    ].forEach((c) => insert.run(...c));
  }
  return db;
}

export type DB = ReturnType<typeof open>;

/* ---------- rate limiting ---------- */
export function tooFast(db: DB, ipHash: string, kind: string, limit: number, minutes: number) {
  const since = new Date(Date.now() - minutes * 60_000).toISOString();
  const row = db.prepare('SELECT count(*) n FROM actions WHERE ip_hash=? AND kind=? AND at>?').get(ipHash, kind, since) as { n: number };
  return row.n >= limit;
}
export function noteAction(db: DB, ipHash: string, kind: string) {
  db.prepare('INSERT INTO actions (ip_hash, kind, at) VALUES (?,?,?)').run(ipHash, kind, new Date().toISOString());
  db.prepare("DELETE FROM actions WHERE at < datetime('now','-30 days')").run();
}

/* ---------- queries ---------- */
export const categories = (db: DB) => db.prepare('SELECT * FROM categories ORDER BY sort').all() as Category[];
export const categoryBySlug = (db: DB, slug: string) => db.prepare('SELECT * FROM categories WHERE slug=?').get(slug) as Category | undefined;

export const threadsIn = (db: DB, categoryId: number, limit = 50, offset = 0) =>
  db.prepare(`SELECT t.*, u.name AS author FROM threads t JOIN users u ON u.id=t.user_id
              WHERE t.category_id=? AND t.hidden=0
              ORDER BY t.pinned DESC, t.last_reply_at DESC LIMIT ? OFFSET ?`).all(categoryId, limit, offset) as Thread[];

export const latestThreads = (db: DB, limit = 20) =>
  db.prepare(`SELECT t.*, u.name AS author FROM threads t JOIN users u ON u.id=t.user_id
              WHERE t.hidden=0 ORDER BY t.last_reply_at DESC LIMIT ?`).all(limit) as Thread[];

export const threadBySlug = (db: DB, slug: string) =>
  db.prepare(`SELECT t.*, u.name AS author FROM threads t JOIN users u ON u.id=t.user_id WHERE t.slug=?`).get(slug) as Thread | undefined;

export const postsIn = (db: DB, threadId: number) =>
  db.prepare(`SELECT p.*, u.name AS author FROM posts p JOIN users u ON u.id=p.user_id
              WHERE p.thread_id=? AND p.hidden=0 ORDER BY p.created_at`).all(threadId) as Post[];

export const userByToken = (db: DB, token: string) =>
  db.prepare('SELECT * FROM users WHERE token_hash=?').get(hashToken(token)) as
    { id: number; name: string; role: string; banned: number; post_count: number } | undefined;

export function createUser(db: DB, name: string) {
  const token = newToken();
  const info = db.prepare('INSERT INTO users (name, token_hash, created_at) VALUES (?,?,?)')
    .run(name, hashToken(token), new Date().toISOString());
  return { id: Number(info.lastInsertRowid), name, token };
}

export function createThread(db: DB, categoryId: number, slug: string, title: string, body: string, userId: number) {
  const now = new Date().toISOString();
  const info = db.prepare(`INSERT INTO threads (category_id, slug, title, body, user_id, created_at, last_reply_at)
                           VALUES (?,?,?,?,?,?,?)`).run(categoryId, slug, title, body, userId, now, now);
  db.prepare('UPDATE users SET post_count = post_count + 1 WHERE id=?').run(userId);
  return Number(info.lastInsertRowid);
}

export function createPost(db: DB, threadId: number, body: string, userId: number) {
  const now = new Date().toISOString();
  const info = db.prepare('INSERT INTO posts (thread_id, body, user_id, created_at) VALUES (?,?,?,?)')
    .run(threadId, body, userId, now);
  db.prepare('UPDATE threads SET reply_count = reply_count + 1, last_reply_at=? WHERE id=?').run(now, threadId);
  db.prepare('UPDATE users SET post_count = post_count + 1 WHERE id=?').run(userId);
  return Number(info.lastInsertRowid);
}

export const report = (db: DB, kind: 'thread' | 'post', targetId: number, reason: string) =>
  db.prepare('INSERT INTO reports (kind, target_id, reason, created_at) VALUES (?,?,?,?)')
    .run(kind, targetId, reason.slice(0, 500), new Date().toISOString());

export const openReports = (db: DB) =>
  db.prepare('SELECT * FROM reports WHERE resolved=0 ORDER BY created_at DESC LIMIT 50').all() as
    { id: number; kind: string; target_id: number; reason: string; created_at: string }[];

/* ---------- slugs ---------- */
export function slugify(title: string) {
  const base = title.toLowerCase()
    .replace(/[åä]/g, 'a').replace(/ö/g, 'o').replace(/é/g, 'e')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 70) || 'trad';
  return base;
}
export function uniqueSlug(db: DB, title: string) {
  const base = slugify(title);
  let slug = base, n = 1;
  while (db.prepare('SELECT 1 FROM threads WHERE slug=?').get(slug)) slug = `${base}-${++n}`;
  return slug;
}
