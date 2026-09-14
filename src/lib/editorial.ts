/**
 * Presentation helpers for the Figma re-theme. Pure styling/derivation —
 * never mutates or rewrites database content.
 */

/** Rotating chip palette matching the Figma design (tan/blue/green/purple/rose). */
const CHIP_PALETTES = [
  'bg-amber-100 text-amber-900',
  'bg-blue-100 text-blue-900',
  'bg-emerald-100 text-emerald-900',
  'bg-purple-100 text-purple-900',
  'bg-rose-100 text-rose-900',
  'bg-cyan-100 text-cyan-900',
];

/** Deterministic chip color for a category (stable across renders). */
export function chipClass(key: string | number | undefined): string {
  const s = String(key ?? '');
  let hash = 0;
  for (let i = 0; i < s.length; i++) hash = (hash * 31 + s.charCodeAt(i)) | 0;
  return CHIP_PALETTES[Math.abs(hash) % CHIP_PALETTES.length];
}

/** Approximate reading time from the raw description HTML (200 wpm). */
export function readMinutes(html: string | undefined): number {
  if (!html) return 1;
  const words = html.replace(/<[^>]*>/g, ' ').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

/* ---------------------------------------------------------------------------
   Author bylines
--------------------------------------------------------------------------- */

/** House byline used when no real journalist can be resolved. */
export const NEWSROOM_BYLINE = 'News Forever Bureau';

/**
 * Generic `ci_admin` account names that are not real people.
 *
 * `ci_blog.user_created_by` is joined to `ci_admin` in `db.ts`, so the byline
 * is already the account's real `firstname lastname` — but in this database
 * most articles were filed by a shared operations login literally named
 * "Admin User". Printing that as the author is worse than printing nothing:
 * it tells readers and search engines that nobody is accountable for the
 * story. These names are therefore treated as "no author" and fall back to
 * the newsroom byline.
 *
 * The durable fix is data, not code — give each editor their own `ci_admin`
 * row with their real name (no schema change needed) and their byline will
 * appear automatically.
 */
const GENERIC_AUTHOR_NAMES = new Set([
  'admin',
  'admin user',
  'administrator',
  'superadmin',
  'super admin',
  'test user',
  'user',
  'news forever',
]);

/**
 * The byline to display for an article, or `null` when the stored author is a
 * generic system account.
 */
export function resolveAuthorName(rawName: string | null | undefined): string | null {
  const name = String(rawName || '').trim().replace(/\s+/g, ' ');
  if (!name) return null;
  return GENERIC_AUTHOR_NAMES.has(name.toLowerCase()) ? null : name;
}

/* ---------------------------------------------------------------------------
   Promotional / sponsored content detection
   ---------------------------------------------------------------------------
   `ci_blog` has no "sponsored" column, and this project does not alter the
   legacy schema — so promotional articles are identified from columns that
   already exist: the category the editor filed the piece under, and the
   keyword list. `type` is deliberately NOT used: it is homepage placement
   (0 none, 1 Popular Posts, 2 Our Picks), not a commercial flag.

   This is a heuristic, and it is meant to be one. Advertising disclosure is a
   legal obligation (and a Google policy requirement), so the right long-term
   fix is an explicit flag set by the editor. When a column or a dedicated
   "Sponsored" tag is added, make `isSponsoredArticle` read it and keep the
   lists below only as a fallback for historical rows.
--------------------------------------------------------------------------- */

/** Category slugs whose articles are commercial by nature. */
export const SPONSORED_CATEGORY_SLUGS = [
  'products',
  'franchise',
  'brand-ambassador-program',
  'cosmetics',
  'health-care',
];

/** Keyword fragments (matched case-insensitively) that mark paid placement. */
export const SPONSORED_KEYWORDS = [
  'sponsored',
  'paid promotion',
  'advertorial',
  'brand partnership',
  'franchise opportunity',
  'low investment business',
  'high return franchise',
];

export interface SponsorableArticle {
  category_name?: string;
  meta_keyword?: string;
  [key: string]: unknown;
}

function slugify(value: string): string {
  return value.trim().toLowerCase().replace(/[\s_]+/g, '-');
}

/**
 * True when an article should carry a "Sponsored" disclosure.
 *
 * Errs toward disclosure: labelling an editorial piece as sponsored is a
 * cosmetic error, while failing to label a paid one is a compliance failure.
 */
export function isSponsoredArticle(article: SponsorableArticle | null | undefined): boolean {
  if (!article) return false;

  const categorySlug = slugify(String(article.category_name || ''));
  if (categorySlug && SPONSORED_CATEGORY_SLUGS.includes(categorySlug)) return true;

  const keywords = String(article.meta_keyword || '').toLowerCase();
  return keywords ? SPONSORED_KEYWORDS.some((k) => keywords.includes(k)) : false;
}

/** Real FSIA registration CTAs for the sidebar "Register Now" stack. */
export const REGISTER_LINKS = [
  { label: 'Miss India 2026 — Register', href: 'https://www.fsia.in/forever-miss-india-new.php', color: 'bg-[#B91C1C] hover:bg-[#991B1B]' },
  { label: 'Mrs India 2026 — Register', href: 'https://www.fsia.in/forever-mrs-india-new.php', color: 'bg-purple-700 hover:bg-purple-800' },
  { label: 'Miss Teen India 2026 — Register', href: 'https://www.fsia.in/forever-miss-teen-india-new.php', color: 'bg-blue-700 hover:bg-blue-800' },
  { label: 'Super Woman Award 2026 — Register', href: 'https://www.fsia.in/super-woman-award.php', color: 'bg-emerald-700 hover:bg-emerald-800' },
];
