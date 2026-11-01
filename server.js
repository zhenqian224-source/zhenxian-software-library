'use strict';

const http = require('node:http');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { db, dbPath, closeDatabase } = require('./src/db');
const { hashPassword, verifyPassword } = require('./src/auth');

const PORT = Number.parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '0.0.0.0';
const PUBLIC_DIR = path.join(__dirname, 'public');
const SESSION_COOKIE = 'zx_session';
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const MAX_BODY_BYTES = 256 * 1024;

const VALID_THEMES = new Set(['dark', 'light', 'system']);
const VALID_ACCENTS = new Set(['lime', 'mint', 'coral', 'sky', 'violet', 'amber']);
const VALID_DENSITIES = new Set(['comfortable', 'compact']);
const VALID_MOTION = new Set(['on', 'off']);
const DEFAULT_PREFERENCES = {
  theme: 'dark',
  accent: 'lime',
  density: 'comfortable',
  motion: 'on'
};

const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Content-Security-Policy':
    "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'; font-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'"
};

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json'
};

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function setCommonHeaders(res) {
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
    res.setHeader(name, value);
  }
}

function sendJson(res, status, payload, extraHeaders = {}) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store',
    ...extraHeaders
  });
  res.end(body);
}

function parseCookies(req) {
  const header = req.headers.cookie;
  if (!header) return {};
  const cookies = {};
  for (const part of header.split(';')) {
    const index = part.indexOf('=');
    if (index < 0) continue;
    const key = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();
    if (key) {
      try {
        cookies[key] = decodeURIComponent(value);
      } catch {
        cookies[key] = value;
      }
    }
  }
  return cookies;
}

function getSessionToken(req) {
  return parseCookies(req)[SESSION_COOKIE] || null;
}

function getViewer(req) {
  const token = getSessionToken(req);
  if (!token) return null;
  const session = db
    .prepare(
      `SELECT s.expires_at, u.id, u.username, u.display_name, u.bio, u.avatar_color,
              u.role, u.created_at
       FROM sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.id = ?`
    )
    .get(token);
  if (!session) return null;
  if (Number(session.expires_at) <= Date.now()) {
    db.prepare('DELETE FROM sessions WHERE id = ?').run(token);
    return null;
  }
  return session;
}

function requireViewer(req) {
  const viewer = getViewer(req);
  if (!viewer) throw new HttpError(401, '请先登录后再继续。');
  return viewer;
}

function getPreferences(userId) {
  const row = db.prepare('SELECT * FROM preferences WHERE user_id = ?').get(userId);
  if (!row) return { ...DEFAULT_PREFERENCES };
  return {
    theme: VALID_THEMES.has(row.theme) ? row.theme : DEFAULT_PREFERENCES.theme,
    accent: VALID_ACCENTS.has(row.accent) ? row.accent : DEFAULT_PREFERENCES.accent,
    density: VALID_DENSITIES.has(row.density) ? row.density : DEFAULT_PREFERENCES.density,
    motion: VALID_MOTION.has(row.motion) ? row.motion : DEFAULT_PREFERENCES.motion
  };
}

function getFavoriteIds(userId) {
  if (!userId) return [];
  return db
    .prepare('SELECT software_id FROM favorites WHERE user_id = ? ORDER BY created_at DESC')
    .all(userId)
    .map((row) => Number(row.software_id));
}

function getUserStats(userId) {
  const favorites = db
    .prepare('SELECT COUNT(*) AS count FROM favorites WHERE user_id = ?')
    .get(userId);
  const comments = db
    .prepare('SELECT COUNT(*) AS count FROM comments WHERE user_id = ?')
    .get(userId);
  return {
    favorites: Number(favorites.count),
    comments: Number(comments.count)
  };
}

function buildMe(user) {
  if (!user) return null;
  return {
    id: Number(user.id),
    username: user.username,
    displayName: user.display_name,
    bio: user.bio,
    avatarColor: user.avatar_color,
    role: user.role,
    createdAt: user.created_at,
    stats: getUserStats(Number(user.id))
  };
}

