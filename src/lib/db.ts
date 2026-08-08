/**
 * MySQL Database Helper for jaipurwe_fsianews (ci_blog and ci_category)
 * Provides query definitions and type interfaces for CodeIgniter database connection.
 */

export interface DBBlogRow {
  id: number;
  title: string;
  url: string;
  short_content: string;
  content: string;
  category_id: number;
  category_name?: string;
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

/**
 * SQL Query template string for fetching published blogs
 */
export const FETCH_PUBLISHED_BLOGS_SQL = `
  SELECT b.*, c.category_name 
  FROM ci_blog b 
  LEFT JOIN ci_category c ON b.category_id = c.id 
  WHERE b.status = 1 
  ORDER BY b.created_at DESC 
  LIMIT ?
`;

/**
 * SQL Query template string for fetching article by legacy URL slug
 */
export const FETCH_BLOG_BY_SLUG_SQL = `
  SELECT b.*, c.category_name 
  FROM ci_blog b 
  LEFT JOIN ci_category c ON b.category_id = c.id 
  WHERE b.url = ? AND b.status = 1 
  LIMIT 1
`;

/**
 * SQL Query template string for active categories
 */
export const FETCH_ACTIVE_CATEGORIES_SQL = `
  SELECT * FROM ci_category WHERE status = 1 ORDER BY id ASC
`;
