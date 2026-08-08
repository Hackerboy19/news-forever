import mysql from 'mysql2/promise';
import { initialBlogs, initialCategories } from '../data/mockData';

/**
 * MySQL Database Pool Connection for jaipurwe_fsianews
 * Configured using standard environment variables with zero schema alteration.
 */
export const dbPool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'jaipurwe_fsianews',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'jaipurwe_fsianews',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export interface DBBlogRow {
  id: number;
  title: string;
  url: string;
  short_content: string;
  content: string;
  category_id: number;
  category_name?: string;
  tag_ids?: number[];
  image: string;
  alt_tag: string;
  status: number;
  is_featured: number;
  is_trending: number;
  author_id: number;
  author_name?: string;
  views: number;
  meta_title: string;
  meta_description: string;
  meta_keyword: string;
  og_title: string;
  og_url: string;
  og_description: string;
  og_image: string;
  h2_tag?: string;
  h3_tag?: string;
  h4_tag?: string;
  h5_tag?: string;
  h6_tag?: string;
  created_at: string;
  updated_at: string;
}

export interface DBCategoryRow {
  id: number;
  category_name: string;
  slug: string;
  status: number;
  meta_title: string;
  meta_description: string;
  created_at: string;
}

let isDbOfflineLogged = false;

function handleDbError(context: string, err: any) {
  if (err?.code === 'ECONNREFUSED' || err?.code === 'ETIMEDOUT' || err?.code === 'ENOTFOUND') {
    if (!isDbOfflineLogged) {
      console.info(`[MySQL Data Provider] Connection at ${process.env.MYSQL_HOST || 'localhost'} currently unavailable (${err.code}). Using hydrated application state.`);
      isDbOfflineLogged = true;
    }
  } else {
    console.warn(`[MySQL Data Provider] ${context}:`, err?.message || err);
  }
}

/**
 * Fetch published blogs directly from ci_blog table in jaipurwe_fsianews MySQL database
 */
export async function getPublishedBlogs(limit = 20, categorySlug?: string): Promise<DBBlogRow[]> {
  try {
    let query = `
      SELECT b.*, c.category_name 
      FROM ci_blog b 
      LEFT JOIN ci_category c ON b.category_id = c.id 
      WHERE b.status = 1 
    `;
    const params: any[] = [];

    if (categorySlug) {
      query += ` AND c.slug = ? `;
      params.push(categorySlug);
    }

    query += ` ORDER BY b.created_at DESC LIMIT ? `;
    params.push(limit);

    const [rows] = await dbPool.query(query, params);
    if (Array.isArray(rows) && rows.length > 0) {
      return rows as DBBlogRow[];
    }
  } catch (err) {
    handleDbError('getPublishedBlogs', err);
  }
  
  // Fallback to initial hydration state if MySQL host is uninitialized locally
  return initialBlogs as any[];
}

/**
 * Fetch article by exact URL slug matching ci_blog.url column
 */
export async function getBlogByUrlSlug(urlSlug: string): Promise<DBBlogRow | null> {
  try {
    const query = `
      SELECT b.*, c.category_name 
      FROM ci_blog b 
      LEFT JOIN ci_category c ON b.category_id = c.id 
      WHERE b.url = ? AND b.status = 1 
      LIMIT 1
    `;
    const [rows] = await dbPool.query<any[]>(query, [urlSlug]);
    if (rows && rows.length > 0) {
      return rows[0] as DBBlogRow;
    }
  } catch (err) {
    handleDbError('getBlogByUrlSlug', err);
  }

  const found = initialBlogs.find(b => b.url === urlSlug);
  return found ? (found as any) : null;
}

/**
 * Fetch active categories from ci_category table
 */
export async function getActiveCategories(): Promise<DBCategoryRow[]> {
  try {
    const query = `SELECT * FROM ci_category WHERE status = 1 ORDER BY id ASC`;
    const [rows] = await dbPool.query(query);
    if (Array.isArray(rows) && rows.length > 0) {
      return rows as DBCategoryRow[];
    }
  } catch (err) {
    handleDbError('getActiveCategories', err);
  }

  return initialCategories as any[];
}
