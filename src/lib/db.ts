import mysql from 'mysql2/promise';
import { CIBlog, CICategory, CIAdvertisement, CITag, CIImageLibrary, CISubscriber, CIUser, CIActivityLog } from '../types.js';
import { resolveCategoryIds } from './taxonomy.js';

/**
 * MySQL data provider for the legacy jaipurwe_fsianews CodeIgniter database.
 * Strictly read-only mapping — no schema alteration, no writes.
 *
 * Real ci_blog columns: id, user_created_by, title, cat_id, sub_cat_id, type,
 * tag_id (CSV), image, alt_tag, video_*, url, meta_*, h2..h6_tag, og_*,
 * description (longtext HTML), status, created_at (varchar 'YYYY-MM-DD : HH:MM:SS').
 * Real ci_category columns: id, parent_id, url (slug), cat_name, meta_*, og_*, status.
 */
export const dbPool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'jaipurwe_fsianews',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'jaipurwe_fsianews',
  waitForConnections: true,
  // Small pool: each Vercel lambda instance holds its own pool against a
  // shared-hosting MySQL with a low max_user_connections cap
  connectionLimit: parseInt(process.env.MYSQL_POOL_LIMIT || '3', 10),
  queueLimit: 0,
  connectTimeout: 8000,
});

/** Legacy asset host — image paths in ci_blog are relative (assets/img/blog/...). */
const ASSET_BASE = (process.env.LEGACY_ASSET_BASE || 'https://newsforever.in/').replace(/\/$/, '') + '/';

