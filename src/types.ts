/**
 * Database Schema Definitions strictly mapping to legacy MySQL CodeIgniter database
 */

export interface CIBlog {
  id: number;
  title: string;
  url: string; // Exact slug column from ci_blog table
  short_content: string;
  content: string;
  category_id: number; // ci_blog.cat_id
  sub_category_id?: number; // ci_blog.sub_cat_id
  category_name?: string; // joined
  tag_ids: number[];
  image: string; // Path: e.g. assets/img/blog/2026/08/article-1.jpg
  alt_tag: string;
  status: number; // 1 = Active, 0 = Inactive/Draft
  is_featured: boolean;
  is_trending: boolean;
  author_id: number;
  author_name?: string;
  views: number;
  created_at: string;
  updated_at: string;

  // SEO & OpenGraph Fields
  meta_title: string;
  meta_description: string;
  meta_keyword: string;
  og_title: string;
  og_url: string;
  og_description: string;
  og_image: string;

  // Video Fields (legacy ci_blog)
  youtube_video_link?: string;

  // DOM Heading Hierarchy Fields
  h2_tag?: string;
  h3_tag?: string;
  h4_tag?: string;
  h5_tag?: string;
  h6_tag?: string;
}

export interface CICategory {
  id: number;
  parent_id?: number; // ci_category.parent_id (0 = top level)
  category_name: string; // ci_category.cat_name
  slug: string; // ci_category.url
  status: number; // 1 = Active, 0 = Inactive
  article_count?: number;
  meta_title: string;
  meta_description: string;
  created_at: string;
}

export interface CITag {
  id: number;
  tag_name: string;
  slug: string;
  created_at: string;
}

export interface CIAdvertisement {
  id: number;
  title: string; // ci_advertisement.advertisement_title
  advertisement_image: string; // ci_advertisement.advertisement_image
  alt_tag: string;
  url: string; // ci_advertisement.advertisement_url (promotional backlink)
  // Real ci_advertisement uses 'blog' | 'left' | 'right'; legacy demo data
  // uses the older zone names — components accept both.
  position: 'blog' | 'left' | 'right' | 'top_banner' | 'sidebar_sticky' | 'in_content' | 'footer_banner' | string;
  priority?: number; // ci_advertisement.priority (lower = more prominent)
  status: number; // 1 = Active, 0 = Inactive
  click_count: number;
  impressions: number;
  created_at: string;
}

export interface CIActivityLog {
  id: number;
  user_id: number;
  user_name: string;
  activity: string;
  module: string; // 'Blog', 'Category', 'Tag', 'Advertisement', 'Setting', 'Users'
  ip_address: string;
  created_at: string;
}

export interface CIUser {
  id: number;
  username: string;
  email: string;
  role: 'Super Admin' | 'Senior Editor' | 'SEO Specialist' | 'Contributor';
  avatar: string;
  status: number;
  last_login: string;
}

export interface CISubscriber {
  id: number;
  email: string;
  status: 'subscribed' | 'unsubscribed';
  subscribed_at: string;
}

export interface CIImageLibrary {
  id: number;
  file_name: string;
  file_path: string;
  file_size: string;
  alt_tag: string;
  uploaded_by: string;
  created_at: string;
}

export interface CISetting {
  id: number;
  site_title: string;
  site_logo: string;
  favicon: string;
  meta_default_title: string;
  meta_default_description: string;
  meta_default_keywords: string;
  facebook_url: string;
  twitter_url: string;
  instagram_url: string;
  youtube_url: string;
  updated_at: string;
}

export type ViewMode = 'public' | 'admin';
