'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');
const { hashPassword } = require('./auth');
const { softwareSeed, usersSeed, commentsSeed } = require('./seed');

const dataDir = path.join(__dirname, '..', 'data');
fs.mkdirSync(dataDir, { recursive: true });

const dbPath = process.env.ZHENXIAN_DB_PATH
  ? path.resolve(process.env.ZHENXIAN_DB_PATH)
  : path.join(dataDir, 'zhenxian.db');
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new DatabaseSync(dbPath);

db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;
  PRAGMA busy_timeout = 5000;

  CREATE TABLE IF NOT EXISTS meta (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    display_name TEXT NOT NULL,
    bio TEXT NOT NULL DEFAULT '',
    avatar_color TEXT NOT NULL DEFAULT '#C7F464',
    role TEXT NOT NULL DEFAULT 'member',
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS software (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    tagline TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    platforms TEXT NOT NULL,
    website TEXT NOT NULL,
    version TEXT NOT NULL,
    size_text TEXT NOT NULL,
    license TEXT NOT NULL,
    developer TEXT NOT NULL,
    accent TEXT NOT NULL,
    icon TEXT NOT NULL,
    tags TEXT NOT NULL,
    highlights TEXT NOT NULL,
    editor_note TEXT NOT NULL DEFAULT '',
    featured INTEGER NOT NULL DEFAULT 0,
    downloads INTEGER NOT NULL DEFAULT 0,
    views INTEGER NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL DEFAULT 0,
    added_at TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    software_id INTEGER NOT NULL REFERENCES software(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE UNIQUE INDEX IF NOT EXISTS idx_comments_one_per_user
    ON comments(software_id, user_id);
  CREATE INDEX IF NOT EXISTS idx_comments_software
    ON comments(software_id, created_at DESC);

  CREATE TABLE IF NOT EXISTS comment_likes (
    comment_id INTEGER NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL,
    PRIMARY KEY (comment_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS favorites (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    software_id INTEGER NOT NULL REFERENCES software(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL,
    PRIMARY KEY (user_id, software_id)
  );

  CREATE TABLE IF NOT EXISTS preferences (
    user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    theme TEXT NOT NULL DEFAULT 'dark',
    accent TEXT NOT NULL DEFAULT 'lime',
    density TEXT NOT NULL DEFAULT 'comfortable',
    motion TEXT NOT NULL DEFAULT 'on',
    updated_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_sessions_expiry ON sessions(expires_at);
`);

function seedDatabase() {
  const existing = db.prepare('SELECT COUNT(*) AS count FROM software').get();
  if (Number(existing.count) > 0) return;

  const now = Date.now();
  const userInsert = db.prepare(`
    INSERT INTO users (username, password_hash, salt, display_name, bio, avatar_color, role, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const prefInsert = db.prepare(`
    INSERT INTO preferences (user_id, theme, accent, density, motion, updated_at)
    VALUES (?, 'dark', 'lime', 'comfortable', 'on', ?)
  `);
  const softwareInsert = db.prepare(`
    INSERT INTO software (
      slug, name, tagline, description, category, platforms, website, version,
      size_text, license, developer, accent, icon, tags, highlights, editor_note,
      featured, downloads, views, sort_order, added_at, created_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
    )
  `);
  const commentInsert = db.prepare(`
    INSERT INTO comments (software_id, user_id, content, rating, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const likeInsert = db.prepare(`
    INSERT OR IGNORE INTO comment_likes (comment_id, user_id, created_at) VALUES (?, ?, ?)
  `);

  db.exec('BEGIN');
  try {
    const userMap = new Map();
    for (const user of usersSeed) {
      const { salt, hash } = hashPassword(user.password);
      const createdAt = new Date(now - user.daysAgo * 86400000).toISOString();
      const result = userInsert.run(
        user.username,
        hash,
        salt,
        user.displayName,
        user.bio,
        user.avatarColor,
        user.role,
        createdAt
      );
      const userId = Number(result.lastInsertRowid);
      userMap.set(user.username, userId);
      prefInsert.run(userId, createdAt);
    }

    const softwareMap = new Map();
    softwareSeed.forEach((item, index) => {
      const createdAt = new Date(now - (60 - index) * 86400000).toISOString();
      const result = softwareInsert.run(
        item.slug,
        item.name,
        item.tagline,
        item.description,
        item.category,
        JSON.stringify(item.platforms),
        item.website,
        item.version,
        item.size,
        item.license,
        item.developer,
        item.accent,
        item.icon,
        JSON.stringify(item.tags),
        JSON.stringify(item.highlights),
        item.editorNote,
        item.featured,
        item.downloads,
        item.views,
        index + 1,
        new Date(`${item.addedAt}T09:00:00.000Z`).toISOString(),
        createdAt
      );
      softwareMap.set(item.slug, Number(result.lastInsertRowid));
    });

    for (const comment of commentsSeed) {
      const softwareId = softwareMap.get(comment.slug);
      const userId = userMap.get(comment.user);
      if (!softwareId || !userId) continue;
      const createdAt = new Date(now - comment.daysAgo * 86400000 - 3600000).toISOString();
      const result = commentInsert.run(
        softwareId,
        userId,
        comment.content,
        comment.rating,
        createdAt,
        createdAt
      );
      const commentId = Number(result.lastInsertRowid);
      for (const liker of comment.likedBy || []) {
        const likerId = userMap.get(liker);
        if (likerId && likerId !== userId) {
          likeInsert.run(commentId, likerId, createdAt);
        }
      }
    }

    db.prepare('INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)').run('seed_version', '1');
    db.prepare('INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)').run(
      'seeded_at',
      new Date(now).toISOString()
    );
    db.exec('COMMIT');
    console.log(`[震纤软件库] 数据库已初始化：${softwareSeed.length} 款软件，${usersSeed.length} 位用户，${commentsSeed.length} 条评价`);
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

seedDatabase();

function cleanupExpiredSessions() {
  try {
    db.prepare('DELETE FROM sessions WHERE expires_at <= ?').run(Date.now());
  } catch (error) {
    console.error('[震纤软件库] 清理会话失败：', error.message);
  }
}

cleanupExpiredSessions();
const sessionCleanupTimer = setInterval(cleanupExpiredSessions, 6 * 60 * 60 * 1000);
sessionCleanupTimer.unref();

function closeDatabase() {
  clearInterval(sessionCleanupTimer);
  try {
    db.close();
  } catch {
    // 数据库可能已经关闭。
  }
}

module.exports = { db, dbPath, closeDatabase };
