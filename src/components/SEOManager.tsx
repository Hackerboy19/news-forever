import React, { useEffect } from 'react';
import { CIBlog } from '../types';

export interface SEOManagerProps {
  article?: CIBlog | null;
  siteName?: string;
  defaultTitle?: string;
  defaultDescription?: string;
  defaultImage?: string;
  canonicalUrl?: string;
}

/**
 * SEOManager Utility Component
 * Dynamically updates document head tags (title, meta description, og:image, twitter cards, canonical links & JSON-LD schema)
 * for optimal search engine performance and social sharing metadata.
 */
export const SEOManager: React.FC<SEOManagerProps> = ({
  article,
  siteName = 'News Forever',
  defaultTitle = 'News Forever | Official News, Pageantry & FSIA Portal',
  defaultDescription = 'Latest breaking news, beauty pageant updates, Forever Star India Awards, products, astrology, and international editorial coverage.',
  defaultImage = 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=1200&auto=format&fit=crop&q=80',
  canonicalUrl,
}) => {
  useEffect(() => {
    // 1. Determine Title
    let pageTitle = defaultTitle;
    if (article) {
      const rawTitle = article.meta_title || article.title;
      pageTitle = `${rawTitle} | ${siteName}`;
    }
    document.title = pageTitle;

    // Helper function to create or update meta tag
    const updateMetaTag = (selector: string, attrName: string, attrVal: string, content: string) => {
      if (!content) return;
      let element = document.querySelector(selector) as HTMLMetaElement | null;
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attrName, attrVal);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // Helper function to create or update link tag (canonical)
    const updateLinkTag = (rel: string, href: string) => {
      if (!href) return;
      let element = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
      if (!element) {
        element = document.createElement('link');
        element.setAttribute('rel', rel);
        document.head.appendChild(element);
      }
      element.setAttribute('href', href);
    };

    const currentUrl = canonicalUrl || (article?.og_url ? article.og_url : window.location.href);
    const description = article?.meta_description || article?.short_content || defaultDescription;
    const keywords = article?.meta_keyword || 'news forever, beauty pageant, forever star india awards, astrology, business news';
    const author = article?.author_name || 'News Forever Desk';
    const image = article?.og_image || article?.image || defaultImage;
    const ogTitle = article?.og_title || article?.title || pageTitle;

    // 2. Standard Meta Tags
    updateMetaTag('meta[name="description"]', 'name', 'description', description);
    updateMetaTag('meta[name="keywords"]', 'name', 'keywords', keywords);
    updateMetaTag('meta[name="author"]', 'name', 'author', author);
    updateMetaTag('meta[name="robots"]', 'name', 'robots', 'index, follow');

    // 3. OpenGraph Tags
    updateMetaTag('meta[property="og:title"]', 'property', 'og:title', ogTitle);
    updateMetaTag('meta[property="og:description"]', 'property', 'og:description', description);
    updateMetaTag('meta[property="og:url"]', 'property', 'og:url', currentUrl);
    updateMetaTag('meta[property="og:image"]', 'property', 'og:image', image);
    updateMetaTag('meta[property="og:site_name"]', 'property', 'og:site_name', siteName);
    updateMetaTag('meta[property="og:type"]', 'property', 'og:type', article ? 'article' : 'website');

    if (article) {
      updateMetaTag('meta[property="article:published_time"]', 'property', 'article:published_time', article.created_at);
      if (article.category_name) {
        updateMetaTag('meta[property="article:section"]', 'property', 'article:section', article.category_name);
      }
    }

    // 4. Twitter Card Tags
    updateMetaTag('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image');
    updateMetaTag('meta[name="twitter:title"]', 'name', 'twitter:title', ogTitle);
    updateMetaTag('meta[name="twitter:description"]', 'name', 'twitter:description', description);
    updateMetaTag('meta[name="twitter:image"]', 'name', 'twitter:image', image);

    // 5. Canonical Link
    updateLinkTag('canonical', currentUrl);

    // 6. JSON-LD Schema.org Structured Data Injection
    const schemaId = 'seo-manager-jsonld';
    let schemaScript = document.getElementById(schemaId) as HTMLScriptElement | null;
    if (!schemaScript) {
      schemaScript = document.createElement('script');
      schemaScript.id = schemaId;
      schemaScript.type = 'application/ld+json';
      document.head.appendChild(schemaScript);
    }

    if (article) {
      const jsonLdData = {
        '@context': 'https://schema.org',
        '@type': 'NewsArticle',
        'headline': article.title,
        'description': description,
        'image': [image],
        'datePublished': article.created_at,
        'author': {
          '@type': 'Person',
          'name': author,
        },
        'publisher': {
          '@type': 'Organization',
          'name': siteName,
          'logo': {
            '@type': 'ImageObject',
            'url': 'https://newsforever.in/assets/img/logo.png',
          },
        },
        'mainEntityOfPage': {
          '@type': 'WebPage',
          '@id': currentUrl,
        },
      };
      schemaScript.textContent = JSON.stringify(jsonLdData);
    } else {
      const jsonLdData = {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        'name': siteName,
        'url': currentUrl,
        'description': defaultDescription,
      };
      schemaScript.textContent = JSON.stringify(jsonLdData);
    }
  }, [article, siteName, defaultTitle, defaultDescription, defaultImage, canonicalUrl]);

  return null;
};

export default SEOManager;
