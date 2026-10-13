var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_config = require("dotenv/config");
var import_express = __toESM(require("express"), 1);

// src/lib/fetchPolyfill.ts
var import_https = require("https");
var import_http = require("http");
var import_url = require("url");
var TIMEOUT_MS = 15e3;
var MAX_REDIRECTS = 3;
function once(url, init, redirectsLeft) {
  return new Promise((resolve, reject) => {
    let parsed;
    try {
      parsed = new import_url.URL(url);
    } catch (err) {
      reject(new Error(`invalid URL: ${url}`));
      return;
    }
    const send = parsed.protocol === "http:" ? import_http.request : import_https.request;
    const body = init?.body === void 0 || init?.body === null ? void 0 : typeof init.body === "string" ? init.body : JSON.stringify(init.body);
    const headers = { ...init?.headers || {} };
    if (body !== void 0 && !Object.keys(headers).some((h) => h.toLowerCase() === "content-length")) {
      headers["Content-Length"] = String(Buffer.byteLength(body));
    }
    const req = send(
      {
        protocol: parsed.protocol,
        hostname: parsed.hostname,
        port: parsed.port || void 0,
        path: parsed.pathname + parsed.search,
        method: (init?.method || "GET").toUpperCase(),
        headers
      },
      (res) => {
        const status = res.statusCode || 0;
        const location = res.headers.location;
        if (status >= 300 && status < 400 && location && redirectsLeft > 0) {
          res.resume();
          resolve(once(new import_url.URL(location, url).toString(), init, redirectsLeft - 1));
          return;
        }
        const chunks = [];
        res.on("data", (c) => chunks.push(Buffer.from(c)));
        res.on("end", () => {
          const text = Buffer.concat(chunks).toString("utf8");
          resolve({
            ok: status >= 200 && status < 300,
            status,
            statusText: res.statusMessage || "",
            headers: {
              get: (name) => {
                const v = res.headers[name.toLowerCase()];
                return v === void 0 ? null : Array.isArray(v) ? v.join(", ") : String(v);
              }
            },
            async text() {
              return text;
            },
            async json() {
              return JSON.parse(text);
            }
          });
        });
      }
    );
    req.setTimeout(TIMEOUT_MS, () => req.destroy(new Error(`timeout after ${TIMEOUT_MS}ms`)));
    req.on("error", reject);
    if (body !== void 0) req.write(body);
    req.end();
  });
}
function ensureFetch() {
  const g = globalThis;
  if (typeof g.fetch === "function") return "native";
  g.fetch = (url, init) => once(String(url), init, MAX_REDIRECTS);
  return "shim";
}

// server.ts
var import_path2 = __toESM(require("path"), 1);
var import_fs2 = __toESM(require("fs"), 1);

// src/data/siteConfig.ts
var siteSetting = {
  id: 1,
  site_title: "News Forever",
  site_logo: "https://newsforever.in/assets/img/logo.png",
  favicon: "https://newsforever.in/assets/img/favicon.png",
  meta_default_title: "News Forever | Official News, Pageantry & FSIA Portal",
  meta_default_description: "Latest breaking news, beauty pageant updates, Forever Star India Awards, business, astrology, products and international editorial coverage.",
  meta_default_keywords: "news forever, beauty pageant, miss india, mrs india, forever star india awards, business news, astrology",
  facebook_url: "https://facebook.com/newsforever.in",
  twitter_url: "https://twitter.com/newsforever_in",
  instagram_url: "https://instagram.com/newsforever.in",
  youtube_url: "https://youtube.com/foreverstarindia",
  updated_at: ""
};