function getSessionPayload(req) {
  const viewer = getViewer(req);
  if (!viewer) {
    return { me: null, prefs: null, favoriteIds: [] };
  }
  return {
    me: buildMe(viewer),
    prefs: getPreferences(Number(viewer.id)),
    favoriteIds: getFavoriteIds(Number(viewer.id))
  };
}

function cookieFlags(req) {
  const forwardedProto = req.headers['x-forwarded-proto'];
  const secure = forwardedProto === 'https' || Boolean(req.socket.encrypted);
  return `Path=/; HttpOnly; SameSite=Lax${secure ? '; Secure' : ''}`;
}

function setSessionCookie(req, res, token) {
  const maxAge = Math.floor(SESSION_TTL_MS / 1000);
  res.setHeader(
    'Set-Cookie',
    `${SESSION_COOKIE}=${encodeURIComponent(token)}; Max-Age=${maxAge}; ${cookieFlags(req)}`
  );
}

function clearSessionCookie(req, res) {
  res.setHeader('Set-Cookie', `${SESSION_COOKIE}=; Max-Age=0; ${cookieFlags(req)}`);
}

function createSession(userId) {
  const token = crypto.randomBytes(32).toString('hex');
  const now = Date.now();
  db.prepare('INSERT INTO sessions (id, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)').run(
    token,
    userId,
    now + SESSION_TTL_MS,
    now
  );
  return token;
}

function destroySession(req) {
  const token = getSessionToken(req);
  if (token) db.prepare('DELETE FROM sessions WHERE id = ?').run(token);
}

function isSameOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return true;
  try {
    return new URL(origin).host === req.headers.host;
  } catch {
    return false;
  }
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    let tooLarge = false;
    const chunks = [];
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        tooLarge = true;
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      if (tooLarge) {
        reject(new HttpError(413, '请求内容过大。'));
        return;
      }
      if (chunks.length === 0) {
        resolve({});
        return;
      }
      const text = Buffer.concat(chunks).toString('utf8').trim();
      if (!text) {
        resolve({});
        return;
      }
      try {
        const parsed = JSON.parse(text);
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
          reject(new HttpError(400, '请求格式不正确。'));
          return;
        }
        resolve(parsed);
      } catch {
        reject(new HttpError(400, '请求格式不正确。'));
      }
    });
    req.on('error', (error) => reject(error));
  });
}

/* ----------------------------- 限流 ----------------------------- */

const rateBuckets = new Map();

function enforceRateLimit(req, scope, limit, windowMs) {
  const ip = req.socket.remoteAddress || 'unknown';
  const key = `${scope}:${ip}`;
  const now = Date.now();
  let bucket = rateBuckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + windowMs };
    rateBuckets.set(key, bucket);
  }
  bucket.count += 1;
  if (bucket.count > limit) {
    const seconds = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
    throw new HttpError(429, `操作太频繁了，请 ${seconds} 秒后再试。`);
  }
}

const rateLimitCleanup = setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of rateBuckets.entries()) {
    if (bucket.resetAt <= now) rateBuckets.delete(key);
  }
}, 10 * 60 * 1000);
rateLimitCleanup.unref();

/* --------------------------- 数据序列化 --------------------------- */

