/**
 * Vercel serverless catch-all for /api/* — replaces the Express server in
 * production. Public reads hit the live MySQL database via src/lib/db.ts
 * (strictly read-only); admin-panel collections return static demo data.
 */
import {
  getPublishedBlogs,
  getBlogByUrlSlug,
  getAllCategories,
  getActiveAds,
  getActiveTags,
  verifyAdmin,
  createBlog,
  updateBlog,
  deleteBlog,
  bulkBlogAction,
  getAllBlogsAdmin,
} from '../src/lib/db.js';
import { resolveCategoryIds } from '../src/lib/taxonomy.js';
import { translateArticle, translateTitles } from '../src/lib/translate.js';
import {
  bridgeConfigured,
  bridgeChangePassword,
  bridgeVerifyAdmin,
  bridgeListBlogs,
  bridgeCreateBlog,
  bridgeUpdateBlog,
  bridgeDeleteBlog,
  bridgeBulkBlogs,
} from '../src/lib/bridge.js';
import { answerQuestion } from '../src/lib/qa.js';
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

/** Read the JSON request body (Vercel may or may not have pre-parsed it). */
async function readBody(req: any): Promise<any> {
  if (req.body !== undefined) {
    return typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body;
  }
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? JSON.parse(raw) : {};
}

/** Credentials from request headers (verified per request). */
function reqCreds(req: any): { username: string; password: string } {
  return {
    username: String(req.headers['x-admin-user'] || ''),
    password: String(req.headers['x-admin-pass'] || ''),
  };
}

/** Authenticate against ci_admin: direct MySQL first, then the PHP bridge. */
async function requireAdmin(req: any) {
  const { username, password } = reqCreds(req);
  const direct = await verifyAdmin(username, password);
  if (direct) return direct;
  if (bridgeConfigured()) return bridgeVerifyAdmin({ username, password });
  return null;
}

