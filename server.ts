import "dotenv/config";
import express from "express";
import path from "path";
import { siteSetting } from "./src/data/siteConfig";
import { translateArticle, translateTitles } from "./src/lib/translate";
import { bridgeConfigured, bridgeUploadImage } from "./src/lib/bridge";
import { answerQuestion } from "./src/lib/qa";
import { CIBlog, CICategory, CIAdvertisement, CIActivityLog, CISetting, CISubscriber, CIImageLibrary } from "./src/types";
import {
  changeAdminPassword,
  getSiteConfig,
  saveSiteConfig,
  getStaticPage,
  saveStaticPage,
  getAllStaticPages,
  deleteStaticPage,
  createTag,
  updateTag,
  deleteTag,
  deleteSubscriber,
  deleteSubscribersBulk,
  deleteImage,
  createAdminUser,
  updateAdminUser,
  deleteAdminUser,
  createSubAdmin,
  updateSubAdmin,
  deleteSubAdmin,
  getImageLibrary,
  getSubscribers,
  getAdminUsers,
  getSubAdmins,
  getActivityLogs,
  createAd,
  updateAd,
  deleteAd,
  createCategory,
  updateCategory,
  deleteCategory,
  getPublishedBlogs,
  getBlogByUrlSlug,
  incrementBlogViews,
  incrementAdClick,
  getAllCategories,
  getActiveAds,
  getActiveTags,
  verifyAdmin,
  createBlog,
  updateBlog,
  deleteBlog,
  bulkBlogAction,
  getAllBlogsAdmin,
  getBlogByIdAdmin,
} from "./src/lib/db";

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || "3000", 10);

  app.use(express.json({ limit: "15mb" })); // large enough for base64 image uploads (logo/cover/OG)

  // In-memory stores for admin demo mutations only (real reads hit MySQL;
  // DB access is strictly read-only — admin writes never touch ci_* tables)
  let dbBlogs: CIBlog[] = [];
  let dbCategories: CICategory[] = [];
  let dbAds: CIAdvertisement[] = [];
  let dbActivityLogs: CIActivityLog[] = [];
  let dbUsers: any[] = [];
  let dbSubscribers: CISubscriber[] = [];
  let dbImages: CIImageLibrary[] = [];
  let dbSetting: CISetting = { ...siteSetting };

  // Helper log activity
  const logActivity = (userName: string, userId: number, activity: string, moduleName: string) => {
    const newLog: CIActivityLog = {
      id: Date.now(),
      user_id: userId,
      user_name: userName,
      activity,
      module: moduleName,
      ip_address: "127.0.0.1",
      created_at: new Date().toISOString().replace("T", " ").substring(0, 19),
    };
    dbActivityLogs.unshift(newLog);
  };

  // --- API ROUTES ---

  // Authenticate write requests against the real ci_admin table
  const requireAdmin = async (req: express.Request) =>
    verifyAdmin(String(req.headers["x-admin-user"] || ""), String(req.headers["x-admin-pass"] || ""));

  // POST /api/admin/login
  app.post("/api/admin/login", async (req, res) => {
    const { username, password } = req.body || {};
    const admin = await verifyAdmin(String(username || ""), String(password || ""));
    if (!admin) return res.status(401).json({ error: "Invalid credentials or database unreachable" });
    res.json(admin);
  });

  // POST /api/admin/change-password
  app.post("/api/admin/change-password", async (req, res) => {
    const username = String(req.headers["x-admin-user"] || "");
    const password = String(req.headers["x-admin-pass"] || "");
    const { new_password } = req.body || {};
    if (!new_password || String(new_password).length < 6) {
      return res.status(400).json({ error: "New password must be at least 6 characters" });
    }
    const ok = await changeAdminPassword(username, password, String(new_password));
    if (!ok) return res.status(401).json({ error: "Current password incorrect" });
    res.json({ success: true });
  });

  // GET /api/translate?slug= — server-side Hindi translation (cached)
  app.get("/api/translate", async (req, res) => {
    const slug = String(req.query.slug || "").trim();
    if (!slug) return res.status(400).json({ error: "slug required" });
    const article = await getBlogByUrlSlug(slug);
    if (!article) return res.status(404).json({ error: "Article not found" });
    res.json(await translateArticle(article));
  });

  // POST /api/translate-titles — batch title translation for feeds
  app.post("/api/translate-titles", async (req, res) => {
    const { titles } = req.body || {};
    if (!Array.isArray(titles) || titles.length === 0) {
      return res.status(400).json({ error: "titles array required" });
    }
    res.json({ translations: await translateTitles(titles.map(String)) });
  });

  // POST /api/ask — interactive article Q&A
  app.post("/api/ask", async (req, res) => {
    const { slug, question } = req.body || {};
    if (!slug || !question || String(question).length > 300) {
      return res.status(400).json({ error: "slug and question (max 300 chars) required" });
    }
    const article = await getBlogByUrlSlug(String(slug).trim());
    if (!article) return res.status(404).json({ error: "Article not found" });
    res.json(await answerQuestion(String(question), article.content, article.short_content));
  });

  // GET/PUT /api/site-config — theme + navigation configuration
  app.get("/api/site-config", async (_req, res) => {
    res.json(await getSiteConfig());
  });
  app.put("/api/site-config", async (req, res) => {
    const admin = await requireAdmin(req);
    if (!admin) return res.status(401).json({ error: "Unauthorized" });
    try {
      res.json(await saveSiteConfig(req.body || {}));
    } catch (err: any) {
      res.status(500).json({ error: "Config save failed: " + err?.message });
    }
  });

  // Health check
  // Static pages — public read, admin write. Admin can create ANY page.
  const DEFAULT_PAGES = ["about-us", "contact-us"];
  const RESERVED_SLUGS = new Set(["admin", "category", "tag", "api", "assets", "uploads", "news", "latest-news", "sitemap.xml", "robots.txt", "rss.xml", "feed.rss", "report.html", "favicon.ico"]);
  const normSlug = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "");
  let pageSlugCache = { set: new Set<string>(DEFAULT_PAGES), at: 0 };
  const getPageSlugSet = async () => {
    if (pageSlugCache.set.size && Date.now() - pageSlugCache.at < 60 * 1000) return pageSlugCache.set;
    const list = await getAllStaticPages();
    const set = new Set<string>(DEFAULT_PAGES);
    list.forEach((p) => set.add(p.slug.toLowerCase()));
    pageSlugCache = { set, at: Date.now() };
    return set;
  };

  // List all pages (defaults + admin-created), for client routing & admin UI.
  app.get("/api/pages", async (_req, res) => {
    const list = await getAllStaticPages();
    const bySlug = new Map(list.map((p) => [p.slug.toLowerCase(), p]));
    for (const d of DEFAULT_PAGES) if (!bySlug.has(d)) bySlug.set(d, { slug: d, title: d === "about-us" ? "About Us" : "Contact Us" });
    res.json([...bySlug.values()]);
  });
  app.get("/api/pages/:slug", async (req, res) => {
    res.json(await getStaticPage(normSlug(String(req.params.slug))));
  });
  app.put("/api/pages/:slug", async (req, res) => {
    const admin = await requireAdmin(req);
    if (!admin) return res.status(401).json({ error: "Unauthorized" });
    const slug = normSlug(String(req.params.slug));
    if (!slug || RESERVED_SLUGS.has(slug)) return res.status(400).json({ error: "Invalid or reserved page name" });
    try {
      const saved = await saveStaticPage(slug, req.body || {});
      pageSlugCache.at = 0; // refresh routing set
      logActivity(admin.name, admin.admin_id, `Updated page "${slug}"`, "Pages");
      res.json(saved);
    } catch (err: any) {
      res.status(500).json({ error: "Page save failed: " + err?.message });
    }
  });
  app.delete("/api/pages/:slug", async (req, res) => {
    const admin = await requireAdmin(req);
    if (!admin) return res.status(401).json({ error: "Unauthorized" });
    const slug = normSlug(String(req.params.slug));
    const ok = await deleteStaticPage(slug);
    pageSlugCache.at = 0;
    logActivity(admin.name, admin.admin_id, `Deleted page "${slug}"`, "Pages");
    res.json({ success: ok });
  });

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", framework: "Express + React Headless CodeIgniter Bridge" });
  });

  // GET /api/blogs — real ci_blog rows, optional ?category_slug= & filters
  app.get("/api/blogs", async (req, res) => {
    try {
      const categorySlug = req.query.category_slug as string | undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 200;

      // Admin list (drafts included) — requires valid ci_admin credentials.
      // No 200 cap: admin must see EVERY article so category filter counts
      // match the category tab's full-DB totals.
      if (req.query.status === "all") {
        const admin = await requireAdmin(req);
        if (!admin) return res.status(401).json({ error: "Unauthorized" });
        return res.json(await getAllBlogsAdmin(req.query.limit ? limit : 100000));
      }

      // Tag page: every published article carrying this tag (resolves ALL
      // duplicate-slug tag ids, and is not capped by the 200 list limit).
      if (req.query.tag_slug) {
        const tslug = String(req.query.tag_slug).toLowerCase();
        const allTags = await getActiveTags();
        const ids = new Set(allTags.filter((t) => (t.slug || "").toLowerCase() === tslug).map((t) => t.id));
        const all = await getPublishedBlogs(100000);
        return res.json(all.filter((b) => (b.tag_ids || []).some((id) => ids.has(id))));
      }

      let result = await getPublishedBlogs(limit, categorySlug);

      if (req.query.status !== undefined) {
        const statusNum = parseInt(req.query.status as string, 10);
        result = result.filter(b => b.status === statusNum);
      }
      if (req.query.category_id) {
        const catId = parseInt(req.query.category_id as string, 10);
        result = result.filter(b => b.category_id === catId || b.sub_category_id === catId);
      }
      if (req.query.search) {
        const query = (req.query.search as string).toLowerCase();
        result = result.filter(b =>
          b.title.toLowerCase().includes(query) ||
          b.short_content.toLowerCase().includes(query) ||
          b.url.toLowerCase().includes(query)
        );
      }
      res.json(result);
    } catch (err) {
      console.error("GET /api/blogs failed:", err);
      res.status(500).json({ error: "Failed to load articles" });
    }
  });

  // GET /api/blogs/slug/:url (Dynamic Routing lookup matching exact url column)
  // Count a real article view (self-hosted counter; dedup handled client-side).
  app.post("/api/blogs/:id/view", async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (!id) return res.status(400).json({ error: "bad id" });
    await incrementBlogViews(id);
    res.json({ ok: true });
  });

  app.get("/api/blogs/slug/:url", async (req, res) => {
    const article = await getBlogByUrlSlug(req.params.url);
    if (!article) {
      return res.status(404).json({ error: "Article not found matching legacy url path" });
    }
    res.json(article);
  });

  // GET /api/blogs/:id — single row, any status
  app.get("/api/blogs/:id", async (req, res) => {
    const blog = await getBlogByIdAdmin(parseInt(req.params.id, 10));
    if (!blog) return res.status(404).json({ error: "Blog not found" });
    res.json(blog);
  });

  // POST /api/blogs — real INSERT into ci_blog (auth required)
  app.post("/api/blogs", async (req, res) => {
    const admin = await requireAdmin(req);
    if (!admin) return res.status(401).json({ error: "Unauthorized" });
    try {
      const created = await createBlog(req.body as Partial<CIBlog>, admin.admin_id);
      logActivity(admin.name, admin.admin_id, `Created Blog Article #${created.id}: "${created.title}"`, "Blog");
      res.status(201).json(created);
    } catch (err: any) {
      console.error("createBlog failed:", err?.message);
      res.status(500).json({ error: "Failed to create article" });
    }
  });

  // PUT /api/blogs/:id — real UPDATE on ci_blog (auth required)
  app.put("/api/blogs/:id", async (req, res) => {
    const admin = await requireAdmin(req);
    if (!admin) return res.status(401).json({ error: "Unauthorized" });
    try {
      const id = parseInt(req.params.id, 10);
      const updated = await updateBlog(id, req.body as Partial<CIBlog>);
      if (!updated) return res.status(404).json({ error: "Blog not found" });
      logActivity(admin.name, admin.admin_id, `Updated Blog Article #${id}: "${updated.title}"`, "Blog");
      res.json(updated);
    } catch (err: any) {
      console.error("updateBlog failed:", err?.message);
      res.status(500).json({ error: "Failed to update article" });
    }
  });

  // DELETE /api/blogs/:id — real DELETE on ci_blog (auth required)
  app.delete("/api/blogs/:id", async (req, res) => {
    const admin = await requireAdmin(req);
    if (!admin) return res.status(401).json({ error: "Unauthorized" });
    const id = parseInt(req.params.id, 10);
    const ok = await deleteBlog(id);
    if (!ok) return res.status(404).json({ error: "Blog not found" });
    logActivity(admin.name, admin.admin_id, `Deleted Blog Article #${id}`, "Blog");
    res.json({ success: true, id });
  });

  // POST /api/blogs/bulk-action — real bulk UPDATE/DELETE (auth required)
  app.post("/api/blogs/bulk-action", async (req, res) => {
    const admin = await requireAdmin(req);
    if (!admin) return res.status(401).json({ error: "Unauthorized" });
    const { ids, action } = req.body as { ids: number[]; action: "activate" | "deactivate" | "delete" };
    if (!Array.isArray(ids) || !["activate", "deactivate", "delete"].includes(action)) {
      return res.status(400).json({ error: "Invalid bulk action payload" });
    }
    const affected = await bulkBlogAction(ids.map(Number), action);
    logActivity(admin.name, admin.admin_id, `Bulk ${action} on ${affected} blogs`, "Blog");
    res.json({ success: true, affected, ids, action });
  });

  // GET /api/categories — all active ci_category rows (parents + children)
  app.get("/api/categories", async (_req, res) => {
    try {
      res.json(await getAllCategories());
    } catch (err) {
      console.error("GET /api/categories failed:", err);
      res.status(500).json({ error: "Failed to load categories" });
    }
  });

  // POST /api/categories — real INSERT on ci_category
  app.post("/api/categories", async (req, res) => {
    const admin = await requireAdmin(req);
    if (!admin) return res.status(401).json({ error: "Unauthorized" });
    try {
      const cats = await createCategory(req.body || {});
      logActivity(admin.name, admin.admin_id, `Created Category "${req.body?.category_name}"`, "Category");
      return res.json(cats);
    } catch (err: any) {
      return res.status(500).json({ error: "Category save failed: " + err?.message });
    }
  });

  app.post("/api/_legacy_categories_unused", (req, res) => {
    const payload = req.body;
    const newId = dbCategories.length ? Math.max(...dbCategories.map(c => c.id)) + 1 : 1;
    const now = new Date().toISOString().replace("T", " ").substring(0, 19);

    const newCategory: CICategory = {
      id: newId,
      category_name: payload.category_name || "New Category",
      slug: payload.slug || "new-category",
      status: payload.status !== undefined ? payload.status : 1,
      article_count: 0,
      meta_title: payload.meta_title || payload.category_name || "",
      meta_description: payload.meta_description || "",
      created_at: now,
    };

    dbCategories.unshift(newCategory);
    logActivity("Elena Rostova", 1, `Created Category #${newId}: "${newCategory.category_name}"`, "Category");
    res.status(201).json(newCategory);
  });

  // PUT /api/categories/:id — real UPDATE on ci_category
  app.put("/api/categories/:id", async (req, res) => {
    const admin = await requireAdmin(req);
    if (!admin) return res.status(401).json({ error: "Unauthorized" });
    try {
      const cats = await updateCategory(parseInt(req.params.id, 10), req.body || {});
      return res.json(cats);
    } catch (err: any) {
      return res.status(500).json({ error: "Category update failed: " + err?.message });
    }
  });

  app.put("/api/_legacy_categories_unused/:id", (req, res) => {
    const id = parseInt(req.params.id, 10);
    const idx = dbCategories.findIndex(c => c.id === id);
    if (idx === -1) return res.status(404).json({ error: "Category not found" });

    dbCategories[idx] = { ...dbCategories[idx], ...req.body, id };
    logActivity("Elena Rostova", 1, `Updated Category #${id}: "${dbCategories[idx].category_name}"`, "Category");
    res.json(dbCategories[idx]);
  });

  // DELETE /api/categories/:id — real DELETE on ci_category
  app.delete("/api/categories/:id", async (req, res) => {
    const admin = await requireAdmin(req);
    if (!admin) return res.status(401).json({ error: "Unauthorized" });
    const ok = await deleteCategory(parseInt(req.params.id, 10));
    if (!ok) return res.status(404).json({ error: "Category not found" });
    return res.json({ success: true, id: parseInt(req.params.id, 10) });
  });

  app.delete("/api/_legacy_categories_unused/:id", (req, res) => {
    const id = parseInt(req.params.id, 10);
    dbCategories = dbCategories.filter(c => c.id !== id);
    logActivity("Elena Rostova", 1, `Deleted Category #${id}`, "Category");
    res.json({ success: true, id });
  });

  // GET /api/tags — real ci_tag rows
  app.get("/api/tags", async (_req, res) => {
    res.json(await getActiveTags());
  });
  app.post("/api/tags", async (req, res) => {
    const admin = await requireAdmin(req);
    if (!admin) return res.status(401).json({ error: "Unauthorized" });
    if (!req.body?.tag_name) return res.status(400).json({ error: "tag_name required" });
    try { res.json(await createTag(req.body)); } catch (e: any) { res.status(500).json({ error: "Tag create failed: " + e?.message }); }
  });
  app.put("/api/tags/:id", async (req, res) => {
    const admin = await requireAdmin(req);
    if (!admin) return res.status(401).json({ error: "Unauthorized" });
    try { res.json(await updateTag(parseInt(req.params.id, 10), req.body || {})); } catch (e: any) { res.status(500).json({ error: "Tag update failed: " + e?.message }); }
  });
  app.delete("/api/tags/:id", async (req, res) => {
    const admin = await requireAdmin(req);
    if (!admin) return res.status(401).json({ error: "Unauthorized" });
    const ok = await deleteTag(parseInt(req.params.id, 10));
    res.json({ success: ok });
  });

  // GET /api/advertisements — real ci_advertisement rows
  app.get("/api/advertisements", async (_req, res) => {
    const realAds = await getActiveAds();
    res.json(realAds.length > 0 ? realAds : dbAds);
  });

  // POST /api/advertisements — real INSERT/UPDATE on ci_advertisement
  app.post("/api/advertisements", async (req, res) => {
    const admin = await requireAdmin(req);
    if (!admin) return res.status(401).json({ error: "Unauthorized" });
    try {
      const { id, ...payload } = req.body || {};
      const ads = id ? await updateAd(Number(id), payload) : await createAd(payload);
      logActivity(admin.name, admin.admin_id, `${id ? "Updated" : "Created"} Advertisement "${payload.title || id}"`, "Advertisement");
      return res.json(ads);
    } catch (err: any) {
      return res.status(500).json({ error: "Ad save failed: " + err?.message });
    }
  });

  // DELETE /api/advertisements/:id
  app.delete("/api/advertisements/:id", async (req, res) => {
    const admin = await requireAdmin(req);
    if (!admin) return res.status(401).json({ error: "Unauthorized" });
    const ok = await deleteAd(parseInt(req.params.id, 10));
    if (!ok) return res.status(404).json({ error: "Ad not found" });
    logActivity(admin.name, admin.admin_id, `Deleted Advertisement #${req.params.id}`, "Advertisement");
    res.json({ success: true });
  });

  // POST /api/upload-image — file upload via cPanel bridge (stores on the live server)
  app.post("/api/upload-image", async (req, res) => {
    const admin = await requireAdmin(req);
    if (!admin) return res.status(401).json({ error: "Unauthorized" });
    const { folder, filename, data, alt } = req.body || {};
    if (!data || !filename) return res.status(400).json({ error: "filename and data required" });
    if (!bridgeConfigured()) {
      // Standalone Node deploy (no bridge): write the file to the local
      // web-served assets folder and return an ABSOLUTE URL on this host, so
      // the logo/cover renders from this origin (not the legacy asset host).
      try {
        const fs = await import("fs/promises");
        const sub = folder === "advertisement" ? "advertisement" : "blog";
        const safe = String(filename).replace(/[^a-zA-Z0-9._-]/g, "");
        const ext = (safe.split(".").pop() || "png").toLowerCase();
        if (!["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext)) {
          return res.status(400).json({ error: "Only image files (jpg, png, gif, webp, svg) are allowed" });
        }
        const buf = Buffer.from(String(data), "base64");
        if (buf.length < 50) return res.status(400).json({ error: "Image data looks empty or corrupt" });
        if (buf.length > 8 * 1024 * 1024) return res.status(400).json({ error: "Image too large (max 8 MB)" });
        // Write uploads OUTSIDE dist (to /uploads) so re-deploying the built
        // dist folder never wipes user-uploaded images.
        const dir = path.join(process.cwd(), "uploads", sub);
        await fs.mkdir(dir, { recursive: true });
        const fname = `${Date.now()}_${safe || "upload." + ext}`;
        await fs.writeFile(path.join(dir, fname), buf);
        const proto = String(req.headers["x-forwarded-proto"] || req.protocol || "https").split(",")[0];
        const host = req.get("host");
        const abs = `${proto}://${host}/uploads/${sub}/${fname}`;
        return res.json({ success: true, path: abs });
      } catch (err: any) {
        return res.status(500).json({ error: "Local image save failed: " + (err?.message || "") });
      }
    }
    try {
      const path = await bridgeUploadImage(
        { username: String(req.headers["x-admin-user"] || ""), password: String(req.headers["x-admin-pass"] || "") },
        folder === "advertisement" ? "advertisement" : "blog",
        String(filename),
        String(data),
        alt ? String(alt) : undefined
      );
      return res.json({ success: true, path });
    } catch (err: any) {
      return res.status(502).json({ error: err?.message || "Upload failed" });
    }
  });

  // (legacy in-memory ad handler removed)
  app.post("/api/_legacy_ads_unused", (req, res) => {
    const payload = req.body;
    const newId = dbAds.length ? Math.max(...dbAds.map(a => a.id)) + 1 : 1;
    const now = new Date().toISOString().replace("T", " ").substring(0, 19);

    const newAd: CIAdvertisement = {
      id: newId,
      title: payload.title || "New Ad Banner",
      advertisement_image: payload.advertisement_image || "assets/img/ads/default-728x90.jpg",
      alt_tag: payload.alt_tag || "Advertisement Banner",
      url: payload.url || "https://example.com",
      position: payload.position || "top_banner",
      status: payload.status !== undefined ? payload.status : 1,
      click_count: 0,
      impressions: 100,
      created_at: now,
    };

    dbAds.unshift(newAd);
    logActivity("Elena Rostova", 1, `Created Advertisement #${newId}: "${newAd.title}"`, "Advertisement");
    res.status(201).json(newAd);
  });

  // POST /api/advertisements/:id/click — real click counter in ci_advertisement.
  app.post("/api/advertisements/:id/click", async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (id) await incrementAdClick(id);
    res.json({ success: true });
  });

  // GET /api/activity-logs — real ci_activity_log + session actions
  app.get("/api/activity-logs", async (_req, res) => {
    const real = await getActivityLogs();
    res.json([...dbActivityLogs, ...real]);
  });

  // GET /api/users — real ci_admin accounts (no passwords)
  app.get("/api/users", async (_req, res) => {
    res.json(await getAdminUsers());
  });
  app.post("/api/users", async (req, res) => {
    const admin = await requireAdmin(req);
    if (!admin) return res.status(401).json({ error: "Unauthorized" });
    const { username, password } = req.body || {};
    if (!username || !password) return res.status(400).json({ error: "username and password required" });
    try { res.json(await createAdminUser(req.body)); } catch (e: any) { res.status(500).json({ error: "User create failed: " + e?.message }); }
  });
  app.put("/api/users/:id", async (req, res) => {
    const admin = await requireAdmin(req);
    if (!admin) return res.status(401).json({ error: "Unauthorized" });
    try { res.json(await updateAdminUser(parseInt(req.params.id, 10), req.body || {})); } catch (e: any) { res.status(500).json({ error: "User update failed: " + e?.message }); }
  });
  app.delete("/api/users/:id", async (req, res) => {
    const admin = await requireAdmin(req);
    if (!admin) return res.status(401).json({ error: "Unauthorized" });
    const id = parseInt(req.params.id, 10);
    if (id === admin.admin_id) return res.status(400).json({ error: "You cannot delete your own account." });
    const ok = await deleteAdminUser(id);
    res.json({ success: ok });
  });

  app.get("/api/sub-admins", async (_req, res) => {
    res.json(await getSubAdmins());
  });
  app.post("/api/sub-admins", async (req, res) => {
    const admin = await requireAdmin(req);
    if (!admin) return res.status(401).json({ error: "Unauthorized" });
    const { username, password } = req.body || {};
    if (!username || !password) return res.status(400).json({ error: "username and password required" });
    try { res.json(await createSubAdmin(req.body)); } catch (e: any) { res.status(500).json({ error: "Sub-admin create failed: " + e?.message }); }
  });
  app.put("/api/sub-admins/:id", async (req, res) => {
    const admin = await requireAdmin(req);
    if (!admin) return res.status(401).json({ error: "Unauthorized" });
    try { res.json(await updateSubAdmin(parseInt(req.params.id, 10), req.body || {})); } catch (e: any) { res.status(500).json({ error: "Sub-admin update failed: " + e?.message }); }
  });
  app.delete("/api/sub-admins/:id", async (req, res) => {
    const admin = await requireAdmin(req);
    if (!admin) return res.status(401).json({ error: "Unauthorized" });
    const ok = await deleteSubAdmin(parseInt(req.params.id, 10));
    res.json({ success: ok });
  });

  // GET /api/subscribers — real ci_subscribe rows
  app.get("/api/subscribers", async (_req, res) => {
    res.json(await getSubscribers());
  });

  // POST /api/subscribers
  app.post("/api/subscribers", (req, res) => {
    const { email } = req.body;
    if (!email || !email.includes("@")) {
      return res.status(400).json({ error: "Invalid email address" });
    }
    const existing = dbSubscribers.find(s => s.email === email);
    if (existing) {
      return res.json({ message: "Already subscribed", subscriber: existing });
    }
    const newSub: CISubscriber = {
      id: dbSubscribers.length + 1,
      email,
      status: "subscribed",
      subscribed_at: new Date().toISOString().replace("T", " ").substring(0, 19),
    };
    dbSubscribers.unshift(newSub);
    res.status(201).json({ message: "Subscribed successfully", subscriber: newSub });
  });
  app.post("/api/subscribers/bulk-delete", async (req, res) => {
    const admin = await requireAdmin(req);
    if (!admin) return res.status(401).json({ error: "Unauthorized" });
    const ids = Array.isArray(req.body?.ids) ? req.body.ids.map(Number).filter(Boolean) : [];
    const affected = await deleteSubscribersBulk(ids);
    res.json({ success: true, affected });
  });
  app.delete("/api/subscribers/:id", async (req, res) => {
    const admin = await requireAdmin(req);
    if (!admin) return res.status(401).json({ error: "Unauthorized" });
    const ok = await deleteSubscriber(parseInt(req.params.id, 10));
    res.json({ success: ok });
  });

  // GET /api/image-library — real ci_imagelibrary rows
  app.get("/api/image-library", async (_req, res) => {
    res.json(await getImageLibrary());
  });
  app.delete("/api/image-library/:id", async (req, res) => {
    const admin = await requireAdmin(req);
    if (!admin) return res.status(401).json({ error: "Unauthorized" });
    const ok = await deleteImage(parseInt(req.params.id, 10));
    res.json({ success: ok });
  });

  // POST /api/image-library
  app.post("/api/image-library", (req, res) => {
    const { file_name, file_path, alt_tag } = req.body;
    const newImg: CIImageLibrary = {
      id: dbImages.length ? Math.max(...dbImages.map(i => i.id)) + 1 : 1,
      file_name: file_name || "new-image.jpg",
      file_path: file_path || "assets/img/blog/2026/08/new-image.jpg",
      file_size: "1.5 MB",
      alt_tag: alt_tag || "Uploaded Asset",
      uploaded_by: "elena_rostova",
      created_at: new Date().toISOString().replace("T", " ").substring(0, 19),
    };
    dbImages.unshift(newImg);
    logActivity("Elena Rostova", 1, `Uploaded image asset '${newImg.file_name}'`, "Image Library");
    res.status(201).json(newImg);
  });

  // GET /api/settings
  app.get("/api/settings", (_req, res) => {
    res.json(dbSetting);
  });

  // PUT /api/settings
  app.put("/api/settings", (req, res) => {
    dbSetting = {
      ...dbSetting,
      ...req.body,
      updated_at: new Date().toISOString().replace("T", " ").substring(0, 19),
    };
    logActivity("Elena Rostova", 1, "Updated Site Configuration & SEO Defaults", "Setting");
    res.json(dbSetting);
  });

  // Auto-generated sitemap.xml — reflects live pages, categories and blogs.
  // Cached briefly so it isn't regenerated on every hit.
  let sitemapCache = { xml: "", at: 0 };
  const xmlEsc = (s: any) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
  app.get("/sitemap.xml", async (req, res) => {
    try {
      const now = Date.now();
      if (!sitemapCache.xml || now - sitemapCache.at > 10 * 60 * 1000) {
        const proto = String(req.headers["x-forwarded-proto"] || req.protocol || "https").split(",")[0];
        const origin = `${proto}://${req.get("host")}`;
        const [blogs, cats, tags] = await Promise.all([getPublishedBlogs(100000), getAllCategories(), getActiveTags()]);
        const rows: string[] = [];
        const add = (loc: string, priority: string, lastmod?: string) =>
          rows.push(`  <url><loc>${xmlEsc(loc)}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ""}<priority>${priority}</priority></url>`);
        add(`${origin}/`, "1.0");
        ["about-us", "contact-us", "latest-news"].forEach((p) => add(`${origin}/${p}`, "0.8"));
        // Categories: dedupe by slug (legacy ci_category has duplicate-slug rows)
        // and skip empty/placeholder slugs like "-" so Google gets clean unique URLs.
        const seenCat = new Set<string>();
        cats.forEach((c) => {
          const slug = (c.slug || "").trim();
          if (!slug || slug === "-" || seenCat.has(slug.toLowerCase())) return;
          seenCat.add(slug.toLowerCase());
          add(`${origin}/category/${encodeURIComponent(slug)}`, "0.8");
        });
        // Tags: only those with enough articles to be worth indexing (avoid thin pages), deduped by slug.
        const tagCount = new Map<number, number>();
        blogs.forEach((b) => (b.tag_ids || []).forEach((id) => tagCount.set(id, (tagCount.get(id) || 0) + 1)));
        const seenTag = new Set<string>();
        tags.forEach((tg) => {
          const slug = (tg.slug || "").trim();
          if (!slug || seenTag.has(slug.toLowerCase()) || (tagCount.get(tg.id) || 0) < 3) return;
          seenTag.add(slug.toLowerCase());
          add(`${origin}/tag/${encodeURIComponent(slug)}`, "0.5");
        });
        // Articles: dedupe by slug too, in case legacy rows share a url.
        const seenBlog = new Set<string>();
        blogs.forEach((b) => {
          const slug = (b.url || "").trim();
          if (!slug || seenBlog.has(slug.toLowerCase())) return;
          seenBlog.add(slug.toLowerCase());
          add(`${origin}/${encodeURIComponent(slug)}`, "0.64", (b.updated_at || b.created_at || "").split(" ")[0] || undefined);
        });
        sitemapCache = {
          xml: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${rows.join("\n")}\n</urlset>`,
          at: now,
        };
      }
      res.set("Content-Type", "application/xml; charset=utf-8").send(sitemapCache.xml);
    } catch (err: any) {
      res.status(500).send("sitemap generation failed");
    }
  });

  // robots.txt pointing crawlers at the live sitemap.
  app.get("/robots.txt", (req, res) => {
    const proto = String(req.headers["x-forwarded-proto"] || req.protocol || "https").split(",")[0];
    res.set("Content-Type", "text/plain; charset=utf-8").send(`User-agent: *\nAllow: /\nSitemap: ${proto}://${req.get("host")}/sitemap.xml\n`);
  });

  // Legacy /News/<slug> URLs (old CodeIgniter tag/category pages) → 301 to the
  // new /tag/<slug> or /category/<slug> so Google's indexed links keep working
  // and their ranking consolidates onto the current URL.
  app.get(/^\/News\/(.+)$/i, async (req, res) => {
    const slug = decodeURIComponent((req.params as any)[0] || "").replace(/\/+$/, "");
    if (!slug) return res.redirect(301, "/");
    try {
      const tags = await getActiveTags();
      const tag = tags.find((t) => (t.slug || "").toLowerCase() === slug.toLowerCase());
      if (tag) return res.redirect(301, `/tag/${encodeURIComponent(tag.slug)}`);
      const cats = await getAllCategories();
      const cat = cats.find((c) => (c.slug || "").toLowerCase() === slug.toLowerCase());
      if (cat) return res.redirect(301, `/category/${encodeURIComponent(cat.slug)}`);
    } catch { /* fall through to 404 */ }
    // Neither a tag nor a category → genuine 404.
    res.status(404).set("Content-Type", "text/html; charset=utf-8").send("<!doctype html><title>404 Not Found</title><h1>404 — Not Found</h1>");
  });

  // Vite development middleware or production static serving
  if (process.env.NODE_ENV !== "production") {
    // Lazy-load vite only in dev so production can run on older Node (16+)
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));

    // Legacy CodeIgniter media served straight from the domain root so old
    // image URLs (newsforever.in/assets/img/…, /uploads/…) keep working when
    // this app fronts the main domain. No-ops when the folders are absent.
    app.use("/assets", express.static(path.join(process.cwd(), "assets")));
    app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
    // A missing asset/upload must 404 as a file — never fall through to the
    // SPA catch-all (which would return a full HTML page for an image URL).
    app.use(["/assets", "/uploads"], (_req, res) => res.status(404).type("txt").send("Not found"));

    // Server-side meta injection: for article URLs, put the real title/desc/
    // OG tags into the initial HTML so Google, WhatsApp, Facebook, etc. show
    // the correct preview (the SPA still refreshes them client-side).
    const fs = await import("fs/promises");
    let templateCache = "";
    const getTemplate = async () => {
      if (!templateCache) templateCache = await fs.readFile(path.join(distPath, "index.html"), "utf8");
      return templateCache;
    };
    const esc = (s: any) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    const RESERVED = new Set(["", "admin", "category", "tag", "api", "assets", "uploads", "report.html", "favicon.ico", "sitemap.xml", "robots.txt", "rss.xml", "feed.rss"]);
    // Real static pages the SPA renders — must NOT be treated as 404s.

    app.get("*", async (req, res) => {
      try {
        let html = await getTemplate();
        const seg = decodeURIComponent(req.path).replace(/^\/+|\/+$/g, "");
        // Strip the baked homepage SEO tags from the template so per-page
        // injection below doesn't produce duplicate meta / JSON-LD. (The static
        // homepage keeps them — it never reaches this Node handler.)
        html = html
          .replace(/\n?\s*<meta\s+(name="description"|name="keywords"|property="og:[^"]*"|name="twitter:[^"]*")[^>]*>/gi, "")
          .replace(/\n?\s*<link\s+rel="canonical"[^>]*>/gi, "")
          .replace(/\n?\s*<script\s+type="application\/ld\+json">[\s\S]*?<\/script>/gi, "");
        let injected = false;
        let status = 200;
        // Admin-created static page? (single segment, in the page set)
        const pageSet = seg && !seg.includes("/") && !RESERVED.has(seg.split("/")[0]) ? await getPageSlugSet() : null;
        const isStaticPage = !!pageSet && pageSet.has(seg.toLowerCase());
        if (isStaticPage) {
          const pg = await getStaticPage(seg.toLowerCase());
          const proto = String(req.headers["x-forwarded-proto"] || req.protocol || "https").split(",")[0];
          const url = esc(`${proto}://${req.get("host")}/${seg.toLowerCase()}`);
          const fb = seg.toLowerCase() === "about-us" ? "About Us — News Forever" : seg.toLowerCase() === "contact-us" ? "Contact Us — News Forever" : `${pg.title || seg} — News Forever`;
          const title = esc(pg.meta_title || pg.title || fb);
          const desc = esc(pg.meta_description || "");
          const tagsP = [
            `<title>${title}</title>`,
            `<meta name="description" content="${desc}">`,
            pg.meta_keyword ? `<meta name="keywords" content="${esc(pg.meta_keyword)}">` : "",
            `<link rel="canonical" href="${url}">`,
            `<meta property="og:type" content="website">`,
            `<meta property="og:title" content="${title}">`,
            `<meta property="og:description" content="${desc}">`,
            `<meta property="og:url" content="${url}">`,
          ].filter(Boolean).join("\n    ");
          html = html.replace(/<title>[\s\S]*?<\/title>/i, "").replace("</head>", `    ${tagsP}\n  </head>`);
          injected = true;
        }
        if (!injected && seg && !RESERVED.has(seg.split("/")[0])) {
          const article = await getBlogByUrlSlug(seg);
          if (article) {
            injected = true;
            const title = esc(article.meta_title || article.title);
            const desc = esc(article.meta_description || article.short_content || "");
            const proto = String(req.headers["x-forwarded-proto"] || req.protocol || "https").split(",")[0];
            const origin = `${proto}://${req.get("host")}`;
            // Always build a clean canonical from the trimmed slug — the legacy
            // og_url column can contain a stray space ("…/ slug") which breaks it.
            const cleanSlug = (article.url || seg || "").trim();
            const urlRaw = `${origin}/${encodeURIComponent(cleanSlug)}`;
            const url = esc(urlRaw);
            const img = /^https?:/i.test(article.og_image || "") ? article.og_image : article.image; // already absolute
            const imgEsc = esc(img);
            const ogTitle = esc(article.og_title || article.meta_title || article.title);
            const ogDesc = esc(article.og_description || article.meta_description || article.short_content || "");
            // JSON-LD NewsArticle for rich results + name-based search relevance.
            const ld = {
              "@context": "https://schema.org",
              "@type": "NewsArticle",
              headline: article.meta_title || article.title,
              description: article.meta_description || article.short_content || "",
              image: img ? [img] : undefined,
              datePublished: (article.created_at || "").slice(0, 10) || undefined,
              dateModified: ((article.updated_at || article.created_at || "").slice(0, 10)) || undefined,
              mainEntityOfPage: urlRaw,
              url: urlRaw,
              author: { "@type": "Organization", name: "News Forever", url: origin },
              publisher: { "@type": "Organization", name: "News Forever" },
              ...(article.category_name ? { articleSection: article.category_name } : {}),
              ...(article.meta_keyword ? { keywords: article.meta_keyword } : {}),
              ...(article.person_name ? { about: { "@type": "Person", name: article.person_name } } : {}),
            };
            const ldStr = JSON.stringify(ld).replace(/</g, "\\u003c");
            // Standalone Person entity too — strongest signal for name-based search.
            const personStr = article.person_name
              ? JSON.stringify({
                  "@context": "https://schema.org",
                  "@type": "Person",
                  name: article.person_name,
                  mainEntityOfPage: urlRaw,
                  ...(img ? { image: img } : {}),
                }).replace(/</g, "\\u003c")
              : "";
            // BreadcrumbList: Home › Category › Article.
            const crumbs: any[] = [{ "@type": "ListItem", position: 1, name: "Home", item: origin }];
            if (article.category_name) crumbs.push({ "@type": "ListItem", position: 2, name: article.category_name });
            crumbs.push({ "@type": "ListItem", position: crumbs.length + 1, name: article.title, item: urlRaw });
            const breadcrumbStr = JSON.stringify({
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              itemListElement: crumbs,
            }).replace(/</g, "\\u003c");
            const tags = [
              `<title>${title}</title>`,
              `<meta name="description" content="${desc}">`,
              article.meta_keyword ? `<meta name="keywords" content="${esc(article.meta_keyword)}">` : "",
              `<link rel="canonical" href="${url}">`,
              `<meta property="og:type" content="article">`,
              `<meta property="og:title" content="${ogTitle}">`,
              `<meta property="og:description" content="${ogDesc}">`,
              imgEsc ? `<meta property="og:image" content="${imgEsc}">` : "",
              `<meta property="og:url" content="${url}">`,
              `<meta name="twitter:card" content="summary_large_image">`,
              `<meta name="twitter:title" content="${ogTitle}">`,
              `<meta name="twitter:description" content="${ogDesc}">`,
              imgEsc ? `<meta name="twitter:image" content="${imgEsc}">` : "",
              `<script type="application/ld+json">${ldStr}</script>`,
              personStr ? `<script type="application/ld+json">${personStr}</script>` : "",
              `<script type="application/ld+json">${breadcrumbStr}</script>`,
            ].filter(Boolean).join("\n    ");
            html = html.replace(/<title>[\s\S]*?<\/title>/i, "").replace("</head>", `    ${tags}\n  </head>`);
            // SSR the article body into #root so crawlers see real <h1>/<h2>/<p>/
            // lists in view-source. React (createRoot) replaces it on mount.
            // Each h#_tag may hold multiple headings, one per line → emit each.
            const headLevel = (tag: string, raw?: string) =>
              (raw || "").split("\n").map((t) => t.trim()).filter(Boolean).map((t) => `<${tag}>${esc(t)}</${tag}>`).join("\n");
            const heads = [
              headLevel("h2", article.h2_tag),
              headLevel("h3", article.h3_tag),
              headLevel("h4", article.h4_tag),
              headLevel("h5", article.h5_tag),
              headLevel("h6", article.h6_tag),
            ].filter(Boolean).join("\n");
            const ssrBody = `<article><h1>${esc(article.title)}</h1>${heads}<div>${article.content || ""}</div></article>`;
            html = html.replace(/<div id="root">\s*<\/div>/i, `<div id="root">${ssrBody}</div>`);
          } else if (!seg.includes("/") && seg.toLowerCase() !== "latest-news") {
            // Bare single-segment path that is neither a static page (handled
            // above) nor an article, and not the latest-news landing → genuine
            // 404. Category/tag pages use prefixes so are never mis-flagged.
            status = 404;
          }
        }
        // Tag pages: inject tag-specific meta so /tag/<slug> indexes with content.
        if (!injected && seg.toLowerCase().startsWith("tag/")) {
          const tslug = decodeURIComponent(seg.slice(4).split("/")[0] || "");
          if (tslug) {
            const tags = await getActiveTags();
            const tg = tags.find((t) => (t.slug || "").toLowerCase() === tslug.toLowerCase());
            const name = tg ? tg.tag_name : tslug.replace(/-/g, " ");
            const proto = String(req.headers["x-forwarded-proto"] || req.protocol || "https").split(",")[0];
            const url = esc(`${proto}://${req.get("host")}/tag/${encodeURIComponent(tslug)}`);
            const title = esc(`${name} — News Forever`);
            const desc = esc(`Latest ${name} news, updates and articles on News Forever.`);
            const tags2 = [
              `<title>${title}</title>`,
              `<meta name="description" content="${desc}">`,
              `<link rel="canonical" href="${url}">`,
              `<meta property="og:type" content="website">`,
              `<meta property="og:title" content="${title}">`,
              `<meta property="og:description" content="${desc}">`,
              `<meta property="og:url" content="${url}">`,
            ].join("\n    ");
            html = html.replace(/<title>[\s\S]*?<\/title>/i, "").replace("</head>", `    ${tags2}\n  </head>`);
            injected = true;
          }
        }
        // Category pages: inject the category's own meta title/description (set in admin).
        if (!injected && seg.toLowerCase().startsWith("category/")) {
          const cslug = decodeURIComponent(seg.slice(9).split("/")[0] || "");
          if (cslug) {
            const cats = await getAllCategories();
            const cat = cats.find((c) => (c.slug || "").toLowerCase() === cslug.toLowerCase());
            const name = cat ? cat.category_name : cslug.replace(/-/g, " ");
            const proto = String(req.headers["x-forwarded-proto"] || req.protocol || "https").split(",")[0];
            const url = esc(`${proto}://${req.get("host")}/category/${encodeURIComponent(cslug)}`);
            const title = esc(cat?.meta_title || `${name} — News Forever`);
            const desc = esc(cat?.meta_description || `Latest ${name} news, updates and articles on News Forever.`);
            const tagsC = [
              `<title>${title}</title>`,
              `<meta name="description" content="${desc}">`,
              `<link rel="canonical" href="${url}">`,
              `<meta property="og:type" content="website">`,
              `<meta property="og:title" content="${title}">`,
              `<meta property="og:description" content="${desc}">`,
              `<meta property="og:url" content="${url}">`,
            ].join("\n    ");
            html = html.replace(/<title>[\s\S]*?<\/title>/i, "").replace("</head>", `    ${tagsC}\n  </head>`);
            injected = true;
          }
        }
        if (!injected) {
          // Homepage / category / fallback: inject the site-wide meta set in admin.
          const cfg = await getSiteConfig();
          const assetBase = (process.env.LEGACY_ASSET_BASE || "https://newsforever.in/").replace(/\/$/, "") + "/";
          const st = esc(cfg.siteTitle || "News Forever | National & International News Portal");
          const sd = esc(cfg.siteDescription || "Latest breaking news, beauty pageant updates, Forever Star India Awards, products, astrology, and international editorial coverage.");
          const sk = cfg.siteKeywords ? esc(cfg.siteKeywords) : "";
          const proto = String(req.headers["x-forwarded-proto"] || req.protocol || "https").split(",")[0];
          const url = esc(`${proto}://${req.get("host")}${req.path}`);
          const oiRaw = cfg.ogImage ? (/^https?:/i.test(cfg.ogImage) ? cfg.ogImage : assetBase + cfg.ogImage.replace(/^\/+/, "")) : "";
          const oi = esc(oiRaw);
          const tags = [
            `<title>${st}</title>`,
            `<meta name="description" content="${sd}">`,
            sk ? `<meta name="keywords" content="${sk}">` : "",
            `<link rel="canonical" href="${url}">`,
            `<meta property="og:type" content="website">`,
            `<meta property="og:title" content="${st}">`,
            `<meta property="og:description" content="${sd}">`,
            oi ? `<meta property="og:image" content="${oi}">` : "",
            `<meta property="og:url" content="${url}">`,
            `<meta name="twitter:card" content="summary_large_image">`,
            `<meta name="twitter:title" content="${st}">`,
            `<meta name="twitter:description" content="${sd}">`,
            oi ? `<meta name="twitter:image" content="${oi}">` : "",
          ];
          // Homepage only: Organization + WebSite JSON-LD for crawlers / AI.
          if (req.path === "/" || seg === "") {
            const origin = `${proto}://${req.get("host")}`;
            const logo = cfg.logoUrl
              ? (/^https?:/i.test(cfg.logoUrl) ? cfg.logoUrl : assetBase + cfg.logoUrl.replace(/^\/+/, ""))
              : (siteSetting.site_logo || "");
            const sameAs = [siteSetting.facebook_url, siteSetting.instagram_url, siteSetting.twitter_url, siteSetting.youtube_url].filter(Boolean);
            const org = {
              "@context": "https://schema.org",
              "@type": "NewsMediaOrganization",
              name: "News Forever",
              url: origin,
              description: cfg.siteDescription || "Beauty pageants, Forever Star India Awards, national achievers, business, astrology and national news.",
              ...(logo ? { logo: { "@type": "ImageObject", url: logo } } : {}),
              ...(sameAs.length ? { sameAs } : {}),
            };
            const website = {
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "News Forever",
              url: origin,
              publisher: { "@type": "Organization", name: "News Forever", ...(logo ? { logo: { "@type": "ImageObject", url: logo } } : {}) },
            };
            tags.push(`<script type="application/ld+json">${JSON.stringify(org).replace(/</g, "\\u003c")}</script>`);
            tags.push(`<script type="application/ld+json">${JSON.stringify(website).replace(/</g, "\\u003c")}</script>`);
            // ItemList of the latest headlines — helps Google/AI understand the feed.
            try {
              const latest = await getPublishedBlogs(10);
              if (latest.length) {
                const itemList = {
                  "@context": "https://schema.org",
                  "@type": "ItemList",
                  itemListElement: latest.map((b, i) => ({
                    "@type": "ListItem",
                    position: i + 1,
                    url: `${origin}/${encodeURIComponent((b.url || "").trim())}`,
                    name: b.meta_title || b.title,
                  })),
                };
                tags.push(`<script type="application/ld+json">${JSON.stringify(itemList).replace(/</g, "\\u003c")}</script>`);
              }
            } catch { /* skip list on error */ }
          }
          html = html.replace(/<title>[\s\S]*?<\/title>/i, "").replace("</head>", `    ${tags.filter(Boolean).join("\n    ")}\n  </head>`);
        }
        res.status(status).set("Content-Type", "text/html; charset=utf-8").send(html);
      } catch {
        res.sendFile(path.join(distPath, "index.html"));
      }
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express Backend + Headless CodeIgniter Bridge Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