function parseJsonArray(value) {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function mapSoftware(row) {
  if (!row) return null;
  return {
    id: Number(row.id),
    slug: row.slug,
    name: row.name,
    tagline: row.tagline,
    description: row.description,
    category: row.category,
    platforms: parseJsonArray(row.platforms),
    website: row.website,
    version: row.version,
    size: row.size_text,
    license: row.license,
    developer: row.developer,
    accent: row.accent,
    icon: row.icon,
    tags: parseJsonArray(row.tags),
    highlights: parseJsonArray(row.highlights),
    editorNote: row.editor_note,
    featured: Number(row.featured),
    downloads: Number(row.downloads),
    views: Number(row.views),
    addedAt: row.added_at,
    rating: Number(row.rating) || 0,
    commentCount: Number(row.comment_count) || 0
  };
}

const SOFTWARE_SELECT = `
  SELECT s.*, ROUND(COALESCE(AVG(c.rating), 0), 1) AS rating,
         COUNT(c.id) AS comment_count
  FROM software s
  LEFT JOIN comments c ON c.software_id = s.id
`;

function listSoftware(options = {}) {
  const { q = '', category = '', platform = '', sort = 'curated' } = options;
  const conditions = [];
  const params = [];

  if (q) {
    const like = `%${q}%`;
    conditions.push(
      '(s.name LIKE ? OR s.tagline LIKE ? OR s.description LIKE ? OR s.tags LIKE ? OR s.category LIKE ?)'
    );
    params.push(like, like, like, like, like);
  }
  if (category) {
    conditions.push('s.category = ?');
    params.push(category);
  }
  if (platform) {
    conditions.push('s.platforms LIKE ?');
    params.push(`%"${platform}"%`);
  }

  let orderBy =
    'CASE WHEN s.featured > 0 THEN s.featured ELSE 99 END ASC, s.sort_order ASC';
  if (sort === 'popular') orderBy = '(s.downloads + s.views) DESC, s.sort_order ASC';
  if (sort === 'rating') orderBy = 'rating DESC, comment_count DESC, s.sort_order ASC';
  if (sort === 'newest') orderBy = 's.added_at DESC, s.sort_order ASC';

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const sql = `${SOFTWARE_SELECT} ${where} GROUP BY s.id ORDER BY ${orderBy}`;
  return db.prepare(sql).all(...params).map(mapSoftware);
}

function getSoftwareBySlug(slug) {
  const row = db
    .prepare(`${SOFTWARE_SELECT} WHERE s.slug = ? GROUP BY s.id`)
    .get(slug);
  return mapSoftware(row);
}

function getSoftwareById(id) {
  const row = db
    .prepare(`${SOFTWARE_SELECT} WHERE s.id = ? GROUP BY s.id`)
    .get(id);
  return mapSoftware(row);
}

function mapComment(row, viewerId) {
  return {
    id: Number(row.id),
    content: row.content,
    rating: Number(row.rating),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    isEdited: row.updated_at !== row.created_at,
    likeCount: Number(row.like_count) || 0,
    liked: Boolean(row.liked),
    isMine: Boolean(viewerId && Number(row.user_id) === Number(viewerId)),
    user: {
      id: Number(row.user_id),
      username: row.username,
      displayName: row.display_name,
      avatarColor: row.avatar_color
    }
  };
}

const COMMENT_SELECT = `
  SELECT c.id, c.user_id, c.content, c.rating, c.created_at, c.updated_at,
         u.username, u.display_name, u.avatar_color,
         (SELECT COUNT(*) FROM comment_likes cl WHERE cl.comment_id = c.id) AS like_count,
         EXISTS(
           SELECT 1 FROM comment_likes cl2
           WHERE cl2.comment_id = c.id AND cl2.user_id = ?
         ) AS liked
  FROM comments c
  JOIN users u ON u.id = c.user_id
`;

function getComments(softwareId, viewerId = -1) {
  return db
    .prepare(
      `${COMMENT_SELECT}
       WHERE c.software_id = ?
       ORDER BY like_count DESC, c.created_at DESC`
    )
    .all(Number(viewerId) || -1, softwareId)
    .map((row) => mapComment(row, viewerId));
}

function getComment(commentId, viewerId = -1) {
  const row = db
    .prepare(`${COMMENT_SELECT} WHERE c.id = ?`)
    .get(Number(viewerId) || -1, commentId);
  return row ? mapComment(row, viewerId) : null;
}

function getCategories() {
  return db
    .prepare('SELECT category AS name, COUNT(*) AS count FROM software GROUP BY category ORDER BY MIN(sort_order)')
    .all()
    .map((row) => ({ name: row.name, count: Number(row.count) }));
}

function getStats() {
  const software = db.prepare('SELECT COUNT(*) AS count FROM software').get();
  const comments = db.prepare('SELECT COUNT(*) AS count FROM comments').get();
  const downloads = db.prepare('SELECT COALESCE(SUM(downloads), 0) AS total FROM software').get();
  const users = db.prepare('SELECT COUNT(*) AS count FROM users').get();
  const rating = db.prepare('SELECT ROUND(COALESCE(AVG(rating), 0), 1) AS avg FROM comments').get();
  return {
    software: Number(software.count),
    comments: Number(comments.count),
    downloads: Number(downloads.total),
    users: Number(users.count),
    averageRating: Number(rating.avg)
  };
}

/* ---------------------------- 输入校验 ---------------------------- */

const USERNAME_PATTERN = /^[\p{L}\p{N}_-]{3,20}$/u;

function cleanText(value) {
  return String(value ?? '')
    .replace(/\r\n/g, '\n')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim();
}

function validateUsername(value) {
  const username = cleanText(value);
  if (!USERNAME_PATTERN.test(username)) {
    throw new HttpError(400, '用户名需为 3–20 个字符，只能包含文字、数字、下划线或短横线。');
  }
  return username;
}

function validatePassword(value) {
  const password = String(value ?? '');
  if (password.length < 8 || password.length > 72) {
    throw new HttpError(400, '密码长度需为 8–72 个字符。');
  }
  return password;
}

function validateDisplayName(value) {
  const displayName = cleanText(value);
  if ([...displayName].length < 1 || [...displayName].length > 24) {
    throw new HttpError(400, '昵称长度需为 1–24 个字符。');
  }
  return displayName;
}

function validateBio(value) {
  const bio = cleanText(value);
  if ([...bio].length > 120) {
    throw new HttpError(400, '个人简介最多 120 个字符。');
  }
  return bio;
}

function validateAvatarColor(value) {
  const color = String(value ?? '').trim();
  if (!/^#[0-9a-fA-F]{6}$/.test(color)) {
    throw new HttpError(400, '头像颜色格式不正确。');
  }
  return color.toUpperCase();
}

function sanitizePreferences(input, current) {
  const next = { ...DEFAULT_PREFERENCES, ...(current || {}) };
  if (input.theme !== undefined) {
    if (!VALID_THEMES.has(input.theme)) throw new HttpError(400, '主题选项不正确。');
    next.theme = input.theme;
  }
  if (input.accent !== undefined) {
    if (!VALID_ACCENTS.has(input.accent)) throw new HttpError(400, '强调色选项不正确。');
    next.accent = input.accent;
  }
  if (input.density !== undefined) {
    if (!VALID_DENSITIES.has(input.density)) throw new HttpError(400, '内容密度选项不正确。');
    next.density = input.density;
  }
  if (input.motion !== undefined) {
    if (!VALID_MOTION.has(input.motion)) throw new HttpError(400, '动效选项不正确。');
    next.motion = input.motion;
  }
  return next;
}

function savePreferences(userId, preferences) {
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO preferences (user_id, theme, accent, density, motion, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(user_id) DO UPDATE SET
       theme = excluded.theme,
       accent = excluded.accent,
       density = excluded.density,
       motion = excluded.motion,
       updated_at = excluded.updated_at`
  ).run(
    userId,
    preferences.theme,
    preferences.accent,
    preferences.density,
    preferences.motion,
    now
  );
}

/* ------------------------------ API ------------------------------ */

async function routeApi(req, res, url) {
  const { pathname, searchParams } = url;
  const method = req.method;

  if (method === 'GET' && pathname === '/api/health') {
    sendJson(res, 200, {
      ok: true,
      service: 'zhenxian-software-library',
      database: path.basename(dbPath),
      time: new Date().toISOString()
    });
    return;
  }

  if (method === 'GET' && pathname === '/api/home') {
    const software = listSoftware();
    const featured = software
      .filter((item) => item.featured > 0)
      .sort((a, b) => a.featured - b.featured);
    sendJson(res, 200, {
      software,
      featured,
      categories: getCategories(),
      stats: getStats(),
      ...getSessionPayload(req)
    });
    return;
  }

  if (method === 'GET' && pathname === '/api/software') {
    const q = cleanText(searchParams.get('q') || '').slice(0, 80);
    const category = cleanText(searchParams.get('category') || '').slice(0, 20);
    const platform = cleanText(searchParams.get('platform') || '').slice(0, 20);
    const sort = cleanText(searchParams.get('sort') || 'curated').slice(0, 20);
    sendJson(res, 200, {
      software: listSoftware({ q, category, platform, sort }),
      categories: getCategories()
    });
    return;
  }

  if (method === 'POST' && pathname === '/api/auth/register') {
    enforceRateLimit(req, 'register', 8, 10 * 60 * 1000);
    const body = await readJsonBody(req);
    const username = validateUsername(body.username);
    const password = validatePassword(body.password);
    const displayName = body.displayName ? validateDisplayName(body.displayName) : username;
    const existing = db
      .prepare('SELECT id FROM users WHERE username = ? COLLATE NOCASE')
      .get(username);
    if (existing) throw new HttpError(409, '这个用户名已经被使用了，换一个试试。');

    const { salt, hash } = hashPassword(password);
    const now = new Date().toISOString();
    let userId;
    try {
      const result = db
        .prepare(
          `INSERT INTO users (username, password_hash, salt, display_name, bio, avatar_color, role, created_at)
           VALUES (?, ?, ?, ?, '', '#C7F464', 'member', ?)`
        )
        .run(username, hash, salt, displayName, now);
      userId = Number(result.lastInsertRowid);
    } catch (error) {
      if (String(error.message).includes('UNIQUE')) {
        throw new HttpError(409, '这个用户名已经被使用了，换一个试试。');
      }
      throw error;
    }
    savePreferences(userId, DEFAULT_PREFERENCES);
    const token = createSession(userId);
    setSessionCookie(req, res, token);
    const viewer = db
      .prepare(
        `SELECT id, username, display_name, bio, avatar_color, role, created_at FROM users WHERE id = ?`
      )
      .get(userId);
    sendJson(
      res,
      201,
      {
        me: buildMe(viewer),
        prefs: DEFAULT_PREFERENCES,
        favoriteIds: []
      },
      { 'Cache-Control': 'no-store' }
    );
    return;
  }

  if (method === 'POST' && pathname === '/api/auth/login') {
    enforceRateLimit(req, 'login', 12, 10 * 60 * 1000);
    const body = await readJsonBody(req);
    const username = cleanText(body.username);
    const password = String(body.password ?? '');
    if (!username || !password) throw new HttpError(400, '请输入用户名和密码。');
    const user = db
      .prepare('SELECT * FROM users WHERE username = ? COLLATE NOCASE')
      .get(username);
    if (!user || !verifyPassword(password, user.salt, user.password_hash)) {
      throw new HttpError(401, '用户名或密码不正确。');
    }
    const token = createSession(Number(user.id));
    setSessionCookie(req, res, token);
    sendJson(res, 200, {
      me: buildMe(user),
      prefs: getPreferences(Number(user.id)),
      favoriteIds: getFavoriteIds(Number(user.id))
    });
    return;
  }

  if (method === 'POST' && pathname === '/api/auth/logout') {
    destroySession(req);
    clearSessionCookie(req, res);
    sendJson(res, 200, { ok: true });
    return;
  }

  if (method === 'GET' && pathname === '/api/me') {
    sendJson(res, 200, getSessionPayload(req));
    return;
  }

  if (method === 'PATCH' && pathname === '/api/me') {
    const viewer = requireViewer(req);
    const body = await readJsonBody(req);
    const updates = {};
    if (body.displayName !== undefined) updates.display_name = validateDisplayName(body.displayName);
    if (body.bio !== undefined) updates.bio = validateBio(body.bio);
    if (body.avatarColor !== undefined) updates.avatar_color = validateAvatarColor(body.avatarColor);
    if (Object.keys(updates).length === 0) throw new HttpError(400, '没有需要保存的资料。');

    const fields = Object.keys(updates).map((field) => `${field} = ?`);
    db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`).run(
      ...Object.values(updates),
      Number(viewer.id)
    );
    const updated = db
      .prepare(
        `SELECT id, username, display_name, bio, avatar_color, role, created_at FROM users WHERE id = ?`
      )
      .get(Number(viewer.id));
    sendJson(res, 200, { me: buildMe(updated) });
    return;
  }

  if (method === 'PATCH' && pathname === '/api/me/preferences') {
    const viewer = requireViewer(req);
    const body = await readJsonBody(req);
    const preferences = sanitizePreferences(body, getPreferences(Number(viewer.id)));
    savePreferences(Number(viewer.id), preferences);
    sendJson(res, 200, { prefs: preferences });
    return;
  }

  if (method === 'GET' && pathname === '/api/me/favorites') {
    const viewer = requireViewer(req);
    const rows = db
      .prepare(
        `${SOFTWARE_SELECT}
         JOIN favorites f ON f.software_id = s.id AND f.user_id = ?
         GROUP BY s.id
         ORDER BY f.created_at DESC`
      )
      .all(Number(viewer.id));
    sendJson(res, 200, { software: rows.map(mapSoftware) });
    return;
  }

  const softwareDetailMatch = pathname.match(/^\/api\/software\/([^/]+)$/);
  if (method === 'GET' && softwareDetailMatch) {
    let slug;
    try {
      slug = decodeURIComponent(softwareDetailMatch[1]);
    } catch {
      throw new HttpError(400, '软件地址不正确。');
    }
    const software = getSoftwareBySlug(slug);
    if (!software) throw new HttpError(404, '没有找到这款软件。');
    const viewer = getViewer(req);
    const viewerId = viewer ? Number(viewer.id) : -1;
    db.prepare('UPDATE software SET views = views + 1 WHERE id = ?').run(software.id);
    const comments = getComments(software.id, viewerId);
    const favorite = viewer
      ? Boolean(
          db
            .prepare('SELECT 1 AS ok FROM favorites WHERE user_id = ? AND software_id = ?')
            .get(Number(viewer.id), software.id)
        )
      : false;
    const related = db
      .prepare(
        `${SOFTWARE_SELECT}
         WHERE s.category = ? AND s.id <> ?
         GROUP BY s.id
         ORDER BY s.featured DESC, s.sort_order ASC
         LIMIT 3`
      )
      .all(software.category, software.id)
      .map(mapSoftware);
    const myComment = viewer
      ? comments.find((comment) => comment.isMine) || null
      : null;
    sendJson(res, 200, {
      software: { ...software, views: software.views + 1 },
      comments,
      favorite,
      myComment,
      related,
      viewer: viewer ? buildMe(viewer) : null
    });
    return;
  }

  const commentsMatch = pathname.match(/^\/api\/software\/(\d+)\/comments$/);
  if (method === 'POST' && commentsMatch) {
    enforceRateLimit(req, 'comment', 24, 10 * 60 * 1000);
    const viewer = requireViewer(req);
    const softwareId = Number(commentsMatch[1]);
    const software = db.prepare('SELECT id FROM software WHERE id = ?').get(softwareId);
    if (!software) throw new HttpError(404, '没有找到这款软件。');
    const body = await readJsonBody(req);
    const content = cleanText(body.content);
    const contentLength = [...content].length;
    if (contentLength < 2 || contentLength > 500) {
      throw new HttpError(400, '评价需为 2–500 个字符。');
    }
    const rating = Number(body.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      throw new HttpError(400, '请选择 1–5 星评分。');
    }
    const existing = db
      .prepare('SELECT id FROM comments WHERE software_id = ? AND user_id = ?')
      .get(softwareId, Number(viewer.id));
    const now = new Date().toISOString();
    let commentId;
    if (existing) {
      commentId = Number(existing.id);
      db.prepare(
        'UPDATE comments SET content = ?, rating = ?, updated_at = ? WHERE id = ?'
      ).run(content, rating, now, commentId);
    } else {
      const result = db
        .prepare(
          `INSERT INTO comments (software_id, user_id, content, rating, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?)`
        )
        .run(softwareId, Number(viewer.id), content, rating, now, now);
      commentId = Number(result.lastInsertRowid);
    }
    sendJson(res, existing ? 200 : 201, {
      comment: getComment(commentId, Number(viewer.id)),
      updated: Boolean(existing)
    });
    return;
  }

  const favoriteMatch = pathname.match(/^\/api\/software\/(\d+)\/favorite$/);
  if (method === 'POST' && favoriteMatch) {
    const viewer = requireViewer(req);
    const softwareId = Number(favoriteMatch[1]);
    const software = db.prepare('SELECT id FROM software WHERE id = ?').get(softwareId);
    if (!software) throw new HttpError(404, '没有找到这款软件。');
    const existing = db
      .prepare('SELECT 1 AS ok FROM favorites WHERE user_id = ? AND software_id = ?')
      .get(Number(viewer.id), softwareId);
    let favorited;
    if (existing) {
      db.prepare('DELETE FROM favorites WHERE user_id = ? AND software_id = ?').run(
        Number(viewer.id),
        softwareId
      );
      favorited = false;
    } else {
      db.prepare('INSERT INTO favorites (user_id, software_id, created_at) VALUES (?, ?, ?)').run(
        Number(viewer.id),
        softwareId,
        new Date().toISOString()
      );
      favorited = true;
    }
    sendJson(res, 200, {
      favorited,
      favoriteIds: getFavoriteIds(Number(viewer.id))
    });
    return;
  }

  const acquireMatch = pathname.match(/^\/api\/software\/(\d+)\/acquire$/);
  if (method === 'POST' && acquireMatch) {
    enforceRateLimit(req, 'acquire', 90, 60 * 1000);
    const softwareId = Number(acquireMatch[1]);
    const software = db.prepare('SELECT id FROM software WHERE id = ?').get(softwareId);
    if (!software) throw new HttpError(404, '没有找到这款软件。');
    db.prepare('UPDATE software SET downloads = downloads + 1 WHERE id = ?').run(softwareId);
    const row = db.prepare('SELECT downloads FROM software WHERE id = ?').get(softwareId);
    sendJson(res, 200, { downloads: Number(row.downloads) });
    return;
  }

  const likeMatch = pathname.match(/^\/api\/comments\/(\d+)\/like$/);
  if (method === 'POST' && likeMatch) {
    enforceRateLimit(req, 'like', 60, 10 * 60 * 1000);
    const viewer = requireViewer(req);
    const commentId = Number(likeMatch[1]);
    const comment = db.prepare('SELECT id FROM comments WHERE id = ?').get(commentId);
    if (!comment) throw new HttpError(404, '这条评价不存在。');
    const existing = db
      .prepare('SELECT 1 AS ok FROM comment_likes WHERE comment_id = ? AND user_id = ?')
      .get(commentId, Number(viewer.id));
    let liked;
    if (existing) {
      db.prepare('DELETE FROM comment_likes WHERE comment_id = ? AND user_id = ?').run(
        commentId,
        Number(viewer.id)
      );
      liked = false;
    } else {
      db.prepare('INSERT INTO comment_likes (comment_id, user_id, created_at) VALUES (?, ?, ?)').run(
        commentId,
        Number(viewer.id),
        new Date().toISOString()
      );
      liked = true;
    }
    const count = db
      .prepare('SELECT COUNT(*) AS count FROM comment_likes WHERE comment_id = ?')
      .get(commentId);
    sendJson(res, 200, { liked, likeCount: Number(count.count) });
    return;
  }

  const commentMatch = pathname.match(/^\/api\/comments\/(\d+)$/);
  if (method === 'DELETE' && commentMatch) {
    const viewer = requireViewer(req);
    const commentId = Number(commentMatch[1]);
    const comment = db
      .prepare('SELECT id, user_id FROM comments WHERE id = ?')
      .get(commentId);
    if (!comment) throw new HttpError(404, '这条评价不存在。');
    if (Number(comment.user_id) !== Number(viewer.id) && viewer.role !== 'admin') {
      throw new HttpError(403, '只能删除自己发布的评价。');
    }
    db.prepare('DELETE FROM comments WHERE id = ?').run(commentId);
    sendJson(res, 200, { ok: true });
    return;
  }

  throw new HttpError(404, '接口不存在。');
}