export default async function handler(req: any, res: any) {
  const url = new URL(req.url, `https://${req.headers.host || 'localhost'}`);
  const segments = url.pathname.replace(/^\/api\/?/, '').split('/').filter(Boolean);
  const route = segments.join('/');
  const method = (req.method || 'GET').toUpperCase();

  if (method === 'GET') {
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
  } else {
    res.setHeader('Cache-Control', 'no-store');
  }

  try {
    if (route === 'health') {
      let db = 'not_configured';
      try {
        const { dbPool } = await import('../src/lib/db.js');
        await dbPool.query('SELECT 1');
        db = 'connected';
      } catch (err: any) {
        db = `error: ${err?.code || err?.message || 'unknown'}`;
      }
      return res.json({ status: 'ok', db, host: process.env.MYSQL_HOST || null });
    }

    // ---- Admin authentication & real ci_blog writes ----

    if (route === 'admin/login' && method === 'POST') {
      const { username, password } = await readBody(req);
      const u = String(username || '');
      const p = String(password || '');
      let admin = await verifyAdmin(u, p);
      if (!admin && bridgeConfigured()) admin = await bridgeVerifyAdmin({ username: u, password: p });
      if (!admin) return res.status(401).json({ error: 'Invalid credentials or database unreachable' });
      return res.json(admin);
    }

    const DB_WRITE_UNAVAILABLE =
      'Live database is unreachable from Vercel, so writes are disabled here. Publish from the local panel (or the legacy cPanel admin) — the site content on Vercel updates via the data snapshot.';

    if (route === 'blogs' && method === 'POST') {
      const admin = await requireAdmin(req);
      if (!admin) return res.status(401).json({ error: 'Unauthorized' });
      const payload = await readBody(req);
      try {
        const created = await createBlog(payload, admin.admin_id);
        return res.status(201).json(created);
      } catch {
        if (bridgeConfigured()) {
          try {
            return res.status(201).json(await bridgeCreateBlog(reqCreds(req), payload));
          } catch (e: any) {
            return res.status(503).json({ error: `Bridge write failed: ${e?.message}` });
          }
        }
        return res.status(503).json({ error: DB_WRITE_UNAVAILABLE });
      }
    }

    if (route === 'blogs/bulk-action' && method === 'POST') {
      const admin = await requireAdmin(req);
      if (!admin) return res.status(401).json({ error: 'Unauthorized' });
      const { ids, action } = await readBody(req);
      if (!Array.isArray(ids) || !['activate', 'deactivate', 'delete'].includes(action)) {
        return res.status(400).json({ error: 'Invalid bulk action payload' });
      }
      try {
        const affected = await bulkBlogAction(ids.map(Number), action);
        return res.json({ success: true, affected, ids, action });
      } catch {
        if (bridgeConfigured()) {
          try {
            const affected = await bridgeBulkBlogs(reqCreds(req), ids.map(Number), action);
            return res.json({ success: true, affected, ids, action });
          } catch (e: any) {
            return res.status(503).json({ error: `Bridge write failed: ${e?.message}` });
          }
        }
        return res.status(503).json({ error: DB_WRITE_UNAVAILABLE });
      }
    }

    if (segments[0] === 'blogs' && segments.length === 2 && /^\d+$/.test(segments[1]) && (method === 'PUT' || method === 'DELETE')) {
      const admin = await requireAdmin(req);
      if (!admin) return res.status(401).json({ error: 'Unauthorized' });
      const id = parseInt(segments[1], 10);
      const payload = method === 'PUT' ? await readBody(req) : null;
      try {
        if (method === 'DELETE') {
          const ok = await deleteBlog(id);
          return ok ? res.json({ success: true, id }) : res.status(404).json({ error: 'Blog not found' });
        }
        const updated = await updateBlog(id, payload);
        return updated ? res.json(updated) : res.status(404).json({ error: 'Blog not found' });
      } catch {
        if (bridgeConfigured()) {
          try {
            if (method === 'DELETE') {
              const ok = await bridgeDeleteBlog(reqCreds(req), id);
              return ok ? res.json({ success: true, id }) : res.status(404).json({ error: 'Blog not found' });
            }
            return res.json(await bridgeUpdateBlog(reqCreds(req), id, payload));
          } catch (e: any) {
            return res.status(503).json({ error: `Bridge write failed: ${e?.message}` });
          }
        }
        return res.status(503).json({ error: DB_WRITE_UNAVAILABLE });
      }
    }

    // ---- Admin password change (legacy plaintext scheme preserved) ----
    if (route === 'admin/change-password' && method === 'POST') {
      const { username, password } = reqCreds(req);
      const { new_password } = await readBody(req);
      if (!new_password || String(new_password).length < 6) {
        return res.status(400).json({ error: 'New password must be at least 6 characters' });
      }
      const { changeAdminPassword } = await import('../src/lib/db.js');
      try {
        const ok = await changeAdminPassword(username, password, String(new_password));
        if (ok) return res.json({ success: true });
      } catch {
        /* fall through to bridge */
      }
      if (bridgeConfigured()) {
        try {
          const ok = await bridgeChangePassword({ username, password }, String(new_password));
          if (ok) return res.json({ success: true });
        } catch (e: any) {
          return res.status(503).json({ error: e?.message || 'Bridge unavailable' });
        }
      }
      return res.status(401).json({ error: 'Current password incorrect or database unreachable' });
    }

    // ---- Hindi translation (server-side, cached) ----
    if (route === 'translate') {
      const slug = (url.searchParams.get('slug') || '').trim();
      if (!slug) return res.status(400).json({ error: 'slug required' });
      const article = (await getBlogByUrlSlug(slug)) || snapBlogs.find((b) => b.url === slug) || null;
      if (!article) return res.status(404).json({ error: 'Article not found' });
      const out = await translateArticle(article);
      // Long edge cache: translation is deterministic per article
      res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=604800');
      return res.json(out);
    }

    // ---- Batch blog-title translation for feeds/ticker ----
    if (route === 'translate-titles' && method === 'POST') {
      const { titles } = await readBody(req);
      if (!Array.isArray(titles) || titles.length === 0) {
        return res.status(400).json({ error: 'titles array required' });
      }
      const translations = await translateTitles(titles.map(String));
      return res.json({ translations });
    }

    // ---- Interactive article Q&A ----
    if (route === 'ask' && method === 'POST') {
      const { slug, question } = await readBody(req);
      if (!slug || !question || String(question).length > 300) {
        return res.status(400).json({ error: 'slug and question (max 300 chars) required' });
      }
      const article = (await getBlogByUrlSlug(String(slug).trim())) || snapBlogs.find((b) => b.url === String(slug).trim()) || null;
      if (!article) return res.status(404).json({ error: 'Article not found' });
      const result = await answerQuestion(String(question), article.content, article.short_content);
      return res.json(result);
    }

    // ---- Public reads ----

    if (route === 'blogs') {
      const categorySlug = url.searchParams.get('category_slug') || undefined;
      const limit = parseInt(url.searchParams.get('limit') || '200', 10);

      // Admin list (drafts included) — requires valid ci_admin credentials;
      // snapshot fallback keeps the panel browsable when the DB is offline
      if (url.searchParams.get('status') === 'all') {
        const admin = await requireAdmin(req);
        if (!admin) return res.status(401).json({ error: 'Unauthorized' });
        res.setHeader('Cache-Control', 'no-store');
        let adminBlogs = await getAllBlogsAdmin(limit);
        if (adminBlogs.length === 0 && bridgeConfigured()) {
          try {
            adminBlogs = await bridgeListBlogs(reqCreds(req), limit);
          } catch {
            /* fall through to snapshot */
          }
        }
        return res.json(adminBlogs.length > 0 ? adminBlogs : snapBlogs.slice(0, limit));
      }

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