// src/lib/feeds.ts
var PUBLICATION_NAME = "News Forever";
var PUBLICATION_LANGUAGE = "en";
var NEWS_WINDOW_HOURS = 48;
var NEWS_MAX_ITEMS = 1e3;
var RSS_MAX_ITEMS = 50;
function xmlEscape(value) {
  return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");
}
function parseLegacyDate(raw) {
  const s = String(raw ?? "").trim();
  if (!s) return null;
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})(?:\s*[:T]?\s*(\d{2}):(\d{2})(?::(\d{2}))?)?/);
  if (!m) {
    const loose = new Date(s);
    return Number.isNaN(loose.getTime()) ? null : loose;
  }
  const [, y, mo, d, hh, mi, ss] = m;
  const year = Number(y);
  const month = Number(mo);
  const day = Number(d);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const dt = new Date(year, month - 1, day, Number(hh ?? 0), Number(mi ?? 0), Number(ss ?? 0));
  if (Number.isNaN(dt.getTime())) return null;
  if (dt.getFullYear() !== year || dt.getMonth() !== month - 1 || dt.getDate() !== day) return null;
  return dt;
}
function rfc822(d) {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const p = (n) => String(n).padStart(2, "0");
  return `${days[d.getUTCDay()]}, ${p(d.getUTCDate())} ${months[d.getUTCMonth()]} ${d.getUTCFullYear()} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())}:${p(d.getUTCSeconds())} GMT`;
}
function selectFeedArticles(blogs, opts = {}) {
  const now = opts.now ?? /* @__PURE__ */ new Date();
  const cutoff = opts.withinHours ? now.getTime() - opts.withinHours * 36e5 : null;
  const seen = /* @__PURE__ */ new Set();
  const out = [];
  for (const b of blogs) {
    if (b.status !== 1) continue;
    const slug = (b.url || "").trim();
    if (!slug || slug === "-") continue;
    if (/\s/.test(slug)) continue;
    const key = slug.toLowerCase();
    if (seen.has(key)) continue;
    const published = parseLegacyDate(b.created_at);
    if (!published) continue;
    if (published.getTime() > now.getTime() + 36e5) continue;
    if (cutoff !== null && published.getTime() < cutoff) continue;
    const title = (b.title || "").trim();
    if (!title) continue;
    seen.add(key);
    out.push({
      slug,
      title,
      summary: (b.short_content || b.meta_description || "").trim(),
      published,
      image: (b.og_image || b.image || "").trim() || void 0
    });
  }
  out.sort((a, z) => z.published.getTime() - a.published.getTime());
  return typeof opts.limit === "number" ? out.slice(0, opts.limit) : out;
}
function imageMimeType(url) {
  const ext = (url.split("?")[0].split("#")[0].match(/\.([a-z0-9]+)$/i) || [])[1];
  switch ((ext || "").toLowerCase()) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "gif":
      return "image/gif";
    case "avif":
      return "image/avif";
    default:
      return null;
  }
}
function articleUrl(origin, slug) {
  return `${origin.replace(/\/+$/, "")}/${encodeURI(slug)}`;
}
function buildNewsSitemap(blogs, origin, now = /* @__PURE__ */ new Date()) {
  const items = selectFeedArticles(blogs, {
    now,
    withinHours: NEWS_WINDOW_HOURS,
    limit: NEWS_MAX_ITEMS
  });
  const urls = items.map(
    (a) => `  <url>
    <loc>${xmlEscape(articleUrl(origin, a.slug))}</loc>
    <news:news>
      <news:publication>
        <news:name>${xmlEscape(PUBLICATION_NAME)}</news:name>
        <news:language>${PUBLICATION_LANGUAGE}</news:language>
      </news:publication>
      <news:publication_date>${a.published.toISOString()}</news:publication_date>
      <news:title>${xmlEscape(a.title)}</news:title>
    </news:news>
  </url>`
  ).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
` + (urls ? `${urls}
` : "") + `</urlset>
`;
}
function buildRssFeed(blogs, origin, now = /* @__PURE__ */ new Date(), opts = {}) {
  const base = origin.replace(/\/+$/, "");
  const items = selectFeedArticles(blogs, { now, limit: RSS_MAX_ITEMS });
  const channelTitle = opts.title || PUBLICATION_NAME;
  const channelDesc = opts.description || "National and international reporting from News Forever \u2014 breaking news, beauty pageants, Forever Star India Awards, business, lifestyle and astrology.";
  const lastBuild = items.length ? items[0].published : now;
  const body = items.map((a) => {
    const link = articleUrl(base, a.slug);
    const img = a.image && /^https?:\/\//i.test(a.image) ? a.image : "";
    const mime = img ? imageMimeType(img) : null;
    const bytes = img ? opts.imageBytes?.(img) : void 0;
    return `    <item>
      <title>${xmlEscape(a.title)}</title>
      <link>${xmlEscape(link)}</link>
      <guid isPermaLink="true">${xmlEscape(link)}</guid>
      <pubDate>${rfc822(a.published)}</pubDate>
` + (a.summary ? `      <description>${xmlEscape(a.summary)}</description>
` : "") + (img && mime ? `      <media:content url="${xmlEscape(img)}" medium="image" type="${mime}" />
` : "") + (img && mime && typeof bytes === "number" && bytes > 0 ? `      <enclosure url="${xmlEscape(img)}" type="${mime}" length="${bytes}" />
` : "") + `    </item>`;
  }).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"
     xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>${xmlEscape(channelTitle)}</title>
    <link>${xmlEscape(base + "/")}</link>
    <description>${xmlEscape(channelDesc)}</description>
    <language>${PUBLICATION_LANGUAGE}</language>
    <lastBuildDate>${rfc822(lastBuild)}</lastBuildDate>
    <atom:link href="${xmlEscape(base + "/feed")}" rel="self" type="application/rss+xml" />
` + (opts.logo && /^https?:\/\//i.test(opts.logo) ? `    <image>
      <url>${xmlEscape(opts.logo)}</url>
      <title>${xmlEscape(channelTitle)}</title>
      <link>${xmlEscape(base + "/")}</link>
    </image>
` : "") + (body ? `${body}
` : "") + `  </channel>
</rss>
`;
}

// src/lib/translateStore.ts
var import_fs = __toESM(require("fs"), 1);
var import_path = __toESM(require("path"), 1);
function fingerprint(...parts) {
  const text = parts.map((p) => p || "").join("\0");
  let h1 = 2166136261;
  let h2 = 16777619;
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 16777619);
    h2 = Math.imul(h2 + c, 2246822507) ^ h2 >>> 13;
  }
  return `${text.length.toString(36)}-${(h1 >>> 0).toString(36)}${(h2 >>> 0).toString(36)}`;
}
var DIR = process.env.TRANSLATION_CACHE_DIR || import_path.default.join(process.cwd(), ".nf-cache", "hi");
var TITLES_FILE = import_path.default.join(DIR, "_titles.json");
var MAX_TITLES = 5e3;
var mode = "unknown";
var memArticles = /* @__PURE__ */ new Map();
var titles = null;
var titlesDirty = false;
var titlesTimer = null;
function ensureDir() {
  if (mode === "disk") return true;
  if (mode === "memory") return false;
  try {
    import_fs.default.mkdirSync(DIR, { recursive: true });
    const probe = import_path.default.join(DIR, ".probe");
    import_fs.default.writeFileSync(probe, "ok");
    import_fs.default.unlinkSync(probe);
    mode = "disk";
  } catch {
    mode = "memory";
  }
  return mode === "disk";
}
function storeMode() {
  ensureDir();
  return mode;
}
function fileFor(slug) {
  const safe = slug.replace(/[^a-zA-Z0-9._-]/g, "_").replace(/\.{2,}/g, "_").replace(/^[._-]+/, "").slice(0, 120) || "untitled";
  return import_path.default.join(DIR, `${safe}.json`);
}
function loadArticle(slug, fp) {
  const fresh = (d) => d && d.translated && (!fp || !d.fp || d.fp === fp) ? d : null;
  const mem = fresh(memArticles.get(slug));
  if (mem) return mem;
  if (!ensureDir()) return null;
  try {
    const data = JSON.parse(import_fs.default.readFileSync(fileFor(slug), "utf8"));
    const ok = fresh(data);
    if (ok) {
      memArticles.set(slug, ok);
      return ok;
    }
    if (data?.translated) memArticles.delete(slug);
  } catch {
  }
  return null;
}
function saveArticle(slug, data) {
  if (!data?.translated) return;
  const withTime = { ...data, at: (/* @__PURE__ */ new Date()).toISOString() };
  memArticles.set(slug, withTime);
  if (!ensureDir()) return;
  try {
    import_fs.default.writeFileSync(fileFor(slug), JSON.stringify(withTime), "utf8");
  } catch {
  }
}
function loadTitles() {
  if (titles) return titles;
  titles = {};
  if (ensureDir()) {
    try {
      const parsed = JSON.parse(import_fs.default.readFileSync(TITLES_FILE, "utf8"));
      if (parsed && typeof parsed === "object") titles = parsed;
    } catch {
    }
  }
  return titles;
}
function saveTitles(pairs) {
  const all = loadTitles();
  let changed = false;
  for (const [en, hi] of Object.entries(pairs)) {
    if (en && hi && all[en] !== hi) {
      all[en] = hi;
      changed = true;
    }
  }
  if (!changed) return;
  const keys = Object.keys(all);
  if (keys.length > MAX_TITLES) {
    for (const k of keys.slice(0, keys.length - MAX_TITLES)) delete all[k];
  }
  titlesDirty = true;
  if (titlesTimer || !ensureDir()) return;
  titlesTimer = setTimeout(() => {
    titlesTimer = null;
    flushTitles();
  }, 500);
  if (typeof titlesTimer.unref === "function") titlesTimer.unref();
}
function flushTitles() {
  if (!titlesDirty || !titles) return;
  if (!ensureDir()) return;
  titlesDirty = false;
  try {
    import_fs.default.writeFileSync(TITLES_FILE, JSON.stringify(titles), "utf8");
  } catch {
  }
}
var exitHooked = false;
function hookExit() {
  if (exitHooked) return;
  exitHooked = true;
  const bye = () => flushTitles();
  process.on("beforeExit", bye);
  process.on("exit", bye);
  for (const sig of ["SIGTERM", "SIGINT"]) {
    process.on(sig, () => {
      flushTitles();
      process.exit(0);
    });
  }
}
hookExit();
function storeStats() {
  let onDisk = 0;
  if (ensureDir()) {
    try {
      onDisk = import_fs.default.readdirSync(DIR).filter((f) => f.endsWith(".json") && f !== "_titles.json").length;
    } catch {
      onDisk = 0;
    }
  }
  return {
    mode: storeMode(),
    dir: DIR,
    articles: Math.max(onDisk, memArticles.size),
    titles: Object.keys(loadTitles()).length
  };
}

// src/lib/translate.ts
var lastFailure = "";
function lastTranslationError() {
  return lastFailure;
}
var lastProvider = "none";
var cache = /* @__PURE__ */ new Map();
async function chromeTranslate(text, target = "hi") {
  const url = "https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl=en&tl=" + target + "&q=" + encodeURIComponent(text);
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  if (!res.ok) throw new Error(`chrome ${res.status}`);
  const data = await res.json();
  const first = Array.isArray(data) ? data[0] : null;
  const out = typeof first === "string" ? first : Array.isArray(first) ? String(first[0] ?? "") : "";
  if (!out) throw new Error("chrome empty");
  return out;
}
var MYMEMORY_MAX = 480;
async function myMemoryTranslate(text, target = "hi") {
  if (text.length > MYMEMORY_MAX) throw new Error("mymemory too long");
  const url = "https://api.mymemory.translated.net/get?langpair=en%7C" + target + "&q=" + encodeURIComponent(text);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`mymemory ${res.status}`);
  const data = await res.json();
  const out = data?.responseData?.translatedText;
  if (!out || /MYMEMORY WARNING|QUERY LENGTH LIMIT/i.test(String(out))) {
    throw new Error(`mymemory ${data?.responseStatus || "rejected"}`);
  }
  return String(out);
}
async function gtxTranslate(text, target = "hi") {
  if (!text.trim()) return text;
  const url = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=" + target + "&dt=t&q=" + encodeURIComponent(text);
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  if (!res.ok) throw new Error(`gtx ${res.status}`);
  const data = await res.json();
  return (data[0] || []).map((seg) => seg[0]).join("");
}
async function geminiTranslate(text, apiKey) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `Translate the following news text to natural Hindi. Return ONLY the translation, no commentary:

${text}`
              }
            ]
          }
        ]
      })
    }
  );
  if (!res.ok) throw new Error(`gemini ${res.status}`);
  const data = await res.json();
  const out = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!out) throw new Error("gemini empty");
  return out.trim();
}
var sleep = (ms) => new Promise((r) => setTimeout(r, ms));
var BATCH = 4;
var BATCH_PAUSE_MS = 150;
async function translateOnce(text) {
  try {
    return await translateText(text);
  } catch (err) {
    if (!/429|rate|timeout|ECONN|socket/i.test(String(err?.message || err))) throw err;
    await sleep(600);
    return translateText(text);
  }
}
var preferred = "";
async function translateText(text) {
  const key = process.env.GEMINI_API_KEY;
  const chain = [];
  if (key) chain.push({ name: "gemini", run: () => geminiTranslate(text, key) });
  chain.push({ name: "gtx", run: () => gtxTranslate(text) });
  chain.push({ name: "chrome", run: () => chromeTranslate(text) });
  chain.push({ name: "mymemory", run: () => myMemoryTranslate(text) });
  const ordered = preferred ? [...chain.filter((c) => c.name === preferred), ...chain.filter((c) => c.name !== preferred)] : chain;
  const errors = [];
  for (const provider of ordered) {
    try {
      const out = await provider.run();
      if (out && out.trim()) {
        lastProvider = provider.name;
        preferred = provider.name;
        return out;
      }
      errors.push(`${provider.name}: empty`);
    } catch (err) {
      errors.push(`${provider.name}: ${err?.message || err}`);
    }
  }
  preferred = "";
  lastFailure = errors.join("; ");
  throw new Error(lastFailure);
}
async function translateHtml(html) {
  const tokens = html.split(/(<[^>]+>)/g);
  const jobs = [];
  tokens.forEach((tok, index) => {
    if (!tok.startsWith("<") && tok.replace(/&nbsp;|\s/g, "").length > 1) {
      jobs.push({ index, text: tok });
    }
  });
  let done = 0;
  for (let i = 0; i < jobs.length; i += BATCH) {
    if (i > 0) await sleep(BATCH_PAUSE_MS);
    const slice = jobs.slice(i, i + BATCH);
    const results = await Promise.all(
      slice.map((j) => translateOnce(j.text).then((t) => {
        done++;
        return t;
      }).catch(() => j.text))
    );
    results.forEach((r, k) => {
      tokens[slice[k].index] = r;
    });
  }
  if (jobs.length > 0 && done === 0) throw new Error(lastFailure || "no text could be translated");
  return tokens.join("");
}
var titleCache = /* @__PURE__ */ new Map();
var titlesSeeded = false;
function seedTitles() {
  if (titlesSeeded) return;
  titlesSeeded = true;
  for (const [en, hi] of Object.entries(loadTitles())) titleCache.set(en, hi);
}
async function translateTitles(titles2) {
  seedTitles();
  const out = {};
  const pending = [...new Set(titles2)].filter((t) => t && t.length > 3).slice(0, 80);
  const todo = pending.filter((t) => !titleCache.has(t));
  lastFailure = "";
  for (let i = 0; i < todo.length; i += BATCH) {
    if (i > 0) await sleep(BATCH_PAUSE_MS);
    const slice = todo.slice(i, i + BATCH);
    const results = await Promise.all(slice.map((t) => translateOnce(t).catch(() => null)));
    const fresh = {};
    results.forEach((r, k) => {
      if (r) {
        titleCache.set(slice[k], r);
        fresh[slice[k]] = r;
      }
    });
    saveTitles(fresh);
  }
  for (const t of pending) out[t] = titleCache.get(t) || t;
  return out;
}
async function translateArticle(article) {
  const fp = fingerprint(article.title, article.content, article.meta_description);
  const cacheKey = `hi:${article.url}:${fp}`;
  const hit = cache.get(cacheKey);
  if (hit) return hit;
  const stored = loadArticle(article.url, fp);
  if (stored?.translated) {
    cache.set(cacheKey, stored);
    return { ...stored, provider: stored.provider || "cache" };
  }
  lastFailure = "";
  const field = async (text, html = false) => {
    if (!text || !text.trim()) return text || "";
    try {
      return html ? await translateHtml(text) : await translateText(text);
    } catch {
      return null;
    }
  };
  const [title, description, meta_title, meta_description, meta_keyword] = await Promise.all([
    field(article.title),
    field(article.content || "", true),
    field(article.meta_title || article.title),
    field(article.meta_description || ""),
    field(article.meta_keyword || "")
  ]);
  const gotAnything = title !== null || description !== null;
  if (!gotAnything) {
    console.warn("translateArticle: no field could be translated \u2014", lastFailure || "unknown");
    return { translated: false, reason: lastFailure || "provider unavailable", provider: "none" };
  }
  const out = {
    translated: true,
    title: title ?? article.title,
    description: description ?? article.content,
    meta_title: meta_title ?? article.meta_title,
    meta_description: meta_description ?? article.meta_description,
    meta_keyword: meta_keyword ?? article.meta_keyword,
    provider: lastProvider,
    ...lastFailure ? { reason: `partial: ${lastFailure}` } : {}
  };
  cache.set(cacheKey, out);
  saveArticle(article.url, { ...out, fp });
  return out;
}

// src/lib/db.ts
var import_promise = __toESM(require("mysql2/promise"), 1);

// src/lib/taxonomy.ts
var SLUG_ALIASES = {
  "miss-india": ["miss-india"],
  "mrs-india": ["mrs-india", "forever-mrs-india"],
  "miss-teen-india": ["miss-teen-india", "forever-miss-teen-india"],
  "city-finalists": ["city-winner", "city-finalist"],
  "state-winners": ["state-winner"],
  "national-achiever-award": ["national-achiever"],
  news: ["business-news", "astrology", "products", "franchise"],
  lifestyle: ["products", "franchise"],
  "political-news": ["political-news", "politics", "political"],
  // Broad editorial labels → legacy category groups
  "fashion-glamour": ["beauty-pageant", "miss-india", "mrs-india", "miss-teen-india"],
  entertainment: [
    "forever-star-india-awards",
    "forever-star-india",
    "super-woman-award",
    "super-hero-award",
    "national-achiever",
    "nominate-yourself-award",
    "star-india-kids-contest"
  ]
};
function resolveCategoryIds(slug, categories) {
  const wanted = slug.toLowerCase();
  const prefixes = SLUG_ALIASES[wanted] || [wanted];
  const matched = /* @__PURE__ */ new Set();
  for (const cat of categories) {
    const url = (cat.slug || "").toLowerCase().trim();
    if (prefixes.some((p) => url === p || url.startsWith(p + "-") || url.startsWith(p))) {
      matched.add(cat.id);
    }
  }
  let grew = true;
  while (grew) {
    grew = false;
    for (const cat of categories) {
      if (cat.parent_id && matched.has(cat.parent_id) && !matched.has(cat.id)) {
        matched.add(cat.id);
        grew = true;
      }
    }
  }
  return matched;
}

// src/lib/editorial.ts
var NEWSROOM_BYLINE = "News Forever Bureau";
var GENERIC_AUTHOR_NAMES = /* @__PURE__ */ new Set([
  "admin",
  "admin user",
  "administrator",
  "superadmin",
  "super admin",
  "test user",
  "user",
  "news forever",
  // The house byline is itself a "no attributed person" sentinel, and it must
  // survive a round trip. `mapBlogRow` substitutes it into `author_name`
  // before the UI ever sees the row, so on the live-DB path the presentation
  // layer receives "News Forever Bureau" rather than "Admin User". Without
  // this entry it would read as a real name and be rendered as "Written by …"
  // with Person microdata and a Person JSON-LD author — re-attributing the
  // article to a person who does not exist, which is the exact failure this
  // helper exists to prevent. Derived from the constant so the two cannot
  // drift apart.
  NEWSROOM_BYLINE.toLowerCase()
]);
function resolveAuthorName(rawName) {
  const name = String(rawName || "").trim().replace(/\s+/g, " ");
  if (!name) return null;
  return GENERIC_AUTHOR_NAMES.has(name.toLowerCase()) ? null : name;
}

// src/lib/db.ts
var dbPool = import_promise.default.createPool({
  host: process.env.MYSQL_HOST || "localhost",
  user: process.env.MYSQL_USER || "jaipurwe_fsianews",
  password: process.env.MYSQL_PASSWORD || "",
  database: process.env.MYSQL_DATABASE || "jaipurwe_fsianews",
  waitForConnections: true,
  // Small pool: each Vercel lambda instance holds its own pool against a
  // shared-hosting MySQL with a low max_user_connections cap
  connectionLimit: parseInt(process.env.MYSQL_POOL_LIMIT || "3", 10),
  queueLimit: 0,
  connectTimeout: 8e3
});
var ASSET_BASE = (process.env.LEGACY_ASSET_BASE || "https://newsforever.in/").replace(/\/$/, "") + "/";
function assetUrl(path3) {
  const p = (path3 || "").trim();
  if (!p) return "";
  if (/^https?:\/\//i.test(p)) return p;
  return ASSET_BASE + p.replace(/^\//, "");
}
function stripHtml(html) {
  return (html || "").replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, " ").trim();
}
function mapBlogRow(row, index = 0) {
  const summarySource = row.meta_description?.trim() || stripHtml(row.description);
  const summary = summarySource.length > 220 ? summarySource.slice(0, 217).trimEnd() + "\u2026" : summarySource;
  const author = [row.author_firstname, row.author_lastname].filter(Boolean).join(" ").trim();
  return {
    id: row.id,
    title: row.title,
    url: (row.url || "").trim(),
    short_content: summary,
    content: row.description || "",
    category_id: row.cat_id,
    sub_category_id: row.sub_cat_id,
    category_name: row.sub_category_name || row.category_name || "News",
    tag_ids: (row.tag_id || "").split(",").map((t) => parseInt(t, 10)).filter((n) => !isNaN(n)),
    image: assetUrl(row.image),
    alt_tag: row.alt_tag || row.title,
    status: row.status,
    is_featured: index === 0,
    is_trending: index > 0 && index < 4,
    author_id: row.user_created_by,
    // The ci_admin join above gives the account's real firstname/lastname.
    // Shared operations logins ("Admin User") are not bylines — see
    // resolveAuthorName — so those fall back to the newsroom.
    author_name: resolveAuthorName(author) || NEWSROOM_BYLINE,
    views: row.views ?? 0,
    created_at: row.created_at || "",
    updated_at: row.created_at || "",
    meta_title: row.meta_title || row.title,
    meta_description: row.meta_description || summary,
    meta_keyword: row.meta_keyword || "",
    // Fall through to meta_title, not straight to title. An editor who
    // rewrites the Meta Title and leaves OG Title blank expects the share
    // card to follow; with `|| row.title` it silently kept the old headline,
    // because every consumer downstream sees og_title as already set.
    og_title: row.og_title?.trim() || row.meta_title?.trim() || row.title,
    // Use the stored og_url only if it is clean (no whitespace); otherwise
    // rebuild it from the trimmed slug so legacy "…/ slug" values can't break
    // the canonical / share URL.
    og_url: (row.og_url || "").trim() && !/\s/.test((row.og_url || "").trim()) ? (row.og_url || "").trim() : `https://newsforever.in/${(row.url || "").trim()}`,
    og_description: row.og_description || summary,
    og_image: assetUrl(row.og_image || row.image),
    h2_tag: row.h2_tag,
    h3_tag: row.h3_tag,
    h4_tag: row.h4_tag,
    h5_tag: row.h5_tag,
    h6_tag: row.h6_tag,
    person_name: (row.person_name || "").trim(),
    youtube_video_link: (row.youtube_video_link || "").trim() || void 0
  };
}
function mapCategoryRow(row) {
  return {
    id: row.id,
    parent_id: row.parent_id,
    category_name: row.cat_name,
    slug: (row.url || "").trim(),
    status: row.status,
    article_count: row.article_count ?? 0,
    meta_title: row.meta_title || row.cat_name,
    meta_description: row.meta_description || "",
    created_at: row.created_at || ""
  };
}
var isDbOfflineLogged = false;
function handleDbError(context, err) {
  if (err?.code === "ECONNREFUSED" || err?.code === "ETIMEDOUT" || err?.code === "ENOTFOUND") {
    if (!isDbOfflineLogged) {
      console.info(`[MySQL Data Provider] Connection at ${process.env.MYSQL_HOST || "localhost"} unavailable (${err.code}).`);
      isDbOfflineLogged = true;
    }
  } else {
    console.warn(`[MySQL Data Provider] ${context}:`, err?.message || err);
  }
}
var BLOG_SELECT = `
  SELECT b.id, b.user_created_by, b.title, b.cat_id, b.sub_cat_id, b.type, b.tag_id, b.youtube_video_link,
         b.image, b.alt_tag, b.url, b.meta_title, b.meta_keyword, b.meta_description,
         b.h2_tag, b.h3_tag, b.h4_tag, b.h5_tag, b.h6_tag,
         b.og_title, b.og_url, b.og_description, b.og_image,
         b.person_name, b.views,
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
async function getPublishedBlogs(limit = 50, categorySlug) {
  try {
    let where = "WHERE b.status = 1";
    const params = [];
    if (categorySlug && categorySlug !== "all") {
      const cats = await getAllCategories();
      const ids = resolveCategoryIds(categorySlug, cats.map((c) => ({ id: c.id, parent_id: c.parent_id, slug: c.slug })));
      if (ids.size === 0) return [];
      const placeholders = [...ids].map(() => "?").join(",");
      where += ` AND (b.cat_id IN (${placeholders}) OR b.sub_cat_id IN (${placeholders}))`;
      params.push(...ids, ...ids);
    }
    const query = `${BLOG_SELECT} ${where} ORDER BY b.created_at DESC, b.id DESC LIMIT ?`;
    params.push(limit);
    const [rows] = await dbPool.query(query, params);
    return rows.map((row, i) => mapBlogRow(row, i));
  } catch (err) {
    handleDbError("getPublishedBlogs", err);
    return [];
  }
}
var searchIndexCache = null;
var SEARCH_INDEX_CACHE_MS = 3e5;
async function getSearchIndex() {
  if (searchIndexCache && Date.now() - searchIndexCache.at < SEARCH_INDEX_CACHE_MS) {
    return searchIndexCache.data;
  }
  try {
    const query = `
      SELECT b.id, b.title, b.url, b.image, b.alt_tag, b.cat_id, b.sub_cat_id,
             b.meta_keyword, b.meta_description, b.created_at,
             LEFT(b.description, 400) AS description_head,
             c.cat_name AS category_name,
             sc.cat_name AS sub_category_name,
             a.firstname AS author_firstname,
             a.lastname AS author_lastname
      FROM ci_blog b
      LEFT JOIN ci_category c ON b.cat_id = c.id
      LEFT JOIN ci_category sc ON b.sub_cat_id = sc.id
      LEFT JOIN ci_admin a ON b.user_created_by = a.admin_id
      WHERE b.status = 1
      ORDER BY b.created_at DESC, b.id DESC
    `;
    const [rows] = await dbPool.query(query);
    const data = rows.map((row) => {
      const summarySource = row.meta_description?.trim() || stripHtml(row.description_head || "");
      const author = [row.author_firstname, row.author_lastname].filter(Boolean).join(" ").trim();
      return {
        id: row.id,
        title: row.title || "",
        url: (row.url || "").trim(),
        short_content: summarySource.length > 180 ? summarySource.slice(0, 177).trimEnd() + "\u2026" : summarySource,
        category_id: row.cat_id,
        sub_category_id: row.sub_cat_id,
        category_name: row.sub_category_name || row.category_name || "News",
        image: assetUrl(row.image),
        alt_tag: row.alt_tag || row.title || "",
        author_name: resolveAuthorName(author) || NEWSROOM_BYLINE,
        meta_keyword: row.meta_keyword || "",
        created_at: row.created_at || ""
      };
    });
    searchIndexCache = { data, at: Date.now() };
    return data;
  } catch (err) {
    handleDbError("getSearchIndex", err);
    return [];
  }
}
async function incrementBlogViews(id) {
  try {
    await dbPool.query(`UPDATE ci_blog SET views = views + 1 WHERE id = ?`, [id]);
  } catch (err) {
    handleDbError("incrementBlogViews", err);
  }
}
async function incrementAdClick(id) {
  try {
    if (!await adHasColumn("click_count")) return;
    await dbPool.query(`UPDATE ci_advertisement SET click_count = click_count + 1 WHERE id = ?`, [id]);
  } catch (err) {
    handleDbError("incrementAdClick", err);
  }
}
async function getBlogByUrlSlug(urlSlug) {
  try {
    const query = `${BLOG_SELECT} WHERE TRIM(b.url) = ? AND b.status = 1 LIMIT 1`;
    const [rows] = await dbPool.query(query, [urlSlug.trim()]);
    const list = rows;
    return list.length > 0 ? mapBlogRow(list[0]) : null;
  } catch (err) {
    handleDbError("getBlogByUrlSlug", err);
    return null;
  }
}
var categoriesCache = null;
var CATEGORY_CACHE_MS = 6e4;
async function getAllCategories() {
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
    const data = rows.map(mapCategoryRow);
    categoriesCache = { data, at: Date.now() };
    return data;
  } catch (err) {
    handleDbError("getAllCategories", err);
    return [];
  }
}
async function getImageLibrary(limit = 300) {
  try {
    const [rows] = await dbPool.query(
      `SELECT id, user_id, url, image, created_at FROM ci_imagelibrary ORDER BY id DESC LIMIT ?`,
      [limit]
    );
    return rows.map((r) => ({
      id: r.id,
      file_name: String(r.image || "").split("/").pop() || String(r.image || ""),
      file_path: assetUrl(r.image),
      file_size: "",
      alt_tag: r.url || "",
      uploaded_by: String(r.user_id || ""),
      created_at: r.created_at || ""
    }));
  } catch (err) {
    handleDbError("getImageLibrary", err);
    return [];
  }
}
async function getSubscribers(limit = 500) {
  try {
    const [rows] = await dbPool.query(
      `SELECT id, email, created_at FROM ci_subscribe ORDER BY id DESC LIMIT ?`,
      [limit]
    );
    return rows.map((r) => ({
      id: r.id,
      email: r.email,
      status: "subscribed",
      subscribed_at: r.created_at || ""
    }));
  } catch (err) {
    handleDbError("getSubscribers", err);
    return [];
  }
}
async function getAdminUsers() {
  try {
    const [rows] = await dbPool.query(
      `SELECT admin_id, username, firstname, lastname, email, image, is_active, is_supper, last_login FROM ci_admin ORDER BY admin_id ASC`
    );
    return rows.map((r) => ({
      id: r.admin_id,
      username: [r.firstname, r.lastname].filter(Boolean).join(" ").trim() || r.username,
      email: r.email || "",
      role: r.is_supper ? "Super Admin" : "Senior Editor",
      avatar: assetUrl(r.image),
      status: r.is_active ? 1 : 0,
      last_login: r.last_login ? String(r.last_login) : ""
    }));
  } catch (err) {
    handleDbError("getAdminUsers", err);
    return [];
  }
}
async function getSubAdmins() {
  try {
    const [rows] = await dbPool.query(
      `SELECT id, username, firstname, lastname, email, mobile_no, is_active, is_verify, created_at FROM ci_subadmin ORDER BY id ASC`
    );
    return rows.map((r) => ({
      id: r.id,
      username: [r.firstname, r.lastname].filter(Boolean).join(" ").trim() || r.username,
      email: r.email || "",
      role: "Contributor",
      avatar: "",
      status: r.is_active ? 1 : 0,
      last_login: r.created_at ? String(r.created_at) : ""
    }));
  } catch (err) {
    handleDbError("getSubAdmins", err);
    return [];
  }
}
var activityLabelCache = null;
async function getActivityLabels() {
  if (activityLabelCache) return activityLabelCache;
  const map = /* @__PURE__ */ new Map();
  try {
    const [rows] = await dbPool.query(`SELECT * FROM ci_activity_status LIMIT 500`);
    for (const row of rows) {
      const id = Number(row.id ?? row.activity_id ?? row.status_id);
      if (!Number.isFinite(id)) continue;
      const entry = Object.entries(row).find(
        ([k, v]) => typeof v === "string" && v.trim() !== "" && !/^\d+$/.test(v.trim()) && !/(date|time|created|updated|ip)/i.test(k)
      );
      if (entry) map.set(id, String(entry[1]).trim());
    }
  } catch {
  }
  activityLabelCache = map;
  return map;
}
async function getActivityLogs(limit = 100) {
  try {
    const labels = await getActivityLabels();
    const [rows] = await dbPool.query(
      `SELECT l.id, l.activity_id, l.user_id, l.admin_id, l.created_at,
              a.username, a.firstname, a.lastname
       FROM ci_activity_log l
       LEFT JOIN ci_admin a ON l.admin_id = a.admin_id
       ORDER BY l.id DESC LIMIT ?`,
      [limit]
    );
    return rows.map((r) => ({
      id: r.id,
      user_id: r.user_id || r.admin_id,
      user_name: [r.firstname, r.lastname].filter(Boolean).join(" ").trim() || r.username || `Admin #${r.admin_id}`,
      activity: labels.get(Number(r.activity_id)) || `Activity code ${r.activity_id}`,
      module: "Legacy CMS",
      ip_address: "",
      created_at: r.created_at ? String(r.created_at) : ""
    }));
  } catch (err) {
    handleDbError("getActivityLogs", err);
    return [];
  }
}
var ACTIVITY_KEY = "nf_activity_log";
var ACTIVITY_KEEP = 300;
async function getPanelActivity() {
  try {
    const [rows] = await dbPool.query(
      `SELECT page_description FROM ci_setting WHERE page_key = ? LIMIT 1`,
      [ACTIVITY_KEY]
    );
    const list = rows;
    if (!list.length) return [];
    const parsed = JSON.parse(list[0].page_description || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    handleDbError("getPanelActivity", err);
    return [];
  }
}
async function appendPanelActivity(entry) {
  try {
    const current = await getPanelActivity();
    const next = [entry, ...current].slice(0, ACTIVITY_KEEP);
    const json = JSON.stringify(next);
    const [rows] = await dbPool.query(`SELECT id FROM ci_setting WHERE page_key = ? LIMIT 1`, [ACTIVITY_KEY]);
    if (rows.length > 0) {
      await dbPool.query(`UPDATE ci_setting SET page_description = ? WHERE page_key = ?`, [json, ACTIVITY_KEY]);
    } else {
      await dbPool.query(
        `INSERT INTO ci_setting (page_key, page_description, email, phone, address, map, status) VALUES (?, ?, '', '', '', '', 1)`,
        [ACTIVITY_KEY, json]
      );
    }
  } catch (err) {
    handleDbError("appendPanelActivity", err);
  }
}
var CONFIG_KEY = "nf_site_config";
async function getSiteConfig() {
  try {
    const [rows] = await dbPool.query(`SELECT page_description FROM ci_setting WHERE page_key = ? LIMIT 1`, [CONFIG_KEY]);
    const list = rows;
    if (list.length === 0) return {};
    return JSON.parse(list[0].page_description || "{}");
  } catch (err) {
    handleDbError("getSiteConfig", err);
    return {};
  }
}
async function saveSiteConfig(config) {
  const json = JSON.stringify({
    headerColor: config.headerColor || "",
    footerColor: config.footerColor || "",
    navExtra: Array.isArray(config.navExtra) ? config.navExtra.map(Number).slice(0, 12) : [],
    logoUrl: (config.logoUrl || "").slice(0, 500),
    siteTitle: (config.siteTitle || "").slice(0, 300),
    siteDescription: (config.siteDescription || "").slice(0, 600),
    siteKeywords: (config.siteKeywords || "").slice(0, 600),
    ogImage: (config.ogImage || "").slice(0, 500),
    showTicker: config.showTicker !== false,
    // default visible
    tickerText: (config.tickerText || "").slice(0, 2e3),
    homeH1: (config.homeH1 || "").slice(0, 200),
    homeIntro: (config.homeIntro || "").slice(0, 600)
  });
  const [rows] = await dbPool.query(`SELECT id FROM ci_setting WHERE page_key = ? LIMIT 1`, [CONFIG_KEY]);
  if (rows.length > 0) {
    await dbPool.query(`UPDATE ci_setting SET page_description = ? WHERE page_key = ?`, [json, CONFIG_KEY]);
  } else {
    await dbPool.query(
      `INSERT INTO ci_setting (page_key, page_description, email, phone, address, map, status) VALUES (?, ?, '', '', '', '', 1)`,
      [CONFIG_KEY, json]
    );
  }
  return getSiteConfig();
}
var PAGE_PREFIX = "nf_page_";
async function getStaticPage(slug) {
  const readKey = async (key) => {
    const [rows] = await dbPool.query(`SELECT page_description FROM ci_setting WHERE page_key = ? LIMIT 1`, [key]);
    const list = rows;
    if (list.length === 0) return null;
    const raw = (list[0].page_description || "").trim();
    if (!raw) return {};
    try {
      const j = JSON.parse(raw);
      if (j && typeof j === "object") return j;
    } catch {
    }
    return { content: raw };
  };
  try {
    const primary = await readKey(PAGE_PREFIX + slug);
    if (primary && (primary.content || primary.title || primary.meta_title || primary.meta_description)) return primary;
    const legacy = await readKey(slug.replace(/-/g, "_"));
    return legacy || primary || {};
  } catch (err) {
    handleDbError("getStaticPage", err);
    return {};
  }
}
async function getAllStaticPages() {
  try {
    const [rows] = await dbPool.query(
      `SELECT page_key, page_description FROM ci_setting WHERE page_key LIKE ?`,
      [PAGE_PREFIX + "%"]
    );
    return rows.map((r) => {
      const slug = String(r.page_key).slice(PAGE_PREFIX.length);
      let title = slug;
      try {
        const d = JSON.parse(r.page_description || "{}");
        title = d.title || d.meta_title || slug;
      } catch {
      }
      return { slug, title };
    });
  } catch (err) {
    handleDbError("getAllStaticPages", err);
    return [];
  }
}
async function deleteStaticPage(slug) {
  try {
    const [r] = await dbPool.query(`DELETE FROM ci_setting WHERE page_key = ?`, [PAGE_PREFIX + slug]);
    return r.affectedRows > 0;
  } catch (err) {
    handleDbError("deleteStaticPage", err);
    return false;
  }
}
async function saveStaticPage(slug, data) {
  const json = JSON.stringify({
    title: (data.title || "").slice(0, 300),
    content: (data.content || "").slice(0, 1e5),
    meta_title: (data.meta_title || "").slice(0, 300),
    meta_description: (data.meta_description || "").slice(0, 600),
    meta_keyword: (data.meta_keyword || "").slice(0, 600)
  });
  const key = PAGE_PREFIX + slug;
  const [rows] = await dbPool.query(`SELECT id FROM ci_setting WHERE page_key = ? LIMIT 1`, [key]);
  if (rows.length > 0) {
    await dbPool.query(`UPDATE ci_setting SET page_description = ? WHERE page_key = ?`, [json, key]);
  } else {
    await dbPool.query(
      `INSERT INTO ci_setting (page_key, page_description, email, phone, address, map, status) VALUES (?, ?, '', '', '', '', 1)`,
      [key, json]
    );
  }
  return getStaticPage(slug);
}
function toAdColumns(payload) {
  const cols = {};
  if (payload.title !== void 0) cols.advertisement_title = payload.title;
  if (payload.url !== void 0) cols.advertisement_url = payload.url;
  if (payload.advertisement_image !== void 0) cols.advertisement_image = toLegacyAssetPath(payload.advertisement_image);
  if (payload.alt_tag !== void 0) cols.alt_tag = payload.alt_tag;
  if (payload.position !== void 0) cols.position = payload.position;
  if (payload.priority !== void 0) cols.priority = payload.priority;
  if (payload.status !== void 0) cols.status = payload.status;
  return cols;
}
var tableColumnCache = /* @__PURE__ */ new Map();
async function describeTable(table) {
  const cached = tableColumnCache.get(table);
  if (cached) return cached;
  let cols = [];
  try {
    const [rows] = await dbPool.query(`SHOW COLUMNS FROM \`${table}\``);
    cols = rows.map((r) => ({
      name: String(r.Field),
      nullable: String(r.Null).toUpperCase() === "YES",
      hasDefault: r.Default !== null && r.Default !== void 0,
      type: String(r.Type || "").toLowerCase(),
      isAuto: String(r.Extra || "").toLowerCase().includes("auto_increment")
    }));
  } catch (err) {
    handleDbError("describeTable:" + table, err);
    cols = [];
  }
  tableColumnCache.set(table, cols);
  return cols;
}
function emptyValueFor(col) {
  if (/int|decimal|float|double|bit|year/.test(col.type)) return 0;
  if (/datetime|timestamp/.test(col.type)) return legacyNow();
  if (/^date/.test(col.type)) return legacyNow().slice(0, 10);
  return "";
}
async function createAd(payload) {
  const defaults = {
    advertisement_title: "",
    advertisement_url: "",
    advertisement_image: "",
    alt_tag: "",
    priority: 2,
    position: "right",
    status: 1
  };
  const wanted = { ...defaults, ...toAdColumns(payload), created_at: legacyNow() };
  const schema = await describeTable("ci_advertisement");
  const row = {};
  if (schema.length === 0) {
    Object.assign(row, wanted);
  } else {
    const known = new Set(schema.map((c) => c.name));
    for (const [k, v] of Object.entries(wanted)) if (known.has(k)) row[k] = v;
    for (const col of schema) {
      if (col.isAuto || col.nullable || col.hasDefault) continue;
      if (row[col.name] === void 0) row[col.name] = emptyValueFor(col);
    }
  }
  const names = Object.keys(row);
  await dbPool.query(
    `INSERT INTO ci_advertisement (${names.map((n) => `\`${n}\``).join(",")}) VALUES (${names.map(() => "?").join(",")})`,
    names.map((n) => row[n])
  );
  return getAllAdsAdmin();
}
async function updateAd(id, payload) {
  const cols = toAdColumns(payload);
  const schema = await describeTable("ci_advertisement");
  const known = schema.length ? new Set(schema.map((c) => c.name)) : null;
  const names = Object.keys(cols).filter((n) => !known || known.has(n));
  if (names.length > 0) {
    await dbPool.query(
      `UPDATE ci_advertisement SET ${names.map((n) => `\`${n}\` = ?`).join(", ")} WHERE id = ?`,
      [...names.map((n) => cols[n]), id]
    );
  }
  return getAllAdsAdmin();
}
async function deleteAd(id) {
  const [result] = await dbPool.query(`DELETE FROM ci_advertisement WHERE id = ?`, [id]);
  return result.affectedRows > 0;
}
async function createCategory(payload) {
  const row = {
    parent_id: payload.parent_id ?? 0,
    url: normaliseSlug(payload.slug),
    cat_name: payload.category_name || "",
    meta_title: payload.meta_title || payload.category_name || "",
    meta_keyword: "",
    meta_description: payload.meta_description || "",
    h2_tag: "",
    h3_tag: "",
    h4_tag: "",
    h5_tag: "",
    h6_tag: "",
    og_title: "",
    og_url: "",
    og_description: "",
    og_image: "",
    status: payload.status ?? 1,
    created_at: legacyNow()
  };
  const names = Object.keys(row);
  await dbPool.query(
    `INSERT INTO ci_category (${names.map((n) => `\`${n}\``).join(",")}) VALUES (${names.map(() => "?").join(",")})`,
    names.map((n) => row[n])
  );
  categoriesCache = null;
  return getAllCategories();
}
async function updateCategory(id, payload) {
  const cols = {};
  if (payload.category_name !== void 0) cols.cat_name = payload.category_name;
  if (payload.slug !== void 0) cols.url = normaliseSlug(payload.slug);
  if (payload.parent_id !== void 0) cols.parent_id = payload.parent_id;
  if (payload.status !== void 0) cols.status = payload.status;
  if (payload.meta_title !== void 0) cols.meta_title = payload.meta_title;
  if (payload.meta_description !== void 0) cols.meta_description = payload.meta_description;
  const names = Object.keys(cols);
  if (names.length > 0) {
    await dbPool.query(
      `UPDATE ci_category SET ${names.map((n) => `\`${n}\` = ?`).join(", ")} WHERE id = ?`,
      [...names.map((n) => cols[n]), id]
    );
  }
  categoriesCache = null;
  return getAllCategories();
}
async function deleteCategory(id) {
  const [result] = await dbPool.query(`DELETE FROM ci_category WHERE id = ?`, [id]);
  categoriesCache = null;
  return result.affectedRows > 0;
}
async function getActiveTags() {
  try {
    const [rows] = await dbPool.query(
      `SELECT t.id, t.tag_name, t.url, t.created_at,
              (SELECT COUNT(*) FROM ci_blog b
                WHERE b.status = 1
                  AND FIND_IN_SET(t.id, REPLACE(IFNULL(b.tag_id, ''), ' ', '')) > 0
              ) AS article_count
         FROM ci_tag t
        WHERE t.status = 1
        ORDER BY t.id ASC`
    );
    return rows.map((row) => ({
      id: row.id,
      tag_name: row.tag_name,
      slug: (row.url || "").trim(),
      created_at: row.created_at || "",
      article_count: Number(row.article_count) || 0
    }));
  } catch (err) {
    handleDbError("getActiveTags", err);
    return [];
  }
}
var slugifyTag = (s) => (s || "").toLowerCase().trim().replace(/[^\p{L}\p{N}\p{M}-]+/gu, "-").replace(/-{2,}/g, "-").replace(/^-+|-+$/g, "");
async function createTag(data) {
  const url = data.slug && data.slug.trim() || slugifyTag(data.tag_name);
  await dbPool.query(
    `INSERT INTO ci_tag (url, tag_name, meta_title, meta_keyword, meta_description, h2_tag, h3_tag, h4_tag, h5_tag, h6_tag, og_title, og_url, og_description, og_image, status, created_at)
     VALUES (?, ?, '', '', '', '', '', '', '', '', '', '', '', '', ?, ?)`,
    [url, data.tag_name, data.status ?? 1, legacyNow()]
  );
  return getActiveTags();
}
async function updateTag(id, data) {
  const cols = {};
  if (data.tag_name !== void 0) cols.tag_name = data.tag_name;
  if (data.slug !== void 0) cols.url = normaliseSlug(data.slug) || slugifyTag(data.tag_name || "");
  if (data.status !== void 0) cols.status = data.status;
  const names = Object.keys(cols);
  if (names.length) {
    await dbPool.query(`UPDATE ci_tag SET ${names.map((n) => `\`${n}\` = ?`).join(", ")} WHERE id = ?`, [...names.map((n) => cols[n]), id]);
  }
  return getActiveTags();
}
async function deleteTag(id) {
  const [r] = await dbPool.query(`DELETE FROM ci_tag WHERE id = ?`, [id]);
  return r.affectedRows > 0;
}
async function deleteSubscriber(id) {
  const [r] = await dbPool.query(`DELETE FROM ci_subscribe WHERE id = ?`, [id]);
  return r.affectedRows > 0;
}
async function deleteSubscribersBulk(ids) {
  if (!ids.length) return 0;
  const ph = ids.map(() => "?").join(",");
  const [r] = await dbPool.query(`DELETE FROM ci_subscribe WHERE id IN (${ph})`, ids);
  return r.affectedRows || 0;
}
async function deleteImage(id) {
  const [r] = await dbPool.query(`DELETE FROM ci_imagelibrary WHERE id = ?`, [id]);
  return r.affectedRows > 0;
}
async function createAdminUser(data) {
  await dbPool.query(
    `INSERT INTO ci_admin (admin_role_id, username, firstname, lastname, email, mobile_no, address, image, password, is_verify, is_admin, is_active, is_supper, created_at, updated_at)
     VALUES (0, ?, ?, ?, ?, '', '', '', ?, 1, 1, ?, ?, NOW(), NOW())`,
    [data.username, data.firstname || "", data.lastname || "", data.email || "", data.password, data.is_active ?? 1, data.is_supper ?? 0]
  );
  return getAdminUsers();
}
async function updateAdminUser(id, data) {
  const cols = {};
  if (data.firstname !== void 0) cols.firstname = data.firstname;
  if (data.lastname !== void 0) cols.lastname = data.lastname;
  if (data.email !== void 0) cols.email = data.email;
  if (data.password) cols.password = data.password;
  if (data.is_active !== void 0) cols.is_active = data.is_active;
  if (data.is_supper !== void 0) cols.is_supper = data.is_supper;
  const names = Object.keys(cols);
  if (names.length) {
    await dbPool.query(`UPDATE ci_admin SET ${names.map((n) => `\`${n}\` = ?`).join(", ")} WHERE admin_id = ?`, [...names.map((n) => cols[n]), id]);
  }
  return getAdminUsers();
}
async function deleteAdminUser(id) {
  const [r] = await dbPool.query(`DELETE FROM ci_admin WHERE admin_id = ?`, [id]);
  return r.affectedRows > 0;
}
async function createSubAdmin(data) {
  await dbPool.query(
    `INSERT INTO ci_subadmin (username, firstname, lastname, email, mobile_no, password, address, is_active, is_verify, created_at)
     VALUES (?, ?, ?, ?, '', ?, '', ?, 1, ?)`,
    [data.username, data.firstname || "", data.lastname || "", data.email || "", data.password, data.is_active ?? 1, legacyNow()]
  );
  return getSubAdmins();
}
async function updateSubAdmin(id, data) {
  const cols = {};
  if (data.firstname !== void 0) cols.firstname = data.firstname;
  if (data.lastname !== void 0) cols.lastname = data.lastname;
  if (data.email !== void 0) cols.email = data.email;
  if (data.password) cols.password = data.password;
  if (data.is_active !== void 0) cols.is_active = data.is_active;
  const names = Object.keys(cols);
  if (names.length) {
    await dbPool.query(`UPDATE ci_subadmin SET ${names.map((n) => `\`${n}\` = ?`).join(", ")} WHERE id = ?`, [...names.map((n) => cols[n]), id]);
  }
  return getSubAdmins();
}
async function deleteSubAdmin(id) {
  const [r] = await dbPool.query(`DELETE FROM ci_subadmin WHERE id = ?`, [id]);
  return r.affectedRows > 0;
}
async function verifyAdmin(username, password) {
  if (!username || !password) return null;
  try {
    const [rows] = await dbPool.query(
      `SELECT admin_id, username, firstname, lastname FROM ci_admin
       WHERE username = ? AND password = ? AND is_active = 1 LIMIT 1`,
      [username, password]
    );
    const list = rows;
    if (list.length === 0) return null;
    const a = list[0];
    return {
      admin_id: a.admin_id,
      username: a.username,
      name: [a.firstname, a.lastname].filter(Boolean).join(" ").trim() || a.username
    };
  } catch (err) {
    handleDbError("verifyAdmin", err);
    return null;
  }
}
async function changeAdminPassword(username, currentPassword, newPassword) {
  const admin = await verifyAdmin(username, currentPassword);
  if (!admin || admin.admin_id === 0) return false;
  const [result] = await dbPool.query(
    `UPDATE ci_admin SET password = ? WHERE admin_id = ?`,
    [newPassword, admin.admin_id]
  );
  return result.affectedRows > 0;
}
function normaliseSlug(raw) {
  return (raw || "").replace(/\s+/g, "-");
}
function legacyNow() {
  const d = /* @__PURE__ */ new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} : ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}
function toLegacyAssetPath(url) {
  return (url || "").replace(/^https?:\/\/[^/]+\//i, "").trim();
}
function toBlogColumns(payload) {
  const cols = {};
  if (payload.title !== void 0) cols.title = payload.title;
  if (payload.category_id !== void 0) cols.cat_id = payload.category_id;
  if (payload.sub_category_id !== void 0) cols.sub_cat_id = payload.sub_category_id;
  if (payload.type !== void 0) cols.type = payload.type;
  if (payload.tag_ids !== void 0) cols.tag_id = payload.tag_ids.join(",");
  if (payload.image !== void 0) cols.image = toLegacyAssetPath(payload.image);
  if (payload.alt_tag !== void 0) cols.alt_tag = payload.alt_tag;
  if (payload.url !== void 0) cols.url = normaliseSlug(payload.url);
  if (payload.meta_title !== void 0) cols.meta_title = payload.meta_title;
  if (payload.meta_keyword !== void 0) cols.meta_keyword = payload.meta_keyword;
  if (payload.meta_description !== void 0) cols.meta_description = payload.meta_description;
  if (payload.h2_tag !== void 0) cols.h2_tag = payload.h2_tag;
  if (payload.h3_tag !== void 0) cols.h3_tag = payload.h3_tag;
  if (payload.h4_tag !== void 0) cols.h4_tag = payload.h4_tag;
  if (payload.h5_tag !== void 0) cols.h5_tag = payload.h5_tag;
  if (payload.h6_tag !== void 0) cols.h6_tag = payload.h6_tag;
  if (payload.person_name !== void 0) cols.person_name = payload.person_name;
  if (payload.og_title !== void 0) cols.og_title = payload.og_title;
  if (payload.og_url !== void 0) cols.og_url = payload.og_url;
  if (payload.og_description !== void 0) cols.og_description = payload.og_description;
  if (payload.og_image !== void 0) cols.og_image = toLegacyAssetPath(payload.og_image);
  if (payload.youtube_video_link !== void 0) cols.youtube_video_link = payload.youtube_video_link;
  if (payload.content !== void 0) cols.description = payload.content;
  if (payload.status !== void 0) cols.status = payload.status;
  return cols;
}
async function getBlogByIdAdmin(id) {
  const [rows] = await dbPool.query(`${BLOG_SELECT} WHERE b.id = ? LIMIT 1`, [id]);
  const list = rows;
  return list.length > 0 ? mapBlogRow(list[0]) : null;
}
async function createBlog(payload, adminId) {
  const cols = toBlogColumns(payload);
  const defaults = {
    title: "",
    cat_id: 0,
    sub_cat_id: 0,
    type: 0,
    tag_id: "",
    image: "",
    alt_tag: "",
    video_type: "",
    video_name: "",
    youtube_video_link: "",
    amazon_webserver_video_link: "",
    url: "",
    meta_title: "",
    meta_keyword: "",
    meta_description: "",
    h2_tag: "",
    h3_tag: "",
    h4_tag: "",
    h5_tag: "",
    h6_tag: "",
    og_title: "",
    og_url: "",
    og_description: "",
    og_image: "",
    description: "",
    status: 1
  };
  const row = { ...defaults, ...cols, user_created_by: adminId, created_at: legacyNow() };
  const names = Object.keys(row);
  const [result] = await dbPool.query(
    `INSERT INTO ci_blog (${names.map((n) => `\`${n}\``).join(",")}) VALUES (${names.map(() => "?").join(",")})`,
    names.map((n) => row[n])
  );
  const created = await getBlogByIdAdmin(result.insertId);
  if (!created) throw new Error("Insert succeeded but row not found");
  return created;
}
async function updateBlog(id, payload) {
  const cols = toBlogColumns(payload);
  const names = Object.keys(cols);
  if (names.length > 0) {
    await dbPool.query(
      `UPDATE ci_blog SET ${names.map((n) => `\`${n}\` = ?`).join(", ")} WHERE id = ?`,
      [...names.map((n) => cols[n]), id]
    );
  }
  return getBlogByIdAdmin(id);
}
async function deleteBlog(id) {
  const [result] = await dbPool.query(`DELETE FROM ci_blog WHERE id = ?`, [id]);
  return result.affectedRows > 0;
}
async function bulkBlogAction(ids, action) {
  if (ids.length === 0) return 0;
  const placeholders = ids.map(() => "?").join(",");
  if (action === "delete") {
    const [r2] = await dbPool.query(`DELETE FROM ci_blog WHERE id IN (${placeholders})`, ids);
    return r2.affectedRows;
  }
  const status = action === "activate" ? 1 : 0;
  const [r] = await dbPool.query(`UPDATE ci_blog SET status = ? WHERE id IN (${placeholders})`, [status, ...ids]);
  return r.affectedRows;
}
async function getAllBlogsAdmin(limit = 500) {
  try {
    const [rows] = await dbPool.query(
      `${BLOG_SELECT} ORDER BY b.created_at DESC, b.id DESC LIMIT ?`,
      [limit]
    );
    return rows.map((row, i) => mapBlogRow(row, i));
  } catch (err) {
    handleDbError("getAllBlogsAdmin", err);
    return [];
  }
}
function mapAdRow(row) {
  return {
    id: row.id,
    title: row.advertisement_title,
    advertisement_image: assetUrl(row.advertisement_image),
    alt_tag: row.alt_tag || row.advertisement_title,
    url: row.advertisement_url,
    position: row.position,
    priority: row.priority,
    status: row.status,
    click_count: row.click_count ?? 0,
    impressions: 0,
    created_at: row.created_at || ""
  };
}
async function getAllAdsAdmin() {
  try {
    const cols = await adSelectColumns([
      "id",
      "advertisement_title",
      "advertisement_url",
      "advertisement_image",
      "alt_tag",
      "priority",
      "position",
      "status",
      "click_count",
      "created_at"
    ]);
    const [rows] = await dbPool.query(`
      SELECT ${cols.map((c) => `\`${c}\``).join(", ")}
      FROM ci_advertisement
      ORDER BY status DESC, priority ASC, id DESC
    `);
    return rows.map(mapAdRow);
  } catch (err) {
    handleDbError("getAllAdsAdmin", err);
    return [];
  }
}
async function adSelectColumns(wanted) {
  const schema = await describeTable("ci_advertisement");
  if (schema.length === 0) return wanted;
  const known = new Set(schema.map((c) => c.name));
  return wanted.filter((c) => known.has(c));
}
async function adHasColumn(name) {
  const schema = await describeTable("ci_advertisement");
  return schema.length === 0 || schema.some((c) => c.name === name);
}
async function getActiveAds() {
  try {
    const cols = await adSelectColumns([
      "id",
      "advertisement_title",
      "advertisement_url",
      "advertisement_image",
      "alt_tag",
      "priority",
      "position",
      "status",
      "click_count",
      "created_at"
    ]);
    const query = `
      SELECT ${cols.map((c) => `\`${c}\``).join(", ")}
      FROM ci_advertisement
      WHERE status = 1
      ORDER BY priority ASC, id DESC
    `;
    const [rows] = await dbPool.query(query);
    return rows.map((row) => ({
      id: row.id,
      title: row.advertisement_title,
      advertisement_image: assetUrl(row.advertisement_image),
      alt_tag: row.alt_tag || row.advertisement_title,
      url: row.advertisement_url,
      position: row.position,
      priority: row.priority,
      status: row.status,
      click_count: row.click_count ?? 0,
      impressions: 0,
      created_at: row.created_at || ""
    }));
  } catch (err) {
    handleDbError("getActiveAds", err);
    return [];
  }
}

// src/lib/bridge.ts
function bridgeConfigured() {
  return Boolean(process.env.BRIDGE_URL && process.env.BRIDGE_KEY);
}
async function bridgeCall(action, body) {
  const url = `${process.env.BRIDGE_URL}?action=${encodeURIComponent(action)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Bridge-Key": process.env.BRIDGE_KEY || ""
    },
    body: JSON.stringify(body)
  });
  const text = await res.text();
  let data = {};
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`bridge ${action}: nf-bridge.php not reachable at BRIDGE_URL (non-JSON response)`);
  }
  if (!res.ok) throw new Error(data?.error || `bridge ${action} ${res.status}`);
  return data;
}
async function bridgeUploadImage(creds, folder, filename, base64Data, alt) {
  const data = await bridgeCall("upload-image", { ...creds, folder, filename, data: base64Data, alt });
  if (!data.path) throw new Error("Bridge upload returned no path");
  return String(data.path);
}

