import React, { useEffect } from 'react';
import { CIBlog } from '../types';

interface SEOHeadProps {
  article?: CIBlog | null;
  defaultTitle?: string;
  defaultDescription?: string;
}

/**
 * Programmatic SEO & OpenGraph Head Injector Component
 * Preserves 100% of legacy CodeIgniter DA by injecting exact database fields into document head:
 * meta_title, meta_description, meta_keyword, og_title, og_url, og_description, og_image
 */
export const SEOHead: React.FC<SEOHeadProps> = ({ article, defaultTitle, defaultDescription }) => {
  useEffect(() => {
    if (!article) {
      document.title = defaultTitle || "Global Gazette & Pageant Times - Headless Portal";
      return;
    }

    // 1. Set Document Title
    const title = article.meta_title || article.title;
    document.title = `${title} | Global Gazette`;

    // Helper function to update or create meta tag
    const updateMetaTag = (selector: string, attrName: string, attrVal: string, content: string) => {
      let element = document.querySelector(selector) as HTMLMetaElement | null;
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attrName, attrVal);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // 2. Standard Meta Tags
    updateMetaTag('meta[name="description"]', 'name', 'description', article.meta_description || article.short_content);
    updateMetaTag('meta[name="keywords"]', 'name', 'keywords', article.meta_keyword || 'news, pageant, fashion');
    updateMetaTag('meta[name="author"]', 'name', 'author', article.author_name || 'Global Gazette Editorial');

    // 3. OpenGraph Tags
    updateMetaTag('meta[property="og:title"]', 'property', 'og:title', article.og_title || article.title);
    updateMetaTag('meta[property="og:description"]', 'property', 'og:description', article.og_description || article.short_content);
    updateMetaTag('meta[property="og:url"]', 'property', 'og:url', article.og_url || window.location.href);
    updateMetaTag('meta[property="og:image"]', 'property', 'og:image', article.og_image || article.image);
    updateMetaTag('meta[property="og:type"]', 'property', 'og:type', 'article');
    updateMetaTag('meta[property="article:published_time"]', 'property', 'article:published_time', article.created_at);

    // 4. Twitter Card Tags
    updateMetaTag('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image');
    updateMetaTag('meta[name="twitter:title"]', 'name', 'twitter:title', article.og_title || article.title);
    updateMetaTag('meta[name="twitter:description"]', 'name', 'twitter:description', article.og_description || article.short_content);
    updateMetaTag('meta[name="twitter:image"]', 'name', 'twitter:image', article.og_image || article.image);

  }, [article, defaultTitle, defaultDescription]);

  return null; // Head elements managed directly via DOM manipulation for maximum compatibility
};

export default SEOHead;
