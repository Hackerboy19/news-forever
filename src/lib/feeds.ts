/**
 * Google News sitemap and RSS 2.0 feed builders.
 *
 * Pure functions over the existing CIBlog model, kept out of server.ts so the
 * date filtering, escaping and exclusion rules can be tested without booting
 * Express or reaching MySQL.
 */
import { CIBlog } from '../types';

/** What Google News calls the publication. */
export const PUBLICATION_NAME = 'News Forever';
/** Articles are written in English; ?lang=hi is a server-side translation. */
export const PUBLICATION_LANGUAGE = 'en';
/** Google News only accepts articles from roughly the last two days. */
export const NEWS_WINDOW_HOURS = 48;
/** Google caps a news sitemap at 1000 URLs. */
export const NEWS_MAX_ITEMS = 1000;
/** How many articles the RSS feed carries. */
export const RSS_MAX_ITEMS = 50;

export function xmlEscape(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
    // Characters XML 1.0 forbids outright. A stray control byte in a legacy
    // row would otherwise make the whole document unparseable, which fails
    // the feed for every article rather than just the bad one.
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
}

/**
 * Parse `ci_blog.created_at`, which is a varchar in CodeIgniter's own format:
 *
 *     2026-09-23 : 17:13:39
 *
 * `new Date()` cannot read that — the " : " between date and time is not
 * valid in any format it accepts — so it is picked apart by hand. The parts
 * are fed to the local-time Date constructor on purpose: legacyNow() in db.ts
 * writes these rows with local components too, so reading them back the same
 * way is the only interpretation that round-trips.
 *
 * Returns null for anything unparseable or out of range, so a bad row drops
 * out of the feed instead of poisoning it with "Invalid Date".
 */
export function parseLegacyDate(raw: string | undefined | null): Date | null {
  const s = String(raw ?? '').trim();
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
  // Guard against a row like 2026-02-31 silently rolling into March.
  if (dt.getFullYear() !== year || dt.getMonth() !== month - 1 || dt.getDate() !== day) return null;
  return dt;
}

/** RFC 822 date, which RSS 2.0 requires for pubDate. */
export function rfc822(d: Date): string {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const p = (n: number) => String(n).padStart(2, '0');
  return (
    `${days[d.getUTCDay()]}, ${p(d.getUTCDate())} ${months[d.getUTCMonth()]} ${d.getUTCFullYear()} ` +
    `${p(d.getUTCHours())}:${p(d.getUTCMinutes())}:${p(d.getUTCSeconds())} GMT`
  );
}

export interface FeedArticle {
  slug: string;
  title: string;
  summary: string;
  published: Date;
}

/**
 * The articles that belong in a feed, in newest-first order.
 *
 * Excluded, in line with what a feed is allowed to advertise:
 *   - anything not published (callers pass the published set, but status is
 *     re-checked so a future caller cannot leak drafts through)
 *   - rows with no slug, or the "-" placeholder some legacy rows carry
 *   - slugs containing whitespace. Those cannot be fetched at the URL they
 *     imply, so advertising them would be advertising a 404
 *   - duplicate slugs, which legacy ci_category/ci_blog rows do have
 *   - rows whose created_at will not parse, since a news item without a
 *     real publication date is not usable
 */
export function selectFeedArticles(
  blogs: CIBlog[],
  opts: { now?: Date; withinHours?: number; limit?: number } = {}
): FeedArticle[] {
  const now = opts.now ?? new Date();
  const cutoff = opts.withinHours ? now.getTime() - opts.withinHours * 3600_000 : null;
  const seen = new Set<string>();
  const out: FeedArticle[] = [];

  for (const b of blogs) {
    if (b.status !== 1) continue;
    const slug = (b.url || '').trim();
    if (!slug || slug === '-') continue;
    if (/\s/.test(slug)) continue;
    const key = slug.toLowerCase();
    if (seen.has(key)) continue;

    const published = parseLegacyDate(b.created_at);
    if (!published) continue;
    // A row dated in the future is a data-entry slip, not news yet.
    if (published.getTime() > now.getTime() + 3600_000) continue;
    if (cutoff !== null && published.getTime() < cutoff) continue;

    const title = (b.title || '').trim();
    if (!title) continue;

    seen.add(key);
    out.push({
      slug,
      title,
      summary: (b.short_content || b.meta_description || '').trim(),
      published,
    });
  }

  out.sort((a, z) => z.published.getTime() - a.published.getTime());
  return typeof opts.limit === 'number' ? out.slice(0, opts.limit) : out;
}

