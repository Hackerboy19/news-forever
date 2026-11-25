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
 * Build the canonical URL for the current view: origin + clean path, never
 * the query string. It must match the canonical the server injects, or
 * Google sees two different canonicals and picks its own ("Duplicate,
 * Google chose different canonical than user"). The server canonicalises
 * ?lang=hi (a client-side translation of the same HTML) to the English URL,
 * so it gets no canonical or hreflang of its own; campaign parameters
 * (?utm_source=…) are dropped for the same reason.
 */
export function canonicalUrl(loc: Location = window.location): string {
  return loc.origin + (loc.pathname.replace(/\/+$/, '') || '/');
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
    //
    // An explicit meta title is used exactly as written. It is the field an
    // editor fills in to control the full <title>, the admin panel scores its
    // length as the whole thing, and the server writes it verbatim into the
    // server-rendered <head>. Appending "| News Forever" here meant the
    // document that crawlers fetched and the document a reader's browser
    // ended up with disagreed on every page, and pushed long titles past the
    // length Google will display. The site name is only added when falling
    // back to the raw article headline, which was never written to stand
    // alone as a title.
    const explicitTitle = article?.meta_title || meta_title;
    const rawTitle = article?.title || title;
    const finalTitle = explicitTitle
      ? explicitTitle
      : rawTitle
      ? `${rawTitle} | ${siteName}`
      : defaultTitle;
    const activeTitle = explicitTitle || rawTitle;
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

    // Canonical: an explicit override, else the article's stored slug (what
    // the server uses — not the legacy og_url column, which can hold a stray
    // space), else the cleaned current URL. See canonicalUrl.
    const articleSlug = (article?.url || '').trim();
    const activeUrl =
      og_url ||
      (typeof window !== 'undefined'
        ? articleSlug
          ? `${window.location.origin}/${encodeURIComponent(articleSlug)}`
          : canonicalUrl()
        : '');
    if (activeUrl) {
      setMetaTag('property', 'og:url', activeUrl);
      setLinkTag('canonical', activeUrl);
    }

    // ?lang=hi is a client-side translation of the same server HTML, not a
    // separate indexable page, so it must not be advertised via hreflang
    // (the server canonicals it to the English URL). Remove stale alternates.
    document.querySelectorAll('link[id^="hreflang-"]').forEach((el) => el.remove());

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

