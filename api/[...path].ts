/**
 * Vercel serverless catch-all for /api/* — replaces the Express server in
 * production. Public reads hit the live MySQL database via src/lib/db.ts
 * (strictly read-only); admin-panel collections return static demo data.
 */
import { getPublishedBlogs, getBlogByUrlSlug, getAllCategories, getActiveAds, getActiveTags } from '../src/lib/db.js';
import { resolveCategoryIds } from '../src/lib/taxonomy.js';
import { CIBlog, CICategory, CIAdvertisement, CITag } from '../src/types.js';
import { siteSetting } from '../src/data/siteConfig.js';
// Real-data snapshot exported from the production jaipurwe_fsianews dump —
// served whenever the live MySQL host is unreachable (regenerate with
// `npx tsx scripts/export-snapshot.ts`). Loaded via createRequire: the
// Vercel Node ESM runtime rejects bare JSON imports without attributes.
import { createRequire } from 'module';
const requireJson = createRequire(import.meta.url);
const snapshot = requireJson('../src/data/snapshot.json');

const snapBlogs = snapshot.blogs as unknown as CIBlog[];
const snapCategories = snapshot.categories as unknown as CICategory[];
const snapAds = snapshot.ads as unknown as CIAdvertisement[];
const snapTags = (snapshot.tags || []) as unknown as CITag[];

function snapshotBlogsByCategory(slug?: string): CIBlog[] {
  if (!slug || slug === 'all') return snapBlogs;
  const ids = resolveCategoryIds(
    slug,
    snapCategories.map((c) => ({ id: c.id, parent_id: c.parent_id, slug: c.slug }))
  );
  return snapBlogs.filter(
    (b) => ids.has(b.category_id) || (b.sub_category_id != null && ids.has(b.sub_category_id))
  );
}

export default async function handler(req: any, res: any) {
  const url = new URL(req.url, `https://${req.headers.host || 'localhost'}`);
  const segments = url.pathname.replace(/^\/api\/?/, '').split('/').filter(Boolean);
  const route = segments.join('/');

  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');

  try {
    if (route === 'health') {
      return res.json({ status: 'ok', framework: 'Vercel Serverless + Headless CodeIgniter Bridge' });
    }

    if (route === 'blogs') {
      const categorySlug = url.searchParams.get('category_slug') || undefined;
      const limit = parseInt(url.searchParams.get('limit') || '200', 10);
      let result = await getPublishedBlogs(limit, categorySlug);
      // Real-data snapshot fallback while the live database is not connected
      if (result.length === 0) result = snapshotBlogsByCategory(categorySlug).slice(0, limit);

      const search = url.searchParams.get('search');
      if (search) {
        const q = search.toLowerCase();
        result = result.filter(
          (b) =>
            b.title.toLowerCase().includes(q) ||
            b.short_content.toLowerCase().includes(q) ||
            b.url.toLowerCase().includes(q)
        );
      }
      const categoryId = url.searchParams.get('category_id');
      if (categoryId) {
        const catId = parseInt(categoryId, 10);
        result = result.filter((b) => b.category_id === catId || b.sub_category_id === catId);
      }
      return res.json(result);
    }

    if (segments[0] === 'blogs' && segments[1] === 'slug' && segments[2]) {
      const slug = decodeURIComponent(segments[2]).trim();
      const article = (await getBlogByUrlSlug(slug)) || snapBlogs.find((b) => b.url === slug) || null;
      if (!article) {
        return res.status(404).json({ error: 'Article not found matching legacy url path' });
      }
      return res.json(article);
    }

    if (route === 'categories') {
      const cats = await getAllCategories();
      return res.json(cats.length > 0 ? cats : snapCategories);
    }

    if (route === 'tags') {
      const tags = await getActiveTags();
      return res.json(tags.length > 0 ? tags : snapTags);
    }
    if (route === 'advertisements') {
      const realAds = await getActiveAds();
      return res.json(realAds.length > 0 ? realAds : snapAds);
    }

    // Admin-only collections — no demo data; real values come from the live
    // DB once admin write support exists (out of scope, read-only mapping)
    if (route === 'activity-logs') return res.json([]);
    if (route === 'users') return res.json([]);
    if (route === 'image-library') return res.json([]);
    if (route === 'settings') return res.json(siteSetting);

    if (route === 'subscribers') {
      if (req.method === 'POST') {
        const email = (req.body && req.body.email) || '';
        if (!email.includes('@')) return res.status(400).json({ error: 'Invalid email address' });
        return res.status(201).json({
          message: 'Subscribed successfully',
          subscriber: { id: 0, email, status: 'subscribed', subscribed_at: new Date().toISOString() },
        });
      }
      return res.json([]);
    }

    return res.status(404).json({ error: `Unknown API route: ${route}` });
  } catch (err: any) {
    console.error(`API /${route} failed:`, err?.message || err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
