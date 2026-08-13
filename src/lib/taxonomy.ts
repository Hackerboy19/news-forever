/**
 * Shared navigation taxonomy + category slug resolution.
 *
 * The public nav uses the live newsforever.in slugs (e.g. /category/miss-india),
 * while the legacy ci_category table stores year-suffixed variants
 * (Miss-India-2024, Miss-India-2025, City-Winner, ...). This module maps a
 * public slug to the set of real ci_category ids, including child categories.
 * Used both by the Express API (?category_slug=) and client-side filtering.
 */

export interface NavItem {
  name: string;
  slug?: string; // public category slug filtered against ci_category
  href?: string; // external page on the live site
  subcategories?: NavItem[];
}

/**
 * Visible labels use broad editorial categories (news-portal positioning) —
 * niche terms (Pageant/Award) stay out of the top-level nav on stakeholder
 * request, while slugs keep mapping to the same legacy category URLs so SEO
 * metadata and existing indexed links are unaffected.
 */
export const NAVIGATION_TAXONOMY: NavItem[] = [
  { name: 'Home', slug: 'all' },
  {
    name: 'Fashion & Glamour',
    slug: 'fashion-glamour',
    subcategories: [
      { name: 'Miss India', slug: 'miss-india' },
      { name: 'Mrs India', slug: 'mrs-india' },
      { name: 'Miss Teen India', slug: 'miss-teen-india' },
      { name: 'City Finalists', slug: 'city-finalists' },
      { name: 'State Winners', slug: 'state-winners' },
    ],
  },
  {
    name: 'Entertainment',
    slug: 'entertainment',
    subcategories: [
      { name: 'Super Woman', slug: 'super-woman-award' },
      { name: 'Super Hero', slug: 'super-hero-award' },
      { name: 'National Achievers', slug: 'national-achiever-award' },
      { name: 'Nominate Yourself', slug: 'nominate-yourself-award' },
    ],
  },
  { name: 'Lifestyle & Products', slug: 'products' },
  { name: 'Business', slug: 'business-news' },
  { name: 'Astrology', slug: 'astrology' },
  { name: 'About Us', href: 'https://newsforever.in/about-us' },
  { name: 'Contact Us', href: 'https://newsforever.in/contact-us' },
];

/**
 * Aliases mapping public slugs to prefixes of real ci_category.url values.
 * A category matches when its lowercased url starts with any listed prefix.
 */
const SLUG_ALIASES: Record<string, string[]> = {
  'miss-india': ['miss-india'],
  'mrs-india': ['mrs-india', 'forever-mrs-india'],
  'miss-teen-india': ['miss-teen-india', 'forever-miss-teen-india'],
  'city-finalists': ['city-winner', 'city-finalist'],
  'state-winners': ['state-winner'],
  'national-achiever-award': ['national-achiever'],
  news: ['business-news', 'astrology', 'products', 'franchise'],
  lifestyle: ['products', 'franchise'],
  'political-news': ['political-news', 'politics', 'political'],
  // Broad editorial labels → legacy category groups
  'fashion-glamour': ['beauty-pageant', 'miss-india', 'mrs-india', 'miss-teen-india'],
  entertainment: [
    'forever-star-india-awards',
    'forever-star-india',
    'super-woman-award',
    'super-hero-award',
    'national-achiever',
    'nominate-yourself-award',
    'star-india-kids-contest',
  ],
};

/**
 * Broad umbrella nav (stakeholder voice note): top-level labels avoid the
 * words "Pageant"/"Awards" entirely, while `covers` lists the real
 * top-level ci_category slugs grouped underneath — so every live category
 * stays reachable and legacy /category/ URLs and SEO stay untouched.
 */
export const NAV_UMBRELLAS: { name: string; slug: string; covers: string[] }[] = [
  // Appears automatically once a Political News category exists in the CMS
  { name: 'Political News', slug: 'political-news', covers: ['political-news', 'politics', 'political'] },
  { name: 'Fashion & Glamour', slug: 'fashion-glamour', covers: ['beauty-pageant'] },
  {
    name: 'Entertainment',
    slug: 'entertainment',
    covers: ['forever-star-india-awards', 'star-india-kids-contest-2026', 'nominate-yourself-award', 'forever-star-india'],
  },
  { name: 'Business', slug: 'business-news', covers: ['business-news'] },
  { name: 'Lifestyle & Products', slug: 'lifestyle', covers: ['products', 'franchise'] },
  { name: 'Astrology', slug: 'astrology', covers: ['astrology'] },
];

export interface CategoryLike {
  id: number;
  parent_id?: number;
  slug: string;
}

/**
 * Resolve a public slug to the set of matching ci_category ids,
 * expanded with all descendant categories.
 */
export function resolveCategoryIds(slug: string, categories: CategoryLike[]): Set<number> {
  const wanted = slug.toLowerCase();
  const prefixes = SLUG_ALIASES[wanted] || [wanted];

  const matched = new Set<number>();
  for (const cat of categories) {
    const url = (cat.slug || '').toLowerCase().trim();
    if (prefixes.some((p) => url === p || url.startsWith(p + '-') || url.startsWith(p))) {
      matched.add(cat.id);
    }
  }

  // Expand to descendants (one pass per depth level; taxonomy is shallow)
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