/* ----------------------------- 静态文件 ----------------------------- */

function resolveStaticPath(pathname) {
  let decoded;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    throw new HttpError(400, '地址格式不正确。');
  }
  if (decoded.includes('\0')) throw new HttpError(400, '地址格式不正确。');
  const relative = decoded.replace(/^\/+/, '') || 'index.html';
  const normalized = path.normalize(relative);
  const filePath = path.resolve(PUBLIC_DIR, normalized);
  if (filePath !== PUBLIC_DIR && !filePath.startsWith(`${PUBLIC_DIR}${path.sep}`)) {
    throw new HttpError(403, '禁止访问该路径。');
  }
  return filePath;
}

function serveStatic(req, res, pathname) {
  let filePath = resolveStaticPath(pathname);
  let stat;
  try {
    stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      filePath = path.join(filePath, 'index.html');
      stat = fs.statSync(filePath);
    }
  } catch {
    filePath = path.join(PUBLIC_DIR, '404.html');
    try {
      stat = fs.statSync(filePath);
      res.statusCode = 404;
    } catch {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 · 页面不存在');
      return;
    }
  }

  const extension = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[extension] || 'application/octet-stream';
  res.writeHead(res.statusCode || 200, {
    'Content-Type': contentType,
    'Content-Length': stat.size,
    'Cache-Control': 'no-cache',
    'Last-Modified': stat.mtime.toUTCString()
  });
  if (req.method === 'HEAD') {
    res.end();
    return;
  }
  const stream = fs.createReadStream(filePath);
  stream.on('error', () => {
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    }
    res.end();
  });
  stream.pipe(res);
}

