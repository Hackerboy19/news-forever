import "dotenv/config";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { siteSetting } from "./src/data/siteConfig";
import { CIBlog, CICategory, CIAdvertisement, CIActivityLog, CISetting, CISubscriber, CIImageLibrary } from "./src/types";
import { getPublishedBlogs, getBlogByUrlSlug, getAllCategories, getActiveAds, getActiveTags } from "./src/lib/db";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

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

  // Health check
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", framework: "Express + React Headless CodeIgniter Bridge" });
  });

  // GET /api/blogs — real ci_blog rows, optional ?category_slug= & filters
  app.get("/api/blogs", async (req, res) => {
    try {
      const categorySlug = req.query.category_slug as string | undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 200;

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
  app.get("/api/blogs/slug/:url", async (req, res) => {
    const article = await getBlogByUrlSlug(req.params.url);
    if (!article) {
      return res.status(404).json({ error: "Article not found matching legacy url path" });
    }
    res.json(article);
  });

  // GET /api/blogs/:id
  app.get("/api/blogs/:id", (req, res) => {
    const id = parseInt(req.params.id, 10);
    const blog = dbBlogs.find(b => b.id === id);
    if (!blog) return res.status(404).json({ error: "Blog not found" });
    res.json(blog);
  });

  // POST /api/blogs (Create Blog - 4 tab fields mapped)
  app.post("/api/blogs", (req, res) => {
    const payload: Partial<CIBlog> = req.body;
    const newId = dbBlogs.length ? Math.max(...dbBlogs.map(b => b.id)) + 1 : 101;
    const cat = dbCategories.find(c => c.id === payload.category_id);

    const now = new Date().toISOString().replace("T", " ").substring(0, 19);

    const newBlog: CIBlog = {
      id: newId,
      title: payload.title || "Untitled Article",
      url: payload.url || `article-${newId}`,
      short_content: payload.short_content || "",
      content: payload.content || "",
      category_id: payload.category_id || 1,
      category_name: cat ? cat.category_name : "General",
      tag_ids: payload.tag_ids || [],
      image: payload.image || "assets/img/blog/2026/default-article.jpg",
      alt_tag: payload.alt_tag || payload.title || "Article Image",
      status: payload.status !== undefined ? payload.status : 1,
      is_featured: !!payload.is_featured,
      is_trending: !!payload.is_trending,
      author_id: 1,
      author_name: "Elena Rostova",
      views: 0,
      created_at: now,
      updated_at: now,

      // SEO & OG
      meta_title: payload.meta_title || payload.title || "",
      meta_description: payload.meta_description || payload.short_content || "",
      meta_keyword: payload.meta_keyword || "news, pageant, fashion",
      og_title: payload.og_title || payload.title || "",
      og_url: payload.og_url || `https://news.globalgazette.com/article/${payload.url}`,
      og_description: payload.og_description || payload.short_content || "",
      og_image: payload.og_image || payload.image || "",

      // Headings
      h2_tag: payload.h2_tag || "",
      h3_tag: payload.h3_tag || "",
      h4_tag: payload.h4_tag || "",
      h5_tag: payload.h5_tag || "",
      h6_tag: payload.h6_tag || "",
    };

    dbBlogs.unshift(newBlog);
    logActivity("Elena Rostova", 1, `Created Blog Article #${newId}: "${newBlog.title}"`, "Blog");

    res.status(201).json(newBlog);
  });

  // PUT /api/blogs/:id (Update Blog)
  app.put("/api/blogs/:id", (req, res) => {
    const id = parseInt(req.params.id, 10);
    const index = dbBlogs.findIndex(b => b.id === id);
    if (index === -1) return res.status(404).json({ error: "Blog not found" });

    const payload = req.body;
    const now = new Date().toISOString().replace("T", " ").substring(0, 19);
    const cat = dbCategories.find(c => c.id === payload.category_id);

    dbBlogs[index] = {
      ...dbBlogs[index],
      ...payload,
      id, // keep original ID
      category_name: cat ? cat.category_name : dbBlogs[index].category_name,
      updated_at: now,
    };

    logActivity("Elena Rostova", 1, `Updated Blog Article #${id}: "${dbBlogs[index].title}"`, "Blog");
    res.json(dbBlogs[index]);
  });

  // DELETE /api/blogs/:id
  app.delete("/api/blogs/:id", (req, res) => {
    const id = parseInt(req.params.id, 10);
    const blog = dbBlogs.find(b => b.id === id);
    if (!blog) return res.status(404).json({ error: "Blog not found" });

    dbBlogs = dbBlogs.filter(b => b.id !== id);
    logActivity("Elena Rostova", 1, `Deleted Blog Article #${id}: "${blog.title}"`, "Blog");
    res.json({ success: true, id });
  });

  // POST /api/blogs/bulk-action (Bulk status toggle / delete)
  app.post("/api/blogs/bulk-action", (req, res) => {
    const { ids, action } = req.body as { ids: number[]; action: 'activate' | 'deactivate' | 'delete' };
    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({ error: "Invalid IDs array" });
    }

    if (action === 'delete') {
      dbBlogs = dbBlogs.filter(b => !ids.includes(b.id));
      logActivity("Elena Rostova", 1, `Bulk deleted ${ids.length} blogs`, "Blog");
    } else if (action === 'activate') {
      dbBlogs = dbBlogs.map(b => ids.includes(b.id) ? { ...b, status: 1 } : b);
      logActivity("Elena Rostova", 1, `Bulk activated ${ids.length} blogs`, "Blog");
    } else if (action === 'deactivate') {
      dbBlogs = dbBlogs.map(b => ids.includes(b.id) ? { ...b, status: 0 } : b);
      logActivity("Elena Rostova", 1, `Bulk deactivated ${ids.length} blogs`, "Blog");
    }

    res.json({ success: true, ids, action });
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

  // POST /api/categories
  app.post("/api/categories", (req, res) => {
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

  // PUT /api/categories/:id
  app.put("/api/categories/:id", (req, res) => {
    const id = parseInt(req.params.id, 10);
    const idx = dbCategories.findIndex(c => c.id === id);
    if (idx === -1) return res.status(404).json({ error: "Category not found" });

    dbCategories[idx] = { ...dbCategories[idx], ...req.body, id };
    logActivity("Elena Rostova", 1, `Updated Category #${id}: "${dbCategories[idx].category_name}"`, "Category");
    res.json(dbCategories[idx]);
  });

  // DELETE /api/categories/:id
  app.delete("/api/categories/:id", (req, res) => {
    const id = parseInt(req.params.id, 10);
    dbCategories = dbCategories.filter(c => c.id !== id);
    logActivity("Elena Rostova", 1, `Deleted Category #${id}`, "Category");
    res.json({ success: true, id });
  });

  // GET /api/tags — real ci_tag rows
  app.get("/api/tags", async (_req, res) => {
    res.json(await getActiveTags());
  });

  // GET /api/advertisements — real ci_advertisement rows
  app.get("/api/advertisements", async (_req, res) => {
    const realAds = await getActiveAds();
    res.json(realAds.length > 0 ? realAds : dbAds);
  });

  // POST /api/advertisements
  app.post("/api/advertisements", (req, res) => {
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

  // POST /api/advertisements/:id/click
  app.post("/api/advertisements/:id/click", (req, res) => {
    const id = parseInt(req.params.id, 10);
    const ad = dbAds.find(a => a.id === id);
    if (ad) {
      ad.click_count += 1;
    }
    res.json({ success: true, clicks: ad?.click_count });
  });

  // GET /api/activity-logs
  app.get("/api/activity-logs", (_req, res) => {
    res.json(dbActivityLogs);
  });

  // GET /api/users
  app.get("/api/users", (_req, res) => {
    res.json(dbUsers);
  });

  // GET /api/subscribers
  app.get("/api/subscribers", (_req, res) => {
    res.json(dbSubscribers);
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

  // GET /api/image-library
  app.get("/api/image-library", (_req, res) => {
    res.json(dbImages);
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

  // Vite development middleware or production static serving
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express Backend + Headless CodeIgniter Bridge Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
