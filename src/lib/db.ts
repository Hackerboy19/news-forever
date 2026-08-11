import mysql from 'mysql2/promise';
import { CIBlog, CICategory } from '../types.js';
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
function mapBlogRow(row: RawBlogRow, index = 0): CIBlog {
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
  SELECT b.id, b.user_created_by, b.title, b.cat_id, b.sub_cat_id, b.type, b.tag_id,
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