/* ------------------------------ 服务 ------------------------------ */

const server = http.createServer(async (req, res) => {
  setCommonHeaders(res);
  let url;
  try {
    url = new URL(req.url, `http://${req.headers.host || `${HOST}:${PORT}`}`);
  } catch {
    sendJson(res, 400, { error: '请求地址不正确。' });
    return;
  }

  try {
    if (url.pathname.startsWith('/api/')) {
      const mutationMethods = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
      if (mutationMethods.has(req.method) && !isSameOrigin(req)) {
        throw new HttpError(403, '请求来源校验失败。');
      }
      await routeApi(req, res, url);
      return;
    }

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.setHeader('Allow', 'GET, HEAD');
      throw new HttpError(405, '该请求方法不支持。');
    }
    serveStatic(req, res, url.pathname);
  } catch (error) {
    if (res.headersSent) {
      res.end();
      return;
    }
    if (error instanceof HttpError) {
      sendJson(res, error.status, { error: error.message });
      return;
    }
    console.error('[震纤软件库] 未处理的请求错误：', error);
    sendJson(res, 500, { error: '服务器开小差了，请稍后再试。' });
  }
});

server.requestTimeout = 30_000;
server.headersTimeout = 35_000;

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`[震纤软件库] 端口 ${PORT} 已被占用，请设置其他 PORT 后重试。`);
  } else {
    console.error('[震纤软件库] 服务启动失败：', error);
  }
  process.exitCode = 1;
});

