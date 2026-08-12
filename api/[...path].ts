/**
 * Vercel serverless catch-all for /api/* — replaces the Express server in
 * production. Public reads hit the live MySQL database via src/lib/db.ts
 * (strictly read-only); admin-panel collections return static demo data.
 */
import { getPublishedBlogs, getBlogByUrlSlug, getAllCategories, getActiveAds } from '../src/lib/db.js';
import {
  initialBlogs,
  initialCategories,
  initialTags,
  initialAdvertisements,
  initialActivityLogs,
  initialUsers,
  initialSubscribers,
  initialImages,
  initialSetting,
} from '../src/data/mockData.js';

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
      // Dummy-content fallback while the live database is not connected
      if (result.length === 0 && !categorySlug) result = initialBlogs;

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
      const article = await getBlogByUrlSlug(decodeURIComponent(segments[2]));
      if (!article) {
        return res.status(404).json({ error: 'Article not found matching legacy url path' });
      }
      return res.json(article);
    }

    if (route === 'categories') {
      const cats = await getAllCategories();
      return res.json(cats.length > 0 ? cats : initialCategories);
    }

    // Static collections — admin demo data, no DB writes ever
    if (route === 'tags') return res.json(initialTags);
    if (route === 'advertisements') {
      const realAds = await getActiveAds();
      return res.json(realAds.length > 0 ? realAds : initialAdvertisements);
    }
    if (route === 'activity-logs') return res.json(initialActivityLogs);
    if (route === 'users') return res.json(initialUsers);
    if (route === 'image-library') return res.json(initialImages);
    if (route === 'settings') return res.json(initialSetting);

    if (route === 'subscribers') {
      if (req.method === 'POST') {
        const email = (req.body && req.body.email) || '';
        if (!email.includes('@')) return res.status(400).json({ error: 'Invalid email address' });
        return res.status(201).json({
          message: 'Subscribed successfully',
          subscriber: { id: 0, email, status: 'subscribed', subscribed_at: new Date().toISOString() },
        });
      }
      return res.json(initialSubscribers);
    }

    return res.status(404).json({ error: `Unknown API route: ${route}` });
  } catch (err: any) {
    console.error(`API /${route} failed:`, err?.message || err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