// src/lib/qa.ts
function stripHtml2(html) {
  return (html || "").replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/\s+/g, " ").trim();
}
var STOPWORDS = new Set(
  "the a an is are was were be been to of in on at for with and or but who what when where why how does do did this that these those it its from by as".split(" ")
);
function keywords(q) {
  return q.toLowerCase().replace(/[^a-z0-9\sऀ-ॿ]/g, " ").split(/\s+/).filter((w) => w.length > 2 && !STOPWORDS.has(w));
}
function extractiveAnswer(question, articleText) {
  const sentences = articleText.split(/(?<=[.!?।])\s+/).filter((s) => s.length > 25);
  const qWords = keywords(question);
  if (qWords.length === 0 || sentences.length === 0) return null;
  const scored = sentences.map((s, i) => {
    const lower = s.toLowerCase();
    const score = qWords.reduce((acc, w) => acc + (lower.includes(w) ? 1 : 0), 0);
    return { s, i, score };
  }).filter((x) => x.score > 0).sort((a, b) => b.score - a.score || a.i - b.i);
  if (scored.length === 0) return null;
  const top = scored.slice(0, 2).sort((a, b) => a.i - b.i);
  return top.map((x) => x.s.trim()).join(" ");
}
async function geminiAnswer(question, articleText, apiKey) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `You answer reader questions about a news article. Answer in 1-3 sentences using ONLY facts from the article below. If the article does not contain the answer, say so plainly. Match the language of the question (English or Hindi).

ARTICLE:
${articleText.slice(0, 6e3)}

QUESTION: ${question}`
              }
            ]
          }
        ]
      })
    }
  );
  if (!res.ok) throw new Error(`gemini ${res.status}`);
  const data = await res.json();
  const out = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!out) throw new Error("gemini empty");
  return out.trim();
}
async function answerQuestion(question, articleHtml, fallbackSummary) {
  const text = stripHtml2(articleHtml);
  const key = process.env.GEMINI_API_KEY;
  if (key) {
    try {
      return { answer: await geminiAnswer(question, text, key), source: "ai" };
    } catch {
    }
  }
  const extracted = extractiveAnswer(question, text);
  if (extracted) return { answer: extracted, source: "extractive" };
  if (fallbackSummary) return { answer: fallbackSummary, source: "summary" };
  return {
    answer: "The article does not directly address this \u2014 see the full story above or contact the editorial desk.",
    source: "summary"
  };
}