function getLanAddresses() {
  const addresses = [];
  for (const entries of Object.values(os.networkInterfaces())) {
    for (const entry of entries || []) {
      if (entry.family === 'IPv4' && !entry.internal) addresses.push(entry.address);
    }
  }
  return [...new Set(addresses)];
}

server.listen(PORT, HOST, () => {
  const localUrl = `http://localhost:${PORT}`;
  const lanAddresses = getLanAddresses();
  console.log('');
  console.log('  震纤软件库 / ZHENXIAN SOFTWARE LIBRARY');
  console.log(`  本机访问   ${localUrl}`);
  if (HOST === '0.0.0.0' || HOST === '::') {
    if (lanAddresses.length) {
      for (const address of lanAddresses) {
        console.log(`  手机访问   http://${address}:${PORT}`);
      }
    } else {
      console.log('  手机访问   未检测到局域网 IPv4 地址，请先连接 Wi-Fi 或网线');
    }
  } else if (HOST !== '127.0.0.1' && HOST !== 'localhost') {
    console.log(`  手机访问   http://${HOST}:${PORT}`);
  }
  console.log(`  数据文件   ${dbPath}`);
  console.log('');
});

let shuttingDown = false;
function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`\n[震纤软件库] 收到 ${signal}，正在关闭服务…`);
  server.close(() => {
    closeDatabase();
    process.exit(0);
  });
  setTimeout(() => {
    closeDatabase();
    process.exit(0);
  }, 4000).unref();
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

module.exports = { server };