/** Absolute, canonical URL for an article — the same shape the page's own canonical tag uses. */
export function articleUrl(origin: string, slug: string): string {
  return `${origin.replace(/\/+$/, '')}/${encodeURI(slug)}`;
}

/**
 * Google News sitemap for articles published in the last NEWS_WINDOW_HOURS.
 *
 * An empty window is normal for a site that does not publish daily, and is
 * returned as a valid empty <urlset> rather than an error — Google treats a
 * well-formed empty sitemap as "nothing new", which is the truth.
 */
export function buildNewsSitemap(blogs: CIBlog[], origin: string, now: Date = new Date()): string {
  const items = selectFeedArticles(blogs, {
    now,
    withinHours: NEWS_WINDOW_HOURS,
    limit: NEWS_MAX_ITEMS,
  });
  const urls = items
    .map(
      (a) =>
        `  <url>\n` +
        `    <loc>${xmlEscape(articleUrl(origin, a.slug))}</loc>\n` +
        `    <news:news>\n` +
        `      <news:publication>\n` +
        `        <news:name>${xmlEscape(PUBLICATION_NAME)}</news:name>\n` +
        `        <news:language>${PUBLICATION_LANGUAGE}</news:language>\n` +
        `      </news:publication>\n` +
        `      <news:publication_date>${a.published.toISOString()}</news:publication_date>\n` +
        `      <news:title>${xmlEscape(a.title)}</news:title>\n` +
        `    </news:news>\n` +
        `  </url>`
    )
    .join('\n');
  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n` +
    `        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">\n` +
    (urls ? `${urls}\n` : '') +
    `</urlset>\n`
  );
}

/** RSS 2.0 feed of the most recent published articles. */
export function buildRssFeed(
  blogs: CIBlog[],
  origin: string,
  now: Date = new Date(),
  opts: { title?: string; description?: string } = {}
): string {
  const base = origin.replace(/\/+$/, '');
  const items = selectFeedArticles(blogs, { now, limit: RSS_MAX_ITEMS });
  const channelTitle = opts.title || PUBLICATION_NAME;
  const channelDesc =
    opts.description ||
    'National and international reporting from News Forever — breaking news, beauty pageants, Forever Star India Awards, business, lifestyle and astrology.';
  // lastBuildDate reflects the newest article, not the moment of the request,
  // so a reader polling an unchanged feed sees an unchanged value.
  const lastBuild = items.length ? items[0].published : now;

  const body = items
    .map((a) => {
      const link = articleUrl(base, a.slug);
      return (
        `    <item>\n` +
        `      <title>${xmlEscape(a.title)}</title>\n` +
        `      <link>${xmlEscape(link)}</link>\n` +
        `      <guid isPermaLink="true">${xmlEscape(link)}</guid>\n` +
        `      <pubDate>${rfc822(a.published)}</pubDate>\n` +
        (a.summary ? `      <description>${xmlEscape(a.summary)}</description>\n` : '') +
        `    </item>`
      );
    })
    .join('\n');

  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n` +
    `  <channel>\n` +
    `    <title>${xmlEscape(channelTitle)}</title>\n` +
    `    <link>${xmlEscape(base + '/')}</link>\n` +
    `    <description>${xmlEscape(channelDesc)}</description>\n` +
    `    <language>${PUBLICATION_LANGUAGE}</language>\n` +
    `    <lastBuildDate>${rfc822(lastBuild)}</lastBuildDate>\n` +
    `    <atom:link href="${xmlEscape(base + '/feed')}" rel="self" type="application/rss+xml" />\n` +
    (body ? `${body}\n` : '') +
    `  </channel>\n` +
    `</rss>\n`
  );
}