// server.ts
var shellCache = "";
function legacyMediaRoot() {
  return process.env.LEGACY_MEDIA_ROOT || process.cwd();
}
var byteSizeCache = /* @__PURE__ */ new Map();
function imageByteSize(absUrl) {
  if (!absUrl) return void 0;
  if (byteSizeCache.has(absUrl)) return byteSizeCache.get(absUrl);
  let size;
  try {
    const root = import_path2.default.resolve(legacyMediaRoot());
    let pathname;
    try {
      pathname = new URL(absUrl).pathname;
    } catch {
      pathname = absUrl;
    }
    const file = import_path2.default.resolve(root, decodeURIComponent(pathname).replace(/^\/+/, ""));
    if (file.startsWith(root) && import_fs2.default.existsSync(file)) {
      const st = import_fs2.default.statSync(file);
      if (st.isFile() && st.size > 0) size = st.size;
    }
  } catch {
    size = void 0;
  }
  byteSizeCache.set(absUrl, size);
  return size;
}
function configBootstrap(cfg) {
  const json = JSON.stringify(cfg ?? {}).replace(/</g, "\\u003c");
  return `<script id="nf-config">window.__NF_CONFIG__=${json}</script>`;
}
function withConfigBootstrap(html, cfg) {
  const tag = configBootstrap(cfg);
  if (/<script id="nf-config">[\s\S]*?<\/script>/.test(html)) {
    return html.replace(/<script id="nf-config">[\s\S]*?<\/script>/, tag);
  }
  return html.replace("</head>", `    ${tag}
  </head>`);
}
async function syncHomepageShell(distPath) {
  const file = import_path2.default.join(distPath, "index.html");
  try {
    const cfg = await getSiteConfig();
    const esc = (v) => String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    const title = esc(cfg.siteTitle || siteSetting.meta_default_title || "");
    const desc = esc(cfg.siteDescription || siteSetting.meta_default_description || "");
    const keys = esc(cfg.siteKeywords || siteSetting.meta_default_keywords || "");
    let html = import_fs2.default.readFileSync(file, "utf8");
    const before = html;
    html = withConfigBootstrap(html, cfg);
    const setContent = (attr, name, value) => {
      if (!value) return;
      const re = new RegExp(`(<meta\\s+${attr}="${name}"\\s+content=")[^"]*(")`, "i");
      html = html.replace(re, `$1${value}$2`);
    };
    if (title) html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${title}</title>`);
    setContent("name", "description", desc);
    setContent("name", "keywords", keys);
    setContent("property", "og:title", title);
    setContent("property", "og:description", desc);
    setContent("name", "twitter:title", title);
    setContent("name", "twitter:description", desc);
    if (html !== before) {
      import_fs2.default.writeFileSync(file, html, "utf8");
      console.log("[shell] homepage meta + settings synced into dist/index.html");
    }
    shellCache = "";
  } catch (err) {
    console.warn("[shell] could not sync homepage meta:", err?.message || err);
  }
}
async function startServer() {
  const fetchKind = ensureFetch();
  console.log(`[http] outbound fetch: ${fetchKind} (node ${process.version})`);
  const ts = storeStats();
  console.log(
    `[i18n] translation cache: ${ts.mode} at ${ts.dir} \u2014 ${ts.articles} article(s), ${ts.titles} headline(s)` + (ts.mode === "memory" ? " (not writable: translations will be lost on restart)" : "")
  );
  const app = (0, import_express.default)();
  const PORT = parseInt(process.env.PORT || "3000", 10);
  app.use(import_express.default.json({ limit: "15mb" }));
  let dbBlogs = [];
  let dbCategories = [];
  let dbAds = [];
  let dbActivityLogs = [];
  let dbUsers = [];
  let dbSubscribers = [];
  let dbImages = [];
  let dbSetting = { ...siteSetting };
  const clientIp = (req) => {
    const fwd = String(req?.headers["x-forwarded-for"] || "").split(",")[0].trim();
    return fwd || req?.socket?.remoteAddress || "";
  };
  const actorName = (req) => String(req?.headers["x-admin-user"] || "").trim() || "Unknown";
  const logActivity = (userName, userId, activity, moduleName, req) => {
    const newLog = {
      id: Date.now(),
      user_id: userId,
      user_name: userName,
      activity,
      module: moduleName,
      ip_address: clientIp(req),
      created_at: (/* @__PURE__ */ new Date()).toISOString().replace("T", " ").substring(0, 19)
    };
    dbActivityLogs.unshift(newLog);
    void appendPanelActivity(newLog);
  };
  const requireAdmin = async (req) => verifyAdmin(String(req.headers["x-admin-user"] || ""), String(req.headers["x-admin-pass"] || ""));
  app.post("/api/admin/login", async (req, res) => {
    const { username, password } = req.body || {};
    const admin = await verifyAdmin(String(username || ""), String(password || ""));
    if (!admin) return res.status(401).json({ error: "Invalid credentials or database unreachable" });
    logActivity(admin.name, admin.admin_id, "Signed in to the admin panel", "Session", req);
    res.json(admin);
  });
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
  app.get("/api/translate", async (req, res) => {
    const slug = String(req.query.slug || "").trim();
    if (!slug) return res.status(400).json({ error: "slug required" });
    const article = await getBlogByUrlSlug(slug);
    if (!article) return res.status(404).json({ error: "Article not found" });
    res.json(await translateArticle(article));
  });
  app.post("/api/translate-titles", async (req, res) => {
    const { titles: titles2 } = req.body || {};
    if (!Array.isArray(titles2) || titles2.length === 0) {
      return res.status(400).json({ error: "titles array required" });
    }
    const asked = titles2.map(String);
    const translations = await translateTitles(asked);
    const changed = asked.filter((t) => translations[t] && translations[t] !== t).length;
    const err = lastTranslationError();
    if (changed === 0 && err) console.warn("translate-titles: provider unavailable \u2014", err);
    res.json({ translations, ...changed === 0 && err ? { reason: err } : {} });
  });
  app.post("/api/ask", async (req, res) => {
    const { slug, question } = req.body || {};
    if (!slug || !question || String(question).length > 300) {
      return res.status(400).json({ error: "slug and question (max 300 chars) required" });
    }
    const article = await getBlogByUrlSlug(String(slug).trim());
    if (!article) return res.status(404).json({ error: "Article not found" });
    res.json(await answerQuestion(String(question), article.content, article.short_content));
  });
  app.get("/api/site-config", async (_req, res) => {
    res.json(await getSiteConfig());
  });
  app.put("/api/site-config", async (req, res) => {
    const admin = await requireAdmin(req);
    if (!admin) return res.status(401).json({ error: "Unauthorized" });
    try {
      const saved = await saveSiteConfig(req.body || {});
      logActivity(admin.name, admin.admin_id, "Updated Site Settings", "Site Settings", req);
      await syncHomepageShell(import_path2.default.join(process.cwd(), "dist"));
      res.json(saved);
    } catch (err) {
      res.status(500).json({ error: "Config save failed: " + err?.message });
    }
  });
  const DEFAULT_PAGES = ["about-us", "contact-us"];
  const RESERVED_SLUGS = /* @__PURE__ */ new Set(["admin", "category", "tag", "api", "assets", "uploads", "news", "latest-news", "sitemap.xml", "robots.txt", "rss.xml", "feed.rss", "report.html", "favicon.ico"]);
  const normSlug = (s) => s.toLowerCase().trim().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "");
  let pageSlugCache = { set: new Set(DEFAULT_PAGES), at: 0 };
  const getPageSlugSet = async () => {
    if (pageSlugCache.set.size && Date.now() - pageSlugCache.at < 60 * 1e3) return pageSlugCache.set;
    const list = await getAllStaticPages();
    const set = new Set(DEFAULT_PAGES);
    list.forEach((p) => set.add(p.slug.toLowerCase()));
    pageSlugCache = { set, at: Date.now() };
    return set;
  };
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
      pageSlugCache.at = 0;
      logActivity(admin.name, admin.admin_id, `Updated page "${slug}"`, "Pages", req);
      res.json(saved);
    } catch (err) {
      res.status(500).json({ error: "Page save failed: " + err?.message });
    }
  });
  app.delete("/api/pages/:slug", async (req, res) => {
    const admin = await requireAdmin(req);
    if (!admin) return res.status(401).json({ error: "Unauthorized" });
    const slug = normSlug(String(req.params.slug));
    const ok = await deleteStaticPage(slug);
    pageSlugCache.at = 0;
    logActivity(admin.name, admin.admin_id, `Deleted page "${slug}"`, "Pages", req);
    res.json({ success: ok });
  });
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", framework: "Express + React Headless CodeIgniter Bridge" });
  });
  const stripBodies = (rows, req) => req.query.with_content ? rows : rows.map(({ content: _content, ...rest }) => ({ ...rest, content: "" }));
  app.get("/api/blogs", async (req, res) => {
    try {
      const categorySlug = req.query.category_slug;
      const limit = req.query.limit ? parseInt(req.query.limit, 10) : 200;
      if (req.query.status === "all") {
        const admin = await requireAdmin(req);
        if (!admin) return res.status(401).json({ error: "Unauthorized" });
        return res.json(await getAllBlogsAdmin(req.query.limit ? limit : 1e5));
      }
      if (req.query.tag_slug) {
        const tslug = String(req.query.tag_slug).toLowerCase();
        const allTags = await getActiveTags();
        const ids = new Set(allTags.filter((t) => (t.slug || "").toLowerCase() === tslug).map((t) => t.id));
        const all = await getPublishedBlogs(1e5);
        return res.json(stripBodies(all.filter((b) => (b.tag_ids || []).some((id) => ids.has(id))), req));
      }
      let result = await getPublishedBlogs(
        req.query.search && !req.query.limit ? 1e5 : limit,
        categorySlug
      );
      if (req.query.status !== void 0) {
        const statusNum = parseInt(req.query.status, 10);
        result = result.filter((b) => b.status === statusNum);
      }
      if (req.query.category_id) {
        const catId = parseInt(req.query.category_id, 10);
        result = result.filter((b) => b.category_id === catId || b.sub_category_id === catId);
      }
      if (req.query.search) {
        const query = req.query.search.toLowerCase();
        result = result.filter(
          (b) => b.title.toLowerCase().includes(query) || b.short_content.toLowerCase().includes(query) || b.url.toLowerCase().includes(query)
        );
      }
      res.set("Cache-Control", "public, max-age=60");
      res.json(stripBodies(result, req));
    } catch (err) {
      console.error("GET /api/blogs failed:", err);
      res.status(500).json({ error: "Failed to load articles" });
    }
  });
  app.get("/api/search-index", async (_req, res) => {
    try {
      const rows = await getSearchIndex();
      res.set("Cache-Control", "public, max-age=300");
      res.json(rows);
    } catch (err) {
      console.error("GET /api/search-index failed:", err);
      res.status(500).json({ error: "Failed to load search index" });
    }
  });
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
  app.get("/api/blogs/:id", async (req, res) => {
    const blog = await getBlogByIdAdmin(parseInt(req.params.id, 10));
    if (!blog) return res.status(404).json({ error: "Blog not found" });
    res.json(blog);
  });
  app.post("/api/blogs", async (req, res) => {
    const admin = await requireAdmin(req);
    if (!admin) return res.status(401).json({ error: "Unauthorized" });
    try {
      const created = await createBlog(req.body, admin.admin_id);
      logActivity(admin.name, admin.admin_id, `Created Blog Article #${created.id}: "${created.title}"`, "Blog", req);
      res.status(201).json(created);
    } catch (err) {
      console.error("createBlog failed:", err?.message);
      res.status(500).json({ error: "Failed to create article" });
    }
  });
  app.put("/api/blogs/:id", async (req, res) => {
    const admin = await requireAdmin(req);
    if (!admin) return res.status(401).json({ error: "Unauthorized" });
    try {
      const id = parseInt(req.params.id, 10);
      const updated = await updateBlog(id, req.body);
      if (!updated) return res.status(404).json({ error: "Blog not found" });
      logActivity(admin.name, admin.admin_id, `Updated Blog Article #${id}: "${updated.title}"`, "Blog", req);
      res.json(updated);
    } catch (err) {
      console.error("updateBlog failed:", err?.message);
      res.status(500).json({ error: "Failed to update article" });
    }
  });
  app.delete("/api/blogs/:id", async (req, res) => {
    const admin = await requireAdmin(req);
    if (!admin) return res.status(401).json({ error: "Unauthorized" });
    const id = parseInt(req.params.id, 10);
    const ok = await deleteBlog(id);
    if (!ok) return res.status(404).json({ error: "Blog not found" });
    logActivity(admin.name, admin.admin_id, `Deleted Blog Article #${id}`, "Blog", req);
    res.json({ success: true, id });
  });
  app.post("/api/blogs/bulk-action", async (req, res) => {
    const admin = await requireAdmin(req);
    if (!admin) return res.status(401).json({ error: "Unauthorized" });
    const { ids, action } = req.body;
    if (!Array.isArray(ids) || !["activate", "deactivate", "delete"].includes(action)) {
      return res.status(400).json({ error: "Invalid bulk action payload" });
    }
    const affected = await bulkBlogAction(ids.map(Number), action);
    logActivity(admin.name, admin.admin_id, `Bulk ${action} on ${affected} blogs`, "Blog", req);
    res.json({ success: true, affected, ids, action });
  });
  app.get("/api/categories", async (_req, res) => {
    try {
      res.json(await getAllCategories());
    } catch (err) {
      console.error("GET /api/categories failed:", err);
      res.status(500).json({ error: "Failed to load categories" });
    }
  });
  app.post("/api/categories", async (req, res) => {
    const admin = await requireAdmin(req);
    if (!admin) return res.status(401).json({ error: "Unauthorized" });
    try {
      const cats = await createCategory(req.body || {});
      logActivity(admin.name, admin.admin_id, `Created Category "${req.body?.category_name}"`, "Category", req);
      return res.json(cats);
    } catch (err) {
      return res.status(500).json({ error: "Category save failed: " + err?.message });
    }
  });
  app.post("/api/_legacy_categories_unused", (req, res) => {
    const payload = req.body;
    const newId = dbCategories.length ? Math.max(...dbCategories.map((c) => c.id)) + 1 : 1;
    const now = (/* @__PURE__ */ new Date()).toISOString().replace("T", " ").substring(0, 19);
    const newCategory = {
      id: newId,
      category_name: payload.category_name || "New Category",
      slug: payload.slug || "new-category",
      status: payload.status !== void 0 ? payload.status : 1,
      article_count: 0,
      meta_title: payload.meta_title || payload.category_name || "",
      meta_description: payload.meta_description || "",
      created_at: now
    };
    dbCategories.unshift(newCategory);
    logActivity(actorName(req), 0, `Created Category #${newId}: "${newCategory.category_name}"`, "Category", req);
    res.status(201).json(newCategory);
  });
  app.put("/api/categories/:id", async (req, res) => {
    const admin = await requireAdmin(req);
    if (!admin) return res.status(401).json({ error: "Unauthorized" });
    try {
      const cats = await updateCategory(parseInt(req.params.id, 10), req.body || {});
      logActivity(admin.name, admin.admin_id, `Updated Category #${req.params.id}${req.body?.category_name ? `: "${req.body.category_name}"` : ""}`, "Category", req);
      return res.json(cats);
    } catch (err) {
      return res.status(500).json({ error: "Category update failed: " + err?.message });
    }
  });
  app.put("/api/_legacy_categories_unused/:id", (req, res) => {
    const id = parseInt(req.params.id, 10);
    const idx = dbCategories.findIndex((c) => c.id === id);
    if (idx === -1) return res.status(404).json({ error: "Category not found" });
    dbCategories[idx] = { ...dbCategories[idx], ...req.body, id };
    logActivity(actorName(req), 0, `Updated Category #${id}: "${dbCategories[idx].category_name}"`, "Category", req);
    res.json(dbCategories[idx]);
  });
  app.delete("/api/categories/:id", async (req, res) => {
    const admin = await requireAdmin(req);
    if (!admin) return res.status(401).json({ error: "Unauthorized" });
    const ok = await deleteCategory(parseInt(req.params.id, 10));
    if (!ok) return res.status(404).json({ error: "Category not found" });
    logActivity(admin.name, admin.admin_id, `Deleted Category #${req.params.id}`, "Category", req);
    return res.json({ success: true, id: parseInt(req.params.id, 10) });
  });
  app.delete("/api/_legacy_categories_unused/:id", (req, res) => {
    const id = parseInt(req.params.id, 10);
    dbCategories = dbCategories.filter((c) => c.id !== id);
    logActivity(actorName(req), 0, `Deleted Category #${id}`, "Category", req);
    res.json({ success: true, id });
  });
  app.get("/api/tags", async (_req, res) => {
    res.json(await getActiveTags());
  });
  app.post("/api/tags", async (req, res) => {
    const admin = await requireAdmin(req);
    if (!admin) return res.status(401).json({ error: "Unauthorized" });
    if (!req.body?.tag_name) return res.status(400).json({ error: "tag_name required" });
    try {
      const tag = await createTag(req.body);
      logActivity(admin.name, admin.admin_id, `Created Tag "${req.body.tag_name}"`, "Tag", req);
      res.json(tag);
    } catch (e) {
      res.status(500).json({ error: "Tag create failed: " + e?.message });
    }
  });
  app.put("/api/tags/:id", async (req, res) => {
    const admin = await requireAdmin(req);
    if (!admin) return res.status(401).json({ error: "Unauthorized" });
    try {
      const tag = await updateTag(parseInt(req.params.id, 10), req.body || {});
      logActivity(admin.name, admin.admin_id, `Updated Tag #${req.params.id}${req.body?.tag_name ? `: "${req.body.tag_name}"` : ""}`, "Tag", req);
      res.json(tag);
    } catch (e) {
      res.status(500).json({ error: "Tag update failed: " + e?.message });
    }
  });
  app.delete("/api/tags/:id", async (req, res) => {
    const admin = await requireAdmin(req);
    if (!admin) return res.status(401).json({ error: "Unauthorized" });
    const ok = await deleteTag(parseInt(req.params.id, 10));
    if (ok) logActivity(admin.name, admin.admin_id, `Deleted Tag #${req.params.id}`, "Tag", req);
    res.json({ success: ok });
  });
  app.get("/api/advertisements", async (req, res) => {
    if (req.query.status === "all") {
      if (!await requireAdmin(req)) return res.status(401).json({ error: "Unauthorized" });
      res.setHeader("Cache-Control", "no-store");
      return res.json(await getAllAdsAdmin());
    }
    const realAds = await getActiveAds();
    res.json(realAds.length > 0 ? realAds : dbAds);
  });
  app.post("/api/advertisements", async (req, res) => {
    const admin = await requireAdmin(req);
    if (!admin) return res.status(401).json({ error: "Unauthorized" });
    try {
      const { id, ...payload } = req.body || {};
      const ads = id ? await updateAd(Number(id), payload) : await createAd(payload);
      logActivity(admin.name, admin.admin_id, `${id ? "Updated" : "Created"} Advertisement "${payload.title || id}"`, "Advertisement", req);
      return res.json(ads);
    } catch (err) {
      console.error("POST /api/advertisements failed:", err?.message);
      return res.status(500).json({ error: "Ad save failed: " + err?.message });
    }
  });
  app.delete("/api/advertisements/:id", async (req, res) => {
    const admin = await requireAdmin(req);
    if (!admin) return res.status(401).json({ error: "Unauthorized" });
    const ok = await deleteAd(parseInt(req.params.id, 10));
    if (!ok) return res.status(404).json({ error: "Ad not found" });
    logActivity(admin.name, admin.admin_id, `Deleted Advertisement #${req.params.id}`, "Advertisement", req);
    res.json({ success: true });
  });
  app.post("/api/upload-image", async (req, res) => {
    const admin = await requireAdmin(req);
    if (!admin) return res.status(401).json({ error: "Unauthorized" });
    const { folder, filename, data, alt } = req.body || {};
    if (!data || !filename) return res.status(400).json({ error: "filename and data required" });
    if (!bridgeConfigured()) {
      try {
        const fs2 = await import("fs/promises");
        const sub = folder === "advertisement" ? "advertisement" : "blog";
        const safe = String(filename).replace(/[^a-zA-Z0-9._-]/g, "");
        const ext = (safe.split(".").pop() || "png").toLowerCase();
        if (!["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext)) {
          return res.status(400).json({ error: "Only image files (jpg, png, gif, webp, svg) are allowed" });
        }
        const buf = Buffer.from(String(data), "base64");
        if (buf.length < 50) return res.status(400).json({ error: "Image data looks empty or corrupt" });
        if (buf.length > 8 * 1024 * 1024) return res.status(400).json({ error: "Image too large (max 8 MB)" });
        const dir = import_path2.default.join(process.cwd(), "uploads", sub);
        await fs2.mkdir(dir, { recursive: true });
        const fname = `${Date.now()}_${safe || "upload." + ext}`;
        await fs2.writeFile(import_path2.default.join(dir, fname), buf);
        const proto = String(req.headers["x-forwarded-proto"] || req.protocol || "https").split(",")[0];
        const host = req.get("host");
        const abs = `${proto}://${host}/uploads/${sub}/${fname}`;
        return res.json({ success: true, path: abs });
      } catch (err) {
        return res.status(500).json({ error: "Local image save failed: " + (err?.message || "") });
      }
    }
    try {
      const path3 = await bridgeUploadImage(
        { username: String(req.headers["x-admin-user"] || ""), password: String(req.headers["x-admin-pass"] || "") },
        folder === "advertisement" ? "advertisement" : "blog",
        String(filename),
        String(data),
        alt ? String(alt) : void 0
      );
      return res.json({ success: true, path: path3 });
    } catch (err) {
      return res.status(502).json({ error: err?.message || "Upload failed" });
    }
  });
  app.post("/api/_legacy_ads_unused", (req, res) => {
    const payload = req.body;
    const newId = dbAds.length ? Math.max(...dbAds.map((a) => a.id)) + 1 : 1;
    const now = (/* @__PURE__ */ new Date()).toISOString().replace("T", " ").substring(0, 19);
    const newAd = {
      id: newId,
      title: payload.title || "New Ad Banner",
      advertisement_image: payload.advertisement_image || "assets/img/ads/default-728x90.jpg",
      alt_tag: payload.alt_tag || "Advertisement Banner",
      url: payload.url || "https://example.com",
      position: payload.position || "top_banner",
      status: payload.status !== void 0 ? payload.status : 1,
      click_count: 0,
      impressions: 100,
      created_at: now
    };
    dbAds.unshift(newAd);
    logActivity(actorName(req), 0, `Created Advertisement #${newId}: "${newAd.title}"`, "Advertisement", req);
    res.status(201).json(newAd);
  });
  app.post("/api/advertisements/:id/click", async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (id) await incrementAdClick(id);
    res.json({ success: true });
  });
  app.get("/api/activity-logs", async (req, res) => {
    if (!await requireAdmin(req)) return res.status(401).json({ error: "Unauthorized" });
    res.setHeader("Cache-Control", "no-store");
    const [stored, real] = await Promise.all([getPanelActivity(), getActivityLogs()]);
    const seen = /* @__PURE__ */ new Set();
    const merged = [...dbActivityLogs, ...stored].filter((l) => seen.has(l.id) ? false : (seen.add(l.id), true)).sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
    res.json([...merged, ...real]);
  });
  app.get("/api/users", async (req, res) => {
    if (!await requireAdmin(req)) return res.status(401).json({ error: "Unauthorized" });
    res.setHeader("Cache-Control", "no-store");
    res.json(await getAdminUsers());
  });
  app.post("/api/users", async (req, res) => {
    const admin = await requireAdmin(req);
    if (!admin) return res.status(401).json({ error: "Unauthorized" });
    const { username, password } = req.body || {};
    if (!username || !password) return res.status(400).json({ error: "username and password required" });
    try {
      res.json(await createAdminUser(req.body));
    } catch (e) {
      res.status(500).json({ error: "User create failed: " + e?.message });
    }
  });
  app.put("/api/users/:id", async (req, res) => {
    const admin = await requireAdmin(req);
    if (!admin) return res.status(401).json({ error: "Unauthorized" });
    try {
      res.json(await updateAdminUser(parseInt(req.params.id, 10), req.body || {}));
    } catch (e) {
      res.status(500).json({ error: "User update failed: " + e?.message });
    }
  });
  app.delete("/api/users/:id", async (req, res) => {
    const admin = await requireAdmin(req);
    if (!admin) return res.status(401).json({ error: "Unauthorized" });
    const id = parseInt(req.params.id, 10);
    if (id === admin.admin_id) return res.status(400).json({ error: "You cannot delete your own account." });
    const ok = await deleteAdminUser(id);
    res.json({ success: ok });
  });
  app.get("/api/sub-admins", async (req, res) => {
    if (!await requireAdmin(req)) return res.status(401).json({ error: "Unauthorized" });
    res.setHeader("Cache-Control", "no-store");
    res.json(await getSubAdmins());
  });
  app.post("/api/sub-admins", async (req, res) => {
    const admin = await requireAdmin(req);
    if (!admin) return res.status(401).json({ error: "Unauthorized" });
    const { username, password } = req.body || {};
    if (!username || !password) return res.status(400).json({ error: "username and password required" });
    try {
      res.json(await createSubAdmin(req.body));
    } catch (e) {
      res.status(500).json({ error: "Sub-admin create failed: " + e?.message });
    }
  });
  app.put("/api/sub-admins/:id", async (req, res) => {
    const admin = await requireAdmin(req);
    if (!admin) return res.status(401).json({ error: "Unauthorized" });
    try {
      res.json(await updateSubAdmin(parseInt(req.params.id, 10), req.body || {}));
    } catch (e) {
      res.status(500).json({ error: "Sub-admin update failed: " + e?.message });
    }
  });
  app.delete("/api/sub-admins/:id", async (req, res) => {
    const admin = await requireAdmin(req);
    if (!admin) return res.status(401).json({ error: "Unauthorized" });
    const ok = await deleteSubAdmin(parseInt(req.params.id, 10));
    res.json({ success: ok });
  });
  app.get("/api/subscribers", async (req, res) => {
    if (!await requireAdmin(req)) return res.status(401).json({ error: "Unauthorized" });
    res.setHeader("Cache-Control", "no-store");
    res.json(await getSubscribers());
  });
  app.post("/api/subscribers", (req, res) => {
    const { email } = req.body;
    if (!email || !email.includes("@")) {
      return res.status(400).json({ error: "Invalid email address" });
    }
    const existing = dbSubscribers.find((s) => s.email === email);
    if (existing) {
      return res.json({ message: "Already subscribed", subscriber: existing });
    }
    const newSub = {
      id: dbSubscribers.length + 1,
      email,
      status: "subscribed",
      subscribed_at: (/* @__PURE__ */ new Date()).toISOString().replace("T", " ").substring(0, 19)
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
  app.get("/api/image-library", async (req, res) => {
    if (!await requireAdmin(req)) return res.status(401).json({ error: "Unauthorized" });
    res.setHeader("Cache-Control", "no-store");
    res.json(await getImageLibrary());
  });
  app.delete("/api/image-library/:id", async (req, res) => {
    const admin = await requireAdmin(req);
    if (!admin) return res.status(401).json({ error: "Unauthorized" });
    const ok = await deleteImage(parseInt(req.params.id, 10));
    res.json({ success: ok });
  });
  app.post("/api/image-library", async (req, res) => {
    if (!await requireAdmin(req)) return res.status(401).json({ error: "Unauthorized" });
    const { file_name, file_path, alt_tag } = req.body;
    const newImg = {
      id: dbImages.length ? Math.max(...dbImages.map((i) => i.id)) + 1 : 1,
      file_name: file_name || "new-image.jpg",
      file_path: file_path || "assets/img/blog/2026/08/new-image.jpg",
      file_size: "1.5 MB",
      alt_tag: alt_tag || "Uploaded Asset",
      uploaded_by: "elena_rostova",
      created_at: (/* @__PURE__ */ new Date()).toISOString().replace("T", " ").substring(0, 19)
    };
    dbImages.unshift(newImg);
    logActivity(actorName(req), 0, `Uploaded image asset '${newImg.file_name}'`, "Image Library", req);
    res.status(201).json(newImg);
  });
  app.get("/api/settings", (_req, res) => {
    res.json(dbSetting);
  });
  app.put("/api/settings", (req, res) => {
    dbSetting = {
      ...dbSetting,
      ...req.body,
      updated_at: (/* @__PURE__ */ new Date()).toISOString().replace("T", " ").substring(0, 19)
    };
    logActivity(actorName(req), 0, "Updated Site Configuration & SEO Defaults", "Setting", req);
    res.json(dbSetting);
  });
  let sitemapCache = { xml: "", at: 0 };
  const xmlEsc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
  app.get("/sitemap.xml", async (req, res) => {
    try {
      const now = Date.now();
      if (!sitemapCache.xml || now - sitemapCache.at > 10 * 60 * 1e3) {
        const proto = String(req.headers["x-forwarded-proto"] || req.protocol || "https").split(",")[0];
        const origin = `${proto}://${req.get("host")}`;
        const [blogs, cats, tags] = await Promise.all([getPublishedBlogs(1e5), getAllCategories(), getActiveTags()]);
        const rows = [];
        const add = (loc, priority, lastmod) => rows.push(`  <url><loc>${xmlEsc(loc)}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ""}<priority>${priority}</priority></url>`);
        add(`${origin}/`, "1.0");
        ["about-us", "contact-us", "latest-news"].forEach((p) => add(`${origin}/${p}`, "0.8"));
        const seenCat = /* @__PURE__ */ new Set();
        cats.forEach((c) => {
          const slug = (c.slug || "").trim();
          if (!slug || slug === "-" || seenCat.has(slug.toLowerCase())) return;
          seenCat.add(slug.toLowerCase());
          add(`${origin}/category/${encodeURIComponent(slug)}`, "0.8");
        });
        const tagCount = /* @__PURE__ */ new Map();
        blogs.forEach((b) => (b.tag_ids || []).forEach((id) => tagCount.set(id, (tagCount.get(id) || 0) + 1)));
        const seenTag = /* @__PURE__ */ new Set();
        tags.forEach((tg) => {
          const slug = (tg.slug || "").trim();
          if (!slug || seenTag.has(slug.toLowerCase()) || (tagCount.get(tg.id) || 0) < 3) return;
          seenTag.add(slug.toLowerCase());
          add(`${origin}/tag/${encodeURIComponent(slug)}`, "0.5");
        });
        const seenBlog = /* @__PURE__ */ new Set();
        blogs.forEach((b) => {
          const slug = (b.url || "").trim();
          if (!slug || seenBlog.has(slug.toLowerCase())) return;
          seenBlog.add(slug.toLowerCase());
          add(`${origin}/${encodeURIComponent(slug)}`, "0.64", (b.updated_at || b.created_at || "").split(" ")[0] || void 0);
        });
        sitemapCache = {
          xml: `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${rows.join("\n")}
</urlset>`,
          at: now
        };
      }
      res.set("Content-Type", "application/xml; charset=utf-8").send(sitemapCache.xml);
    } catch (err) {
      res.status(500).send("sitemap generation failed");
    }
  });
  let newsCache = { xml: "", at: 0 };
  let feedCache = { xml: "", at: 0 };
  const originOf = (req) => {
    const proto = String(req.headers["x-forwarded-proto"] || req.protocol || "https").split(",")[0];
    return `${proto}://${req.get("host")}`;
  };
  app.get("/news-sitemap.xml", async (req, res) => {
    try {
      const now = Date.now();
      if (!newsCache.xml || now - newsCache.at > 5 * 60 * 1e3) {
        const blogs = await getPublishedBlogs(1e5);
        newsCache = { xml: buildNewsSitemap(blogs, originOf(req)), at: now };
      }
      res.status(200).set("Content-Type", "application/xml; charset=utf-8").set("Cache-Control", "public, max-age=300").send(newsCache.xml);
    } catch (err) {
      console.error("news-sitemap failed:", err?.message);
      res.status(500).type("text/plain").send("news sitemap generation failed");
    }
  });
  app.get("/feed", async (req, res) => {
    try {
      const now = Date.now();
      if (!feedCache.xml || now - feedCache.at > 10 * 60 * 1e3) {
        const blogs = await getPublishedBlogs(1e5);
        const cfg = await getSiteConfig();
        feedCache = {
          xml: buildRssFeed(blogs, originOf(req), /* @__PURE__ */ new Date(), {
            title: siteSetting.meta_default_title || void 0,
            // The masthead the admin uploaded, when there is one — never a
            // placeholder.
            logo: (cfg.logoUrl || "").trim() || void 0,
            imageBytes: imageByteSize
          }),
          at: now
        };
      }
      res.status(200).set("Content-Type", "application/rss+xml; charset=utf-8").set("Cache-Control", "public, max-age=600").send(feedCache.xml);
    } catch (err) {
      console.error("rss feed failed:", err?.message);
      res.status(500).type("text/plain").send("feed generation failed");
    }
  });
  app.get("/robots.txt", (req, res) => {
    const proto = String(req.headers["x-forwarded-proto"] || req.protocol || "https").split(",")[0];
    const host = `${proto}://${req.get("host")}`;
    res.set("Content-Type", "text/plain; charset=utf-8").send(`User-agent: *
Allow: /
Sitemap: ${host}/sitemap.xml
Sitemap: ${host}/news-sitemap.xml
`);
  });
  app.get(/^\/News\/(.+)$/i, async (req, res) => {
    const slug = decodeURIComponent(req.params[0] || "").replace(/\/+$/, "");
    if (!slug) return res.redirect(301, "/");
    try {
      const tags = await getActiveTags();
      const tag = tags.find((t) => (t.slug || "").toLowerCase() === slug.toLowerCase());
      if (tag) return res.redirect(301, `/tag/${encodeURIComponent(tag.slug)}`);
      const cats = await getAllCategories();
      const cat = cats.find((c) => (c.slug || "").toLowerCase() === slug.toLowerCase());
      if (cat) return res.redirect(301, `/category/${encodeURIComponent(cat.slug)}`);
    } catch {
    }
    res.status(404).set("Content-Type", "text/html; charset=utf-8").send("<!doctype html><title>404 Not Found</title><h1>404 \u2014 Not Found</h1>");
  });
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    let imageDimensions = function(absUrl, root) {
      if (!absUrl) return null;
      if (dimCache.has(absUrl)) return dimCache.get(absUrl) ?? null;
      let result = null;
      try {
        let pathname;
        try {
          pathname = new URL(absUrl).pathname;
        } catch {
          pathname = absUrl;
        }
        const rel = decodeURIComponent(pathname).replace(/^\/+/, "");
        const file = import_path2.default.resolve(root, rel);
        if (file.startsWith(import_path2.default.resolve(root)) && import_fs2.default.existsSync(file)) {
          const fd = import_fs2.default.openSync(file, "r");
          const buf = Buffer.alloc(32);
          const read = import_fs2.default.readSync(fd, buf, 0, 32, 0);
          import_fs2.default.closeSync(fd);
          if (read >= 24 && buf.slice(0, 8).toString("hex") === "89504e470d0a1a0a") {
            result = { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20), mime: "image/png" };
          } else if (read >= 3 && buf[0] === 255 && buf[1] === 216) {
            const whole = import_fs2.default.readFileSync(file);
            let off = 2;
            while (off + 9 < whole.length) {
              if (whole[off] !== 255) {
                off++;
                continue;
              }
              const marker = whole[off + 1];
              const len = whole.readUInt16BE(off + 2);
              if (marker >= 192 && marker <= 207 && ![196, 200, 204].includes(marker)) {
                result = {
                  height: whole.readUInt16BE(off + 5),
                  width: whole.readUInt16BE(off + 7),
                  mime: "image/jpeg"
                };
                break;
              }
              off += 2 + len;
            }
          } else if (read >= 10 && buf.slice(0, 3).toString("ascii") === "GIF") {
            result = { width: buf.readUInt16LE(6), height: buf.readUInt16LE(8), mime: "image/gif" };
          } else if (read >= 30 && buf.slice(8, 12).toString("ascii") === "WEBP") {
            const whole = import_fs2.default.readFileSync(file);
            if (whole.slice(12, 16).toString("ascii") === "VP8X") {
              result = {
                width: 1 + (whole[24] | whole[25] << 8 | whole[26] << 16),
                height: 1 + (whole[27] | whole[28] << 8 | whole[29] << 16),
                mime: "image/webp"
              };
            }
          }
        }
      } catch {
        result = null;
      }
      dimCache.set(absUrl, result);
      return result;
    };
    const distPath = import_path2.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath, { index: false }));
    const mediaRoot = process.env.LEGACY_MEDIA_ROOT || process.cwd();
    const assetsDir = import_path2.default.join(mediaRoot, "assets");
    const uploadsDir = import_path2.default.join(mediaRoot, "uploads");
    app.use("/assets", import_express.default.static(assetsDir));
    app.use("/uploads", import_express.default.static(uploadsDir));
    {
      const { existsSync } = await import("fs");
      const found = existsSync(assetsDir);
      console.log(
        `[media] LEGACY_MEDIA_ROOT=${mediaRoot} -> ${assetsDir} ${found ? "(found)" : "(MISSING)"}`
      );
      if (!found) {
        console.warn(
          "[media] No assets/ directory there, so /assets/* will 404. Set LEGACY_MEDIA_ROOT to the folder containing the legacy assets/ and uploads/ directories."
        );
      }
    }
    app.use(["/assets", "/uploads"], (_req, res) => {
      res.status(404).type("text/plain").send("Not found");
    });
    const fs2 = await import("fs/promises");
    const getTemplate = async () => {
      if (!shellCache) shellCache = await fs2.readFile(import_path2.default.join(distPath, "index.html"), "utf8");
      return shellCache;
    };
    const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    const RESERVED = /* @__PURE__ */ new Set(["", "admin", "category", "tag", "api", "assets", "uploads", "report.html", "favicon.ico", "sitemap.xml", "news-sitemap.xml", "robots.txt", "rss.xml", "feed.rss", "feed"]);
    const BUILTIN_PAGES = /* @__PURE__ */ new Set(["privacy-policy", "terms-of-service", "disclaimer"]);
    const dimCache = /* @__PURE__ */ new Map();
    const tidyPath = (p) => p.replace(/\s+/g, " ").trim();
    app.get("*", async (req, res) => {
      try {
        let html = withConfigBootstrap(await getTemplate(), await getSiteConfig());
        const seg = decodeURIComponent(req.path).replace(/^\/+|\/+$/g, "");
        html = html.replace(/\n?\s*<meta\s+(name="description"|name="keywords"|property="og:[^"]*"|name="twitter:[^"]*")[^>]*>/gi, "").replace(/\n?\s*<link\s+rel="canonical"[^>]*>/gi, "").replace(/\n?\s*<script\s+type="application\/ld\+json">[\s\S]*?<\/script>/gi, "");
        let injected = false;
        let status = 200;
        if (seg && !seg.includes("/")) {
          const tidySeg = tidyPath(seg);
          if (tidySeg && tidySeg !== seg && await getBlogByUrlSlug(tidySeg)) {
            return res.redirect(301, `/${encodeURI(tidySeg)}`);
          }
        }
        const pageSet = seg && !seg.includes("/") && !RESERVED.has(seg.split("/")[0]) ? await getPageSlugSet() : null;
        const isStaticPage = !!pageSet && pageSet.has(seg.toLowerCase());
        if (isStaticPage) {
          const pg = await getStaticPage(seg.toLowerCase());
          const proto = String(req.headers["x-forwarded-proto"] || req.protocol || "https").split(",")[0];
          const url = esc(`${proto}://${req.get("host")}/${seg.toLowerCase()}`);
          const fb = seg.toLowerCase() === "about-us" ? "About Us \u2014 News Forever" : seg.toLowerCase() === "contact-us" ? "Contact Us \u2014 News Forever" : `${pg.title || seg} \u2014 News Forever`;
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
            `<meta property="og:url" content="${url}">`
          ].filter(Boolean).join("\n    ");
          html = html.replace(/<title>[\s\S]*?<\/title>/i, "").replace("</head>", `    ${tagsP}
  </head>`);
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
            const cleanSlug = (article.url || seg || "").trim();
            const urlRaw = `${origin}/${encodeURIComponent(cleanSlug)}`;
            const url = esc(urlRaw);
            const img = /^https?:/i.test(article.og_image || "") ? article.og_image : article.image;
            const imgEsc = esc(img);
            const dim = imageDimensions(img, mediaRoot);
            const ogTitle = esc(article.og_title || article.meta_title || article.title);
            const ogDesc = esc(article.og_description || article.meta_description || article.short_content || "");
            const publishedAt = parseLegacyDate(article.created_at);
            const modifiedAt = parseLegacyDate(article.updated_at || article.created_at) || publishedAt;
            const isoOrDate = (d, raw) => d ? d.toISOString() : (raw || "").slice(0, 10) || void 0;
            const logoUrl = ((await getSiteConfig()).logoUrl || "").trim();
            const ld = {
              "@context": "https://schema.org",
              "@type": "NewsArticle",
              headline: article.meta_title || article.title,
              description: article.meta_description || article.short_content || "",
              // An ImageObject with the real pixel size, read from the file on
              // disk, rather than a bare URL Google has to fetch to measure.
              image: img ? [
                dim ? { "@type": "ImageObject", url: img, width: dim.width, height: dim.height } : img
              ] : void 0,
              datePublished: isoOrDate(publishedAt, article.created_at),
              dateModified: isoOrDate(modifiedAt, article.updated_at || article.created_at),
              mainEntityOfPage: urlRaw,
              url: urlRaw,
              author: { "@type": "Organization", name: "News Forever", url: origin },
              publisher: {
                "@type": "Organization",
                name: "News Forever",
                ...logoUrl ? { logo: { "@type": "ImageObject", url: logoUrl } } : {}
              },
              ...article.category_name ? { articleSection: article.category_name } : {},
              ...article.meta_keyword ? { keywords: article.meta_keyword } : {},
              ...article.person_name ? { about: { "@type": "Person", name: article.person_name } } : {}
            };
            const ldStr = JSON.stringify(ld).replace(/</g, "\\u003c");
            const personStr = article.person_name ? JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Person",
              name: article.person_name,
              mainEntityOfPage: urlRaw,
              ...img ? { image: img } : {}
            }).replace(/</g, "\\u003c") : "";
            const crumbs = [{ "@type": "ListItem", position: 1, name: "Home", item: origin }];
            const crumbCat = (await getAllCategories()).find(
              (c) => c.id === (article.sub_category_id || article.category_id)
            );
            const crumbSlug = (crumbCat?.slug || "").trim();
            if (crumbCat && crumbSlug && crumbSlug !== "-") {
              crumbs.push({
                "@type": "ListItem",
                position: 2,
                name: crumbCat.category_name,
                item: `${origin}/category/${encodeURI(crumbSlug)}`
              });
            }
            crumbs.push({ "@type": "ListItem", position: crumbs.length + 1, name: article.title, item: urlRaw });
            const breadcrumbStr = JSON.stringify({
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              itemListElement: crumbs
            }).replace(/</g, "\\u003c");
            const tags = [
              `<title>${title}</title>`,
              `<meta name="description" content="${desc}">`,
              article.meta_keyword ? `<meta name="keywords" content="${esc(article.meta_keyword)}">` : "",
              `<link rel="canonical" href="${url}">`,
              // The hero image is the article's LCP element. Without this it
              // is only discovered once React has mounted and rendered the
              // page — about three seconds in on a throttled mobile
              // connection. Preloading starts the download while the HTML is
              // still being parsed.
              imgEsc ? `<link rel="preload" as="image" href="${imgEsc}" fetchpriority="high">` : "",
              `<meta property="og:type" content="article">`,
              `<meta property="og:title" content="${ogTitle}">`,
              `<meta property="og:description" content="${ogDesc}">`,
              imgEsc ? `<meta property="og:image" content="${imgEsc}">` : "",
              imgEsc ? `<meta property="og:image:secure_url" content="${imgEsc}">` : "",
              imgEsc ? `<meta property="og:image:alt" content="${esc(article.alt_tag || article.title)}">` : "",
              dim ? `<meta property="og:image:type" content="${dim.mime}">` : "",
              dim ? `<meta property="og:image:width" content="${dim.width}">` : "",
              dim ? `<meta property="og:image:height" content="${dim.height}">` : "",
              `<meta property="og:url" content="${url}">`,
              `<meta property="og:site_name" content="News Forever">`,
              `<meta property="og:locale" content="en_IN">`,
              `<meta name="twitter:card" content="summary_large_image">`,
              `<meta name="twitter:title" content="${ogTitle}">`,
              `<meta name="twitter:description" content="${ogDesc}">`,
              imgEsc ? `<meta name="twitter:image" content="${imgEsc}">` : "",
              `<script type="application/ld+json">${ldStr}</script>`,
              personStr ? `<script type="application/ld+json">${personStr}</script>` : "",
              `<script type="application/ld+json">${breadcrumbStr}</script>`
            ].filter(Boolean).join("\n    ");
            html = html.replace(/<title>[\s\S]*?<\/title>/i, "").replace("</head>", `    ${tags}
  </head>`);
            const headLevel = (tag, raw) => (raw || "").split("\n").map((t) => t.trim()).filter(Boolean).map((t) => `<${tag}>${esc(t)}</${tag}>`).join("\n");
            const heads = [
              headLevel("h2", article.h2_tag),
              headLevel("h3", article.h3_tag),
              headLevel("h4", article.h4_tag),
              headLevel("h5", article.h5_tag),
              headLevel("h6", article.h6_tag)
            ].filter(Boolean).join("\n");
            const heroImg = imgEsc ? `<img src="${imgEsc}" alt="${esc(article.alt_tag || article.title)}" fetchpriority="high" decoding="async" style="width:100%;max-width:1200px;aspect-ratio:16/9;object-fit:cover">` : "";
            const ssrBody = [
              `<article>`,
              `<h1>${esc(article.title)}</h1>`,
              article.short_content ? `<p>${esc(article.short_content)}</p>` : "",
              heroImg,
              heads,
              `<div>${article.content || ""}</div>`,
              `</article>`
            ].filter(Boolean).join("\n");
            html = html.replace(/<div id="root">\s*<\/div>/i, `<div id="root">${ssrBody}</div>`);
          } else if (!seg.includes("/") && seg.toLowerCase() !== "latest-news" && !BUILTIN_PAGES.has(seg.toLowerCase())) {
            const tidy = tidyPath(seg);
            if (tidy && tidy !== seg) {
              const viaTidy = await getBlogByUrlSlug(tidy);
              if (viaTidy) return res.redirect(301, `/${encodeURI(tidy)}`);
            }
            const key = (tidy || seg).toLowerCase();
            const cat = (await getAllCategories()).find((c) => (c.slug || "").toLowerCase() === key);
            if (cat) return res.redirect(301, `/category/${encodeURIComponent(cat.slug)}`);
            const allTags = await getActiveTags();
            const matching = allTags.filter((t) => (t.slug || "").toLowerCase() === key);
            if (matching.length) {
              const ids = new Set(matching.map((t) => t.id));
              const tagged = (await getPublishedBlogs(1e5)).filter(
                (b) => (b.tag_ids || []).some((id) => ids.has(id))
              );
              if (tagged.length === 1) {
                const only = (tagged[0].url || "").trim();
                if (only && only.toLowerCase() !== key) {
                  return res.redirect(301, `/${encodeURI(only)}`);
                }
              }
              return res.redirect(301, `/tag/${encodeURIComponent(matching[0].slug)}`);
            }
            status = 404;
          }
        }
        if (!injected && seg.toLowerCase().startsWith("tag/")) {
          const tslug = decodeURIComponent(seg.slice(4).split("/")[0] || "");
          if (tslug) {
            const tags = await getActiveTags();
            const tg = tags.find((t) => (t.slug || "").toLowerCase() === tslug.toLowerCase());
            const name = tg ? tg.tag_name : tslug.replace(/-/g, " ");
            const proto = String(req.headers["x-forwarded-proto"] || req.protocol || "https").split(",")[0];
            const url = esc(`${proto}://${req.get("host")}/tag/${encodeURIComponent(tslug)}`);
            const title = esc(`${name} \u2014 News Forever`);
            const desc = esc(`Latest ${name} news, updates and articles on News Forever.`);
            const tags2 = [
              `<title>${title}</title>`,
              `<meta name="description" content="${desc}">`,
              `<link rel="canonical" href="${url}">`,
              `<meta property="og:type" content="website">`,
              `<meta property="og:title" content="${title}">`,
              `<meta property="og:description" content="${desc}">`,
              `<meta property="og:url" content="${url}">`
            ].join("\n    ");
            html = html.replace(/<title>[\s\S]*?<\/title>/i, "").replace("</head>", `    ${tags2}
  </head>`);
            injected = true;
          }
        }
        if (!injected && seg.toLowerCase() === "latest-news") {
          const proto = String(req.headers["x-forwarded-proto"] || req.protocol || "https").split(",")[0];
          const url = esc(`${proto}://${req.get("host")}/latest-news`);
          const title = "Latest News \u2014 News Forever";
          const desc = "The newest national and international reporting on News Forever \u2014 breaking news, beauty pageants, Forever Star India Awards, business, lifestyle and astrology.";
          const tagsL = [
            `<title>${title}</title>`,
            `<meta name="description" content="${desc}">`,
            `<link rel="canonical" href="${url}">`,
            `<meta property="og:type" content="website">`,
            `<meta property="og:title" content="${title}">`,
            `<meta property="og:description" content="${desc}">`,
            `<meta property="og:url" content="${url}">`
          ].join("\n    ");
          html = html.replace(/<title>[\s\S]*?<\/title>/i, "").replace("</head>", `    ${tagsL}
  </head>`);
          injected = true;
        }
        if (!injected && seg.toLowerCase().startsWith("category/")) {
          const cslug = decodeURIComponent(seg.slice(9).split("/")[0] || "");
          if (cslug) {
            const cats = await getAllCategories();
            const cat = cats.find((c) => (c.slug || "").toLowerCase() === cslug.toLowerCase());
            const name = cat ? cat.category_name : cslug.replace(/-/g, " ");
            const proto = String(req.headers["x-forwarded-proto"] || req.protocol || "https").split(",")[0];
            const url = esc(`${proto}://${req.get("host")}/category/${encodeURIComponent(cslug)}`);
            const title = esc(cat?.meta_title || `${name} \u2014 News Forever`);
            const desc = esc(cat?.meta_description || `Latest ${name} news, updates and articles on News Forever.`);
            const tagsC = [
              `<title>${title}</title>`,
              `<meta name="description" content="${desc}">`,
              `<link rel="canonical" href="${url}">`,
              `<meta property="og:type" content="website">`,
              `<meta property="og:title" content="${title}">`,
              `<meta property="og:description" content="${desc}">`,
              `<meta property="og:url" content="${url}">`
            ].join("\n    ");
            html = html.replace(/<title>[\s\S]*?<\/title>/i, "").replace("</head>", `    ${tagsC}
  </head>`);
            injected = true;
          }
        }
        if (!injected) {
          const cfg = await getSiteConfig();
          const assetBase = (process.env.LEGACY_ASSET_BASE || "https://newsforever.in/").replace(/\/$/, "") + "/";
          const st = esc(cfg.siteTitle || siteSetting.meta_default_title || "News Forever | National & International News Portal");
          const sd = esc(cfg.siteDescription || siteSetting.meta_default_description || "Latest breaking news, beauty pageant updates, Forever Star India Awards, products, astrology, and international editorial coverage.");
          const sk = esc(cfg.siteKeywords || siteSetting.meta_default_keywords || "");
          const proto = String(req.headers["x-forwarded-proto"] || req.protocol || "https").split(",")[0];
          const url = esc(`${proto}://${req.get("host")}${req.path}`);
          const oiRaw = cfg.ogImage ? /^https?:/i.test(cfg.ogImage) ? cfg.ogImage : assetBase + cfg.ogImage.replace(/^\/+/, "") : "";
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
            oi ? `<meta name="twitter:image" content="${oi}">` : ""
          ];
          if (req.path === "/" || seg === "") {
            const origin = `${proto}://${req.get("host")}`;
            const logo = cfg.logoUrl ? /^https?:/i.test(cfg.logoUrl) ? cfg.logoUrl : assetBase + cfg.logoUrl.replace(/^\/+/, "") : siteSetting.site_logo || "";
            const sameAs = [siteSetting.facebook_url, siteSetting.instagram_url, siteSetting.twitter_url, siteSetting.youtube_url].filter(Boolean);
            const org = {
              "@context": "https://schema.org",
              "@type": "NewsMediaOrganization",
              name: "News Forever",
              url: origin,
              description: cfg.siteDescription || "Beauty pageants, Forever Star India Awards, national achievers, business, astrology and national news.",
              ...logo ? { logo: { "@type": "ImageObject", url: logo } } : {},
              ...sameAs.length ? { sameAs } : {}
            };
            const website = {
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "News Forever",
              url: origin,
              publisher: { "@type": "Organization", name: "News Forever", ...logo ? { logo: { "@type": "ImageObject", url: logo } } : {} }
            };
            tags.push(`<script type="application/ld+json">${JSON.stringify(org).replace(/</g, "\\u003c")}</script>`);
            tags.push(`<script type="application/ld+json">${JSON.stringify(website).replace(/</g, "\\u003c")}</script>`);
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
                    name: b.meta_title || b.title
                  }))
                };
                tags.push(`<script type="application/ld+json">${JSON.stringify(itemList).replace(/</g, "\\u003c")}</script>`);
              }
            } catch {
            }
          }
          html = html.replace(/<title>[\s\S]*?<\/title>/i, "").replace("</head>", `    ${tags.filter(Boolean).join("\n    ")}
  </head>`);
        }
        res.status(status).set("Content-Type", "text/html; charset=utf-8").set("Cache-Control", "public, max-age=0, must-revalidate").send(html);
      } catch {
        res.sendFile(import_path2.default.join(distPath, "index.html"));
      }
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express Backend + Headless CodeIgniter Bridge Server running at http://0.0.0.0:${PORT}`);
    if (process.env.NODE_ENV === "production") {
      void syncHomepageShell(import_path2.default.join(process.cwd(), "dist"));
    }
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
