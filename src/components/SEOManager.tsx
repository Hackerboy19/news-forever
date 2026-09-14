import React, { useEffect } from 'react';
import { CIBlog } from '../types';
import { resolveAuthorName, NEWSROOM_BYLINE } from '../lib/editorial';

export interface SEOProps {
  article?: CIBlog | null;
  title?: string;
  meta_title?: string;
  meta_description?: string;
  meta_keyword?: string;
  og_title?: string;
  og_description?: string;
  og_image?: string;
  og_url?: string;
  image?: string;
  defaultTitle?: string;
  /** Description used when no article is in scope (e.g. the homepage). */
  defaultDescription?: string;
  siteName?: string;
}

/** The site-wide homepage title and description. */
export const DEFAULT_TITLE = 'News Forever - National & International News Portal';
export const DEFAULT_DESCRIPTION =
  'News Forever delivers 24x7 national and international coverage — beauty pageants and Miss/Mrs India results, Forever Star India Awards, business, astrology, products and lifestyle reporting from across India.';

/**
 * Build the canonical URL for the current view.
 *
 * Only `lang` survives from the query string: `?lang=hi` is a genuinely
 * distinct, indexable translation (it has its own hreflang alternate), whereas
 * campaign and pagination parameters are not. Letting `?utm_source=…`
 * self-canonicalise would split ranking signals across endless duplicate URLs.
 */
export function canonicalUrl(loc: Location = window.location): string {
  const url = new URL(loc.origin + loc.pathname);
  const lang = new URLSearchParams(loc.search).get('lang');
  if (lang === 'hi') url.searchParams.set('lang', 'hi');
  return url.toString();
}

export type SEOManagerProps = SEOProps;

export const SEOManager: React.FC<SEOProps> = ({
  article,
  title,
  meta_title,
  meta_description,
  meta_keyword,
  og_title,
  og_description,
  og_image,
  og_url,
  image,
  defaultTitle = DEFAULT_TITLE,
  defaultDescription = DEFAULT_DESCRIPTION,
  siteName = 'News Forever',
}) => {
  useEffect(() => {
    // Extract props from article object if present, else fallback to individual props
    const activeTitle = article?.meta_title || article?.title || meta_title || title;
    const finalTitle = activeTitle ? `${activeTitle} | ${siteName}` : defaultTitle;
    document.title = finalTitle;

    // Helper function to update or create meta tags
    const setMetaTag = (attribute: 'name' | 'property', attrValue: string, contentValue?: string) => {
      if (!contentValue) return;
      let element = document.querySelector(`meta[${attribute}="${attrValue}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, attrValue);
        document.head.appendChild(element);
      }
      element.setAttribute('content', contentValue);
    };

    // Helper function to update or create link tags
    const setLinkTag = (relValue: string, hrefValue?: string) => {
      if (!hrefValue) return;
      let element = document.querySelector(`link[rel="${relValue}"]`);
      if (!element) {
        element = document.createElement('link');
        element.setAttribute('rel', relValue);
        document.head.appendChild(element);
      }
      element.setAttribute('href', hrefValue);
    };

    // 2. Standard Meta Tags
    const activeDesc = article?.meta_description || article?.short_content || meta_description;
    const finalDesc = activeDesc || defaultDescription;
    setMetaTag('name', 'description', finalDesc);

    const activeKeywords = article?.meta_keyword || meta_keyword;
    if (activeKeywords) {
      setMetaTag('name', 'keywords', activeKeywords);
    }

    // 3. Open Graph Meta Tags
    const activeOgTitle = article?.og_title || og_title || activeTitle || finalTitle;
    setMetaTag('property', 'og:title', activeOgTitle);

    const activeOgDesc = article?.og_description || og_description || finalDesc;
    setMetaTag('property', 'og:description', activeOgDesc);

    const activeImage = article?.og_image || article?.image || og_image || image || 'https://newsforever.in/assets/img/logo.png';
    setMetaTag('property', 'og:image', activeImage);

    // Canonical: the article's stored og_url wins, then an explicit override,
    // then the cleaned current URL (never the raw href — see canonicalUrl).
    const activeUrl =
      article?.og_url || og_url || (typeof window !== 'undefined' ? canonicalUrl() : '');
    if (activeUrl) {
      setMetaTag('property', 'og:url', activeUrl);
      setLinkTag('canonical', activeUrl);
    }

    // hreflang alternates — valid now that ?lang=hi is a distinct, indexable
    // URL serving server-translated Hindi content
    const base = window.location.origin + window.location.pathname;
    const alternates: [string, string][] = [
      ['en-IN', base],
      ['hi-IN', `${base}?lang=hi`],
      ['x-default', base],
    ];
    for (const [code, href] of alternates) {
      const id = `hreflang-${code}`;
      let link = document.getElementById(id) as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement('link');
        link.rel = 'alternate';
        link.id = id;
        document.head.appendChild(link);
      }
      link.hreflang = code;
      link.href = href;
    }

    // 4. JSON-LD structured data — keeps the rich niche keywords (beauty
    // pageant, awards) for ranking even though the visible nav uses broad
    // editorial labels.
    const ldId = 'seo-jsonld';
    let ldScript = document.getElementById(ldId) as HTMLScriptElement | null;
    if (!ldScript) {
      ldScript = document.createElement('script');
      ldScript.type = 'application/ld+json';
      ldScript.id = ldId;
      document.head.appendChild(ldScript);
    }
    const jsonLd = article
      ? {
          '@context': 'https://schema.org',
          '@type': 'NewsArticle',
          headline: article.meta_title || article.title,
          description: activeDesc,
          image: [activeImage],
          keywords: article.meta_keyword || 'beauty pageant, miss india, forever star india awards, news',
          datePublished: (article.created_at || '').split(' ')[0],
          // A shared "Admin User" login is not a Person; attribute those to
          // the organisation so the structured data stays truthful.
          author: resolveAuthorName(article.author_name)
            ? { '@type': 'Person', name: resolveAuthorName(article.author_name) }
            : { '@type': 'Organization', name: NEWSROOM_BYLINE },
          publisher: { '@type': 'NewsMediaOrganization', name: siteName, url: 'https://newsforever.in/' },
          mainEntityOfPage: activeUrl,
        }
      : {
          '@context': 'https://schema.org',
          '@type': 'NewsMediaOrganization',
          name: siteName,
          url: 'https://newsforever.in/',
          description: finalDesc,
          knowsAbout: ['Beauty Pageants', 'Miss India', 'Mrs India', 'Forever Star India Awards', 'Business News', 'Astrology', 'Lifestyle'],
        };
    ldScript.textContent = JSON.stringify(jsonLd);
  }, [
    article,
    title,
    meta_title,
    meta_description,
    meta_keyword,
    og_title,
    og_description,
    og_image,
    og_url,
    image,
    defaultTitle,
    defaultDescription,
    siteName,
  ]);

  return null; // Purely head-side manager component
};

export default SEOManager;