function assetUrl(path: string | null | undefined): string {
  const p = (path || '').trim();
  if (!p) return '';
  if (/^https?:\/\//i.test(p)) return p;
  return ASSET_BASE + p.replace(/^\//, '');
}

function stripHtml(html: string): string {
  return (html || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

interface RawBlogRow {
  id: number;
  user_created_by: number;
  title: string;
  cat_id: number;
  sub_cat_id: number;
  type: number;
  tag_id: string;
  image: string;
  alt_tag: string;
  url: string;
  youtube_video_link?: string;
  meta_title: string;
  meta_keyword: string;
  meta_description: string;
  h2_tag: string;
  h3_tag: string;
  h4_tag: string;
  h5_tag: string;
  h6_tag: string;
  og_title: string;
  og_url: string;
  og_description: string;
  og_image: string;
  description: string;
  status: number;
  created_at: string;
  category_name?: string;
  sub_category_name?: string;
  author_firstname?: string;
  author_lastname?: string;
}

interface RawCategoryRow {
  id: number;
  parent_id: number;
  url: string;
  cat_name: string;
  meta_title: string;
  meta_description: string;
  status: number;
  created_at: string;
  article_count?: number;
}

/** Map a raw ci_blog row to the frontend CIBlog shape. */
export function mapBlogRow(row: RawBlogRow, index = 0): CIBlog {
  const summarySource = row.meta_description?.trim() || stripHtml(row.description);
  const summary = summarySource.length > 220 ? summarySource.slice(0, 217).trimEnd() + '…' : summarySource;
  const author = [row.author_firstname, row.author_lastname].filter(Boolean).join(' ').trim();

  return {
    id: row.id,
    title: row.title,
    url: (row.url || '').trim(),
    short_content: summary,
    content: row.description || '',
    category_id: row.cat_id,
    sub_category_id: row.sub_cat_id,
    category_name: row.sub_category_name || row.category_name || 'News',
    tag_ids: (row.tag_id || '')
      .split(',')
      .map((t) => parseInt(t, 10))
      .filter((n) => !isNaN(n)),
    image: assetUrl(row.image),
    alt_tag: row.alt_tag || row.title,
    status: row.status,
    is_featured: index === 0,
    is_trending: index > 0 && index < 4,
    author_id: row.user_created_by,
    author_name: author || 'News Forever Bureau',
    views: 0,
    created_at: row.created_at || '',
    updated_at: row.created_at || '',
    meta_title: row.meta_title || row.title,
    meta_description: row.meta_description || summary,
    meta_keyword: row.meta_keyword || '',
    og_title: row.og_title || row.title,
    og_url: row.og_url || `https://newsforever.in/${(row.url || '').trim()}`,
    og_description: row.og_description || summary,
    og_image: assetUrl(row.og_image || row.image),
    h2_tag: row.h2_tag,
    h3_tag: row.h3_tag,
    h4_tag: row.h4_tag,
    h5_tag: row.h5_tag,
    h6_tag: row.h6_tag,
    youtube_video_link: (row.youtube_video_link || '').trim() || undefined,
  };
}

/** Map a raw ci_category row to the frontend CICategory shape. */
function mapCategoryRow(row: RawCategoryRow): CICategory {
  return {
    id: row.id,
    parent_id: row.parent_id,
    category_name: row.cat_name,
    slug: (row.url || '').trim(),
    status: row.status,
    article_count: row.article_count ?? 0,
    meta_title: row.meta_title || row.cat_name,
    meta_description: row.meta_description || '',
    created_at: row.created_at || '',
  };
}

let isDbOfflineLogged = false;

function handleDbError(context: string, err: any) {
  if (err?.code === 'ECONNREFUSED' || err?.code === 'ETIMEDOUT' || err?.code === 'ENOTFOUND') {
    if (!isDbOfflineLogged) {
      console.info(`[MySQL Data Provider] Connection at ${process.env.MYSQL_HOST || 'localhost'} unavailable (${err.code}).`);
      isDbOfflineLogged = true;
    }
  } else {
    console.warn(`[MySQL Data Provider] ${context}:`, err?.message || err);
  }
}

const BLOG_SELECT = `
  SELECT b.id, b.user_created_by, b.title, b.cat_id, b.sub_cat_id, b.type, b.tag_id, b.youtube_video_link,
         b.image, b.alt_tag, b.url, b.meta_title, b.meta_keyword, b.meta_description,
         b.h2_tag, b.h3_tag, b.h4_tag, b.h5_tag, b.h6_tag,
         b.og_title, b.og_url, b.og_description, b.og_image,
         b.description, b.status, b.created_at,
         c.cat_name AS category_name,
         sc.cat_name AS sub_category_name,
         a.firstname AS author_firstname,
         a.lastname AS author_lastname
  FROM ci_blog b
  LEFT JOIN ci_category c ON b.cat_id = c.id
  LEFT JOIN ci_category sc ON b.sub_cat_id = sc.id
  LEFT JOIN ci_admin a ON b.user_created_by = a.admin_id
`;

/**
 * Fetch published blogs from ci_blog. When categorySlug is given, it is
 * resolved against ci_category (with year-variant aliases) and matched on
 * both cat_id and sub_cat_id.
 */
export async function getPublishedBlogs(limit = 50, categorySlug?: string): Promise<CIBlog[]> {
  try {
    let where = 'WHERE b.status = 1';
    const params: any[] = [];

    if (categorySlug && categorySlug !== 'all') {
      const cats = await getAllCategories();
      const ids = resolveCategoryIds(categorySlug, cats.map((c) => ({ id: c.id, parent_id: c.parent_id, slug: c.slug })));
      if (ids.size === 0) return [];
      const placeholders = [...ids].map(() => '?').join(',');
      where += ` AND (b.cat_id IN (${placeholders}) OR b.sub_cat_id IN (${placeholders}))`;
      params.push(...ids, ...ids);
    }

    const query = `${BLOG_SELECT} ${where} ORDER BY b.created_at DESC, b.id DESC LIMIT ?`;
    params.push(limit);

    const [rows] = await dbPool.query(query, params);
    return (rows as RawBlogRow[]).map((row, i) => mapBlogRow(row, i));
  } catch (err) {
    handleDbError('getPublishedBlogs', err);
    return [];
  }
}

/** Fetch a single article by exact ci_blog.url slug (legacy rows carry stray whitespace). */
export async function getBlogByUrlSlug(urlSlug: string): Promise<CIBlog | null> {
  try {
    const query = `${BLOG_SELECT} WHERE TRIM(b.url) = ? AND b.status = 1 LIMIT 1`;
    const [rows] = await dbPool.query(query, [urlSlug.trim()]);
    const list = rows as RawBlogRow[];
    return list.length > 0 ? mapBlogRow(list[0]) : null;
  } catch (err) {
    handleDbError('getBlogByUrlSlug', err);
    return null;
  }
}

let categoriesCache: { data: CICategory[]; at: number } | null = null;
const CATEGORY_CACHE_MS = 60_000;

/** Fetch all active categories (parents and children) with article counts. */
export async function getAllCategories(): Promise<CICategory[]> {
  if (categoriesCache && Date.now() - categoriesCache.at < CATEGORY_CACHE_MS) {
    return categoriesCache.data;
  }
  try {
    const query = `
      SELECT c.id, c.parent_id, c.url, c.cat_name, c.meta_title, c.meta_description,
             c.status, c.created_at,
             (SELECT COUNT(*) FROM ci_blog b WHERE b.status = 1 AND (b.cat_id = c.id OR b.sub_cat_id = c.id)) AS article_count
      FROM ci_category c
      WHERE c.status = 1
      ORDER BY c.parent_id ASC, c.id ASC
    `;
    const [rows] = await dbPool.query(query);
    const data = (rows as RawCategoryRow[]).map(mapCategoryRow);
    categoriesCache = { data, at: Date.now() };
    return data;
  } catch (err) {
    handleDbError('getAllCategories', err);
    return [];
  }
}

/** Top-level categories only (parent_id = 0) — used for footer/topic listings. */
export async function getActiveCategories(): Promise<CICategory[]> {
  const all = await getAllCategories();
  return all.filter((c) => !c.parent_id && (c.article_count ?? 0) > 0);
}

/** Real image library rows from ci_imagelibrary. */
export async function getImageLibrary(limit = 300): Promise<CIImageLibrary[]> {
  try {
    const [rows] = await dbPool.query(
      `SELECT id, user_id, url, image, created_at FROM ci_imagelibrary ORDER BY id DESC LIMIT ?`,
      [limit]
    );
    return (rows as any[]).map((r) => ({
      id: r.id,
      file_name: String(r.image || '').split('/').pop() || String(r.image || ''),
      file_path: assetUrl(r.image),
      file_size: '',
      alt_tag: r.url || '',
      uploaded_by: String(r.user_id || ''),
      created_at: r.created_at || '',
    }));
  } catch (err) {
    handleDbError('getImageLibrary', err);
    return [];
  }
}

/** Real subscriber emails from ci_subscribe. */
export async function getSubscribers(limit = 500): Promise<CISubscriber[]> {
  try {
    const [rows] = await dbPool.query(
      `SELECT id, email, created_at FROM ci_subscribe ORDER BY id DESC LIMIT ?`,
      [limit]
    );
    return (rows as any[]).map((r) => ({
      id: r.id,
      email: r.email,
      status: 'subscribed' as const,
      subscribed_at: r.created_at || '',
    }));
  } catch (err) {
    handleDbError('getSubscribers', err);
    return [];
  }
}

/** Real admin accounts from ci_admin (passwords never leave the DB layer). */
export async function getAdminUsers(): Promise<CIUser[]> {
  try {
    const [rows] = await dbPool.query(
      `SELECT admin_id, username, firstname, lastname, email, image, is_active, is_supper, last_login FROM ci_admin ORDER BY admin_id ASC`
    );
    return (rows as any[]).map((r) => ({
      id: r.admin_id,
      username: [r.firstname, r.lastname].filter(Boolean).join(' ').trim() || r.username,
      email: r.email || '',
      role: r.is_supper ? 'Super Admin' : 'Senior Editor',
      avatar: assetUrl(r.image),
      status: r.is_active ? 1 : 0,
      last_login: r.last_login ? String(r.last_login) : '',
    }));
  } catch (err) {
    handleDbError('getAdminUsers', err);
    return [];
  }
}

/** Real activity trail from ci_activity_log (labels joined from ci_activity_status). */
export async function getActivityLogs(limit = 100): Promise<CIActivityLog[]> {
  try {
    const [rows] = await dbPool.query(
      `SELECT l.id, l.activity_id, l.user_id, l.admin_id, l.created_at,
              a.username, a.firstname, a.lastname
       FROM ci_activity_log l
       LEFT JOIN ci_admin a ON l.admin_id = a.admin_id
       ORDER BY l.id DESC LIMIT ?`,
      [limit]
    );
    return (rows as any[]).map((r) => ({
      id: r.id,
      user_id: r.user_id || r.admin_id,
      user_name: [r.firstname, r.lastname].filter(Boolean).join(' ').trim() || r.username || `Admin #${r.admin_id}`,
      activity: `Activity code ${r.activity_id}`,
      module: 'System',
      ip_address: '',
      created_at: r.created_at ? String(r.created_at) : '',
    }));
  } catch (err) {
    handleDbError('getActivityLogs', err);
    return [];
  }
}

// ---- Site configuration (stored as a JSON row in ci_setting, zero schema change) ----

export interface SiteConfig {
  headerColor?: string;
  footerColor?: string;
  navExtra?: number[]; // extra ci_category ids pinned as top-level nav tabs
}

const CONFIG_KEY = 'nf_site_config';

export async function getSiteConfig(): Promise<SiteConfig> {
  try {
    const [rows] = await dbPool.query(`SELECT page_description FROM ci_setting WHERE page_key = ? LIMIT 1`, [CONFIG_KEY]);
    const list = rows as any[];
    if (list.length === 0) return {};
    return JSON.parse(list[0].page_description || '{}');
  } catch (err) {
    handleDbError('getSiteConfig', err);
    return {};
  }
}

export async function saveSiteConfig(config: SiteConfig): Promise<SiteConfig> {
  const json = JSON.stringify({
    headerColor: config.headerColor || '',
    footerColor: config.footerColor || '',
    navExtra: Array.isArray(config.navExtra) ? config.navExtra.map(Number).slice(0, 12) : [],
  });
  const [rows] = await dbPool.query(`SELECT id FROM ci_setting WHERE page_key = ? LIMIT 1`, [CONFIG_KEY]);
  if ((rows as any[]).length > 0) {
    await dbPool.query(`UPDATE ci_setting SET page_description = ? WHERE page_key = ?`, [json, CONFIG_KEY]);
  } else {
    await dbPool.query(
      `INSERT INTO ci_setting (page_key, page_description, email, phone, address, map, status) VALUES (?, ?, '', '', '', '', 1)`,
      [CONFIG_KEY, json]
    );
  }
  return getSiteConfig();
}

// ---- ci_advertisement CRUD ----

function toAdColumns(payload: Partial<CIAdvertisement>): Record<string, string | number> {
  const cols: Record<string, string | number> = {};
  if (payload.title !== undefined) cols.advertisement_title = payload.title;
  if (payload.url !== undefined) cols.advertisement_url = payload.url;
  if (payload.advertisement_image !== undefined) cols.advertisement_image = toLegacyAssetPath(payload.advertisement_image);
  if (payload.alt_tag !== undefined) cols.alt_tag = payload.alt_tag;
  if (payload.position !== undefined) cols.position = payload.position;
  if (payload.priority !== undefined) cols.priority = payload.priority;
  if (payload.status !== undefined) cols.status = payload.status;
  return cols;
}

export async function createAd(payload: Partial<CIAdvertisement>): Promise<CIAdvertisement[]> {
  const defaults: Record<string, string | number> = {
    advertisement_title: '', advertisement_url: '', advertisement_image: '', alt_tag: '',
    priority: 2, position: 'right', status: 1,
  };
  const row = { ...defaults, ...toAdColumns(payload), created_at: legacyNow() };
  const names = Object.keys(row);
  await dbPool.query(
    `INSERT INTO ci_advertisement (${names.map((n) => `\`${n}\``).join(',')}) VALUES (${names.map(() => '?').join(',')})`,
    names.map((n) => row[n as keyof typeof row])
  );
  return getActiveAds();
}

export async function updateAd(id: number, payload: Partial<CIAdvertisement>): Promise<CIAdvertisement[]> {
  const cols = toAdColumns(payload);
  const names = Object.keys(cols);
  if (names.length > 0) {
    await dbPool.query(
      `UPDATE ci_advertisement SET ${names.map((n) => `\`${n}\` = ?`).join(', ')} WHERE id = ?`,
      [...names.map((n) => cols[n]), id]
    );
  }
  return getActiveAds();
}

export async function deleteAd(id: number): Promise<boolean> {
  const [result] = await dbPool.query(`DELETE FROM ci_advertisement WHERE id = ?`, [id]);
  return (result as any).affectedRows > 0;
}

// ---- ci_category CRUD ----

export async function createCategory(payload: Partial<CICategory>): Promise<CICategory[]> {
  const row: Record<string, string | number> = {
    parent_id: payload.parent_id ?? 0,
    url: (payload.slug || '').trim(),
    cat_name: payload.category_name || '',
    meta_title: payload.meta_title || payload.category_name || '',
    meta_keyword: '', meta_description: payload.meta_description || '',
    h2_tag: '', h3_tag: '', h4_tag: '', h5_tag: '', h6_tag: '',
    og_title: '', og_url: '', og_description: '', og_image: '',
    status: payload.status ?? 1,
    created_at: legacyNow(),
  };
  const names = Object.keys(row);
  await dbPool.query(
    `INSERT INTO ci_category (${names.map((n) => `\`${n}\``).join(',')}) VALUES (${names.map(() => '?').join(',')})`,
    names.map((n) => row[n])
  );
  categoriesCache = null;
  return getAllCategories();
}

export async function updateCategory(id: number, payload: Partial<CICategory>): Promise<CICategory[]> {
  const cols: Record<string, string | number> = {};
  if (payload.category_name !== undefined) cols.cat_name = payload.category_name;
  if (payload.slug !== undefined) cols.url = payload.slug.trim();
  if (payload.parent_id !== undefined) cols.parent_id = payload.parent_id;
  if (payload.status !== undefined) cols.status = payload.status;
  if (payload.meta_title !== undefined) cols.meta_title = payload.meta_title;
  if (payload.meta_description !== undefined) cols.meta_description = payload.meta_description;
  const names = Object.keys(cols);
  if (names.length > 0) {
    await dbPool.query(
      `UPDATE ci_category SET ${names.map((n) => `\`${n}\` = ?`).join(', ')} WHERE id = ?`,
      [...names.map((n) => cols[n]), id]
    );
  }
  categoriesCache = null;
  return getAllCategories();
}

export async function deleteCategory(id: number): Promise<boolean> {
  const [result] = await dbPool.query(`DELETE FROM ci_category WHERE id = ?`, [id]);
  categoriesCache = null;
  return (result as any).affectedRows > 0;
}

/** Fetch active tags from ci_tag (url column is the slug). */
export async function getActiveTags(): Promise<CITag[]> {
  try {
    const [rows] = await dbPool.query(
      `SELECT id, tag_name, url, created_at FROM ci_tag WHERE status = 1 ORDER BY id ASC`
    );
    return (rows as any[]).map((row) => ({
      id: row.id,
      tag_name: row.tag_name,
      slug: (row.url || '').trim(),
      created_at: row.created_at || '',
    }));
  } catch (err) {
    handleDbError('getActiveTags', err);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Admin authentication + ci_blog write support
// ---------------------------------------------------------------------------

export interface AdminUser {
  admin_id: number;
  username: string;
  name: string;
}

/**
 * Verify credentials against the real ci_admin table (legacy plaintext
 * scheme). When the database is unreachable (e.g. Vercel cannot reach the
 * shared-hosting MySQL), falls back to ADMIN_PANEL_USER / ADMIN_PANEL_PASS
 * environment credentials so the panel still opens in snapshot (read-only)
 * mode. The DB stays the authority whenever it is reachable.
 */
export async function verifyAdmin(username: string, password: string): Promise<AdminUser | null> {
  if (!username || !password) return null;
  try {
    const [rows] = await dbPool.query(
      `SELECT admin_id, username, firstname, lastname FROM ci_admin
       WHERE username = ? AND password = ? AND is_active = 1 LIMIT 1`,
      [username, password]
    );
    const list = rows as any[];
    if (list.length === 0) return null;
    const a = list[0];
    return {
      admin_id: a.admin_id,
      username: a.username,
      name: [a.firstname, a.lastname].filter(Boolean).join(' ').trim() || a.username,
    };
  } catch (err) {
    handleDbError('verifyAdmin', err);
    // Direct DB unreachable (e.g. Vercel) — the caller falls back to the
    // bridge, which verifies against the real ci_admin table. The old
    // ADMIN_PANEL_USER/PASS offline shortcut is removed: it let you log in
    // but not write (bridge needs real credentials), which was confusing.
    return null;
  }
}

/**
 * Change the signed-in admin's password (legacy plaintext scheme kept so the
 * old cPanel panel continues to accept the same credentials).
 */
export async function changeAdminPassword(
  username: string,
  currentPassword: string,
  newPassword: string
): Promise<boolean> {
  const admin = await verifyAdmin(username, currentPassword);
  if (!admin || admin.admin_id === 0) return false;
  const [result] = await dbPool.query(
    `UPDATE ci_admin SET password = ? WHERE admin_id = ?`,
    [newPassword, admin.admin_id]
  );
  return (result as any).affectedRows > 0;
}

/** Legacy CodeIgniter created_at format: 'YYYY-MM-DD : HH:MM:SS' */
function legacyNow(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} : ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/** Strip the asset host so stored paths keep the legacy relative form. */
function toLegacyAssetPath(url: string | undefined): string {
  return (url || '').replace(/^https?:\/\/[^/]+\//i, '').trim();
}

/** Map a frontend CIBlog partial onto real ci_blog columns. */
function toBlogColumns(payload: Partial<CIBlog>): Record<string, string | number> {
  const cols: Record<string, string | number> = {};
  if (payload.title !== undefined) cols.title = payload.title;
  if (payload.category_id !== undefined) cols.cat_id = payload.category_id;
  if (payload.sub_category_id !== undefined) cols.sub_cat_id = payload.sub_category_id;
  if (payload.tag_ids !== undefined) cols.tag_id = payload.tag_ids.join(',');
  if (payload.image !== undefined) cols.image = toLegacyAssetPath(payload.image);
  if (payload.alt_tag !== undefined) cols.alt_tag = payload.alt_tag;
  if (payload.url !== undefined) cols.url = payload.url.trim();
  if (payload.meta_title !== undefined) cols.meta_title = payload.meta_title;
  if (payload.meta_keyword !== undefined) cols.meta_keyword = payload.meta_keyword;
  if (payload.meta_description !== undefined) cols.meta_description = payload.meta_description;
  if (payload.h2_tag !== undefined) cols.h2_tag = payload.h2_tag;
  if (payload.h3_tag !== undefined) cols.h3_tag = payload.h3_tag;
  if (payload.h4_tag !== undefined) cols.h4_tag = payload.h4_tag;
  if (payload.h5_tag !== undefined) cols.h5_tag = payload.h5_tag;
  if (payload.h6_tag !== undefined) cols.h6_tag = payload.h6_tag;
  if (payload.og_title !== undefined) cols.og_title = payload.og_title;
  if (payload.og_url !== undefined) cols.og_url = payload.og_url;
  if (payload.og_description !== undefined) cols.og_description = payload.og_description;
  if (payload.og_image !== undefined) cols.og_image = toLegacyAssetPath(payload.og_image);
  if (payload.youtube_video_link !== undefined) cols.youtube_video_link = payload.youtube_video_link;
  if (payload.content !== undefined) cols.description = payload.content;
  if (payload.status !== undefined) cols.status = payload.status;
  return cols;
}

/** Fetch one blog (any status) by id, mapped to the frontend shape. */
export async function getBlogByIdAdmin(id: number): Promise<CIBlog | null> {
  const [rows] = await dbPool.query(`${BLOG_SELECT} WHERE b.id = ? LIMIT 1`, [id]);
  const list = rows as RawBlogRow[];
  return list.length > 0 ? mapBlogRow(list[0]) : null;
}

/** INSERT a new article into ci_blog. Returns the created row. */
export async function createBlog(payload: Partial<CIBlog>, adminId: number): Promise<CIBlog> {
  const cols = toBlogColumns(payload);
  // NOT NULL varchar columns need explicit empty-string defaults
  const defaults: Record<string, string | number> = {
    title: '', cat_id: 0, sub_cat_id: 0, type: 0, tag_id: '', image: '', alt_tag: '',
    video_type: '', video_name: '', youtube_video_link: '', amazon_webserver_video_link: '',
    url: '', meta_title: '', meta_keyword: '', meta_description: '',
    h2_tag: '', h3_tag: '', h4_tag: '', h5_tag: '', h6_tag: '',
    og_title: '', og_url: '', og_description: '', og_image: '', description: '', status: 1,
  };
  const row = { ...defaults, ...cols, user_created_by: adminId, created_at: legacyNow() };
  const names = Object.keys(row);
  const [result] = await dbPool.query(
    `INSERT INTO ci_blog (${names.map((n) => `\`${n}\``).join(',')}) VALUES (${names.map(() => '?').join(',')})`,
    names.map((n) => row[n as keyof typeof row])
  );
  const created = await getBlogByIdAdmin((result as any).insertId);
  if (!created) throw new Error('Insert succeeded but row not found');
  return created;
}

/** UPDATE an existing ci_blog row (only provided fields). */
export async function updateBlog(id: number, payload: Partial<CIBlog>): Promise<CIBlog | null> {
  const cols = toBlogColumns(payload);
  const names = Object.keys(cols);
  if (names.length > 0) {
    await dbPool.query(
      `UPDATE ci_blog SET ${names.map((n) => `\`${n}\` = ?`).join(', ')} WHERE id = ?`,
      [...names.map((n) => cols[n]), id]
    );
  }
  return getBlogByIdAdmin(id);
}

/** DELETE a ci_blog row. */
export async function deleteBlog(id: number): Promise<boolean> {
  const [result] = await dbPool.query(`DELETE FROM ci_blog WHERE id = ?`, [id]);
  return (result as any).affectedRows > 0;
}

/** Bulk activate / deactivate / delete. */
export async function bulkBlogAction(ids: number[], action: 'activate' | 'deactivate' | 'delete'): Promise<number> {
  if (ids.length === 0) return 0;
  const placeholders = ids.map(() => '?').join(',');
  if (action === 'delete') {
    const [r] = await dbPool.query(`DELETE FROM ci_blog WHERE id IN (${placeholders})`, ids);
    return (r as any).affectedRows;
  }
  const status = action === 'activate' ? 1 : 0;
  const [r] = await dbPool.query(`UPDATE ci_blog SET status = ? WHERE id IN (${placeholders})`, [status, ...ids]);
  return (r as any).affectedRows;
}

/** Admin list: all statuses (drafts included). */
export async function getAllBlogsAdmin(limit = 500): Promise<CIBlog[]> {
  try {
    const [rows] = await dbPool.query(
      `${BLOG_SELECT} ORDER BY b.created_at DESC, b.id DESC LIMIT ?`,
      [limit]
    );
    return (rows as RawBlogRow[]).map((row, i) => mapBlogRow(row, i));
  } catch (err) {
    handleDbError('getAllBlogsAdmin', err);
    return [];
  }
}

interface RawAdRow {
  id: number;
  advertisement_title: string;
  advertisement_url: string;
  advertisement_image: string;
  alt_tag: string;
  priority: number;
  position: string;
  status: number;
  created_at: string;
}

/** Fetch active promotional ads from ci_advertisement, most prominent first. */
export async function getActiveAds(): Promise<CIAdvertisement[]> {
  try {
    const query = `
      SELECT id, advertisement_title, advertisement_url, advertisement_image,
             alt_tag, priority, position, status, created_at
      FROM ci_advertisement
      WHERE status = 1
      ORDER BY priority ASC, id DESC
    `;
    const [rows] = await dbPool.query(query);
    return (rows as RawAdRow[]).map((row) => ({
      id: row.id,
      title: row.advertisement_title,
      advertisement_image: assetUrl(row.advertisement_image),
      alt_tag: row.alt_tag || row.advertisement_title,
      url: row.advertisement_url,
      position: row.position,
      priority: row.priority,
      status: row.status,
      click_count: 0,
      impressions: 0,
      created_at: row.created_at || '',
    }));
  } catch (err) {
    handleDbError('getActiveAds', err);
    return [];
  }
}
